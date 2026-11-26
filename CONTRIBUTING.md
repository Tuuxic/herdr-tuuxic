# Contributing

How tuuxic is built, tested, versioned and released. Words: [GLOSSARY.md](GLOSSARY.md).
Decisions and why: [docs/adr/](docs/adr). Specs and tickets are GitHub issues.

## The repo

The repo is laid out like a Herdr home: `layouts/tuuxic.json` (and its preview
`layouts/tuuxic.svg`), the mods in `mods/tuuxic-*/` as they ship, `themes/`, and `keys.json`
with the `layout:tuuxic` section the install adds. The rest stays outside what ships: the docs
([README.md](README.md), [RECIPE.md](RECIPE.md) for installing agents,
[docs/mods.md](docs/mods.md), [CHANGELOG.md](CHANGELOG.md)), the poster in `preview-src/`,
the tests in `tests/` and the scripts in `scripts/`.

- **`mods/tuuxic-layout/`** is the layout mod ([ADR 0003](docs/adr/0003-a-layout-mod-carries-the-release-record.md)):
  no block (its view draws nothing, `"place": "none"`). Its `mod.json` is the release record (`version`, `herdr`,
  `whistle`) and `release.js` exports the same values; `range.js` holds a small whistle range
  compare that needs no library.
- **Every other mod.json** has exactly `title`, `description`, `version`, `herdr`, Herdr's
  `place`/`size`/`focusable`/`overlay` as needed, and `cloned_from`.
- **Whistle is not in the repo.** Tuuxic supports it without depending on it
  ([ADR 0001](docs/adr/0001-single-mods-support-whistle-without-depending-on-it.md)) and
  draws its bar and hints in tuuxic-bar
  ([ADR 0004](docs/adr/0004-tuuxic-draws-whistles-bar-and-hints.md)).
- **Plain copies**, kept by hand with no match check: whistle v2.0.0's `keynav.js` in the six
  keynav mods, whistle's `whistle.js` in tuuxic-settings and tuuxic-pane, `opens.js` in
  tuuxic-bar, tuuxic-chrome and tuuxic-palette, `bar-control.js` in tuuxic-palette and
  tuuxic-settings, the whistle range compare as tuuxic-layout's `range.js` and
  tuuxic-settings' `whistle-range.js`, `browser/client.js` in tuuxic-pane and
  `client.js` in tuuxic-notes. Imports stay inside each mod's folder.
- **Licence notices** sit in the mod that carries the code; the README lists them all.

## Tests

```sh
bash tests/run.sh
```

It needs only `herdr-app` on the PATH.

1. `herdr-app check` on every `tuuxic-*` mod, tuuxic-layout included.
2. **Targeted suites**, run as whistle runs its own: the whistle range compare, the saved-key
   migration and the Whistle mode row states in Settings → Keyboard. Each lives in a small
   module that doesn't import `herdr`.
3. **The repo suite** (static):
   - **Manifest**: `release.js` equals tuuxic-layout's mod.json; every mod's `herdr` equals
     the layout's; every mod.json has exactly the agreed fields.
   - **Layout and files**: every block names a mod that ships, or whistle / whistle-ui; block
     ids are unique; every id the mappings or keys.json name exists; keys.json runs only
     tuuxic commands; themes have only Herdr's fields.
   - **Whistle at the range floor (2.0.0)**: the anchor's props are ones whistle knows; the
     mappings run commands that exist; the six keynav copies are byte-equal to whistle's
     `keynav.js`. No whistle is installed in CI.
   - **CHANGELOG**: an entry exists for the layout version, in the shape under
     [Release checklist](#release-checklist); it names every mod at its mod.json version;
     every keys.json change since the last tag has an Upgrading note.
   - **Bumps since the last `v*` tag**: a mod with changed files has a higher version, and the
     layout rises at least as much as the largest mod bump.
   - **Docs**: every link resolves to a file and heading; every shipped mod has a
     [docs/mods.md](docs/mods.md) section.

CI (`.github/workflows/test.yml`) runs `run.sh` on Linux, macOS and Windows, each on the
latest Herdr and on the minimum Herdr. Linux and macOS block; Windows doesn't block until it's
shown to work.

## The sandbox

`scripts/sandbox.sh`, adapted from whistle's, runs a second Herdr window with a throwaway home,
tuuxic and whistle installed, so you can walk RECIPE's [Done when](RECIPE.md#done-when) without
touching your own `~/.config/herdr-app`. Its commands mirror whistle's: `reset` for a fresh
home, `sync` to copy this checkout in again, `agent` to install by RECIPE.md as a person's agent
would, and `open`, `close`, `status`, `path`.

## How work lands

`main` is the release: what people install from herdr.dev. Work lands on the long-lived
`next` branch, one slice at a time; a slice branches from `next` and merges back once
`run.sh` passes. A slice that changes a mod bumps its version as [Versioning](#versioning)
says and adds a CHANGELOG line under the audience it affects. `next` reaches `main` only by a
release.

## Versioning

From [ADR 0002](docs/adr/0002-the-layout-version-covers-every-mod-it-ships.md):

- **Only the layout version is tagged** (`v<layout version>`). Mod versions move only inside a
  layout release; mods have no releases of their own.
- **A mod's semver** covers its commands and block props, its `shared()` keys and keynav
  fields, the shape of the settings it stores, and its folder name. Looks, wording and
  internals aren't covered.
- **The layout's semver** covers every mod it ships, its block ids, the whistle range and the
  minimum Herdr. It doesn't promise its keys.json lines, its theme names or its set of mods.
- **Bumps combine**: the layout bumps at least as much as the biggest mod bump. Raising the
  whistle range or the minimum Herdr is a layout minor; widening the range is a patch.
- **One minimum Herdr** covers the layout and every mod; raising it bumps only the layout.
  It is `"herdr"` in `mods/tuuxic-layout/mod.json`, copied into every mod.json.
  It is 0.1.15 for now. **TODO (before v1.0.0):** confirm it after running `herdr-app check` and RECIPE's Done when on
  that Herdr release; the floor is at least 0.1.12 by API use and 0.1.15 for whistle 2.0.0.

## Release checklist

1. **Versions bumped**: each changed mod's `version` in its mod.json, and the layout's in
   `mods/tuuxic-layout/mod.json` (and `release.js`), as [Versioning](#versioning) says.
2. **CHANGELOG.md** has the entry `## v<layout version> (<date>)`, with the release date and
   the sections `### Upgrading` (the installing agent's steps), `### Mods` (every mod at its
   version, bumped ones as `old → new`, tuuxic-layout not listed), `### You` (one line per
   change, naming the mod) and `### Authors`. An empty section says "Nothing."
3. **CI green on `next`**.
4. **A hand pass on Windows in the sandbox**: `scripts/sandbox.sh reset`, then
   `scripts/sandbox.sh agent` for a fresh install, and every item in RECIPE's
   [Done when](RECIPE.md#done-when). Also ask: is the poster still true?
5. **A pull request `next` → `main`**. Merging it is the release:
   `.github/workflows/release.yml` reads the version from `mods/tuuxic-layout/mod.json` and,
   if `v<version>` isn't released yet, tags the merge (unless the tag exists) and makes a
   GitHub Release whose notes are that version's CHANGELOG entry (`scripts/release.sh` does
   both reads). When the release exists it does nothing; a run that failed after tagging
   finishes the release when run again.
