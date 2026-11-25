# Changelog

Tuuxic's releases, newest first. Each entry is one layout version; the mods it ships are
listed at their own versions (semver as [ADR 0002](docs/adr/0002-the-layout-version-covers-every-mod-it-ships.md)
sets out). Agents relay these entries when they update tuuxic ([RECIPE.md](RECIPE.md#update))
and follow each entry's **Upgrading** notes in order.

## v1.0.0 (2026-11-25)

The first versioned release. Whistle is no longer bundled: tuuxic targets whistle
`>=2.0.0 <3.0.0`, installed from [Tuuxic/herdr-whistle](https://github.com/Tuuxic/herdr-whistle).

### Upgrading

From a pre-1.0 tuuxic (`layouts/tuuxic.json` present, `mods/tuuxic-layout/` absent), in this
order:

1. **Replace the keynav mods first** (tuuxic-agents, tuuxic-changes, tuuxic-chrome,
   tuuxic-files, tuuxic-spaces, tuuxic-tabs), before whistle 2.0 arrives: they now carry
   keynav v3, which whistle 2.0 requires. This answers whistle's Update note to fetch them from
   herdr.dev; don't fetch them there.
2. **Add `mods/tuuxic-layout/`** (breaking): it holds the release record. Replacing
   `layouts/tuuxic.json` turns the old `statusbar-work` and `statusbar` whistle blocks into
   `whistle-anchor`, `tuuxic-whistle`, `tuuxic-whistle-full`, `tuuxic-whistle-corner` and
   `whistle-corner`.
3. **keys.json** (breaking): remove `"ctrl-[": "whistle.enter"` from `terminal`, and
   `ctrl-space` from `layout:tuuxic`. The other whistle lines are whistle's to update in the
   next step.
4. **Whistle** (breaking): take the bundled `mods/whistle` through whistle's Update to the
   newest `v*` tag inside the range. If the person declines, delete `mods/whistle/`, its
   blocks (`whistle-anchor`, `whistle-corner`; hide `tuuxic-whistle` and
   `tuuxic-whistle-full`) and every `whistle.*` binding in keys.json.
5. In `whistle-integration.md`, delete the clones and rows that cover tuuxic's layout or
   mods: tuuxic's layout is already integrated.
6. **Saved settings** under renamed keys move by themselves: each mod reads the old key once
   when the new one is missing, writes the new key and drops the old. This migration code is
   removed in 2.0.0.

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

- **Whistle is a separate install** (breaking): tuuxic no longer ships `mods/whistle`.
  Install offers whistle 2.x by default; without it the keyboard mode is gone and the rest
  works.
- tuuxic-bar draws whistle's bar and hints box (the TYPE/WHISTLE badge, "Whistle off", the
  focused field, whistle's problems, the hints box and corner hints), keeping tuuxic's key
  sequence in the bar, the clickable badge and the filled green TYPE badge.
- tuuxic-bar: `Terminal · <title>` no longer shows as `Terminal Â·`.
- tuuxic-spaces and tuuxic-agents: in the keyboard mode, Enter goes to the item and switches
  to typing; Space shows it and stays in the keyboard mode.
- tuuxic-tabs: `x` closes the selected tab in the keyboard mode.
- Whistle mappings: `c` / `C` go to and show or hide Changes (replacing `g` / `G`); `s` / `a`
  are gone, use Alt+S / Alt+A.
- tuuxic-settings: Settings → Keyboard says when whistle is missing, not running, from an
  older tuuxic, out of range or not in the layout; adds a hints on/off switch and the bar
  position (under the terminals, full width, hidden), also in the palette; Open runs
  whistle-ui's settings.
- tuuxic-changes: the git graph's own update check is gone.
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
