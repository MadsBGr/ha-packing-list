"""Progress sensors: percentage packed per trip list."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorEntity, SensorStateClass
from homeassistant.const import PERCENTAGE
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
    """Add a progress sensor for each trip list."""
    manager = entry.runtime_data
    async_add_entities(PackingProgressSensor(manager, list_id) for list_id in manager.lists)

    @callback
    def _list_added(list_id: str) -> None:
        async_add_entities([PackingProgressSensor(manager, list_id)])

    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_LIST_ADDED, _list_added))


class PackingProgressSensor(SensorEntity):
    """How much of a trip list is packed, in percent."""

    _attr_should_poll = False
    _attr_icon = "mdi:bag-suitcase-outline"
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, manager: PackingListManager, list_id: str) -> None:
        self._manager = manager
        self._list_id = list_id
        self._attr_unique_id = f"{UNIQUE_ID_LIST_PREFIX}{list_id}_progress"
        self._attr_name = NAMES[manager.language]["progress"].format(name=manager.lists[list_id].name)

    async def async_added_to_hass(self) -> None:
        """Follow changes of the trip list."""
        self.async_on_remove(
            self._manager.async_add_listener(self._list_id, self.async_write_ha_state)
        )

    @property
    def native_value(self) -> int:
        """Percentage of items packed (0 for an empty list)."""
        items = self._manager.items_for(self._list_id)
        if not items:
            return 0
        return round(100 * sum(item.packed for item in items) / len(items))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Counts behind the percentage."""
        items = self._manager.items_for(self._list_id)
        packed = sum(item.packed for item in items)
        attrs: dict[str, Any] = {"packed": packed, "total": len(items), "remaining": len(items) - packed}
        plist = self._manager.lists.get(self._list_id)
        if plist and plist.use_weight:
            attrs["total_weight"] = plist.total_weight
            attrs["packed_weight"] = plist.packed_weight
        return attrs
