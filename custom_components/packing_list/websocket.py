"""Websocket API used by the packing list card."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er

from .const import DOMAIN, UNIQUE_ID_MASTER
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
            "master": [item.as_dict() for item in manager.master],
            "lists": [
                {
                    "list_id": plist.list_id,
                    "name": plist.name,
                    "trip_date": plist.trip_date,
                    "entity_id": list_entity_id(hass, plist.list_id),
                    "items": [item.as_dict() for item in plist.items],
                }
                for plist in manager.lists.values()
            ],
            "templates": [
                {"template_id": t.template_id, "name": t.name, "items": t.items}
                for t in sorted(manager.templates.values(), key=lambda t: t.name.casefold())
            ],
        },
    )
