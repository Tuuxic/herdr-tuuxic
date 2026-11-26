// Spec #23 §3 (Layout blocks, Whistle mappings) and §6.1: the shipped layout and keys.json
// against whistle 2.0.0's contracts. Run: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const root = new URL("../", import.meta.url);
const json = (p) => JSON.parse(readFileSync(new URL(p, root), "utf8"));
const blocks = (node, out = []) => {
  if (node.type === "block") out.push(node);
  (node.children ?? []).forEach((c) => blocks(c, out));
  return out;
};
const find = (node, id) => node.id === id ? node : (node.children ?? []).map((c) => find(c, id)).find(Boolean);
const layout = json("layouts/tuuxic.json");
const byId = (id) => find(layout, id);

test("the only whistle block is a 0 px anchor in the root column, on by default", () => {
  const ws = blocks(layout).filter((b) => b.content?.mod === "whistle");
  assert.deepEqual(ws.map((b) => b.id), ["whistle-anchor"]);
  assert.deepEqual(ws[0].size, { px: 0 });
  assert.equal(ws[0].content.props.enabled, true);
  // The 0 px blocks sit in the root column, which has no gap: in the work column (gap 6) each
  // added 6 px under whistle's bar and pushed it up from where its hints box expects it.
  const root = byId("root").children.map((c) => c.id);
  for (const id of ["whistle-anchor", "tuuxic-whistle-corner", "whistle-corner"]) assert.ok(root.includes(id), id);
  assert.equal(byId("work").children.at(-1).id, "tuuxic-whistle");
  assert.equal(byId("statusbar"), undefined);
  assert.equal(byId("statusbar-work"), undefined);
});

test("the anchor carries tuuxic's mappings, with whistle 2.0 command names", () => {
  const m = byId("whistle-anchor").content.props.mappings;
  assert.deepEqual(Object.keys(m).sort(), [",", "/", "?", "C", "E", "c", "e", "m", "p"]);
  assert.deepEqual(m.c, ["Changes", "whistle.focus:changes"]);
  assert.deepEqual(m.C, ["Show or hide Changes", "whistle.toggle:changes"]);
  assert.deepEqual(m.e, ["Files", "whistle.focus:files"]);
  assert.deepEqual(m.E, ["Show or hide Files", "whistle.toggle:files"]);
  const text = JSON.stringify(layout);
  for (const gone of ["whistle.whistle\"", "whistle.type\"", "whistle.enter", "hintsInset", "hintsBorder", "hintsLift", "whistle.settings"])
    assert.ok(!text.includes(gone), gone);
});

test("tuuxic-bar draws whistle's bar under the terminals, full width (hidden) and at the corner", () => {
  assert.deepEqual(byId("tuuxic-whistle").content, { mod: "tuuxic-bar", props: { whistle: "under", hintsAlignRight: 6, hintsAlignBorder: 2, hintsGap: 11 } });
  const full = byId("tuuxic-whistle-full");
  assert.equal(full.hidden, true);
  assert.equal(full.content.props.whistle, "full");
  assert.deepEqual(byId("tuuxic-whistle-corner").content, { mod: "tuuxic-bar", props: { corner: true } });
  assert.deepEqual(byId("tuuxic-whistle-corner").size, { px: 0 });
});

test("whistle-ui is only a 0 px corner block that draws no hints", () => {
  const ui = blocks(layout).filter((b) => b.content?.mod === "whistle-ui");
  assert.deepEqual(ui.map((b) => b.id), ["whistle-corner"]);
  assert.deepEqual(ui[0].size, { px: 0 });
  assert.deepEqual(ui[0].content.props, { corner: true, hints: false });
});

test("keys.json ships no whistle keys", () => {
  const keys = json("keys.json");
  assert.equal(keys["mod:whistle"], undefined);
  assert.ok(!/"whistle(-ui)?\./.test(JSON.stringify(keys)));
  assert.ok(keys["layout:tuuxic"]["ctrl-shift-p"], "tuuxic's own keys stay");
});

test("the repo no longer bundles whistle", () => {
  assert.equal(existsSync(new URL("mods/whistle", root)), false);
});
