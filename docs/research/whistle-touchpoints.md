# Every place tuuxic touches whistle, and what each becomes in 1.0

Research for [#3](https://github.com/Tuuxic/herdr-tuuxic/issues/3) (map: #1). Sources: tuuxic
at `main` (e80661d), and whistle v1.0.0 in Tuuxic/herdr-whistle (`docs/contracts/*.md`,
`CHANGELOG.md` v1.0.0, `docs/guide.md`, `RECIPE.md` Install/Integrate, ADRs 0015 and 0016,
`mods/whistle/{keynav,whistle,config,step,views,fields,claims}.js`, `mods/whistle/mappings.json`).
Citations are `file:line`; whistle files are prefixed `whistle:`.

## Summary

- **Every tuuxic field breaks under whistle 1.0.** The six `keynav.js` copies are keynav v1
  (byte-identical to each other and to the bundled `mods/whistle/keynav.js`). Keynav v2 is
  breaking: `keynav.fields`, `keynav.request` and `keynav-key-<any char>` are gone
  (whistle:docs/contracts/keynav.md History; CHANGELOG "Keynav authors"). A v1 copy "isn't a
  field", so with whistle 1.0 Spaces, Agents, Tabs, the footer menu, Files and Changes can't be
  selected, and the layout's `s`/`a`/`e`/`g` keys only flash. The port is mechanical: copy the
  v2 `keynav.js`, pass the field key to `toTerminal`/`keepKeys`, declare `x` in tuuxic-tabs.
- **Two undocumented state reads are gone**: `shared("whistle.enabled")` (tuuxic-settings) and
  keynav v1's `active: "terminal"` + `pane` (tuuxic-pane). Both move to whistle state
  `shared("whistle")` read through a copied `whistle.js` (`readWhistle()`).
- **`whistle.enter` is gone** (keys.json `terminal` → `ctrl-[`). `whistle.whistle`,
  `whistle.type`, `whistle.on/off/settings` and `whistle.field|focus|toggle:<block>` stay.
- **The layout's hints props were renamed and re-based**: `hintsInset: 8, hintsBorder: 2,
  hintsLift: 15` become `hintsAlignRight: 6, hintsAlignBorder: 2, hintsGap: 11` for the same
  position (worked below). The old names would be listed as config problems.
- **Integrate would touch tuuxic** even after the keynav port: its "selected terminal's header"
  step clones the layout's header mod (`tuuxic-pane` → `tuuxic-pane-whistle`) and edits
  `layouts/tuuxic.json` in place, and RECIPE has no "already done" test for a header. Porting
  the six mods to v2 is enough to keep Integrate off them (they count as "already fields");
  for the header, tuuxic can only document it, or ask herdr-whistle for a skip rule.
- **Whistle's Update upgrades tuuxic's bundled copy** in `mods/whistle/` in place (it finds any
  `mod.json` with `"title": "Whistle"`), and its step 3 tells the person tuuxic's v1 mods are no
  longer fields and offers to "fetch each one again from herdr.dev". Whistle never edits them.

## Table

| # | Touchpoint | Whistle 1.0 replacement | Notes / risk |
|---|---|---|---|
| 1 | `mods/tuuxic-{agents,changes,chrome,files,spaces,tabs}/keynav.js` (all six, and `mods/whistle/keynav.js`, md5 `4427c836…`): keynav v1, writes `shared("keynav.fields")` `{v:1,mod,props,label}` (`keynav.js:28-30`), reads `shared("keynav").active` (`:34`), requests in one `shared("keynav.request")` (`:48-50`) | Copy whistle 1.0 `mods/whistle/keynav.js` (v2): entry `shared("keynav.field:<fieldKey>") = {v:2,label,keys}`, request slot `shared("keynav.request:<fieldKey>")`, `shared("keynav") = {v:2,active}` (whistle:mods/whistle/keynav.js:6-8, docs/contracts/keynav.md Shapes) | Breaking. v1 copies are not fields in 1.0. `fieldKey` stays compatible for tuuxic's props (v2 only changes arrays; no tuuxic block has array props). Same import names (`announce,isActive,entered,move,toTerminal,keepKeys`) plus new `declared`. Check each copy with `bash kit/keynav-checker/check.sh mods/<mod>` (keynav.md "Checking your field"; checker rule `no v1`). Keep the six copies identical; RECIPE.md:120's "and in whistle" goes once tuuxic stops shipping whistle. |
| 2 | tuuxic-agents `main.js:7,95,241-254`: `announce(MOD, props(), "Agents")` only when not an overlay; `up/down` cursor, `open/right` → `agent.focus` + `toTerminal()` (`:246`) | `announce(MOD, props(), "Agents", {})`; `toTerminal(this.key)` | `toTerminal` now takes the field key (whistle:keynav.js:66). Not announcing from the overlay copy matches RECIPE Integrate "How a mod becomes a field" step 2. No declared keys. |
| 3 | tuuxic-changes `main.js:6,62-73,335-338`: `announce(MOD, props(), "Changes")` from both blocks' copies except when rendering the graph (`:326`); `up/down/open/right` | `announce(..., "Changes", {})`; no request calls | Two blocks of the mod (`changes-view {graph}`, `git-graph {view,back}`); only `changes-view` announces (graph view returns early). In v2 the graph copy simply has no entry, which is fine. Its command loop already ignores non-moves. |
| 4 | tuuxic-chrome `main.js:4,46-54,77-79`: footer copy only (`props.footer`) announces `"Menu"`; `up/down/open/right` | `announce(MOD, props(), "Menu", {})` | No request calls. The `brand` block (no props) never announces: correctly not a field. |
| 5 | tuuxic-files `main.js:6,46-56,178-180`: `announce(MOD, props(), "Files")`; `up/down/open/right/left` | `announce(..., "Files", {})` | No request calls. Note whistle 1.0 says Herdr's own files block is *not* a field (guide "Fields"), so tuuxic-files being one is a tuuxic plus. |
| 6 | tuuxic-spaces `main.js:9,71,487-498`: `announce(MOD, props(), "Spaces")`; `open/right` → `space.select` + `keepKeys()` (`:491`) | `keepKeys(this.key)` | Option: declare `n`/`r`/`x` like Integrate does for Herdr's spaces (RECIPE Integrate step 4 table) if tuuxic-spaces has those actions; whistle's default `s` group (n/x/r) is overridden in tuuxic's layout (row 13). |
| 7 | tuuxic-tabs `main.js:8,59,175-193`: `announce(MOD, props(), "Tabs")`; `left/right`, `open` → `tab.select` + `keepKeys()`, **`key-x`** → `tab.close` + `keepKeys()` (`:180-185`) | `announce(..., "Tabs", { x: "Close tab" })`; handle `declared(c) === "x"`; `keepKeys(this.key)` | v1's `move()` returned `"key-x"` for any key; v2's `move()` returns only the five moves and undeclared keys never reach the field (keynav.md rules 4-6). Without declaring `x`, close-from-keyboard silently stops working. `x` isn't one of whistle's own keys (whistle:mappings.json `keys`), so it is allowed. Pane-header copies (`props.pane`) don't announce: correct. |
| 8 | tuuxic-pane `main.js:17-19,293`: `keyPane()` reads `shared("keynav")`, `active === "terminal" ? v.pane : null` | Copy `mods/whistle/whistle.js`; `const w = readWhistle(); keyed = w?.mode === "whistle" && w.onTerminal && w.pane === pane` (docs/contracts/state.md rule 6; ADR 0016; RECIPE "The selected terminal's header" step 3) | Breaking: v2's `shared("keynav")` has no `pane` and never `"terminal"`; header never lights up under 1.0. `onTerminal` is required (pane alone stays set while another field is selected). Without whistle `readWhistle()` is null: header looks as before. |
| 9 | tuuxic-settings `main.js:53-54,127-129`: shows the Keyboard → Whistle section only if `${appHome()}/mods/whistle/main.js` reads | Same test still finds a 1.0 install (whistle installs to `mods/whistle/`, whistle:RECIPE Install step 4). For the whistle range (#6), read `"version"` in `mods/whistle/mod.json` (1.0 has `"version": "1.0.0", "herdr": "0.1.15"`) | A copy in another folder (`mods/whistle-2/`, CHANGELOG "You") would be missed; probably acceptable. Feeds #6 (missing / out of range). |
| 10 | tuuxic-settings `main.js:140,152-155`: reads `shared("whistle.enabled") === true` | `readWhistle()?.enabled` via a copied `whistle.js` (state.md Shape) | Breaking: `whistle.enabled` is "gone" (state.md History; CHANGELOG "Mod authors"). `readWhistle()` is null while whistle is inert (old Herdr, another copy running) or not loaded: the toggle needs a third state or the reason (#6). |
| 11 | tuuxic-settings `main.js:144,148`: `run("whistle.on"/"whistle.off")`, `run("whistle.settings")` | Unchanged: all three are in the stable command set (docs/contracts/commands.md) | `whistle.on/off` write `enabled` to whistle.json as before. `whistle.settings` from WHISTLE goes back to TYPE first (rule 2). |
| 12 | `keys.json:2-4` `global`: `ctrl-space` → `whistle.whistle` | Unchanged; 1.0 ships it. 1.0 also ships `alt-a` → `whistle.focus:agents`, `alt-s` → `whistle.focus:spaces`, `alt-,` → `whistle.settings` (`ctrl-shift-*` on macOS) (commands.md Jump keys; RECIPE Install step 5) | Tuuxic's layout has blocks `agents` and `spaces`, so the jump keys work as shipped. Once tuuxic stops shipping whistle, whistle's own Install merges these; tuuxic's keys.json should stop carrying whistle's sections (decide in #8). Check `alt-a/alt-s/alt-,` against tuuxic's own keys: no clash in `layout:tuuxic` today. |
| 13 | `keys.json:5-7` `terminal`: `ctrl-[` → `whistle.enter` | Removed. `whistle.enter` is gone; Ctrl+[ no longer enters WHISTLE (CHANGELOG Breaking, "Mod authors" Breaking) | Whistle's Upgrade step 2 asks the person to rebind it to `whistle.whistle` or remove it. Tuuxic should drop it. Ctrl+[ is now a `cancel` own key (mappings.json `keys.cancel`). |
| 14 | `keys.json:8-10` `mod:whistle`: `ctrl-space` → `whistle.type` | Drop. Whistle 1.0 writes its own `mod:whistle` entries itself (`"<key>": "whistle.key-<key>"`) and "your own entries … win" (whistle:claims.js:1-13; CHANGELOG "You") | A hand entry here overrides whistle's claim for that key; `whistle.whistle` already switches back from WHISTLE, so the entry is redundant at best. |
| 15 | `keys.json:12` `layout:tuuxic`: `ctrl-space` → `whistle.whistle` | Unchanged command; redundant with `global` | Harmless; keep only if the layout section must win over a person's `global` rebind. |
| 16 | `keys.json` `layout:tuuxic` `ctrl-h`/`ctrl-l` → `tab.prev`/`tab.next` (RECIPE.md:118 "Watch out") | Still true in 1.0: whistle claims chords among its keys (`field-left` `ctrl-h` …) in `mod:whistle`, which wins while whistle has the keyboard (claims.js:5-9) | No change; RECIPE text stays accurate. |
| 17 | `layouts/tuuxic.json:281-303` `statusbar-work` block: `{bar: "Under the terminals", hintsLift: 15, hintsInset: 8, hintsBorder: 2}` | `{bar: "Under the terminals", hintsAlignRight: 6, hintsAlignBorder: 2, hintsGap: 11}` (docs/contracts/layout-block.md Props, rule 7) | Old: box right edge at `vw − inset + border`, bottom at `vh − 22 − lift` (tuuxic `mods/whistle/main.js:407-411`). New: right edge at `vw − hintsAlignRight`, bottom at `vh − (22+2·border) − gap` (whistle:views.js:91-98). Same spot ⇒ right = 8−2 = 6, gap = 15+22−26 = 11. Old names are unknown props → listed as config problems ("a bad prop is listed", layout-block.md rule 4) and ignored. Verify visually. |
| 18 | `layouts/tuuxic.json:307-367` hidden `statusbar` block: `{bar: "Full width", enabled: false, mappings}` | All three stay valid props. "Each prop but `bar` comes from the first block, in layout order, that has it" and a hidden spot's copy rests (rules 5-6) | `statusbar-work` (first in order) has no `enabled`/`mappings`, so they still come from `statusbar`. `whistle.json`'s `bar` picks the spot by name, as before. Switched off, the bar now says "Whistle off" instead of `Terminal · <title>` (guide; CHANGELOG). |
| 19 | `statusbar.mappings` `s`, `a` → `whistle.field:spaces/agents`; `e`/`E` → `whistle.focus/toggle:files`; `g`/`G` → `whistle.focus/toggle:changes` (`tuuxic.json:323-348`) | Verbs unchanged: `whistle.field|focus|toggle:<block>` (commands.md Verbs). `changes` is a stack id; `focus`/`toggle` accept it (whistle:fields.js:142-151 `fieldAt` enters a group; step.js `toggled`) | Work only once rows 1-7 are done (until then `field:spaces` flashes "can't be selected now"). Layer conflict with 1.0 defaults: the layout's `s`/`a` commands replace the default `s` (Spaces: n/x/r) and `a` (Agents: n/p) groups, and `g`/`G` replace terminal scroll top/bottom (whistle:mappings.json; config.js:187-207 `mergeMap`). That's an override, not a conflict, so nothing flashes, but tuuxic loses those defaults: a design choice for 1.0 (Alt+A/Alt+S jump keys now cover "select Spaces/Agents"). |
| 20 | `statusbar.mappings` `/`, `p`, `,`, `?`, `m` → `mod.open:tuuxic-*` | Valid mappings; override defaults `/` (`mod.open:picker`), `p` (`app.palette`), `,` (`app.settings`), `?` (`app.help`) | Intended. Option: move tuuxic-specific mappings into each mod via `offerMappings` (docs/contracts/mod-mappings.md), which fits "each mod stands alone"; layout mappings still beat mod offers. |
| 21 | No `nav` prop in tuuxic's layout | `nav` directions are now `left/down/up/right` | Nothing to migrate. |
| 22 | `mods/whistle/` (bundled pre-1.0 copy, no `version.js`) | Not shipped (settled in #1). Whistle's own Install/Update owns it | Whistle's Update finds it by `"title": "Whistle"` and updates `mods/whistle/` in place (CHANGELOG Upgrading step 1; RECIPE Install step 3). Tuuxic's pre-1.0 upgrade path (#8) can hand over to it. |
| 23 | Whistle Upgrading step 3 on a pre-1.0 tuuxic install | — | Finds the six v1 mods, tells the person they are no longer fields and offers to "fetch each one again from herdr.dev"; never edits them. Tuuxic's mods aren't on herdr.dev today (#2/#1 "herdr.dev listing"), so that offer misleads unless tuuxic 1.0 says how to update. |
| 24 | Whistle Integrate on the tuuxic layout | — | Classification: `tuuxic` isn't in Herdr's `installed.json`, so it's "the person's own" and is **changed in place**; tuuxic mods count as third-party (when unsure, third-party) and would be **cloned** (`tuuxic-*-whistle`). Skipped as "already fields": mods with a `keynav.js` whose `V = 2` and whose `announce` is called (RECIPE Integrate "Before you start"). Simple path "Herdr's blocks" = ids `spaces`, `agents`, `tabs`, `files`, `changes`: tuuxic has all five ids (`changes` is a stack); on v2 none needs adapting. "All blocks" might adapt `browser-notes` (tuuxic-notes) if it has a list. **Header step** ("do it with either answer") would clone `tuuxic-pane` and repoint `layouts/tuuxic.json`'s `header.content.mod`; RECIPE gives no test for a header already reading `onTerminal`. Tuuxic can (a) port tuuxic-pane (row 8) and say in its RECIPE that the tuuxic layout is already integrated, and/or (b) file a herdr-whistle issue for a header skip rule (whistle 1.0 is fixed, map #1 Out of scope). |

## Stale docs text

| Where | Says | 1.0 |
|---|---|---|
| README.md:11-13 | "It comes with whistle … switched off: whistle's bar then only shows what has the keyboard" | Not bundled; switched off the bar says "Whistle off". |
| README.md:18-19 | Merge "whistle's `global`, `terminal` and `mod:whistle` keys" | `terminal` (`whistle.enter`) gone; `mod:whistle` written by whistle; global keys come from whistle's Install. |
| README.md:24-25 | "each mod carries a copy of `keynav.js`" | Still true, now v2. |
| README.md:47, 60-62 | Mods-table `whistle` row; `mods/whistle/LICENSE` | Goes with the bundled copy. |
| RECIPE.md:41-44 | Shipped off, bar shows `Terminal · <pane title>` | "Whistle off". |
| RECIPE.md:66-70 | Keyboard mode via the Whistle mode switch; layout block's keys | Mostly fine; mention Alt+A/Alt+S/Alt+, and declared `x` on tabs. |
| RECIPE.md:83 | `hintsInset: 8, hintsBorder: 2, hintsLift: 15` | `hintsAlignRight: 6, hintsAlignBorder: 2, hintsGap: 11`. |
| RECIPE.md:85-87 | "`mods/whistle` (a copy of Tuuxic/herdr-whistle)"; Whistle row only when `mods/whistle/main.js` exists | No bundled copy; range check (#6). |
| RECIPE.md:94-96 | keynav "protocol v1", `shared("keynav.fields")` | v2: `shared("keynav.field:<key>")`. |
| RECIPE.md:109-112 | Ships off via `enabled: false`; "Without the `mods/whistle` folder whistle's bar shows 'whistle did not load'"; update the copy from herdr-whistle | Whistle missing is now the normal no-whistle case (#6); no copy to update. |
| RECIPE.md:120 | `keynav.js` same "in every keynav mod and in whistle" | Six tuuxic copies only (plus two `whistle.js` copies: tuuxic-settings, tuuxic-pane). |
| RECIPE.md:133-135 | Done when: bar shows `Terminal` with no badge | "Whistle off". |
| mods/*/main.js keynav comments (e.g. tuuxic-pane:17-18 "keynav protocol … terminal field") | v1 wording | Rewrite with the port. |
| GLOSSARY.md:60-61 "Whistle mode" | "off, whistle's bar only shows what has the keyboard" | Off, it says "Whistle off" (and keeps the config-problem marker). |
