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

const row = (kind, text = null, extra = {}) => ({ kind, switch: false, open: false, text, fix: null, ...extra });

// "2.x" for ">=2.0.0 <3.0.0": the major of the lower bound.
function tested(range) {
  const m = /(?:^|\s)>=?(\d+)\./.exec(range);
  return m ? `${m[1]}.x` : range;
}

export function whistleRow({ manifest, state, range = null, hasBlock = null, hasUi = false, herdrVersion = null }) {
  const alone = range == null;
  if (!manifest) return row("not-installed", "Not installed — see RECIPE");
  if (!alone && !manifest.version) return row("pre-1.0", "This whistle came with an older tuuxic — update whistle (see RECIPE)");
  if (state?.inert) return row("inert", state.inert.problem ?? null, { fix: state.inert.fix ?? null });
  if (state) {
    if (!alone && !inRange(manifest.version, range)) {
      return row("out-of-range", `Whistle ${manifest.version} — tuuxic is tested with ${tested(range)}`, { switch: true });
    }
    return row("running", null, { switch: true, open: Boolean(hasUi) });
  }
  if (hasBlock === false) return row("no-block", "Not in this layout — add whistle-anchor (see RECIPE)");
  const need = manifest.herdr;
  const old = need && herdrVersion && !inRange(herdrVersion, `>=${need}`);
  return row("not-running", old ? `Not running — needs Herdr ≥ ${need} (this is ${herdrVersion})` : "Not running");
}
