# A layout mod carries the release record

Tuuxic needs its layout version, whistle range and minimum Herdr where a running install and
an installing agent can read them. Herdr drops unknown top-level fields when it rewrites a
layout. Only mod blocks have props, and those get copied into users' clones. A mod can't
import from another mod's folder. A file at the repo root isn't copied into the Herdr home.
So we added a mod, `mods/tuuxic-layout/`, that ships only with the layout, is never offered
alone, and does whatever layout-specific work needs a mod:

- **Its mod.json is the release record**: `version` is the layout version (it has no mod
  version of its own), `herdr` is the minimum Herdr, and `whistle` is the whistle range,
  written `">=1.0.0 <2.0.0"`. Its `release.js` exports the same values for its code. A test
  fails if they drift apart (whistle's version.js pattern). Other mods that need these values
  read `mods/tuuxic-layout/mod.json` at runtime.
- **Every other tuuxic-* mod's mod.json** has the same fields: `title`, `description`,
  `version`, `herdr`, Herdr's `place`/`size`/`focusable`/`overlay` as needed, and
  `cloned_from`. There's no `name`, because Herdr renames copies, and there's no whistle
  range (ADR 0001). Each `herdr` equals the layout's, and a test checks this. There's no
  version.js, because no mod reads its own version. A mod that starts to will add one with
  the same drift test.
- **The release record doesn't list mod versions.** Each mod.json is the only source, and
  each CHANGELOG entry names the mod versions that release ships.
- A Herdr home with `layouts/tuuxic.json` but no `mods/tuuxic-layout/` holds a pre-1.0
  tuuxic. tuuxic-* mods without `layouts/tuuxic.json` are single mods, each at the version
  in its own mod.json (amended by "Which mods the RECIPE's Single mods section offers").

Rejected: props on a layout block (they disappear with the block and are copied into users'
clones); a root `tuuxic.json` (nothing can read it at runtime); version.js in every mod
(17 copies that nothing imports); a `MODS` list in the release record (17 entries that can
drift, and the mod.json files already hold the versions).
