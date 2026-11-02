"""The to-do entities (master list and packing lists) get a configurable label."""

from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er, label_registry as lr

from custom_components.packing_list.const import CONF_LABEL, DEFAULT_LABEL, DOMAIN

from .test_init import MASTER, _create


def _labels(hass: HomeAssistant, entity_id: str) -> set[str]:
    labels = lr.async_get(hass)
    return {labels.async_get_label(label_id).name for label_id in er.async_get(hass).async_get(entity_id).labels}


async def _set_label(hass: HomeAssistant, entry, **user_input) -> None:
    """Save the options form; user_input without "label" is a cleared field."""
    result = await hass.config_entries.options.async_init(entry.entry_id)
    await hass.config_entries.options.async_configure(result["flow_id"], user_input)
    await hass.async_block_till_done()


async def test_packing_lists_get_the_label(hass: HomeAssistant, setup_entry) -> None:
    ski = (await _create(hass, name="Ski"))["entity_id"]
    beach = (await _create(hass, name="Strand"))["entity_id"]
    copy = (
        await hass.services.async_call(
            DOMAIN, "copy_list", {"entity_id": ski, "name": "Ski 2028"}, blocking=True, return_response=True
        )
    )["entity_id"]

    for entity_id in (MASTER, ski, beach, copy):
        assert _labels(hass, entity_id) == {DEFAULT_LABEL}
    # One label, shared by all lists.
    assert [label.name for label in lr.async_get(hass).async_list_labels()] == [DEFAULT_LABEL]


async def test_label_is_added_to_existing_lists_and_keeps_other_labels(hass: HomeAssistant, setup_entry) -> None:
    entity_id = (await _create(hass, name="Ski"))["entity_id"]
    labels = lr.async_get(hass)
    own = labels.async_create("Ferie")
    registry = er.async_get(hass)
    # As if the list was made before the label existed, and the user added their own label.
    registry.async_update_entity(entity_id, labels={own.label_id})
    labels.async_delete(labels.async_get_label_by_name(DEFAULT_LABEL).label_id)

    assert await hass.config_entries.async_reload(setup_entry.entry_id)
    await hass.async_block_till_done()
    assert _labels(hass, entity_id) == {"Ferie", DEFAULT_LABEL}


async def test_change_the_label_text(hass: HomeAssistant, setup_entry) -> None:
    ski = (await _create(hass, name="Ski"))["entity_id"]
    labels = lr.async_get(hass)
    own = labels.async_create("Ferie")
    er.async_get(hass).async_update_entity(ski, labels={*er.async_get(hass).async_get(ski).labels, own.label_id})

    await _set_label(hass, setup_entry, **{CONF_LABEL: "Rejse"})
    assert setup_entry.options[CONF_LABEL] == "Rejse"
    assert _labels(hass, MASTER) == {"Rejse"}
    assert _labels(hass, ski) == {"Rejse", "Ferie"}
    # The old label stays in Home Assistant (it may be used elsewhere); new lists get the new one.
    assert labels.async_get_label_by_name(DEFAULT_LABEL) is not None
    beach = (await _create(hass, name="Strand"))["entity_id"]
    assert _labels(hass, beach) == {"Rejse"}


async def test_no_label(hass: HomeAssistant, setup_entry) -> None:
    ski = (await _create(hass, name="Ski"))["entity_id"]
    labels = lr.async_get(hass)
    own = labels.async_create("Ferie")
    er.async_get(hass).async_update_entity(ski, labels={*er.async_get(hass).async_get(ski).labels, own.label_id})

    await _set_label(hass, setup_entry)  # the field was cleared
    assert setup_entry.options[CONF_LABEL] == ""
    assert _labels(hass, MASTER) == set()
    assert _labels(hass, ski) == {"Ferie"}

    # Also after a restart, and for new lists.
    assert await hass.config_entries.async_reload(setup_entry.entry_id)
    await hass.async_block_till_done()
    assert _labels(hass, MASTER) == set()
    beach = (await _create(hass, name="Strand"))["entity_id"]
    assert _labels(hass, beach) == set()

    # Back to the default.
    await _set_label(hass, setup_entry, **{CONF_LABEL: DEFAULT_LABEL})
    assert _labels(hass, MASTER) == _labels(hass, beach) == {DEFAULT_LABEL}
