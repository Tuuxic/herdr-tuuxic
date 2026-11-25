// tuuxic-settings' copy of the whistle range compare (spec §2): no library.
import { test } from "node:test";
import assert from "node:assert/strict";
import { inRange } from "../mods/tuuxic-settings/whistle-range.js";

const RANGE = ">=2.0.0 <3.0.0";

test("2.x is in the 1.0 range", () => {
  assert.equal(inRange("2.0.0", RANGE), true);
  assert.equal(inRange("2.11.3", RANGE), true);
});

test("1.x and 3.x are out of range", () => {
  assert.equal(inRange("1.9.9", RANGE), false);
  assert.equal(inRange("3.0.0", RANGE), false);
});

test("a pre-release of 2.0.0 is below 2.0.0", () => {
  assert.equal(inRange("2.0.0-rc.1", RANGE), false);
});

test("a version or range it can't read is out of range", () => {
  assert.equal(inRange("two", RANGE), false);
  assert.equal(inRange(undefined, RANGE), false);
  assert.equal(inRange("2.0.0", "^2"), false);
});
