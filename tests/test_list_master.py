"""Tests for fetching again and saving list items to the master list."""

from homeassistant.core import HomeAssistant

from custom_components.packing_list.const import DOMAIN

from .test_init import MASTER, _create, _items


async def _call(hass: HomeAssistant, service: str, data: dict, response: bool = False):
    return await hass.services.async_call(
        DOMAIN, service, data, blocking=True, return_response=response
    )


async def _names(hass: HomeAssistant, entity_id: str) -> set[str]:
    return {i["summary"] for i in await _items(hass, entity_id)}


async def test_refresh_skips_deleted_items(hass: HomeAssistant, setup_entry) -> None:
    entity_id = (await _create(hass, name="Ski", tags=["ski"]))["entity_id"]
    names = await _names(hass, entity_id)
    assert {"Skijakke", "Tandbørste"} <= names

    # Delete two items (one by tag, one by #altid) from the list.
    uids = [i["uid"] for i in await _items(hass, entity_id) if i["summary"] in ("Skijakke", "Tandbørste")]
    await hass.services.async_call("todo", "remove_item", {"item": uids}, target={"entity_id": entity_id}, blocking=True)

    # New master items matching the list's tag/#altid; one that doesn't match.
    await _call(hass, "add_master_items", {"items": ["Skibriller", "Pandelampe"], "tags": ["ski"]})
    await _call(hass, "add_master_items", {"items": ["Badebolde"], "tags": ["strand"]})

    assert await _call(hass, "refresh_list", {"entity_id": entity_id}, True) == {"added": 2}
    names = await _names(hass, entity_id)
    assert {"Skibriller", "Pandelampe"} <= names
    assert not names & {"Skijakke", "Tandbørste", "Badebolde"}

    # Picking a deleted item explicitly brings it back.
    await _call(hass, "add_from_master", {"entity_id": entity_id, "items": ["Skijakke"]})
    assert "Skijakke" in await _names(hass, entity_id)
    assert await _call(hass, "refresh_list", {"entity_id": entity_id}, True) == {"added": 0}


async def test_include_excluded(hass: HomeAssistant, setup_entry) -> None:
    entity_id = (await _create(hass, name="Strand", tags=["strand"], include_always=False))["entity_id"]
    assert await _names(hass, entity_id) == {"Badetøj", "Solcreme"}
    uid = next(i["uid"] for i in await _items(hass, entity_id) if i["summary"] == "Badetøj")
    await hass.services.async_call("todo", "remove_item", {"item": uid}, target={"entity_id": entity_id}, blocking=True)

    # Adding the tag again only brings new items ...
    assert await _call(hass, "add_from_master", {"entity_id": entity_id, "tags": ["strand"]}, True) == {"added": 0}
    # ... unless asked to include the deleted ones.
    assert await _call(
        hass, "add_from_master", {"entity_id": entity_id, "tags": ["strand"], "include_excluded": True}, True
    ) == {"added": 1}
    assert "Badetøj" in await _names(hass, entity_id)

    # Same for refresh_list; afterwards the item counts as not deleted any more.
    uid = next(i["uid"] for i in await _items(hass, entity_id) if i["summary"] == "Solcreme")
    await hass.services.async_call("todo", "remove_item", {"item": uid}, target={"entity_id": entity_id}, blocking=True)
    assert await _call(hass, "refresh_list", {"entity_id": entity_id}, True) == {"added": 0}
    assert await _call(hass, "refresh_list", {"entity_id": entity_id, "include_excluded": True}, True) == {"added": 1}
    uid = next(i["uid"] for i in await _items(hass, entity_id) if i["summary"] == "Solcreme")
    await hass.services.async_call("todo", "remove_item", {"item": uid}, target={"entity_id": entity_id}, blocking=True)
    assert await _call(hass, "refresh_list", {"entity_id": entity_id}, True) == {"added": 0}


async def test_refresh_remembers_later_tags_and_categories(hass: HomeAssistant, setup_entry) -> None:
    entity_id = (await _create(hass, name="Tur", include_always=False))["entity_id"]
    assert await _names(hass, entity_id) == set()
    await _call(hass, "add_from_master", {"entity_id": entity_id, "tags": ["fly"], "categories": ["Elektronik"]})
    await _call(hass, "add_master_items", {"items": ["Kindle"], "tags": ["fly"]})
    await _call(hass, "add_master_items", {"items": ["USB-kabel"], "category": "Elektronik"})
    assert await _call(hass, "refresh_list", {"entity_id": entity_id}, True) == {"added": 2}


async def test_add_list_item_to_master(hass: HomeAssistant, setup_entry) -> None:
    entity_id = (await _create(hass, name="Tur", include_always=False))["entity_id"]
    result = await _call(
        hass,
        "add_list_item",
        {"entity_id": entity_id, "item": "Kajak", "category": "Sport", "tags": ["sommer", "vand"], "add_to_master": True},
        True,
    )
    assert result["master_uid"]
    master = {i["summary"]: i for i in await _items(hass, MASTER)}
    assert master["Kajak"]["description"] == "@Sport #sommer #vand"
    (item,) = await _items(hass, entity_id)
    assert item["description"] == "@Sport #sommer #vand"

    # Without add_to_master only the list gets it.
    await _call(hass, "add_list_item", {"entity_id": entity_id, "item": "Padleårer", "category": "Sport"})
    assert "Padleårer" not in {i["summary"] for i in await _items(hass, MASTER)}


async def test_copy_to_master(hass: HomeAssistant, setup_entry, hass_ws_client) -> None:
    entity_id = (await _create(hass, name="Tur", include_always=False))["entity_id"]
    await hass.services.async_call("todo", "add_item", {"item": "Fiskestang", "description": "den lange"}, target={"entity_id": entity_id}, blocking=True)
    await hass.services.async_call("todo", "add_item", {"item": "bamse"}, target={"entity_id": entity_id}, blocking=True)

    await _call(hass, "copy_to_master", {"entity_id": entity_id, "item": "Fiskestang", "category": "Sport", "tags": ["sommer"]})
    # Existing master name in the same category: gets the new tag, no duplicate.
    await _call(hass, "copy_to_master", {"entity_id": entity_id, "item": "bamse", "category": "Børn", "tags": ["bil"]})

    master = [i for i in await _items(hass, MASTER) if i["summary"].lower() in ("fiskestang", "bamse")]
    by_name = {i["summary"]: i for i in master}
    assert len(master) == 2
    assert by_name["Fiskestang"]["description"] == "@Sport #sommer"
    assert by_name["Bamse"]["description"] == "@Børn #børn #bil"

    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": f"{DOMAIN}/data"})
    items = {i["summary"]: i for i in (await client.receive_json())["result"]["lists"][0]["items"]}
    assert items["Fiskestang"]["master_uid"] == by_name["Fiskestang"]["uid"]
    assert items["Fiskestang"]["description"] == "@Sport #sommer den lange"
    assert items["bamse"]["master_uid"] == by_name["Bamse"]["uid"]
    assert items["bamse"]["category"] == "Børn"


async def test_copy_to_master_other_category_is_separate(hass: HomeAssistant, setup_entry) -> None:
    entity_id = (await _create(hass, name="Tur", include_always=False))["entity_id"]
    await hass.services.async_call("todo", "add_item", {"item": "Bamse"}, target={"entity_id": entity_id}, blocking=True)
    await _call(hass, "copy_to_master", {"entity_id": entity_id, "item": "Bamse", "category": "Legetøj"})
    bamser = sorted(i["description"] for i in await _items(hass, MASTER) if i["summary"] == "Bamse")
    assert bamser == ["@Børn #børn", "@Legetøj"]
