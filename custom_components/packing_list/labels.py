"""The label put on the integration's to-do entities (master list and packing lists)."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er, label_registry as lr

from .const import CONF_LABEL, DEFAULT_LABEL


def label_name(options: Mapping[str, Any]) -> str:
    """The configured label text; "" means no label."""
    return (options.get(CONF_LABEL, DEFAULT_LABEL) or "").strip()


@callback
def async_add_label(hass: HomeAssistant, entity_id: str, name: str) -> None:
    """Add the label to an entity, creating the label if needed. Other labels are kept."""
    if not name:
        return
    registry = er.async_get(hass)
    entry = registry.async_get(entity_id)
    if entry is None:
        return
    labels = lr.async_get(hass)
    label = labels.async_get_label_by_name(name) or labels.async_create(name, icon="mdi:bag-suitcase")
    if label.label_id not in entry.labels:
        registry.async_update_entity(entity_id, labels={*entry.labels, label.label_id})


@callback
def async_relabel(hass: HomeAssistant, entry: ConfigEntry, old: str, new: str) -> None:
    """Move the integration's to-do entities from the old label to the new one ("" = none).

    The old label itself is left in Home Assistant, as it may be used elsewhere.
    """
    registry = er.async_get(hass)
    old_label = lr.async_get(hass).async_get_label_by_name(old) if old else None
    for entity in er.async_entries_for_config_entry(registry, entry.entry_id):
        if entity.domain != "todo":
            continue
        if old_label is not None and old_label.label_id in entity.labels:
            registry.async_update_entity(
                entity.entity_id, labels=set(entity.labels) - {old_label.label_id}
            )
        async_add_label(hass, entity.entity_id, new)
