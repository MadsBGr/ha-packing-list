"""Language handling: names, default master list and translated errors."""

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError

from custom_components.packing_list.const import (
    CONF_SEED_MASTER,
    DOMAIN,
    SEED_ITEMS_EN,
    language,
)

from .test_init import MASTER, _create, _items


def test_language_fallback() -> None:
    assert language("da") == "da"
    assert language("da-DK") == "da"
    assert language("en-GB") == "en"
    assert language("de") == "en"
    assert language(None) == "en"


async def test_english_install(hass: HomeAssistant) -> None:
    hass.config.language = "de"  # unsupported -> English
    entry = MockConfigEntry(domain=DOMAIN, data={CONF_SEED_MASTER: True})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    master = "todo.packing_list_master"
    assert hass.states.get(master).state == str(len(SEED_ITEMS_EN))
    items = {i["summary"]: i for i in await _items(hass, master)}
    assert items["Underwear"]["description"] == "@Clothes #always"

    # #always works like #altid for include_always.
    entity_id = (await _create(hass, name="Trip"))["entity_id"]
    assert "Underwear" in {i["summary"] for i in await _items(hass, entity_id)}
    assert hass.states.get("sensor.trip_packed") is not None


async def test_existing_master_is_never_reseeded(hass: HomeAssistant, setup_entry) -> None:
    """An update/restart (or a language change) must not touch the stored master list."""
    uids = [i["uid"] for i in await _items(hass, MASTER)]
    await hass.services.async_call("todo", "remove_item", {"item": uids}, target={"entity_id": MASTER}, blocking=True)
    await hass.services.async_call(
        DOMAIN, "add_master_items", {"items": ["Min egen ting"]}, blocking=True
    )

    hass.config.language = "en"
    assert await hass.config_entries.async_reload(setup_entry.entry_id)
    await hass.async_block_till_done()

    # Same entity id, same single item, nothing English added.
    assert [i["summary"] for i in await _items(hass, MASTER)] == ["Min egen ting"]
    assert hass.states.get(MASTER).attributes["friendly_name"] == "Packing list master"


async def test_translated_errors(hass: HomeAssistant, setup_entry) -> None:
    with pytest.raises(ServiceValidationError) as err:
        await hass.services.async_call(
            DOMAIN, "update_master_item", {"item": "Findes ikke", "tags": ["x"]}, blocking=True
        )
    assert err.value.translation_key == "master_item_not_found"
    assert err.value.translation_placeholders == {"item": "Findes ikke"}
