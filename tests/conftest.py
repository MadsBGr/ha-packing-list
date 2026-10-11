"""Fixtures for packing_list tests."""

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from homeassistant.core import HomeAssistant

from custom_components.packing_list.const import CONF_SEED_MASTER, DOMAIN


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Enable loading custom_components in all tests."""
    return


@pytest.fixture
async def setup_entry(hass: HomeAssistant) -> MockConfigEntry:
    """Set up the integration in Danish with the seeded master list."""
    hass.config.language = "da"
    entry = MockConfigEntry(domain=DOMAIN, data={CONF_SEED_MASTER: True}, title="Pakkelister")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry
