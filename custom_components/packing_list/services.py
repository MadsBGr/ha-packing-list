"""Services for creating and filling packing lists."""

from __future__ import annotations

import asyncio
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import ATTR_ENTITY_ID, ATTR_NAME
from homeassistant.core import (
    HomeAssistant,
    ServiceCall,
    ServiceResponse,
    SupportsResponse,
    callback,
)
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv, entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_send

from .const import DOMAIN, SIGNAL_LIST_ADDED, UNIQUE_ID_LIST_PREFIX
from .manager import PackingListManager

ATTR_TRIP_DATE = "trip_date"
ATTR_TAGS = "tags"
ATTR_CATEGORY = "category"
ATTR_CATEGORIES = "categories"
ATTR_ITEM = "item"
ATTR_ITEMS = "items"
ATTR_MOVE = "move"
ATTR_INCLUDE_ALWAYS = "include_always"

SERVICE_CREATE_LIST = "create_list"
SERVICE_ADD_FROM_MASTER = "add_from_master"
SERVICE_RESET_LIST = "reset_list"
SERVICE_DELETE_LIST = "delete_list"
SERVICE_ADD_MASTER_ITEMS = "add_master_items"
SERVICE_UPDATE_MASTER_ITEM = "update_master_item"
SERVICE_RESET_MASTER = "reset_master"


def _split_list(separator: str):
    """Validator accepting a list or a string split on separator."""

    def validate(value: Any) -> list[str]:
        if value is None:
            return []
        if isinstance(value, str):
            value = value.split(separator)
        return [str(v).strip() for v in cv.ensure_list(value) if str(v).strip()]

    return validate


# Tags etc. may be given comma separated; item names one per line (they may contain commas).
_string_list = _split_list(",")
_line_list = _split_list("\n")


_SELECTION_SCHEMA = {
    vol.Optional(ATTR_TAGS, default=list): _string_list,
    vol.Optional(ATTR_CATEGORIES, default=list): _string_list,
    vol.Optional(ATTR_ITEMS, default=list): _string_list,
}

CREATE_LIST_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_NAME): cv.string,
        vol.Optional(ATTR_TRIP_DATE): cv.date,
        vol.Optional(ATTR_INCLUDE_ALWAYS, default=True): cv.boolean,
        **_SELECTION_SCHEMA,
    }
)

ADD_FROM_MASTER_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Optional(ATTR_INCLUDE_ALWAYS, default=False): cv.boolean,
        **_SELECTION_SCHEMA,
    }
)

LIST_SCHEMA = vol.Schema({vol.Required(ATTR_ENTITY_ID): cv.entity_id})

ADD_MASTER_ITEMS_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ITEMS): vol.All(_line_list, vol.Length(min=1)),
        vol.Optional(ATTR_CATEGORY): cv.string,
        vol.Optional(ATTR_TAGS, default=list): _string_list,
        vol.Optional(ATTR_MOVE, default=list): _line_list,
    }
)

# Leaving out category/tags keeps them; an empty category or tag list clears them.
UPDATE_MASTER_ITEM_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ITEM): cv.string,
        vol.Optional(ATTR_NAME): cv.string,
        vol.Optional(ATTR_CATEGORY): vol.Any(None, cv.string),
        vol.Optional(ATTR_TAGS): _string_list,
    }
)


def get_manager(hass: HomeAssistant) -> PackingListManager:
    """Return the manager of the loaded config entry."""
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.state is ConfigEntryState.LOADED:
            return entry.runtime_data
    raise ServiceValidationError("Pakkelister er ikke sat op")


def list_entity_id(hass: HomeAssistant, list_id: str) -> str | None:
    """Entity id of a trip list's to-do entity, if registered."""
    return er.async_get(hass).async_get_entity_id(
        "todo", DOMAIN, f"{UNIQUE_ID_LIST_PREFIX}{list_id}"
    )


def _resolve_list_id(hass: HomeAssistant, manager: PackingListManager, entity_id: str) -> str:
    entry = er.async_get(hass).async_get(entity_id)
    if (
        entry is None
        or entry.platform != DOMAIN
        or entry.domain != "todo"
        or not entry.unique_id.startswith(UNIQUE_ID_LIST_PREFIX)
    ):
        raise ServiceValidationError(f"{entity_id} er ikke en pakkeliste")
    list_id = entry.unique_id.removeprefix(UNIQUE_ID_LIST_PREFIX)
    if list_id not in manager.lists:
        raise ServiceValidationError(f"{entity_id} findes ikke længere")
    return list_id


def _selection(data: dict[str, Any]) -> dict[str, Any]:
    return {
        "items": data[ATTR_ITEMS],
        "tags": data[ATTR_TAGS],
        "categories": data[ATTR_CATEGORIES],
        "include_always": data[ATTR_INCLUDE_ALWAYS],
    }


@callback
def async_register_services(hass: HomeAssistant) -> None:
    """Register the integration's services."""

    async def create_list(call: ServiceCall) -> ServiceResponse:
        manager = get_manager(hass)
        trip_date = call.data.get(ATTR_TRIP_DATE)
        plist = manager.create_list(
            call.data[ATTR_NAME], trip_date.isoformat() if trip_date else None
        )
        added = manager.add_from_master(plist.list_id, **_selection(call.data))
        async_dispatcher_send(hass, SIGNAL_LIST_ADDED, plist.list_id)

        # Entities are added asynchronously; wait briefly so we can return the id.
        entity_id = None
        for _ in range(50):
            if entity_id := list_entity_id(hass, plist.list_id):
                break
            await asyncio.sleep(0.1)
        return {"list_id": plist.list_id, "entity_id": entity_id, "added": added}

    async def add_from_master(call: ServiceCall) -> ServiceResponse:
        manager = get_manager(hass)
        list_id = _resolve_list_id(hass, manager, call.data[ATTR_ENTITY_ID])
        added = manager.add_from_master(list_id, **_selection(call.data))
        return {"added": added}

    async def reset_list(call: ServiceCall) -> None:
        manager = get_manager(hass)
        manager.reset_list(_resolve_list_id(hass, manager, call.data[ATTR_ENTITY_ID]))

    async def delete_list(call: ServiceCall) -> None:
        manager = get_manager(hass)
        list_id = _resolve_list_id(hass, manager, call.data[ATTR_ENTITY_ID])
        registry = er.async_get(hass)
        prefix = f"{UNIQUE_ID_LIST_PREFIX}{list_id}"
        for entry in list(registry.entities.values()):
            if entry.platform == DOMAIN and entry.unique_id in (prefix, f"{prefix}_progress"):
                registry.async_remove(entry.entity_id)
        manager.delete_list(list_id)

    async def add_master_items(call: ServiceCall) -> ServiceResponse:
        manager = get_manager(hass)
        return manager.add_master_items(
            call.data[ATTR_ITEMS],
            call.data.get(ATTR_CATEGORY),
            call.data[ATTR_TAGS],
            call.data[ATTR_MOVE],
        )

    async def update_master_item(call: ServiceCall) -> None:
        manager = get_manager(hass)
        try:
            item = manager.find_master(call.data[ATTR_ITEM])
        except KeyError:
            raise ServiceValidationError(
                f"{call.data[ATTR_ITEM]} findes ikke på master-listen"
            ) from None
        category = call.data.get(ATTR_CATEGORY)
        if ATTR_CATEGORY in call.data and category is None:
            category = ""  # explicit null clears the category
        manager.update_master_item(
            item.uid,
            summary=call.data.get(ATTR_NAME),
            category=category,
            tags=call.data.get(ATTR_TAGS),
        )

    hass.services.async_register(
        DOMAIN,
        SERVICE_CREATE_LIST,
        create_list,
        schema=CREATE_LIST_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_ADD_FROM_MASTER,
        add_from_master,
        schema=ADD_FROM_MASTER_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(DOMAIN, SERVICE_RESET_LIST, reset_list, schema=LIST_SCHEMA)
    hass.services.async_register(DOMAIN, SERVICE_DELETE_LIST, delete_list, schema=LIST_SCHEMA)
    hass.services.async_register(
        DOMAIN,
        SERVICE_ADD_MASTER_ITEMS,
        add_master_items,
        schema=ADD_MASTER_ITEMS_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_UPDATE_MASTER_ITEM,
        update_master_item,
        schema=UPDATE_MASTER_ITEM_SCHEMA,
    )

    async def reset_master(call: ServiceCall) -> None:
        get_manager(hass).reset_master()

    hass.services.async_register(
        DOMAIN, SERVICE_RESET_MASTER, reset_master, schema=vol.Schema({})
    )
