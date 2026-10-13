"""Tests for quantity, weight, notes, archiving and same-name items in different categories."""

import pytest

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError

from custom_components.packing_list.const import DOMAIN, STORAGE_KEY

from .test_init import MASTER, _create, _items


async def _call(hass: HomeAssistant, service: str, data: dict, response: bool = False):
    return await hass.services.async_call(
        DOMAIN, service, data, blocking=True, return_response=response
    )


async def _data(hass: HomeAssistant, hass_ws_client) -> dict:
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": f"{DOMAIN}/data"})
    return (await client.receive_json())["result"]


async def test_quantity_and_weight(hass: HomeAssistant, setup_entry, hass_ws_client) -> None:
    await _call(hass, "update_master_item", {"item": "Strømper", "quantity": 5, "weight": 40})
    await _call(hass, "update_master_item", {"item": "Pas", "weight": 30})
    entity_id = (
        await _create(hass, name="Vandretur", items=["Strømper", "Pas", "Bamse"], include_always=False, use_weight=True)
    )["entity_id"]

    data = await _data(hass, hass_ws_client)
    (plist,) = data["lists"]
    assert plist["use_weight"] is True
    items = {i["summary"]: i for i in plist["items"]}
    assert (items["Strømper"]["quantity"], items["Strømper"]["weight"]) == (5, 40)
    assert items["Bamse"]["weight"] is None

    attrs = hass.states.get(entity_id).attributes
    assert attrs["total_weight"] == 5 * 40 + 30
    assert attrs["packed_weight"] == 0
    await hass.services.async_call(
        "todo", "update_item", {"item": "Pas", "status": "completed"},
        target={"entity_id": entity_id}, blocking=True,
    )
    assert hass.states.get(entity_id).attributes["packed_weight"] == 30
    assert hass.states.get("sensor.vandretur_packed").attributes["total_weight"] == 230

    # Quantity on the list only; weight also saved on the master (and from there on other lists).
    other = (await _create(hass, name="Anden", items=["Strømper"], include_always=False))["entity_id"]
    await _call(hass, "update_list_item", {"entity_id": entity_id, "item": "Strømper", "quantity": 3, "weight": 50, "save_to_master": True})
    data = await _data(hass, hass_ws_client)
    master = {i["summary"]: i for i in data["master"]}
    assert (master["Strømper"]["quantity"], master["Strømper"]["weight"]) == (5, 50)
    lists = {l["name"]: {i["summary"]: i for i in l["items"]} for l in data["lists"]}
    assert (lists["Vandretur"]["Strømper"]["quantity"], lists["Vandretur"]["Strømper"]["weight"]) == (3, 50)
    assert (lists["Anden"]["Strømper"]["quantity"], lists["Anden"]["Strømper"]["weight"]) == (5, 50)
    # Lists without weight don't report it.
    assert "total_weight" not in hass.states.get(other).attributes

    # 0/null clears; leaving out keeps.
    await _call(hass, "update_list_item", {"entity_id": entity_id, "item": "Strømper", "quantity": 0})
    await _call(hass, "update_master_item", {"item": "Strømper", "weight": None})
    data = await _data(hass, hass_ws_client)
    master = {i["summary"]: i for i in data["master"]}
    assert (master["Strømper"]["quantity"], master["Strømper"]["weight"]) == (5, None)
    item = next(i for i in data["lists"][0]["items"] if i["summary"] == "Strømper")
    assert (item["quantity"], item["weight"]) == (None, None)


async def test_add_list_item_with_weight_to_master(hass: HomeAssistant, setup_entry, hass_ws_client) -> None:
    entity_id = (await _create(hass, name="Tur", include_always=False, use_weight=True))["entity_id"]
    await _call(
        hass, "add_list_item",
        {"entity_id": entity_id, "item": "Telt", "category": "Lejr", "quantity": 1, "weight": 2100.5, "add_to_master": True},  # deprecated name, still accepted
    )
    data = await _data(hass, hass_ws_client)
    master = {i["summary"]: i for i in data["master"]}
    assert master["Telt"]["weight"] == 2100.5
    assert hass.states.get(entity_id).attributes["total_weight"] == 2100.5


async def test_notes_and_archive(hass: HomeAssistant, setup_entry, hass_ws_client) -> None:
    # trip_date is obsolete but still accepted (and ignored) for old scripts.
    entity_id = (await _create(hass, name="Gammel", trip_date="2025-07-01", notes="Køb solcreme"))["entity_id"]
    attrs = hass.states.get(entity_id).attributes
    assert (attrs["notes"], attrs["archived"]) == ("Køb solcreme", False)

    await _call(hass, "update_list", {"entity_id": entity_id, "archived": True, "notes": "Husk nøgler\nog pas"})
    (plist,) = (await _data(hass, hass_ws_client))["lists"]
    assert (plist["archived"], plist["notes"]) == (True, "Husk nøgler\nog pas")
    assert "trip_date" not in plist

    await _call(hass, "update_list", {"entity_id": entity_id, "archived": False, "trip_date": None, "use_weight": True})
    (plist,) = (await _data(hass, hass_ws_client))["lists"]
    assert (plist["archived"], plist["use_weight"]) == (False, True)
    assert plist["notes"] == "Husk nøgler\nog pas"

    # Survives a reload.
    await _call(hass, "update_list", {"entity_id": entity_id, "archived": True})
    assert await hass.config_entries.async_reload(setup_entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get(entity_id).attributes["archived"] is True


async def test_same_name_in_other_category(hass: HomeAssistant, setup_entry, hass_ws_client) -> None:
    # Bamse exists in Børn. Asking for a duplicate creates a second Bamse in Legetøj.
    response = await _call(
        hass, "add_master_items",
        {"items": ["Bamse", "Sutter"], "category": "Legetøj", "tags": ["bil"], "duplicate": ["bamse"]},
        True,
    )
    assert response == {"added": 1, "moved": 0, "tagged": 1, "skipped": 0}
    bamser = sorted(i["description"] for i in await _items(hass, MASTER) if i["summary"] == "Bamse")
    assert bamser == ["@Børn #børn", "@Legetøj #bil"]

    # Adding Bamse to Legetøj again finds the existing one there.
    response = await _call(hass, "add_master_items", {"items": ["Bamse"], "category": "Legetøj", "tags": ["fly"]}, True)
    assert response == {"added": 0, "moved": 0, "tagged": 1, "skipped": 0}

    # Both can be on the same packing list.
    entity_id = (await _create(hass, name="Tur", tags=["børn", "bil"], include_always=False))["entity_id"]
    assert sum(i["summary"] == "Bamse" for i in await _items(hass, entity_id)) == 2
    assert await _call(hass, "add_from_master", {"entity_id": entity_id, "tags": ["fly"]}, True) == {"added": 5}
    assert sum(i["summary"] == "Bamse" for i in await _items(hass, entity_id)) == 2

    # The name alone is ambiguous now; uids work.
    with pytest.raises(ServiceValidationError):
        await _call(hass, "update_master_item", {"item": "Bamse", "tags": []})
    data = await _data(hass, hass_ws_client)
    toy = next(m for m in data["master"] if m["summary"] == "Bamse" and m["category"] == "Legetøj")
    # Moving it into Børn would make two Bamse in the same category.
    with pytest.raises(ServiceValidationError):
        await _call(hass, "update_master_item", {"item": toy["uid"], "category": "Børn"})
    await _call(hass, "update_master_item", {"item": toy["uid"], "name": "Bamse (lille)"})
    names = {i["summary"] for i in await _items(hass, MASTER)}
    assert {"Bamse", "Bamse (lille)"} <= names


async def test_old_and_unknown_stored_fields(hass: HomeAssistant, hass_storage) -> None:
    """Data from older versions (no quantity/weight/notes) and unknown keys load fine."""
    from pytest_homeassistant_custom_component.common import MockConfigEntry

    hass_storage[STORAGE_KEY] = {
        "version": 1,
        "key": STORAGE_KEY,
        "data": {
            "master": [{"uid": "m1", "summary": "Pas", "description": "@Dokumenter", "packed": False, "master_uid": None, "future": 1}],
            "lists": [
                {
                    "list_id": "l1", "name": "Gammel", "trip_date": None,
                    "items": [{"uid": "i1", "summary": "Pas", "description": "@Dokumenter", "packed": True, "master_uid": "m1"}],
                    "tags": [], "categories": [], "include_always": False, "excluded": [],
                }
            ],
        },
    }
    hass.config.language = "da"
    entry = MockConfigEntry(domain=DOMAIN, data={}, title="Pakkelister")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    attrs = hass.states.get("todo.gammel").attributes
    assert (attrs["packed"], attrs["archived"], attrs["notes"]) == (1, False, "")
