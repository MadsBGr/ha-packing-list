"""Constants for the Packing List integration."""

DOMAIN = "packing_list"
VERSION = "0.8.0"

STORAGE_KEY = f"{DOMAIN}.storage"
STORAGE_VERSION = 1

CONF_SEED_MASTER = "seed_master"

# Key used for the master list in the manager's listener registry.
MASTER_KEY = "master"

# Items tagged with this are included in new lists when include_always is set.
ALWAYS_TAG = "altid"

SIGNAL_LIST_ADDED = f"{DOMAIN}_list_added"

UNIQUE_ID_MASTER = f"{DOMAIN}_master"
UNIQUE_ID_LIST_PREFIX = f"{DOMAIN}_list_"

CARD_URL = f"/{DOMAIN}/packing-list-card.js"

# Starter master list: (summary, description with @category and #tags).
SEED_ITEMS: list[tuple[str, str]] = [
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
