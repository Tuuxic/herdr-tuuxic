// What tuuxic-bar's whistle bar shows, pure (no `herdr` import, so it can be tested): parity with
// whistle-ui 2.0.0's bar (ui.js), plus tuuxic's own bits: the key sequence and its group while a
// sequence runs, and messages that stay until the next key. It reads only whistle's public keys
// (shared("whistle"), whistle.config, whistle.events) and keynav v3.
//
// published: { whistle, config, events } as Herdr holds them.
// world: { installed: whistle's mod.json exists (false: not installed; undefined: unknown yet),
//          layout, focused, panes, shared: { keynav, "keynav.field:<active>" },
//          last: seq of the last event handled (null: none read yet), flash: the kept flash }
// Returns { bar: { badge, label, marker, problem?, sequence?, muted? }, last, flash }.

import { hintsBox } from "./box.js";

const v1 = (value) => Boolean(value) && typeof value === "object" && value.v === 1;

// whistle.js's readWhistle(), without the Herdr call.
export function readState(value) {
  if (!v1(value)) return null;
  const { mode, enabled, sequence, pane, onTerminal, field, inert } = value;
  return { mode, enabled, sequence, pane, onTerminal, field, inert };
}

const NOT_INSTALLED = "Whistle isn't installed — hide whistle's bar in Settings → Keyboard";
const NOT_RUNNING = "Whistle isn't running";

const STOCK = { spaces: "Spaces", tabs: "Tabs", agents: "Agents" };

const isObject = (v) => Boolean(v) && typeof v === "object" && !Array.isArray(v);

// The layout's mod blocks, in layout order: [{ id, mod, props, shown }].
function blocks(layout) {
  const out = [];
  const walk = (n, hidden) => {
    if (!n) return;
    const h = hidden || Boolean(n.hidden);
    if (n.content?.mod) out.push({ id: n.id, mod: n.content.mod, props: isObject(n.content.props) ? n.content.props : {}, shown: !h });
    for (const c of n.children ?? []) walk(c, h);
  };
  walk(layout, false);
  return out;
}

export const isCorner = (props) => isObject(props) && props.corner === true;
export const isWhistleBlock = (props) => isObject(props) && (props.corner === true || typeof props.whistle === "string");

// Props as text, keys sorted: copies know their block only by its props.
const stable = (v) => {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (isObject(v)) return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(",")}}`;
  return JSON.stringify(v ?? null);
};

// The tuuxic-bar block that shows the hints: the first whistle bar shown, else the corner.
function leads(world) {
  const all = blocks(world.layout).filter((b) => b.mod === "tuuxic-bar" && b.shown && isWhistleBlock(b.props));
  const l = all.find((b) => !isCorner(b.props)) ?? all.find((b) => isCorner(b.props));
  return Boolean(l) && stable(l.props) === stable(world.props ?? {});
}

// tuuxic's hints switch: the live shared value (Settings publishes it while open) wins, else
// whistleHints in <appHome>/tuuxic.json (savedText: its text, or null), so "off" survives a restart.
export function hintsOff(live, savedText) {
  if (typeof live === "boolean") return !live;
  try { return JSON.parse(savedText ?? "null")?.whistleHints === false; } catch { return false; }
}

// The hints overlay this copy should have open, or null: the lead's, while whistle runs in
// WHISTLE with hints to show and tuuxic's hints switch is on (world.hintsOff false).
// world also takes props (this block's), size (its drawn size) and viewport.
export function hintsSpec(published, world) {
  if (world.installed === false || world.hintsOff) return null;
  const state = readState(published.whistle);
  if (!state || state.inert || state.mode !== "whistle" || !leads(world)) return null;
  const h = v1(published.hints) && Array.isArray(published.hints.items) ? published.hints : null;
  if (!h) return null;
  const b = hintsBox(h.items, world.viewport ?? null, isCorner(world.props) ? null : { place: world.props ?? {}, size: world.size ?? null });
  return { mod: "tuuxic-bar", kind: "window", frame: "none", width: b.width, height: b.height, ...(b.at ? { at: b.at } : {}),
    props: { part: "hints", width: b.width } };
}

// Where the keyboard is, as whistle-ui 2.0.0 says it.
function where(state, world) {
  if (state.mode !== "whistle") return world.focused?.pane ? "Terminal" : "";
  if (state.onTerminal) {
    const p = (world.panes ?? []).find((x) => x.pane === state.pane);
    const name = (p?.title || p?.program?.name || "").slice(0, 40);
    return name ? `Terminal · ${name}` : "Terminal";
  }
  const active = world.shared?.keynav?.active;
  if (typeof active === "string") {
    const label = world.shared?.[`keynav.field:${active}`]?.label;
    return typeof label === "string" ? label : active.split(" ")[0];
  }
  return STOCK[blocks(world.layout).find((b) => b.id === state.field)?.mod] ?? "";
}

// Anything a key changes: a flash stays until this changes (the next key).
const keyed = (state) => JSON.stringify(state ? [state.mode, state.enabled, state.sequence, state.pane, state.onTerminal, state.field] : null);

// New problem-group events become the flash; else the kept one stays until the next key.
function flashed(events, state, world) {
  const list = v1(events) && Array.isArray(events.events) ? events.events : [];
  const newest = list.length ? list.at(-1).seq : (world.last ?? 0);
  if (world.last == null) return { last: newest, flash: null };
  const again = newest < world.last;
  const fresh = list.filter((e) => (again || e.seq > world.last) && Array.isArray(e.groups) && e.groups.includes("problem"));
  if (fresh.length) return { last: newest, flash: { text: fresh.map((e) => e.text).join(" · "), key: keyed(state) } };
  const f = world.flash;
  return { last: newest, flash: f && f.key === keyed(state) ? f : null };
}

export function barModel(published, world) {
  if (world.installed === false) return { bar: { badge: null, label: NOT_INSTALLED, marker: null, muted: true }, last: world.last ?? null, flash: null };
  const state = readState(published.whistle);
  const { last, flash } = flashed(published.events, state, world);
  const done = (bar) => ({ bar, last, flash });
  if (!state) return done({ badge: null, label: NOT_RUNNING, marker: null });
  if (state.inert) return done({ badge: null, label: "", marker: null, problem: state.inert.problem ?? NOT_RUNNING });
  const config = v1(published.config) ? published.config : null;
  const n = Array.isArray(config?.problems) ? config.problems.length : 0;
  const marker = n ? `⚠ ${n}` : null;
  if (state.enabled === false) return done({ badge: null, label: flash?.text ?? "Whistle off", marker });
  const badge = state.mode === "whistle" ? "WHISTLE" : "TYPE";
  const seq = state.sequence && Array.isArray(state.sequence.keys) && state.sequence.keys.length
    ? { keys: state.sequence.keys.join(" "), title: state.sequence.group ?? "" } : null;
  return done({ badge, label: flash?.text ?? where(state, world), marker, ...(seq && !flash ? { sequence: seq } : {}) });
}
