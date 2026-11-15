# The layout version covers every mod it ships

Tuuxic is one Herdr layout plus its tuuxic-* mods, and each mod can also be installed alone, so
each carries its own mod version. herdr.dev installs a repo's default branch head and ignores
tags, so a mod reaches people only when `main` moves. We decided that the layout version is
the one release line, and the mod versions ride inside it:

- **Branches and tags** mirror herdr-whistle ADR 0012: work lands on `next`, `main` moves only
  by a release PR, and the merge tags `v<layout version>` with a GitHub Release. Only the
  layout version is tagged; the first is `v1.0.0`.
- **No mod releases of their own**: a mod version moves only inside a layout release. A
  single-mod install takes the mod as of the latest layout release.
- **A mod's semver** covers what something outside the mod relies on: its commands, its block
  props, its `shared()` keys and keynav fields, the shape of the settings it stores, and its
  folder name. Its looks, wording and internals are not covered.
- **The layout's semver** covers every mod it ships, its block ids, its whistle range and its
  minimum Herdr. The keys.json lines it ships, its theme names and its set of mods are not
  promised.
- **The layout bumps at least as much as the biggest mod bump** in the release.
- **Raising the whistle range or the minimum Herdr is a layout minor**; widening the range is
  a patch. Tuuxic works without whistle, so a narrower range never breaks it.
- **One minimum Herdr** for the layout and every mod. Raising it bumps only the layout.
- **Every tuuxic-* mod starts at 1.0.0** in layout v1.0.0.

Rejected: per-mod tags between layout releases (needs a release path that doesn't move
`main`); a layout version that ignores its mods' bumps (a layout patch could ship a mod
major); promising keys.json lines, themes and the mod set (tuuxic is a workspace taken as it
comes, and those would make most changes majors); a minimum Herdr per mod (one number to keep
and verify).

## Consequences

- A mod's version can sit far from the layout's, and from other mods'; the release names
  them all.
- Renaming a block id is a layout major, because keys.json and whistle's jump keys name it.
- A mod installed alone needs the layout's minimum Herdr even if its own code would run on
  an older one.
