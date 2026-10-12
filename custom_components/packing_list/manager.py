"""Data model, persistence and business logic for packing lists."""

from __future__ import annotations

from collections.abc import Callable, Iterable
from dataclasses import asdict, dataclass, field, fields
import re
from typing import Any
import uuid

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from .const import (
    ALWAYS_TAGS,
    MASTER_KEY,
    SEED_ITEMS_DA,
    SEED_ITEMS_EN,
    STORAGE_KEY,
    STORAGE_VERSION,
    language,
)

_TAG_RE = re.compile(r"(?<!\S)#([^\s#@]+)")
_CATEGORY_RE = re.compile(r"(?<!\S)@([^\s#@]+)")

SAVE_DELAY = 1

# Default for optional arguments where None means "clear the value".
KEEP: Any = object()


class DuplicateItemError(ValueError):
    """An item with the same name already exists in that category."""


class AmbiguousItemError(KeyError):
    """Several master items have that name (in different categories)."""


def normalize_tag(tag: str) -> str:
    """Normalize a tag: strip whitespace and a leading '#', lowercase."""
    return tag.strip().lstrip("#").strip().lower()


def parse_description(description: str) -> tuple[str | None, list[str], str]:
    """Split a description into (category, tags, free-text notes).

    Category is written as ``@Kategori`` (underscores become spaces) and
    tags as ``#tag``. Everything else is kept as notes.
    """
    match = _CATEGORY_RE.search(description)
    category = match.group(1).replace("_", " ") if match else None
    tags = list(dict.fromkeys(normalize_tag(t) for t in _TAG_RE.findall(description)))
    notes = " ".join(_CATEGORY_RE.sub("", _TAG_RE.sub("", description)).split())
    return category, tags, notes


def build_description(category: str | None, tags: Iterable[str], notes: str = "") -> str:
    """Inverse of parse_description."""
    parts = []
    if category and category.strip():
        parts.append("@" + "_".join(category.split()))
    parts.extend(f"#{tag}" for tag in dict.fromkeys(map(normalize_tag, tags)) if tag)
    if notes.strip():
        parts.append(notes.strip())
    return " ".join(parts)


def _same_category(a: str | None, b: str | None) -> bool:
    return (a or "").strip().casefold() == (b or "").strip().casefold()


def item_key(summary: str, category: str | None) -> tuple[str, str]:
    """What makes an item unique: the same name may exist once per category."""
    return summary.strip().casefold(), (category or "").strip().casefold()


def _clean_quantity(value: int | None) -> int | None:
    return int(value) if value is not None and int(value) > 0 else None


def _clean_weight(value: float | None) -> float | None:
    if value is None or float(value) <= 0:
        return None
    value = float(value)
    return int(value) if value.is_integer() else value


def _from_dict(cls: type, data: dict[str, Any]) -> Any:
    """Build a dataclass from stored data, ignoring unknown keys."""
    names = {f.name for f in fields(cls)}
    return cls(**{key: value for key, value in data.items() if key in names})


def _new_uid() -> str:
    return uuid.uuid4().hex


def _seed_items(lang: str) -> list[PackingItem]:
    """The default master list in the given language (Danish or English)."""
    return [
        PackingItem(uid=_new_uid(), summary=summary, description=desc)
        for summary, desc in (SEED_ITEMS_DA if lang == "da" else SEED_ITEMS_EN)
    ]


@dataclass
class PackingItem:
    """An item on the master list or on a trip list."""

    uid: str
    summary: str
    description: str = ""
    packed: bool = False
    master_uid: str | None = None
    # Optional number of pieces and weight per piece in grams.
    quantity: int | None = None
    weight: float | None = None

    @property
    def category(self) -> str | None:
        """Category parsed from the description."""
        return parse_description(self.description)[0]

    @property
    def key(self) -> tuple[str, str]:
        """Name and category; unique within a list."""
        return item_key(self.summary, self.category)

    @property
    def total_weight(self) -> float:
        """Weight of all pieces in grams (0 if no weight is set)."""
        return (self.weight or 0) * (self.quantity or 1)

    @property
    def tags(self) -> list[str]:
        """Tags parsed from the description."""
        return parse_description(self.description)[1]

    def as_dict(self) -> dict[str, Any]:
        """Representation for the websocket API / card."""
        category, tags, notes = parse_description(self.description)
        return {
            **asdict(self),
            "category": category,
            "tags": tags,
            "notes": notes,
        }


@dataclass
class PackingList:
    """A trip-specific packing list."""

    list_id: str
    name: str
    trip_date: str | None = None
    items: list[PackingItem] = field(default_factory=list)
    # The tags/categories the list was filled with, used by "fetch again".
    tags: list[str] = field(default_factory=list)
    categories: list[str] = field(default_factory=list)
    include_always: bool = False
    # Master uids removed from the list; never re-added automatically.
    excluded: list[str] = field(default_factory=list)
    notes: str = ""
    use_weight: bool = False
    archived: bool = False

    @property
    def total_weight(self) -> float:
        """Weight of everything on the list in grams."""
        return sum(item.total_weight for item in self.items)

    @property
    def packed_weight(self) -> float:
        """Weight of what is packed in grams."""
        return sum(item.total_weight for item in self.items if item.packed)


class PackingListManager:
    """Owns all packing list data and notifies entities about changes."""

    def __init__(self, hass: HomeAssistant, seed_master: bool) -> None:
        self.hass = hass
        self.store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._seed_master = seed_master
        self.master: list[PackingItem] = []
        self.lists: dict[str, PackingList] = {}
        self.revision = 0
        self._listeners: dict[str, list[Callable[[], None]]] = {}

    @property
    def language(self) -> str:
        """Current Home Assistant language, as "da" or "en"."""
        return language(getattr(getattr(self.hass, "config", None), "language", None))

    async def async_load(self) -> None:
        """Load data from storage.

        The default master list is only created when nothing is stored yet,
        i.e. on the very first installation. Updates never touch stored data.
        """
        data = await self.store.async_load()
        if data is None:
            if self._seed_master:
                self.master = _seed_items(self.language)
            self._schedule_save()
            return
        self.master = [_from_dict(PackingItem, item) for item in data.get("master", [])]
        for raw in data.get("lists", []):
            items = [_from_dict(PackingItem, i) for i in raw.get("items", [])]
            plist = _from_dict(PackingList, {**raw, "items": items})
            self.lists[plist.list_id] = plist

    def _data_to_save(self) -> dict[str, Any]:
        return {
            "master": [asdict(item) for item in self.master],
            "lists": [asdict(plist) for plist in self.lists.values()],
        }

    def _schedule_save(self) -> None:
        self.store.async_delay_save(self._data_to_save, SAVE_DELAY)

    async def async_flush(self) -> None:
        """Write pending changes to disk immediately."""
        await self.store.async_save(self._data_to_save())

    # ----------------------------------------------------------- listeners

    @callback
    def async_add_listener(self, key: str, listener: Callable[[], None]) -> Callable[[], None]:
        """Listen for changes of the master list or one trip list."""
        self._listeners.setdefault(key, []).append(listener)

        @callback
        def remove() -> None:
            self._listeners[key].remove(listener)

        return remove

    @callback
    def _changed(self, key: str) -> None:
        self.revision += 1
        self._schedule_save()
        for listener in list(self._listeners.get(key, [])):
            listener()

    # --------------------------------------------------------------- items

    def items_for(self, key: str) -> list[PackingItem]:
        """Items of the master list or a trip list (empty if it is gone)."""
        if key == MASTER_KEY:
            return self.master
        plist = self.lists.get(key)
        return plist.items if plist else []

    def _find(self, key: str, uid: str) -> PackingItem:
        for item in self.items_for(key):
            if item.uid == uid:
                return item
        raise KeyError(uid)

    def find_master(self, ref: str) -> PackingItem:
        """Find a master item by uid or (case-insensitive) name.

        Raises KeyError if there is none and AmbiguousItemError if the name
        exists in several categories.
        """
        for item in self.master:
            if item.uid == ref:
                return item
        key = ref.strip().casefold()
        matches = [item for item in self.master if item.summary.casefold() == key]
        if len(matches) > 1:
            raise AmbiguousItemError(ref)
        if not matches:
            raise KeyError(ref)
        return matches[0]

    def master_by_key(self, summary: str, category: str | None) -> PackingItem | None:
        """The master item with this name in this category, if any."""
        key = item_key(summary, category)
        return next((item for item in self.master if item.key == key), None)

    @callback
    def create_item(
        self, key: str, summary: str, description: str = "", packed: bool = False
    ) -> PackingItem:
        """Add a new item to the master list or a trip list."""
        item = PackingItem(
            uid=_new_uid(),
            summary=summary.strip(),
            description=description.strip(),
            packed=packed and key != MASTER_KEY,
        )
        self.items_for(key).append(item)
        self._changed(key)
        return item

    @callback
    def add_master_items(
        self,
        summaries: Iterable[str],
        category: str | None = None,
        tags: Iterable[str] = (),
        move: Iterable[str] = (),
        duplicate: Iterable[str] = (),
    ) -> dict[str, int]:
        """Add several items to the master list sharing category and tags.

        A name may exist once per category. If the name already exists in
        ``category`` that item gets the new tags. If it only exists in other
        categories it is created anew in ``category`` if its name is in
        ``duplicate``, moved there if its name is in ``move``, and otherwise
        the existing item just gets the new tags. Returns counts of added,
        moved, tagged (got new tags) and skipped (unchanged) items.
        """
        tags = [tag for tag in dict.fromkeys(map(normalize_tag, tags)) if tag]
        move_keys = {name.strip().casefold() for name in move}
        duplicate_keys = {name.strip().casefold() for name in duplicate}
        has_category = bool(category and category.strip())
        counts = {"added": 0, "moved": 0, "tagged": 0, "skipped": 0}
        seen: set[str] = set()
        new_items = []

        for summary in summaries:
            summary = summary.strip()
            key = summary.casefold()
            if not summary or key in seen:
                continue
            seen.add(key)
            same_name = [item for item in self.master if item.summary.casefold() == key]
            existing = self.master_by_key(summary, category)
            if not same_name or (
                existing is None and has_category and key in duplicate_keys
            ):
                new_items.append(
                    PackingItem(
                        uid=_new_uid(),
                        summary=summary,
                        description=build_description(category, tags),
                    )
                )
                counts["added"] += 1
                continue

            moved = existing is None and has_category and key in move_keys
            existing = existing or same_name[0]
            old_category, old_tags, _ = parse_description(existing.description)
            extra_tags = [tag for tag in tags if tag not in old_tags]
            if not moved and not extra_tags:
                counts["skipped"] += 1
                continue
            self._set_master_meta(
                existing,
                category=category if moved else old_category,
                tags=[*old_tags, *extra_tags],
            )
            counts["moved" if moved else "tagged"] += 1

        self.master.extend(new_items)
        if new_items or counts["moved"] or counts["tagged"]:
            self._changed(MASTER_KEY)
        return counts

    def _set_master_meta(
        self,
        item: PackingItem,
        *,
        category: str | None,
        tags: Iterable[str],
        weight: float | None = KEEP,
    ) -> None:
        """Set category/tags (and weight) of a master item and of its copies on trip lists."""
        tags = list(tags)
        item.description = build_description(category, tags, parse_description(item.description)[2])
        if weight is not KEEP:
            item.weight = weight
        for plist in self.lists.values():
            touched = False
            for list_item in plist.items:
                if list_item.master_uid == item.uid:
                    notes = parse_description(list_item.description)[2]
                    list_item.description = build_description(category, tags, notes)
                    if weight is not KEEP:
                        list_item.weight = weight
                    touched = True
            if touched:
                self._changed(plist.list_id)

    @callback
    def update_master_item(
        self,
        uid: str,
        *,
        summary: str | None = None,
        category: str | None = None,
        tags: Iterable[str] | None = None,
        quantity: int | None = KEEP,
        weight: float | None = KEEP,
    ) -> None:
        """Rename an item and/or change its category, tags, quantity and weight.

        ``None`` keeps the current name, category and tags; an empty category
        removes it. For quantity and weight ``None`` clears the value and
        leaving them out keeps it. Category, tag and weight changes are also
        applied to copies on trip lists; the quantity is only the default for
        new copies. Raises DuplicateItemError if another item already has the
        new name in the new category.
        """
        item = self._find(MASTER_KEY, uid)
        old_category, old_tags, _ = parse_description(item.description)
        new_summary = summary.strip() if summary and summary.strip() else item.summary
        new_category = old_category if category is None else category
        other = self.master_by_key(new_summary, new_category)
        if other is not None and other is not item:
            raise DuplicateItemError(new_summary)
        item.summary = new_summary
        if quantity is not KEEP:
            item.quantity = _clean_quantity(quantity)
        self._set_master_meta(
            item,
            category=new_category,
            tags=old_tags if tags is None else tags,
            weight=weight if weight is KEEP else _clean_weight(weight),
        )
        self._changed(MASTER_KEY)

    @callback
    def reset_master(self) -> None:
        """Replace the master list with the default (seed) list.

        Trip lists keep their items; their links to the master are re-made by
        name, so items that also exist in the default list stay connected.
        """
        old_keys = {item.uid: item.key for item in self.master}
        self.master = _seed_items(self.language)
        by_key = {item.key: item.uid for item in self.master}
        by_name: dict[str, str] = {}
        for item in self.master:
            by_name.setdefault(item.key[0], item.uid)

        def relink(key: tuple[str, str]) -> str | None:
            # Same name and category, else just the same name.
            return by_key.get(key) or by_name.get(key[0])

        for plist in self.lists.values():
            for list_item in plist.items:
                list_item.master_uid = relink(list_item.key)
            plist.excluded = [
                new_uid
                for uid in plist.excluded
                if uid in old_keys and (new_uid := relink(old_keys[uid]))
            ]
            self._changed(plist.list_id)
        self._changed(MASTER_KEY)

    @callback
    def update_item(
        self, key: str, uid: str, summary: str, description: str, packed: bool
    ) -> None:
        """Update an item. The master list never stores a packed state."""
        item = self._find(key, uid)
        item.summary = summary.strip()
        item.description = description.strip()
        item.packed = packed and key != MASTER_KEY
        self._changed(key)

    @callback
    def delete_items(self, key: str, uids: Iterable[str]) -> None:
        """Delete items by uid.

        On a trip list the master items behind deleted items are remembered,
        so "fetch again" won't bring them back.
        """
        remove = set(uids)
        items = self.items_for(key)
        if plist := self.lists.get(key):
            removed_master = [i.master_uid for i in items if i.uid in remove and i.master_uid]
            plist.excluded = list(dict.fromkeys([*plist.excluded, *removed_master]))
        items[:] = [item for item in items if item.uid not in remove]
        self._changed(key)

    @callback
    def move_item(self, key: str, uid: str, previous_uid: str | None) -> None:
        """Move an item to just after previous_uid (or first if None)."""
        items = self.items_for(key)
        item = self._find(key, uid)
        items.remove(item)
        index = 0
        if previous_uid is not None:
            index = items.index(self._find(key, previous_uid)) + 1
        items.insert(index, item)
        self._changed(key)

    # --------------------------------------------------------------- lists

    @callback
    def create_list(
        self,
        name: str,
        trip_date: str | None = None,
        *,
        use_weight: bool = False,
        notes: str = "",
    ) -> PackingList:
        """Create an empty trip list."""
        plist = PackingList(
            list_id=_new_uid(),
            name=name.strip(),
            trip_date=trip_date,
            use_weight=use_weight,
            notes=notes.strip(),
        )
        self.lists[plist.list_id] = plist
        self._changed(plist.list_id)
        return plist

    @callback
    def update_list(
        self,
        list_id: str,
        *,
        trip_date: str | None = KEEP,
        notes: str | None = None,
        use_weight: bool | None = None,
        archived: bool | None = None,
    ) -> None:
        """Change a trip list's date, notes, weight setting or archived state.

        ``None`` keeps a value; for ``trip_date`` ``None`` clears it.
        """
        plist = self.lists[list_id]
        if trip_date is not KEEP:
            plist.trip_date = trip_date
        if notes is not None:
            plist.notes = notes.strip()
        if use_weight is not None:
            plist.use_weight = use_weight
        if archived is not None:
            plist.archived = archived
        self._changed(list_id)

    @callback
    def update_list_item(
        self,
        list_id: str,
        uid: str,
        *,
        quantity: int | None = KEEP,
        weight: float | None = KEEP,
        to_master: bool = False,
    ) -> None:
        """Set the quantity and/or weight of a trip list item (``None`` clears).

        With ``to_master`` a new weight is also saved on the linked master
        item, and from there on every list that has it.
        """
        item = self._find(list_id, uid)
        if quantity is not KEEP:
            item.quantity = _clean_quantity(quantity)
        if weight is not KEEP:
            item.weight = _clean_weight(weight)
            master_item = next((m for m in self.master if m.uid == item.master_uid), None)
            if to_master and master_item is not None:
                category, tags, _ = parse_description(master_item.description)
                self._set_master_meta(master_item, category=category, tags=tags, weight=item.weight)
                self._changed(MASTER_KEY)
        self._changed(list_id)

    @callback
    def delete_list(self, list_id: str) -> None:
        """Delete a trip list."""
        self.lists.pop(list_id)
        self._changed(list_id)

    @callback
    def reset_list(self, list_id: str) -> None:
        """Mark every item on a trip list as not packed."""
        for item in self.lists[list_id].items:
            item.packed = False
        self._changed(list_id)

    @callback
    def add_from_master(
        self,
        list_id: str,
        *,
        items: Iterable[str] = (),
        tags: Iterable[str] = (),
        categories: Iterable[str] = (),
        include_always: bool = False,
        include_excluded: bool = False,
    ) -> int:
        """Copy matching master items to a trip list, skipping duplicates.

        A master item matches if its uid or summary is in ``items``, it has
        one of ``tags``, or its category is in ``categories``. Items picked
        explicitly via ``items`` are always added (and no longer excluded);
        items matched by tag or category skip those deleted from the list
        before, unless ``include_excluded`` is set. The tags and categories
        are remembered for refresh_list. Returns the number of items added.
        """
        plist = self.lists[list_id]
        wanted_refs = {ref.strip().casefold() for ref in items}
        wanted_tags = {normalize_tag(tag) for tag in tags} - {""}
        wanted_categories = {cat.strip().replace("_", " ") for cat in categories} - {""}

        plist.tags = list(dict.fromkeys([*plist.tags, *sorted(wanted_tags)]))
        plist.categories = list(dict.fromkeys([*plist.categories, *sorted(wanted_categories)]))
        plist.include_always = plist.include_always or include_always
        if include_always:
            wanted_tags.update(ALWAYS_TAGS)
        wanted_categories = {cat.casefold() for cat in wanted_categories}

        have_master = {item.master_uid for item in plist.items if item.master_uid}
        have_keys = {item.key for item in plist.items}
        excluded = set(plist.excluded)

        added = 0
        for master_item in self.master:
            summary_key = master_item.summary.casefold()
            category, item_tags, _ = parse_description(master_item.description)
            key = item_key(master_item.summary, category)
            if master_item.uid in have_master or key in have_keys:
                continue
            explicit = master_item.uid in wanted_refs or summary_key in wanted_refs
            matched = wanted_tags.intersection(item_tags) or (
                category is not None and category.casefold() in wanted_categories
            )
            if not explicit and not matched:
                continue
            if master_item.uid in excluded:
                if not explicit and not include_excluded:
                    continue
                excluded.discard(master_item.uid)
            plist.items.append(
                PackingItem(
                    uid=_new_uid(),
                    summary=master_item.summary,
                    description=master_item.description,
                    master_uid=master_item.uid,
                    quantity=master_item.quantity,
                    weight=master_item.weight,
                )
            )
            have_master.add(master_item.uid)
            have_keys.add(key)
            added += 1

        plist.excluded = [uid for uid in plist.excluded if uid in excluded]
        # Always announce: the remembered selection may have changed even if nothing was added.
        self._changed(list_id)
        return added

    @callback
    def refresh_list(self, list_id: str, include_excluded: bool = False) -> int:
        """Fetch new master items matching the list's remembered tags/categories."""
        plist = self.lists[list_id]
        return self.add_from_master(
            list_id,
            tags=plist.tags,
            categories=plist.categories,
            include_always=plist.include_always,
            include_excluded=include_excluded,
        )

    @callback
    def add_list_item(
        self,
        list_id: str,
        summary: str,
        *,
        category: str | None = None,
        tags: Iterable[str] = (),
        quantity: int | None = None,
        weight: float | None = None,
        to_master: bool = False,
    ) -> PackingItem:
        """Add an item to a trip list, optionally also saving it on the master list."""
        item = PackingItem(
            uid=_new_uid(),
            summary=summary.strip(),
            description=build_description(category, tags),
            quantity=_clean_quantity(quantity),
            weight=_clean_weight(weight),
        )
        self.lists[list_id].items.append(item)
        self._changed(list_id)
        if to_master:
            self.copy_to_master(list_id, item.uid)
        return item

    @callback
    def copy_to_master(
        self,
        list_id: str,
        uid: str,
        *,
        category: str | None = None,
        tags: Iterable[str] | None = None,
    ) -> PackingItem:
        """Save a trip list item on the master list and link the two.

        ``category``/``tags`` default to the list item's own. If the name
        already exists in that category on the master list, that item gets the
        new tags (and the weight if it has none) instead of a duplicate being
        created. The same name in another category is a separate item.
        """
        plist = self.lists[list_id]
        list_item = self._find(list_id, uid)
        own_category, own_tags, notes = parse_description(list_item.description)
        category = own_category if category is None else category
        tags = own_tags if tags is None else [normalize_tag(t) for t in tags]

        master_item = self.master_by_key(list_item.summary, category)
        if master_item is None:
            master_item = PackingItem(
                uid=_new_uid(),
                summary=list_item.summary,
                description=build_description(category, tags),
                quantity=list_item.quantity,
                weight=list_item.weight,
            )
            self.master.append(master_item)
        else:
            old_category, old_tags, _ = parse_description(master_item.description)
            self._set_master_meta(
                master_item,
                category=old_category,
                tags=[*old_tags, *(t for t in tags if t not in old_tags)],
                weight=(
                    list_item.weight
                    if master_item.weight is None and list_item.weight is not None
                    else KEEP
                ),
            )

        master_category, master_tags, _ = parse_description(master_item.description)
        list_item.master_uid = master_item.uid
        list_item.description = build_description(master_category, master_tags, notes)
        plist.excluded = [u for u in plist.excluded if u != master_item.uid]
        self._changed(MASTER_KEY)
        self._changed(list_id)
        return master_item
