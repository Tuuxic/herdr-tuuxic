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

test("the only whistle block is a 0 px anchor in the work column, off by default", () => {
  const ws = blocks(layout).filter((b) => b.content?.mod === "whistle");
  assert.deepEqual(ws.map((b) => b.id), ["whistle-anchor"]);
  assert.deepEqual(ws[0].size, { px: 0 });
  assert.equal(ws[0].content.props.enabled, false);
  assert.ok(byId("work").children.some((c) => c.id === "whistle-anchor"));
  assert.equal(byId("statusbar"), undefined);
  assert.equal(byId("statusbar-work"), undefined);
});
