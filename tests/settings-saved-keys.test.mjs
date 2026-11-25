// Saved-key renames (spec §5): read the old key once when the new one is missing, write the new
// key, drop the old. Removed in 2.0.
import { test } from "node:test";
import assert from "node:assert/strict";
import { migrateKeys } from "../mods/tuuxic-settings/saved-keys.js";

const RENAMES = [["tuuxic.needsYou", "tuuxic.blocked"]];

test("an old key moves to its new name", () => {
  const { saved, changed } = migrateKeys({ "tuuxic.needsYou": true, other: 1 }, RENAMES);
  assert.deepEqual(saved, { "tuuxic.blocked": true, other: 1 });
  assert.equal(changed, true);
});

test("when both are there the new key wins and the old one goes", () => {
  const { saved, changed } = migrateKeys({ "tuuxic.needsYou": true, "tuuxic.blocked": false }, RENAMES);
  assert.deepEqual(saved, { "tuuxic.blocked": false });
  assert.equal(changed, true);
});

test("nothing to rename leaves the settings as they are", () => {
  const before = { "tuuxic.blocked": false };
  const { saved, changed } = migrateKeys(before, RENAMES);
  assert.deepEqual(saved, { "tuuxic.blocked": false });
  assert.equal(changed, false);
});

test("the settings passed in are not changed", () => {
  const before = { "tuuxic.needsYou": true };
  migrateKeys(before, RENAMES);
  assert.deepEqual(before, { "tuuxic.needsYou": true });
});
