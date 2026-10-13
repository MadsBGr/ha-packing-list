"""Upgrades: storage migration, removed service fields and existing entity ids."""

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
import voluptuous as vol

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from custom_components.packing_list.const import (
    DOMAIN,
    STORAGE_KEY,
    STORAGE_VERSION,
    UNIQUE_ID_ACTIVE,
    UNIQUE_ID_MASTER,
    UNIQUE_ID_REMAINING,
)
from custom_components.packing_list.manager import PackingListManager

from .test_init import _create, _items


async def test_storage_migration_from_v1(hass: HomeAssistant, hass_storage) -> None:
    hass_storage[STORAGE_KEY] = {
        "version": 1,
        "minor_version": 1,
        "key": STORAGE_KEY,
        "data": {
            "master": [{"uid": "m1", "summary": "Pas", "description": "@Dokumenter"}],
            "lists": [{"list_id": "l1", "name": "Gammel", "trip_date": "2025-07-01", "items": []}],
        },
    }
    hass.config.language = "da"
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get("todo.gammel") is not None

    await entry.runtime_data.async_flush()
    stored = hass_storage[STORAGE_KEY]
    assert stored["version"] == STORAGE_VERSION == 2
    (plist,) = stored["data"]["lists"]
    assert "trip_date" not in plist
    assert stored["data"]["master"][0]["summary"] == "Pas"


@pytest.mark.parametrize(
    ("service", "field"),
    [
        ("create_list", "trip_date"),
        ("add_list_item", "add_to_master"),
        ("update_list_item", "update_master"),
    ],
)
async def test_removed_fields_are_rejected(hass: HomeAssistant, setup_entry, service: str, field: str) -> None:
    """Fields removed in 1.0 give a clear error instead of being silently ignored."""
    entity_id = (await _create(hass, name="Tur", items=["Pas"], include_always=False))["entity_id"]
    data = {"create_list": {"name": "X"}, "add_list_item": {"entity_id": entity_id, "item": "Kajak"},
            "update_list_item": {"entity_id": entity_id, "item": "Pas"}}[service]
    with pytest.raises(vol.Invalid):
        await hass.services.async_call(DOMAIN, service, {**data, field: True}, blocking=True)


async def test_save_to_master(hass: HomeAssistant, setup_entry) -> None:
    entity_id = (await _create(hass, name="Tur", include_always=False))["entity_id"]
    await hass.services.async_call(
        DOMAIN, "add_list_item",
        {"entity_id": entity_id, "item": "Kajak", "save_to_master": True},
        blocking=True,
    )
    await hass.services.async_call(
        DOMAIN, "update_list_item",
        {"entity_id": entity_id, "item": "Kajak", "weight": 15000, "save_to_master": True},
        blocking=True,
    )
    manager: PackingListManager = setup_entry.runtime_data
    assert next(m for m in manager.master if m.summary == "Kajak").weight == 15000


@pytest.mark.parametrize("language", ["da", "en", "de"])
async def test_entity_ids_are_english_for_new_installs(hass: HomeAssistant, language: str) -> None:
    hass.config.language = language
    entry = MockConfigEntry(domain=DOMAIN, data={"seed_master": True})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await _create(hass, name="Ski", include_always=False)
    for entity_id in (
        "todo.packing_list_master",
        "select.packing_list_active",
        "sensor.packing_list_remaining",
        "todo.ski",
        "sensor.ski_packed",
        "binary_sensor.ski_done",
    ):
        assert hass.states.get(entity_id) is not None, entity_id


async def test_existing_entity_ids_are_kept(hass: HomeAssistant) -> None:
    """Entity ids created by earlier versions (Danish) don't change on upgrade."""
    hass.config.language = "da"
    entry = MockConfigEntry(domain=DOMAIN, data={"seed_master": True})
    entry.add_to_hass(hass)
    registry = er.async_get(hass)
    for domain, unique_id, object_id in (
        ("todo", UNIQUE_ID_MASTER, "pakkeliste_master"),
        ("select", UNIQUE_ID_ACTIVE, "pakkeliste_aktiv"),
        ("sensor", UNIQUE_ID_REMAINING, "pakkeliste_mangler"),
    ):
        registry.async_get_or_create(
            domain, DOMAIN, unique_id, suggested_object_id=object_id, config_entry=entry
        )
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    for entity_id in ("todo.pakkeliste_master", "select.pakkeliste_aktiv", "sensor.pakkeliste_mangler"):
        assert hass.states.get(entity_id) is not None, entity_id
    assert hass.states.get("todo.packing_list_master") is None
