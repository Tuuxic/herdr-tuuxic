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

const v1 = (value) => Boolean(value) && typeof value === "object" && value.v === 1;

// whistle.js's readWhistle(), without the Herdr call.
export function readState(value) {
  if (!v1(value)) return null;
  const { mode, enabled, sequence, pane, onTerminal, field, inert } = value;
  return { mode, enabled, sequence, pane, onTerminal, field, inert };
}

export const NOT_INSTALLED = "Whistle isn't installed — hide this bar in Settings → Keyboard";
export const NOT_RUNNING = "Whistle isn't running";

const STOCK = { spaces: "Spaces", tabs: "Tabs", agents: "Agents" };

function blocks(layout) {
  const out = [];
  const walk = (n) => {
    if (!n) return;
    if (n.content?.mod) out.push({ id: n.id, mod: n.content.mod });
    for (const c of n.children ?? []) walk(c);
  };
  walk(layout);
  return out;
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
