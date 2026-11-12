// Opens another tuuxic mod, or Herdr's own equivalent when that mod isn't installed, so this
// mod works on its own. A mod can't import from another mod's folder: tuuxic-bar, tuuxic-chrome
// and tuuxic-palette each have a copy of this file; change all three.

import { run, readTextFile, appHome } from "herdr";

const FALLBACK = {
  "tuuxic-palette": ["app.palette"],
  "tuuxic-settings": ["app.settings"],
  "tuuxic-keys": ["app.help"],
  "tuuxic-picker": ["mod.open", { name: "picker" }],
};

// name -> true / false once looked at; unknown counts as installed.
const installed = {};

// Looks for each mod's main.js, then re-renders (cx: the caller's context).
export function lookFor(names, cx) {
  cx.spawn(async (cx) => {
    for (const name of names) installed[name] = (await readTextFile(`${appHome()}/mods/${name}/main.js`)) != null;
    cx.notify();
  });
}

// Something opens it: the mod itself, or its fallback.
export const canOpen = (name) => installed[name] !== false || name in FALLBACK;

export function openMod(name) {
  if (installed[name] !== false) run("mod.open", { name });
  else if (FALLBACK[name]) run(...FALLBACK[name]);
}
