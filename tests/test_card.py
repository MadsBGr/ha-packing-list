"""Tests for automatic dashboard resource registration."""

from pytest_homeassistant_custom_component.common import MockConfigEntry

from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component

from custom_components.packing_list.card import _resources
from custom_components.packing_list.const import CARD_URL, DOMAIN, VERSION


async def _card_resources(hass: HomeAssistant) -> list[dict]:
    resources = _resources(hass)
    assert resources is not None
    return [item for item in resources.async_items() if item["url"].startswith(CARD_URL)]


async def test_resource_registered(hass: HomeAssistant, setup_entry) -> None:
    (item,) = await _card_resources(hass)
    assert item["url"] == f"{CARD_URL}?v={VERSION}"
    assert item["type"] == "module"


async def test_manual_resource_is_reused(hass: HomeAssistant) -> None:
    assert await async_setup_component(hass, "lovelace", {})
    resources = _resources(hass)
    await resources.async_load()
    resources.loaded = True
    await resources.async_create_item({"res_type": "module", "url": CARD_URL})
    await resources.async_create_item({"res_type": "js", "url": f"{CARD_URL}?v=0.0.1"})

    entry = MockConfigEntry(domain=DOMAIN, data={}, title="Pakkelister")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    (item,) = await _card_resources(hass)
    assert item["url"] == f"{CARD_URL}?v={VERSION}"
    assert item["type"] == "module"
