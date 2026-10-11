/*
 * Packing list card for the packing_list integration.
 * Served by the integration and registered automatically as a dashboard resource.
 *
 *   type: custom:packing-list-card
 *   title: Pakkeliste        # optional
 *   entity: todo.skiferie    # optional: list selected by default
 *   default_tab: pack        # optional: pack | pick | templates | master
 *   packed_mode: bottom      # optional: inline | bottom | hide (the viewer's own choice wins)
 */

const CARD_VERSION = "0.4.0";
const RELOADED_FOR_KEY = "packing-list-card.reloaded-for";
const UNCATEGORIZED = "Andet";
const ALWAYS_TAG = "altid";
const PACKED_MODES = [
  ["inline", "Pakkede i kategorierne"],
  ["bottom", "Pakkede nederst"],
  ["hide", "Skjul pakkede"],
];
const PACKED_MODE_KEY = "packing-list-card.packed-mode";

const byName = (a, b) => a.summary.localeCompare(b.summary, "da");

const loadPackedMode = () => {
  try {
    return localStorage.getItem(PACKED_MODE_KEY);
  } catch {
    return null;
  }
};

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

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
  .cat.packed-head { margin-top: 20px; color: var(--success-color, var(--secondary-text-color)); }
  .notice { color: var(--success-color, var(--primary-color)); font-size: .9em; }
  button {
    font: inherit; cursor: pointer; padding: 6px 12px; border-radius: 6px;
    border: 1px solid var(--divider-color); background: none; color: var(--primary-text-color);
  }
  button.primary, button.active { background: var(--primary-color); color: var(--text-primary-color, #fff); border-color: var(--primary-color); }
  button.icon { border: none; padding: 4px; color: var(--secondary-text-color); }
  button.link { border: none; padding: 0 4px; color: var(--primary-color); font-size: .85em; }
  .progress { display: flex; align-items: center; gap: 8px; margin: 12px 0 4px; font-size: .9em; color: var(--secondary-text-color); }
  .bar { flex: 1; height: 8px; border-radius: 4px; background: var(--divider-color); overflow: hidden; }
  .bar > div { height: 100%; background: var(--success-color, var(--primary-color)); transition: width .3s; }
  .tabs { display: flex; margin: 12px 0 8px; border-bottom: 1px solid var(--divider-color); }
  .tabs button { border: none; border-radius: 0; flex: 1; padding: 8px 4px; border-bottom: 2px solid transparent; color: var(--secondary-text-color); }
  .tabs button.on { color: var(--primary-color); border-bottom-color: var(--primary-color); }
  .panel { display: flex; flex-direction: column; gap: 8px; padding: 12px; margin: 12px 0; border-radius: 8px; background: var(--secondary-background-color); }
  .cat { display: flex; justify-content: space-between; align-items: center; margin: 14px 0 4px; font-weight: 500; font-size: .85em; text-transform: uppercase; letter-spacing: .05em; color: var(--secondary-text-color); }
  .item { display: flex; align-items: center; gap: 10px; padding: 6px 2px; border-bottom: 1px solid var(--divider-color); }
  .item[data-action] { cursor: pointer; }
  .item ha-icon { color: var(--primary-color); flex: none; }
  .item.done .name { text-decoration: line-through; color: var(--secondary-text-color); }
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
    });
    root.addEventListener("change", (ev) => this._onChange(ev));
    root.addEventListener("keydown", (ev) => {
      // In a textarea Enter makes a new line; Ctrl/Cmd+Enter submits.
      const submit = ev.target.tagName === "TEXTAREA" ? ev.ctrlKey || ev.metaKey : true;
      if (ev.key === "Enter" && submit && ev.target.dataset.enter) {
        ev.preventDefault();
        this._action(ev.target.dataset.enter, ev.target);
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
    let reloadedFor = null;
    try {
      reloadedFor = sessionStorage.getItem(RELOADED_FOR_KEY);
      if (reloadedFor !== version) {
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
  }

  get _list() {
    return this._data?.lists.find((l) => l.list_id === this._listId) || null;
  }

  _allTags() {
    const tags = new Set();
    for (const item of this._data?.master || []) item.tags.forEach((t) => tags.add(t));
    tags.delete(ALWAYS_TAG);
    return [...tags].sort((a, b) => a.localeCompare(b, "da"));
  }

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

  get _templates() {
    return this._data?.templates || [];
  }

  _checkbox(on) {
    return `<ha-icon icon="${on ? "mdi:checkbox-marked" : "mdi:checkbox-blank-outline"}"></ha-icon>`;
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
      </div>${progress}`;
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
    const selectedTemplates = new Set(f.newTemplates || []);
    const templateChips = this._templates
      .map(
        (t) =>
          `<button class="chip ${selectedTemplates.has(t.template_id) ? "on" : ""}" data-action="toggle-new-template-chip" data-id="${esc(t.template_id)}">${esc(t.name)}</button>`,
      )
      .join("");
    return `<div class="panel">
      <input data-input="newName" data-enter="create-list" placeholder="Navn, f.eks. Skiferie 2027" value="${esc(f.newName || "")}">
      <input type="date" data-input="newDate" value="${esc(f.newDate || "")}">
      <div class="label">Tag udgangspunkt i skabeloner:</div>
      <div class="chips">${templateChips || `<span class="muted small">Ingen skabeloner endnu – opret dem under "Skabeloner".</span>`}</div>
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
      ["templates", "Skabeloner"],
      ["master", "Master"],
    ];
    return `<div class="tabs">${tabs
      .map(([key, label]) => `<button data-action="tab" data-tab="${key}" class="${this._tab === key ? "on" : ""}">${label}</button>`)
      .join("")}</div>`;
  }

  _renderTab() {
    if (this._tab === "master") return this._renderMaster();
    if (this._tab === "templates") return this._renderTemplates();
    const list = this._list;
    if (!list) return `<div class="empty">Opret en pakkeliste med "+ Ny liste".</div>`;
    return this._tab === "pick" ? this._renderPick(list) : this._renderPack(list);
  }

  _packRow(item) {
    return `<div class="item ${item.packed ? "done" : ""}" data-action="toggle-packed" data-uid="${esc(item.uid)}">
        ${this._checkbox(item.packed)}
        <span class="name">${esc(item.summary)}${item.notes ? `<span class="notes">${esc(item.notes)}</span>` : ""}</span>
      </div>`;
  }

  _renderPack(list) {
    const mode = this._packedMode;
    const packed = list.items.filter((i) => i.packed);
    const shown = mode === "inline" ? list.items : list.items.filter((i) => !i.packed);
    let groups = this._group(shown)
      .map(([cat, catItems]) => `<div class="cat">${esc(cat)}</div>` + catItems.map((i) => this._packRow(i)).join(""))
      .join("");
    if (mode === "bottom" && packed.length) {
      const sorted = [...packed].sort(byName);
      groups += `<div class="cat packed-head">Pakket (${packed.length})</div>` + sorted.map((i) => this._packRow(i)).join("");
    }
    const empty = list.items.length
      ? "Alt er pakket 🎉"
      : `Listen er tom – hent punkter under "Vælg fra master".`;
    const modes = PACKED_MODES.map(
      ([value, label]) => `<option value="${value}" ${value === mode ? "selected" : ""}>${label}</option>`,
    ).join("");
    return `<div class="row tools">
        <select data-change="packedMode" title="Visning af pakkede punkter">${modes}</select>
        <button data-action="reset-list">Nulstil</button>
      </div>
      ${groups || `<div class="empty">${empty}</div>`}
      <div class="row add">
        <input data-input="extraItem" data-enter="add-extra" placeholder="Ekstra punkt kun til denne liste" value="${esc(this._form.extraItem || "")}">
        <button data-action="add-extra">Tilføj</button>
      </div>`;
  }

  // The list item that corresponds to a master item (by master uid, else by name).
  _listItemFor(list, master) {
    const name = master.summary.toLowerCase();
    return (
      list.items.find((i) => i.master_uid === master.uid) ||
      list.items.find((i) => i.summary.toLowerCase() === name) ||
      null
    );
  }

  // Master items with checkboxes; used to fill a packing list (prefix "pick") or a template ("tpl").
  _renderMasterPicker(isOn, prefix) {
    const chips = this._allTags()
      .map((t) => `<button class="chip" data-action="${prefix}-tag" data-tag="${esc(t)}">+ #${esc(t)}</button>`)
      .join("");
    const groups = this._group(this._data.master)
      .map(
        ([cat, catItems]) =>
          `<div class="cat">${esc(cat)}<button class="link" data-action="${prefix}-category" data-cat="${esc(cat)}">tilføj alle</button></div>` +
          catItems
            .map(
              (m) => `<div class="item" data-action="${prefix}-toggle" data-uid="${esc(m.uid)}">
                ${this._checkbox(isOn(m))}
                <span class="name">${esc(m.summary)}</span>
                <span class="tags">${m.tags.map((t) => `#${esc(t)}`).join(" ")}</span>
              </div>`,
            )
            .join(""),
      )
      .join("");
    return `<div class="label">Tilføj alle punkter med tag:</div>
      <div class="chips">${chips || `<span class="muted small">Ingen tags endnu.</span>`}</div>
      ${groups || `<div class="empty">Master-listen er tom – tilføj punkter under "Master".</div>`}`;
  }

  _renderPick(list) {
    const templateChips = this._templates
      .map((t) => `<button class="chip" data-action="pick-template" data-id="${esc(t.template_id)}">+ ${esc(t.name)}</button>`)
      .join("");
    const templates = templateChips
      ? `<div class="label">Hent skabelon:</div><div class="chips">${templateChips}</div>`
      : "";
    return templates + this._renderMasterPicker((m) => this._listItemFor(list, m), "pick");
  }

  _renderTemplates() {
    const f = this._form;
    const templates = this._templates;
    if (!templates.some((t) => t.template_id === this._templateId)) {
      this._templateId = templates[0]?.template_id ?? null;
    }
    const template = templates.find((t) => t.template_id === this._templateId);
    const select = templates.length
      ? `<select data-change="select-template">${templates
          .map(
            (t) =>
              `<option value="${esc(t.template_id)}" ${t === template ? "selected" : ""}>${esc(t.name)} (${t.items.length})</option>`,
          )
          .join("")}</select>`
      : `<span class="muted" style="flex:1">Ingen skabeloner endnu</span>`;
    const header = `<div class="row header">${select}
        <button data-action="toggle-new-template" class="${this._showNewTemplate ? "active" : ""}">+ Ny skabelon</button>
        ${
          template
            ? `<button class="icon" data-action="rename-template" title="Omdøb skabelon"><ha-icon icon="mdi:pencil-outline"></ha-icon></button>
               <button class="icon" data-action="delete-template" title="Slet skabelon"><ha-icon icon="mdi:delete-outline"></ha-icon></button>`
            : ""
        }
      </div>`;
    const form =
      this._showNewTemplate || !template
        ? `<div class="panel">
            <input data-input="tplName" data-enter="create-template" placeholder="Navn, f.eks. Vandretur, Sommerhus, Bilferie" value="${esc(f.tplName || "")}">
            <div class="row"><button class="primary" data-action="create-template">Opret skabelon</button></div>
          </div>`
        : "";
    if (!template) {
      return `${header}${form}<div class="muted small">En skabelon er et udvalg af master-punkter, du kan tage
        udgangspunkt i, når du opretter en ny pakkeliste – f.eks. "Vandretur" eller "Sommerhus".</div>`;
    }
    const inTemplate = new Set(template.items);
    return header + form + this._renderMasterPicker((m) => inTemplate.has(m.uid), "tpl");
  }

  _renderMaster() {
    const f = this._form;
    const categories = [...new Set(this._data.master.map((m) => m.category).filter(Boolean))].sort();
    const groups = this._group(this._data.master)
      .map(
        ([cat, catItems]) =>
          `<div class="cat">${esc(cat)}</div>` +
          catItems
            .map(
              (m) => `<div class="item">
                <span class="name">${esc(m.summary)}${m.notes ? `<span class="notes">${esc(m.notes)}</span>` : ""}</span>
                <span class="tags">${m.tags.map((t) => `#${esc(t)}`).join(" ")}</span>
                <button class="icon" data-action="delete-master" data-uid="${esc(m.uid)}" title="Slet fra master">
                  <ha-icon icon="mdi:delete-outline"></ha-icon></button>
              </div>`,
            )
            .join(""),
      )
      .join("");
    return `<div class="panel">
        <div class="label">Tilføj et eller flere punkter – ét pr. linje. De får alle samme kategori og tags.</div>
        <textarea data-input="mNames" data-enter="add-master" rows="4"
          placeholder="Badetøj&#10;Badehåndklæde&#10;Klipklappere">${esc(f.mNames || "")}</textarea>
        <input data-input="mCat" list="pl-categories" placeholder="Kategori, f.eks. Tøj" value="${esc(f.mCat || "")}">
        <datalist id="pl-categories">${categories.map((c) => `<option value="${esc(c)}"></option>`).join("")}</datalist>
        <input data-input="mTags" data-enter="add-master" placeholder="Tags, f.eks. sommer, strand (altid = med på alle lister)" value="${esc(f.mTags || "")}">
        <div class="row"><button class="primary" data-action="add-master">Tilføj til master</button>
          ${this._notice ? `<span class="notice">${esc(this._notice)}</span>` : ""}</div>
      </div>
      ${groups || `<div class="empty">Master-listen er tom.</div>`}
      <div class="muted small">Tip: Punkter kan også redigeres i den almindelige to-do-visning
        (${esc(this._data.master_entity_id || "")}). Skriv kategori som @Kategori og tags som #tag i beskrivelsen.</div>`;
  }

  // ----------------------------------------------------------------- actions

  _onChange(ev) {
    const key = ev.target.dataset.change;
    if (key === "select-list") {
      this._listId = ev.target.value;
      this._render();
    } else if (key === "select-template") {
      this._templateId = ev.target.value;
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
    }
  }

  _categoryUids(category) {
    return this._data.master.filter((m) => (m.category || UNCATEGORIZED) === category).map((m) => m.uid);
  }

  _call(domain, service, data, target) {
    return this._hass.callService(domain, service, data, target);
  }

  async _action(action, el) {
    const list = this._list;
    const f = this._form;
    try {
      switch (action) {
        case "tab":
          this._tab = el.dataset.tab;
          this._notice = null;
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
          const data = {
            name,
            tags: f.newTags || [],
            templates: f.newTemplates || [],
            include_always: f.newAlways !== false,
          };
          if (f.newDate) data.trip_date = f.newDate;
          const result = await this._hass.callWS({
            type: "call_service",
            domain: "packing_list",
            service: "create_list",
            service_data: data,
            return_response: true,
          });
          this._listId = result?.response?.list_id ?? this._listId;
          this._form = {};
          this._showNew = false;
          this._tab = "pack";
          await this._fetch();
          break;
        }
        case "delete-list":
          if (!list || !confirm(`Slet pakkelisten "${list.name}"?`)) return;
          await this._call("packing_list", "delete_list", { entity_id: list.entity_id });
          this._listId = null;
          break;
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
        case "reset-list":
          await this._call("packing_list", "reset_list", { entity_id: list.entity_id });
          break;
        case "add-extra": {
          const summary = (f.extraItem || "").trim();
          if (!summary) return;
          f.extraItem = "";
          await this._call("todo", "add_item", { item: summary }, { entity_id: list.entity_id });
          break;
        }
        case "toggle-new-template-chip": {
          const ids = new Set(f.newTemplates || []);
          const id = el.dataset.id;
          if (ids.has(id)) ids.delete(id);
          else ids.add(id);
          f.newTemplates = [...ids];
          this._render();
          break;
        }
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
        case "pick-tag":
          await this._call("packing_list", "add_from_master", { entity_id: list.entity_id, tags: [el.dataset.tag] });
          break;
        case "pick-category":
          await this._call("packing_list", "add_from_master", {
            entity_id: list.entity_id,
            items: this._categoryUids(el.dataset.cat),
          });
          break;
        case "pick-template":
          await this._call("packing_list", "add_from_master", { entity_id: list.entity_id, templates: [el.dataset.id] });
          break;
        case "toggle-new-template":
          this._showNewTemplate = !this._showNewTemplate;
          this._render();
          break;
        case "create-template": {
          const name = (f.tplName || "").trim();
          if (!name) return;
          const result = await this._hass.callWS({
            type: "call_service",
            domain: "packing_list",
            service: "create_template",
            service_data: { name },
            return_response: true,
          });
          this._templateId = result?.response?.template_id ?? this._templateId;
          f.tplName = "";
          this._showNewTemplate = false;
          await this._fetch();
          break;
        }
        case "rename-template": {
          const template = this._templates.find((t) => t.template_id === this._templateId);
          const name = template && prompt("Nyt navn til skabelonen", template.name);
          if (!name || !name.trim() || name.trim() === template.name) return;
          await this._call("packing_list", "update_template", { template: template.template_id, name: name.trim() });
          break;
        }
        case "delete-template": {
          const template = this._templates.find((t) => t.template_id === this._templateId);
          if (!template || !confirm(`Slet skabelonen "${template.name}"?`)) return;
          await this._call("packing_list", "delete_template", { template: template.template_id });
          this._templateId = null;
          break;
        }
        case "tpl-toggle": {
          const template = this._templates.find((t) => t.template_id === this._templateId);
          const field = template.items.includes(el.dataset.uid) ? "remove_items" : "items";
          await this._call("packing_list", "update_template", { template: template.template_id, [field]: [el.dataset.uid] });
          break;
        }
        case "tpl-tag":
          await this._call("packing_list", "update_template", { template: this._templateId, tags: [el.dataset.tag] });
          break;
        case "tpl-category":
          await this._call("packing_list", "update_template", {
            template: this._templateId,
            items: this._categoryUids(el.dataset.cat),
          });
          break;
        case "add-master": {
          const items = (f.mNames || "").split("\n").map((s) => s.trim()).filter(Boolean);
          if (!items.length) return;
          const data = { items, tags: (f.mTags || "").split(/[,\s]+/).filter(Boolean) };
          if ((f.mCat || "").trim()) data.category = f.mCat.trim();
          const result = await this._hass.callWS({
            type: "call_service",
            domain: "packing_list",
            service: "add_master_items",
            service_data: data,
            return_response: true,
          });
          const { added = 0, skipped = 0 } = result?.response || {};
          this._notice =
            `${added} tilføjet` + (skipped ? `, ${skipped} fandtes allerede` : "");
          // Keep category and tags so the next batch can reuse them.
          this._form = { ...f, mNames: "" };
          this._render();
          break;
        }
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
