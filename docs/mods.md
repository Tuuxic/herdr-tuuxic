# Tuuxic's mods

What each `tuuxic-*` mod in this repo does, and the contract it keeps: block props, commands, shared keys, saved settings and keynav. A mod's version lives in its `mod.json` and the [CHANGELOG](../CHANGELOG.md), not here.

- [tuuxic-agents](#tuuxic-agents)
- [tuuxic-ai-usage](#tuuxic-ai-usage)
- [tuuxic-bar](#tuuxic-bar)
- [tuuxic-changes](#tuuxic-changes)
- [tuuxic-chrome](#tuuxic-chrome)
- [tuuxic-files](#tuuxic-files)
- [tuuxic-icons](#tuuxic-icons)
- [tuuxic-keys](#tuuxic-keys)
- [tuuxic-layout](#tuuxic-layout)
- [tuuxic-mod-manager](#tuuxic-mod-manager)
- [tuuxic-notes](#tuuxic-notes)
- [tuuxic-palette](#tuuxic-palette)
- [tuuxic-pane](#tuuxic-pane)
- [tuuxic-picker](#tuuxic-picker)
- [tuuxic-settings](#tuuxic-settings)
- [tuuxic-spaces](#tuuxic-spaces)
- [tuuxic-tabs](#tuuxic-tabs)
- [tuuxic-themes](#tuuxic-themes)

**Keynav field** means the mod copies whistle's `keynav.js` (keynav v3) and announces itself as a field that a keyboard driver such as whistle can select and drive. Every field takes the commands `keynav-up`, `-down`, `-left`, `-right`, `-pick`, plus `keynav-key-<key>` for each key it declares, and writes `shared("keynav.field:<field key>")` and `shared("keynav.request:<field key>")`. Without a driver nothing is ever active and the mod works as it always does.

**Shared keys** are Herdr's `shared()`/`setShared()` values, which every mod can read. **Saved settings** are what a mod keeps across restarts in its own `localStorage` or in Herdr's `settings.json`.

## tuuxic-agents

The agents list in the sidebar: agents grouped or in priority order, parents taking their most urgent sub-agent's place. A viewed done agent stays in Done until you leave it. Cloned from Herdr's `agents` mod.

| | |
|---|---|
| Helpers | [tuuxic-icons](#tuuxic-icons) |
| Block props | none in a block; `overlay`, `sortMenu` for its own sort-menu overlay |
| Commands | the keynav commands |
| Shared keys | reads/writes `agents.sort`, `sidebar.width`, `sidebar.collapsed` |
| Saved settings | `localStorage`: `pins`, `changed` |
| Keynav field | yes, "Agents". j/k move over the agents in the order shown. **Pick and Show:** Enter goes to the agent and switches whistle to TYPE (`whistle.mode:type`, only when `shared("whistle")` exists) and returns keys to the terminal (`toTerminal`); Space shows the agent and stays in WHISTLE. Both keys are declared. |
| Licence notices | `LICENSE-APACHE` and `NOTICE` (Herdr's Apache-2.0 code) |

## tuuxic-ai-usage

The AI usage meter: for the agents in view, how much of each plan's usage window is spent, with the reset time. It refreshes every 5 minutes.

| | |
|---|---|
| Helpers | none |
| Block props | `compact` (one line, as in the top bar), `border`; `overlay`, `below`, `height` for its own popup |
| Commands | none |
| Shared keys | writes `tuuxic-ai-usage.<source id>` (last check, windows, error) and `tuuxic-ai-usage.shown` |
| Saved settings | reads `claude_labels` in `settings.json` (`{ "~/.claude": "Work" }`) to name a Claude profile; reads `zoom` |
| Keynav field | no |

It is optional: the RECIPE asks before installing it, and on no drops its folder and the `ai-usage` block.

### What it reads and calls

Paths are under your home folder. It reads only the login of an agent that's in view.

| Agent | Login files it reads | Endpoint it calls |
|---|---|---|
| Claude Code | `.claude/.credentials.json`, `.claude-personal/.credentials.json`, or the `CLAUDE_CONFIG_DIR` folder's `.credentials.json`; `.claude.json` (or `<folder>/.claude.json`) for the organisation name | `https://api.anthropic.com/api/oauth/usage` |
| Codex (ChatGPT plan) | `.codex/auth.json` | `https://chatgpt.com/backend-api/wham/usage` |
| GitHub Copilot | `.config/github-copilot/oauth.json`, `hosts.json`, `apps.json` | `https://api.github.com/copilot_internal/user` |
| pi | `.pi/agent/auth.json`, `.pi/agent/settings.json` (default provider) | the endpoint of the provider pi uses (Anthropic, ChatGPT or Copilot, above) |
| opencode | `.local/share/opencode/auth.json`, `.config/opencode/opencode.json` (model) | the endpoint of the provider opencode uses (above) |

On Linux it also runs `sh` over `/proc/*/environ` to match each Herdr terminal (`HC_TERMINAL_ID`) to its `CLAUDE_CONFIG_DIR`. The tokens go only to the endpoint of the provider they belong to; nothing is written to disk.

## tuuxic-bar

The bars: the top bar's left and right parts, and whistle's bar and hints box (ADR 0004). It draws whistle's bar from whistle's public keys, so whistle-ui's own bar isn't needed in tuuxic.

| | |
|---|---|
| Helpers | none |
| Block props | `part: "left" \| "right"` (top bar); `whistle: "under" \| "full"` (whistle's bar under the terminals or full width); `corner: true` (hints box bottom right when no whistle bar shows); hints box placement on a whistle bar `hintsAlignRight`, `hintsAlignBorder`, `hintsGap` (px, gap default 6); `part: "hints"` with `width` is the hints overlay tuuxic-bar opens itself |
| Commands | none of its own; runs `space.select`, `layout.resize`, `whistle-ui.settings`, `mod.open` (tuuxic-palette, tuuxic-picker, tuuxic-settings), and without those mods `app.palette`, `app.settings`, `app.help` or the `picker` mod |
| Shared keys | reads `whistle`, `whistle.hints`, `whistle.events`, `whistle.config`, `keynav` and keynav field entries, `tuuxic.whistle-hints`; reads/writes `sidebar.width`, `sidebar.collapsed`, and its own `tuuxic-bar.seen` (seq of the last whistle event handled) and `tuuxic-bar.hints-overlay` (the open hints overlay's id) |
| Saved settings | reads `whistleHints` in `<appHome>/tuuxic.json` (the hints box switch) |
| Keynav field | no |

Whistle's bar shows the TYPE/WHISTLE badge (filled green TYPE), "Whistle off", `Terminal` / `Terminal · <title>`, the active field's label, the running key sequence and group title, `⚠ N` config problems, and the hints box. The badge opens `whistle-ui.settings`, or Settings → Keyboard when whistle-ui is missing. Without whistle, `whistle` bars show one muted line ("Whistle isn't installed — hide whistle's bar in Settings → Keyboard", or `inert.problem` / "Whistle isn't running") and the corner draws nothing. Out of the whistle range it draws normally.

## tuuxic-changes

The Changes panel: changed files in the focused pane's repo, their diff, commit, and fetch/pull/push/stash buttons; plus the git graph, forked from an upstream git graph mod.

| | |
|---|---|
| Helpers | none (needs `git`) |
| Block props | `graph: "<block id>"` (the graph block it toggles to); `view: "graph"`, `back: "<block id>"` for the graph block; `role` for the graph's own menus and dialogs |
| Commands | the keynav commands |
| Shared keys | reads/writes `tuuxic-changes.list` (list height), `tuuxic-changes.wrap` |
| Saved settings | none |
| Keynav field | yes, "Changes". j/k move over the changed files; pick shows that file's diff. |
| Licence notices | `CHARMED-LICENSE.md` (icons); the graph's MIT `graph/LICENSE` and `graph/NOTICE`, which records the upstream version it was forked from; `graph/icons/LICENSE-lucide.txt` |

## tuuxic-chrome

The sidebar's frame: the brand header (Herdr logo, search, sidebar collapse) and the footer menu (Settings, Keybindings, Mods). Cloned from Herdr's `workspace-chrome` mod.

| | |
|---|---|
| Helpers | none |
| Block props | `footer: true` for the footer menu; none for the header |
| Commands | the keynav commands (footer only) |
| Shared keys | reads/writes `sidebar.width`, `sidebar.collapsed` |
| Saved settings | none |
| Keynav field | yes, the footer, "Menu". j/k move; pick opens the item. |
| Licence notices | `LICENSE-APACHE` and `NOTICE` (Herdr's Apache-2.0 code) |

Not offered as a single mod.

## tuuxic-files

The Files panel: a lazy file browser for the focused pane's folder, with git status and bounded read-only previews.

| | |
|---|---|
| Helpers | none (uses `git`, `sh` or PowerShell) |
| Block props | none |
| Commands | the keynav commands |
| Shared keys | none |
| Saved settings | reads `font_family` |
| Keynav field | yes, "Files". j/k move over the tree; pick or l opens a folder or file, h closes or goes back. |
| Licence notices | `CHARMED-LICENSE.md` (icons) |

## tuuxic-icons

The SVGs the other tuuxic mods draw (`mods/tuuxic-icons/<name>.svg`). Assets only: its view draws nothing and never shows.

| | |
|---|---|
| Helpers | none |
| Block props, commands, shared keys, saved settings | none |
| Keynav field | no |

A **helper**: it comes with tuuxic-agents, tuuxic-spaces and tuuxic-tabs as single mods, and is never offered alone.

## tuuxic-keys

The keybindings sheet: every key Herdr has, grouped by where it works. The shown layout's keys come first. Type to filter; Esc closes.

| | |
|---|---|
| Helpers | none |
| Block props | none (opens as an overlay, `mod.open:tuuxic-keys`) |
| Commands | none |
| Shared keys | reads `layout` |
| Saved settings | none |
| Keynav field | no |

## tuuxic-layout

The layout mod: it carries tuuxic's release record (ADR 0003). It has no block (its view draws nothing and never shows, `"place": "none"`), ships only with the layout, and is never offered alone.

| File | Holds |
|---|---|
| `mod.json` | `version`: the layout version; `herdr`: the minimum Herdr; `whistle`: the whistle range, `">=2.0.0 <3.0.0"` |
| `release.js` | the same three values, for code |
| `range.js` | a dependency-free check of a whistle version against the range |

The installing agent reads `mod.json`; other mods read it with `readTextFile`. Its presence also marks a 1.0 or later install: `layouts/tuuxic.json` without `mods/tuuxic-layout/` is pre-1.0.

## tuuxic-mod-manager

Herdr app mods from one panel: what is installed, the Community index (GitHub topic `herdr-mod`), install with a review of what each mod does, update, remove, and hand a mod to an agent to change. A port of speardragon's herdr-plugin-manager (MIT).

| | |
|---|---|
| Helpers | none (uses `git`) |
| Block props | none (opens as an overlay, `mod.open:tuuxic-mod-manager`); `review`, `start` for its own overlays |
| Commands | none |
| Shared keys | reads/writes `mod-manager.installed` (install records) |
| Saved settings | none |
| Keynav field | no |

It calls `https://api.github.com/search/repositories` for the index and clones mods from GitHub.

## tuuxic-notes

The browser notes panel: the notes of the herdr-browser page being annotated, in the layout's right-hand stack. A composer for a pick, numbered notes with screenshots, and Send to agent / Copy.

| | |
|---|---|
| Helpers | needs herdr-browser (named, not installed) |
| Block props | none |
| Commands | none |
| Shared keys | reads `browser.notes` (the terminal showing the page) |
| Saved settings | none |
| Keynav field | no |

It talks to herdr-browser at `http://127.0.0.1:<port>/api/do`.

## tuuxic-palette

The command palette: everything you can do, by name, with its key. Fuzzy search; empty shows recent first, then every group. Choices are entries of their own ("Layout: Zen"); commands that need a name ask for it.

| | |
|---|---|
| Helpers | none |
| Block props | none (opens as an overlay, `mod.open:tuuxic-palette`) |
| Commands | none of its own; runs the chosen command |
| Shared keys | reads `layout` |
| Saved settings | `localStorage`: `recent` |
| Keynav field | no |

## tuuxic-pane

The pane header, for layouts that frame their panes: program icon, agent name or terminal title, folder, agent status, and split/zoom/close buttons. A pane showing a herdr-browser page gets the browser's toolbar instead (back, forward, reload, address, zoom, Annotate, open in browser). Cloned from Herdr's `pane` mod.

| | |
|---|---|
| Helpers | none; its browser toolbar needs herdr-browser (named, not installed) |
| Block props | `pane`, `terminal` (set by Herdr for a pane header) |
| Commands | none |
| Shared keys | reads `whistle` (via its copy of whistle's `whistle.js`): it marks its pane when `mode === "whistle"`, `onTerminal` and `pane` is its own; reads/writes `browser.notes` while annotating |
| Saved settings | none |
| Keynav field | no |
| Licence notices | `LICENSE-APACHE` and `NOTICE` (Herdr's Apache-2.0 code); `browser/LICENSE` for the herdr-browser client |

## tuuxic-picker

Herdr's picker in the palette's look: go to a tab. Spaces with something blocked come first; quiet spaces fold into "earlier". Last rows open new work: a tab here, a space on this computer or on a connected machine. ctrl+d closes a tab.

| | |
|---|---|
| Helpers | none |
| Block props | none (opens as an overlay, `mod.open:tuuxic-picker`) |
| Commands | none |
| Shared keys | reads/writes `space.colors` (shared with tuuxic-spaces) |
| Saved settings | none |
| Keynav field | no |

## tuuxic-settings

Herdr's settings in one dialog: Look, Keyboard, Machines, Alerts, Updates, Privacy. Changes are written to `settings.json` at once, with no Save step.

| | |
|---|---|
| Helpers | none |
| Block props | `section` (which section to open on) |
| Commands | none of its own; runs `whistle.on` / `whistle.off`, `whistle-ui.settings`, `layout.show` / `layout.hide` |
| Shared keys | reads `whistle` (via its copy of whistle's `whistle.js`: `readWhistle()?.enabled`, `inert`) |
| Saved settings | writes Herdr's `settings.json`; stores the hints box on/off switch as `whistleHints` in `<appHome>/tuuxic.json` |
| Keynav field | no |

**Settings → Keyboard** holds the Whistle mode switch, whose row says what state whistle is in (running, out of range, inert, not running, not in this layout, a pre-1.0 copy, not installed); **Open**, which runs `whistle-ui.settings` and shows only when `mods/whistle-ui/mod.json` exists; the hints on/off switch, offered when whistle is installed; and the whistle bar control (Under the terminals / Full width / Hidden), which shows or hides the `tuuxic-whistle` / `tuuxic-whistle-full` blocks and is also offered as command palette entries. Installed alone, the row leaves out the range note, the pre-1.0 line and the layout check.

## tuuxic-spaces

The spaces list in the sidebar: stable coloured avatars, worktrees under their checkout, grouped by machine when more than one is known, with the repo's branch and ahead/behind where unusual. Click to switch, right-click for its menu, drag to reorder. Cloned from Herdr's `spaces` mod.

| | |
|---|---|
| Helpers | [tuuxic-icons](#tuuxic-icons) (uses `git`, `hc`) |
| Block props | none |
| Commands | the keynav commands |
| Shared keys | reads/writes `space.colors` |
| Saved settings | `localStorage`: `machines.folded`, `machines.reconnecting` |
| Keynav field | yes, "Spaces". j/k move over the spaces. **Pick and Show:** Enter goes to the space and switches whistle to TYPE (`whistle.mode:type`, only when `shared("whistle")` exists); Space shows the space and stays in WHISTLE. Both keys are declared; it keeps keys in the list (`keepKeys`). |
| Licence notices | `LICENSE-APACHE` and `NOTICE` (Herdr's Apache-2.0 code) |

## tuuxic-tabs

The tab strip: Herdr's tab bar with wider names that name themselves after what runs in them, Files/Changes panel buttons, and reopen of the last closed tab. Cloned from Herdr's `tabs` mod.

| | |
|---|---|
| Helpers | [tuuxic-icons](#tuuxic-icons) (reopen uses `python3`) |
| Block props | `pane` for its per-pane use; none in the layout |
| Commands | `tuuxic-tabs.reopen` (bound to ctrl-alt-shift-t); the keynav commands |
| Shared keys | reads/writes `tuuxic-tabs.closed` (the last 10 closed tabs), `tab-titles.set`, `tab-titles.omp`; reads `workspace.panels` |
| Saved settings | `localStorage`: `panels` |
| Keynav field | yes, "Tabs". Left/right move over the tabs; pick goes to the tab. Declares `x` "Close tab" and keeps keys in the strip (`keepKeys`). |
| Licence notices | `LICENSE-APACHE` and `NOTICE` (Herdr's Apache-2.0 code) |

## tuuxic-themes

The theme switcher, as in Omarchy 4: full screen, each theme's desktop preview, the chosen one large in the middle. ←/→ move, Enter applies, Esc closes.

| | |
|---|---|
| Helpers | none |
| Block props | none (opens as an overlay, `mod.open:tuuxic-themes`) |
| Commands | none |
| Shared keys | none |
| Saved settings | sets the theme; writes `appearance` in Herdr's `settings.json` |
| Keynav field | no |

The themes themselves live in `themes/` and are copied by the RECIPE's Install; theme files carry no version.
