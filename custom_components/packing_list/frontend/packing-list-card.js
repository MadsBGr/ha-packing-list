/*
 * Packing list card for the packing_list integration.
 * Served by the integration and registered automatically as a dashboard resource.
 * The language follows the Home Assistant user setting (Danish or English; English otherwise).
 *
 *   type: custom:packing-list-card
 *   title: Pakkeliste        # optional
 *   entity: todo.skiferie    # optional: list selected by default
 *   default_tab: pack        # optional: pack | pick | master
 *   packed_mode: bottom      # optional: inline | bottom | hide (the viewer's own choice wins)
 */

const CARD_VERSION = "0.14.0";
const RELOADED_FOR_KEY = "packing-list-card.reloaded-for";
const PACKED_MODE_KEY = "packing-list-card.packed-mode";
const PACKED_MODES = ["inline", "bottom", "hide"];
// Items without a category are grouped under this key (shown as "Andet"/"Other").
const UNCATEGORIZED = "";
// Tags meaning "include in every new list"; both work in every language.
const ALWAYS_TAGS = ["altid", "always"];

const STRINGS = {
  en: {
    title: "Packing list",
    loading: "Loading…",
    loadError: "Could not load packing lists: {error}",
    versionWarning: "Packing lists was updated to {version}. Reload the browser (Ctrl+Shift+R).",
    noLists: "No packing lists yet",
    newList: "+ New list",
    deleteList: "Delete list",
    progress: "{packed} of {total} packed",
    newListName: "Name, e.g. Ski trip 2027",
    addWithTags: "Add items with tags:",
    noMasterTags: "The master list has no tags yet.",
    includeAlways: "Include items tagged #{tag}",
    create: "Create",
    cancel: "Cancel",
    tabPack: "Pack",
    tabPick: "Pick from master",
    tabMaster: "Master",
    createListFirst: 'Create a packing list with "+ New list".',
    uncategorized: "Other",
    packedInline: "Packed in their categories",
    packedBottom: "Packed at the bottom",
    packedHide: "Hide packed",
    packedModeTitle: "How packed items are shown",
    packedHeading: "Packed ({count})",
    allPacked: "Everything is packed 🎉",
    listEmpty: 'The list is empty – add items under "Pick from master".',
    refresh: "Fetch again",
    refreshTitle: "Adds new master items with {criteria}.",
    deleteItems: "Delete items",
    deleteItemsTitle: "Choose items to delete",
    uncheck: "Uncheck all",
    uncheckTitle: "Uncheck all packed items",
    deleteHint: "Select the items to delete",
    selectAll: "Select all",
    deselectAll: "Deselect all",
    delete: "Delete",
    deleteCount: "Delete ({count})",
    saveToMasterHeading: 'Save "{name}" to the master list',
    categoryExample: "Category, e.g. Sports",
    saveToMaster: "Save to master",
    saveToMasterTitle: "Save to the master list",
    alsoSaveToMaster: "Also save to the master list",
    newItem: "New item for this list",
    detailsTitle: "Category, tags and master",
    add: "Add",
    addAllWithTag: "Add all items with tag:",
    noTags: "No tags yet.",
    addAll: "add all",
    deletedFromList: "deleted from list",
    masterEmptyPick: 'The master list is empty – add items under "Master".',
    name: "Name",
    categoryOptional: "Category (empty = none)",
    save: "Save",
    editTitle: "Edit category and tags",
    deleteFromMaster: "Delete from master",
    masterAddHint: "Add one or more items – one per line. They all get the same category and tags.",
    masterNamesExample: "Swimwear\nBeach towel\nFlip-flops",
    masterCategoryExample: "Category, e.g. Clothes",
    alwaysHint: "#{tag} = included in every new list",
    addToMaster: "Add to master",
    masterEmpty: "The master list is empty.",
    resetMaster: "Reset to the default master list",
    tagsPlaceholder: "Tags – pick below or type a new one (Enter/comma adds)",
    remove: "Remove",
    nAdded: "{count} added",
    nMoved: "{count} moved",
    nTagged: "{count} got new tags",
    nSkipped: "{count} already existed",
    nothingChanged: "Nothing changed",
    fetchedOne: "1 item added",
    fetchedMany: "{count} items added",
    nothingFetched: "No new items to add",
    inCategory: 'the category "{category}"',
    noCategory: "no category",
    moveYes: "Move to {category}",
    moveNo: "Keep category",
    deleteListQuestion: 'Delete the packing list "{name}"?',
    uncheckOne: 'Uncheck the packed item on "{name}"?',
    uncheckMany: 'Uncheck all {count} packed items on "{name}"?',
    uncheckNote: "The items stay on the list, marked as not packed.",
    resetQuestion:
      "Are you sure you want to reset the master list?\n\n" +
      "All {count} items in the master list – with your own categories and tags – will be replaced by the " +
      "default list. This cannot be undone.\nYour packing lists are not affected.",
    resetYes: "Yes, reset the master list",
    resetNo: "No, keep my list",
    someDeletedOne: "One of the items with {label} was deleted from the list earlier: {names}.\nAdd it again too?",
    someDeletedMany: "{count} of the items with {label} were deleted from the list earlier: {names}.\nAdd them again too?",
    onlyDeletedOne: "There are no new items with {label}, but one you deleted from the list earlier: {names}.\nAdd it again?",
    onlyDeletedMany: "There are no new items with {label}, but {count} you deleted from the list earlier: {names}.\nAdd them again?",
    alsoDeletedOne: "Also add the deleted one",
    alsoDeletedMany: "Also add the deleted ones",
    onlyNew: "Only new items ({count})",
    againOne: "Add it again",
    againMany: "Add them again",
    andMore: " and {count} more",
    newCategory: 'New category "{category}"',
    quantity: "Quantity",
    quantityOptional: "Quantity (optional)",
    weightPerPiece: "Weight per piece (g)",
    useWeight: "Use weight on this list",
    weightProgress: "{packed} of {total}",
    saveWeightToMaster: "Also save the weight in the master list",
    editItemTitle: "Quantity and weight",
    editList: "Edit list",
    editListTitle: "Name, notes and weight",
    notes: "Notes",
    notesPlaceholder: "Notes for this list, e.g. what to buy before the trip",
    archive: "Archive list",
    unarchive: "Restore from archive",
    archivedHeading: "Archived",
    archivedNotice: "This list is archived.",
    listName: "List name",
    weightLimit: "Weight limit in kg, e.g. 23 (empty = none)",
    limitInfo: "limit {limit}",
    overLimit: "⚠ {over} over the weight limit",
    copyList: "Copy list",
    copyHeading: 'Copy "{name}"',
    copyNameDefault: "{name} (copy)",
    copyHint: "The copy gets the same items and notes – nothing is packed.",
    copy: "Copy",
    newDefaultsOne: "The default list has a new item: {names}.",
    newDefaultsMany: "The default list has {count} new items: {names}.",
    newDefaultsNote: "Add them to your master list or skip them – your own items are not changed.",
    addDefaults: "Add to my master",
    skipDefaults: "Skip",
    duplicateName: 'There is already an item named "{name}" in {category}.',
    duplicateQuestion: '"{name}" already exists in {from}.\nMove it to "{category}", or create it as a separate item in "{category}"?',
    duplicateMany: '"{name}" already exists in {from}.\nCreate it as a separate item in "{category}" too?',
    createNew: "Create new in {category}",
    andWord: " and ",
  },
  da: {
    title: "Pakkeliste",
    loading: "Indlæser…",
    loadError: "Kunne ikke hente pakkelister: {error}",
    versionWarning: "Pakkelister er opdateret til {version}. Genindlæs browseren (Ctrl+Shift+R).",
    noLists: "Ingen pakkelister endnu",
    newList: "+ Ny liste",
    deleteList: "Slet liste",
    progress: "{packed} af {total} pakket",
    newListName: "Navn, f.eks. Skiferie 2027",
    addWithTags: "Hent punkter med tags:",
    noMasterTags: "Master-listen har ingen tags endnu.",
    includeAlways: "Medtag punkter med #{tag}",
    create: "Opret",
    cancel: "Annuller",
    tabPack: "Pak",
    tabPick: "Vælg fra master",
    tabMaster: "Master",
    createListFirst: 'Opret en pakkeliste med "+ Ny liste".',
    uncategorized: "Andet",
    packedInline: "Pakkede i kategorierne",
    packedBottom: "Pakkede nederst",
    packedHide: "Skjul pakkede",
    packedModeTitle: "Visning af pakkede punkter",
    packedHeading: "Pakket ({count})",
    allPacked: "Alt er pakket 🎉",
    listEmpty: 'Listen er tom – hent punkter under "Vælg fra master".',
    refresh: "Hent igen",
    refreshTitle: "Henter nye master-punkter med {criteria}.",
    deleteItems: "Slet punkter",
    deleteItemsTitle: "Vælg punkter der skal slettes",
    uncheck: "Fjern flueben",
    uncheckTitle: "Fjern fluebenet fra alle pakkede punkter",
    deleteHint: "Markér de punkter, der skal slettes",
    selectAll: "Vælg alle",
    deselectAll: "Fravælg alle",
    delete: "Slet",
    deleteCount: "Slet ({count})",
    saveToMasterHeading: 'Gem "{name}" i master-listen',
    categoryExample: "Kategori, f.eks. Sport",
    saveToMaster: "Gem i master",
    saveToMasterTitle: "Gem i master-listen",
    alsoSaveToMaster: "Gem også i master-listen",
    newItem: "Nyt punkt til denne liste",
    detailsTitle: "Kategori, tags og master",
    add: "Tilføj",
    addAllWithTag: "Tilføj alle punkter med tag:",
    noTags: "Ingen tags endnu.",
    addAll: "tilføj alle",
    deletedFromList: "slettet fra listen",
    masterEmptyPick: 'Master-listen er tom – tilføj punkter under "Master".',
    name: "Navn",
    categoryOptional: "Kategori (tom = ingen)",
    save: "Gem",
    editTitle: "Ret kategori og tags",
    deleteFromMaster: "Slet fra master",
    masterAddHint: "Tilføj et eller flere punkter – ét pr. linje. De får alle samme kategori og tags.",
    masterNamesExample: "Badetøj\nBadehåndklæde\nKlipklappere",
    masterCategoryExample: "Kategori, f.eks. Tøj",
    alwaysHint: "#{tag} = kommer med på alle nye lister",
    addToMaster: "Tilføj til master",
    masterEmpty: "Master-listen er tom.",
    resetMaster: "Nulstil til standard master-liste",
    tagsPlaceholder: "Tags – vælg herunder eller skriv et nyt (Enter/komma tilføjer)",
    remove: "Fjern",
    nAdded: "{count} tilføjet",
    nMoved: "{count} flyttet",
    nTagged: "{count} fik nye tags",
    nSkipped: "{count} fandtes allerede",
    nothingChanged: "Intet ændret",
    fetchedOne: "1 punkt hentet",
    fetchedMany: "{count} punkter hentet",
    nothingFetched: "Ingen nye punkter at hente",
    inCategory: 'kategorien "{category}"',
    noCategory: "ingen kategori",
    moveYes: "Flyt til {category}",
    moveNo: "Behold kategori",
    deleteListQuestion: 'Slet pakkelisten "{name}"?',
    uncheckOne: 'Fjern fluebenet fra det pakkede punkt på "{name}"?',
    uncheckMany: 'Fjern fluebenet fra alle {count} pakkede punkter på "{name}"?',
    uncheckNote: "Punkterne bliver på listen, men står som ikke pakket.",
    resetQuestion:
      "Er du sikker på, at du vil nulstille master-listen?\n\n" +
      "Alle {count} punkter i masteren – med dine egne kategorier og tags – bliver erstattet af standardlisten. " +
      "Det kan ikke fortrydes.\nDine pakkelister berøres ikke.",
    resetYes: "Ja, nulstil master-listen",
    resetNo: "Nej, behold min liste",
    someDeletedOne: "Et af punkterne med {label} har du tidligere slettet fra listen: {names}.\nVil du også hente den igen?",
    someDeletedMany: "{count} af punkterne med {label} har du tidligere slettet fra listen: {names}.\nVil du også hente dem igen?",
    onlyDeletedOne: "Der er ingen nye punkter med {label}, men et, som du tidligere har slettet fra listen: {names}.\nVil du hente den igen?",
    onlyDeletedMany: "Der er ingen nye punkter med {label}, men {count}, som du tidligere har slettet fra listen: {names}.\nVil du hente dem igen?",
    alsoDeletedOne: "Hent også den slettede",
    alsoDeletedMany: "Hent også de slettede",
    onlyNew: "Kun nye punkter ({count})",
    againOne: "Hent den igen",
    againMany: "Hent dem igen",
    andMore: " og {count} flere",
    newCategory: 'Ny kategori "{category}"',
    quantity: "Antal",
    quantityOptional: "Antal (valgfrit)",
    weightPerPiece: "Vægt pr. stk. (g)",
    useWeight: "Brug vægt på denne liste",
    weightProgress: "{packed} af {total}",
    saveWeightToMaster: "Gem også vægten i master-listen",
    editItemTitle: "Antal og vægt",
    editList: "Ret liste",
    editListTitle: "Navn, noter og vægt",
    notes: "Noter",
    notesPlaceholder: "Noter til listen, f.eks. hvad der skal købes inden turen",
    archive: "Arkivér liste",
    unarchive: "Hent tilbage fra arkivet",
    archivedHeading: "Arkiverede",
    archivedNotice: "Listen er arkiveret.",
    listName: "Listens navn",
    weightLimit: "Vægtgrænse i kg, f.eks. 23 (tom = ingen)",
    limitInfo: "grænse {limit}",
    overLimit: "⚠ {over} over vægtgrænsen",
    copyList: "Kopiér liste",
    copyHeading: 'Kopiér "{name}"',
    copyNameDefault: "{name} (kopi)",
    copyHint: "Kopien får de samme punkter og noter – intet er pakket.",
    copy: "Kopiér",
    newDefaultsOne: "Standardlisten har fået et nyt punkt: {names}.",
    newDefaultsMany: "Standardlisten har fået {count} nye punkter: {names}.",
    newDefaultsNote: "Tilføj dem til din master-liste eller spring dem over – dine egne punkter ændres ikke.",
    addDefaults: "Tilføj til min master",
    skipDefaults: "Spring over",
    duplicateName: 'Der findes allerede et punkt med navnet "{name}" i {category}.',
    duplicateQuestion: '"{name}" findes allerede i {from}.\nSkal den flyttes til "{category}", eller oprettes som et separat punkt i "{category}"?',
    duplicateMany: '"{name}" findes allerede i {from}.\nSkal den også oprettes som et separat punkt i "{category}"?',
    createNew: "Opret ny i {category}",
    andWord: " og ",
  },
};

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const sameText = (a, b) => (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();
const splitTags = (text) =>
  (text || "")
    .split(/[,\s]+/)
    .map((t) => t.replace(/^#/, "").trim().toLowerCase())
    .filter(Boolean);

// "250", "1,5 kg", "1.5kg" -> grams; empty or invalid -> null. A number without unit is in
// defaultUnit (grams for items, kg for a list's weight limit).
const parseWeight = (text, defaultUnit = "g") => {
  const match = String(text ?? "").trim().replace(",", ".").match(/^(\d+(?:\.\d+)?|\.\d+)\s*(kg|g)?$/i);
  if (!match) return null;
  const unit = (match[2] || defaultUnit).toLowerCase();
  const grams = Number(match[1]) * (unit === "kg" ? 1000 : 1);
  return grams > 0 ? grams : null;
};
const parseLimit = (text) => parseWeight(text, "kg");
const parseQuantity = (text) => {
  const value = parseInt(String(text ?? "").trim(), 10);
  return value > 0 ? value : null;
};
const itemWeight = (item) => (item.weight || 0) * (item.quantity || 1);

const loadPackedMode = () => {
  try {
    return localStorage.getItem(PACKED_MODE_KEY);
  } catch {
    return null;
  }
};

const STYLE = `
  ha-card { padding: 16px; }
  .title { font-size: 1.4em; margin-bottom: 12px; }
  .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .header select { flex: 1; min-width: 140px; }
  select, textarea, input:not([type=checkbox]) {
    font: inherit; padding: 8px; border-radius: 6px; box-sizing: border-box;
    border: 1px solid var(--divider-color); background: var(--card-background-color);
    color: var(--primary-text-color);
  }
  input:not([type=checkbox]) { flex: 1; min-width: 120px; }
  textarea { resize: vertical; min-height: 4.5em; }
  button {
    font: inherit; cursor: pointer; padding: 6px 12px; border-radius: 6px;
    border: 1px solid var(--divider-color); background: none; color: var(--primary-text-color);
  }
  button.primary, button.active { background: var(--primary-color); color: var(--text-primary-color, #fff); border-color: var(--primary-color); }
  button.danger { background: var(--error-color, #db4437); color: #fff; border-color: var(--error-color, #db4437); }
  button:disabled { opacity: .5; cursor: default; }
  button.icon { border: none; padding: 4px; color: var(--secondary-text-color); }
  button.link { border: none; padding: 0 4px; color: var(--primary-color); font-size: .85em; }
  .progress { display: flex; align-items: center; gap: 8px; margin: 12px 0 4px; font-size: .9em; color: var(--secondary-text-color); }
  .bar { flex: 1; height: 8px; border-radius: 4px; background: var(--divider-color); overflow: hidden; }
  .bar > div { height: 100%; background: var(--success-color, var(--primary-color)); transition: width .3s; }
  .tabs { display: flex; margin: 12px 0 8px; border-bottom: 1px solid var(--divider-color); }
  .tabs button { border: none; border-radius: 0; flex: 1; padding: 8px 4px; border-bottom: 2px solid transparent; color: var(--secondary-text-color); }
  .tabs button.on { color: var(--primary-color); border-bottom-color: var(--primary-color); }
  .panel { display: flex; flex-direction: column; gap: 8px; padding: 12px; margin: 12px 0; border-radius: 8px; background: var(--secondary-background-color); }
  .deletebar { background: rgba(219, 68, 55, .08); padding: 8px; border-radius: 8px; }
  .cat { display: flex; justify-content: space-between; align-items: center; margin: 14px 0 4px; font-weight: 500; font-size: .85em; text-transform: uppercase; letter-spacing: .05em; color: var(--secondary-text-color); }
  .cat.packed-head { margin-top: 20px; color: var(--success-color, var(--secondary-text-color)); }
  .item { display: flex; align-items: center; gap: 10px; padding: 6px 2px; border-bottom: 1px solid var(--divider-color); }
  .item[data-action] { cursor: pointer; }
  .item ha-icon { color: var(--primary-color); flex: none; }
  .item.selected { background: rgba(219, 68, 55, .08); }
  .item.selected ha-icon { color: var(--error-color, #db4437); }
  .item.done .name { text-decoration: line-through; color: var(--secondary-text-color); }
  .item.editing { flex-direction: column; align-items: stretch; gap: 6px; padding: 8px; background: var(--secondary-background-color); border-radius: 8px; }
  .name { flex: 1; }
  .notes { display: block; font-size: .8em; color: var(--secondary-text-color); }
  .tags { font-size: .75em; color: var(--secondary-text-color); }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { border-radius: 16px; padding: 4px 10px; font-size: .85em; }
  .chip.on { background: var(--primary-color); color: var(--text-primary-color, #fff); border-color: var(--primary-color); }
  .label { font-size: .85em; color: var(--secondary-text-color); margin: 4px 0; }
  .check { display: flex; align-items: center; gap: 6px; font-size: .9em; }
  .tools { justify-content: space-between; }
  .add { margin-top: 12px; }
  .empty, .muted { color: var(--secondary-text-color); padding: 12px 0; }
  .small { font-size: .8em; }
  .error { color: var(--error-color); padding: 8px 0; }
  .notice { color: var(--success-color, var(--primary-color)); font-size: .9em; }
  .dialog { border: 1px solid var(--primary-color); }
  .dialog.danger { border-color: var(--error-color, #db4437); background: rgba(219, 68, 55, .08); }
  .dialog .msg { white-space: pre-line; }
  .excluded { font-size: .75em; color: var(--secondary-text-color); font-style: italic; }
  .tagpicker { display: flex; flex-direction: column; gap: 6px; }
  .tagpicker .chip.on .x { margin-left: 4px; opacity: .8; }
  .tagpicker .suggest .chip { border-style: dashed; }
  .combo { display: flex; flex-direction: column; flex: 1; min-width: 120px; }
  .combo input { width: 100%; }
  .combo-list { margin-top: 2px; max-height: 220px; overflow-y: auto; border: 1px solid var(--divider-color); border-radius: 6px; background: var(--card-background-color); }
  .combo-list[hidden] { display: none; }
  .combo-opt { padding: 8px; cursor: pointer; }
  .combo-opt:hover, .combo-opt.hl { background: var(--secondary-background-color); }
  .combo-opt.new { color: var(--primary-color); font-style: italic; }
  .qty { color: var(--secondary-text-color); margin-right: 4px; }
  .weight { font-size: .8em; color: var(--secondary-text-color); white-space: nowrap; }
  .cat .weight { font-size: 1em; text-transform: none; letter-spacing: 0; font-weight: normal; }
  .fields { display: flex; gap: 8px; flex-wrap: wrap; }
  .fields input { min-width: 100px; }
  .notesbox { white-space: pre-line; cursor: pointer; font-size: .9em; }
  .archived { background: rgba(127, 127, 127, .12); }
`;

class PackingListCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._lang = "en";
    this._data = null;
    this._sig = null;
    this._listId = null;
    this._packedMode = loadPackedMode();
    this._showNew = false;
    this._deleteMode = false;
    this._selected = new Set();
    this._editUid = null;
    this._notice = null;
    this._form = {};
    this._error = null;
    const root = this.shadowRoot;
    root.addEventListener("click", (ev) => {
      const el = ev.target.closest("[data-action]");
      if (el) this._action(el.dataset.action, el);
    });
    root.addEventListener("input", (ev) => {
      const key = ev.target.dataset.input;
      if (key) this._form[key] = ev.target.value;
      const tagKey = ev.target.dataset.tagkey;
      if (tagKey) {
        // A comma finishes a tag; otherwise just filter the suggestions (no re-render, keeps focus).
        if (ev.target.value.includes(",")) this._addDraftTags(tagKey);
        else this._updateSuggestions(tagKey);
      }
      if (ev.target.dataset.catkey) this._openCombo(ev.target.dataset.catkey);
    });
    // Category fields: the list of categories opens on focus and closes when leaving the field.
    root.addEventListener("focusin", (ev) => {
      if (ev.target.dataset?.catkey) this._openCombo(ev.target.dataset.catkey);
    });
    // Closing is delayed a little, so a click on a button below the list lands before the layout shifts.
    root.addEventListener("focusout", (ev) => {
      const input = ev.target;
      if (!input.dataset?.catkey) return;
      setTimeout(() => {
        if (this.shadowRoot.activeElement !== input) this._closeCombo(input.dataset.catkey);
      }, 200);
    });
    // Keep the focus in the field when an option is clicked/tapped.
    root.addEventListener("mousedown", (ev) => {
      if (ev.target.closest(".combo-opt")) ev.preventDefault();
    });
    root.addEventListener("change", (ev) => this._onChange(ev));
    root.addEventListener("keydown", (ev) => {
      if (ev.target.dataset.catkey && this._comboKey(ev)) return;
      // In a textarea Enter makes a new line; Ctrl/Cmd+Enter submits.
      const submit = ev.target.tagName === "TEXTAREA" ? ev.ctrlKey || ev.metaKey : true;
      if (ev.key === "Enter" && submit && ev.target.dataset.enter) {
        ev.preventDefault();
        this._action(ev.target.dataset.enter, ev.target);
      } else if (ev.key === "Escape" && this._editUid) {
        this._action("cancel-edit");
      } else if (ev.key === "Escape" && this._editItemUid) {
        this._action("cancel-edit-item");
      }
    });
  }

  // Translate a key, filling in {placeholders}.
  _t(key, params = {}) {
    const text = STRINGS[this._lang][key] ?? STRINGS.en[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? params[name] : match));
  }

  setConfig(config) {
    this._config = config || {};
    this._tab = this._config.default_tab || "pack";
    if (!PACKED_MODES.includes(this._packedMode)) {
      this._packedMode = this._config.packed_mode || "inline";
    }
    if (this._data) this._render();
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return 8;
  }

  set hass(hass) {
    this._hass = hass;
    const code = (hass.locale?.language || hass.language || "en").toLowerCase().split("-")[0];
    const lang = code in STRINGS ? code : "en";
    const languageChanged = lang !== this._lang;
    this._lang = lang;

    // Refetch when any packing list entity reports a new revision or one appears/disappears.
    let revision = 0;
    let count = 0;
    let version = null;
    for (const state of Object.values(hass.states)) {
      const attrs = state.attributes;
      if (attrs && attrs.packing_list_id !== undefined) {
        count += 1;
        revision = Math.max(revision, attrs.revision || 0);
        version = version || attrs.version;
      }
    }
    this._checkVersion(version);
    const sig = `${revision}|${count}`;
    if (sig !== this._sig) {
      this._sig = sig;
      this._fetch();
    } else if (languageChanged && this._data) {
      this._render();
    }
  }

  // After an update + restart the browser still runs the old card. Reload the page once
  // so it picks up the new version; sessionStorage guards against reload loops.
  _checkVersion(version) {
    if (!version || version === CARD_VERSION || version === this._checkedVersion) return;
    this._checkedVersion = version;
    try {
      if (sessionStorage.getItem(RELOADED_FOR_KEY) !== version) {
        sessionStorage.setItem(RELOADED_FOR_KEY, version);
        location.reload();
        return;
      }
    } catch {
      // No sessionStorage: can't guard against loops, so ask instead of reloading.
    }
    this._versionWarning = { version };
    this._render();
  }

  async _fetch() {
    try {
      this._data = await this._hass.callWS({ type: "packing_list/data" });
      this._error = null;
    } catch (err) {
      this._error = this._t("loadError", { error: err.message || err });
    }
    this._ensureList();
    this._render();
  }

  _ensureList() {
    const lists = this._data?.lists || [];
    // Follow the active list when it changes elsewhere (select entity, automation, another device),
    // unless the card is configured to show a specific list.
    const active = this._data?.active_list_id ?? null;
    const activeChanged = active !== this._lastActive;
    this._lastActive = active;
    if (activeChanged && active && !this._config.entity && lists.some((l) => l.list_id === active)) {
      if (this._listId !== active) this._exitDeleteMode();
      this._listId = active;
      return;
    }
    if (this._listId && lists.some((l) => l.list_id === this._listId)) return;
    const configured = this._config.entity && lists.find((l) => l.entity_id === this._config.entity);
    const activeList = lists.find((l) => l.list_id === active);
    this._listId = (configured || activeList || lists.find((l) => !l.archived) || lists[0])?.list_id ?? null;
    this._exitDeleteMode();
  }

  // Make a list the active one (the select entity, "remaining" sensor and other cards follow).
  async _setActive(list) {
    if (!list || list.archived || !list.entity_id || this._data?.active_list_id === list.list_id) return;
    this._lastActive = list.list_id;
    await this._call("packing_list", "set_active_list", { entity_id: list.entity_id });
  }

  // Weight limit as shown in an input: kg without unit, e.g. "23" or "7,5".
  _limitValue(grams) {
    return grams ? (grams / 1000).toLocaleString(this._lang, { maximumFractionDigits: 2 }) : "";
  }

  get _list() {
    return this._data?.lists.find((l) => l.list_id === this._listId) || null;
  }

  _byName(a, b) {
    return a.summary.localeCompare(b.summary, this._lang);
  }

  // The "always" tag to show: whichever the master list uses, else the one for the UI language.
  get _alwaysTag() {
    const used = new Set((this._data?.master || []).flatMap((m) => m.tags));
    return ALWAYS_TAGS.find((t) => used.has(t)) || (this._lang === "da" ? "altid" : "always");
  }

  // Tags used on the master list; the "always" tags are left out where they can't be used for picking.
  _allTags(includeAlways = false) {
    const tags = new Set();
    for (const item of this._data?.master || []) item.tags.forEach((t) => tags.add(t));
    if (!includeAlways) ALWAYS_TAGS.forEach((t) => tags.delete(t));
    return [...tags].sort((a, b) => a.localeCompare(b, this._lang));
  }

  // All categories in use on the master list and the packing lists (case-insensitively unique).
  _categories() {
    const cats = new Map();
    const items = [...(this._data?.master || []), ...(this._data?.lists || []).flatMap((l) => l.items)];
    for (const { category } of items) {
      if (category && !cats.has(category.toLowerCase())) cats.set(category.toLowerCase(), category);
    }
    return [...cats.values()].sort((a, b) => a.localeCompare(b, this._lang));
  }

  // Weight is offered once a list uses it or a master item has a weight.
  get _weightInUse() {
    return (this._data?.lists || []).some((l) => l.use_weight) || (this._data?.master || []).some((m) => m.weight);
  }

  _fmtWeight(grams) {
    const kg = grams >= 1000;
    const value = (kg ? grams / 1000 : grams).toLocaleString(this._lang, { maximumFractionDigits: kg ? 2 : 0 });
    return `${value} ${kg ? "kg" : "g"}`;
  }

  // Quantity in front of the name, e.g. "3× Socks".
  _qty(item) {
    return item.quantity ? `<span class="qty">${esc(item.quantity)}×</span>` : "";
  }

  _weightLabel(item) {
    if (!item.weight) return "";
    const title = item.quantity > 1 ? ` title="${esc(`${item.quantity} × ${this._fmtWeight(item.weight)}`)}"` : "";
    return `<span class="weight"${title}>${esc(this._fmtWeight(itemWeight(item)))}</span>`;
  }

  // Text for an input holding a weight in grams.
  _weightValue(grams) {
    return grams ? String(grams).replace(".", this._lang === "da" ? "," : ".") : "";
  }

  _categoryLabel(cat) {
    return cat === UNCATEGORIZED ? this._t("uncategorized") : cat;
  }

  // Items grouped by category; categories and items sorted alphabetically, uncategorized last.
  _group(items) {
    const groups = new Map();
    for (const item of items) {
      const cat = item.category || UNCATEGORIZED;
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(item);
    }
    for (const catItems of groups.values()) catItems.sort((a, b) => this._byName(a, b));
    return [...groups.entries()].sort(([a], [b]) =>
      a === UNCATEGORIZED ? 1 : b === UNCATEGORIZED ? -1 : a.localeCompare(b, this._lang),
    );
  }

  _checkbox(on) {
    return `<ha-icon icon="${on ? "mdi:checkbox-marked" : "mdi:checkbox-blank-outline"}"></ha-icon>`;
  }

  _exitDeleteMode() {
    this._deleteMode = false;
    this._selected = new Set();
  }

  // ------------------------------------------------------------ tag picker
  // Selected tags live in this._form[key] (array), the typed text in this._form[key + "Draft"].

  _renderTagPicker(key, submitAction) {
    const selected = this._form[key] || [];
    const chips = selected
      .map(
        (t) =>
          `<button class="chip on" data-action="tag-remove" data-key="${key}" data-tag="${esc(t)}" title="${esc(this._t("remove"))}">#${esc(t)}<span class="x">×</span></button>`,
      )
      .join("");
    const autofocus = this._focusTagKey === key ? "data-autofocus" : "";
    return `<div class="tagpicker">
        ${chips ? `<div class="chips">${chips}</div>` : ""}
        <input data-input="${key}Draft" data-tagkey="${key}" data-enter="tag-add" data-submit="${submitAction}" ${autofocus}
          placeholder="${esc(this._t("tagsPlaceholder"))}" value="${esc(this._form[`${key}Draft`] || "")}">
        <div class="chips suggest" data-suggest="${key}">${this._suggestionChips(key)}</div>
      </div>`;
  }

  _suggestionChips(key) {
    const selected = new Set(this._form[key] || []);
    const draft = splitTags(this._form[`${key}Draft`]).at(-1) || "";
    return this._allTags(true)
      .filter((t) => !selected.has(t) && t.includes(draft))
      .map((t) => `<button class="chip" data-action="tag-pick" data-key="${key}" data-tag="${esc(t)}">+ #${esc(t)}</button>`)
      .join("");
  }

  _updateSuggestions(key) {
    const box = this.shadowRoot.querySelector(`[data-suggest="${key}"]`);
    if (box) box.innerHTML = this._suggestionChips(key);
  }

  // Move typed tags into the selection. Returns true if anything was typed.
  _addDraftTags(key) {
    const typed = splitTags(this._form[`${key}Draft`]);
    this._form[`${key}Draft`] = "";
    this._form[key] = [...new Set([...(this._form[key] || []), ...typed])];
    this._focusTagKey = key;
    this._render();
    this._focusTagKey = null;
    return typed.length > 0;
  }

  // Selected tags plus anything still in the input (so a typed tag isn't lost on save).
  _tagsFor(key) {
    return [...new Set([...(this._form[key] || []), ...splitTags(this._form[`${key}Draft`])])];
  }

  // ------------------------------------------------------- category picker
  // A text field with a list of existing categories that is filtered while typing.
  // A category that doesn't exist yet is simply created when the item is saved.

  _renderCategoryInput(key, { placeholder, enter = "", autofocus = false }) {
    return `<div class="combo">
        <input data-input="${key}" data-catkey="${key}" ${enter ? `data-enter="${enter}"` : ""} ${autofocus ? "data-autofocus" : ""}
          autocomplete="off" placeholder="${esc(placeholder)}" value="${esc(this._form[key] || "")}">
        <div class="combo-list" data-catlist="${key}" hidden></div>
      </div>`;
  }

  _categoryOptions(key) {
    const typed = (this._form[key] || "").trim();
    const query = typed.toLowerCase();
    const cats = this._categories().filter((c) => c.toLowerCase().includes(query));
    // Categories starting with the typed text first; otherwise alphabetical.
    cats.sort((a, b) => b.toLowerCase().startsWith(query) - a.toLowerCase().startsWith(query));
    const option = (value, label, cls = "") =>
      `<div class="combo-opt ${cls}" data-action="cat-pick" data-key="${key}" data-value="${esc(value)}">${esc(label)}</div>`;
    let html = cats.map((c) => option(c, c)).join("");
    if (typed && !cats.some((c) => sameText(c, typed))) html += option(typed, this._t("newCategory", { category: typed }), "new");
    return html;
  }

  _openCombo(key) {
    const box = this.shadowRoot.querySelector(`[data-catlist="${key}"]`);
    if (!box) return;
    box.innerHTML = this._categoryOptions(key);
    box.hidden = !box.innerHTML;
  }

  _closeCombo(key) {
    const box = this.shadowRoot.querySelector(`[data-catlist="${key}"]`);
    if (box) box.hidden = true;
  }

  // Arrow keys, Enter and Escape in an open category list. Returns true if handled.
  _comboKey(ev) {
    const key = ev.target.dataset.catkey;
    const box = this.shadowRoot.querySelector(`[data-catlist="${key}"]`);
    if (!box || box.hidden) return false;
    const options = [...box.querySelectorAll(".combo-opt")];
    const current = options.findIndex((o) => o.classList.contains("hl"));
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      const next = (current + (ev.key === "ArrowDown" ? 1 : options.length - 1 + (current < 0 ? 1 : 0))) % options.length;
      options.forEach((o, i) => o.classList.toggle("hl", i === next));
      options[next]?.scrollIntoView?.({ block: "nearest" });
      return true;
    }
    if (ev.key === "Enter" && current >= 0) {
      ev.preventDefault();
      this._pickCategory(key, options[current].dataset.value);
      return true;
    }
    if (ev.key === "Escape") {
      this._closeCombo(key);
      return true;
    }
    return false;
  }

  _pickCategory(key, value) {
    this._form[key] = value;
    const input = this.shadowRoot.querySelector(`[data-catkey="${key}"]`);
    if (input) input.value = value;
    this._closeCombo(key);
  }

  // ---------------------------------------------------------------- dialogs
  // In-card confirmation (native confirm() can be suppressed, e.g. in the companion app).
  // The dialog is rendered where _renderDialog(anchor) is placed, next to what triggered it.

  // Resolves with the value of the chosen button; the last button is the "cancel" one.
  _choose(anchor, message, buttons, { danger = false } = {}) {
    this._dialog?.resolve(this._dialog.buttons.at(-1).value);
    return new Promise((resolve) => {
      this._dialog = { anchor, message, buttons, danger, resolve };
      this._render();
    });
  }

  _ask(anchor, message, { yes, no, danger = false } = {}) {
    return this._choose(
      anchor,
      message,
      [
        { label: yes, value: true, style: danger ? "danger" : "primary" },
        { label: no ?? this._t("cancel"), value: false },
      ],
      { danger },
    );
  }

  _renderDialog(anchor) {
    const d = this._dialog;
    if (!d || d.anchor !== anchor) return "";
    return `<div class="panel dialog ${d.danger ? "danger" : ""}">
        <div class="msg">${esc(d.message)}</div>
        <div class="row">${d.buttons
          .map(
            (b, i) =>
              `<button class="${b.style || ""}" data-action="dialog-choice" data-index="${i}">${esc(b.label)}</button>`,
          )
          .join("")}</div>
      </div>`;
  }

  _closeDialog(index) {
    const d = this._dialog;
    if (!d) return;
    this._dialog = null;
    this._render();
    d.resolve((d.buttons[index] ?? d.buttons.at(-1)).value);
  }

  // Master items not on the list that match tags/categories, split into new and previously deleted.
  _matching(list, { tags = [], categories = [], includeAlways = false, uids = null }) {
    const wantedTags = new Set(tags);
    if (includeAlways) ALWAYS_TAGS.forEach((t) => wantedTags.add(t));
    const wantedCats = new Set(categories.map((c) => c.toLowerCase()));
    const excluded = new Set(list.excluded || []);
    const result = { fresh: [], deleted: [] };
    for (const m of this._data.master) {
      const matches = uids
        ? uids.includes(m.uid)
        : m.tags.some((t) => wantedTags.has(t)) || (m.category && wantedCats.has(m.category.toLowerCase()));
      if (!matches || this._listItemFor(list, m)) continue;
      (excluded.has(m.uid) ? result.deleted : result.fresh).push(m);
    }
    return result;
  }

  // Ask whether previously deleted items should come along. Returns true/false, or null if cancelled.
  async _askIncludeDeleted(anchor, list, criteria, label) {
    const { fresh, deleted } = this._matching(list, criteria);
    if (!deleted.length) return false;
    const one = deleted.length === 1;
    const names = deleted.map((m) => m.summary).sort((a, b) => a.localeCompare(b, this._lang));
    const shown = names.slice(0, 5).join(", ") + (names.length > 5 ? this._t("andMore", { count: names.length - 5 }) : "");
    const params = { label, names: shown, count: deleted.length };
    if (fresh.length) {
      return this._choose(anchor, this._t(one ? "someDeletedOne" : "someDeletedMany", params), [
        { label: this._t(one ? "alsoDeletedOne" : "alsoDeletedMany"), value: true, style: "primary" },
        { label: this._t("onlyNew", { count: fresh.length }), value: false },
        { label: this._t("cancel"), value: null },
      ]);
    }
    return this._choose(anchor, this._t(one ? "onlyDeletedOne" : "onlyDeletedMany", params), [
      { label: this._t(one ? "againOne" : "againMany"), value: true, style: "primary" },
      { label: this._t("cancel"), value: null },
    ]);
  }

  // ------------------------------------------------------------------ render

  _render() {
    const title = this._config.title ?? this._t("title");
    let body;
    if (!this._data) {
      body = this._error ? "" : `<div class="empty">${esc(this._t("loading"))}</div>`;
    } else {
      body =
        this._renderHeader() +
        (this._showNew ? this._renderNew() : "") +
        (this._showEditList && this._list ? this._renderEditList(this._list) : "") +
        (this._showCopyList && this._list ? this._renderCopyList(this._list) : "") +
        this._renderTabs() +
        this._renderTab();
    }
    const warning = this._versionWarning ? this._t("versionWarning", this._versionWarning) : null;
    const error = [warning, this._error]
      .filter(Boolean)
      .map((msg) => `<div class="error">${esc(msg)}</div>`)
      .join("");
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      <ha-card>${title ? `<div class="title">${esc(title)}</div>` : ""}${error}${body}</ha-card>`;
    this.shadowRoot.querySelector("[data-autofocus]")?.focus();
    this.shadowRoot.querySelector(".dialog")?.scrollIntoView?.({ block: "nearest" });
  }

  _renderHeader() {
    const lists = this._data.lists;
    const list = this._list;
    const option = (l) =>
      `<option value="${esc(l.list_id)}" ${l.list_id === this._listId ? "selected" : ""}>${esc(l.name)}</option>`;
    const active = lists.filter((l) => !l.archived);
    const archived = lists.filter((l) => l.archived);
    const select = lists.length
      ? `<select data-change="select-list">${active.map(option).join("")}${
          archived.length
            ? `<optgroup label="${esc(this._t("archivedHeading"))}">${archived.map(option).join("")}</optgroup>`
            : ""
        }</select>`
      : `<span class="muted" style="flex:1">${esc(this._t("noLists"))}</span>`;

    let progress = "";
    if (list) {
      const total = list.items.length;
      const packed = list.items.filter((i) => i.packed).length;
      const pct = total ? Math.round((packed * 100) / total) : 0;
      const totalWeight = list.items.reduce((sum, i) => sum + itemWeight(i), 0);
      const limit = list.use_weight ? list.weight_limit : null;
      const weight = list.use_weight
        ? ` · ${this._t("weightProgress", {
            packed: this._fmtWeight(list.items.filter((i) => i.packed).reduce((sum, i) => sum + itemWeight(i), 0)),
            total: this._fmtWeight(totalWeight),
          })}` + (limit ? ` · ${this._t("limitInfo", { limit: this._fmtWeight(limit) })}` : "")
        : "";
      const over =
        limit && totalWeight > limit
          ? `<div class="error overlimit">${esc(this._t("overLimit", { over: this._fmtWeight(totalWeight - limit) }))}</div>`
          : "";
      progress = `<div class="progress"><div class="bar"><div style="width:${pct}%"></div></div>
        <span>${esc(this._t("progress", { packed, total }) + weight)}</span></div>${over}`;
    }
    const icon = (action, iconName, title, cls = "") =>
      `<button class="icon ${cls}" data-action="${action}" title="${esc(this._t(title))}"><ha-icon icon="${iconName}"></ha-icon></button>`;
    const listButtons = list
      ? icon("toggle-edit-list", "mdi:pencil-outline", "editListTitle", this._showEditList ? "active" : "") +
        icon("toggle-copy-list", "mdi:content-copy", "copyList", this._showCopyList ? "active" : "") +
        (list.archived
          ? icon("unarchive-list", "mdi:archive-arrow-up-outline", "unarchive")
          : icon("archive-list", "mdi:archive-arrow-down-outline", "archive")) +
        icon("delete-list", "mdi:delete-outline", "deleteList")
      : "";
    const archivedNotice = list?.archived
      ? `<div class="panel archived row tools"><span>${esc(this._t("archivedNotice"))}</span>
          <button data-action="unarchive-list"><ha-icon icon="mdi:archive-arrow-up-outline"></ha-icon> ${esc(this._t("unarchive"))}</button></div>`
      : "";
    return `<div class="row header">${select}
        <button data-action="toggle-new" class="${this._showNew ? "active" : ""}">${esc(this._t("newList"))}</button>
        ${listButtons}
      </div>${this._renderDialog("header")}${archivedNotice}${progress}`;
  }

  _renderEditList(list) {
    const f = this._form;
    return `<div class="panel">
      <div class="label">${esc(this._t("editListTitle"))}</div>
      <input data-input="lName" data-enter="save-list" ${this._focusPanel === "edit" ? "data-autofocus" : ""} placeholder="${esc(this._t("listName"))}" value="${esc(f.lName || "")}">
      <textarea data-input="lNotes" data-enter="save-list" rows="3" placeholder="${esc(this._t("notesPlaceholder"))}">${esc(f.lNotes || "")}</textarea>
      <label class="check"><input type="checkbox" data-change="lWeight" ${f.lWeight ? "checked" : ""}>
        ${esc(this._t("useWeight"))}</label>
      ${f.lWeight ? this._renderLimitInput("lLimit", "save-list") : ""}
      <div class="row"><button class="primary" data-action="save-list">${esc(this._t("save"))}</button>
        <button data-action="toggle-edit-list">${esc(this._t("cancel"))}</button></div>
    </div>`;
  }

  _renderLimitInput(key, enter) {
    return `<input data-input="${key}" data-enter="${enter}" inputmode="decimal"
      placeholder="${esc(this._t("weightLimit"))}" value="${esc(this._form[key] || "")}">`;
  }

  _renderCopyList(list) {
    const f = this._form;
    return `<div class="panel">
      <div class="label">${esc(this._t("copyHeading", { name: list.name }))}</div>
      <input data-input="cpName" data-enter="copy-list" ${this._focusPanel === "copy" ? "data-autofocus" : ""}
        placeholder="${esc(this._t("listName"))}" value="${esc(f.cpName || "")}">
      <div class="muted small" style="padding:0">${esc(this._t("copyHint"))}</div>
      <div class="row"><button class="primary" data-action="copy-list">${esc(this._t("copy"))}</button>
        <button data-action="toggle-copy-list">${esc(this._t("cancel"))}</button></div>
    </div>`;
  }

  // Shown on the master tab when a newer release added items to the default list.
  _renderNewDefaults() {
    const items = this._data.new_defaults || [];
    if (!items.length) return "";
    const names = items.map((i) => i.summary).join(", ");
    const text = this._t(items.length === 1 ? "newDefaultsOne" : "newDefaultsMany", { count: items.length, names });
    return `<div class="panel dialog">
      <div class="msg">${esc(text)}\n${esc(this._t("newDefaultsNote"))}</div>
      <div class="row"><button class="primary" data-action="add-defaults">${esc(this._t("addDefaults"))}</button>
        <button data-action="skip-defaults">${esc(this._t("skipDefaults"))}</button></div>
    </div>`;
  }

  _renderNew() {
    const f = this._form;
    const selected = new Set(f.newTags || []);
    const chips = this._allTags()
      .map(
        (t) =>
          `<button class="chip ${selected.has(t) ? "on" : ""}" data-action="toggle-new-tag" data-tag="${esc(t)}">#${esc(t)}</button>`,
      )
      .join("");
    return `<div class="panel">
      <input data-input="newName" data-enter="create-list" placeholder="${esc(this._t("newListName"))}" value="${esc(f.newName || "")}">
      <textarea data-input="newNotes" rows="2" placeholder="${esc(this._t("notesPlaceholder"))}">${esc(f.newNotes || "")}</textarea>
      <div class="label">${esc(this._t("addWithTags"))}</div>
      <div class="chips">${chips || `<span class="muted small">${esc(this._t("noMasterTags"))}</span>`}</div>
      <label class="check"><input type="checkbox" data-change="newAlways" ${f.newAlways !== false ? "checked" : ""}>
        ${esc(this._t("includeAlways", { tag: this._alwaysTag }))}</label>
      <label class="check"><input type="checkbox" data-change="newWeight" ${f.newWeight ? "checked" : ""}>
        ${esc(this._t("useWeight"))}</label>
      ${f.newWeight ? this._renderLimitInput("newLimit", "create-list") : ""}
      <div class="row"><button class="primary" data-action="create-list">${esc(this._t("create"))}</button>
        <button data-action="toggle-new">${esc(this._t("cancel"))}</button></div>
    </div>`;
  }

  _renderTabs() {
    const tabs = [
      ["pack", "tabPack"],
      ["pick", "tabPick"],
      ["master", "tabMaster"],
    ];
    return `<div class="tabs">${tabs
      .map(
        ([key, label]) =>
          `<button data-action="tab" data-tab="${key}" class="${this._tab === key ? "on" : ""}">${esc(this._t(label))}</button>`,
      )
      .join("")}</div>`;
  }

  _renderTab() {
    if (this._tab === "master") return this._renderMaster();
    const list = this._list;
    if (!list) return `<div class="empty">${esc(this._t("createListFirst"))}</div>`;
    return this._tab === "pick" ? this._renderPick(list) : this._renderPack(list);
  }

  // ---------------------------------------------------------------- pack tab

  // A list item that isn't on the master list (neither linked nor by name in the same category).
  _notInMaster(item) {
    return (
      !item.master_uid &&
      !this._data.master.some((m) => sameText(m.summary, item.summary) && sameText(m.category, item.category))
    );
  }

  _packRow(item, list) {
    const notes = item.notes ? `<span class="notes">${esc(item.notes)}</span>` : "";
    const name = `<span class="name">${this._qty(item)}${esc(item.summary)}${notes}</span>`;
    const weight = list.use_weight ? this._weightLabel(item) : "";
    if (this._deleteMode) {
      const on = this._selected.has(item.uid);
      return `<div class="item ${on ? "selected" : ""}" data-action="toggle-select" data-uid="${esc(item.uid)}">
          ${this._checkbox(on)}${name}${weight}
        </div>`;
    }
    if (item.uid === this._editItemUid) {
      const f = this._form;
      const linked = list.use_weight && item.master_uid && this._data.master.some((m) => m.uid === item.master_uid);
      return `<div class="item editing">
          <div class="label">${esc(item.summary)} – ${esc(this._t("editItemTitle"))}</div>
          <div class="fields">
            <input data-input="iQty" data-enter="save-edit-item" data-autofocus inputmode="numeric" placeholder="${esc(this._t("quantityOptional"))}" value="${esc(f.iQty || "")}">
            ${list.use_weight ? `<input data-input="iWeight" data-enter="save-edit-item" inputmode="decimal" placeholder="${esc(this._t("weightPerPiece"))}" value="${esc(f.iWeight || "")}">` : ""}
          </div>
          ${linked ? `<label class="check"><input type="checkbox" data-change="iToMaster" ${f.iToMaster !== false ? "checked" : ""}> ${esc(this._t("saveWeightToMaster"))}</label>` : ""}
          <div class="row"><button class="primary" data-action="save-edit-item">${esc(this._t("save"))}</button>
            <button data-action="cancel-edit-item">${esc(this._t("cancel"))}</button></div>
        </div>`;
    }
    if (item.uid === this._toMasterUid) {
      return `<div class="item editing">
          <div class="label">${esc(this._t("saveToMasterHeading", { name: item.summary }))}</div>
          ${this._renderCategoryInput("cCat", { placeholder: this._t("categoryExample"), enter: "save-to-master", autofocus: true })}
          ${this._renderTagPicker("cTags", "save-to-master")}
          <div class="row"><button class="primary" data-action="save-to-master">${esc(this._t("saveToMaster"))}</button>
            <button data-action="cancel-to-master">${esc(this._t("cancel"))}</button></div>
        </div>`;
    }
    const toMaster = this._notInMaster(item)
      ? `<button class="icon" data-action="open-to-master" data-uid="${esc(item.uid)}" title="${esc(this._t("saveToMasterTitle"))}">
          <ha-icon icon="mdi:playlist-plus"></ha-icon></button>`
      : "";
    return `<div class="item ${item.packed ? "done" : ""}" data-action="toggle-packed" data-uid="${esc(item.uid)}">
        ${this._checkbox(item.packed)}${name}${weight}${toMaster}
        <button class="icon" data-action="edit-item" data-uid="${esc(item.uid)}" title="${esc(this._t("editItemTitle"))}">
          <ha-icon icon="mdi:pencil-outline"></ha-icon></button>
      </div>`;
  }

  _renderAddExtra(list) {
    const f = this._form;
    const details = this._showExtraDetails
      ? `<div class="panel">
          ${this._renderCategoryInput("xCat", { placeholder: this._t("categoryExample") })}
          <div class="fields">
            <input data-input="xQty" inputmode="numeric" placeholder="${esc(this._t("quantityOptional"))}" value="${esc(f.xQty || "")}">
            ${list.use_weight ? `<input data-input="xWeight" inputmode="decimal" placeholder="${esc(this._t("weightPerPiece"))}" value="${esc(f.xWeight || "")}">` : ""}
          </div>
          ${this._renderTagPicker("xTags", "add-extra")}
          <label class="check"><input type="checkbox" data-change="xToMaster" ${f.xToMaster !== false ? "checked" : ""}>
            ${esc(this._t("alsoSaveToMaster"))}</label>
        </div>`
      : "";
    return `<div class="row add">
        <input data-input="extraItem" data-enter="add-extra" placeholder="${esc(this._t("newItem"))}" value="${esc(f.extraItem || "")}">
        <button class="icon ${this._showExtraDetails ? "active" : ""}" data-action="toggle-extra-details" title="${esc(this._t("detailsTitle"))}">
          <ha-icon icon="mdi:tune-variant"></ha-icon></button>
        <button data-action="add-extra">${esc(this._t("add"))}</button>
      </div>${details}`;
  }

  _renderPack(list) {
    // In delete mode everything is shown in its category, so any item can be selected.
    const mode = this._deleteMode ? "inline" : this._packedMode;
    const packed = list.items.filter((i) => i.packed);
    const shown = mode === "inline" ? list.items : list.items.filter((i) => !i.packed);
    // Weight per category counts every item in it, also packed ones shown elsewhere.
    const catWeight = new Map();
    for (const item of list.items) {
      const cat = item.category || UNCATEGORIZED;
      catWeight.set(cat, (catWeight.get(cat) || 0) + itemWeight(item));
    }
    const weightOf = (grams) => (list.use_weight ? `<span class="weight">${esc(this._fmtWeight(grams))}</span>` : "");
    let groups = this._group(shown)
      .map(
        ([cat, catItems]) =>
          `<div class="cat"><span>${esc(this._categoryLabel(cat))}</span>${weightOf(catWeight.get(cat))}</div>` +
          catItems.map((i) => this._packRow(i, list)).join(""),
      )
      .join("");
    if (mode === "bottom" && packed.length) {
      groups +=
        `<div class="cat packed-head"><span>${esc(this._t("packedHeading", { count: packed.length }))}</span>` +
        `${weightOf(packed.reduce((sum, i) => sum + itemWeight(i), 0))}</div>` +
        [...packed].sort((a, b) => this._byName(a, b)).map((i) => this._packRow(i, list)).join("");
    }
    const empty = this._t(list.items.length ? "allPacked" : "listEmpty");
    const notes = list.notes && !this._showEditList
      ? `<div class="panel notesbox" data-action="toggle-edit-list" title="${esc(this._t("editListTitle"))}">${esc(list.notes)}</div>`
      : "";
    return `${notes}
      ${this._deleteMode ? this._renderDeleteBar(list) : this._renderPackTools(list)}
      ${groups || `<div class="empty">${esc(empty)}</div>`}
      ${this._deleteMode ? "" : this._renderAddExtra(list)}`;
  }

  // What "Fetch again" fetches, e.g. "#ski, #always, Clothes" – empty if the list has no criteria.
  _refreshCriteria(list) {
    return [
      ...(list.tags || []).map((t) => `#${t}`),
      ...(list.include_always ? [`#${this._alwaysTag}`] : []),
      ...(list.categories || []),
    ];
  }

  _renderPackTools(list) {
    const labels = { inline: "packedInline", bottom: "packedBottom", hide: "packedHide" };
    const modes = PACKED_MODES.map(
      (value) =>
        `<option value="${value}" ${value === this._packedMode ? "selected" : ""}>${esc(this._t(labels[value]))}</option>`,
    ).join("");
    const criteria = this._refreshCriteria(list);
    const refresh = criteria.length
      ? `<button data-action="refresh-list" title="${esc(this._t("refreshTitle", { criteria: criteria.join(", ") }))}">
          <ha-icon icon="mdi:refresh"></ha-icon> ${esc(this._t("refresh"))}</button>`
      : "";
    const packed = list.items.filter((i) => i.packed).length;
    return `<div class="row tools">
        <select data-change="packedMode" title="${esc(this._t("packedModeTitle"))}">${modes}</select>
        <div class="row">
          ${refresh}
          ${list.items.length ? `<button data-action="delete-mode" title="${esc(this._t("deleteItemsTitle"))}"><ha-icon icon="mdi:delete-outline"></ha-icon> ${esc(this._t("deleteItems"))}</button>` : ""}
          <button data-action="reset-list" ${packed ? "" : "disabled"} title="${esc(this._t("uncheckTitle"))}">
            <ha-icon icon="mdi:checkbox-blank-off-outline"></ha-icon> ${esc(this._t("uncheck"))}</button>
        </div>
      </div>
      ${this._renderDialog("pack-tools")}
      ${this._packNotice ? `<div class="notice">${esc(this._packNotice)}</div>` : ""}`;
  }

  _renderDeleteBar(list) {
    const count = this._selected.size;
    const all = count === list.items.length;
    return `<div class="row tools deletebar">
        <span class="small">${esc(this._t("deleteHint"))}</span>
        <div class="row">
          <button data-action="select-all">${esc(this._t(all ? "deselectAll" : "selectAll"))}</button>
          <button class="danger" data-action="delete-selected" ${count ? "" : "disabled"}>${esc(count ? this._t("deleteCount", { count }) : this._t("delete"))}</button>
          <button data-action="cancel-delete">${esc(this._t("cancel"))}</button>
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------- pick tab

  // The list item that corresponds to a master item (by master uid, else by name and category).
  _listItemFor(list, master) {
    return (
      list.items.find((i) => i.master_uid === master.uid) ||
      list.items.find((i) => sameText(i.summary, master.summary) && sameText(i.category, master.category)) ||
      null
    );
  }

  _renderPick(list) {
    const excluded = new Set(list.excluded || []);
    const chips = this._allTags()
      .map((t) => `<button class="chip" data-action="pick-tag" data-tag="${esc(t)}">+ #${esc(t)}</button>`)
      .join("");
    const groups = this._group(this._data.master)
      .map(
        ([cat, catItems]) =>
          `<div class="cat">${esc(this._categoryLabel(cat))}<button class="link" data-action="pick-category" data-cat="${esc(cat)}">${esc(this._t("addAll"))}</button></div>` +
          this._renderDialog(`cat:${cat}`) +
          catItems
            .map((m) => {
              const onList = this._listItemFor(list, m);
              const hint =
                !onList && excluded.has(m.uid) ? `<span class="excluded">${esc(this._t("deletedFromList"))}</span>` : "";
              return `<div class="item" data-action="pick-toggle" data-uid="${esc(m.uid)}">
                ${this._checkbox(onList)}
                <span class="name">${esc(m.summary)}</span>${hint}
                <span class="tags">${m.tags.map((t) => `#${esc(t)}`).join(" ")}</span>
              </div>`;
            })
            .join(""),
      )
      .join("");
    return `<div class="label">${esc(this._t("addAllWithTag"))}</div>
      <div class="chips">${chips || `<span class="muted small">${esc(this._t("noTags"))}</span>`}</div>
      ${this._renderDialog("pick-tags")}
      ${groups || `<div class="empty">${esc(this._t("masterEmptyPick"))}</div>`}`;
  }

  // -------------------------------------------------------------- master tab

  _renderMasterRow(m) {
    if (m.uid === this._editUid) {
      const f = this._form;
      return `<div class="item editing">
          <input data-input="eName" data-enter="save-edit" ${this._focusEditName ? "data-autofocus" : ""} placeholder="${esc(this._t("name"))}" value="${esc(f.eName)}">
          ${this._renderCategoryInput("eCat", { placeholder: this._t("categoryOptional"), enter: "save-edit" })}
          <div class="fields">
            <input data-input="eQty" data-enter="save-edit" inputmode="numeric" placeholder="${esc(this._t("quantityOptional"))}" value="${esc(f.eQty || "")}">
            ${this._weightInUse ? `<input data-input="eWeight" data-enter="save-edit" inputmode="decimal" placeholder="${esc(this._t("weightPerPiece"))}" value="${esc(f.eWeight || "")}">` : ""}
          </div>
          ${this._renderTagPicker("eTags", "save-edit")}
          ${this._editError ? `<div class="error">${esc(this._editError)}</div>` : ""}
          <div class="row"><button class="primary" data-action="save-edit">${esc(this._t("save"))}</button>
            <button data-action="cancel-edit">${esc(this._t("cancel"))}</button></div>
        </div>`;
    }
    return `<div class="item">
        <span class="name">${this._qty(m)}${esc(m.summary)}${m.notes ? `<span class="notes">${esc(m.notes)}</span>` : ""}</span>
        <span class="tags">${m.tags.map((t) => `#${esc(t)}`).join(" ")}</span>
        ${m.weight ? `<span class="weight">${esc(this._fmtWeight(m.weight))}</span>` : ""}
        <button class="icon" data-action="edit-master" data-uid="${esc(m.uid)}" title="${esc(this._t("editTitle"))}">
          <ha-icon icon="mdi:pencil-outline"></ha-icon></button>
        <button class="icon" data-action="delete-master" data-uid="${esc(m.uid)}" title="${esc(this._t("deleteFromMaster"))}">
          <ha-icon icon="mdi:delete-outline"></ha-icon></button>
      </div>`;
  }

  _renderMaster() {
    const f = this._form;
    const groups = this._group(this._data.master)
      .map(
        ([cat, catItems]) =>
          `<div class="cat">${esc(this._categoryLabel(cat))}</div>` + catItems.map((m) => this._renderMasterRow(m)).join(""),
      )
      .join("");
    return `${this._renderNewDefaults()}<div class="panel">
        <div class="label">${esc(this._t("masterAddHint"))}</div>
        <textarea data-input="mNames" data-enter="add-master" rows="4"
          placeholder="${esc(this._t("masterNamesExample")).replace(/\n/g, "&#10;")}">${esc(f.mNames || "")}</textarea>
        ${this._renderCategoryInput("mCat", { placeholder: this._t("masterCategoryExample") })}
        ${this._renderTagPicker("mTags", "add-master")}
        <div class="muted small" style="padding:0">${esc(this._t("alwaysHint", { tag: this._alwaysTag }))}</div>
        <div class="row"><button class="primary" data-action="add-master">${esc(this._t("addToMaster"))}</button>
          ${this._notice ? `<span class="notice">${esc(this._notice)}</span>` : ""}</div>
        ${this._renderDialog("add-master")}
      </div>
      ${groups || `<div class="empty">${esc(this._t("masterEmpty"))}</div>`}
      <div class="row add"><button data-action="reset-master">
        <ha-icon icon="mdi:restore"></ha-icon> ${esc(this._t("resetMaster"))}</button></div>
      ${this._renderDialog("reset-master")}`;
  }

  // ----------------------------------------------------------------- actions

  _onChange(ev) {
    const key = ev.target.dataset.change;
    if (key === "select-list") {
      this._listId = ev.target.value;
      this._exitDeleteMode();
      this._toMasterUid = null;
      this._editItemUid = null;
      this._showEditList = false;
      this._showCopyList = false;
      this._packNotice = null;
      this._render();
      this._setActive(this._list).catch((err) => {
        this._error = err.message || String(err);
        this._render();
      });
    } else if (key === "packedMode") {
      this._packedMode = ev.target.value;
      try {
        localStorage.setItem(PACKED_MODE_KEY, this._packedMode);
      } catch {
        // Not persisted (private mode etc.) – the choice still applies until reload.
      }
      this._render();
    } else if (key === "newAlways") {
      this._form.newAlways = ev.target.checked;
    } else if (key === "newWeight") {
      this._form.newWeight = ev.target.checked;
      this._render(); // show/hide the weight limit field
    } else if (key === "lWeight") {
      this._form.lWeight = ev.target.checked;
      this._render();
    } else if (key === "iToMaster") {
      this._form.iToMaster = ev.target.checked;
    } else if (key === "xToMaster") {
      this._form.xToMaster = ev.target.checked;
    }
  }

  _call(domain, service, data, target) {
    return this._hass.callService(domain, service, data, target);
  }

  _callWithResponse(service, data) {
    return this._hass
      .callWS({ type: "call_service", domain: "packing_list", service, service_data: data, return_response: true })
      .then((result) => result?.response || {});
  }

  _categoryUids(category) {
    return this._data.master.filter((m) => (m.category || UNCATEGORIZED) === category).map((m) => m.uid);
  }

  async _addMaster() {
    const f = this._form;
    const names = (f.mNames || "").split("\n").map((s) => s.trim()).filter(Boolean);
    if (!names.length) return;
    const category = (f.mCat || "").trim();

    // The same name may exist once per category. If it only exists in other categories, ask whether
    // to move it, create a separate item in this category, or keep it (it then just gets the new tags).
    const move = [];
    const duplicate = [];
    if (category) {
      for (const name of names) {
        const same = this._data.master.filter((m) => sameText(m.summary, name));
        if (!same.length || same.some((m) => sameText(m.category, category))) continue;
        const from = same
          .map((m) => (m.category ? this._t("inCategory", { category: m.category }) : this._t("noCategory")))
          .join(this._t("andWord"));
        const buttons = [
          ...(same.length === 1 ? [{ label: this._t("moveYes", { category }), value: "move" }] : []),
          { label: this._t("createNew", { category }), value: "new", style: "primary" },
          { label: this._t("moveNo"), value: "keep" },
        ];
        const question = same.length === 1 ? "duplicateQuestion" : "duplicateMany";
        const answer = await this._choose("add-master", this._t(question, { name: same[0].summary, from, category }), buttons);
        if (this._tab !== "master") return; // user left the tab: drop the whole add
        if (answer === "move") move.push(name);
        else if (answer === "new") duplicate.push(name);
      }
    }

    const data = { items: names, tags: this._tagsFor("mTags"), move, duplicate };
    if (category) data.category = category;
    const res = await this._callWithResponse("add_master_items", data);
    const parts = [
      res.added && this._t("nAdded", { count: res.added }),
      res.moved && this._t("nMoved", { count: res.moved }),
      res.tagged && this._t("nTagged", { count: res.tagged }),
      res.skipped && this._t("nSkipped", { count: res.skipped }),
    ].filter(Boolean);
    this._notice = parts.join(", ") || this._t("nothingChanged");
    // Keep category and tags so the next batch can reuse them.
    this._form = { ...f, mNames: "", mTags: data.tags, mTagsDraft: "" };
    this._render();
  }

  async _action(action, el) {
    const list = this._list;
    const f = this._form;
    try {
      switch (action) {
        case "tab":
          this._tab = el.dataset.tab;
          this._notice = null;
          this._packNotice = null;
          this._editUid = null;
          this._editItemUid = null;
          this._toMasterUid = null;
          if (this._dialog) this._closeDialog(-1); // last button = cancel
          this._exitDeleteMode();
          this._render();
          break;
        case "dialog-choice":
          this._closeDialog(Number(el.dataset.index));
          break;
        case "toggle-new":
          this._showNew = !this._showNew;
          if (this._showNew) {
            // Start from the defaults in Settings → Packing lists → Configure.
            const s = this._data?.settings || {};
            const known = new Set(this._allTags());
            Object.assign(f, {
              newName: "",
              newNotes: "",
              newTags: (s.default_tags || []).filter((t) => known.has(t)),
              newAlways: s.include_always !== false,
              newWeight: !!s.use_weight,
              newLimit: this._limitValue(s.weight_limit),
            });
          }
          this._render();
          break;
        case "toggle-new-tag": {
          const tags = new Set(f.newTags || []);
          const tag = el.dataset.tag;
          if (tags.has(tag)) tags.delete(tag);
          else tags.add(tag);
          f.newTags = [...tags];
          this._render();
          break;
        }
        case "create-list": {
          const name = (f.newName || "").trim();
          if (!name) return;
          const data = {
            name,
            notes: (f.newNotes || "").trim(),
            tags: f.newTags || [],
            include_always: f.newAlways !== false,
            use_weight: !!f.newWeight,
            weight_limit: f.newWeight ? parseLimit(f.newLimit) : null,
          };
          const res = await this._callWithResponse("create_list", data);
          this._listId = res.list_id ?? this._listId;
          this._form = {};
          this._showNew = false;
          this._tab = "pack";
          await this._fetch();
          await this._setActive(this._list);
          break;
        }
        case "delete-list":
          if (
            !list ||
            !(await this._ask("header", this._t("deleteListQuestion", { name: list.name }), {
              yes: this._t("deleteList"),
              danger: true,
            }))
          )
            return;
          await this._call("packing_list", "delete_list", { entity_id: list.entity_id });
          this._listId = null;
          break;
        case "archive-list":
        case "unarchive-list":
          if (!list) return;
          this._showEditList = false;
          await this._call("packing_list", "update_list", {
            entity_id: list.entity_id,
            archived: action === "archive-list",
          });
          break;
        case "toggle-edit-list":
          this._showEditList = !this._showEditList;
          this._showCopyList = false;
          if (this._showEditList && list) {
            Object.assign(f, {
              lName: list.name,
              lNotes: list.notes || "",
              lWeight: !!list.use_weight,
              lLimit: this._limitValue(list.weight_limit),
            });
          }
          this._focusPanel = this._showEditList ? "edit" : null;
          this._render();
          this._focusPanel = null;
          break;
        case "save-list": {
          if (!list) return;
          this._showEditList = false;
          this._render();
          const data = { entity_id: list.entity_id, notes: f.lNotes || "", use_weight: !!f.lWeight };
          if (f.lWeight) data.weight_limit = parseLimit(f.lLimit);
          const name = (f.lName || "").trim();
          if (name && name !== list.name) data.name = name;
          await this._call("packing_list", "update_list", data);
          break;
        }
        case "toggle-copy-list":
          this._showCopyList = !this._showCopyList;
          this._showEditList = false;
          if (this._showCopyList && list) f.cpName = this._t("copyNameDefault", { name: list.name });
          this._focusPanel = this._showCopyList ? "copy" : null;
          this._render();
          this._focusPanel = null;
          break;
        case "copy-list": {
          if (!list) return;
          const name = (f.cpName || "").trim() || this._t("copyNameDefault", { name: list.name });
          this._showCopyList = false;
          this._render();
          const res = await this._callWithResponse("copy_list", { entity_id: list.entity_id, name });
          this._listId = res.list_id ?? this._listId;
          this._tab = "pack";
          await this._fetch();
          await this._setActive(this._list);
          break;
        }
        case "add-defaults":
          await this._call("packing_list", "add_new_defaults", {});
          break;
        case "skip-defaults":
          await this._call("packing_list", "skip_new_defaults", {});
          break;

        // Pack tab
        case "toggle-packed": {
          const item = list.items.find((i) => i.uid === el.dataset.uid);
          if (!item) return;
          await this._call(
            "todo",
            "update_item",
            { item: item.uid, status: item.packed ? "needs_action" : "completed" },
            { entity_id: list.entity_id },
          );
          break;
        }
        case "reset-list": {
          const packed = list.items.filter((i) => i.packed).length;
          if (!packed) return;
          const question = this._t(packed === 1 ? "uncheckOne" : "uncheckMany", { count: packed, name: list.name });
          const ok = await this._ask("pack-tools", `${question}\n${this._t("uncheckNote")}`, {
            yes: this._t("uncheck"),
          });
          if (ok) await this._call("packing_list", "reset_list", { entity_id: list.entity_id });
          break;
        }
        case "add-extra": {
          const summary = (f.extraItem || "").trim();
          if (!summary) return;
          const data = { entity_id: list.entity_id, item: summary };
          if (this._showExtraDetails) {
            Object.assign(data, {
              category: (f.xCat || "").trim() || null,
              tags: this._tagsFor("xTags"),
              quantity: parseQuantity(f.xQty),
              weight: list.use_weight ? parseWeight(f.xWeight) : null,
              save_to_master: f.xToMaster !== false,
            });
          }
          // Keep category/tags for the next item; clear the name, quantity and weight.
          Object.assign(f, { extraItem: "", xTags: data.tags || f.xTags, xTagsDraft: "", xQty: "", xWeight: "" });
          this._render();
          await this._call("packing_list", "add_list_item", data);
          break;
        }
        case "toggle-extra-details":
          this._showExtraDetails = !this._showExtraDetails;
          this._render();
          break;
        case "open-to-master": {
          const item = list.items.find((i) => i.uid === el.dataset.uid);
          if (!item) return;
          this._toMasterUid = item.uid;
          this._editItemUid = null;
          Object.assign(f, { cCat: item.category || "", cTags: [...item.tags], cTagsDraft: "" });
          this._render();
          break;
        }
        case "edit-item": {
          const item = list.items.find((i) => i.uid === el.dataset.uid);
          if (!item) return;
          this._editItemUid = item.uid;
          this._toMasterUid = null;
          Object.assign(f, { iQty: item.quantity || "", iWeight: this._weightValue(item.weight), iToMaster: true });
          this._render();
          break;
        }
        case "cancel-edit-item":
          this._editItemUid = null;
          this._render();
          break;
        case "save-edit-item": {
          const uid = this._editItemUid;
          if (!uid) return;
          this._editItemUid = null;
          this._render();
          const data = { entity_id: list.entity_id, item: uid, quantity: parseQuantity(f.iQty) };
          if (list.use_weight) Object.assign(data, { weight: parseWeight(f.iWeight), save_to_master: f.iToMaster !== false });
          await this._call("packing_list", "update_list_item", data);
          break;
        }
        case "cancel-to-master":
          this._toMasterUid = null;
          this._render();
          break;
        case "save-to-master": {
          const uid = this._toMasterUid;
          if (!uid) return;
          this._toMasterUid = null;
          this._render();
          await this._call("packing_list", "copy_to_master", {
            entity_id: list.entity_id,
            item: uid,
            category: (f.cCat || "").trim() || null,
            tags: this._tagsFor("cTags"),
          });
          break;
        }
        case "refresh-list": {
          const criteria = {
            tags: list.tags || [],
            categories: list.categories || [],
            includeAlways: !!list.include_always,
          };
          const include = await this._askIncludeDeleted(
            "pack-tools",
            list,
            criteria,
            this._refreshCriteria(list).join(", "),
          );
          if (include === null) return;
          const res = await this._callWithResponse("refresh_list", {
            entity_id: list.entity_id,
            include_excluded: include,
          });
          this._packNotice = !res.added
            ? this._t("nothingFetched")
            : this._t(res.added === 1 ? "fetchedOne" : "fetchedMany", { count: res.added });
          this._render();
          break;
        }
        case "delete-mode":
          this._deleteMode = true;
          this._selected = new Set();
          this._render();
          break;
        case "cancel-delete":
          this._exitDeleteMode();
          this._render();
          break;
        case "toggle-select": {
          const uid = el.dataset.uid;
          if (this._selected.has(uid)) this._selected.delete(uid);
          else this._selected.add(uid);
          this._render();
          break;
        }
        case "select-all":
          this._selected =
            this._selected.size === list.items.length ? new Set() : new Set(list.items.map((i) => i.uid));
          this._render();
          break;
        case "delete-selected": {
          const uids = [...this._selected].filter((uid) => list.items.some((i) => i.uid === uid));
          this._exitDeleteMode();
          this._render();
          if (uids.length) await this._call("todo", "remove_item", { item: uids }, { entity_id: list.entity_id });
          break;
        }

        // Pick tab
        case "pick-toggle": {
          const master = this._data.master.find((m) => m.uid === el.dataset.uid);
          const onList = master && this._listItemFor(list, master);
          if (onList) {
            await this._call("todo", "remove_item", { item: onList.uid }, { entity_id: list.entity_id });
          } else {
            await this._call("packing_list", "add_from_master", { entity_id: list.entity_id, items: [el.dataset.uid] });
          }
          break;
        }
        case "pick-tag": {
          const tag = el.dataset.tag;
          const include = await this._askIncludeDeleted("pick-tags", list, { tags: [tag] }, `#${tag}`);
          if (include === null) return;
          await this._call("packing_list", "add_from_master", {
            entity_id: list.entity_id,
            tags: [tag],
            include_excluded: include,
          });
          break;
        }
        case "pick-category": {
          const cat = el.dataset.cat;
          const uncategorized = cat === UNCATEGORIZED;
          const criteria = uncategorized ? { uids: this._categoryUids(UNCATEGORIZED) } : { categories: [cat] };
          const label = this._t("inCategory", { category: this._categoryLabel(cat) });
          const include = await this._askIncludeDeleted(`cat:${cat}`, list, criteria, label);
          if (include === null) return;
          if (uncategorized) {
            // Uncategorized items have no category to remember, so they are added one by one.
            const { fresh, deleted } = this._matching(list, criteria);
            const items = [...fresh, ...(include ? deleted : [])].map((m) => m.uid);
            if (items.length) await this._call("packing_list", "add_from_master", { entity_id: list.entity_id, items });
          } else {
            await this._call("packing_list", "add_from_master", {
              entity_id: list.entity_id,
              categories: [cat],
              include_excluded: include,
            });
          }
          break;
        }

        // Master tab
        case "add-master":
          await this._addMaster();
          break;
        case "edit-master": {
          const m = this._data.master.find((i) => i.uid === el.dataset.uid);
          if (!m) return;
          this._editUid = m.uid;
          this._editError = null;
          Object.assign(f, {
            eName: m.summary,
            eCat: m.category || "",
            eTags: [...m.tags],
            eTagsDraft: "",
            eQty: m.quantity || "",
            eWeight: this._weightValue(m.weight),
          });
          this._focusEditName = true;
          this._render();
          this._focusEditName = false;
          break;
        }
        case "cancel-edit":
          this._editUid = null;
          this._render();
          break;
        case "save-edit": {
          const uid = this._editUid;
          if (!uid) return;
          const name = (f.eName || "").trim() || this._data.master.find((m) => m.uid === uid)?.summary;
          const category = (f.eCat || "").trim();
          if (this._data.master.some((m) => m.uid !== uid && sameText(m.summary, name) && sameText(m.category, category))) {
            const where = category ? this._t("inCategory", { category }) : this._t("noCategory");
            this._editError = this._t("duplicateName", { name, category: where });
            this._render();
            return;
          }
          this._editUid = null;
          this._editError = null;
          this._render();
          const data = { item: uid, name, category, tags: this._tagsFor("eTags"), quantity: parseQuantity(f.eQty) };
          if (this._weightInUse) data.weight = parseWeight(f.eWeight);
          await this._call("packing_list", "update_master_item", data);
          break;
        }
        case "cat-pick":
          this._pickCategory(el.dataset.key, el.dataset.value);
          break;
        case "tag-pick": {
          const key = el.dataset.key;
          f[key] = [...new Set([...(f[key] || []), el.dataset.tag])];
          f[`${key}Draft`] = "";
          this._render();
          break;
        }
        case "tag-remove": {
          const key = el.dataset.key;
          f[key] = (f[key] || []).filter((t) => t !== el.dataset.tag);
          this._render();
          break;
        }
        case "tag-add": {
          // Enter in the tag field: add the typed tag, or submit the form if nothing was typed.
          const key = el.dataset.tagkey;
          if (!this._addDraftTags(key) && el.dataset.submit) await this._action(el.dataset.submit, el);
          break;
        }
        case "reset-master":
          if (
            !(await this._ask("reset-master", this._t("resetQuestion", { count: this._data.master.length }), {
              yes: this._t("resetYes"),
              no: this._t("resetNo"),
              danger: true,
            }))
          )
            return;
          this._editUid = null;
          this._notice = null;
          await this._call("packing_list", "reset_master", {});
          break;
        case "delete-master":
          await this._call("todo", "remove_item", { item: el.dataset.uid }, { entity_id: this._data.master_entity_id });
          break;
      }
    } catch (err) {
      this._error = err.message || String(err);
      this._render();
    }
  }
}

if (!customElements.get("packing-list-card")) {
  customElements.define("packing-list-card", PackingListCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "packing-list-card",
    name: "Packing list",
    description: "Packing lists built from a master list (packing_list integration).",
  });
}

console.info(`%c PACKING-LIST-CARD %c v${CARD_VERSION} `, "background:#03a9f4;color:#fff", "");
