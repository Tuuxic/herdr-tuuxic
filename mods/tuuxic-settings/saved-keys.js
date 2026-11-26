// Saved-key renames for 1.0 (spec §5): read the old key once when the new one is missing, write
// the new key, drop the old. This file goes in 2.0 (the CHANGELOG says so).

// [old, new] settings.json keys renamed in 1.0. Add a pair when a saved key is renamed.
export const RENAMES = [];

// The settings with each old key moved to its new name, and whether anything changed. When both
// are saved, the new key's value stays. The settings passed in are left as they are.
export function migrateKeys(settings, renames = RENAMES) {
  const saved = { ...settings };
  let changed = false;
  for (const [from, to] of renames) {
    if (!(from in saved)) continue;
    if (!(to in saved)) saved[to] = saved[from];
    delete saved[from];
    changed = true;
  }
  return { saved, changed };
}
