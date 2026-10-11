"""Constants for the Packing List integration."""

DOMAIN = "packing_list"
VERSION = "0.9.0"

STORAGE_KEY = f"{DOMAIN}.storage"
STORAGE_VERSION = 1

CONF_SEED_MASTER = "seed_master"

# Key used for the master list in the manager's listener registry.
MASTER_KEY = "master"

# Items tagged with one of these are included in new lists when include_always is set.
# Both work regardless of language, so a list keeps working if the HA language changes.
ALWAYS_TAGS = ("altid", "always")

SIGNAL_LIST_ADDED = f"{DOMAIN}_list_added"

UNIQUE_ID_MASTER = f"{DOMAIN}_master"
UNIQUE_ID_LIST_PREFIX = f"{DOMAIN}_list_"

CARD_URL = f"/{DOMAIN}/packing-list-card.js"

# Names chosen from the Home Assistant language; anything but Danish is English.
NAMES = {
    "da": {"title": "Pakkelister", "master": "Pakkeliste master", "progress": "{name} pakket"},
    "en": {"title": "Packing lists", "master": "Packing list master", "progress": "{name} packed"},
}


def language(hass_language: str | None) -> str:
    """Supported language code for a Home Assistant language ("da-DK" -> "da")."""
    code = (hass_language or "").lower().split("-")[0]
    return code if code in NAMES else "en"

# Starter master lists: (summary, description with @category and #tags).
# Only used on first installation (no stored data) and by "reset to default".
SEED_ITEMS_EN: list[tuple[str, str]] = [
    ("T-shirts", "@Clothes"),
    ("Underwear", "@Clothes #always"),
    ("Socks", "@Clothes #always"),
    ("Trousers", "@Clothes"),
    ("Sweater / fleece", "@Clothes"),
    ("Pyjamas", "@Clothes #always"),
    ("Rain jacket", "@Clothes"),
    ("Swimwear", "@Clothes #summer #beach"),
    ("Shorts", "@Clothes #summer"),
    ("Ski jacket", "@Clothes #ski"),
    ("Ski pants", "@Clothes #ski"),
    ("Thermal underwear", "@Clothes #ski"),
    ("Hat and gloves", "@Clothes #winter #ski"),
    ("Toothbrush", "@Toiletries #always"),
    ("Toothpaste", "@Toiletries #always"),
    ("Deodorant", "@Toiletries #always"),
    ("Shampoo", "@Toiletries"),
    ("Sunscreen", "@Toiletries #summer #beach #ski"),
    ("Medicine", "@Toiletries #always"),
    ("Band-aids", "@Toiletries"),
    ("Phone charger", "@Electronics #always"),
    ("Power bank", "@Electronics"),
    ("Headphones", "@Electronics #flight"),
    ("Plug adapter", "@Electronics #abroad"),
    ("Passport", "@Documents #abroad #flight"),
    ("Health insurance card", "@Documents #always"),
    ("Driver's license", "@Documents"),
    ("Boarding pass", "@Documents #flight"),
    ("Travel insurance", "@Documents #abroad"),
    ("Sunglasses", "@Misc #summer #ski"),
    ("Water bottle", "@Misc"),
    ("Snacks for the trip", "@Misc"),
    ("Book / e-reader", "@Misc #flight"),
    ("Neck pillow", "@Misc #flight"),
    ("Diapers", "@Kids #kids"),
    ("Pacifiers", "@Kids #kids"),
    ("Teddy bear", "@Kids #kids"),
]

SEED_ITEMS_DA: list[tuple[str, str]] = [
    ("T-shirts", "@Tøj"),
    ("Undertøj", "@Tøj #altid"),
    ("Strømper", "@Tøj #altid"),
    ("Bukser", "@Tøj"),
    ("Sweater / fleece", "@Tøj"),
    ("Nattøj", "@Tøj #altid"),
    ("Regnjakke", "@Tøj"),
    ("Badetøj", "@Tøj #sommer #strand"),
    ("Shorts", "@Tøj #sommer"),
    ("Skijakke", "@Tøj #ski"),
    ("Skibukser", "@Tøj #ski"),
    ("Skiundertøj", "@Tøj #ski"),
    ("Hue og vanter", "@Tøj #vinter #ski"),
    ("Tandbørste", "@Toilettaske #altid"),
    ("Tandpasta", "@Toilettaske #altid"),
    ("Deodorant", "@Toilettaske #altid"),
    ("Shampoo", "@Toilettaske"),
    ("Solcreme", "@Toilettaske #sommer #strand #ski"),
    ("Medicin", "@Toilettaske #altid"),
    ("Plaster", "@Toilettaske"),
    ("Telefonoplader", "@Elektronik #altid"),
    ("Powerbank", "@Elektronik"),
    ("Høretelefoner", "@Elektronik #fly"),
    ("Stikadapter", "@Elektronik #udland"),
    ("Pas", "@Dokumenter #udland #fly"),
    ("Sundhedskort", "@Dokumenter #altid"),
    ("Kørekort", "@Dokumenter"),
    ("Boardingkort", "@Dokumenter #fly"),
    ("Rejseforsikring", "@Dokumenter #udland"),
    ("Solbriller", "@Diverse #sommer #ski"),
    ("Vandflaske", "@Diverse"),
    ("Snacks til turen", "@Diverse"),
    ("Bog / e-bogslæser", "@Diverse #fly"),
    ("Nakkepude", "@Diverse #fly"),
    ("Bleer", "@Børn #børn"),
    ("Sutter", "@Børn #børn"),
    ("Bamse", "@Børn #børn"),
]
