"""Services for creating and filling packing lists."""

from __future__ import annotations

import asyncio
from typing import Any

import voluptuous as vol

from homeassistant.components import persistent_notification
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

from .const import (
    CONF_INCLUDE_ALWAYS,
    CONF_USE_WEIGHT,
    CONF_WEIGHT_LIMIT,
    DEFAULTS_NOTIFICATION_ID,
    DOMAIN,
    LIST_ENTITY_SUFFIXES,
    NAMES,
    SIGNAL_LIST_ADDED,
    UNIQUE_ID_LIST_PREFIX,
)
from .manager import KEEP, AmbiguousItemError, DuplicateItemError, PackingListManager

ATTR_TRIP_DATE = "trip_date"
ATTR_TAGS = "tags"
ATTR_CATEGORY = "category"
ATTR_CATEGORIES = "categories"
ATTR_ITEM = "item"
ATTR_ITEMS = "items"
ATTR_MOVE = "move"
ATTR_INCLUDE_ALWAYS = "include_always"
ATTR_INCLUDE_EXCLUDED = "include_excluded"
ATTR_DUPLICATE = "duplicate"
ATTR_QUANTITY = "quantity"
ATTR_WEIGHT = "weight"
ATTR_NOTES = "notes"
ATTR_USE_WEIGHT = "use_weight"
ATTR_ARCHIVED = "archived"
ATTR_UPDATE_MASTER = "update_master"
ATTR_WEIGHT_LIMIT = "weight_limit"

SERVICE_CREATE_LIST = "create_list"
SERVICE_ADD_FROM_MASTER = "add_from_master"
SERVICE_RESET_LIST = "reset_list"
SERVICE_DELETE_LIST = "delete_list"
SERVICE_ADD_MASTER_ITEMS = "add_master_items"
SERVICE_UPDATE_MASTER_ITEM = "update_master_item"
SERVICE_RESET_MASTER = "reset_master"
SERVICE_REFRESH_LIST = "refresh_list"
SERVICE_ADD_LIST_ITEM = "add_list_item"
SERVICE_COPY_TO_MASTER = "copy_to_master"
SERVICE_UPDATE_LIST = "update_list"
SERVICE_UPDATE_LIST_ITEM = "update_list_item"
SERVICE_COPY_LIST = "copy_list"
SERVICE_ADD_NEW_DEFAULTS = "add_new_defaults"
SERVICE_SKIP_NEW_DEFAULTS = "skip_new_defaults"
SERVICE_SET_ACTIVE_LIST = "set_active_list"

ATTR_TO_MASTER = "add_to_master"


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

# Quantity and weight (grams per piece); null or 0 clears the value.
_quantity = vol.Any(None, vol.All(vol.Coerce(int), vol.Range(min=0)))
_weight = vol.Any(None, vol.All(vol.Coerce(float), vol.Range(min=0)))


_SELECTION_SCHEMA = {
    vol.Optional(ATTR_TAGS, default=list): _string_list,
    vol.Optional(ATTR_CATEGORIES, default=list): _string_list,
    vol.Optional(ATTR_ITEMS, default=list): _string_list,
}

# Lists no longer have a date; the field is still accepted (and ignored) so old scripts keep working.
_IGNORED_TRIP_DATE = {vol.Optional(ATTR_TRIP_DATE): vol.Any(None, cv.string, cv.date)}

# include_always, use_weight and weight_limit default to the integration's options.
CREATE_LIST_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_NAME): cv.string,
        **_IGNORED_TRIP_DATE,
        vol.Optional(ATTR_INCLUDE_ALWAYS): cv.boolean,
        vol.Optional(ATTR_USE_WEIGHT): cv.boolean,
        vol.Optional(ATTR_WEIGHT_LIMIT): _weight,
        vol.Optional(ATTR_NOTES, default=""): cv.string,
        **_SELECTION_SCHEMA,
    }
)

SET_ACTIVE_LIST_SCHEMA = vol.Schema({vol.Optional(ATTR_ENTITY_ID): vol.Any(None, cv.entity_id)})

ADD_FROM_MASTER_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Optional(ATTR_INCLUDE_ALWAYS, default=False): cv.boolean,
        vol.Optional(ATTR_INCLUDE_EXCLUDED, default=False): cv.boolean,
        **_SELECTION_SCHEMA,
    }
)

REFRESH_LIST_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Optional(ATTR_INCLUDE_EXCLUDED, default=False): cv.boolean,
    }
)

LIST_SCHEMA = vol.Schema({vol.Required(ATTR_ENTITY_ID): cv.entity_id})

ADD_MASTER_ITEMS_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ITEMS): vol.All(_line_list, vol.Length(min=1)),
        vol.Optional(ATTR_CATEGORY): cv.string,
        vol.Optional(ATTR_TAGS, default=list): _string_list,
        vol.Optional(ATTR_MOVE, default=list): _line_list,
        vol.Optional(ATTR_DUPLICATE, default=list): _line_list,
    }
)

# Leaving out category/tags keeps them; an empty category or tag list clears them.
UPDATE_MASTER_ITEM_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ITEM): cv.string,
        vol.Optional(ATTR_NAME): cv.string,
        vol.Optional(ATTR_CATEGORY): vol.Any(None, cv.string),
        vol.Optional(ATTR_TAGS): _string_list,
        vol.Optional(ATTR_QUANTITY): _quantity,
        vol.Optional(ATTR_WEIGHT): _weight,
    }
)


ADD_LIST_ITEM_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM): cv.string,
        vol.Optional(ATTR_CATEGORY): vol.Any(None, cv.string),
        vol.Optional(ATTR_TAGS, default=list): _string_list,
        vol.Optional(ATTR_QUANTITY): _quantity,
        vol.Optional(ATTR_WEIGHT): _weight,
        vol.Optional(ATTR_TO_MASTER, default=False): cv.boolean,
    }
)

# Leaving out a field keeps it.
UPDATE_LIST_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Optional(ATTR_NAME): vol.All(cv.string, vol.Length(min=1)),
        **_IGNORED_TRIP_DATE,
        vol.Optional(ATTR_WEIGHT_LIMIT): _weight,
        vol.Optional(ATTR_NOTES): cv.string,
        vol.Optional(ATTR_USE_WEIGHT): cv.boolean,
        vol.Optional(ATTR_ARCHIVED): cv.boolean,
    }
)

# Leaving out quantity/weight keeps them; null or 0 clears them.
UPDATE_LIST_ITEM_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM): cv.string,
        vol.Optional(ATTR_QUANTITY): _quantity,
        vol.Optional(ATTR_WEIGHT): _weight,
        vol.Optional(ATTR_UPDATE_MASTER, default=False): cv.boolean,
    }
)

COPY_LIST_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Optional(ATTR_NAME): vol.All(cv.string, vol.Length(min=1)),
    }
)

# Leaving out items means all new default items.
NEW_DEFAULTS_SCHEMA = vol.Schema({vol.Optional(ATTR_ITEMS): _line_list})

# Leaving out category/tags uses the list item's own.
COPY_TO_MASTER_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_ITEM): cv.string,
        vol.Optional(ATTR_CATEGORY): vol.Any(None, cv.string),
        vol.Optional(ATTR_TAGS): _string_list,
    }
)


def _error(key: str, **placeholders: str) -> ServiceValidationError:
    """A translated validation error (see "exceptions" in the translations)."""
    return ServiceValidationError(
        translation_domain=DOMAIN,
        translation_key=key,
        translation_placeholders=placeholders or None,
    )


def get_manager(hass: HomeAssistant) -> PackingListManager:
    """Return the manager of the loaded config entry."""
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.state is ConfigEntryState.LOADED:
            return entry.runtime_data
    raise _error("not_loaded")


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
        raise _error("not_a_list", entity_id=entity_id)
    list_id = entry.unique_id.removeprefix(UNIQUE_ID_LIST_PREFIX)
    if list_id not in manager.lists:
        raise _error("list_gone", entity_id=entity_id)
    return list_id


def _find_list_item(manager: PackingListManager, list_id: str, ref: str):
    """A trip list item by uid or (case-insensitive) name."""
    items = manager.lists[list_id].items
    item = next(
        (i for i in items if i.uid == ref or i.summary.casefold() == ref.strip().casefold()),
        None,
    )
    if item is None:
        raise _error("list_item_not_found", item=ref)
    return item


def _optional(data: dict[str, Any], key: str) -> Any:
    """The value if the field was given (None included), else KEEP."""
    return data[key] if key in data else KEEP


@callback
def async_remove_list_entities(hass: HomeAssistant, list_id: str) -> None:
    """Remove a list's to-do, progress and done entities from the registry."""
    registry = er.async_get(hass)
    prefix = f"{UNIQUE_ID_LIST_PREFIX}{list_id}"
    wanted = {prefix, *(f"{prefix}{suffix}" for suffix in LIST_ENTITY_SUFFIXES)}
    for entry in list(registry.entities.values()):
        if entry.platform == DOMAIN and entry.unique_id in wanted:
            registry.async_remove(entry.entity_id)


async def _async_add_list_entities(hass: HomeAssistant, list_id: str) -> str | None:
    """Create the entities of a new list and return its to-do entity id."""
    async_dispatcher_send(hass, SIGNAL_LIST_ADDED, list_id)
    # Entities are added asynchronously; wait briefly so we can return the id.
    for _ in range(50):
        if entity_id := list_entity_id(hass, list_id):
            return entity_id
        await asyncio.sleep(0.1)
    return None


@callback
def async_update_defaults_notification(hass: HomeAssistant, manager: PackingListManager) -> None:
    """Show a notification while new default master items are waiting, else remove it."""
    pending = manager.pending_defaults()
    if not pending:
        persistent_notification.async_dismiss(hass, DEFAULTS_NOTIFICATION_ID)
        return
    texts = NAMES[manager.language]
    persistent_notification.async_create(
        hass,
        texts["defaults_message"].format(
            count=len(pending), names=", ".join(summary for summary, _ in pending)
        ),
        title=texts["defaults_title"],
        notification_id=DEFAULTS_NOTIFICATION_ID,
    )


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
        options = manager.options
        default_limit = options.get(CONF_WEIGHT_LIMIT) or 0
        data = {
            ATTR_INCLUDE_ALWAYS: options.get(CONF_INCLUDE_ALWAYS, True),
            **call.data,
        }
        plist = manager.create_list(
            call.data[ATTR_NAME],
            use_weight=call.data.get(ATTR_USE_WEIGHT, options.get(CONF_USE_WEIGHT, False)),
            notes=call.data[ATTR_NOTES],
            weight_limit=call.data.get(ATTR_WEIGHT_LIMIT, default_limit * 1000 or None),
        )
        added = manager.add_from_master(plist.list_id, **_selection(data))
        entity_id = await _async_add_list_entities(hass, plist.list_id)
        return {"list_id": plist.list_id, "entity_id": entity_id, "added": added}

    async def copy_list(call: ServiceCall) -> ServiceResponse:
        manager = get_manager(hass)
        list_id = _resolve_list_id(hass, manager, call.data[ATTR_ENTITY_ID])
        name = call.data.get(ATTR_NAME) or NAMES[manager.language]["copy"].format(
            name=manager.lists[list_id].name
        )
        plist = manager.copy_list(list_id, name)
        entity_id = await _async_add_list_entities(hass, plist.list_id)
        return {"list_id": plist.list_id, "entity_id": entity_id, "items": len(plist.items)}

    async def set_active_list(call: ServiceCall) -> None:
        manager = get_manager(hass)
        entity_id = call.data.get(ATTR_ENTITY_ID)
        manager.set_active_list(_resolve_list_id(hass, manager, entity_id) if entity_id else None)

    async def add_new_defaults(call: ServiceCall) -> ServiceResponse:
        manager = get_manager(hass)
        added = manager.add_new_defaults(call.data.get(ATTR_ITEMS))
        async_update_defaults_notification(hass, manager)
        return {"added": added}

    async def skip_new_defaults(call: ServiceCall) -> None:
        manager = get_manager(hass)
        manager.skip_new_defaults(call.data.get(ATTR_ITEMS))
        async_update_defaults_notification(hass, manager)

    async def add_from_master(call: ServiceCall) -> ServiceResponse:
        manager = get_manager(hass)
        list_id = _resolve_list_id(hass, manager, call.data[ATTR_ENTITY_ID])
        added = manager.add_from_master(
            list_id,
            **_selection(call.data),
            include_excluded=call.data[ATTR_INCLUDE_EXCLUDED],
        )
        return {"added": added}

    async def reset_list(call: ServiceCall) -> None:
        manager = get_manager(hass)
        manager.reset_list(_resolve_list_id(hass, manager, call.data[ATTR_ENTITY_ID]))

    async def delete_list(call: ServiceCall) -> None:
        manager = get_manager(hass)
        list_id = _resolve_list_id(hass, manager, call.data[ATTR_ENTITY_ID])
        async_remove_list_entities(hass, list_id)
        manager.delete_list(list_id)

    async def add_master_items(call: ServiceCall) -> ServiceResponse:
        manager = get_manager(hass)
        return manager.add_master_items(
            call.data[ATTR_ITEMS],
            call.data.get(ATTR_CATEGORY),
            call.data[ATTR_TAGS],
            call.data[ATTR_MOVE],
            call.data[ATTR_DUPLICATE],
        )

    async def update_master_item(call: ServiceCall) -> None:
        manager = get_manager(hass)
        try:
            item = manager.find_master(call.data[ATTR_ITEM])
        except AmbiguousItemError:
            raise _error("ambiguous_item", item=call.data[ATTR_ITEM]) from None
        except KeyError:
            raise _error("master_item_not_found", item=call.data[ATTR_ITEM]) from None
        category = call.data.get(ATTR_CATEGORY)
        if ATTR_CATEGORY in call.data and category is None:
            category = ""  # explicit null clears the category
        try:
            manager.update_master_item(
                item.uid,
                summary=call.data.get(ATTR_NAME),
                category=category,
                tags=call.data.get(ATTR_TAGS),
                quantity=_optional(call.data, ATTR_QUANTITY),
                weight=_optional(call.data, ATTR_WEIGHT),
            )
        except DuplicateItemError as err:
            raise _error("duplicate_item", item=str(err)) from None

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
        manager = get_manager(hass)
        manager.reset_master()
        async_update_defaults_notification(hass, manager)

    hass.services.async_register(
        DOMAIN, SERVICE_RESET_MASTER, reset_master, schema=vol.Schema({})
    )

    async def refresh_list(call: ServiceCall) -> ServiceResponse:
        manager = get_manager(hass)
        list_id = _resolve_list_id(hass, manager, call.data[ATTR_ENTITY_ID])
        return {
            "added": manager.refresh_list(
                list_id, include_excluded=call.data[ATTR_INCLUDE_EXCLUDED]
            )
        }

    async def add_list_item(call: ServiceCall) -> ServiceResponse:
        manager = get_manager(hass)
        list_id = _resolve_list_id(hass, manager, call.data[ATTR_ENTITY_ID])
        item = manager.add_list_item(
            list_id,
            call.data[ATTR_ITEM],
            category=call.data.get(ATTR_CATEGORY),
            tags=call.data[ATTR_TAGS],
            quantity=call.data.get(ATTR_QUANTITY),
            weight=call.data.get(ATTR_WEIGHT),
            to_master=call.data[ATTR_TO_MASTER],
        )
        return {"uid": item.uid, "master_uid": item.master_uid}

    async def update_list(call: ServiceCall) -> None:
        manager = get_manager(hass)
        list_id = _resolve_list_id(hass, manager, call.data[ATTR_ENTITY_ID])
        manager.update_list(
            list_id,
            name=call.data.get(ATTR_NAME),
            weight_limit=_optional(call.data, ATTR_WEIGHT_LIMIT),
            notes=call.data.get(ATTR_NOTES),
            use_weight=call.data.get(ATTR_USE_WEIGHT),
            archived=call.data.get(ATTR_ARCHIVED),
        )

    async def update_list_item(call: ServiceCall) -> None:
        manager = get_manager(hass)
        list_id = _resolve_list_id(hass, manager, call.data[ATTR_ENTITY_ID])
        item = _find_list_item(manager, list_id, call.data[ATTR_ITEM])
        manager.update_list_item(
            list_id,
            item.uid,
            quantity=_optional(call.data, ATTR_QUANTITY),
            weight=_optional(call.data, ATTR_WEIGHT),
            to_master=call.data[ATTR_UPDATE_MASTER],
        )

    async def copy_to_master(call: ServiceCall) -> ServiceResponse:
        manager = get_manager(hass)
        list_id = _resolve_list_id(hass, manager, call.data[ATTR_ENTITY_ID])
        item = _find_list_item(manager, list_id, call.data[ATTR_ITEM])
        master_item = manager.copy_to_master(
            list_id,
            item.uid,
            category=call.data.get(ATTR_CATEGORY),
            tags=call.data.get(ATTR_TAGS),
        )
        return {"master_uid": master_item.uid}

    hass.services.async_register(
        DOMAIN,
        SERVICE_REFRESH_LIST,
        refresh_list,
        schema=REFRESH_LIST_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_ADD_LIST_ITEM,
        add_list_item,
        schema=ADD_LIST_ITEM_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_COPY_TO_MASTER,
        copy_to_master,
        schema=COPY_TO_MASTER_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN, SERVICE_UPDATE_LIST, update_list, schema=UPDATE_LIST_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_UPDATE_LIST_ITEM, update_list_item, schema=UPDATE_LIST_ITEM_SCHEMA
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_COPY_LIST,
        copy_list,
        schema=COPY_LIST_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN,
        SERVICE_ADD_NEW_DEFAULTS,
        add_new_defaults,
        schema=NEW_DEFAULTS_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN, SERVICE_SKIP_NEW_DEFAULTS, skip_new_defaults, schema=NEW_DEFAULTS_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_SET_ACTIVE_LIST, set_active_list, schema=SET_ACTIVE_LIST_SCHEMA
    )
