# Pakkelister for Home Assistant

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz/)
[![Validate](https://github.com/MadsBGr/ha-packing-list/actions/workflows/validate.yaml/badge.svg)](https://github.com/MadsBGr/ha-packing-list/actions/workflows/validate.yaml)

En HACS-integration med en **master-pakkeliste** over alt, hvad du nogensinde kunne finde på at pakke, og
**pakkelister til hver tur**, som du nemt fylder fra masteren. Hver pakkeliste er en almindelig
to-do-liste i Home Assistant. Du kan krydse af undervejs og se, hvad der er pakket, både i det
medfølgende kort, i den indbyggede to-do-visning, i appen og via Assist.

*English summary: A master packing list plus per-trip packing lists built from it by tag, category or
hand-picked items. Every list is a native `todo` entity, and a bundled Lovelace card handles picking
and packing.*

## Funktioner

- **Master-liste** (`todo.pakkeliste_master`) med kategorier og tags. Du kan starte med en foreslået liste.
- **Pakkelister pr. tur** oprettes med ét klik eller én tjeneste. Hver liste bliver sin egen
  `todo`-entitet plus en `sensor` med hvor mange procent der er pakket.
- **Hent fra master** efter tags (`#ski`, `#fly` …), kategori eller enkeltvis. Punkter med `#altid`
  kommer automatisk med. Dubletter springes over.
- **Ekstra punkter** kan tilføjes til en enkelt tur uden at røre masteren.
- **Nulstil** sætter en liste til "ikke pakket", så den kan genbruges til hjemrejsen.
- **Medfølgende Lovelace-kort** med tre faner: *Pak*, *Vælg fra master* og *Master*. Kortet indlæses
  automatisk, så du ikke skal sætte en ressource op.
- Alt gemmes lokalt i `.storage`. Der er ingen cloud og ingen eksterne afhængigheder.

## Installation

### HACS (anbefalet)

1. HACS → ⋮ → **Brugerdefinerede repositories** → tilføj `https://github.com/MadsBGr/ha-packing-list`
   med typen **Integration**.
2. Søg efter **Pakkelister**, installer den og genstart Home Assistant.
3. **Indstillinger → Enheder & tjenester → Tilføj integration → Pakkelister**. Vælg, om du vil starte med
   den foreslåede master-liste.

### Manuelt

Kopiér `custom_components/packing_list` til `config/custom_components/` og genstart.

## Kortet

```yaml
type: custom:packing-list-card
title: Pakkeliste            # valgfri
entity: todo.skiferie_2027   # valgfri: den liste, der vises først
default_tab: pack            # valgfri: pack | pick | master
```

| Fane | Hvad du gør |
|---|---|
| **Pak** | Tryk på et punkt for at markere det som pakket. Skjul pakkede punkter, nulstil, tilføj ekstra punkter. |
| **Vælg fra master** | Sæt flueben ved det, der skal med. "+ #tag" henter alle punkter med et tag, "tilføj alle" henter en hel kategori. |
| **Master** | Tilføj og slet punkter i masteren med kategori og tags. |

Med **+ Ny liste** opretter du en tur med navn, dato og de tags, der skal hentes.

## Kategorier og tags

Kategori og tags gemmes i punktets **beskrivelse**, så de også kan redigeres i den almindelige to-do-visning:

```
@Tøj #sommer #strand  husk den blå
```

- `@Kategori` giver én kategori pr. punkt. Brug `_` i stedet for mellemrum, f.eks. `@Personlig_pleje`.
- `#tag` kan bruges flere gange. `#altid` betyder, at punktet kommer med på alle nye lister.
- Resten af teksten vises som en note.

Når et punkt kopieres til en tur, følger beskrivelsen med, så kategorierne også gælder på turlisten.

> Punkter på master-listen kan ikke markeres som udført. Afkrydsning ignoreres med vilje, så knappen
> "Fjern udførte" i to-do-visningen ikke kan tømme masteren.

## Tjenester

| Tjeneste | Beskrivelse |
|---|---|
| `packing_list.create_list` | Opret en liste: `name`, valgfrit `trip_date`, `tags`, `categories`, `items` og `include_always` (standard `true`). Returnerer `entity_id`. |
| `packing_list.add_from_master` | Tilføj fra master til `entity_id` efter `tags`, `categories` eller `items` (navn eller uid). |
| `packing_list.reset_list` | Markér alle punkter som ikke pakket. |
| `packing_list.delete_list` | Slet listen og dens entiteter. |

De almindelige `todo.*`-tjenester (`add_item`, `update_item`, `remove_item`, `get_items`) virker på både
masteren og turlisterne.

### Eksempler

```yaml
# Script: opret en skiferie-liste
action: packing_list.create_list
data:
  name: Skiferie 2027
  trip_date: "2027-02-06"
  tags: [ski, vinter]
response_variable: result
```

```yaml
# Automation: påmindelse aftenen før afrejse, hvis der mangler noget
triggers:
  - trigger: time
    at: "19:00:00"
conditions:
  - condition: template
    value_template: >
      {{ state_attr('todo.skiferie_2027', 'trip_date') == (now() + timedelta(days=1)).date() | string
         and states('sensor.skiferie_2027_pakket') | int < 100 }}
actions:
  - action: notify.mobile_app_telefon
    data:
      message: "Du mangler stadig at pakke {{ states('todo.skiferie_2027') }} ting til skiferien"
```

## Entiteter

| Entitet | Tilstand | Attributter |
|---|---|---|
| `todo.pakkeliste_master` | antal punkter | `packing_list_id`, `revision` |
| `todo.<tur>` | antal punkter, der ikke er pakket | `trip_date`, `total`, `packed`, `packing_list_id`, `revision` |
| `sensor.<tur>_pakket` | % pakket | `packed`, `total`, `remaining` |

## Udvikling

```bash
pip install -r requirements_test.txt
pytest
```

## Idéer til næste version

- Omdøb og arkivér lister, og kopiér en tidligere tur.
- Mængder pr. punkt (f.eks. "T-shirts × antal dage").
- Redigering af master-punkter direkte i kortet.
- Skabeloner ("Weekend i sommerhus" = et gemt sæt af tags og punkter).

## Licens

MIT
