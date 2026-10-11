/*
 * Packing list card for the packing_list integration.
 * Served by the integration and registered automatically as a dashboard resource.
 *
 *   type: custom:packing-list-card
 *   title: Pakkeliste        # optional
 *   entity: todo.skiferie    # optional: list selected by default
 *   default_tab: pack        # optional: pack | pick | master
 *   packed_mode: bottom      # optional: inline | bottom | hide (the viewer's own choice wins)
 */

const CARD_VERSION = "0.8.0";
const RELOADED_FOR_KEY = "packing-list-card.reloaded-for";
const UNCATEGORIZED = "Andet";
const ALWAYS_TAG = "altid";
const PACKED_MODES = [
  ["inline", "Pakkede i kategorierne"],
  ["bottom", "Pakkede nederst"],
  ["hide", "Skjul pakkede"],
];
const PACKED_MODE_KEY = "packing-list-card.packed-mode";

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const byName = (a, b) => a.summary.localeCompare(b.summary, "da");
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
  .item .name + button.icon { margin-left: auto; }
  .excluded { font-size: .75em; color: var(--secondary-text-color); font-style: italic; }
  .tagpicker { display: flex; flex-direction: column; gap: 6px; }
  .tagpicker .chip.on .x { margin-left: 4px; opacity: .8; }
  .tagpicker .suggest .chip { border-style: dashed; }
`;

class PackingListCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
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

  setConfig(config) {
    this._config = config || {};
    this._tab = this._config.default_tab || "pack";
    if (!PACKED_MODES.some(([mode]) => mode === this._packedMode)) {
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
    this._versionWarning = `Pakkelister er opdateret til ${version}. Genindlæs browseren (Ctrl+Shift+R).`;
    this._render();
  }

  async _fetch() {
    try {
      this._data = await this._hass.callWS({ type: "packing_list/data" });
      this._error = null;
    } catch (err) {
      this._error = `Kunne ikke hente pakkelister: ${err.message || err}`;
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

  // Tags used on the master list; #altid is left out where it can't be used for picking.
  _allTags(includeAlways = false) {
    const tags = new Set();
    for (const item of this._data?.master || []) item.tags.forEach((t) => tags.add(t));
    if (!includeAlways) tags.delete(ALWAYS_TAG);
    return [...tags].sort((a, b) => a.localeCompare(b, "da"));
  }

  // ------------------------------------------------------------ tag picker
  // Selected tags live in this._form[key] (array), the typed text in this._form[key + "Draft"].

  _renderTagPicker(key, submitAction) {
    const selected = this._form[key] || [];
    const chips = selected
      .map(
        (t) =>
          `<button class="chip on" data-action="tag-remove" data-key="${key}" data-tag="${esc(t)}" title="Fjern">#${esc(t)}<span class="x">×</span></button>`,
      )
      .join("");
    const autofocus = this._focusTagKey === key ? "data-autofocus" : "";
    return `<div class="tagpicker">
        ${chips ? `<div class="chips">${chips}</div>` : ""}
        <input data-input="${key}Draft" data-tagkey="${key}" data-enter="tag-add" data-submit="${submitAction}" ${autofocus}
          placeholder="Tags – vælg herunder eller skriv et nyt (Enter/komma tilføjer)" value="${esc(this._form[`${key}Draft`] || "")}">
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

  _categories() {
    return [...new Set((this._data?.master || []).map((m) => m.category).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "da"),
    );
  }

  // Items grouped by category; categories and items sorted alphabetically, "Andet" last.
  _group(items) {
    const groups = new Map();
    for (const item of items) {
      const cat = item.category || UNCATEGORIZED;
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(item);
    }
    for (const catItems of groups.values()) catItems.sort(byName);
    return [...groups.entries()].sort(([a], [b]) =>
      a === UNCATEGORIZED ? 1 : b === UNCATEGORIZED ? -1 : a.localeCompare(b, "da"),
    );
  }

  _checkbox(on) {
    return `<ha-icon icon="${on ? "mdi:checkbox-marked" : "mdi:checkbox-blank-outline"}"></ha-icon>`;
  }

  _exitDeleteMode() {
    this._deleteMode = false;
    this._selected = new Set();
  }

  // In-card confirmation (native confirm() can be suppressed, e.g. in the companion app).
  // The dialog is rendered where _renderDialog(anchor) is placed, next to what triggered it.
  // Resolves with the value of the chosen button; the last button is the "cancel" one.
  _choose(anchor, message, buttons, { danger = false } = {}) {
    this._dialog?.resolve(buttons.at(-1).value);
    return new Promise((resolve) => {
      this._dialog = { anchor, message, buttons, danger, resolve };
      this._render();
    });
  }

  _ask(anchor, message, { yes = "OK", no = "Annuller", danger = false } = {}) {
    return this._choose(
      anchor,
      message,
      [
        { label: yes, value: true, style: danger ? "danger" : "primary" },
        { label: no, value: false },
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
    if (includeAlways) wantedTags.add(ALWAYS_TAG);
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
    const names = deleted.map((m) => m.summary).sort((a, b) => a.localeCompare(b, "da"));
    const shown = names.slice(0, 5).join(", ") + (names.length > 5 ? ` og ${names.length - 5} flere` : "");
    const one = deleted.length === 1;
    const them = one ? "den" : "dem";
    const message = fresh.length
      ? `${one ? "Et" : deleted.length} af punkterne med ${label} har du tidligere slettet fra listen: ${shown}.\n` +
        `Vil du også hente ${them} igen?`
      : `Der er ingen nye punkter med ${label}, men ${one ? "et" : deleted.length}, som du tidligere har slettet fra listen: ${shown}.\n` +
        `Vil du hente ${them} igen?`;
    const buttons = fresh.length
      ? [
          { label: one ? "Hent også den slettede" : "Hent også de slettede", value: true, style: "primary" },
          { label: `Kun nye punkter (${fresh.length})`, value: false },
          { label: "Annuller", value: null },
        ]
      : [
          { label: `Hent ${them} igen`, value: true, style: "primary" },
          { label: "Annuller", value: null },
        ];
    return this._choose(anchor, message, buttons);
  }

  // ------------------------------------------------------------------ render

  _render() {
    const title = this._config.title ?? "Pakkeliste";
    let body;
    if (!this._data) {
      body = this._error ? "" : `<div class="empty">Indlæser…</div>`;
    } else {
      body =
        this._renderHeader() +
        (this._showNew ? this._renderNew() : "") +
        this._renderTabs() +
        this._renderTab();
    }
    const error = [this._versionWarning, this._error]
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
      : `<span class="muted" style="flex:1">Ingen pakkelister endnu</span>`;

    let progress = "";
    if (list) {
      const total = list.items.length;
      const packed = list.items.filter((i) => i.packed).length;
      const pct = total ? Math.round((packed * 100) / total) : 0;
      progress = `<div class="progress"><div class="bar"><div style="width:${pct}%"></div></div>
        <span>${packed} af ${total} pakket</span></div>`;
    }
    return `<div class="row header">${select}
        <button data-action="toggle-new" class="${this._showNew ? "active" : ""}">+ Ny liste</button>
        ${list ? `<button class="icon" data-action="delete-list" title="Slet liste"><ha-icon icon="mdi:delete-outline"></ha-icon></button>` : ""}
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
      <input data-input="newName" data-enter="create-list" placeholder="Navn, f.eks. Skiferie 2027" value="${esc(f.newName || "")}">
      <input type="date" data-input="newDate" value="${esc(f.newDate || "")}">
      <div class="label">Hent punkter med tags:</div>
      <div class="chips">${chips || `<span class="muted small">Master-listen har ingen tags endnu.</span>`}</div>
      <label class="check"><input type="checkbox" data-change="newAlways" ${f.newAlways !== false ? "checked" : ""}>
        Medtag punkter med #${ALWAYS_TAG}</label>
      <div class="row"><button class="primary" data-action="create-list">Opret</button>
        <button data-action="toggle-new">Annuller</button></div>
    </div>`;
  }

  _renderTabs() {
    const tabs = [
      ["pack", "Pak"],
      ["pick", "Vælg fra master"],
      ["master", "Master"],
    ];
    return `<div class="tabs">${tabs
      .map(([key, label]) => `<button data-action="tab" data-tab="${key}" class="${this._tab === key ? "on" : ""}">${label}</button>`)
      .join("")}</div>`;
  }

  _renderTab() {
    if (this._tab === "master") return this._renderMaster();
    const list = this._list;
    if (!list) return `<div class="empty">Opret en pakkeliste med "+ Ny liste".</div>`;
    return this._tab === "pick" ? this._renderPick(list) : this._renderPack(list);
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
          <div class="label">Gem "${esc(item.summary)}" i master-listen</div>
          <input data-input="cCat" data-enter="save-to-master" list="pl-categories" data-autofocus placeholder="Kategori, f.eks. Sport" value="${esc(this._form.cCat)}">
          ${this._renderTagPicker("cTags", "save-to-master")}
          <div class="row"><button class="primary" data-action="save-to-master">Gem i master</button>
            <button data-action="cancel-to-master">Annuller</button></div>
        </div>`;
    }
    const toMaster = this._notInMaster(item)
      ? `<button class="icon" data-action="open-to-master" data-uid="${esc(item.uid)}" title="Gem i master-listen">
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
          <input data-input="xCat" list="pl-categories" placeholder="Kategori, f.eks. Sport" value="${esc(f.xCat || "")}">
          ${this._renderTagPicker("xTags", "add-extra")}
          <label class="check"><input type="checkbox" data-change="xToMaster" ${f.xToMaster !== false ? "checked" : ""}>
            Gem også i master-listen</label>
        </div>`
      : "";
    return `<div class="row add">
        <input data-input="extraItem" data-enter="add-extra" placeholder="Nyt punkt til denne liste" value="${esc(f.extraItem || "")}">
        <button class="icon ${this._showExtraDetails ? "active" : ""}" data-action="toggle-extra-details" title="Kategori, tags og master">
          <ha-icon icon="mdi:tune-variant"></ha-icon></button>
        <button data-action="add-extra">Tilføj</button>
      </div>${details}`;
  }

  _renderPack(list) {
    // In delete mode everything is shown in its category, so any item can be selected.
    const mode = this._deleteMode ? "inline" : this._packedMode;
    const packed = list.items.filter((i) => i.packed);
    const shown = mode === "inline" ? list.items : list.items.filter((i) => !i.packed);
    let groups = this._group(shown)
      .map(([cat, catItems]) => `<div class="cat">${esc(cat)}</div>` + catItems.map((i) => this._packRow(i)).join(""))
      .join("");
    if (mode === "bottom" && packed.length) {
      groups +=
        `<div class="cat packed-head">Pakket (${packed.length})</div>` +
        [...packed].sort(byName).map((i) => this._packRow(i)).join("");
    }
    const empty = list.items.length
      ? "Alt er pakket 🎉"
      : `Listen er tom – hent punkter under "Vælg fra master".`;
    return `<datalist id="pl-categories">${this._categories().map((c) => `<option value="${esc(c)}"></option>`).join("")}</datalist>
      ${this._deleteMode ? this._renderDeleteBar(list) : this._renderPackTools(list)}
      ${groups || `<div class="empty">${empty}</div>`}
      ${this._deleteMode ? "" : this._renderAddExtra()}`;
  }

  // What "Hent igen" fetches, e.g. "#ski, #altid, Tøj" – empty if the list has no criteria.
  _refreshCriteria(list) {
    return [
      ...(list.tags || []).map((t) => `#${t}`),
      ...(list.include_always ? [`#${ALWAYS_TAG}`] : []),
      ...(list.categories || []),
    ];
  }

  _renderPackTools(list) {
    const modes = PACKED_MODES.map(
      ([value, label]) => `<option value="${value}" ${value === this._packedMode ? "selected" : ""}>${label}</option>`,
    ).join("");
    const criteria = this._refreshCriteria(list);
    const refresh = criteria.length
      ? `<button data-action="refresh-list" title="Henter nye master-punkter med ${esc(criteria.join(", "))}.">
          <ha-icon icon="mdi:refresh"></ha-icon> Hent igen</button>`
      : "";
    const packed = list.items.filter((i) => i.packed).length;
    return `<div class="row tools">
        <select data-change="packedMode" title="Visning af pakkede punkter">${modes}</select>
        <div class="row">
          ${refresh}
          ${list.items.length ? `<button data-action="delete-mode" title="Vælg punkter der skal slettes"><ha-icon icon="mdi:delete-outline"></ha-icon> Slet punkter</button>` : ""}
          <button data-action="reset-list" ${packed ? "" : "disabled"} title="Fjern fluebenet fra alle pakkede punkter">
            <ha-icon icon="mdi:checkbox-blank-off-outline"></ha-icon> Fjern flueben</button>
        </div>
      </div>
      ${this._renderDialog("pack-tools")}
      ${this._packNotice ? `<div class="notice">${esc(this._packNotice)}</div>` : ""}`;
  }

  _renderDeleteBar(list) {
    const count = this._selected.size;
    const all = count === list.items.length;
    return `<div class="row tools deletebar">
        <span class="small">Markér de punkter, der skal slettes</span>
        <div class="row">
          <button data-action="select-all">${all ? "Fravælg alle" : "Vælg alle"}</button>
          <button class="danger" data-action="delete-selected" ${count ? "" : "disabled"}>Slet${count ? ` (${count})` : ""}</button>
          <button data-action="cancel-delete">Annuller</button>
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
          `<div class="cat">${esc(cat)}<button class="link" data-action="pick-category" data-cat="${esc(cat)}">tilføj alle</button></div>` +
          this._renderDialog(`cat:${cat}`) +
          catItems
            .map((m) => {
              const onList = this._listItemFor(list, m);
              const hint = !onList && excluded.has(m.uid) ? `<span class="excluded">slettet fra listen</span>` : "";
              return `<div class="item" data-action="pick-toggle" data-uid="${esc(m.uid)}">
                ${this._checkbox(onList)}
                <span class="name">${esc(m.summary)}</span>${hint}
                <span class="tags">${m.tags.map((t) => `#${esc(t)}`).join(" ")}</span>
              </div>`;
            })
            .join(""),
      )
      .join("");
    return `<div class="label">Tilføj alle punkter med tag:</div>
      <div class="chips">${chips || `<span class="muted small">Ingen tags endnu.</span>`}</div>
      ${this._renderDialog("pick-tags")}
      ${groups || `<div class="empty">Master-listen er tom – tilføj punkter under "Master".</div>`}`;
  }

  // -------------------------------------------------------------- master tab

  _renderMasterRow(m) {
    if (m.uid === this._editUid) {
      const f = this._form;
      return `<div class="item editing">
          <input data-input="eName" data-enter="save-edit" ${this._focusEditName ? "data-autofocus" : ""} placeholder="Navn" value="${esc(f.eName)}">
          <input data-input="eCat" data-enter="save-edit" list="pl-categories" placeholder="Kategori (tom = ingen)" value="${esc(f.eCat)}">
          ${this._renderTagPicker("eTags", "save-edit")}
          <div class="row"><button class="primary" data-action="save-edit">Gem</button>
            <button data-action="cancel-edit">Annuller</button></div>
        </div>`;
    }
    return `<div class="item">
        <span class="name">${esc(m.summary)}${m.notes ? `<span class="notes">${esc(m.notes)}</span>` : ""}</span>
        <span class="tags">${m.tags.map((t) => `#${esc(t)}`).join(" ")}</span>
        <button class="icon" data-action="edit-master" data-uid="${esc(m.uid)}" title="Ret kategori og tags">
          <ha-icon icon="mdi:pencil-outline"></ha-icon></button>
        <button class="icon" data-action="delete-master" data-uid="${esc(m.uid)}" title="Slet fra master">
          <ha-icon icon="mdi:delete-outline"></ha-icon></button>
      </div>`;
  }

  _renderMaster() {
    const f = this._form;
    const groups = this._group(this._data.master)
      .map(([cat, catItems]) => `<div class="cat">${esc(cat)}</div>` + catItems.map((m) => this._renderMasterRow(m)).join(""))
      .join("");
    return `<datalist id="pl-categories">${this._categories().map((c) => `<option value="${esc(c)}"></option>`).join("")}</datalist>
      <div class="panel">
        <div class="label">Tilføj et eller flere punkter – ét pr. linje. De får alle samme kategori og tags.</div>
        <textarea data-input="mNames" data-enter="add-master" rows="4"
          placeholder="Badetøj&#10;Badehåndklæde&#10;Klipklappere">${esc(f.mNames || "")}</textarea>
        <input data-input="mCat" list="pl-categories" placeholder="Kategori, f.eks. Tøj" value="${esc(f.mCat || "")}">
        ${this._renderTagPicker("mTags", "add-master")}
        <div class="muted small" style="padding:0">#${ALWAYS_TAG} = kommer med på alle nye lister</div>
        <div class="row"><button class="primary" data-action="add-master">Tilføj til master</button>
          ${this._notice ? `<span class="notice">${esc(this._notice)}</span>` : ""}</div>
        ${this._renderDialog("add-master")}
      </div>
      ${groups || `<div class="empty">Master-listen er tom.</div>`}
      <div class="row add"><button data-action="reset-master">
        <ha-icon icon="mdi:restore"></ha-icon> Nulstil til standard master-liste</button></div>
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
          const from = existing.category ? `kategorien "${existing.category}"` : "ingen kategori";
          const answer = await this._ask(
            "add-master",
            `"${existing.summary}" findes allerede i ${from}.\nSkal den flyttes til "${category}"?`,
            { yes: `Flyt til ${category}`, no: "Behold kategori" },
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
      res.added && `${res.added} tilføjet`,
      res.moved && `${res.moved} flyttet`,
      res.tagged && `${res.tagged} fik nye tags`,
      res.skipped && `${res.skipped} fandtes allerede`,
    ].filter(Boolean);
    this._notice = parts.join(", ") || "Intet ændret";
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
        case "dialog-choice":
          this._closeDialog(Number(el.dataset.index));
          break;
        case "delete-list":
          if (
            !list ||
            !(await this._ask("header", `Slet pakkelisten "${list.name}"?`, { yes: "Slet listen", danger: true }))
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
          const ok = await this._ask(
            "pack-tools",
            `Fjern fluebenet fra ${packed === 1 ? "det pakkede punkt" : `alle ${packed} pakkede punkter`} på "${list.name}"?\n` +
              "Punkterne bliver på listen, men står som ikke pakket.",
            { yes: "Fjern flueben", no: "Annuller" },
          );
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
          this._packNotice = res.added
            ? `${res.added} ${res.added === 1 ? "punkt" : "punkter"} hentet`
            : "Ingen nye punkter at hente";
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
          const include = await this._askIncludeDeleted(`cat:${cat}`, list, criteria, `kategorien "${cat}"`);
          if (include === null) return;
          if (uncategorized) {
            // "Andet" has no category to remember, so its items are added one by one.
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
            !(await this._ask(
              "reset-master",
              "Er du sikker på, at du vil nulstille master-listen?\n\n" +
                `Alle ${this._data.master.length} punkter i masteren – med dine egne kategorier og tags – ` +
                "bliver erstattet af standardlisten. Det kan ikke fortrydes.\n" +
                "Dine pakkelister berøres ikke.",
              { yes: "Ja, nulstil master-listen", no: "Nej, behold min liste", danger: true },
            ))
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
    name: "Pakkeliste",
    description: "Pakkelister bygget fra en master-liste (packing_list-integrationen).",
  });
}

console.info(`%c PACKING-LIST-CARD %c v${CARD_VERSION} `, "background:#03a9f4;color:#fff", "");
