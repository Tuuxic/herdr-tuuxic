# Tuuxic

A complete [Herdr](https://herdr.dev) workspace: spaces and agents at a glance, file and git
panels beside your terminals, and 26 themes.

The sidebar lists your spaces, each with its open tabs and how many of its agents are
working, blocked, done or idle, and every agent with its title, tab and space. Next to
the framed terminals, a side panel switches between a file browser and git changes with a
graph. A command palette, a picker and a theme switcher round it off.

It comes with [whistle](https://github.com/Tuuxic/herdr-whistle), a vim-inspired keyboard
mode, switched off: whistle's bar then only shows what has the keyboard. To try it, open
Settings → Keyboard → Whistle and turn it on.

## Install

1. Copy `layouts/`, `mods/` and `themes/` into `~/.config/herdr-app/`.
2. Merge `keys.json` into `~/.config/herdr-app/keys.json` (the `layout:tuuxic` section, and
   whistle's `global`, `terminal` and `mod:whistle` keys).
3. Switch to the layout: `herdr-app do layout.switch tuuxic`, or pick Tuuxic in Herdr.

## Mods

Every mod works on its own. Keyboard selection (a glowing field, a cursor) turns on while a
keynav driver such as whistle is on; each mod carries a copy of `keynav.js` for that.
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
| tuuxic-settings | Look, keyboard (whistle), machines, alerts and updates |
| tuuxic-spaces | Spaces with colored avatars, agent states and worktrees |
| tuuxic-tabs | The tab strip |
| tuuxic-themes | A full-screen theme switcher |
| whistle | Whistle's bar and the keyboard mode; a copy of [herdr-whistle](https://github.com/Tuuxic/herdr-whistle), off until you turn it on |

## Before you install

- **tuuxic-ai-usage** reads your local Claude, ChatGPT and Copilot login tokens to show their
  usage limits, and calls those providers' usage endpoints with them. Leave the mod out if
  you don't want that.
- tuuxic-mod-manager calls api.github.com; the browser pane and notes talk to herdr-browser
  on 127.0.0.1.
- The terminal font is CaskaydiaMono Nerd Font; install it or change `font` in the layout.

## License

MIT (`LICENSE`). Whistle, the themes in `themes/` and the git graph in tuuxic-changes
([herdr-git-graph](https://github.com/rabeeh-ta/herdr-git-graph)) come with their own MIT
notices: `mods/whistle/LICENSE`, `themes/LICENSE` and `mods/tuuxic-changes/graph/LICENSE`. How it's built is
described in `RECIPE.md`.
