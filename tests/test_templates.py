"""Tests for templates (named selections of master items)."""

import pytest

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError

from custom_components.packing_list.const import DOMAIN

from .test_init import MASTER, _create, _items


async def _call(hass: HomeAssistant, service: str, data: dict, response: bool = False):
    return await hass.services.async_call(
        DOMAIN, service, data, blocking=True, return_response=response
    )


async def _ws_templates(hass: HomeAssistant, hass_ws_client) -> list[dict]:
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": f"{DOMAIN}/data"})
    return (await client.receive_json())["result"]["templates"]


async def test_template_lifecycle(hass: HomeAssistant, setup_entry, hass_ws_client) -> None:
    result = await _call(
        hass, "create_template", {"name": "Vandretur", "items": ["Vandflaske", "Regnjakke"]}, True
    )
    assert result["items"] == 2

    # Add by tag and item, remove by name, rename.
    await _call(hass, "update_template", {"template": "vandretur", "tags": ["fly"], "items": ["Powerbank"]})
    await _call(hass, "update_template", {"template": "Vandretur", "remove_items": ["Høretelefoner"], "name": "Vandring"})

    (template,) = await _ws_templates(hass, hass_ws_client)
    assert template["name"] == "Vandring"
    master = {i["uid"]: i["summary"] for i in await _items(hass, MASTER)}
    names = {master[uid] for uid in template["items"]}
    assert names == {"Vandflaske", "Regnjakke", "Powerbank", "Pas", "Boardingkort", "Bog / e-bogslæser", "Nakkepude"}

    # Deleting a master item removes it from the template.
    uid = next(u for u, s in master.items() if s == "Powerbank")
    await hass.services.async_call("todo", "remove_item", {"item": uid}, target={"entity_id": MASTER}, blocking=True)
    (template,) = await _ws_templates(hass, hass_ws_client)
    assert uid not in template["items"]

    await _call(hass, "delete_template", {"template": "Vandring"})
    assert await _ws_templates(hass, hass_ws_client) == []


async def test_create_list_from_templates(hass: HomeAssistant, setup_entry) -> None:
    await _call(hass, "create_template", {"name": "Sommerhus", "items": ["Badetøj", "Shorts"]})
    await _call(hass, "create_template", {"name": "Bilferie", "items": ["Snacks til turen", "Badetøj"]})

    entity_id = (
        await _create(hass, name="Sommer", templates=["Sommerhus", "Bilferie"], include_always=False)
    )["entity_id"]
    summaries = sorted(i["summary"] for i in await _items(hass, entity_id))
    assert summaries == ["Badetøj", "Shorts", "Snacks til turen"]

    response = await _call(hass, "add_from_master", {"entity_id": entity_id, "templates": ["Sommerhus"]}, True)
    assert response == {"added": 0}


async def test_template_errors(hass: HomeAssistant, setup_entry) -> None:
    await _call(hass, "create_template", {"name": "Weekend"})
    with pytest.raises(ServiceValidationError):
        await _call(hass, "create_template", {"name": "weekend"})
    with pytest.raises(ServiceValidationError):
        await _call(hass, "update_template", {"template": "Findes ikke", "items": ["Pas"]})
    with pytest.raises(ServiceValidationError):
        await _create(hass, name="X", templates=["Findes ikke"])


async def test_templates_survive_reload(hass: HomeAssistant, setup_entry, hass_ws_client) -> None:
    await _call(hass, "create_template", {"name": "Ski", "tags": ["ski"]})
    assert await hass.config_entries.async_reload(setup_entry.entry_id)
    await hass.async_block_till_done()
    (template,) = await _ws_templates(hass, hass_ws_client)
    assert template["name"] == "Ski"
    assert len(template["items"]) == 6  # Skijakke, -bukser, -undertøj, Hue og vanter, Solcreme, Solbriller
