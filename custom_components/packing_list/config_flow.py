"""Config flow and options (defaults for new lists) for the Packing List integration."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers.selector import (
    BooleanSelector,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectSelector,
    SelectSelectorConfig,
)

from .const import (
    CONF_DEFAULT_TAGS,
    CONF_INCLUDE_ALWAYS,
    CONF_QUANTITY_CONTROLS,
    CONF_SEED_MASTER,
    CONF_USE_WEIGHT,
    CONF_WEIGHT_LIMIT,
    DOMAIN,
    NAMES,
    language,
)


class PackingListConfigFlow(ConfigFlow, domain=DOMAIN):
    """Single-instance config flow."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> PackingListOptionsFlow:
        """Defaults for new lists."""
        return PackingListOptionsFlow()

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Ask whether to start with a suggested master list."""
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        if user_input is not None:
            title = NAMES[language(self.hass.config.language)]["title"]
            return self.async_create_entry(title=title, data=user_input)
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {vol.Required(CONF_SEED_MASTER, default=True): bool}
            ),
        )


class PackingListOptionsFlow(OptionsFlow):
    """Defaults used when a new packing list is created."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """One form with all defaults."""
        if user_input is not None:
            return self.async_create_entry(data=user_input)

        options = self.config_entry.options
        manager = getattr(self.config_entry, "runtime_data", None)
        tags = sorted(
            {tag for item in (manager.master if manager else []) for tag in item.tags}
            - {"altid", "always"}
        )
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        CONF_INCLUDE_ALWAYS, default=options.get(CONF_INCLUDE_ALWAYS, True)
                    ): BooleanSelector(),
                    vol.Required(
                        CONF_USE_WEIGHT, default=options.get(CONF_USE_WEIGHT, False)
                    ): BooleanSelector(),
                    vol.Required(
                        CONF_QUANTITY_CONTROLS, default=options.get(CONF_QUANTITY_CONTROLS, False)
                    ): BooleanSelector(),
                    vol.Optional(
                        CONF_DEFAULT_TAGS, default=options.get(CONF_DEFAULT_TAGS, [])
                    ): SelectSelector(
                        SelectSelectorConfig(options=tags, multiple=True, custom_value=True)
                    ),
                    vol.Optional(
                        CONF_WEIGHT_LIMIT, default=options.get(CONF_WEIGHT_LIMIT, 0)
                    ): NumberSelector(
                        NumberSelectorConfig(
                            min=0, max=500, step=0.5, unit_of_measurement="kg", mode=NumberSelectorMode.BOX
                        )
                    ),
                }
            ),
        )
