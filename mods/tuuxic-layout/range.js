// Whether a version falls in a range such as ">=2.0.0 <3.0.0" (spec #23 §2). No library: a
// range is space-separated comparators (>=, >, <=, <, = or none), each on a plain x.y.z
// version, and a version is in range when it meets all of them. A missing or malformed
// version is out of range. Mods that need this keep a plain copy (imports stay in a mod's folder).

const parse = (v) => {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(v ?? "").trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
};

const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

const MEETS = {
  ">=": (c) => c >= 0,
  ">": (c) => c > 0,
  "<=": (c) => c <= 0,
  "<": (c) => c < 0,
  "=": (c) => c === 0,
  "": (c) => c === 0,
};

export function inRange(version, range) {
  const v = parse(version);
  if (!v) return false;
  const parts = String(range ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return false;
  return parts.every((part) => {
    const m = /^(>=|<=|>|<|=)?(.*)$/.exec(part);
    const bound = parse(m[2]);
    return bound !== null && MEETS[m[1] ?? ""](compare(v, bound));
  });
}
