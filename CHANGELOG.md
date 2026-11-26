# Changelog

Tuuxic's releases, newest first. Each entry is one layout version; the mods it ships are
listed at their own versions (semver as [ADR 0002](docs/adr/0002-the-layout-version-covers-every-mod-it-ships.md)
sets out). Agents relay these entries when they update tuuxic ([RECIPE.md](RECIPE.md#update))
and follow each entry's **Upgrading** notes in order.

## v1.0.0 (2026-11-25)

### Upgrading

The first versioned release. Whistle is no longer bundled: tuuxic targets whistle
`>=2.0.0 <3.0.0`, installed from [Tuuxic/herdr-whistle](https://github.com/Tuuxic/herdr-whistle).

From a pre-1.0 tuuxic (`layouts/tuuxic.json` without `mods/tuuxic-layout/`): follow
[RECIPE.md](RECIPE.md)'s Uninstall, then Install.

### Mods

- tuuxic-agents 1.0.0
- tuuxic-ai-usage 1.0.0
- tuuxic-bar 1.0.0
- tuuxic-changes 1.0.0
- tuuxic-chrome 1.0.0
- tuuxic-files 1.0.0
- tuuxic-icons 1.0.0
- tuuxic-keys 1.0.0
- tuuxic-mod-manager 1.0.0
- tuuxic-notes 1.0.0
- tuuxic-palette 1.0.0
- tuuxic-pane 1.0.0
- tuuxic-picker 1.0.0
- tuuxic-settings 1.0.0
- tuuxic-spaces 1.0.0
- tuuxic-tabs 1.0.0
- tuuxic-themes 1.0.0

### You

- **Whistle is a separate install**: tuuxic no longer ships `mods/whistle`.
  Install offers whistle 2.x by default, switched on (`ctrl-space` goes into the keyboard
  mode); without it the keyboard mode is gone and the rest works.
- tuuxic-bar draws whistle's bar and hints box (the TYPE/WHISTLE badge, "Whistle off", the
  focused field, whistle's problems, the hints box and corner hints), keeping tuuxic's key
  sequence in the bar, the clickable badge and the filled green TYPE badge.
- tuuxic-bar: `Terminal · <title>` no longer shows as `Terminal Â·`.
- tuuxic-spaces and tuuxic-agents: in the keyboard mode, Enter goes to the item and switches
  to typing; Space shows it and stays in the keyboard mode.
- tuuxic-tabs: `x` closes the selected tab in the keyboard mode.
- tuuxic-agents, tuuxic-pane, tuuxic-picker, tuuxic-settings, tuuxic-spaces: a blocked agent
  shows as "Blocked", not "Needs you".
- tuuxic-picker: a finished agent shows as "done", not "finished".
- tuuxic-tabs: the tab tooltip says "Blocked" / "blocked", not "Needs input" / "needs input".
- Whistle mappings: `c` / `C` go to and show or hide Changes (replacing `g` / `G`); `s` / `a`
  are gone, use Alt+S / Alt+A.
- tuuxic-settings: Settings → Keyboard says when whistle is missing, not running, out of
  range or not in the layout; adds a hints on/off switch (kept across restarts) and the bar
  position (under the terminals, full width, hidden), also in the palette; Open runs
  whistle-ui's settings.
- tuuxic-changes: the git graph's own update check is gone.
- keys.json: tuuxic's `layout:tuuxic` section holds only tuuxic's own keys (palette, picker,
  settings, mods, keys, themes, top bar, new terminal, reopen tab); tabs, spaces, panes,
  splits and copy/paste use Herdr's own keys.
- tuuxic-spaces and tuuxic-agents: in the keyboard mode, `j` / `k` skip the rows of a folded
  machine or group, and Enter or Space on a space that closed or an agent that exited does
  nothing.
- tuuxic-settings: the Whistle mode switch goes back to whistle's state when whistle can't
  switch, and a whistle version it can't read is named as such.
- tuuxic-ai-usage: names every login file it reads and every endpoint it calls
  ([docs/mods.md](docs/mods.md#tuuxic-ai-usage)); no change in what it does.

### Authors

- Every mod has a version in its `mod.json`; `mods/tuuxic-layout/mod.json` holds the layout
  version, the minimum Herdr and the whistle range (`release.js` exports the same).
- The six keynav mods speak keynav v3 (whistle v2.0.0's `keynav.js`): `open` is now `pick`.
- tuuxic-settings and tuuxic-pane read whistle through whistle's `whistle.js`
  (`readWhistle()`); the commands they run are `whistle.switch-mode`, `whistle.mode:type` and
  `whistle-ui.settings`.
- Each mod's commands, block props, shared keys and saved settings: [docs/mods.md](docs/mods.md).
