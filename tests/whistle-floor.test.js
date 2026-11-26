// Whistle at the range floor (spec section 7). No whistle is installed in CI: whistle's own
// files at the floor version sit in tests/fixtures/whistle-<floor>/ (keynav.js, and the
// commands and layout-block contracts), copied from herdr-whistle at that tag.
//   - the anchor's props are ones whistle knows (layout-block.md's Props table);
//   - the mappings run commands that exist (commands.md's tables; mod.open of a shipped mod);
//   - the six keynav copies are byte-equal to whistle's keynav.js.

import { suite, json, text, shipped, blocks, mappingCommands, WHISTLE_MODS, KEYNAV_MODS, LAYOUT_MOD } from "./harness.js";

// The names in a contract table's first column, `code` only: "whistle.focus:<block>" etc.
const firstColumn = (md) => [...String(md).matchAll(/^\|\s*`([^`]+)`/gm)].map((m) => m[1]);

export default suite("whistle at the range floor", (t) => {
  const range = json(`mods/${LAYOUT_MOD}/mod.json`)?.whistle ?? ">=2.0.0 <3.0.0";
  const floor = /^>=\s*(\d+\.\d+\.\d+)/.exec(range)?.[1];
  const dir = `tests/fixtures/whistle-${floor}`;
  const keynav = text(`${dir}/keynav.js`);
  const commandsMd = text(`${dir}/commands.md`);
  const blockMd = text(`${dir}/layout-block.md`);
  t.ok(`whistle ${floor}'s files are in ${dir}`, keynav && commandsMd && blockMd);
  if (!keynav || !commandsMd || !blockMd) return;

  const props = firstColumn(blockMd.split(/^## Props/m)[1]?.split(/^## /m)[0] ?? "");
  t.ok("layout-block.md lists whistle's props", props.length > 0);
  const commands = firstColumn(commandsMd).filter((c) => /^whistle/.test(c));
  t.ok("commands.md lists whistle's commands", commands.length > 0);
  // "whistle.focus:<block>" matches "whistle.focus:changes"; a JSON-argument command matches by prefix.
  const known = (cmd) => commands.some((c) => {
    const at = c.search(/[<{]/);
    return at < 0 ? c === cmd : cmd.startsWith(c.slice(0, at)) && cmd.length > at;
  });

  const layout = json("layouts/tuuxic.json");
  const anchors = blocks(layout).filter((b) => b.mod === "whistle");
  t.check("one whistle block, the anchor", anchors.map((b) => b.id), ["whistle-anchor"]);
  const mods = shipped();
  for (const a of anchors) {
    t.check(`${a.id}'s props are ones whistle knows`, Object.keys(a.props).filter((p) => !props.includes(p)), []);
    t.check(`${a.id}'s mappings run commands that exist`, mappingCommands(a.props.mappings).filter((cmd) => {
      if (/^whistle\./.test(cmd)) return !known(cmd);
      const open = /^mod\.open:(.+)$/.exec(cmd);
      if (open) return !mods.includes(open[1]) && !WHISTLE_MODS.includes(open[1]);
      const own = /^(tuuxic-[^.]+)\./.exec(cmd);
      if (own) return !mods.includes(own[1]);
      return false; // Herdr's own commands: not checked here.
    }), []);
  }

  for (const m of KEYNAV_MODS) {
    t.ok(`${m}/keynav.js is byte-equal to whistle ${floor}'s`, text(`mods/${m}/keynav.js`) === keynav,
      text(`mods/${m}/keynav.js`) == null ? "missing" : "differs");
  }
});
