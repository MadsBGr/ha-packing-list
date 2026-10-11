"""End-to-end tests for the packing_list integration."""

import pytest

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import entity_registry as er

from custom_components.packing_list.const import DOMAIN, SEED_ITEMS, VERSION
from custom_components.packing_list.manager import parse_description

MASTER = "todo.pakkeliste_master"


async def _items(hass: HomeAssistant, entity_id: str) -> list[dict]:
    result = await hass.services.async_call(
        "todo",
        "get_items",
        {"status": ["needs_action", "completed"]},
        target={"entity_id": entity_id},
        blocking=True,
        return_response=True,
    )
    return result[entity_id]["items"]


async def _create(hass: HomeAssistant, **data) -> dict:
    result = await hass.services.async_call(
        DOMAIN, "create_list", data, blocking=True, return_response=True
    )
    await hass.async_block_till_done()
    return result


def test_parse_description() -> None:
    assert parse_description("@Personlig_pleje #Sommer #fly husk etui") == (
        "Personlig pleje",
        ["sommer", "fly"],
        "husk etui",
    )
    assert parse_description("") == (None, [], "")
    assert parse_description("mail@example.com") == (None, [], "mail@example.com")


async def test_master_is_seeded(hass: HomeAssistant, setup_entry) -> None:
    assert hass.states.get(MASTER).state == str(len(SEED_ITEMS))
    items = await _items(hass, MASTER)
    assert items[0]["summary"] == SEED_ITEMS[0][0]


async def test_create_list_from_tags(hass: HomeAssistant, setup_entry) -> None:
    result = await _create(hass, name="Skiferie", tags="ski", trip_date="2027-02-06")
    entity_id = result["entity_id"]
    assert entity_id == "todo.skiferie"

    summaries = {i["summary"] for i in await _items(hass, entity_id)}
    assert {"Skijakke", "Tandbørste", "Solcreme"} <= summaries
    assert "Badetøj" not in summaries
    assert result["added"] == len(summaries)

    state = hass.states.get(entity_id)
    assert state.attributes["trip_date"] == "2027-02-06"
    assert state.attributes["version"] == VERSION
    assert hass.states.get("sensor.skiferie_pakket").state == "0"


async def test_add_from_master_skips_duplicates(hass: HomeAssistant, setup_entry) -> None:
    result = await _create(hass, name="Strand", tags=["strand"], include_always=False)
    entity_id = result["entity_id"]
    before = len(await _items(hass, entity_id))

    response = await hass.services.async_call(
        DOMAIN,
        "add_from_master",
        {"entity_id": entity_id, "tags": ["strand", "fly"], "items": ["Pas", "badetøj"]},
        blocking=True,
        return_response=True,
    )
    after = await _items(hass, entity_id)
    assert response["added"] == len(after) - before
    assert sum(i["summary"] == "Badetøj" for i in after) == 1
    assert any(i["summary"] == "Høretelefoner" for i in after)


async def test_pack_reset_and_progress(hass: HomeAssistant, setup_entry) -> None:
    entity_id = (await _create(hass, name="Weekend", items=["Pas", "Tandbørste"], include_always=False))["entity_id"]

    await hass.services.async_call(
        "todo", "update_item", {"item": "Pas", "status": "completed"},
        target={"entity_id": entity_id}, blocking=True,
    )
    assert hass.states.get("sensor.weekend_pakket").state == "50"
    assert hass.states.get(entity_id).state == "1"

    await hass.services.async_call(DOMAIN, "reset_list", {"entity_id": entity_id}, blocking=True)
    assert hass.states.get("sensor.weekend_pakket").state == "0"


async def test_master_ignores_completion(hass: HomeAssistant, setup_entry) -> None:
    await hass.services.async_call(
        "todo", "update_item", {"item": "Pas", "status": "completed"},
        target={"entity_id": MASTER}, blocking=True,
    )
    assert all(i["status"] == "needs_action" for i in await _items(hass, MASTER))


async def test_delete_list(hass: HomeAssistant, setup_entry) -> None:
    entity_id = (await _create(hass, name="Slettes"))["entity_id"]
    await hass.services.async_call(DOMAIN, "delete_list", {"entity_id": entity_id}, blocking=True)
    await hass.async_block_till_done()

    registry = er.async_get(hass)
    assert registry.async_get(entity_id) is None
    assert registry.async_get("sensor.slettes_pakket") is None
    assert hass.states.get(entity_id) is None


async def test_data_survives_reload(hass: HomeAssistant, setup_entry) -> None:
    entity_id = (await _create(hass, name="Gemmes", items=["Pas"], include_always=False))["entity_id"]
    assert await hass.config_entries.async_reload(setup_entry.entry_id)
    await hass.async_block_till_done()
    assert [i["summary"] for i in await _items(hass, entity_id)] == ["Pas"]


async def test_add_master_items(hass: HomeAssistant, setup_entry) -> None:
    response = await hass.services.async_call(
        DOMAIN,
        "add_master_items",
        {"items": "Badehåndklæde\nKlipklappere\n\nbadetøj", "category": "Strand ting", "tags": "#Sommer, strand"},
        blocking=True,
        return_response=True,
    )
    # Badetøj already has #sommer #strand and isn't asked to move: unchanged.
    assert response == {"added": 2, "moved": 0, "tagged": 0, "skipped": 1}

    items = {i["summary"]: i for i in await _items(hass, MASTER)}
    assert items["Klipklappere"]["description"] == "@Strand_ting #sommer #strand"
    assert len(items) == len(SEED_ITEMS) + 2

    # The new items are picked up by tag.
    entity_id = (await _create(hass, name="Sommer", tags=["strand"], include_always=False))["entity_id"]
    summaries = {i["summary"] for i in await _items(hass, entity_id)}
    assert {"Badehåndklæde", "Klipklappere", "Badetøj"} <= summaries


async def test_add_existing_master_items_moves_and_tags(hass: HomeAssistant, setup_entry) -> None:
    response = await hass.services.async_call(
        DOMAIN,
        "add_master_items",
        # Bamse: new category (moved, asked) + new tag. Sutter: other category, not moved, new tag.
        {"items": ["bamse", "Sutter", "Pas"], "category": "Legetøj", "tags": ["bil"], "move": ["Bamse"]},
        blocking=True,
        return_response=True,
    )
    assert response == {"added": 0, "moved": 1, "tagged": 2, "skipped": 0}
    items = {i["summary"]: i for i in await _items(hass, MASTER)}
    assert items["Bamse"]["description"] == "@Legetøj #børn #bil"
    assert items["Sutter"]["description"] == "@Børn #børn #bil"
    assert items["Pas"]["description"] == "@Dokumenter #udland #fly #bil"


async def test_update_master_item(hass: HomeAssistant, setup_entry) -> None:
    entity_id = (await _create(hass, name="Tur", items=["Bamse"], include_always=False))["entity_id"]
    # A note on the trip list copy survives the master update.
    (copy,) = await _items(hass, entity_id)
    await hass.services.async_call(
        "todo", "update_item", {"item": copy["uid"], "description": "@Børn #børn den blå"},
        target={"entity_id": entity_id}, blocking=True,
    )

    await hass.services.async_call(
        DOMAIN, "update_master_item",
        {"item": "bamse", "name": "Bamse Bjørn", "category": "Legetøj", "tags": "#bil, børn"},
        blocking=True,
    )
    items = {i["summary"]: i for i in await _items(hass, MASTER)}
    assert items["Bamse Bjørn"]["description"] == "@Legetøj #bil #børn"
    (copy,) = await _items(hass, entity_id)
    assert copy["summary"] == "Bamse"
    assert copy["description"] == "@Legetøj #bil #børn den blå"

    # Omitted fields are kept; empty values clear.
    await hass.services.async_call(
        DOMAIN, "update_master_item", {"item": "Bamse Bjørn", "tags": []}, blocking=True
    )
    items = {i["summary"]: i for i in await _items(hass, MASTER)}
    assert items["Bamse Bjørn"]["description"] == "@Legetøj"
    await hass.services.async_call(
        DOMAIN, "update_master_item", {"item": "Bamse Bjørn", "category": ""}, blocking=True
    )
    items = {i["summary"]: i for i in await _items(hass, MASTER)}
    assert "description" not in items["Bamse Bjørn"] or not items["Bamse Bjørn"]["description"]

    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(
            DOMAIN, "update_master_item", {"item": "Findes ikke", "tags": ["x"]}, blocking=True
        )


async def test_websocket_data(hass: HomeAssistant, setup_entry, hass_ws_client) -> None:
    await _create(hass, name="Ws", items=["Pas"], include_always=False)
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": f"{DOMAIN}/data"})
    msg = await client.receive_json()
    assert msg["success"]
    data = msg["result"]
    assert data["master_entity_id"] == MASTER
    assert len(data["master"]) == len(SEED_ITEMS)
    (plist,) = data["lists"]
    assert plist["entity_id"] == "todo.ws"
    (item,) = plist["items"]
    assert item["category"] == "Dokumenter"
    assert item["tags"] == ["udland", "fly"]
    assert item["master_uid"]
