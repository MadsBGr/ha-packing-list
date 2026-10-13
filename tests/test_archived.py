"""An archived list is read-only, except for its notes."""

import pytest

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError

from custom_components.packing_list.const import DOMAIN

from .test_init import MASTER, _create, _items


async def _call(hass: HomeAssistant, service: str, data: dict, response: bool = False):
    return await hass.services.async_call(
        DOMAIN, service, data, blocking=True, return_response=response
    )


@pytest.fixture
async def archived(hass: HomeAssistant, setup_entry) -> str:
    entity_id = (await _create(hass, name="Gammel", items=["Pas", "Strømper"], include_always=False))["entity_id"]
    await _call(hass, "update_list", {"entity_id": entity_id, "archived": True, "notes": "Husk"})
    return entity_id


@pytest.mark.parametrize(
    ("service", "data"),
    [
        ("add_from_master", {"items": ["Bamse"]}),
        ("refresh_list", {}),
        ("reset_list", {}),
        ("add_list_item", {"item": "Kajak"}),
        ("update_list_item", {"item": "Pas", "quantity": 2}),
        ("copy_to_master", {"item": "Pas"}),
        ("update_list", {"name": "Nyt navn"}),
        ("update_list", {"use_weight": True}),
        ("update_list", {"weight_limit": 1000}),
        ("update_list", {"quantity_controls": True}),
        ("update_list", {"packed_mode": "hide"}),
    ],
)
async def test_services_refuse_changes(hass: HomeAssistant, archived: str, service: str, data: dict) -> None:
    with pytest.raises(ServiceValidationError) as err:
        await _call(hass, service, {"entity_id": archived, **data})
    assert err.value.translation_key == "list_archived"
    assert err.value.translation_placeholders == {"name": "Gammel"}


@pytest.mark.parametrize(
    ("service", "data"),
    [
        ("add_item", {"item": "Kajak"}),
        ("update_item", {"item": "Pas", "status": "completed"}),
        ("remove_item", {"item": "Pas"}),
    ],
)
async def test_todo_view_refuses_changes(hass: HomeAssistant, archived: str, service: str, data: dict) -> None:
    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call("todo", service, data, target={"entity_id": archived}, blocking=True)
    assert err.value.translation_key == "list_archived"
    assert sorted(i["summary"] for i in await _items(hass, archived)) == ["Pas", "Strømper"]


async def test_notes_restore_copy_and_delete_still_work(hass: HomeAssistant, archived: str) -> None:
    await _call(hass, "update_list", {"entity_id": archived, "notes": "Husk pas\nog nøgler"})
    assert hass.states.get(archived).attributes["notes"] == "Husk pas\nog nøgler"

    copy = (await _call(hass, "copy_list", {"entity_id": archived, "name": "Ny tur"}, True))["entity_id"]
    await _call(hass, "add_list_item", {"entity_id": copy, "item": "Kajak"})  # the copy is not archived

    # Restoring and changing settings in the same call is allowed.
    await _call(hass, "update_list", {"entity_id": archived, "archived": False, "name": "Genbrugt"})
    assert hass.states.get(archived).attributes["friendly_name"] == "Genbrugt"
    await _call(hass, "update_list", {"entity_id": archived, "archived": True})
    await _call(hass, "delete_list", {"entity_id": archived})
    await hass.async_block_till_done()
    assert hass.states.get(archived) is None


async def test_master_changes_dont_touch_archived_lists(hass: HomeAssistant, archived: str) -> None:
    await _call(hass, "update_master_item", {"item": "Pas", "category": "Vigtigt", "weight": 30})
    item = next(i for i in await _items(hass, archived) if i["summary"] == "Pas")
    assert item["description"].startswith("@Dokumenter")
    master = next(i for i in await _items(hass, MASTER) if i["summary"] == "Pas")
    assert master["description"].startswith("@Vigtigt")
