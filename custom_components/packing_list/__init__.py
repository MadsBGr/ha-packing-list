"""Packing lists for Home Assistant: a master list and trip lists built from it."""

from __future__ import annotations

from functools import partial

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import config_validation as cv, entity_registry as er
from homeassistant.helpers.typing import ConfigType

from .const import CONF_SEED_MASTER, DOMAIN, UNIQUE_ID_LIST_PREFIX
from .card import async_setup_frontend
from .manager import PackingListManager
from .services import async_register_services, async_update_defaults_notification
from .websocket import async_register_websocket

PLATFORMS = [Platform.TODO, Platform.SENSOR]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

type PackingListConfigEntry = ConfigEntry[PackingListManager]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register services, websocket API and the bundled Lovelace card."""
    async_register_services(hass)
    async_register_websocket(hass)
    await async_setup_frontend(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: PackingListConfigEntry) -> bool:
    """Load packing list data and set up entities."""
    manager = PackingListManager(hass, entry.data.get(CONF_SEED_MASTER, False))
    await manager.async_load()
    entry.runtime_data = manager
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(
        hass.bus.async_listen(
            er.EVENT_ENTITY_REGISTRY_UPDATED, partial(_registry_updated, hass, manager)
        )
    )
    async_update_defaults_notification(hass, manager)
    return True


@callback
def _registry_updated(
    hass: HomeAssistant, manager: PackingListManager, event: Event[er.EventEntityRegistryUpdatedData]
) -> None:
    """A list renamed in the HA UI takes that name, so the card and HA agree."""
    if event.data["action"] != "update" or "name" not in event.data.get("changes", {}):
        return
    registry = er.async_get(hass)
    entry = registry.async_get(event.data["entity_id"])
    if (
        entry is None
        or entry.platform != DOMAIN
        or entry.domain != "todo"
        or not entry.unique_id.startswith(UNIQUE_ID_LIST_PREFIX)
        or not entry.name
    ):
        return
    list_id = entry.unique_id.removeprefix(UNIQUE_ID_LIST_PREFIX)
    if list_id in manager.lists:
        manager.update_list(list_id, name=entry.name)
        # The list name now carries it; clear the override so later renames from the card show.
        registry.async_update_entity(entry.entity_id, name=None)


async def async_unload_entry(hass: HomeAssistant, entry: PackingListConfigEntry) -> bool:
    """Unload a config entry, flushing pending writes."""
    await entry.runtime_data.async_flush()
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: PackingListConfigEntry) -> None:
    """Delete stored data when the integration is removed."""
    await PackingListManager(hass, False).store.async_remove()
