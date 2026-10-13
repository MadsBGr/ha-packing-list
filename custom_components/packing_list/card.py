"""Serve the bundled Lovelace card and register it as a dashboard resource."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from .const import CARD_URL, VERSION

_LOGGER = logging.getLogger(__name__)


async def async_setup_frontend(hass: HomeAssistant) -> None:
    """Serve the card and make sure dashboards load it."""
    card_path = Path(__file__).parent / "frontend" / "packing-list-card.js"
    await hass.http.async_register_static_paths(
        [StaticPathConfig(CARD_URL, str(card_path), cache_headers=False)]
    )

    url = f"{CARD_URL}?v={VERSION}"
    if not await _async_register_resource(hass, url):
        # YAML-mode dashboards: resources can't be managed, fall back to extra JS.
        add_extra_js_url(hass, url)


def _resources(hass: HomeAssistant) -> Any | None:
    """Return the Lovelace resource collection if it is storage based."""
    lovelace = hass.data.get("lovelace")
    if lovelace is None:
        return None
    # The attribute was renamed from "mode" to "resource_mode" in Home Assistant 2025.
    mode = getattr(lovelace, "resource_mode", getattr(lovelace, "mode", None))
    resources = getattr(lovelace, "resources", None)
    if mode != "storage" or resources is None or not hasattr(resources, "async_create_item"):
        return None
    return resources


async def _async_register_resource(hass: HomeAssistant, url: str) -> bool:
    """Add or update the card's dashboard resource. Returns False if not possible."""
    resources = _resources(hass)
    if resources is None:
        return False
    try:
        if not getattr(resources, "loaded", True):
            await resources.async_load()
            resources.loaded = True

        existing = [
            item
            for item in resources.async_items()
            if item.get("url", "").split("?")[0] == CARD_URL
        ]
        if not existing:
            await resources.async_create_item({"res_type": "module", "url": url})
            _LOGGER.info("Registered dashboard resource %s", url)
            return True

        first, *duplicates = existing
        if first.get("url") != url or first.get("type") != "module":
            await resources.async_update_item(first["id"], {"res_type": "module", "url": url})
        for item in duplicates:
            await resources.async_delete_item(item["id"])
    except Exception:  # noqa: BLE001 - never break setup because of the card
        _LOGGER.exception("Could not register dashboard resource %s", url)
        return False
    return True
