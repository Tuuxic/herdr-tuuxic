// The CHANGELOG and the bumps (spec sections 1, 7 and 8):
//   - an entry `## v<layout version> (<date>)` exists;
//   - it has the audience shape: Upgrading, Mods, You, Authors, in that order, none empty;
//   - its Mods names every mod but tuuxic-layout at its mod.json version (`old → new` when bumped);
//   - every keys.json change since the last v* tag has an Upgrading note;
//   - since the last v* tag, a mod with changed files has a higher version, and the layout rises
//     at least as much as the largest mod bump. tests/run.sh reads git into `since`.

import { suite, json, text, shipped, bump, BUMP_RANK, since, LAYOUT_MOD } from "./harness.js";

const SECTIONS = ["Upgrading", "Mods", "You", "Authors"];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default suite("release", (t) => {
  const layout = json(`mods/${LAYOUT_MOD}/mod.json`);
  const log = text("CHANGELOG.md");
  t.ok("CHANGELOG.md exists", log != null);
  t.ok("mods/tuuxic-layout/mod.json exists", layout != null);
  if (!log || !layout) return;
  const v = layout.version;
  const unfenced = log.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, "");
  const heading = new RegExp(`^## v${esc(v)} \\(([^)]*)\\)[ \\t]*$`, "m").exec(unfenced);
  t.ok(`CHANGELOG has an entry ## v${v} (<date>)`, heading != null);
  if (heading) {
    const body = unfenced.slice(heading.index + heading[0].length).split(/^## /m)[0];
    const got = [...body.matchAll(/^### (.+?)\s*$/gm)].map((m) => m[1]);
    t.check(`v${v}'s sections`, got, SECTIONS);
    const part = (name) => body.split(new RegExp(`^### ${name}\\s*$`, "m"))[1]?.split(/^### /m)[0].trim() ?? "";
    t.check(`v${v}'s empty sections (an empty one says "Nothing.")`, SECTIONS.filter((s) => part(s) === ""), []);

    const mods = part("Mods");
    const missing = [];
    for (const name of shipped().filter((n) => n !== LAYOUT_MOD)) {
      const mv = json(`mods/${name}/mod.json`).version;
      const at = new RegExp(`${esc(name)}\\b[^\\n]*?(?:[\\d.]+\\s*(?:→|->)\\s*)?\\b${esc(mv)}\\b`);
      if (!at.test(mods)) missing.push(`${name} ${mv}`);
    }
    t.check(`v${v}'s Mods names every mod at its version`, missing, []);
    t.ok(`v${v}'s Mods doesn't list tuuxic-layout`, !new RegExp(`\\b${LAYOUT_MOD}\\b`).test(mods));
    if (since?.tag && since.keysChanged) {
      t.ok(`keys.json changed since ${since.tag}: v${v}'s Upgrading says so`,
        /keys\.json/.test(part("Upgrading")), "no Upgrading note naming keys.json");
    }
  }

  // Bumps since the last v* tag.
  if (!since?.tag) { t.ok("no v* tag yet: no bumps to check", true); return; }
  let largest = "none";
  for (const [name, m] of Object.entries(since.mods ?? {})) {
    if (name === LAYOUT_MOD || !m.changed) continue;
    const now = json(`mods/${name}/mod.json`)?.version;
    if (m.old == null) continue; // new since the tag
    const b = bump(m.old, now);
    t.ok(`${name} changed since ${since.tag}: its version rose`, BUMP_RANK[b] > 0, `${m.old} -> ${now}`);
    if (BUMP_RANK[b] > BUMP_RANK[largest]) largest = b;
  }
  const lb = bump(since.tag.replace(/^v/, ""), v);
  t.ok(`the layout rises at least as much as the largest mod bump (${largest})`,
    BUMP_RANK[lb] >= BUMP_RANK[largest], `${since.tag} -> v${v} is ${lb}`);
});
