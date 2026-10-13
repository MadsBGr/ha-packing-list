"""Websocket API used by the packing list card."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er

from .const import (
    CONF_DEFAULT_TAGS,
    CONF_INCLUDE_ALWAYS,
    CONF_PACKED_MODE,
    CONF_QUANTITY_CONTROLS,
    CONF_USE_WEIGHT,
    CONF_WEIGHT_LIMIT,
    DEFAULT_PACKED_MODE,
    DOMAIN,
    UNIQUE_ID_MASTER,
)
from .manager import PackingItem
from .services import get_manager, list_entity_id


@callback
def async_register_websocket(hass: HomeAssistant) -> None:
    """Register websocket commands."""
    websocket_api.async_register_command(hass, ws_get_data)


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/data"})
@callback
def ws_get_data(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Return the master list and all trip lists."""
    try:
        manager = get_manager(hass)
    except ServiceValidationError as err:
        connection.send_error(msg["id"], "not_loaded", str(err))
        return

    connection.send_result(
        msg["id"],
        {
            "master_entity_id": er.async_get(hass).async_get_entity_id(
                "todo", DOMAIN, UNIQUE_ID_MASTER
            ),
            "active_list_id": manager.active_list_id,
            # Defaults for new lists (Settings → Packing lists → Configure).
            "settings": {
                "include_always": manager.options.get(CONF_INCLUDE_ALWAYS, True),
                "use_weight": manager.options.get(CONF_USE_WEIGHT, False),
                "default_tags": manager.options.get(CONF_DEFAULT_TAGS, []),
                "weight_limit": (manager.options.get(CONF_WEIGHT_LIMIT) or 0) * 1000 or None,
                "quantity_controls": manager.options.get(CONF_QUANTITY_CONTROLS, False),
                "packed_mode": manager.options.get(CONF_PACKED_MODE, DEFAULT_PACKED_MODE),
            },
            "master": [item.as_dict() for item in manager.master],
            # Default items added in a newer release that the user hasn't added or skipped yet.
            "new_defaults": [
                PackingItem(uid="", summary=summary, description=desc).as_dict()
                for summary, desc in manager.pending_defaults()
            ],
            "lists": [
                {
                    "list_id": plist.list_id,
                    "name": plist.name,
                    "entity_id": list_entity_id(hass, plist.list_id),
                    "items": [item.as_dict() for item in plist.items],
                    "tags": plist.tags,
                    "categories": plist.categories,
                    "include_always": plist.include_always,
                    "excluded": plist.excluded,
                    "notes": plist.notes,
                    "use_weight": plist.use_weight,
                    "weight_limit": plist.weight_limit,
                    "quantity_controls": plist.quantity_controls,
                    "packed_mode": plist.packed_mode,
                    "archived": plist.archived,
                }
                for plist in manager.lists.values()
            ],
        },
    )
