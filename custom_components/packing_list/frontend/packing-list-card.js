/*
 * Packing list card for the packing_list integration.
 * Served by the integration and loaded automatically – no resource setup needed.
 *
 *   type: custom:packing-list-card
 *   title: Pakkeliste        # optional
 *   entity: todo.skiferie    # optional: list selected by default
 *   default_tab: pack        # optional: pack | pick | master
 */

const CARD_VERSION = "0.1.0";
const UNCATEGORIZED = "Andet";
const ALWAYS_TAG = "altid";

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
  select, input:not([type=checkbox]) {
    font: inherit; padding: 8px; border-radius: 6px; box-sizing: border-box;
    border: 1px solid var(--divider-color); background: var(--card-background-color);
    color: var(--primary-text-color);
  }
  input:not([type=checkbox]) { flex: 1; min-width: 120px; }
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
  .tabs button { border: none; border-radius: 0; flex: 1; border-bottom: 2px solid transparent; color: var(--secondary-text-color); }
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
    this._hidePacked = false;
    this._showNew = false;
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
      if (ev.key === "Enter" && ev.target.dataset.enter) {
        ev.preventDefault();
        this._action(ev.target.dataset.enter, ev.target);
      }
    });
  }

  setConfig(config) {
    this._config = config || {};
    this._tab = this._config.default_tab || "pack";
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
    for (const state of Object.values(hass.states)) {
      const attrs = state.attributes;
      if (attrs && attrs.packing_list_id !== undefined) {
        count += 1;
        revision = Math.max(revision, attrs.revision || 0);
      }
    }
    const sig = `${revision}|${count}`;
    if (sig !== this._sig) {
      this._sig = sig;
      this._fetch();
    }
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
    return [...groups.entries()].sort(([a], [b]) =>
      a === UNCATEGORIZED ? 1 : b === UNCATEGORIZED ? -1 : a.localeCompare(b, "da"),
    );
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
    const error = this._error ? `<div class="error">${esc(this._error)}</div>` : "";
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

  _renderPack(list) {
    const items = this._hidePacked ? list.items.filter((i) => !i.packed) : list.items;
    const groups = this._group(items)
      .map(
        ([cat, catItems]) =>
          `<div class="cat">${esc(cat)}</div>` +
          catItems
            .map(
              (i) => `<div class="item ${i.packed ? "done" : ""}" data-action="toggle-packed" data-uid="${esc(i.uid)}">
                ${this._checkbox(i.packed)}
                <span class="name">${esc(i.summary)}${i.notes ? `<span class="notes">${esc(i.notes)}</span>` : ""}</span>
              </div>`,
            )
            .join(""),
      )
      .join("");
    const empty = list.items.length
      ? "Alt er pakket 🎉"
      : `Listen er tom – hent punkter under "Vælg fra master".`;
    return `<div class="row tools">
        <label class="check"><input type="checkbox" data-change="hidePacked" ${this._hidePacked ? "checked" : ""}> Skjul pakkede</label>
        <button data-action="reset-list">Nulstil</button>
      </div>
      ${groups || `<div class="empty">${empty}</div>`}
      <div class="row add">
        <input data-input="extraItem" data-enter="add-extra" placeholder="Ekstra punkt kun til denne liste" value="${esc(this._form.extraItem || "")}">
        <button data-action="add-extra">Tilføj</button>
      </div>`;
  }

  _renderPick(list) {
    const byMaster = new Map();
    const bySummary = new Map();
    for (const item of list.items) {
      if (item.master_uid) byMaster.set(item.master_uid, item);
      bySummary.set(item.summary.toLowerCase(), item);
    }
    const chips = this._allTags()
      .map((t) => `<button class="chip" data-action="add-tag" data-tag="${esc(t)}">+ #${esc(t)}</button>`)
      .join("");
    const groups = this._group(this._data.master)
      .map(
        ([cat, catItems]) =>
          `<div class="cat">${esc(cat)}<button class="link" data-action="add-category" data-cat="${esc(cat)}">tilføj alle</button></div>` +
          catItems
            .map((m) => {
              const onList = byMaster.get(m.uid) || bySummary.get(m.summary.toLowerCase());
              return `<div class="item" data-action="toggle-pick" data-uid="${esc(m.uid)}" data-list-uid="${onList ? esc(onList.uid) : ""}">
                ${this._checkbox(onList)}
                <span class="name">${esc(m.summary)}</span>
                <span class="tags">${m.tags.map((t) => `#${esc(t)}`).join(" ")}</span>
              </div>`;
            })
            .join(""),
      )
      .join("");
    return `<div class="label">Tilføj alle punkter med tag:</div>
      <div class="chips">${chips || `<span class="muted small">Ingen tags endnu.</span>`}</div>
      ${groups || `<div class="empty">Master-listen er tom – tilføj punkter under "Master".</div>`}`;
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
        <input data-input="mName" data-enter="add-master" placeholder="Nyt punkt, f.eks. Badetøj" value="${esc(f.mName || "")}">
        <input data-input="mCat" list="pl-categories" placeholder="Kategori, f.eks. Tøj" value="${esc(f.mCat || "")}">
        <datalist id="pl-categories">${categories.map((c) => `<option value="${esc(c)}"></option>`).join("")}</datalist>
        <input data-input="mTags" data-enter="add-master" placeholder="Tags, f.eks. sommer, strand (altid = med på alle lister)" value="${esc(f.mTags || "")}">
        <button class="primary" data-action="add-master">Tilføj til master</button>
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
    } else if (key === "hidePacked") {
      this._hidePacked = ev.target.checked;
      this._render();
    } else if (key === "newAlways") {
      this._form.newAlways = ev.target.checked;
    }
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
        case "toggle-pick":
          if (el.dataset.listUid) {
            await this._call("todo", "remove_item", { item: el.dataset.listUid }, { entity_id: list.entity_id });
          } else {
            await this._call("packing_list", "add_from_master", { entity_id: list.entity_id, items: [el.dataset.uid] });
          }
          break;
        case "add-tag":
          await this._call("packing_list", "add_from_master", { entity_id: list.entity_id, tags: [el.dataset.tag] });
          break;
        case "add-category": {
          const items = this._data.master
            .filter((m) => (m.category || UNCATEGORIZED) === el.dataset.cat)
            .map((m) => m.uid);
          await this._call("packing_list", "add_from_master", { entity_id: list.entity_id, items });
          break;
        }
        case "add-master": {
          const summary = (f.mName || "").trim();
          if (!summary) return;
          const parts = [];
          const cat = (f.mCat || "").trim();
          if (cat) parts.push(`@${cat.replace(/\s+/g, "_")}`);
          for (const tag of (f.mTags || "").split(/[,\s]+/)) {
            const clean = tag.replace(/^#/, "").trim();
            if (clean) parts.push(`#${clean.toLowerCase()}`);
          }
          const data = { item: summary };
          if (parts.length) data.description = parts.join(" ");
          await this._call("todo", "add_item", data, { entity_id: this._data.master_entity_id });
          this._form = { ...f, mName: "", mTags: "" };
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
