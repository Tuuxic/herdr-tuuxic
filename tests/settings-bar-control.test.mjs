// Settings → Keyboard, the bar control (spec §3): Under the terminals / Full width / Hidden, a
// layout.show/layout.hide on tuuxic-whistle and tuuxic-whistle-full.
import { test } from "node:test";
import assert from "node:assert/strict";
import { barChoice, barSteps, hasWhistleBlock } from "../mods/tuuxic-settings/bar-control.js";

const block = (id, mod, hidden) => ({ id, type: "block", ...(hidden ? { hidden } : {}), content: { mod } });
const tree = (...children) => ({ id: "root", type: "column", children: [{ id: "work", type: "row", children }] });

test("which bar shows", () => {
  assert.equal(barChoice(tree(block("tuuxic-whistle", "tuuxic-bar"), block("tuuxic-whistle-full", "tuuxic-bar", true))), "under");
  assert.equal(barChoice(tree(block("tuuxic-whistle", "tuuxic-bar", true), block("tuuxic-whistle-full", "tuuxic-bar"))), "full");
  assert.equal(barChoice(tree(block("tuuxic-whistle", "tuuxic-bar", true), block("tuuxic-whistle-full", "tuuxic-bar", true))), "hidden");
});

test("no tuuxic-whistle blocks: no control", () => {
  assert.equal(barChoice(tree(block("main", "tuuxic-pane"))), null);
});

test("each choice shows one bar and hides the other, or hides both", () => {
  assert.deepEqual(barSteps("under"), [["layout.hide", { id: "tuuxic-whistle-full" }], ["layout.show", { id: "tuuxic-whistle" }]]);
  assert.deepEqual(barSteps("full"), [["layout.hide", { id: "tuuxic-whistle" }], ["layout.show", { id: "tuuxic-whistle-full" }]]);
  assert.deepEqual(barSteps("hidden"), [["layout.hide", { id: "tuuxic-whistle" }], ["layout.hide", { id: "tuuxic-whistle-full" }]]);
});

test("whether the layout has a whistle block", () => {
  assert.equal(hasWhistleBlock(tree(block("whistle-anchor", "whistle"))), true);
  assert.equal(hasWhistleBlock(tree(block("whistle-corner", "whistle-ui"))), false);
});
