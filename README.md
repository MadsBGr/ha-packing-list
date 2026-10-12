# Pakkelister for Home Assistant

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz/)
[![Validate](https://github.com/MadsBGr/ha-packing-list/actions/workflows/validate.yaml/badge.svg)](https://github.com/MadsBGr/ha-packing-list/actions/workflows/validate.yaml)

Du laver **én master-liste** med alt, hvad du nogensinde pakker. Til hver tur laver du en
**pakkeliste** med netop det, der skal med, og krydser af, mens du pakker.
Hver pakkeliste er en almindelig to-do-liste i Home Assistant, så du kan også bruge den i appen og via Assist.

*English: A master packing list and per-trip packing lists built from it. The card and texts follow your
Home Assistant language (Danish or English, English otherwise).*

**Indhold:** [Kom i gang](#kom-i-gang) · [Sådan bruger du det](#sådan-bruger-du-det) ·
[Kortets faner](#kortets-faner) · [Godt at vide](#godt-at-vide) · [Fejlfinding](#fejlfinding) ·
[For avancerede](#for-avancerede)

---

## Kom i gang

1. **Installer:** I HACS → ⋮ → **Brugerdefinerede repositories** tilføjer du
   `https://github.com/MadsBGr/ha-packing-list` med typen **Integration**. Søg derefter efter
   **Pakkelister**, installer den og genstart Home Assistant.
2. **Tilføj integrationen:** Gå til **Indstillinger → Enheder & tjenester → Tilføj integration → Pakkelister**.
   Sæt flueben ved "Start med en foreslået master-liste", hvis du vil have en færdig liste at bygge videre på.
3. **Tilføj kortet** til et dashboard og genindlæs browseren én gang (Ctrl+Shift+R):
   ```yaml
   type: custom:packing-list-card
   ```

## Sådan bruger du det

| | Hvad du gør | Hvor |
|---|---|---|
| 1 | **Byg din master-liste.** Skriv punkterne ind, gerne mange ad gangen, med kategori (f.eks. *Tøj*) og tags (f.eks. `#ski`, `#sommer`). | Fanen **Master** |
| 2 | **Opret en pakkeliste** med navn, eventuelle noter og de tags, turen handler om. Punkter med de tags kommer med automatisk, og det samme gør punkter med `#altid`. | **+ Ny liste** |
| 3 | **Tilpas listen.** Sæt eller fjern flueben ved enkelte punkter, eller tilføj noget, der kun skal med på denne tur. | Fanen **Vælg fra master** og nederst i fanen **Pak** |
| 4 | **Pak.** Tryk på et punkt, når det er i kufferten. | Fanen **Pak** |
| 5 | **Efter turen:** Arkivér listen, eller kopiér den til næste gang. | Knapperne ved listevælgeren |

## Kortets faner

**Øverst** vælger du liste. Knapperne ved siden af listevælgeren:
- **+ Ny liste** opretter en liste.
- **✏️** omdøber listen og retter noter og vægt.
- **⧉** kopierer listen; det virker også for arkiverede lister.
- **Arkivér / hent tilbage** flytter listen til og fra arkivet.
- **🗑** sletter listen.

**Pak**
- Tryk på et punkt for at markere det som pakket.
- Vælg, om pakkede punkter skal stå i deres kategori, samles nederst eller skjules.
- **Hent igen** henter nye punkter fra masteren, der passer til listens tags.
- **Slet punkter** lader dig markere flere punkter og slette dem på én gang.
- **Fjern flueben** markerer hele listen som ikke pakket, f.eks. til hjemturen.
- Nederst tilføjer du et punkt, der kun skal med på denne tur. Med justér-knappen kan du også give det
  kategori og tags og gemme det i masteren.

**Vælg fra master**
- Sæt flueben ved det, der skal med.
- **+ #tag** henter alle punkter med et tag.
- **tilføj alle** henter en hel kategori.

**Master**
- Tilføj et eller flere punkter ad gangen, ét pr. linje. De får alle samme kategori og tags.
- **✏️** ved et punkt retter navn, kategori, tags, antal og vægt.
- **🗑** sletter punktet.
- Nederst kan du nulstille masteren til standardlisten. Det kræver bekræftelse.

Når du skriver en kategori eller et tag, vises de eksisterende som forslag. Et nyt oprettes bare.

## Indstillinger

Under **Indstillinger → Enheder & tjenester → Pakkelister → Konfigurer** vælger du, hvad en ny liste starter med:

- **Medtag punkter med #altid**
- **Brug vægt**
- **Tags der er valgt på forhånd**, når du trykker "+ Ny liste"
- **Vægtgrænse** i kg, f.eks. 23 for en kuffert eller 8 for håndbagage

Du kan altid ændre det for den enkelte liste.

## Brug i resten af Home Assistant

| Entitet | Hvad den viser |
|---|---|
| `select.pakkeliste_aktiv` | Den **aktive pakkeliste**. Kortet åbner den, og når du vælger en liste i kortet, bliver den aktiv. Du kan også skifte den fra en automation. |
| `sensor.pakkeliste_mangler` | Hvor mange punkter der **mangler** på den aktive liste. Attributterne `items` og `categories` indeholder navnene, så de kan bruges på en tablet, i en notifikation eller i et ur. |
| `binary_sensor.<liste>_faerdig` | **Tændt**, når alt på listen er pakket. |
| `sensor.<liste>_pakket` | Hvor mange procent af listen der er pakket. |

Eksempel på en notifikation med det, der mangler:

```yaml
action: notify.mobile_app_telefon
data:
  message: >
    Mangler stadig: {{ state_attr('sensor.pakkeliste_mangler', 'items') | join(', ') }}
```

## Godt at vide

<details><summary><b>Tags og <code>#altid</code></b></summary>

- **Tags** bruges til at hente punkter ind på en liste, f.eks. `#ski`, `#fly` eller `#børn`.
- **`#altid`** (eller `#always`) betyder, at punktet kommer med på alle nye lister.
- **I to-do-visningen** ligger kategori og tags i punktets beskrivelse som `@Tøj #sommer #strand`. Så kan
  de også rettes i HA's almindelige to-do-visning. Brug `_` i stedet for mellemrum i en kategori.
</details>

<details><summary><b>Hent igen og slettede punkter</b></summary>

En pakkeliste husker, hvilke tags og kategorier den er fyldt med, og hvilke punkter du har slettet fra den.
**Hent igen** tilføjer nye punkter, der passer. Matcher nogle af dem punkter, du tidligere har slettet,
bliver du spurgt, om de også skal med.
</details>

<details><summary><b>Samme navn i flere kategorier</b></summary>

Et navn må findes én gang pr. kategori, f.eks. "Bamse" under både *Børn* og *Legetøj*. Tilføjer du et
navn, der allerede findes i en anden kategori, spørger kortet, om punktet skal flyttes, oprettes som nyt
eller beholdes.
</details>

<details><summary><b>Antal og vægt</b></summary>

- **Antal** er valgfrit og vises som "5× Strømper". Antallet på et master-punkt er standard, når punktet
  hentes til en liste.
- **Vægt** angives i gram pr. stk. Du kan også skrive `1,2 kg`. Slå **Brug vægt** til på en liste for at
  se vægt pr. punkt, pr. kategori og i alt.
- **Vægtgrænse:** En liste, der bruger vægt, kan få en grænse i kg. Kortet viser grænsen ved siden af den
  samlede vægt og advarer med rødt, når grænsen er overskredet.
</details>

<details><summary><b>Nye standardpunkter ved opdatering</b></summary>

Din master-liste er din egen. En opdatering via HACS ændrer den aldrig.

Har en ny version tilføjet punkter til standardlisten, får du en notifikation i HA, og fanen **Master**
viser punkterne med to valg: **Tilføj til min master** eller **Spring over**. Dine egne ændringer, og
standardpunkter du har slettet, bliver ikke rørt.
</details>

<details><summary><b>Omdøbe, flytte eller slette i Home Assistant</b></summary>

- **Omdøb i kortet:** Det nye navn ses overalt i HA. Entity id'et ændrer sig ikke.
- **Omdøb i HA:** Omdøber du en pakkeliste under *Indstillinger → Entiteter*, får listen også det navn i kortet.
- **Nyt entity id:** Ændrer du en listes entity id, virker kortet og tjenesterne stadig.
- **Slet en listes entitet i HA:** Listen bliver slettet rent, inklusive sensoren.
- **Slet master-entiteten:** Den bliver genskabt, fordi integrationen ikke kan undvære den.
</details>

<details><summary><b>Sprog</b></summary>

Kortet, navnene og fejlbeskederne følger sproget i din HA-profil. Dansk og engelsk er understøttet, og
alle andre sprog bliver engelsk. Standardlisten oprettes på det sprog, HA har ved første installation.
</details>

<details><summary><b>Hvor gemmes data?</b></summary>

Lokalt i Home Assistants egen lagring (`.storage/packing_list.storage`), som kommer med i dine backups.
Der er ingen cloud og ingen eksterne afhængigheder.
</details>

## Fejlfinding

- **"Custom element doesn't exist: packing-list-card":** Genindlæs browseren med Ctrl+Shift+R. I appen
  rydder du frontend-cachen under Indstillinger → Companion App → Fejlfinding. Integrationen tilføjer selv
  ressourcen `/packing_list/packing-list-card.js` under Dashboards → Ressourcer.
- **Dashboards i YAML-tilstand:** Tilføj selv ressourcen:
  ```yaml
  lovelace:
    resources:
      - url: /packing_list/packing-list-card.js
        type: module
  ```
- **Efter en opdatering** genindlæser kortet selv siden første gang, du åbner dashboardet.

## For avancerede

<details><summary><b>Kortets indstillinger</b></summary>

```yaml
type: custom:packing-list-card
title: Pakkeliste          # valgfri overskrift
entity: todo.skiferie      # valgfri: den liste, der vises først
default_tab: pack          # pack | pick | master
packed_mode: bottom        # inline | bottom | hide (kun første gang – derefter huskes dit valg)
```
</details>

<details><summary><b>Entiteter</b></summary>

| Entitet | Tilstand | Attributter |
|---|---|---|
| `todo.pakkeliste_master` | antal punkter | |
| `todo.<liste>` | antal punkter, der ikke er pakket | `total`, `packed`, `notes`, `archived`, og med vægt `total_weight`, `packed_weight`, `weight_limit` (gram), `over_weight_limit` |
| `sensor.<liste>_pakket` | % pakket | `packed`, `total`, `remaining`, og med vægt som ovenfor |
| `binary_sensor.<liste>_faerdig` | `on`, når alt er pakket | |
| `select.pakkeliste_aktiv` | navnet på den aktive liste | `entity_id` (listens to-do-entitet) |
| `sensor.pakkeliste_mangler` | antal manglende punkter på den aktive liste | `list`, `entity_id`, `items`, `categories` (navne pr. kategori; `""` = uden kategori), `packed`, `total` |

Med engelsk sprog i HA hedder de nye entiteter `select.active_packing_list`, `sensor.packing_list_remaining`
og `binary_sensor.<liste>_done`.

De almindelige `todo.*`-tjenester (`add_item`, `update_item`, `remove_item`, `get_items`) virker på alle lister.
</details>

<details><summary><b>Tjenester</b></summary>

**Lister**

| Tjeneste | Hvad den gør |
|---|---|
| `packing_list.create_list` | Opretter en liste: `name`, valgfrit `notes`, `tags`, `categories`, `items`, `include_always`, `use_weight` og `weight_limit` (gram). De tre sidste bruger integrationens indstillinger, hvis de udelades. |
| `packing_list.update_list` | Omdøber (`name`) eller ændrer `notes`, `use_weight`, `weight_limit` (tom fjerner den) og `archived`. |
| `packing_list.set_active_list` | Gør listen `entity_id` aktiv. Uden `entity_id` ryddes den aktive liste. |
| `packing_list.copy_list` | Kopierer en liste. Valgfrit `name`; ellers bliver navnet "<navn> (kopi)". |
| `packing_list.delete_list` | Sletter listen og dens entiteter. |
| `packing_list.reset_list` | Fjerner alle flueben. |
| `packing_list.add_from_master` | Henter punkter efter `tags`, `categories` eller `items`. Med `include_excluded: true` kommer slettede punkter også med. |
| `packing_list.refresh_list` | Hent igen. Med `include_excluded: true` kommer slettede punkter også med. |
| `packing_list.add_list_item` | Tilføjer et punkt med valgfri `category`, `tags`, `quantity` og `weight`. Med `add_to_master: true` gemmes det også i masteren. |
| `packing_list.update_list_item` | Retter `quantity` og `weight` på et punkt. Med `update_master: true` gemmes vægten også i masteren. |
| `packing_list.copy_to_master` | Gemmer et punkt fra listen i masteren. |

**Master**

| Tjeneste | Hvad den gør |
|---|---|
| `packing_list.add_master_items` | Tilføjer punkter (`items`, ét pr. linje) med fælles `category` og `tags`. Med `move` og `duplicate` styrer du punkter, der findes i en anden kategori. |
| `packing_list.update_master_item` | Retter `name`, `category`, `tags`, `quantity` og `weight` på `item` (navn eller uid). |
| `packing_list.add_new_defaults` | Tilføjer nye standardpunkter fra en nyere version, enten alle eller dem i `items`. |
| `packing_list.skip_new_defaults` | Springer nye standardpunkter over. |
| `packing_list.reset_master` | Erstatter hele masteren med standardlisten. |

Eksempel:

```yaml
action: packing_list.create_list
data:
  name: Skiferie
  tags: [ski, vinter]
  notes: Husk liftkort
```
</details>

<details><summary><b>Udvikling</b></summary>

```bash
pip install -r requirements_test.txt
pytest
```
</details>

## Licens

MIT
