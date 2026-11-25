// Whether a whistle version is in tuuxic's whistle range, such as ">=2.0.0 <3.0.0" (the
// `whistle` field of mods/tuuxic-layout/mod.json). No library: a range is space-separated
// comparators (>=, >, <=, <, =) on x.y.z versions. A pre-release sorts below its release.
// tuuxic-layout carries the same compare; mods can't import from each other, so change both.

function parse(version) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(String(version ?? "").trim());
  return m ? { core: [+m[1], +m[2], +m[3]], pre: m[4] ?? null } : null;
}

function compare(a, b) {
  for (let i = 0; i < 3; i++) if (a.core[i] !== b.core[i]) return a.core[i] < b.core[i] ? -1 : 1;
  if (a.pre === b.pre) return 0;
  if (a.pre === null) return 1;
  if (b.pre === null) return -1;
  return a.pre < b.pre ? -1 : 1;
}

const TESTS = { ">=": (c) => c >= 0, ">": (c) => c > 0, "<=": (c) => c <= 0, "<": (c) => c < 0, "=": (c) => c === 0 };

// True when version meets every comparator of range; false when either can't be read.
export function inRange(version, range) {
  const v = parse(version);
  const parts = String(range ?? "").trim().split(/\s+/).filter(Boolean);
  if (!v || !parts.length) return false;
  return parts.every((part) => {
    const m = /^(>=|<=|>|<|=)(.+)$/.exec(part);
    const bound = m && parse(m[2]);
    return Boolean(bound) && TESTS[m[1]](compare(v, bound));
  });
}
