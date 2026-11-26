// The docs (spec sections 7 and 8):
//   - every link in the repo's Markdown resolves to a file or folder and, with a #fragment, to a
//     heading in that file (GitHub's anchors). Links to other sites aren't followed;
//   - every shipped mod but tuuxic-layout has a docs/mods.md section;
//   - RECIPE.md opens with the banner (title, intro, the Agents note), then its ## sections run
//     in the spec's order: the look and build sections, then Install, Single mods, Update, Uninstall.

import { suite, text, files, shipped, LAYOUT_MOD } from "./harness.js";

const unfenced = (s) => String(s).replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, "").replace(/`[^`\n]*`/g, "");

// GitHub's heading anchors: lowercased, punctuation but `-` and `_` dropped, spaces to `-`,
// a repeated anchor numbered (-1, -2, ...).
export function anchors(md) {
  const seen = new Map();
  const out = new Set();
  const s = String(md).replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, "");
  for (const m of s.matchAll(/^#{1,6}[ \t]+(.+?)[ \t#]*$/gm)) {
    const base = m[1].replace(/`/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim().toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    out.add(n ? `${base}-${n}` : base);
  }
  return out;
}

const dirname = (p) => p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "";
function resolve(from, link) {
  const parts = (link.startsWith("/") ? link.slice(1) : `${dirname(from)}/${link}`).split("/");
  const out = [];
  for (const p of parts) {
    if (p === "" || p === ".") continue;
    if (p === "..") out.pop(); else out.push(p);
  }
  return out.join("/");
}

export default suite("docs", (t) => {
  const docs = files.filter((f) => /\.md$/.test(f) && !/^tests\/fixtures\//.test(f) && text(f) != null);
  const broken = [];
  for (const doc of docs) {
    for (const m of unfenced(text(doc)).matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const link = m[1].replace(/^<|>$/g, "");
      if (/^[a-z][a-z0-9+.-]*:/i.test(link)) continue; // another site, mailto:
      const [path, frag] = link.split("#");
      const target = path === "" ? doc : resolve(doc, decodeURI(path));
      const isFile = files.includes(target);
      const isDir = files.some((f) => f.startsWith(`${target}/`));
      if (!isFile && !isDir) { broken.push(`${doc}: ${link} (no ${target})`); continue; }
      if (frag && isFile && /\.md$/.test(target)) {
        const body = text(target);
        if (body != null && !anchors(body).has(frag.toLowerCase())) broken.push(`${doc}: ${link} (no heading #${frag})`);
      }
    }
  }
  t.check("every link resolves", broken, []);

  const mods = text("docs/mods.md");
  t.ok("docs/mods.md exists", mods != null);
  if (mods != null) {
    const headings = [...mods.matchAll(/^#{2,3}[ \t]+(.+)$/gm)].map((m) => m[1]);
    t.check("every shipped mod has a docs/mods.md section",
      shipped().filter((n) => n !== LAYOUT_MOD && !headings.some((h) => new RegExp(`\\b${n}\\b`).test(h))), []);
  }

  const recipe = text("RECIPE.md");
  t.ok("RECIPE.md exists", recipe != null);
  if (recipe != null) {
    const body = recipe.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, "");
    const first = body.search(/^## /m);
    const banner = first < 0 ? body : body.slice(0, first);
    t.ok("RECIPE.md opens with the banner", /^# \S/.test(banner) && /^> \*\*Agents:\*\*/m.test(banner),
      "a # title and the > **Agents:** note before the first ## section");
    t.check("RECIPE.md section order", [...body.matchAll(/^##[ \t]+(.+?)[ \t]*$/gm)].map((m) => m[1]), [
      "Talking to the person", "What you see", "How it behaves", "Built from", "Watch out", "Done when",
      "Install", "Single mods", "Update", "Uninstall",
    ]);
  }
});
