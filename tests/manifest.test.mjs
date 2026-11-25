// The release record and the uniform mod.json field set (spec #23 §2, ADR 0003).
// Run: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mods = join(root, "mods");
const read = (p) => JSON.parse(readFileSync(join(mods, p), "utf8"));
const { inRange } = await import("../mods/tuuxic-layout/range.js");
const release = await import("../mods/tuuxic-layout/release.js");

test("inRange accepts whistle versions inside >=2.0.0 <3.0.0", () => {
  const r = ">=2.0.0 <3.0.0";
  assert.equal(inRange("2.0.0", r), true);
  assert.equal(inRange("2.10.3", r), true);
  assert.equal(inRange("1.9.9", r), false);
  assert.equal(inRange("3.0.0", r), false);
  assert.equal(inRange("10.0.0", r), false);
});

test("inRange is false for a missing or malformed version", () => {
  const r = ">=2.0.0 <3.0.0";
  assert.equal(inRange(undefined, r), false);
  assert.equal(inRange("", r), false);
  assert.equal(inRange("two", r), false);
});

test("inRange handles every comparator and a bare version", () => {
  assert.equal(inRange("2.0.0", ">2.0.0"), false);
  assert.equal(inRange("2.0.1", ">2.0.0"), true);
  assert.equal(inRange("2.0.0", "<=2.0.0"), true);
  assert.equal(inRange("2.0.0", "=2.0.0"), true);
  assert.equal(inRange("2.0.0", "2.0.0"), true);
});

test("tuuxic-layout's mod.json is the release record and release.js matches it", () => {
  const m = read("tuuxic-layout/mod.json");
  assert.equal(m.version, "1.0.0");
  assert.equal(m.whistle, ">=2.0.0 <3.0.0");
  assert.match(m.herdr, /^\d+\.\d+\.\d+$/);
  assert.deepEqual(
    { version: release.VERSION, herdr: release.MIN_HERDR, whistle: release.WHISTLE },
    { version: m.version, herdr: m.herdr, whistle: m.whistle },
  );
});

test("every other tuuxic-* mod.json has exactly the agreed fields at 1.0.0", () => {
  const layout = read("tuuxic-layout/mod.json");
  const allowed = new Set(["title", "description", "version", "herdr", "place", "size", "focusable", "overlay", "cloned_from"]);
  const names = readdirSync(mods).filter((n) => n.startsWith("tuuxic-") && n !== "tuuxic-layout");
  assert.equal(names.length, 17);
  for (const n of names) {
    const m = read(`${n}/mod.json`);
    for (const k of Object.keys(m)) assert.ok(allowed.has(k), `${n}: unexpected field ${k}`);
    assert.ok(typeof m.title === "string" && m.title.length > 0, `${n}: title`);
    assert.ok(typeof m.description === "string" && m.description.length > 0, `${n}: description`);
    assert.equal(m.version, "1.0.0", `${n}: version`);
    assert.equal(m.herdr, layout.herdr, `${n}: herdr`);
    assert.ok(!existsSync(join(mods, n, "version.js")), `${n}: version.js`);
  }
});
