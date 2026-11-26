// The manifest (spec section 2, ADR 0003):
//   - mods/tuuxic-layout/mod.json is the release record: version, herdr and the whistle range;
//   - release.js exports the same values (and no other string constants);
//   - every mod's `herdr` equals the layout's;
//   - every other tuuxic-* mod.json has exactly the agreed fields, and no mod has a version.js.

import { suite, json, text, files, shipped, semver, LAYOUT_MOD } from "./harness.js";

const MOD_REQUIRED = ["title", "description", "version", "herdr"];
const MOD_OPTIONAL = ["place", "size", "focusable", "overlay", "cloned_from"];
const LAYOUT_REQUIRED = ["version", "herdr", "whistle"];
const LAYOUT_OPTIONAL = ["title", "description", "place", "size"];

function fields(t, name, m, required, optional) {
  const keys = Object.keys(m);
  t.check(`${name}/mod.json has every required field`, required.filter((k) => !keys.includes(k)), []);
  t.check(`${name}/mod.json has no other field`, keys.filter((k) => !required.includes(k) && !optional.includes(k)), []);
}

export default suite("manifest", (t) => {
  const layout = json(`mods/${LAYOUT_MOD}/mod.json`);
  t.ok("mods/tuuxic-layout/mod.json exists", layout != null);
  if (!layout) return;
  fields(t, LAYOUT_MOD, layout, LAYOUT_REQUIRED, LAYOUT_OPTIONAL);
  t.ok("the layout version is semver", semver(layout.version) != null, `got ${layout.version}`);
  t.ok("the minimum Herdr is semver", semver(layout.herdr) != null, `got ${layout.herdr}`);
  t.ok("the whistle range is a non-empty string", typeof layout.whistle === "string" && layout.whistle.trim() !== "", `got ${layout.whistle}`);

  // release.js: the same values, as exported string constants.
  const rel = text(`mods/${LAYOUT_MOD}/release.js`);
  t.ok("mods/tuuxic-layout/release.js exists", rel != null);
  if (rel != null) {
    const exported = [...rel.matchAll(/^export const \w+ = (["'`])([^"'`]*)\1/gm)].map((m) => m[2]).sort();
    t.check("release.js exports what mod.json says", exported,
      LAYOUT_REQUIRED.map((k) => layout[k]).sort());
    t.ok("release.js imports no herdr", !/from\s+["']herdr["']/.test(rel));
  }

  for (const name of shipped()) {
    const m = json(`mods/${name}/mod.json`);
    t.check(`${name}'s herdr is the layout's`, m.herdr, layout.herdr);
    t.ok(`${name}'s version is semver`, semver(m.version) != null, `got ${m.version}`);
    if (name !== LAYOUT_MOD) fields(t, name, m, MOD_REQUIRED, MOD_OPTIONAL);
  }
  t.check("no mod has a version.js", files.filter((f) => /^mods\/tuuxic-[^/]+\/version\.js$/.test(f)), []);
});
