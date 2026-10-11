"""Data model, persistence and business logic for packing lists."""

from __future__ import annotations

from collections.abc import Callable, Iterable
from dataclasses import asdict, dataclass, field
import re
from typing import Any
import uuid

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store

from .const import ALWAYS_TAG, MASTER_KEY, SEED_ITEMS, STORAGE_KEY, STORAGE_VERSION

_TAG_RE = re.compile(r"(?<!\S)#([^\s#@]+)")
_CATEGORY_RE = re.compile(r"(?<!\S)@([^\s#@]+)")

SAVE_DELAY = 1


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


def _new_uid() -> str:
    return uuid.uuid4().hex


@dataclass
class PackingItem:
    """An item on the master list or on a trip list."""

    uid: str
    summary: str
    description: str = ""
    packed: bool = False
    master_uid: str | None = None

    @property
    def category(self) -> str | None:
        """Category parsed from the description."""
        return parse_description(self.description)[0]

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


@dataclass
class PackingTemplate:
    """A named selection of master items to start new lists from."""

    template_id: str
    name: str
    items: list[str] = field(default_factory=list)  # master item uids


class PackingListManager:
    """Owns all packing list data and notifies entities about changes."""

    def __init__(self, hass: HomeAssistant, seed_master: bool) -> None:
        self.hass = hass
        self.store: Store[dict[str, Any]] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._seed_master = seed_master
        self.master: list[PackingItem] = []
        self.lists: dict[str, PackingList] = {}
        self.templates: dict[str, PackingTemplate] = {}
        self.revision = 0
        self._listeners: dict[str, list[Callable[[], None]]] = {}

    async def async_load(self) -> None:
        """Load data from storage, seeding the master list on first run."""
        data = await self.store.async_load()
        if data is None:
            if self._seed_master:
                self.master = [
                    PackingItem(uid=_new_uid(), summary=summary, description=desc)
                    for summary, desc in SEED_ITEMS
                ]
            self._schedule_save()
            return
        self.master = [PackingItem(**item) for item in data.get("master", [])]
        for raw in data.get("lists", []):
            items = [PackingItem(**item) for item in raw.get("items", [])]
            plist = PackingList(
                list_id=raw["list_id"],
                name=raw["name"],
                trip_date=raw.get("trip_date"),
                items=items,
            )
            self.lists[plist.list_id] = plist
        for raw in data.get("templates", []):
            template = PackingTemplate(**raw)
            self.templates[template.template_id] = template

    def _data_to_save(self) -> dict[str, Any]:
        return {
            "master": [asdict(item) for item in self.master],
            "lists": [asdict(plist) for plist in self.lists.values()],
            "templates": [asdict(template) for template in self.templates.values()],
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
        self, summaries: Iterable[str], category: str | None = None, tags: Iterable[str] = ()
    ) -> int:
        """Add several items to the master list sharing category and tags.

        Items whose name already exists on the master list are skipped.
        Returns the number of items added.
        """
        parts = []
        if category and category.strip():
            parts.append("@" + "_".join(category.split()))
        parts.extend(f"#{tag}" for tag in dict.fromkeys(map(normalize_tag, tags)) if tag)
        description = " ".join(parts)

        have = {item.summary.casefold() for item in self.master}
        added = 0
        for summary in summaries:
            summary = summary.strip()
            if not summary or summary.casefold() in have:
                continue
            self.master.append(PackingItem(uid=_new_uid(), summary=summary, description=description))
            have.add(summary.casefold())
            added += 1
        if added:
            self._changed(MASTER_KEY)
        return added

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
        """Delete items by uid."""
        remove = set(uids)
        items = self.items_for(key)
        items[:] = [item for item in items if item.uid not in remove]
        if key == MASTER_KEY:
            for template in self.templates.values():
                template.items = [uid for uid in template.items if uid not in remove]
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
    def create_list(self, name: str, trip_date: str | None = None) -> PackingList:
        """Create an empty trip list."""
        plist = PackingList(list_id=_new_uid(), name=name.strip(), trip_date=trip_date)
        self.lists[plist.list_id] = plist
        self._changed(plist.list_id)
        return plist

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

    def select_master(
        self,
        *,
        items: Iterable[str] = (),
        tags: Iterable[str] = (),
        categories: Iterable[str] = (),
        include_always: bool = False,
        templates: Iterable[str] = (),
    ) -> list[PackingItem]:
        """Master items matching any of the criteria, in master order.

        A master item matches if its uid or summary is in ``items``, it has
        one of ``tags``, its category is in ``categories`` or it is part of
        one of ``templates`` (template ids).
        """
        wanted_refs = {ref.strip().casefold() for ref in items}
        for template_id in templates:
            wanted_refs.update(self.templates[template_id].items)
        wanted_tags = {normalize_tag(tag) for tag in tags}
        if include_always:
            wanted_tags.add(ALWAYS_TAG)
        wanted_categories = {cat.strip().replace("_", " ").casefold() for cat in categories}

        selected = []
        for master_item in self.master:
            category, item_tags, _ = parse_description(master_item.description)
            if (
                master_item.uid in wanted_refs
                or master_item.summary.casefold() in wanted_refs
                or wanted_tags.intersection(item_tags)
                or (category is not None and category.casefold() in wanted_categories)
            ):
                selected.append(master_item)
        return selected

    @callback
    def add_from_master(
        self,
        list_id: str,
        *,
        items: Iterable[str] = (),
        tags: Iterable[str] = (),
        categories: Iterable[str] = (),
        include_always: bool = False,
        templates: Iterable[str] = (),
    ) -> int:
        """Copy matching master items to a trip list, skipping duplicates.

        See select_master for the matching rules. Returns the number of
        items added.
        """
        plist = self.lists[list_id]
        have_master = {item.master_uid for item in plist.items if item.master_uid}
        have_summary = {item.summary.casefold() for item in plist.items}

        added = 0
        for master_item in self.select_master(
            items=items,
            tags=tags,
            categories=categories,
            include_always=include_always,
            templates=templates,
        ):
            summary_key = master_item.summary.casefold()
            if master_item.uid in have_master or summary_key in have_summary:
                continue
            plist.items.append(
                PackingItem(
                    uid=_new_uid(),
                    summary=master_item.summary,
                    description=master_item.description,
                    master_uid=master_item.uid,
                )
            )
            have_master.add(master_item.uid)
            have_summary.add(summary_key)
            added += 1

        if added:
            self._changed(list_id)
        return added

    # ----------------------------------------------------------- templates
    # Template changes are announced on the master key, so the card (which
    # watches entity revisions) refreshes.

    def find_template(self, ref: str) -> PackingTemplate:
        """Find a template by id or (case-insensitive) name."""
        if ref in self.templates:
            return self.templates[ref]
        for template in self.templates.values():
            if template.name.casefold() == ref.strip().casefold():
                return template
        raise KeyError(ref)

    def _check_template_name(self, name: str, template_id: str | None = None) -> str:
        name = name.strip()
        if not name:
            raise ValueError("Skabelonen skal have et navn")
        for template in self.templates.values():
            if template.template_id != template_id and template.name.casefold() == name.casefold():
                raise ValueError(f"Der findes allerede en skabelon med navnet {name}")
        return name

    @callback
    def create_template(self, name: str, item_uids: Iterable[str] = ()) -> PackingTemplate:
        """Create a template from master item uids."""
        template = PackingTemplate(
            template_id=_new_uid(),
            name=self._check_template_name(name),
            items=list(dict.fromkeys(item_uids)),
        )
        self.templates[template.template_id] = template
        self._changed(MASTER_KEY)
        return template

    @callback
    def update_template(
        self,
        template_id: str,
        *,
        name: str | None = None,
        add: Iterable[str] = (),
        remove: Iterable[str] = (),
    ) -> None:
        """Rename a template and/or add and remove master item uids."""
        template = self.templates[template_id]
        if name is not None:
            template.name = self._check_template_name(name, template_id)
        removed = set(remove)
        template.items = [
            uid for uid in dict.fromkeys([*template.items, *add]) if uid not in removed
        ]
        self._changed(MASTER_KEY)

    @callback
    def delete_template(self, template_id: str) -> None:
        """Delete a template."""
        self.templates.pop(template_id)
        self._changed(MASTER_KEY)
