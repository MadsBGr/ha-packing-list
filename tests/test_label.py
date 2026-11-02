"""The to-do entities behind packing lists get the "PackingList" label."""

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er, label_registry as lr

from custom_components.packing_list.const import DOMAIN, PACKING_LIST_LABEL

from .test_init import MASTER, _create


def _labels(hass: HomeAssistant, entity_id: str) -> set[str]:
    labels = lr.async_get(hass)
    return {labels.async_get_label(label_id).name for label_id in er.async_get(hass).async_get(entity_id).labels}


async def test_packing_lists_get_the_label(hass: HomeAssistant, setup_entry) -> None:
    ski = (await _create(hass, name="Ski"))["entity_id"]
    beach = (await _create(hass, name="Strand"))["entity_id"]
    copy = (
        await hass.services.async_call(
            DOMAIN, "copy_list", {"entity_id": ski, "name": "Ski 2028"}, blocking=True, return_response=True
        )
    )["entity_id"]

    for entity_id in (ski, beach, copy):
        assert _labels(hass, entity_id) == {PACKING_LIST_LABEL}
    # The master list isn't a packing list.
    assert _labels(hass, MASTER) == set()
    # One label, shared by all lists.
    assert [label.name for label in lr.async_get(hass).async_list_labels()] == [PACKING_LIST_LABEL]


async def test_label_is_added_to_existing_lists_and_keeps_other_labels(hass: HomeAssistant, setup_entry) -> None:
    entity_id = (await _create(hass, name="Ski"))["entity_id"]
    labels = lr.async_get(hass)
    own = labels.async_create("Ferie")
    registry = er.async_get(hass)
    # As if the list was made before the label existed, and the user added their own label.
    registry.async_update_entity(entity_id, labels={own.label_id})
    labels.async_delete(labels.async_get_label_by_name(PACKING_LIST_LABEL).label_id)

    assert await hass.config_entries.async_reload(setup_entry.entry_id)
    await hass.async_block_till_done()
    assert _labels(hass, entity_id) == {"Ferie", PACKING_LIST_LABEL}
