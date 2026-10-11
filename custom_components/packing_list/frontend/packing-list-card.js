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

const CARD_VERSION = "0.9.0";
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
    moveQuestion: '"{name}" already exists in {from}.\nMove it to "{category}"?',
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
    moveQuestion: '"{name}" findes allerede i {from}.\nSkal den flyttes til "{category}"?',
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
    });
    root.addEventListener("change", (ev) => this._onChange(ev));
    root.addEventListener("keydown", (ev) => {
      // In a textarea Enter makes a new line; Ctrl/Cmd+Enter submits.
      const submit = ev.target.tagName === "TEXTAREA" ? ev.ctrlKey || ev.metaKey : true;
      if (ev.key === "Enter" && submit && ev.target.dataset.enter) {
        ev.preventDefault();
        this._action(ev.target.dataset.enter, ev.target);
      } else if (ev.key === "Escape" && this._editUid) {
        this._action("cancel-edit");
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
    if (this._listId && lists.some((l) => l.list_id === this._listId)) return;
    const configured = this._config.entity && lists.find((l) => l.entity_id === this._config.entity);
    this._listId = (configured || lists[0])?.list_id ?? null;
    this._exitDeleteMode();
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

  _categories() {
    return [...new Set((this._data?.master || []).map((m) => m.category).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, this._lang),
    );
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
    const select = lists.length
      ? `<select data-change="select-list">${lists
          .map(
            (l) =>
              `<option value="${esc(l.list_id)}" ${l.list_id === this._listId ? "selected" : ""}>` +
              `${esc(l.name)}${l.trip_date ? ` (${esc(l.trip_date)})` : ""}</option>`,
          )
          .join("")}</select>`
      : `<span class="muted" style="flex:1">${esc(this._t("noLists"))}</span>`;

    let progress = "";
    if (list) {
      const total = list.items.length;
      const packed = list.items.filter((i) => i.packed).length;
      const pct = total ? Math.round((packed * 100) / total) : 0;
      progress = `<div class="progress"><div class="bar"><div style="width:${pct}%"></div></div>
        <span>${esc(this._t("progress", { packed, total }))}</span></div>`;
    }
    return `<div class="row header">${select}
        <button data-action="toggle-new" class="${this._showNew ? "active" : ""}">${esc(this._t("newList"))}</button>
        ${list ? `<button class="icon" data-action="delete-list" title="${esc(this._t("deleteList"))}"><ha-icon icon="mdi:delete-outline"></ha-icon></button>` : ""}
      </div>${this._renderDialog("header")}${progress}`;
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
      <input type="date" data-input="newDate" value="${esc(f.newDate || "")}">
      <div class="label">${esc(this._t("addWithTags"))}</div>
      <div class="chips">${chips || `<span class="muted small">${esc(this._t("noMasterTags"))}</span>`}</div>
      <label class="check"><input type="checkbox" data-change="newAlways" ${f.newAlways !== false ? "checked" : ""}>
        ${esc(this._t("includeAlways", { tag: this._alwaysTag }))}</label>
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

  _categoryDatalist() {
    return `<datalist id="pl-categories">${this._categories().map((c) => `<option value="${esc(c)}"></option>`).join("")}</datalist>`;
  }

  // ---------------------------------------------------------------- pack tab

  // A list item that isn't on the master list (neither linked nor by name).
  _notInMaster(item) {
    return !item.master_uid && !this._data.master.some((m) => sameText(m.summary, item.summary));
  }

  _packRow(item) {
    const notes = item.notes ? `<span class="notes">${esc(item.notes)}</span>` : "";
    if (this._deleteMode) {
      const on = this._selected.has(item.uid);
      return `<div class="item ${on ? "selected" : ""}" data-action="toggle-select" data-uid="${esc(item.uid)}">
          ${this._checkbox(on)}<span class="name">${esc(item.summary)}${notes}</span>
        </div>`;
    }
    if (item.uid === this._toMasterUid) {
      return `<div class="item editing">
          <div class="label">${esc(this._t("saveToMasterHeading", { name: item.summary }))}</div>
          <input data-input="cCat" data-enter="save-to-master" list="pl-categories" data-autofocus placeholder="${esc(this._t("categoryExample"))}" value="${esc(this._form.cCat)}">
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
        ${this._checkbox(item.packed)}<span class="name">${esc(item.summary)}${notes}</span>${toMaster}
      </div>`;
  }

  _renderAddExtra() {
    const f = this._form;
    const details = this._showExtraDetails
      ? `<div class="panel">
          <input data-input="xCat" list="pl-categories" placeholder="${esc(this._t("categoryExample"))}" value="${esc(f.xCat || "")}">
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
    let groups = this._group(shown)
      .map(
        ([cat, catItems]) =>
          `<div class="cat">${esc(this._categoryLabel(cat))}</div>` + catItems.map((i) => this._packRow(i)).join(""),
      )
      .join("");
    if (mode === "bottom" && packed.length) {
      groups +=
        `<div class="cat packed-head">${esc(this._t("packedHeading", { count: packed.length }))}</div>` +
        [...packed].sort((a, b) => this._byName(a, b)).map((i) => this._packRow(i)).join("");
    }
    const empty = this._t(list.items.length ? "allPacked" : "listEmpty");
    return `${this._categoryDatalist()}
      ${this._deleteMode ? this._renderDeleteBar(list) : this._renderPackTools(list)}
      ${groups || `<div class="empty">${esc(empty)}</div>`}
      ${this._deleteMode ? "" : this._renderAddExtra()}`;
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

  // The list item that corresponds to a master item (by master uid, else by name).
  _listItemFor(list, master) {
    return (
      list.items.find((i) => i.master_uid === master.uid) ||
      list.items.find((i) => sameText(i.summary, master.summary)) ||
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
          <input data-input="eCat" data-enter="save-edit" list="pl-categories" placeholder="${esc(this._t("categoryOptional"))}" value="${esc(f.eCat)}">
          ${this._renderTagPicker("eTags", "save-edit")}
          <div class="row"><button class="primary" data-action="save-edit">${esc(this._t("save"))}</button>
            <button data-action="cancel-edit">${esc(this._t("cancel"))}</button></div>
        </div>`;
    }
    return `<div class="item">
        <span class="name">${esc(m.summary)}${m.notes ? `<span class="notes">${esc(m.notes)}</span>` : ""}</span>
        <span class="tags">${m.tags.map((t) => `#${esc(t)}`).join(" ")}</span>
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
    return `${this._categoryDatalist()}
      <div class="panel">
        <div class="label">${esc(this._t("masterAddHint"))}</div>
        <textarea data-input="mNames" data-enter="add-master" rows="4"
          placeholder="${esc(this._t("masterNamesExample")).replace(/\n/g, "&#10;")}">${esc(f.mNames || "")}</textarea>
        <input data-input="mCat" list="pl-categories" placeholder="${esc(this._t("masterCategoryExample"))}" value="${esc(f.mCat || "")}">
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
      this._packNotice = null;
      this._render();
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

    // Existing items with another category: ask whether to move them. New tags are always added.
    const move = [];
    if (category) {
      for (const name of names) {
        const existing = this._data.master.find((m) => sameText(m.summary, name));
        if (existing && !sameText(existing.category, category)) {
          const from = existing.category ? this._t("inCategory", { category: existing.category }) : this._t("noCategory");
          const answer = await this._ask(
            "add-master",
            this._t("moveQuestion", { name: existing.summary, from, category }),
            { yes: this._t("moveYes", { category }), no: this._t("moveNo") },
          );
          if (this._tab !== "master") return; // user left the tab: drop the whole add
          if (answer) move.push(existing.summary);
        }
      }
    }

    const data = { items: names, tags: this._tagsFor("mTags"), move };
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
          const data = { name, tags: f.newTags || [], include_always: f.newAlways !== false };
          if (f.newDate) data.trip_date = f.newDate;
          const res = await this._callWithResponse("create_list", data);
          this._listId = res.list_id ?? this._listId;
          this._form = {};
          this._showNew = false;
          this._tab = "pack";
          await this._fetch();
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
              add_to_master: f.xToMaster !== false,
            });
          }
          // Keep category/tags for the next item; clear the name.
          Object.assign(f, { extraItem: "", xTags: data.tags || f.xTags, xTagsDraft: "" });
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
          Object.assign(f, { cCat: item.category || "", cTags: [...item.tags], cTagsDraft: "" });
          this._render();
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
          Object.assign(f, { eName: m.summary, eCat: m.category || "", eTags: [...m.tags], eTagsDraft: "" });
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
          this._editUid = null;
          this._render();
          await this._call("packing_list", "update_master_item", {
            item: uid,
            name: (f.eName || "").trim() || undefined,
            category: (f.eCat || "").trim(),
            tags: this._tagsFor("eTags"),
          });
          break;
        }
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
