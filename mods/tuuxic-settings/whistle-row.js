// Settings → Keyboard, the Whistle mode row (spec §4). Pure: main.js gathers the facts.
//
// manifest:     mods/whistle/mod.json parsed, or null when the file is missing (not installed)
// state:        readWhistle(): null when whistle hasn't published; `inert` set while it stands aside
// range:        the `whistle` range of mods/tuuxic-layout/mod.json, or null (tuuxic-settings alone)
// hasBlock:     whether the shown layout has a `"mod": "whistle"` block, or null (not checked)
// hasUi:        whether mods/whistle-ui/mod.json exists (Open runs whistle-ui.settings)
// herdrVersion: this Herdr's version, when known
//
// Returns { kind, switch, open, text, fix }: whether to show the switch and Open, and the line.

import { inRange } from "./whistle-range.js";

// This Herdr's version from herdr's updates() (pass the function): updates().app.version, the
// same read whistle 2.0 makes for its "Herdr too old" check. null when it isn't there.
export function herdrVersionOf(updates) {
  try { return updates?.()?.app?.version ?? null; } catch { return null; }
}

const row = (kind, text = null, extra = {}) => ({ kind, switch: false, open: false, text, fix: null, ...extra });

// "2.x" for ">=2.0.0 <3.0.0": the major of the lower bound.
function tested(range) {
  const m = /(?:^|\s)>=?(\d+)\./.exec(range);
  return m ? `${m[1]}.x` : range;
}

// Whether a version is a plain x.y.z the range compare can read.
const readable = (v) => inRange(v, ">=0.0.0");

// "Whistle 3.1.0", or what's wrong with a version the range compare can't read.
function named(version) {
  if (version == null || version === "") return "Whistle's mod.json has no version";
  return readable(version) ? `Whistle ${version}` : `Can't read whistle's version ${version}`;
}

export function whistleRow({ manifest, state, range = null, hasBlock = null, hasUi = false, herdrVersion = null }) {
  const alone = range == null;
  if (!manifest) return row("not-installed", "Not installed — see RECIPE");
  if (state?.inert) return row("inert", state.inert.problem ?? null, { fix: state.inert.fix ?? null });
  if (state) {
    if (!alone && !inRange(manifest.version, range)) {
      return row("out-of-range", `${named(manifest.version)} — tuuxic is tested with ${tested(range)}`, { switch: true });
    }
    return row("running", null, { switch: true, open: Boolean(hasUi) });
  }
  if (hasBlock === false) return row("no-block", "Not in this layout — add whistle-anchor (see RECIPE)");
  const need = manifest.herdr;
  // Only when both versions read: an unreadable one says nothing about which is older.
  const old = readable(need) && readable(herdrVersion) && !inRange(herdrVersion, `>=${need}`);
  return row("not-running", old ? `Not running — needs Herdr ≥ ${need} (this is ${herdrVersion})` : "Not running");
}
