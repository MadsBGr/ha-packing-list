"""Renaming and copying lists, failsafes and new default master items."""

from pytest_homeassistant_custom_component.common import MockConfigEntry

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from custom_components.packing_list import manager as manager_module
from custom_components.packing_list.const import (
    DEFAULTS_NOTIFICATION_ID,
    DOMAIN,
    SEED_ITEMS_DA,
    STORAGE_KEY,
)

from .test_init import MASTER, _create, _items


async def _call(hass: HomeAssistant, service: str, data: dict, response: bool = False):
    return await hass.services.async_call(
        DOMAIN, service, data, blocking=True, return_response=response
    )


async def _data(hass: HomeAssistant, hass_ws_client) -> dict:
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": f"{DOMAIN}/data"})
    return (await client.receive_json())["result"]


async def _notification(hass: HomeAssistant, hass_ws_client) -> dict | None:
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "persistent_notification/get"})
    notifications = (await client.receive_json())["result"]
    return next((n for n in notifications if n["notification_id"] == DEFAULTS_NOTIFICATION_ID), None)


async def test_rename_list(hass: HomeAssistant, setup_entry) -> None:
    entity_id = (await _create(hass, name="Skiferie", items=["Pas"], include_always=False))["entity_id"]
    await _call(hass, "update_list", {"entity_id": entity_id, "name": "Skiferie Østrig"})
    await hass.async_block_till_done()

    # Same entity ids, new names.
    assert hass.states.get(entity_id).attributes["friendly_name"] == "Skiferie Østrig"
    assert hass.states.get("sensor.skiferie_packed").attributes["friendly_name"] == "Skiferie Østrig pakket"
    assert await hass.config_entries.async_reload(setup_entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get(entity_id).attributes["friendly_name"] == "Skiferie Østrig"


async def test_rename_in_ha_ui_is_adopted(hass: HomeAssistant, setup_entry, hass_ws_client) -> None:
    entity_id = (await _create(hass, name="Tur"))["entity_id"]
    registry = er.async_get(hass)
    registry.async_update_entity(entity_id, name="Weekendtur")
    await hass.async_block_till_done()

    (plist,) = (await _data(hass, hass_ws_client))["lists"]
    assert plist["name"] == "Weekendtur"
    assert registry.async_get(entity_id).name is None  # override handed over to the list
    assert hass.states.get(entity_id).attributes["friendly_name"] == "Weekendtur"

    # A changed entity id doesn't break anything.
    registry.async_update_entity(entity_id, new_entity_id="todo.weekend")
    await hass.async_block_till_done()
    (plist,) = (await _data(hass, hass_ws_client))["lists"]
    assert plist["entity_id"] == "todo.weekend"
    await _call(hass, "add_from_master", {"entity_id": "todo.weekend", "items": ["Pas"]})
    assert "Pas" in {i["summary"] for i in await _items(hass, "todo.weekend")}


async def test_entity_deleted_in_ha_ui_deletes_list(hass: HomeAssistant, setup_entry, hass_ws_client) -> None:
    entity_id = (await _create(hass, name="Slettes"))["entity_id"]
    registry = er.async_get(hass)
    registry.async_remove(entity_id)
    await hass.async_block_till_done()

    assert (await _data(hass, hass_ws_client))["lists"] == []
    assert registry.async_get("sensor.slettes_packed") is None
    assert hass.states.get("sensor.slettes_packed") is None


async def test_master_entity_deleted_in_ha_ui_is_recreated(hass: HomeAssistant, setup_entry) -> None:
    count = hass.states.get(MASTER).state
    er.async_get(hass).async_remove(MASTER)
    await hass.async_block_till_done()
    assert hass.states.get(MASTER).state == count


async def test_copy_list(hass: HomeAssistant, setup_entry, hass_ws_client) -> None:
    source = (await _create(hass, name="Ski", tags=["ski"], notes="Husk liftkort", use_weight=True))["entity_id"]
    items = await _items(hass, source)
    await hass.services.async_call(
        "todo", "update_item", {"item": items[0]["uid"], "status": "completed"}, target={"entity_id": source}, blocking=True
    )
    await _call(hass, "update_list", {"entity_id": source, "archived": True})

    result = await _call(hass, "copy_list", {"entity_id": source}, True)
    assert result["entity_id"] == "todo.ski_kopi"
    assert result["items"] == len(items)

    data = await _data(hass, hass_ws_client)
    lists = {plist["name"]: plist for plist in data["lists"]}
    copy = lists["Ski (kopi)"]
    assert copy["archived"] is False and lists["Ski"]["archived"] is True
    assert (copy["notes"], copy["use_weight"], copy["tags"]) == ("Husk liftkort", True, ["ski"])
    assert not any(i["packed"] for i in copy["items"])
    assert {i["uid"] for i in copy["items"]}.isdisjoint({i["uid"] for i in items})

    result = await _call(hass, "copy_list", {"entity_id": source, "name": "Ski 2028"}, True)
    assert result["entity_id"] == "todo.ski_2028"


async def test_new_defaults_in_later_release(hass: HomeAssistant, setup_entry, hass_ws_client, monkeypatch) -> None:
    # The user deletes one default item and changes another.
    uid = next(i["uid"] for i in await _items(hass, MASTER) if i["summary"] == "Bamse")
    await hass.services.async_call("todo", "remove_item", {"item": uid}, target={"entity_id": MASTER}, blocking=True)
    await _call(hass, "update_master_item", {"item": "Pas", "category": "Vigtigt"})
    assert (await _data(hass, hass_ws_client))["new_defaults"] == []
    assert await _notification(hass, hass_ws_client) is None

    # A new release adds two default items (and still has Bamse and Pas).
    monkeypatch.setattr(
        manager_module, "SEED_ITEMS_DA", [*SEED_ITEMS_DA, ("Powerbank 2", "@Elektronik"), ("Myggespray", "@Toilettaske #sommer")]
    )
    assert await hass.config_entries.async_reload(setup_entry.entry_id)
    await hass.async_block_till_done()

    pending = [i["summary"] for i in (await _data(hass, hass_ws_client))["new_defaults"]]
    assert pending == ["Powerbank 2", "Myggespray"]
    assert await _notification(hass, hass_ws_client) is not None

    # Add one, skip the rest.
    assert await _call(hass, "add_new_defaults", {"items": ["myggespray"]}, True) == {"added": 1}
    assert [i["summary"] for i in (await _data(hass, hass_ws_client))["new_defaults"]] == ["Powerbank 2"]
    await _call(hass, "skip_new_defaults", {})
    assert (await _data(hass, hass_ws_client))["new_defaults"] == []
    assert await _notification(hass, hass_ws_client) is None

    master = {i["summary"]: i for i in await _items(hass, MASTER)}
    assert "Myggespray" in master and "Powerbank 2" not in master
    assert "Bamse" not in master  # deleted defaults stay deleted
    assert master["Pas"]["description"].startswith("@Vigtigt")  # own changes kept


async def test_existing_install_gets_no_old_defaults(hass: HomeAssistant, hass_storage, hass_ws_client) -> None:
    """Data from before default tracking: today's defaults count as seen."""
    hass_storage[STORAGE_KEY] = {
        "version": 1,
        "key": STORAGE_KEY,
        "data": {"master": [{"uid": "m1", "summary": "Pas", "description": "@Dokumenter"}], "lists": []},
    }
    hass.config.language = "da"
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert (await _data(hass, hass_ws_client))["new_defaults"] == []
    assert [i["summary"] for i in await _items(hass, MASTER)] == ["Pas"]
