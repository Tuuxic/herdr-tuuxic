// The layout and its files (spec sections 3 and 7):
//   - every block names a mod that ships, or whistle / whistle-ui;
//   - block ids are unique;
//   - every id the mappings or keys.json name exists;
//   - keys.json runs only tuuxic commands (no whistle lines: whistle writes its own keys);
//   - themes have only Herdr's fields (Herdr's ThemeFile denies unknown fields).

import {
  suite, json, files, shipped, blocks, ids, modsNamed, mappingCommands, keysCommands, namedId, WHISTLE_MODS,
} from "./harness.js";

const THEME_FIELDS = ["background", "foreground", "selection", "cursor", "ansi", "colors"];
const THEME_REQUIRED = ["background", "foreground", "selection", "ansi"];

export default suite("layout", (t) => {
  const layout = json("layouts/tuuxic.json");
  t.ok("layouts/tuuxic.json exists", layout != null);
  if (!layout) return;
  const mods = shipped();
  const all = blocks(layout);
  const every = ids(layout);

  t.check("every block names a mod that ships, or whistle / whistle-ui",
    [...new Set(modsNamed(layout))].filter((m) => !mods.includes(m) && !WHISTLE_MODS.includes(m)), []);
  t.check("ids are unique", every.filter((id, i) => every.indexOf(id) !== i), []);

  const mapped = all.filter((b) => b.mod === "whistle").flatMap((b) => mappingCommands(b.props.mappings));
  t.check("every id the mappings name exists",
    mapped.map(namedId).filter((id) => id != null && !every.includes(id)), []);

  const keys = json("keys.json") ?? {};
  const bound = keysCommands(keys);
  t.check("every id keys.json names exists",
    bound.map((b) => namedId(b.cmd)).filter((id) => id != null && !every.includes(id)), []);
  t.check("every mod keys.json opens ships",
    bound.map((b) => /^mod\.open:(.+)$/.exec(b.cmd)?.[1]).filter((m) => m && !mods.includes(m)), []);
  t.check("keys.json runs only tuuxic commands (no whistle ones)",
    bound.filter((b) => /^whistle(-ui)?\./.test(b.cmd)).map((b) => `${b.section}: ${b.cmd}`), []);
  t.check("keys.json has no whistle sections",
    Object.keys(keys).filter((s) => /^mod:whistle/.test(s)), []);

  for (const f of files.filter((p) => /^themes\/[^/]+\.json$/.test(p))) {
    const theme = json(f);
    t.check(`${f} has only Herdr's fields`, Object.keys(theme).filter((k) => !THEME_FIELDS.includes(k)), []);
    t.check(`${f} has Herdr's required fields`, THEME_REQUIRED.filter((k) => !(k in theme)), []);
  }
});
