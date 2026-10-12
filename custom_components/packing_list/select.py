"""Select entity: which packing list is the active one."""

from __future__ import annotations

from typing import Any

from homeassistant.components.select import SelectEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import PackingListConfigEntry
from .const import NAMES, UNIQUE_ID_ACTIVE
from .manager import ANY_KEY, PackingListManager
from .services import list_entity_id


async def async_setup_entry(
    hass: HomeAssistant,
    entry: PackingListConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Add the active list select."""
    async_add_entities([ActiveListSelect(entry.runtime_data)])


class ActiveListSelect(SelectEntity):
    """Choose the active packing list; automations, Assist and the card follow it.

    Options are the names of the lists that aren't archived.
    """

    _attr_should_poll = False
    _attr_icon = "mdi:bag-suitcase-outline"
    _attr_unique_id = UNIQUE_ID_ACTIVE

    def __init__(self, manager: PackingListManager) -> None:
        self._manager = manager
        self._attr_name = NAMES[manager.language]["active"]

    async def async_added_to_hass(self) -> None:
        """Follow every change (lists added, renamed, archived, active changed)."""
        self.async_on_remove(self._manager.async_add_listener(ANY_KEY, self.async_write_ha_state))

    def _labels(self) -> dict[str, str]:
        """list_id -> option label; equal names get a number so options stay unique."""
        labels: dict[str, str] = {}
        used: set[str] = set()
        for plist in self._manager.lists.values():
            if plist.archived:
                continue
            label, number = plist.name, 2
            while label in used:
                label, number = f"{plist.name} ({number})", number + 1
            used.add(label)
            labels[plist.list_id] = label
        return labels

    @property
    def options(self) -> list[str]:
        """Names of the lists that aren't archived."""
        return list(self._labels().values())

    @property
    def current_option(self) -> str | None:
        """Name of the active list, if any."""
        return self._labels().get(self._manager.active_list_id or "")

    async def async_select_option(self, option: str) -> None:
        """Make the list with this name active."""
        list_id = next(lid for lid, label in self._labels().items() if label == option)
        self._manager.set_active_list(list_id)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """The active list's to-do entity, for templates and automations.

        packing_list_id/revision let the card notice when the active list changes.
        """
        list_id = self._manager.active_list_id
        return {
            "entity_id": list_entity_id(self.hass, list_id) if list_id else None,
            "packing_list_id": "active",
            "revision": self._manager.revision,
        }
