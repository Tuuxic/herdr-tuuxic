// Plain copies (CONTRIBUTING "Plain copies") must stay byte-identical.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const same = (a, b) => assert.equal(readFileSync(a, "utf8"), readFileSync(b, "utf8"), `${a} != ${b}`);

test("whistle range compare copies match", () =>
  same("mods/tuuxic-layout/range.js", "mods/tuuxic-settings/whistle-range.js"));
test("bar-control copies match", () =>
  same("mods/tuuxic-settings/bar-control.js", "mods/tuuxic-palette/bar-control.js"));
