# Pakkelister for Home Assistant

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz/)
[![Validate](https://github.com/MadsBGr/ha-packing-list/actions/workflows/validate.yaml/badge.svg)](https://github.com/MadsBGr/ha-packing-list/actions/workflows/validate.yaml)

En HACS-integration med en **master-pakkeliste** over alt, hvad du nogensinde kunne finde på at pakke, og
**pakkelister til hver tur**, som du nemt fylder fra masteren. Hver pakkeliste er en almindelig
to-do-liste i Home Assistant. Du kan krydse af undervejs og se, hvad der er pakket, både i det
medfølgende kort, i den indbyggede to-do-visning, i appen og via Assist.

*English summary: A master packing list plus per-trip packing lists built from it by tag, category or
hand-picked items, with optional quantities, weights (totals per category), list notes and archiving. Every list is a native `todo` entity, and a bundled Lovelace card handles picking
and packing. The card, entity names and errors follow your Home Assistant language (Danish or English,
English otherwise); a suggested master list in that language is created on first install only.*

## Funktioner

- **Master-liste** (`todo.pakkeliste_master`) med kategorier og tags. Du kan starte med en foreslået liste.
- **Pakkelister pr. tur** oprettes med ét klik eller én tjeneste. Hver liste bliver sin egen
  `todo`-entitet plus en `sensor` med hvor mange procent der er pakket.
- **Hent fra master** efter tags (`#ski`, `#fly` …), kategori eller enkeltvis. Punkter med `#altid`
  kommer automatisk med. Dubletter springes over.
- **Ekstra punkter** kan tilføjes til en enkelt tur. Du kan give dem kategori og tags og gemme dem i
  masteren med det samme eller senere.
- **Hent igen** tilføjer nye master-punkter, der matcher listens tags og kategorier. Har du tidligere
  slettet nogle af dem fra listen, bliver du spurgt, om de også skal hentes igen.
- **Slette-tilstand:** Markér et eller flere punkter på en pakkeliste og slet dem på én gang.
- **Antal og vægt (valgfrit):** Et punkt kan have et antal (f.eks. 5 × strømper) og en vægt pr. stk.
  Slår du **Brug vægt** til på en liste, vises vægten pr. punkt, summen pr. kategori og den samlede vægt.
- **Noter** til hver pakkeliste, f.eks. hvad der skal købes inden turen.
- **Arkivér** gamle pakkelister. De ligger under "Arkiverede" i listevælgeren og kan hentes tilbage.
- **Kategorivælger:** Når du skriver en kategori, vises de eksisterende kategorier i en liste, der
  filtreres, mens du skriver. En ny kategori bliver bare oprettet.
- **Samme navn i flere kategorier:** Et punkt må gerne findes flere gange, når blot det står i hver sin
  kategori (f.eks. "Bamse" under både *Børn* og *Legetøj*).
- **Ret master-punkter:** Navn, kategori og tags kan rettes. Ændringer i kategori og tags slår også igennem
  på pakkelisterne.
- **Fjern flueben** markerer hele listen som "ikke pakket", så den kan genbruges til hjemrejsen. Kortet
  beder om bekræftelse først.
- **Medfølgende Lovelace-kort** med tre faner: *Pak*, *Vælg fra master* og *Master*.
  Alt er sorteret alfabetisk inden for hver kategori. Integrationen
  opretter selv kortets ressource under Dashboards → Ressourcer.
- **Sprog:** Kortet, navnene og fejlbeskederne følger sproget i Home Assistant. Dansk og engelsk er
  understøttet, og alle andre sprog bliver engelsk.
- Alt gemmes lokalt i `.storage` (Home Assistants egen lagring, som også tages med i backup).
  Der er ingen cloud, ingen database og ingen eksterne afhængigheder.

## Sprog og standardlisten

- Kortet bruger det sprog, der er valgt i din HA-profil. Er sproget hverken dansk eller engelsk,
  bruges engelsk.
- Den foreslåede master-liste findes på dansk og engelsk. Den oprettes **kun ved første installation**,
  på det sprog HA har på det tidspunkt, eller når du selv trykker **Nulstil til standard master-liste**.
  Opdateringer via HACS og genstarter ændrer aldrig din eksisterende master-liste og tilføjer ikke
  nye punkter.
- `#altid` og `#always` betyder det samme: punktet kommer med på alle nye lister. Begge virker,
  uanset sprog.
- Skifter du sprog i HA, skifter master-entitetens viste navn ("Pakkeliste master" / "Packing list master"),
  men dens entity id ændrer sig ikke.

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
| **Pak** | Tryk på et punkt for at markere det som pakket. Blyanten ved et punkt retter antal og vægt. Vælg, om pakkede punkter skal stå i deres kategori, flyttes nederst under **Pakket** eller skjules. Under **Pakket** sorteres punkterne alfabetisk. Med **Slet punkter** går du i slette-tilstand: Markér de punkter, der skal væk (eller **Vælg alle**), og tryk **Slet (n)**. **Hent igen** henter nye matchende punkter fra masteren. **Fjern flueben** markerer alle punkter som ikke pakket, efter du har bekræftet det. Nederst tilføjer du nye punkter; med justér-knappen kan du give dem kategori og tags og gemme dem i masteren. Punkter, der ikke findes i masteren, har ikonet "Gem i master". |
| **Vælg fra master** | Sæt flueben ved det, der skal med. "+ #tag" henter alle punkter med et tag, og "tilføj alle" henter en hel kategori. |
| **Master** | Tilføj et eller flere punkter ad gangen (ét pr. linje), som alle får samme kategori og tags. Ctrl+Enter tilføjer. Blyanten ved et punkt retter navn, kategori, tags, standardantal og vægt. Skraldespanden sletter punktet. Nederst kan du nulstille hele masteren til standardlisten. Kortet beder om bekræftelse, før noget slettes. |

### Hent igen

En pakkeliste husker de tags og kategorier, den er fyldt med: tags fra **+ Ny liste**, `#altid`, "+ #tag"
og "tilføj alle" i **Vælg fra master**. Den husker også, hvilke master-punkter du har slettet fra den.
**Hent igen** tilføjer de master-punkter, der matcher, og som ikke allerede er på listen.

Er nogle af de matchende punkter tidligere slettet fra listen, spørger kortet, om de også skal hentes
igen: **Hent også de slettede**, **Kun nye punkter** eller **Annuller**. Det samme sker, når du bruger
"+ #tag" eller "tilføj alle" i **Vælg fra master**. Et enkelt slettet punkt kan du altid hente tilbage ved
at sætte flueben ved det i **Vælg fra master**, hvor det er markeret med "slettet fra listen".

Fra scripts bruger du feltet `include_excluded: true` på `add_from_master` eller `refresh_list`.

Overalt hvor du angiver tags, vises de eksisterende tags som forslag, du kan trykke på. Listen filtreres,
mens du skriver. Et nyt tag tilføjer du med Enter eller komma. Valgte tags fjerner du med ×.

Valget af visning for pakkede punkter huskes i den enkelte browser. `packed_mode` bestemmer kun, hvad der
vises første gang.

Med **+ Ny liste** opretter du en tur med navn, dato og de tags, der skal hentes, og vælger, om listen
skal bruge vægt. Blyanten ved siden af listevælgeren retter dato, noter og **Brug vægt**. Noterne vises
øverst på fanen *Pak*. Arkiv-knappen arkiverer listen, og den samme knap henter den tilbage igen.

### Antal og vægt

- **Antal** er valgfrit og vises foran navnet, f.eks. "5× Strømper". Et antal på et master-punkt er
  standardantallet, når punktet hentes til en liste. Antallet på en pakkeliste gælder kun den liste.
- **Vægt** angives i gram pr. stk. (du kan også skrive f.eks. `1,2 kg`). Punktets vægt er vægt × antal.
- Vægt er slået fra som standard. Med **Brug vægt** på en liste vises vægten ved hvert punkt, summen i
  hver kategoris overskrift og "pakket af i alt" ved siden af fremdriften. Når en liste bruger vægt, kan
  du også angive vægt på master-punkterne.
- Retter du vægten på et punkt på en pakkeliste, kan du samtidig gemme den i masteren. Vægten på et
  master-punkt slår igennem på alle lister, der har punktet.

### Kategorier

Når du skriver i et kategorifelt, vises alle eksisterende kategorier (fra masteren og pakkelisterne).
Listen bliver kortere, mens du skriver. Tryk på en kategori, eller brug piletasterne og Enter. Findes
kategorien ikke, bliver den oprettet, når du gemmer.

### Punkter, der allerede findes i masteren

Det samme navn (uanset store og små bogstaver) kan findes én gang pr. kategori.

- Findes punktet allerede i **samme kategori**, bliver det ikke oprettet igen. Nye tags lægges til, og
  de eksisterende beholdes.
- Findes det kun i en **anden kategori**, bliver du spurgt, om det skal **flyttes**, **oprettes som et
  nyt punkt** i den nye kategori, eller om du vil **beholde kategorien** (så får det bare de nye tags).
- Retter du navn eller kategori, så det ville give to ens punkter i samme kategori, siger kortet fra.

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
| `packing_list.create_list` | Opret en liste: `name`, valgfrit `trip_date`, `tags`, `categories`, `items`, `include_always` (standard `true`), `use_weight` og `notes`. Returnerer `entity_id`. |
| `packing_list.update_list` | Ret en liste: valgfrit `trip_date` (tom fjerner den), `notes`, `use_weight` og `archived`. Udeladte felter beholdes. |
| `packing_list.update_list_item` | Ret `quantity` og/eller `weight` (gram pr. stk.) på punktet `item` (navn eller uid) på listen `entity_id`. 0 eller tom fjerner værdien. Med `update_master: true` gemmes vægten også i masteren. |
| `packing_list.add_from_master` | Tilføj fra master til `entity_id` efter `tags`, `categories` eller `items` (navn eller uid). |
| `packing_list.add_master_items` | Tilføj flere punkter til masteren på én gang: `items` (en liste eller ét pr. linje), valgfrit `category` og `tags`. Findes navnet i samme kategori, får punktet de nye tags. Findes det kun i en anden kategori, får det de nye tags, men flyttes til `category`, hvis navnet står i `move`, eller oprettes som nyt punkt i `category`, hvis navnet står i `duplicate`. Returnerer antal `added`, `moved`, `tagged` og `skipped`. |
| `packing_list.update_master_item` | Ret master-punktet `item` (navn eller uid): valgfrit nyt `name`, `category`, `tags` (erstatter de gamle), `quantity` (standardantal) og `weight` (gram pr. stk.). Udeladte felter beholdes, og tomme felter rydder dem. Findes navnet i flere kategorier, skal du bruge punktets uid. |
| `packing_list.reset_master` | Erstat hele master-listen med standardlisten. Pakkelisterne berøres ikke, men deres punkter kobles til standardlistens punkter med samme navn. |
| `packing_list.refresh_list` | Hent igen: tilføj nye master-punkter, der matcher listens tags og kategorier, men ikke punkter, der er slettet fra listen. Returnerer `added`. |
| `packing_list.add_list_item` | Tilføj `item` til pakkelisten `entity_id` med valgfri `category`, `tags`, `quantity` og `weight`. Med `add_to_master: true` gemmes punktet også i masteren. |
| `packing_list.copy_to_master` | Gem et punkt fra pakkelisten i masteren og kobl dem sammen. `category` og `tags` er som udgangspunkt punktets egne. Findes navnet allerede i samme kategori, får det eksisterende punkt de nye tags. |
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
| `todo.<tur>` | antal punkter, der ikke er pakket | `trip_date`, `total`, `packed`, `archived`, `notes`, `packing_list_id`, `revision`, og med vægt `total_weight`, `packed_weight` (gram) |
| `sensor.<tur>_pakket` | % pakket | `packed`, `total`, `remaining`, og med vægt `total_weight`, `packed_weight` (gram) |

## Udvikling

```bash
pip install -r requirements_test.txt
pytest
```

## Idéer til næste version

- Omdøb lister, og kopiér en tidligere tur.
- Antal ud fra turens længde (f.eks. "T-shirts × antal dage").

## Licens

MIT
