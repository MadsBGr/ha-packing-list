// Tests for the packing list card, run with `npm test` (Node's test runner + happy-dom).
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";

const window = new Window({ url: "https://example.com/" });
for (const name of ["document", "HTMLElement", "customElements", "Event", "KeyboardEvent", "localStorage", "sessionStorage", "location"]) {
  globalThis[name] = window[name];
}
globalThis.window = window;
await import("../../custom_components/packing_list/frontend/packing-list-card.js");

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

const item = (uid, summary, category, extra = {}) => ({
  uid, summary, description: "", notes: "", category, tags: [], packed: false,
  master_uid: null, quantity: null, weight: null, ...extra,
});
const list = (list_id, name, extra = {}) => ({
  list_id, name, entity_id: `todo.${list_id}`, tags: [], categories: [], include_always: false,
  excluded: [], notes: "", use_weight: false, weight_limit: null, archived: false, items: [], ...extra,
});

// A card with fake hass. Returns helpers to read the shadow DOM and the calls made.
async function makeCard({ data, lang = "da", config = {} }) {
  const calls = [];
  const el = document.createElement("packing-list-card");
  el.setConfig(config);
  document.body.appendChild(el);
  let revision = 1;
  const hass = () => ({
    language: lang,
    locale: { language: lang },
    states: { "todo.x": { attributes: { packing_list_id: "x", revision } } },
    callWS: async (msg) => {
      calls.push(msg);
      return msg.type === "packing_list/data" ? data : { response: { list_id: "new" } };
    },
    callService: async (domain, service, serviceData, target) => {
      calls.push({ domain, service, data: serviceData, target });
    },
  });
  el.hass = hass();
  await tick();
  const root = el.shadowRoot;
  return {
    el,
    calls,
    $: (selector) => root.querySelector(selector),
    $$: (selector) => [...root.querySelectorAll(selector)],
    text: () => root.querySelector("ha-card").textContent.replace(/\s+/g, " ").trim(),
    // Simulate a change on the server: new revision -> the card refetches.
    async refresh() {
      revision += 1;
      el.hass = hass();
      await tick();
    },
  };
}

const baseData = () => ({
  master_entity_id: "todo.packing_list_master",
  active_list_id: null,
  settings: { include_always: true, use_weight: false, default_tags: [], weight_limit: null },
  new_defaults: [],
  master: [
    item("m1", "Pas", "Dokumenter", { tags: ["fly"] }),
    item("m2", "Badetøj", "Tøj", { tags: ["strand"] }),
    item("m3", "Solcreme", "Toilettaske", { tags: ["strand"] }),
  ],
  lists: [
    list("ski", "Ski", {
      items: [
        item("a", "Tandbørste", "Toilettaske"),
        item("b", "Ørepropper", "Toilettaske", { packed: true }),
        item("c", "Bamse", null, { packed: true }),
      ],
    }),
  ],
});

beforeEach(() => {
  document.body.innerHTML = "";
  localStorage.clear();
  sessionStorage.clear();
});

test("renders the pack tab grouped by category, packed items at the bottom sorted by name", async () => {
  const card = await makeCard({ data: baseData(), config: { packed_mode: "bottom" } });
  const rows = card.$$(".cat, .item .name").map((e) => (e.classList.contains("cat") ? `[${e.textContent.trim()}]` : e.textContent.trim()));
  assert.deepEqual(rows, ["[Toilettaske]", "Tandbørste", "[Pakket (2)]", "Bamse", "Ørepropper"]);
  assert.match(card.text(), /2 af 3 pakket/);
});

test("tapping an item marks it as packed", async () => {
  const card = await makeCard({ data: baseData() });
  card.$('[data-action="toggle-packed"][data-uid="a"]').click();
  await tick();
  const call = card.calls.find((c) => c.service === "update_item");
  assert.deepEqual(call, {
    domain: "todo", service: "update_item", data: { item: "a", status: "completed" }, target: { entity_id: "todo.ski" },
  });
});

test("delete mode removes the selected items", async () => {
  const card = await makeCard({ data: baseData() });
  card.$('[data-action="delete-mode"]').click();
  await tick();
  card.$('[data-action="toggle-select"][data-uid="a"]').click();
  card.$('[data-action="toggle-select"][data-uid="c"]').click();
  assert.equal(card.$('[data-action="delete-selected"]').textContent.trim(), "Slet (2)");
  card.$('[data-action="delete-selected"]').click();
  await tick();
  const call = card.calls.find((c) => c.service === "remove_item");
  assert.deepEqual(call.data, { item: ["a", "c"] });
});

test("a new list starts from the configured defaults", async () => {
  const data = baseData();
  data.settings = {
    include_always: false, use_weight: true, default_tags: ["fly", "gone"], weight_limit: 23000, quantity_controls: true,
  };
  const card = await makeCard({ data });
  card.$('[data-action="toggle-new"]').click();
  await tick();
  assert.deepEqual(card.$$('[data-action="toggle-new-tag"].on').map((b) => b.textContent), ["#fly"]);
  assert.equal(card.$('[data-input="newLimit"]').value, "23");
  assert.equal(card.$('[data-change="newQty"]').checked, true);
  const name = card.$('[data-input="newName"]');
  name.value = "Rejse";
  name.dispatchEvent(new Event("input", { bubbles: true }));
  card.$('[data-action="create-list"]').click();
  await tick();
  const create = card.calls.find((c) => c.service === "create_list");
  assert.deepEqual(create.service_data, {
    name: "Rejse", notes: "", tags: ["fly"], include_always: false, use_weight: true, weight_limit: 23000,
    quantity_controls: true,
  });
});

test("quantity buttons change the quantity directly on the card", async () => {
  const data = baseData();
  data.lists[0] = list("ski", "Ski", {
    quantity_controls: true,
    items: [item("a", "Strømper", "Tøj", { quantity: 2 }), item("b", "Pas", "Dokumenter")],
  });
  const card = await makeCard({ data });
  const count = (uid) => card.$(`[data-action="qty-inc"][data-uid="${uid}"]`).parentElement.querySelector(".count").textContent;
  assert.equal(count("a"), "2");
  assert.equal(count("b"), "1");
  assert.equal(card.$('[data-action="qty-dec"][data-uid="b"]').disabled, true);

  card.$('[data-action="qty-inc"][data-uid="a"]').click();
  await tick();
  assert.equal(count("a"), "3");
  card.$('[data-action="qty-dec"][data-uid="a"]').click();
  card.$('[data-action="qty-dec"][data-uid="a"]').click();
  await tick();
  const calls = card.calls.filter((c) => c.service === "update_list_item").map((c) => c.data.quantity);
  assert.deepEqual(calls, [3, 2, null]); // 1 is stored as "no quantity"
  // The buttons don't toggle the item as packed.
  assert.equal(card.calls.some((c) => c.service === "update_item"), false);
});

test("texts follow the language, with English as fallback", async () => {
  for (const [lang, expected] of [["da", "Vælg fra master"], ["en", "Pick from master"], ["de", "Pick from master"]]) {
    const card = await makeCard({ data: baseData(), lang });
    assert.ok(card.text().includes(expected), `${lang}: ${card.text()}`);
    card.el.remove();
  }
});

test("asks before bringing back items deleted from the list", async () => {
  const data = baseData();
  data.lists[0].excluded = ["m2"]; // Badetøj was deleted; Solcreme is new
  const card = await makeCard({ data, config: { default_tab: "pick" } });
  card.$('[data-action="pick-tag"][data-tag="strand"]').click();
  await tick();
  assert.match(card.$(".dialog .msg").textContent, /Badetøj/);
  const buttons = card.$$(".dialog button").map((b) => b.textContent);
  assert.deepEqual(buttons, ["Hent også den slettede", "Kun nye punkter (1)", "Annuller"]);
  card.$$(".dialog button")[0].click();
  await tick();
  const call = card.calls.find((c) => c.service === "add_from_master");
  assert.deepEqual(call.data, { entity_id: "todo.ski", tags: ["strand"], include_excluded: true });
});

test("follows the active list and makes a picked list active", async () => {
  const data = baseData();
  data.lists.push(list("strand", "Strand"));
  data.active_list_id = "strand";
  const card = await makeCard({ data });
  assert.equal(card.$('select[data-change="select-list"]').value, "strand");

  data.active_list_id = "ski"; // changed elsewhere, e.g. by an automation
  await card.refresh();
  assert.equal(card.$('select[data-change="select-list"]').value, "ski");

  const select = card.$('select[data-change="select-list"]');
  select.value = "strand";
  select.dispatchEvent(new Event("change", { bubbles: true }));
  await tick();
  const call = card.calls.find((c) => c.service === "set_active_list");
  assert.deepEqual(call.data, { entity_id: "todo.strand" });
});

test("warns when a list is over its weight limit", async () => {
  const data = baseData();
  data.lists[0] = list("ski", "Ski", {
    use_weight: true,
    weight_limit: 1000,
    items: [item("a", "Støvler", "Tøj", { weight: 900, quantity: 2 })],
  });
  const card = await makeCard({ data });
  assert.match(card.$(".overlimit").textContent, /800 g over vægtgrænsen/);
});
