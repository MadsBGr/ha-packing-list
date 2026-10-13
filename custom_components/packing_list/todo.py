"""To-do entities: the master list and one entity per trip list."""

from __future__ import annotations

from typing import Any

from homeassistant.components.todo import (
    TodoItem,
    TodoItemStatus,
    TodoListEntity,
    TodoListEntityFeature,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_connect, async_dispatcher_send
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import PackingListConfigEntry
from .const import (
    DOMAIN,
    MASTER_KEY,
    NAMES,
    SIGNAL_LIST_ADDED,
    SIGNAL_MASTER_REMOVED,
    UNIQUE_ID_LIST_PREFIX,
    UNIQUE_ID_MASTER,
    VERSION,
)
from .manager import PackingListManager
from .services import async_remove_list_entities


async def async_setup_entry(
    hass: HomeAssistant,
    entry: PackingListConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Add the master entity, existing trip lists and future trip lists."""
    manager = entry.runtime_data
    async_add_entities(
        [MasterTodoEntity(manager)]
        + [TripTodoEntity(manager, list_id) for list_id in manager.lists]
    )

    @callback
    def _list_added(list_id: str) -> None:
        async_add_entities([TripTodoEntity(manager, list_id)])

    @callback
    def _master_removed() -> None:
        # The integration can't work without its master entity: bring it back.
        async_add_entities([MasterTodoEntity(manager)])

    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_LIST_ADDED, _list_added))
    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_MASTER_REMOVED, _master_removed))


@callback
def _delete_list_and_sensor(hass: HomeAssistant, manager: PackingListManager, list_id: str) -> None:
    """Finish deleting a list whose to-do entity was removed outside the integration."""
    async_remove_list_entities(hass, list_id)
    manager.delete_list(list_id)


class _PackingTodoEntity(TodoListEntity):
    """Common logic for master and trip list entities."""

    _attr_should_poll = False
    _attr_supported_features = (
        TodoListEntityFeature.CREATE_TODO_ITEM
        | TodoListEntityFeature.UPDATE_TODO_ITEM
        | TodoListEntityFeature.DELETE_TODO_ITEM
        | TodoListEntityFeature.MOVE_TODO_ITEM
        | TodoListEntityFeature.SET_DESCRIPTION_ON_ITEM
    )

    def __init__(self, manager: PackingListManager, key: str) -> None:
        self._manager = manager
        self._key = key

    async def async_added_to_hass(self) -> None:
        """Follow changes in the manager."""
        self.async_on_remove(self._manager.async_add_listener(self._key, self._handle_change))

    def _deleted_outside_integration(self) -> bool:
        """True if the entity was deleted outside the integration (e.g. in the HA UI).

        Looked up by unique id, so a changed entity id or a disabled entity doesn't count,
        and neither does unloading the integration or stopping Home Assistant.
        """
        registry = er.async_get(self.hass)
        return registry.async_get_entity_id("todo", DOMAIN, self.unique_id) is None

    @callback
    def _handle_change(self) -> None:
        self.async_write_ha_state()
        # Push item changes to open to-do dialogs.
        self.async_update_listeners()

    @property
    def todo_items(self) -> list[TodoItem]:
        """Items as Home Assistant to-do items."""
        return [
            TodoItem(
                summary=item.summary,
                uid=item.uid,
                status=TodoItemStatus.COMPLETED if item.packed else TodoItemStatus.NEEDS_ACTION,
                description=item.description or None,
            )
            for item in self._manager.items_for(self._key)
        ]

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Attributes used by the card to detect changes."""
        return {
            "packing_list_id": self._key,
            "revision": self._manager.revision,
            "version": VERSION,
        }

    async def async_create_todo_item(self, item: TodoItem) -> None:
        """Add an item."""
        self._manager.create_item(
            self._key,
            item.summary or "",
            item.description or "",
            item.status == TodoItemStatus.COMPLETED,
        )

    async def async_update_todo_item(self, item: TodoItem) -> None:
        """Update an item."""
        self._manager.update_item(
            self._key,
            item.uid or "",
            item.summary or "",
            item.description or "",
            item.status == TodoItemStatus.COMPLETED,
        )

    async def async_delete_todo_items(self, uids: list[str]) -> None:
        """Delete items."""
        self._manager.delete_items(self._key, uids)

    async def async_move_todo_item(self, uid: str, previous_uid: str | None = None) -> None:
        """Reorder an item."""
        self._manager.move_item(self._key, uid, previous_uid)


class MasterTodoEntity(_PackingTodoEntity):
    """The master list with everything you might pack.

    Items here are never marked as done; checking one off is ignored so the
    'remove completed items' button can't wipe the master list.
    """

    _attr_icon = "mdi:format-list-checks"
    _attr_unique_id = UNIQUE_ID_MASTER

    def __init__(self, manager: PackingListManager) -> None:
        super().__init__(manager, MASTER_KEY)
        # The name follows the HA language; the entity id is the same in every language.
        # (Only used when the entity is first created; the registry keeps an existing id.)
        self._attr_name = NAMES[manager.language]["master"]
        self.entity_id = "todo.packing_list_master"

    async def async_will_remove_from_hass(self) -> None:
        """Recreate the master entity if it was deleted in the HA UI."""
        if self._deleted_outside_integration():
            self.hass.loop.call_soon(async_dispatcher_send, self.hass, SIGNAL_MASTER_REMOVED)


class TripTodoEntity(_PackingTodoEntity):
    """A packing list for a specific trip."""

    _attr_icon = "mdi:bag-suitcase"

    def __init__(self, manager: PackingListManager, list_id: str) -> None:
        super().__init__(manager, list_id)
        self._attr_unique_id = f"{UNIQUE_ID_LIST_PREFIX}{list_id}"

    @property
    def name(self) -> str | None:
        """The list's name; follows renames."""
        plist = self._manager.lists.get(self._key)
        return plist.name if plist else None

    async def async_will_remove_from_hass(self) -> None:
        """Delete the list if its entity was deleted in the HA UI."""
        if self._key in self._manager.lists and self._deleted_outside_integration():
            self.hass.loop.call_soon(_delete_list_and_sensor, self.hass, self._manager, self._key)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Add progress, notes and weight."""
        attrs = super().extra_state_attributes
        items = self._manager.items_for(self._key)
        plist = self._manager.lists.get(self._key)
        attrs["total"] = len(items)
        attrs["packed"] = sum(item.packed for item in items)
        attrs["archived"] = plist.archived if plist else False
        attrs["notes"] = plist.notes if plist else ""
        if plist and plist.use_weight:
            attrs["total_weight"] = plist.total_weight
            attrs["packed_weight"] = plist.packed_weight
            attrs["weight_limit"] = plist.weight_limit
            attrs["over_weight_limit"] = plist.over_weight_limit
        return attrs
