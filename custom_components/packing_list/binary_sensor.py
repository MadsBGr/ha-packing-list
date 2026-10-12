"""Binary sensors: is everything on a packing list packed?"""

from __future__ import annotations

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import PackingListConfigEntry
from .const import NAMES, SIGNAL_LIST_ADDED, UNIQUE_ID_LIST_PREFIX
from .manager import PackingListManager


async def async_setup_entry(
    hass: HomeAssistant,
    entry: PackingListConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Add a 'done' sensor for each trip list."""
    manager = entry.runtime_data
    async_add_entities(PackingDoneSensor(manager, list_id) for list_id in manager.lists)

    @callback
    def _list_added(list_id: str) -> None:
        async_add_entities([PackingDoneSensor(manager, list_id)])

    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_LIST_ADDED, _list_added))


class PackingDoneSensor(BinarySensorEntity):
    """On when everything on the list is packed (off for an empty list)."""

    _attr_should_poll = False

    def __init__(self, manager: PackingListManager, list_id: str) -> None:
        self._manager = manager
        self._list_id = list_id
        self._attr_unique_id = f"{UNIQUE_ID_LIST_PREFIX}{list_id}_done"

    async def async_added_to_hass(self) -> None:
        """Follow changes of the trip list."""
        self.async_on_remove(
            self._manager.async_add_listener(self._list_id, self.async_write_ha_state)
        )

    @property
    def name(self) -> str | None:
        """'<list name> done'; follows renames."""
        plist = self._manager.lists.get(self._list_id)
        return NAMES[self._manager.language]["done"].format(name=plist.name) if plist else None

    @property
    def icon(self) -> str:
        """A checked suitcase when done."""
        return "mdi:bag-checked" if self.is_on else "mdi:bag-suitcase-outline"

    @property
    def is_on(self) -> bool:
        """Everything is packed."""
        plist = self._manager.lists.get(self._list_id)
        return bool(plist and plist.done)
