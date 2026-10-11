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
- **Slette-tilstand:** Markér et eller flere punkter på en pakkeliste og slet dem på én gang.
- **Ret master-punkter:** Navn, kategori og tags kan rettes. Ændringer i kategori og tags slår også igennem
  på pakkelisterne.
- **Nulstil** sætter en liste til "ikke pakket", så den kan genbruges til hjemrejsen.
- **Medfølgende Lovelace-kort** med tre faner: *Pak*, *Vælg fra master* og *Master*.
  Alt er sorteret alfabetisk inden for hver kategori. Integrationen
  opretter selv kortets ressource under Dashboards → Ressourcer.
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

Integrationen tilføjer automatisk `/packing_list/packing-list-card.js` som ressource (JavaScript-modul)
og opdaterer versionsnummeret ved hver opdatering. Efter den første installation skal browseren genindlæses
én gang (Ctrl+Shift+R). Ved senere opdateringer opdager kortet selv, at Home Assistant kører en nyere
version, og genindlæser siden automatisk, så snart dashboardet med kortet vises.

> Bruger du dashboards i **YAML-tilstand**, kan integrationen ikke ændre ressourcerne. Så skal du selv
> tilføje `/packing_list/packing-list-card.js` med `type: module` under `lovelace: resources:`.

```yaml
type: custom:packing-list-card
title: Pakkeliste            # valgfri
entity: todo.skiferie_2027   # valgfri: den liste, der vises først
default_tab: pack            # valgfri: pack | pick | master
packed_mode: bottom          # valgfri: inline | bottom | hide
```

| Fane | Hvad du gør |
|---|---|
| **Pak** | Tryk på et punkt for at markere det som pakket. Vælg, om pakkede punkter skal stå i deres kategori, flyttes nederst under **Pakket** eller skjules. Under **Pakket** sorteres punkterne alfabetisk. Med **Slet punkter** går du i slette-tilstand: Markér de punkter, der skal væk (eller **Vælg alle**), og tryk **Slet (n)**. Du kan også nulstille listen og tilføje ekstra punkter. |
| **Vælg fra master** | Sæt flueben ved det, der skal med. "+ #tag" henter alle punkter med et tag, og "tilføj alle" henter en hel kategori. |
| **Master** | Tilføj et eller flere punkter ad gangen (ét pr. linje), som alle får samme kategori og tags. Ctrl+Enter tilføjer. Blyanten ved et punkt retter navn, kategori og tags. Skraldespanden sletter punktet. Nederst kan du nulstille hele masteren til standardlisten. |

Overalt hvor du angiver tags, vises de eksisterende tags som forslag, du kan trykke på. Listen filtreres,
mens du skriver. Et nyt tag tilføjer du med Enter eller komma. Valgte tags fjerner du med ×.

Valget af visning for pakkede punkter huskes i den enkelte browser. `packed_mode` bestemmer kun, hvad der
vises første gang.

Med **+ Ny liste** opretter du en tur med navn, dato og de tags, der skal hentes.

### Punkter, der allerede findes i masteren

Tilføjer du et punkt, der allerede findes (uanset store og små bogstaver), bliver det ikke oprettet igen:

- Har du angivet en **anden kategori**, bliver du spurgt, om punktet skal flyttes dertil.
- Har du angivet **tags**, som punktet ikke har, lægges de til. De eksisterende tags beholdes.

Når du retter kategori eller tags på et master-punkt, opdateres de samme felter også på de pakkelister,
hvor punktet er hentet fra masteren. Noter, du har skrevet på pakkelisten, bevares. Et nyt navn ændrer
kun masteren.

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
| `packing_list.add_master_items` | Tilføj flere punkter til masteren på én gang: `items` (en liste eller ét pr. linje), valgfrit `category` og `tags`. Punkter, der allerede findes, får de nye tags. De flyttes kun til `category`, hvis deres navn står i `move`. Returnerer antal `added`, `moved`, `tagged` og `skipped`. |
| `packing_list.update_master_item` | Ret master-punktet `item` (navn eller uid): valgfrit nyt `name`, `category` og `tags` (erstatter de gamle). Udeladte felter beholdes, og tomme felter rydder dem. |
| `packing_list.reset_master` | Erstat hele master-listen med standardlisten. Pakkelisterne berøres ikke, men deres punkter kobles til standardlistens punkter med samme navn. |
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
# Flyt Bamse til kategorien Legetøj og giv den tagget bil
action: packing_list.update_master_item
data:
  item: Bamse
  category: Legetøj
  tags: [børn, bil]
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

## Licens

MIT
