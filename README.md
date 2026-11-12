# Tuuxic

A layout and a set of mods for [Herdr](https://herdr.dev): a sidebar with spaces and agents,
a tab strip, framed panes, Files and Changes side panels, a command palette and picker, and
themes. Keyboard driving comes from [whistle](https://github.com/Tuuxic/herdr-whistle), a
separate mod.

## Install

1. Install [herdr-whistle](https://github.com/Tuuxic/herdr-whistle) into
   `~/.config/herdr-app/mods/whistle/`. The layout's status bar is whistle; without it that
   bar stays empty.
2. Copy `layouts/`, `mods/` and `themes/` into `~/.config/herdr-app/`.
3. Merge `keys.json` (its `layout:tuuxic` section) into `~/.config/herdr-app/keys.json`.
4. Switch to the layout: `herdr-app do layout.switch tuuxic`, or pick Tuuxic in Herdr.

## Mods

Every mod works on its own. Keyboard selection (a glowing field, a cursor) turns on when a
keynav driver such as whistle is installed; each mod carries a copy of `keynav.js` for that.
Buttons that open another tuuxic mod open Herdr's own screen when that mod is missing.

| Mod | What it is |
|---|---|
| tuuxic-agents | Agents grouped by status or by priority; sub-agents fold under their parent |
| tuuxic-ai-usage | AI usage meters for the top bar |
| tuuxic-bar | The top bar: palette, sidebar toggle, spaces, search, window buttons |
| tuuxic-changes | Git changes with diffs, commit and branch, and a git graph |
| tuuxic-chrome | The sidebar's header and its footer menu (Settings, Keybindings, Mods) |
| tuuxic-files | A file browser for the focused pane's folder, with read-only previews |
| tuuxic-icons | The icons the other mods draw (assets only) |
| tuuxic-keys | Every key binding, grouped by where it works |
| tuuxic-mod-manager | Installed mods and the community index in one panel |
| tuuxic-notes | Notes for the herdr-browser page being annotated |
| tuuxic-pane | The header on each framed pane |
| tuuxic-palette | The command palette |
| tuuxic-picker | Go to a tab or space |
| tuuxic-settings | Look, machines, alerts and updates |
| tuuxic-spaces | Spaces with colored avatars, agent states and worktrees |
| tuuxic-tabs | The tab strip |
| tuuxic-themes | A full-screen theme switcher |

## Before you install

- **tuuxic-ai-usage** reads your local Claude, ChatGPT and Copilot login tokens to show their
  usage limits, and calls those providers' usage endpoints with them. Leave the mod out if
  you don't want that.
- tuuxic-mod-manager calls api.github.com; the browser pane and notes talk to herdr-browser
  on 127.0.0.1.
- The terminal font is CaskaydiaMono Nerd Font; install it or change `font` in the layout.

## License

MIT (`LICENSE`). The themes in `themes/` and the git graph in tuuxic-changes
([herdr-git-graph](https://github.com/rabeeh-ta/herdr-git-graph)) come with their own MIT
notices: `themes/LICENSE` and `mods/tuuxic-changes/graph/LICENSE`. How it's built is
described in `RECIPE.md`.
