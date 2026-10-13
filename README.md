# Packing Lists for Home Assistant

[![HACS](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz/)
[![Validate](https://github.com/MadsBGr/ha-packing-list/actions/workflows/validate.yaml/badge.svg)](https://github.com/MadsBGr/ha-packing-list/actions/workflows/validate.yaml)

Plan your packing once, and reuse it for every trip.

- **One master list** holds everything you might ever pack, sorted into **categories** (Clothes, Toiletries,
  Electronics …) and marked with **tags** (`#ski`, `#beach`, `#flight` …).
- **A new packing list in seconds:** pick the tags for the trip, and every matching item is added. Items
  tagged `#always` come along automatically.
- **Going somewhere similar again?** Copy an old packing list, active or archived, and start from there.
- **Every list is your own:** add, remove or adjust items on one trip without touching the master list or
  your other lists.
- **Quantities:** note how many you need, like "5× Socks". A default quantity on the master list carries
  over to new lists.
- **Know what you'll carry:** add a weight to items, and see the total per category and for the whole list.
  You can set a weight limit, such as 23 kg for a suitcase, and get a warning if you go over it.
- **Easy to maintain:** add many items at once, change a category or tag in one place, and save a new item
  from a trip straight to the master list.

Check things off as you pack. Every packing list is a regular Home Assistant to-do list, so it also works
in the app and with Assist.

The card and all texts follow your Home Assistant language: Danish or English (English for any other language).

**Contents:** [Getting started](#getting-started) · [How to use it](#how-to-use-it) ·
[The card](#the-card) · [Settings](#settings) · [Use in Home Assistant](#use-in-the-rest-of-home-assistant) ·
[Good to know](#good-to-know) · [Troubleshooting](#troubleshooting) · [Advanced](#advanced)

---

## Getting started

1. **Install:** In HACS, search for **Packing Lists** and download it. If it isn't listed yet, add
   `https://github.com/MadsBGr/ha-packing-list` under HACS → ⋮ → **Custom repositories** (type
   **Integration**) first. Restart Home Assistant.
2. **Add the integration:** **Settings → Devices & services → Add integration → Packing Lists**.
   Tick "Start with a suggested master list" to get a ready-made list to build on.
3. **Add the card** to a dashboard and reload the browser once (Ctrl+Shift+R):
   ```yaml
   type: custom:packing-list-card
   ```

## How to use it

| | What you do | Where |
|---|---|---|
| 1 | **Build your master list.** Add items (many at a time if you like) with a category (e.g. *Clothes*) and tags (e.g. `#ski`, `#summer`). | **Master** tab |
| 2 | **Create a packing list** with a name, optional notes and the tags the trip is about. Items with those tags are added automatically, and so are items tagged `#always`. | **+ New list** |
| 3 | **Adjust the list.** Tick or untick individual items, or add something just for this trip. | **Pick from master** tab and the bottom of the **Pack** tab |
| 4 | **Pack.** Tap an item when it's in the bag. | **Pack** tab |
| 5 | **After the trip:** archive the list, or copy it for next time. | Buttons next to the list picker |

## The card

**At the top** you pick a list. The buttons next to the list picker:
- **+ New list** creates a list.
- **✏️ List settings:** name, notes, weight and weight limit, quantity buttons, and how packed items are shown.
- **⧉** copies the list; this also works for archived lists.
- **Archive / restore** moves the list to and from the archive. An archived list is **read-only** –
  only its notes can be changed (click them to edit). Copy it, or restore it, to change the rest.
- **🗑** deletes the list.

**Pack**
- Tap an item to mark it as packed.
- With **quantity buttons** turned on for the list, − and + change the quantity right there.
- Packed items stay in their category, move to the bottom under **Packed**, or are hidden – set per list
  under **✏️ List settings**.
- **Fetch again** adds new master items that match the list's tags.
- **Delete items** lets you select several items and delete them at once.
- **Uncheck all** marks the whole list as not packed, e.g. for the trip home.
- At the bottom you add an item just for this trip. With the adjust button you can also give it a
  category and tags and save it to the master list.

**Pick from master**
- Tick what should come along.
- **+ #tag** adds every item with that tag.
- **add all** adds a whole category.

**Master**
- Add one or more items at a time, one per line. They all get the same category and tags.
- **✏️** next to an item edits its name, category, tags, quantity and weight.
- **🗑** deletes the item.
- At the bottom you can reset the master list to the default list. This asks for confirmation.

When you type a category or a tag, existing ones are suggested. A new one is simply created.

## Settings

Under **Settings → Devices & services → Packing Lists → Configure** you choose what a new list starts with:

- **Include items tagged #always**
- **Use weight**
- **Show quantity buttons on the card** – − and + next to each item, so you can change quantities without
  opening the item
- **How packed items are shown** – in their category, together at the bottom, or hidden
- **Tags selected in advance** when you press "+ New list"
- **Default weight limit** in kg, e.g. 23 for a suitcase or 8 for hand luggage

These are only the starting point: every list can change them under **✏️ List settings**.

## Use in the rest of Home Assistant

| Entity | What it shows |
|---|---|
| `select.packing_list_active` | The **active packing list**. The card opens it, and picking a list in the card makes it active. You can also change it from an automation. |
| `sensor.packing_list_remaining` | How many items are still **missing** on the active list. The attributes `items` and `categories` hold their names, for a tablet, a notification or a watch. |
| `binary_sensor.<list>_done` | **On** when everything on the list is packed. |
| `sensor.<list>_packed` | Percentage of the list that is packed. |

The entity ids are the same in every language; only the displayed names are translated. (Entities
created before version 0.14 keep the ids they got then, e.g. `select.pakkeliste_aktiv` with Danish as
language – rename them under *Settings → Entities* if you like.)

Example notification with what's missing:

```yaml
action: notify.mobile_app_phone
data:
  message: >
    Still missing: {{ state_attr('sensor.packing_list_remaining', 'items') | join(', ') }}
```

## Good to know

<details><summary><b>Tags and <code>#always</code></b></summary>

- **Tags** are used to pull items onto a list, e.g. `#ski`, `#flight` or `#kids`.
- **`#always`** (or the Danish `#altid`) means the item is added to every new list.
- **In the to-do view** category and tags live in the item's description as `@Clothes #summer #beach`.
  That way they can also be edited in Home Assistant's own to-do view. Use `_` instead of spaces in a
  category.
</details>

<details><summary><b>Fetch again and deleted items</b></summary>

A packing list remembers which tags and categories it was filled with, and which items you deleted from it.
**Fetch again** adds new matching items. If some of them were deleted from the list before, you are asked
whether they should come back too.
</details>

<details><summary><b>The same name in several categories</b></summary>

A name can exist once per category, e.g. "Teddy bear" under both *Kids* and *Toys*. If you add a name that
already exists in another category, the card asks whether to move it, create a new item or keep it.
</details>

<details><summary><b>Quantity, weight and weight limit</b></summary>

- **Quantity** is optional and shown as "5× Socks". The quantity on a master item is the default when the
  item is added to a list. Turn on **quantity buttons** to change it with − and + directly on the card.
- **Weight** is in grams per piece; you can also type `1.2 kg`. Turn on **Use weight** on a list to see the
  weight per item, per category and in total.
- **Weight limit:** a list that uses weight can have a limit in kg. The card shows the limit next to the
  total weight and warns in red when it is exceeded.
</details>

<details><summary><b>New default items in an update</b></summary>

Your master list is your own. An update through HACS never changes it.

If a new version adds items to the default list, you get a notification in Home Assistant, and the
**Master** tab shows the items with two choices: **Add to my master** or **Skip**. Your own changes, and
default items you have deleted, are left alone.
</details>

<details><summary><b>Renaming, moving or deleting in Home Assistant</b></summary>

- **Rename in the card:** the new name is shown everywhere in Home Assistant. The entity id stays the same.
- **Rename in Home Assistant:** if you rename a packing list under *Settings → Entities*, the list gets
  that name in the card too.
- **New entity id:** if you change a list's entity id, the card and the actions keep working.
- **Delete a list's entity in Home Assistant:** the list is deleted cleanly, including its sensors.
- **Delete the master entity:** it is recreated, because the integration needs it.
</details>

<details><summary><b>Language</b></summary>

The card, names and error messages follow the language in your Home Assistant profile. Danish and English
are supported; any other language falls back to English. The default list is created in the language
Home Assistant has at the first installation.
</details>

<details><summary><b>Where is the data stored?</b></summary>

Locally in Home Assistant's own storage (`.storage/packing_list.storage`), which is included in your
backups. There is no cloud and there are no external dependencies.
</details>

## Troubleshooting

- **"Custom element doesn't exist: packing-list-card":** reload the browser with Ctrl+Shift+R. In the
  companion app, clear the frontend cache under Settings → Companion app → Troubleshooting. The integration
  adds the resource `/packing_list/packing-list-card.js` under Dashboards → Resources by itself.
- **Dashboards in YAML mode:** add the resource yourself:
  ```yaml
  lovelace:
    resources:
      - url: /packing_list/packing-list-card.js
        type: module
  ```
- **After an update** the card reloads the page by itself the first time you open the dashboard.

## Advanced

<details><summary><b>Card options</b></summary>

```yaml
type: custom:packing-list-card
title: Packing list        # optional heading
entity: todo.ski_trip      # optional: always show this list (instead of the active one)
default_tab: pack          # pack | pick | master
packed_mode: bottom        # inline | bottom | hide – overrides the list's own setting on this card
```
</details>

<details><summary><b>Entities and attributes</b></summary>

| Entity | State | Attributes |
|---|---|---|
| `todo.packing_list_master` | number of items | |
| `todo.<list>` | number of items not packed | `total`, `packed`, `notes`, `archived`, and with weight `total_weight`, `packed_weight`, `weight_limit` (grams), `over_weight_limit` |
| `sensor.<list>_packed` | % packed | `packed`, `total`, `remaining`, and with weight as above |
| `binary_sensor.<list>_done` | `on` when everything is packed | |
| `select.packing_list_active` | name of the active list | `entity_id` (the list's to-do entity) |
| `sensor.packing_list_remaining` | number of missing items on the active list | `list`, `entity_id`, `items`, `categories` (names per category; `""` = no category), `packed`, `total` |

The standard `todo.*` actions (`add_item`, `update_item`, `remove_item`, `get_items`) work on every list.
</details>

<details><summary><b>Actions</b></summary>

**Lists**

| Action | What it does |
|---|---|
| `packing_list.create_list` | Creates a list: `name`, optional `notes`, `tags`, `categories`, `items`, `include_always`, `use_weight`, `weight_limit` (grams), `quantity_controls` and `packed_mode` (`inline`, `bottom` or `hide`). The last five use the integration's settings when left out. |
| `packing_list.update_list` | Renames (`name`) or changes `notes`, `use_weight`, `weight_limit` (empty removes it), `quantity_controls`, `packed_mode` and `archived`. |
| `packing_list.copy_list` | Copies a list. Optional `name`; otherwise the copy is called "<name> (copy)". |
| `packing_list.delete_list` | Deletes the list and its entities. |
| `packing_list.set_active_list` | Makes the list `entity_id` the active one. Without `entity_id` the active list is cleared. |
| `packing_list.reset_list` | Unchecks every item. |
| `packing_list.add_from_master` | Adds items by `tags`, `categories` or `items`. With `include_excluded: true` deleted items come back too. |
| `packing_list.refresh_list` | Fetch again. With `include_excluded: true` deleted items come back too. |
| `packing_list.add_list_item` | Adds an item with optional `category`, `tags`, `quantity` and `weight`. With `save_to_master: true` it is also saved to the master list. |
| `packing_list.update_list_item` | Changes `quantity` and `weight` of an item. With `save_to_master: true` the weight is also saved to the master list. |
| `packing_list.copy_to_master` | Saves an item from the list to the master list. |

**Master list**

| Action | What it does |
|---|---|
| `packing_list.add_master_items` | Adds items (`items`, one per line) with a shared `category` and `tags`. `move` and `duplicate` control items that exist in another category. |
| `packing_list.update_master_item` | Changes `name`, `category`, `tags`, `quantity` and `weight` of `item` (name or uid). |
| `packing_list.add_new_defaults` | Adds new default items from a newer version: all, or those in `items`. |
| `packing_list.skip_new_defaults` | Skips new default items. |
| `packing_list.reset_master` | Replaces the whole master list with the default list. |

Example:

```yaml
action: packing_list.create_list
data:
  name: Ski trip
  tags: [ski, winter]
  notes: Remember the lift pass
```
</details>

<details><summary><b>Development</b></summary>

```bash
pip install -r requirements_test.txt
pytest          # the integration
npm install
npm test        # the card
```
</details>

## License

MIT
