// tuuxic-bar's whistle bar model (mods/tuuxic-bar/whistlebar.js): run with `node --test tests/`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { barModel, hintsSpec } from "../mods/tuuxic-bar/whistlebar.js";

const state = (over = {}) => ({ v: 1, mode: "type", enabled: true, sequence: null, pane: null, onTerminal: false, field: null, inert: null, ...over });
const world = (over = {}) => ({ installed: true, layout: null, focused: { pane: "p1" }, panes: [{ pane: "p1", title: "vim" }], shared: {}, flash: null, ...over });

test("WHISTLE on a terminal says Terminal · <title>, no mojibake", () => {
  const m = barModel({ whistle: state({ mode: "whistle", onTerminal: true, pane: "p1" }) }, world()).bar;
  assert.equal(m.badge, "WHISTLE");
  assert.equal(m.label, "Terminal · vim");
});

test("TYPE with a focused pane says Terminal", () => {
  const m = barModel({ whistle: state() }, world()).bar;
  assert.deepEqual([m.badge, m.label], ["TYPE", "Terminal"]);
});

test("WHISTLE on a keynav field shows the field's v3 label", () => {
  const shared = { keynav: { active: "tuuxic-files tree" }, "keynav.field:tuuxic-files tree": { label: "Files" } };
  assert.equal(barModel({ whistle: state({ mode: "whistle" }) }, world({ shared })).bar.label, "Files");
});

test("WHISTLE on a stock field names Spaces/Tabs/Agents from field", () => {
  const layout = { id: "root", children: [{ id: "sp", content: { mod: "spaces" } }] };
  assert.equal(barModel({ whistle: state({ mode: "whistle", field: "sp" }) }, world({ layout })).bar.label, "Spaces");
});

test("switched off says Whistle off with no badge", () => {
  const m = barModel({ whistle: state({ enabled: false }) }, world()).bar;
  assert.deepEqual([m.badge, m.label], [null, "Whistle off"]);
});

test("inert shows inert.problem", () => {
  const m = barModel({ whistle: state({ inert: { problem: "needs Herdr 0.1.15", fix: "update" } }) }, world()).bar;
  assert.equal(m.problem, "needs Herdr 0.1.15");
});

test("installed but not running says Whistle isn't running", () => {
  assert.equal(barModel({}, world()).bar.label, "Whistle isn't running");
});

test("not installed shows one muted line pointing at Settings → Keyboard", () => {
  const m = barModel({}, world({ installed: false })).bar;
  assert.equal(m.label, "Whistle isn't installed — hide this bar in Settings → Keyboard");
  assert.equal(m.muted, true);
});

test("config problems give a ⚠ N marker", () => {
  const m = barModel({ whistle: state(), config: { v: 1, problems: ["a", "b"] } }, world()).bar;
  assert.equal(m.marker, "⚠ 2");
});

test("a running sequence shows its keys and group", () => {
  const m = barModel({ whistle: state({ mode: "whistle", sequence: { keys: ["w"], group: "Panes" } }) }, world()).bar;
  assert.deepEqual(m.sequence, { keys: "w", title: "Panes" });
});

test("a problem event flashes and stays until the next key", () => {
  const events = { v: 1, events: [{ seq: 1, kind: "x", groups: ["problem"], text: "No key w" }] };
  const s = state({ mode: "whistle" });
  const first = barModel({ whistle: s, events }, world({ last: 0 }));
  assert.equal(first.bar.label, "No key w");
  const later = barModel({ whistle: s, events }, world({ last: first.last, flash: first.flash }));
  assert.equal(later.bar.label, "No key w");
  const keyed = barModel({ whistle: state({ mode: "type" }), events }, world({ last: later.last, flash: later.flash }));
  assert.equal(keyed.bar.label, "Terminal");
});

const bars = (fullHidden, underHidden) => ({ id: "root", children: [
  { id: "tuuxic-whistle", hidden: underHidden, content: { mod: "tuuxic-bar", props: { whistle: "under" } } },
  { id: "tuuxic-whistle-full", hidden: fullHidden, content: { mod: "tuuxic-bar", props: { whistle: "full" } } },
  { id: "tuuxic-whistle-corner", content: { mod: "tuuxic-bar", props: { corner: true } } },
] });
const hints = { v: 1, keys: "w", title: "Panes", items: [{ key: "h", label: "Left" }], exit: "esc" };

test("the shown bar opens the hints box in WHISTLE; other copies don't", () => {
  const p = { whistle: state({ mode: "whistle" }), hints };
  const spec = hintsSpec(p, world({ layout: bars(true, false), props: { whistle: "under" } }));
  assert.equal(spec.props.part, "hints");
  assert.equal(hintsSpec(p, world({ layout: bars(true, false), props: { corner: true } })), null);
});

test("with every bar hidden the corner opens the hints box", () => {
  const p = { whistle: state({ mode: "whistle" }), hints };
  assert.ok(hintsSpec(p, world({ layout: bars(true, true), props: { corner: true } })));
});

test("no hints box in TYPE, with hints switched off, or without whistle", () => {
  const w = world({ layout: bars(true, false), props: { whistle: "under" } });
  assert.equal(hintsSpec({ whistle: state(), hints }, w), null);
  assert.equal(hintsSpec({ whistle: state({ mode: "whistle" }), hints }, { ...w, hintsOff: true }), null);
  assert.equal(hintsSpec({ hints }, { ...w, installed: false }), null);
});

test("a new copy doesn't flash events already in the feed", () => {
  const events = { v: 1, events: [{ seq: 4, kind: "x", groups: ["problem"], text: "old" }] };
  const m = barModel({ whistle: state(), events }, world({ last: null }));
  assert.equal(m.bar.label, "Terminal");
  assert.equal(m.last, 4);
});
