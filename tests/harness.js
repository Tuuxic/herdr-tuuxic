// The test harness: suites and the repo reads the suites share. Pure: no `herdr` import.
// tests/run.sh copies it into the test mod next to texts.js (the repo's texts, by repo path).
//
// A suite file exports `suite(name, (t) => { ... })`; the test mod (main.js) imports the suite
// under check through the generated suites.js and throws one Error listing every failure.

import texts, { files, since } from "./texts.js";

// JSON with object keys sorted, so two values compare equal whatever order their fields were made in.
export const show = (v) => JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x)
  ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, x[k]])) : x));

export function suite(name, run) {
  const s = { name, fails: [], total: 0 };
  const t = {
    check(caseName, got, want) {
      s.total++;
      if (show(got) !== show(want)) s.fails.push(`${caseName}: got ${show(got)}, want ${show(want)}`);
    },
    ok(caseName, cond, why) { s.total++; if (!cond) s.fails.push(`${caseName}${why ? `: ${why}` : ""}`); },
    fail(caseName, why) { s.total++; s.fails.push(`${caseName}: ${why}`); },
  };
  try { run(t); } catch (e) { s.fails.push(`the suite threw: ${e?.message ?? e}`); }
  return s;
}

export { texts, files, since };

// A repo file's text, or null when it isn't in texts.js (missing, or not collected by run.sh).
export const text = (path) => (path in texts ? String(texts[path]).replace(/\r\n/g, "\n") : null);
// A repo JSON file, parsed; null when missing. A parse error throws, naming the file.
export function json(path) {
  const s = text(path);
  if (s == null) return null;
  try { return JSON.parse(s); } catch (e) { throw new Error(`${path} is not JSON: ${e.message}`); }
}

// The mods that ship: every mods/tuuxic-*/ folder with a mod.json. The layout mod is one of them.
export const LAYOUT_MOD = "tuuxic-layout";
export const shipped = () => [...new Set(files
  .map((f) => /^mods\/(tuuxic-[^/]+)\/mod\.json$/.exec(f)?.[1]).filter(Boolean))].sort();
// The mods a block or command may name besides tuuxic's own.
export const WHISTLE_MODS = ["whistle", "whistle-ui"];
// The six keynav mods (spec section 3).
export const KEYNAV_MODS = ["agents", "changes", "chrome", "files", "spaces", "tabs"].map((m) => `tuuxic-${m}`);

// "1.2.3" -> [1, 2, 3]; null for anything else.
export const semver = (v) => {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(v ?? ""));
  return m ? m.slice(1).map(Number) : null;
};
// How b moved from a: "major", "minor", "patch", "none" or "down".
export function bump(a, b) {
  const x = semver(a), y = semver(b);
  if (!x || !y) return null;
  for (const [i, kind] of [[0, "major"], [1, "minor"], [2, "patch"]]) {
    if (y[i] > x[i]) return kind;
    if (y[i] < x[i]) return "down";
  }
  return "none";
}
export const BUMP_RANK = { none: 0, patch: 1, minor: 2, major: 3 };

// Every block in a layout tree: [{ id, mod, props }].
export function blocks(node, out = []) {
  if (!node || typeof node !== "object") return out;
  if (node.type === "block") out.push({ id: node.id, mod: node.content?.mod ?? null, props: node.content?.props ?? {} });
  for (const c of node.children ?? []) blocks(c, out);
  return out;
}
// Every mod a layout names, at any depth (a block's content, a pane header's content, ...).
export function modsNamed(node, out = []) {
  if (Array.isArray(node)) for (const x of node) modsNamed(x, out);
  else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k === "mod" && typeof v === "string") out.push(v);
      else modsNamed(v, out);
    }
  }
  return out;
}
// Every node id in a layout tree (rows, columns, stacks and blocks).
export function ids(node, out = []) {
  if (!node || typeof node !== "object") return out;
  if (node.id != null) out.push(node.id);
  for (const c of node.children ?? []) ids(c, out);
  return out;
}

// The commands a whistle `mappings` prop runs: every [label, command] pair, at any depth.
export function mappingCommands(map, out = []) {
  if (Array.isArray(map)) {
    if (typeof map[1] === "string") out.push(map[1]);
    else for (const x of map) mappingCommands(x, out);
  } else if (map && typeof map === "object") for (const x of Object.values(map)) mappingCommands(x, out);
  return out;
}
// The commands a keys.json runs: every string value, by section.
export function keysCommands(keys) {
  const out = [];
  for (const [section, binds] of Object.entries(keys ?? {})) {
    for (const cmd of Object.values(binds ?? {})) if (typeof cmd === "string") out.push({ section, cmd });
  }
  return out;
}
// The block or node id a command names, when it names one.
export function namedId(cmd) {
  const m = /^(?:layout\.toggle|whistle\.(?:focus|toggle|toggle-keep-mode|field)):(.+)$/.exec(cmd);
  return m ? m[1] : null;
}
