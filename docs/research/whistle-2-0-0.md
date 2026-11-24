# What whistle 2.0.0 changes for tuuxic

Ticket: [#15](https://github.com/Tuuxic/herdr-tuuxic/issues/15). Redoes the 1.x audit in
[#3](https://github.com/Tuuxic/herdr-tuuxic/issues/3) against whistle **v2.0.0** (tag
`v2.0.0`, commit `e6e305c`, released 2026-11-21) and the 1.3.0 change before it, and re-checks
the decisions on [#5](https://github.com/Tuuxic/herdr-tuuxic/issues/5),
[#6](https://github.com/Tuuxic/herdr-tuuxic/issues/6) and
[#10](https://github.com/Tuuxic/herdr-tuuxic/issues/10).

Sources: a shallow clone of Tuuxic/herdr-whistle at `v2.0.0` (paths below are relative to that
repo, prefixed `hw:`), plus `mods/whistle/keynav.js`, `mods/whistle/views.js` fetched at
`v1.1.0`/`v1.3.0` for comparison, and tuuxic's `main` at `e80661d` (prefixed `tx:`).
Nothing was run in Herdr; claims marked *inferred* come from reading source, not from a run.

## The short answer

Whistle 2.0.0 splits whistle into **whistle** (runs in a 0 px anchor block, draws nothing,
publishes facts) and **whistle-ui** (a separate mod that draws the bar, hints box and settings
dialog). For tuuxic this means:

1. The three-whistle-block plan from #10 (`whistle-anchor`, `whistle-bar`, `whistle-bar-full`,
   all `"mod": "whistle"`) is **broken**: every whistle block is now the anchor. Only one may be
   `whistle`; the bars become **whistle-ui** blocks, which take the `hints*` props, and tuuxic
   adds whistle-ui's 0 px **corner block**.
2. Four command names tuuxic uses are **gone**: `whistle.whistle`, `whistle.type`,
   `whistle.settings` (and `whistle.enter`, gone since 1.0). Replacements:
   `whistle.switch-mode`, `whistle.mode:type`, `whistle-ui.settings`.
3. **`readWhistle()` is no longer null while whistle is inert.** It returns the state with
   `inert: { problem, fix }`. #6's "readWhistle() is null while inert or missing" no longer
   holds; the Keyboard row reads `inert` instead.
4. **The bar control is a layout show/hide**, not a whistle.json write. Since 1.3.0 whistle never
   shows or hides spots, and 2.0.0 ignores whistle.json's `bar`. #6's "bar control writes
   whistle.json's `bar`" and the need for #14 are both obsolete.
5. Keynav v3 is **unchanged** since 1.1.0 (byte-identical `keynav.js`), so the planned port
   stands; 2.0.0 only stops driving v2 fields. Pick into TYPE runs `whistle.mode:type`, not
   `whistle.type`.
6. Whistle's RECIPE **still** clones tuuxic-pane and edits `layouts/tuuxic.json` during
   Integrate (header step has no "already reads whistle" skip), and Install step 7 now also
   adds whistle-ui's bar/corner blocks to a layout missing any of them.

## Per touch point

### 1. Keynav: the six keynav mods, `open` → `pick`

| | |
|---|---|
| tuuxic today | All six (`tx:mods/tuuxic-{agents,changes,chrome,files,spaces,tabs}/keynav.js`) are **keynav v1** (`shared("keynav.fields")`, `{ v: 1 }`, moves incl. `open` and `key-<c>`; `tx:mods/tuuxic-tabs/keynav.js:1-14`). |
| 2.0.0 | Drives **v3 only**. v2 and v1 entries are not fields and settings no longer name them (`hw:CHANGELOG.md:18-21, 127-132`). |
| Keynav v3 itself | Unchanged since 1.1.0: `hw:mods/whistle/keynav.js` equals v1.1.0's byte for byte (compared with `diff --strip-trailing-cr`). Moves `up/down/left/right/pick`, declared keys as `keynav-key-<key>`, requests `{ after: "terminal" \| "hold", at }` (`hw:docs/contracts/keynav.md:52-71`). |
| Verdict | **Kept**: #3's amended port (copy whistle's `keynav.js`, `open` → `pick`, `toTerminal`/`keepKeys`, tuuxic-tabs declares `{ x: "Close tab" }`) is exactly what 2.0.0 asks. **Changed detail**: Pick into TYPE on spaces/agents runs `whistle.mode:type` (was `whistle.type` in the 1.1 RECIPE), guarded by `if (shared("whistle"))` (`hw:RECIPE.md` Pick and Show, the `agent.focus` snippet). An unguarded run without whistle shows Herdr's "unknown command" toast. |

### 2. tuuxic-settings and tuuxic-pane reading whistle's state

| | |
|---|---|
| tuuxic-settings today | Reads `shared("whistle.enabled")` (`tx:mods/tuuxic-settings/main.js:153`), runs `whistle.on`/`whistle.off` (`:144`) and `whistle.settings` (`:148`). Detects whistle by `mods/whistle/main.js` existing (`:54`). |
| tuuxic-pane today | Reads `shared("keynav").active === "terminal"` and `.pane` (`tx:mods/tuuxic-pane/main.js:19`), keynav v1's terminal marker. |
| 2.0.0 state | `shared("whistle") = { v: 1, mode, enabled, sequence, pane, onTerminal, field, inert }` (`hw:docs/contracts/state.md:20-31`). Still `v: 1`; `field` and `inert` were added under v1 in 2.0.0 (`hw:CHANGELOG.md:111-115`). `readWhistle()` in a copied `whistle.js` reads it (`hw:mods/whistle/whistle.js:25-32`). |
| `enabled` | **Kept.** `whistle.on`/`whistle.off` **kept** (`hw:docs/contracts/commands.md:42-43`). `whistle.enabled` (the key) gone since 1.0. |
| `onTerminal` | **Kept**; the header rule is still `mode === "whistle" && onTerminal && pane === <pane>` (`hw:RECIPE.md`, The selected terminal's header, step 3; `hw:docs/contracts/state.md` rule 6). |
| `field` (new) | The selected field's block id in WHISTLE (terminal's, keynav field's or stock field's), `null` in TYPE (`state.md` rule 7). Offers tuuxic a way to name a stock field (e.g. `spaces`) without reading keynav. Not needed by tuuxic-pane. |
| `inert` (new) | `{ problem, fix }` while no copy runs (Herdr too old, or whistle blocks with the same props), else `null`. The copy that would run **writes the state once with `inert`** and raises `whistle-inert` (`state.md` rule 8, lines 266-273). |
| **Breaks #6** | 1.x: `readWhistle()` was `null` while inert. 2.0.0: it's a non-null state with `inert` set. `readWhistle()` is `null` only when whistle never published (not installed, not loaded yet) or `v` isn't 1 (`whistle.js:22-24`). The Keyboard row's "installed, not running" case should read `w?.inert` and can show `inert.problem` / `inert.fix` directly. |
| Stale state (*inferred*) | Whistle never clears `shared("whistle")`: no code path writes it `null` (only `setShared` via effects, `hw:mods/whistle/step.js:69-70`, `main.js:124`), and a layout without a whistle block "acts on nothing and publishes nothing" (`hw:docs/contracts/layout-block.md` rule 8). So after switching to a layout without the anchor, readers likely see the last state. Same caveat as #6's stale-cursor note; untested. |

### 3. The layout's whistle block

tuuxic `main` today: two `"mod": "whistle"` blocks: `statusbar-work` (26 px, `bar`,
`hintsLift/Inset/Border`) and hidden `statusbar` (`bar: "Full width"`, `enabled: false`,
`mappings`) (`tx:layouts/tuuxic.json:281-300, 307-390`). #10 planned three whistle blocks:
`whistle-anchor` (mappings, enabled), `whistle-bar` and `whistle-bar-full` (bar + `hints*`).

| Item | 2.0.0 |
|---|---|
| Whistle block props | Only `mappings`, `keys`, `mods`, `enabled`, `nav` (`hw:docs/contracts/layout-block.md:15-23`). `anchor`, `bar`, `hints`, `hintsAlignRight/Border/Gap` are unknown props, each a config problem (`hw:CHANGELOG.md:31-34, 64-71`). |
| Every whistle block is the anchor | Size it 0 px, never hide it (`layout-block.md` rule 5). The **first** whistle block runs; any other is left out and listed (rule 6); two with the **same props** make whistle inert with a notification (rule 7). No whistle block: whistle doesn't run (rule 8). |
| `mappings`, `enabled` | **Kept** on the anchor. #10's "mappings and enabled move to `whistle-anchor`" **stands**. |
| `whistle-bar`, `whistle-bar-full` | **Broken as whistle blocks.** As `"mod": "whistle"` they'd be second/third whistle blocks, left out and listed. They become **whistle-ui** blocks: `"content": { "mod": "whistle-ui", "props": {...} }` (`hw:docs/contracts/whistle-ui.md:11-17`). |
| `bar` prop ("Under the terminals" / "Full width") | **Gone.** whistle-ui has no spot names: a whistle-ui block is a bar unless `corner: true` (`whistle-ui.md:21-24`). Herdr tells a mod's blocks apart only by props, so the two bars need different props (e.g. different `hints*` values), or they'd be indistinguishable copies. |
| `hints*` props | **Moved to whistle-ui**, same names and meaning: `hintsAlignRight`, `hintsAlignBorder`, `hintsGap` (default 6), plus `hints: false` (`whistle-ui.md:26-32`). Geometry formula is identical to 1.3.0's (`hw:mods/whistle-ui/box.js:55-60` vs v1.3.0 `mods/whistle/views.js:107-112`), so #3's values (`hintsAlignRight: 6, hintsAlignBorder: 2, hintsGap: 11`) carry over unchanged on `whistle-bar` (*inferred* same placement; not run). |
| Lead bar | The first whistle-ui bar in layout order **that shows** docks the hints and opens settings; else the corner block (`whistle-ui.md:34-36`). |
| Corner block (new) | `{ "mod": "whistle-ui", "props": { "corner": true } }`, 0 px. Needed for hints when every bar is hidden: Herdr doesn't load a hidden block (`whistle-ui.md:35-36`, rule 6). tuuxic should add it, both for the "Hidden" choice and so whistle's Install doesn't add it (see 9). |
| `nav` | Unchanged; tuuxic sets none today. |
| tuuxic `main` as is under 2.0.0 (*inferred*) | `statusbar-work` runs whistle with 4 unknown props listed; `statusbar` is a second whistle block, so its `mappings` and `enabled: false` count for nothing (whistle ships **on**). The 26 px strip draws nothing. Main must not be paired with 2.0.0 unported. |

Suggested 1.0 shape (for #16 to settle, not decided here):

```json
{ "id": "whistle-anchor", "size": { "px": 0 }, "resizable": false, "content": { "mod": "whistle", "props": { "enabled": false, "mappings": { … } } } },
{ "id": "whistle-bar", "size": { "px": 26 }, "border": { "width": 2, "color": "border" }, "content": { "mod": "whistle-ui", "props": { "hintsAlignRight": 6, "hintsAlignBorder": 2, "hintsGap": 11 } } },
{ "id": "whistle-bar-full", "hidden": true, "size": { "px": 22 }, "content": { "mod": "whistle-ui", "props": { "hintsGap": 6 } } },
{ "id": "whistle-corner", "size": { "px": 0 }, "resizable": false, "content": { "mod": "whistle-ui", "props": { "corner": true } } }
```

### 4. Mappings and keys.json

| Item | 2.0.0 |
|---|---|
| `whistle.whistle` | **Gone** → `whistle.switch-mode`. Unknown command, keys.json line listed as config problem, does nothing (`hw:CHANGELOG.md:11-17`; `commands.md:39`). tuuxic `main` uses it in `global` and `layout:tuuxic` `ctrl-space` (`tx:keys.json:3, 12`). The `layout:tuuxic` line would also shadow whistle's global switch key in tuuxic's layout. |
| `whistle.type` | **Gone** → `whistle.mode:type` (`commands.md:40`). tuuxic `main`: `mod:whistle` `ctrl-space` (`tx:keys.json:9`). |
| `whistle.mode:whistle` (new) | Goes to WHISTLE and stays (`commands.md:41`, rule 11). |
| `whistle.enter` | Gone since 1.0. tuuxic `main`: `terminal` `ctrl-[` (`tx:keys.json:6`). |
| `whistle.settings` | **Gone** → `whistle-ui.settings` on `alt-,`, from `hw:mods/whistle-ui/keys.json` (`CHANGELOG.md:35-37, 116-117`). |
| Whistle's own keys.json | `global`: `ctrl-space` → `whistle.switch-mode`, `alt-a` → `whistle.focus:agents`, `alt-s` → `whistle.focus:spaces`; `mod:whistle`: `ctrl-space` → `whistle.mode:type` (`hw:keys.json`). whistle-ui's: `global` `alt-,` → `whistle-ui.settings`. |
| Verbs | `whistle.field|focus|toggle|toggle-keep-mode:<block>` **unchanged** (`commands.md:57-60`). |
| #10 decisions | **Kept, and now required**: tuuxic ships no whistle lines in keys.json; every whistle line in `main`'s keys.json names a dead command. #10's mappings (`c`/`C` → `whistle.focus/toggle:changes`, `e`/`E`, `/ p , ? m` → `mod.open:tuuxic-*`) run no renamed command, so they stand. `c`, `e`, `C`, `E` are still unmapped in whistle's defaults; `/ p ? ,` still override defaults on purpose (`hw:mods/whistle/mappings.json`). The layout's `keys` prop: any `open` → `pick` (`CHANGELOG.md:22-24`); tuuxic sets none. |

### 5. Bar control and Settings → Keyboard's Whistle mode row

| #6 decision | 2.0.0 |
|---|---|
| Bar control writes whistle.json's `bar` (because whistle re-shows the `bar` spot every tick) | **Broken.** 1.3.0: "whistle never shows or hides spots, so a layout's own control (`layout.show` / `layout.hide` on a spot's block) is the way to switch spots; Herdr remembers which shows" (`hw:CHANGELOG.md:147-158`). 2.0.0: whistle ignores `bar` (`:25-26, 58`). The control should `layout.show`/`layout.hide` the whistle-ui bar blocks (`whistle-bar`, `whistle-bar-full`). **Hidden** = hide both; hints then come from the corner block. [#14](https://github.com/Tuuxic/herdr-tuuxic/issues/14) (whistle.json's `bar` says hidden) is moot. |
| Offered whenever whistle is installed | Now it's whistle-**ui** that has bars; offer it when whistle-ui is installed (and its blocks are in the layout). |
| Whistle mode switch | `readWhistle()?.enabled` + `whistle.on`/`whistle.off`: **kept**. |
| "Open" (whistle settings) | `whistle.settings` **gone**. Run `whistle-ui.settings` (it goes to TYPE first, then opens its dialog: `whistle-ui.md` rule 8), only when whistle-ui is installed. Alternative: tuuxic draws its own settings from `whistle.config` + the settings commands (see 8). |
| "installed, not running" → "Not running" + Herdr minimum | **Changed**: show `w.inert.problem` and `w.inert.fix` when `w?.inert` is set; whistle wrote them for any mod to show (`state.md:266-273`). Whistle also posts the Herdr notification itself (`layout-block.md` rule 7; `CHANGELOG.md` 1.2.0 You). `readWhistle() === null` with whistle installed now means "not loaded / no anchor in the shown layout (yet)". |
| "Whistle off in this layout" goes away; off = no anchor | **Kept**; 2.0.0 rule 8: no whistle block → whistle doesn't run. |
| Shipped switched off: bar text | whistle-ui's bar says "Whistle off" with no badge (`whistle-ui.md` rule 2). tuuxic's RECIPE/README "shows only what has the keyboard" is stale. |

### 6. Detection of whistle, its version, and whistle-ui

| | |
|---|---|
| whistle | `mods/whistle/mod.json`: `{ "title": "Whistle", "version": "2.0.0", "herdr": "0.1.15", "size": 0, … }`. `version.js` exports the same (`hw:mods/whistle/version.js`). #6's rule (missing file = not installed; no `version` = pre-1.0 copy) **holds**. tuuxic's bundled copy on `main` has no `version` (`tx:mods/whistle/mod.json`): pre-1.0. `mods/whistle/main.js` still exists, so tuuxic-settings' presence check still works. |
| whistle-ui | `mods/whistle-ui/mod.json`: `{ "title": "Whistle UI", "version": "2.0.0", "herdr": "0.1.15", "size": 22 }`. Its only shared keys are private (`whistle-ui.overlay:<name>`, `whistle-ui.seen`: `whistle-ui.md:232-237`), so detect it by the file, not at runtime. Whistle's own RECIPE recognizes it by `"title": "Whistle UI"`. |
| Range | #5/#6's `">=2.0.0 <3.0.0"` fits: every 2.0.0 break above is semver-major. |

### 7. whistle-ui

- **What**: a separate mod shipped in the same repo, `mods/whistle-ui/`: bar, hints box,
  settings dialog. A pure client: reads the four public keys, runs public commands, claims no
  keys, reads no whistle files (`whistle-ui.md:1-9`; ADR 0006).
- **Install** (whistle's RECIPE, Install): copy `mods/whistle/` **and** `mods/whistle-ui/` (step
  4), merge both keys.json (step 5), `herdr-app check` both (step 6), and step 7 places three
  blocks in order: `whistle-anchor` (whistle, 0 px), `whistle-bar` (whistle-ui, 22 px),
  `whistle-corner` (whistle-ui, `corner: true`, 0 px). "If it already has these blocks, go on;
  if it has some, add the others." Update replaces `mods/whistle-ui/` like `mods/whistle/`;
  Uninstall removes every whistle and whistle-ui block from the person's layouts and deletes
  both folders.
- **Blocks and props**: bar (default) or corner; `hints`, `hintsAlignRight`,
  `hintsAlignBorder`, `hintsGap` (`whistle-ui.md:19-36`).
- **Bar shows**: TYPE/WHISTLE badge; label `Terminal` (TYPE, terminal focused), `Terminal ·
  <pane>` / keynav label / stock name in WHISTLE; `⚠ n` problems; "Whistle off"; inert
  `problem`; "Whistle isn't running" with no state; 2 s flash per `problem`-group event
  (`whistle-ui.md` rules 1-4).
- **Settings dialog**: `whistle-ui.settings` → `whistle.mode:type`, then a 640 px dialog listing
  `whistle.config`; changes go through `whistle.mappings-on/-off` and `whistle.keep-mapping`
  (rule 8).
- **Replacing a part** (`whistle-ui.md:220-230`): own bar (drop whistle-ui bars, keep the corner
  for hints), own hints (`hints: false` on every whistle-ui block, draw `whistle.hints`), own
  settings (bind your own command, read `whistle.config`, run the settings commands), or drop
  whistle-ui entirely. Stable: the props, the corner block, `whistle-ui.settings`; looks may
  change any release.

### 8. New public keys and commands a tuuxic client could use

| Surface | What it gives | Use for tuuxic (options, not decisions) |
|---|---|---|
| `whistle.hints` / `readHints()` | `{ v: 1, keys, title, items: [{ key, label, group }], exit }` or `null` (`hw:docs/contracts/hints.md:17-27`) | Draw hints in tuuxic's own style instead of whistle-ui's box. |
| `whistle.events` / `readEvents(last, filter)` | Last 32 events `{ seq, kind, groups, text, …}`; kinds incl. `mode-switched`, `whistle-enabled/-disabled`, `whistle-inert/-active`, `field-selected`, `command-ran`, `command-failed`, `conflict-new` (`events.md:29-63`) | React to whistle being switched on/off or going inert without polling the state. |
| `whistle.config` / `readConfig()` | `{ v: 1, problems, mods, conflicts, overrides }` (`config.md:19-29`) | A problem count or list in Settings → Keyboard. |
| `whistle.subscribe:{"mod","groups","kinds"}` / `whistle.unsubscribe:<mod>` | Whistle runs `<mod>.whistle-event:<event>` for each passing event, only while the mod has a block that shows; per mod, outlives layout changes; unsubscribe in `close()` is the mod's job (`commands.md:117-125`, `events.md:84-117`) | Only mods with a block (e.g. tuuxic-bar). Overlays like tuuxic-settings have no block, so read the feed instead. |
| `whistle.mappings-on:<mod>` / `-off:<mod>` | Writes `"mods": { "<mod>": true/false }` into whistle.json (`commands.md:96-107`) | Only matters for mods offering mappings; tuuxic offers none (#10). |
| `whistle.keep-mapping:{"mod","keys"}` | Settles a conflict into whistle.json's `map` | Same: only with offered mappings. |
| `whistle.mode:whistle` | Enter WHISTLE without toggling | A tuuxic palette entry "Enter whistle mode". |

All readers come in the copied `whistle.js` (`hw:mods/whistle/whistle.js`). A tuuxic mod that
copies it gets all of them.

### 9. Does whistle's RECIPE still clone tuuxic-pane or edit `layouts/tuuxic.json`?

**Yes, both, unchanged from #3's finding**, plus one new Install edit:

- **Integrate, header step** (`hw:RECIPE.md`, The selected terminal's header, steps 1-2): finds
  the tab block's `content.pane.header.content.mod` (`tuuxic-pane` in `tx:layouts/tuuxic.json:189-191`),
  clones it if it's Herdr's or third-party ("when you can't tell, treat a mod as third-party"),
  and points `header.content.mod` in the layout file at the clone. There is still no rule to
  skip a header that already reads `readWhistle()`. The "Already fields" list covers keynav v3
  mods and whistle/whistle-ui blocks, not headers.
- **Integrate, layouts**: tuuxic's layout isn't Herdr's own, so it's "changed in place"
  (Simple path step 1), including pointing blocks at clones.
- **Install step 7 (new in 2.0.0 for whistle-ui)**: a shown layout that has some of
  anchor / whistle-ui bar / corner gets the others added. A tuuxic layout without the corner
  block would get one added in place. Including `whistle-corner` avoids that.
- **Uninstall**: removes every `whistle`/`whistle-ui` block from `layouts/*.json`, tuuxic's
  included (fine: matches #6's "installing without whistle removes the anchor").
- Once tuuxic's six mods are keynav v3, Integrate leaves them alone ("Already fields").

Options are as in #3: tuuxic's RECIPE says its layout is already integrated, and/or a
herdr-whistle issue for a header skip rule.

## Decisions on other tickets that 2.0.0 contradicts

Not edited here; listed for their owners.

| Ticket | Decision | 2.0.0 |
|---|---|---|
| #3 (amended) | Pick into TYPE runs `whistle.type` (via 1.1 RECIPE) | Runs `whistle.mode:type`. |
| #3 / #6 | `readWhistle()` is null while whistle is inert or missing | Null only when missing / not published; inert gives a state with `inert`. |
| #6 | Bar control writes whistle.json's `bar`; "Hidden" needs #14 | Bar control is `layout.show`/`layout.hide` on whistle-ui blocks; #14 is moot. (#6's own 2.0 note already says `bar` is ignored.) |
| #6 | Bar control offered when whistle is installed | Bars are whistle-ui's: offer when whistle-ui is installed. |
| #6 | Keyboard row "Open" | `whistle.settings` gone; `whistle-ui.settings` or tuuxic's own. |
| #10 (reopened) | `whistle-bar`, `whistle-bar-full` are whistle blocks with `bar` + `hints*` | They're whistle-ui blocks; `bar` prop gone; add the corner block. (#10's own 2.0 note defers this to #16.) |
| #5 | Range `">=2.0.0 <3.0.0"` | Holds. |
