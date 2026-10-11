"""Packing lists for Home Assistant: a master list and trip lists built from it."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import CARD_URL, CONF_SEED_MASTER, DOMAIN, VERSION
from .manager import PackingListManager
from .services import async_register_services
from .websocket import async_register_websocket

PLATFORMS = [Platform.TODO, Platform.SENSOR]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

type PackingListConfigEntry = ConfigEntry[PackingListManager]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register services, websocket API and the bundled Lovelace card."""
    async_register_services(hass)
    async_register_websocket(hass)

    card_path = Path(__file__).parent / "frontend" / "packing-list-card.js"
    await hass.http.async_register_static_paths(
        [StaticPathConfig(CARD_URL, str(card_path), cache_headers=False)]
    )
    add_extra_js_url(hass, f"{CARD_URL}?v={VERSION}")
    return True


async def async_setup_entry(hass: HomeAssistant, entry: PackingListConfigEntry) -> bool:
    """Load packing list data and set up entities."""
    manager = PackingListManager(hass, entry.data.get(CONF_SEED_MASTER, False))
    await manager.async_load()
    entry.runtime_data = manager
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: PackingListConfigEntry) -> bool:
    """Unload a config entry, flushing pending writes."""
    await entry.runtime_data.async_flush()
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: PackingListConfigEntry) -> None:
    """Delete stored data when the integration is removed."""
    await PackingListManager(hass, False).store.async_remove()
