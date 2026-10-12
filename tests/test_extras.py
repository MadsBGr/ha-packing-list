"""Options (defaults for new lists), weight limit, active list, 'remaining' and 'done' entities."""

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from custom_components.packing_list.const import (
    CONF_DEFAULT_TAGS,
    CONF_INCLUDE_ALWAYS,
    CONF_USE_WEIGHT,
    CONF_WEIGHT_LIMIT,
    DOMAIN,
)

from .test_init import _create, _items

SELECT = "select.pakkeliste_aktiv"
REMAINING = "sensor.pakkeliste_mangler"


async def _call(hass: HomeAssistant, service: str, data: dict, response: bool = False):
    return await hass.services.async_call(
        DOMAIN, service, data, blocking=True, return_response=response
    )


async def _data(hass: HomeAssistant, hass_ws_client) -> dict:
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": f"{DOMAIN}/data"})
    return (await client.receive_json())["result"]


async def test_options_flow_defaults(hass: HomeAssistant, setup_entry, hass_ws_client) -> None:
    result = await hass.config_entries.options.async_init(setup_entry.entry_id)
    assert result["step_id"] == "init"
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {CONF_INCLUDE_ALWAYS: False, CONF_USE_WEIGHT: True, CONF_DEFAULT_TAGS: ["fly"], CONF_WEIGHT_LIMIT: 23},
    )
    await hass.async_block_till_done()
    assert setup_entry.options[CONF_WEIGHT_LIMIT] == 23

    settings = (await _data(hass, hass_ws_client))["settings"]
    assert settings == {"include_always": False, "use_weight": True, "default_tags": ["fly"], "weight_limit": 23000}

    # create_list without those fields uses the defaults (default tags are only pre-selected in the card).
    entity_id = (await _create(hass, name="Tur", items=["Pas"]))["entity_id"]
    (plist,) = (await _data(hass, hass_ws_client))["lists"]
    assert (plist["use_weight"], plist["weight_limit"]) == (True, 23000)
    assert [i["summary"] for i in await _items(hass, entity_id)] == ["Pas"]  # no #altid items

    # Explicit values win.
    await _create(hass, name="Tur 2", include_always=True, use_weight=False)
    plist = next(p for p in (await _data(hass, hass_ws_client))["lists"] if p["name"] == "Tur 2")
    assert plist["use_weight"] is False and len(plist["items"]) > 0


async def test_weight_limit(hass: HomeAssistant, setup_entry) -> None:
    await _call(hass, "update_master_item", {"item": "Pas", "weight": 1500})
    entity_id = (
        await _create(hass, name="Fly", items=["Pas"], include_always=False, use_weight=True, weight_limit=1000)
    )["entity_id"]
    attrs = hass.states.get(entity_id).attributes
    assert (attrs["weight_limit"], attrs["over_weight_limit"]) == (1000, True)
    assert hass.states.get("sensor.fly_pakket").attributes["over_weight_limit"] is True

    await _call(hass, "update_list", {"entity_id": entity_id, "weight_limit": 2000})
    assert hass.states.get(entity_id).attributes["over_weight_limit"] is False
    await _call(hass, "update_list", {"entity_id": entity_id, "weight_limit": None})
    assert hass.states.get(entity_id).attributes["weight_limit"] is None


async def test_active_list_and_remaining(hass: HomeAssistant, setup_entry) -> None:
    assert hass.states.get(SELECT).state == "unknown"
    assert hass.states.get(REMAINING).state == "unknown"

    ski = (await _create(hass, name="Ski", items=["Pas", "Skijakke", "Tandbørste"], include_always=False))["entity_id"]
    await _create(hass, name="Strand", items=["Badetøj"], include_always=False)
    assert hass.states.get(SELECT).attributes["options"] == ["Ski", "Strand"]

    await hass.services.async_call(
        "select", "select_option", {"entity_id": SELECT, "option": "Ski"}, blocking=True
    )
    state = hass.states.get(SELECT)
    assert (state.state, state.attributes["entity_id"]) == ("Ski", ski)

    remaining = hass.states.get(REMAINING)
    assert remaining.state == "3"
    assert remaining.attributes["items"] == ["Pas", "Skijakke", "Tandbørste"]
    assert remaining.attributes["categories"] == {"Dokumenter": ["Pas"], "Toilettaske": ["Tandbørste"], "Tøj": ["Skijakke"]}

    uid = next(i["uid"] for i in await _items(hass, ski) if i["summary"] == "Pas")
    await hass.services.async_call("todo", "update_item", {"item": uid, "status": "completed"}, target={"entity_id": ski}, blocking=True)
    assert hass.states.get(REMAINING).state == "2"

    # Via the service; archiving the active list clears it.
    await _call(hass, "set_active_list", {"entity_id": "todo.strand"})
    assert hass.states.get(SELECT).state == "Strand"
    await _call(hass, "update_list", {"entity_id": "todo.strand", "archived": True})
    assert hass.states.get(SELECT).state == "unknown"
    assert hass.states.get(SELECT).attributes["options"] == ["Ski"]

    # Survives a reload.
    await _call(hass, "set_active_list", {"entity_id": ski})
    assert await hass.config_entries.async_reload(setup_entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get(SELECT).state == "Ski"


async def test_done_sensor(hass: HomeAssistant, setup_entry) -> None:
    entity_id = (await _create(hass, name="Weekend", items=["Pas"], include_always=False))["entity_id"]
    assert hass.states.get("binary_sensor.weekend_faerdig").state == "off"
    (item,) = await _items(hass, entity_id)
    await hass.services.async_call("todo", "update_item", {"item": item["uid"], "status": "completed"}, target={"entity_id": entity_id}, blocking=True)
    assert hass.states.get("binary_sensor.weekend_faerdig").state == "on"

    await _call(hass, "delete_list", {"entity_id": entity_id})
    await hass.async_block_till_done()
    assert er.async_get(hass).async_get("binary_sensor.weekend_faerdig") is None
