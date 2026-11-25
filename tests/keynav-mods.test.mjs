// Keynav v3 in tuuxic's field mods: each mod's keynav(command) driven as whistle would, with
// Herdr and gpui stubbed. Run: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";

// Herdr's state as the mods read it, and the commands and shared writes they make.
const world = { shared: {}, runs: [], writes: [], spaces: [], agents: [] };
globalThis.__world = world;
const HERDR = `const w = globalThis.__world;
export const shared = (k) => w.shared[k];
export const setShared = (k, v) => { w.shared[k] = v; w.writes.push([k, v]); };
export const run = (c, a) => w.runs.push(a === undefined ? [c] : [c, a]);
export const spaces = () => w.spaces;
export const agents = () => w.agents;
const noop = () => undefined;
export const { machines, panes, terminals, focused, openOverlay, closeOverlay, exec, hc, theme, watchFolder,
  window, layout, home, appHome, props, nextCommand, notify, readTextFile, setAgentOrder } = new Proxy({}, { get: () => noop });`;
const GPUI = `export class View {} const n = () => undefined;
export const { div, svg, image, v_flex, h_flex } = new Proxy({}, { get: () => n });`;
registerHooks({
  resolve(spec, ctx, next) {
    if (spec === "herdr" || spec === "gpui-kit" || spec === "gpui-base") return { url: `stub:${spec}`, shortCircuit: true };
    return next(spec, ctx);
  },
  load(url, ctx, next) {
    if (url === "stub:herdr") return { format: "module", source: HERDR, shortCircuit: true };
    if (url.startsWith("stub:gpui")) return { format: "module", source: GPUI, shortCircuit: true };
    return next(url, ctx);
  },
});

const fresh = (over = {}) => { world.shared = {}; world.runs = []; world.writes = []; Object.assign(world, over); };
// A field the driver has selected, with its cursor on `cursor`.
const field = (cursor, extra = {}) => { const f = { key: "k", cursor, ...extra }; world.shared.keynav = { v: 3, active: "k" }; return f; };
const after = () => world.writes.filter(([k]) => k === "keynav.request:k").map(([, v]) => v.after);

const Spaces = (await import("../mods/tuuxic-spaces/main.js")).default;
const Agents = (await import("../mods/tuuxic-agents/main.js")).default;
const Tabs = (await import("../mods/tuuxic-tabs/main.js")).default;

test("spaces: pick goes to the space and switches whistle to TYPE", () => {
  fresh({ spaces: [{ id: "s1" }, { id: "s2" }] });
  const f = field("s2", { order: ["s1", "s2"] }); world.shared.whistle = { mode: "whistle" };
  Spaces.prototype.keynav.call(f, "keynav-pick");
  assert.deepEqual(world.runs, [["space.select", { id: "s2" }], ["whistle.mode:type"]]);
  assert.deepEqual(after(), ["hold"]);
});

test("spaces: pick without whistle runs no whistle command", () => {
  fresh({ spaces: [{ id: "s1" }] });
  Spaces.prototype.keynav.call(field("s1", { order: ["s1"] }), "keynav-pick");
  assert.deepEqual(world.runs, [["space.select", { id: "s1" }]]);
});

test("spaces: Space shows the space and stays in WHISTLE", () => {
  fresh({ spaces: [{ id: "s1" }] });
  const f = field("s1", { order: ["s1"] }); world.shared.whistle = { mode: "whistle" };
  Spaces.prototype.keynav.call(f, "keynav-key-space");
  assert.deepEqual(world.runs, [["space.select", { id: "s1" }]]);
  assert.deepEqual(after(), ["hold"]);
});

test("spaces: the old open move does nothing", () => {
  fresh({ spaces: [{ id: "s1" }] });
  Spaces.prototype.keynav.call(field("s1", { order: ["s1"] }), "keynav-open");
  assert.deepEqual(world.runs, []);
});

// `order` is what the list drew last: a folded machine's or group's rows aren't in it.
for (const [name, List, live, run] of [
  ["spaces", Spaces, (ids) => ({ spaces: ids.map((id) => ({ id })) }), "space.select"],
  ["agents", Agents, (ids) => ({ agents: ids.map((address) => ({ address })) }), "agent.focus"],
]) {
  test(`${name}: j/k step over the rows drawn, skipping a folded group's`, () => {
    fresh(live(["x1", "x2", "x3"]));
    const f = field("x1", { order: ["x1", "x3"] });
    List.prototype.keynav.call(f, "keynav-down");
    assert.equal(f.cursor, "x3");
    List.prototype.keynav.call(f, "keynav-up");
    assert.equal(f.cursor, "x1");
  });

  test(`${name}: pick and Show do nothing once the cursor's item is gone or folded away`, () => {
    fresh(live(["x1", "x2"]));
    world.shared.whistle = { mode: "whistle" };
    List.prototype.keynav.call(field("gone", { order: ["x1", "x2"] }), "keynav-pick");
    List.prototype.keynav.call(field("gone", { order: ["x1", "x2"] }), "keynav-key-space");
    List.prototype.keynav.call(field("x2", { order: ["x1"] }), "keynav-pick");
    List.prototype.keynav.call(field("x1", { order: ["x1", "x2"] }), "keynav-key-space");
    assert.deepEqual(world.runs.map(([c]) => c), [run]);
  });
}

test("agents: pick focuses the agent, asks for the terminal, then TYPE", () => {
  fresh({ agents: [{ address: "a1" }, { address: "a2" }] });
  const f = field("a1", { order: ["a1", "a2"] }); world.shared.whistle = { mode: "whistle" };
  Agents.prototype.keynav.call(f, "keynav-pick");
  assert.deepEqual(world.runs, [["agent.focus", { terminal: "a1" }], ["whistle.mode:type"]]);
  assert.deepEqual(after(), ["terminal"]);
});

test("agents: Space shows the agent and holds the keys", () => {
  fresh({ agents: [{ address: "a1" }] });
  const f = field("a1", { order: ["a1"] }); world.shared.whistle = { mode: "whistle" };
  Agents.prototype.keynav.call(f, "keynav-key-space");
  assert.deepEqual(world.runs, [["agent.focus", { terminal: "a1" }]]);
  assert.deepEqual(after(), ["hold"]);
});

test("tabs: declared x closes the tab under the cursor and moves the cursor on", () => {
  fresh({ spaces: [{ active: true, tabs: [{ id: "t1" }, { id: "t2" }] }] });
  const f = field("t1");
  Tabs.prototype.keynav.call(f, "keynav-key-x");
  assert.deepEqual(world.runs, [["tab.close", { id: "t1" }]]);
  assert.equal(f.cursor, "t2");
  assert.deepEqual(after(), ["hold"]);
});

test("tabs: pick selects the tab and holds the keys", () => {
  fresh({ spaces: [{ active: true, tabs: [{ id: "t1" }] }] });
  Tabs.prototype.keynav.call(field("t1"), "keynav-pick");
  assert.deepEqual(world.runs, [["tab.select", { id: "t1" }]]);
  assert.deepEqual(after(), ["hold"]);
});

test("no command acts while the field isn't selected", () => {
  fresh({ spaces: [{ id: "s1" }] });
  Spaces.prototype.keynav.call({ key: "k", cursor: "s1" }, "keynav-pick");
  assert.deepEqual(world.runs, []);
});
