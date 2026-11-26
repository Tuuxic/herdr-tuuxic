// Settings → Keyboard, the Whistle mode row's states (spec §4).
import { test } from "node:test";
import assert from "node:assert/strict";
import { whistleRow, herdrVersionOf } from "../mods/tuuxic-settings/whistle-row.js";

test("herdrVersionOf: Herdr's own version from herdr.updates(), as whistle 2.0 reads it", () => {
  assert.equal(herdrVersionOf(() => ({ app: { version: "0.1.9" }, core: { version: "1.0.0" } })), "0.1.9");
  assert.equal(herdrVersionOf(() => ({ core: { version: "1.0.0" } })), null);
  assert.equal(herdrVersionOf(() => { throw new Error("no updates"); }), null);
  assert.equal(herdrVersionOf(undefined), null);
});

const RANGE = ">=2.0.0 <3.0.0";
const W2 = { version: "2.0.0", herdr: "0.1.18" };
const RUNNING = { mode: "type", enabled: true, inert: null };
const LAYOUT = { range: RANGE, hasBlock: true };

test("running and in range: switch, and Open when whistle-ui is there", () => {
  assert.deepEqual(whistleRow({ ...LAYOUT, manifest: W2, state: RUNNING, hasUi: true }),
    { kind: "running", switch: true, open: true, text: null, fix: null });
  assert.equal(whistleRow({ ...LAYOUT, manifest: W2, state: RUNNING, hasUi: false }).open, false);
});

test("running but out of range: switch and the tested range", () => {
  const row = whistleRow({ ...LAYOUT, manifest: { version: "3.1.0" }, state: RUNNING, hasUi: true });
  assert.equal(row.kind, "out-of-range");
  assert.equal(row.switch, true);
  assert.equal(row.open, false);
  assert.equal(row.text, "Whistle 3.1.0 — tuuxic is tested with 2.x");
});

test("inert: whistle's own problem and fix", () => {
  const row = whistleRow({ ...LAYOUT, manifest: W2, state: { ...RUNNING, inert: { problem: "Herdr is too old", fix: "Update Herdr" } } });
  assert.deepEqual(row, { kind: "inert", switch: false, open: false, text: "Herdr is too old", fix: "Update Herdr" });
});

test("installed, no state: not running, with the Herdr it needs when this one is older", () => {
  assert.equal(whistleRow({ ...LAYOUT, manifest: W2, state: null, herdrVersion: "0.1.18" }).text, "Not running");
  assert.equal(whistleRow({ ...LAYOUT, manifest: W2, state: null, herdrVersion: "0.1.9" }).text,
    "Not running — needs Herdr ≥ 0.1.18 (this is 0.1.9)");
});

test("installed, no whistle block in the layout", () => {
  const row = whistleRow({ ...LAYOUT, hasBlock: false, manifest: W2, state: null });
  assert.equal(row.kind, "no-block");
  assert.equal(row.text, "Not in this layout — add whistle-anchor (see RECIPE)");
});

test("a version the range compare can't read says so, not that it's in range", () => {
  const text = (version) => whistleRow({ ...LAYOUT, manifest: { version }, state: RUNNING }).text;
  assert.equal(text("2.0"), "Can't read whistle's version 2.0 — tuuxic is tested with 2.x");
  assert.equal(text("2.0.0+abc"), "Can't read whistle's version 2.0.0+abc — tuuxic is tested with 2.x");
  assert.equal(text(undefined), "Whistle's mod.json has no version — tuuxic is tested with 2.x");
  assert.equal(whistleRow({ ...LAYOUT, manifest: {}, state: RUNNING }).kind, "out-of-range");
});

test("not running: no Herdr claim when either version can't be read", () => {
  assert.equal(whistleRow({ ...LAYOUT, manifest: W2, state: null, herdrVersion: "0.1.19-dev" }).text, "Not running");
  assert.equal(whistleRow({ ...LAYOUT, manifest: { ...W2, herdr: ">=0.1.18" }, state: null, herdrVersion: "0.1.9" }).text, "Not running");
});

test("not installed", () => {
  assert.equal(whistleRow({ ...LAYOUT, manifest: null, state: null }).text, "Not installed — see RECIPE");
});

test("tuuxic-settings alone: no range note, no layout check", () => {
  const alone = { range: null, hasBlock: null };
  assert.equal(whistleRow({ ...alone, manifest: { version: "3.1.0" }, state: RUNNING, hasUi: true }).kind, "running");
  assert.equal(whistleRow({ ...alone, manifest: {}, state: RUNNING }).kind, "running");
  assert.equal(whistleRow({ ...alone, manifest: W2, state: null }).text, "Not running");
});
