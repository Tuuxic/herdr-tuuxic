#!/usr/bin/env bash
# Runs tuuxic's tests on Herdr's own engine, the way herdr-whistle v2.0.0 does: builds a
# throwaway test mod in a fresh temp folder and loads it with `herdr-app check`, once per suite.
# A failing case throws, so the check fails and lists every failure. Exits non-zero on failure.
#
#   1. `herdr-app check` on every mods/tuuxic-*/ mod, tuuxic-layout included.
#   2. Every tests/*.test.js suite, each in its own check (`check` interrupts a mod whose loading
#      runs longer than about half a second). A new suite file needs no change here: targeted
#      suites (whistle range compare, saved-key migration, Whistle mode row) import their
#      module from ./mods/<mod>/<file>.js, and every mods/tuuxic-*/*.js that imports neither
#      `herdr` nor `gpui-kit` is copied there.
#   3. scripts/release.sh, which the release workflow runs.
#   4. tests/*.test.mjs (node:test), when node is on PATH.
#
# The test mod holds tests/mod.json, every tests/*.js and texts.js, written here:
#   - default: the text of each repo file the suites read, by repo path (Markdown, layouts,
#     keys.json, themes, mod.json files, release.js, keynav.js copies, fixtures, workflows);
#   - files: every file in the repo (tracked or new, not ignored);
#   - since: what changed since the last v* tag: { tag, keysChanged, mods: { <mod>: { changed, old } } }.
# Suites read them from there: readTextFile is async, and `check` never sees an async failure.
#
# HERDR_APP picks the herdr-app to run (default: the one on PATH).
set -u
here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/.." && pwd)"
app="${HERDR_APP:-herdr-app}"
failed=()
i=0

dir="$(mktemp -d)"
trap 'rm -rf "$dir"' EXIT

# 1. Every tuuxic mod passes Herdr's own check.
for m in "$root"/mods/tuuxic-*/; do
  m="${m%/}"; i=$((i + 1))
  if out="$("$app" check "$m" 2>&1)"; then echo "PASS: herdr-app check ${m##*/}"
  else printf '%s\n' "$out" | sed 's/^/     /'; echo "FAIL: herdr-app check ${m##*/}"; failed+=("check:${m##*/}"); fi
done

# 2. The suites.
base="$dir/base"
mkdir "$base"
cp "$here/mod.json" "$here"/*.js "$base/"
# Pure modules of every mod, at mods/<mod>/<file> (a mod can't import from outside its folder).
for f in "$root"/mods/tuuxic-*/*.js; do
  [ -f "$f" ] || continue
  grep -qE "from[[:space:]]+[\"'](herdr|gpui-kit)[\"']" "$f" && continue
  d="$base/mods/$(basename "$(dirname "$f")")"
  mkdir -p "$d"; cp "$f" "$d/"
done

literal() { sed -e 's/\\/\\\\/g' -e 's/`/\\`/g' -e 's/\$/\\$/g' "$1"; }
(
  cd "$root" || exit 1
  list="$( { git ls-files --cached --others --exclude-standard 2>/dev/null || find . -type f ! -path './.git/*' | sed 's|^\./||'; } | sort -u)"
  echo 'export default {'
  printf '%s\n' "$list" | grep -E '\.md$|^layouts/[^/]+\.json$|^keys\.json$|^themes/[^/]+\.json$|^mods/[^/]+/(mod\.json|release\.js|keynav\.js)$|^tests/fixtures/|^\.github/workflows/' \
    | while IFS= read -r f; do
      [ -f "$f" ] || continue
      printf '  "%s": `' "$f"; literal "$f"; echo '`,'
    done
  echo '};'
  echo 'export const files = ['
  printf '%s\n' "$list" | sed 's/.*/  "&",/'
  echo '];'
  # What changed since the last v* tag (none: since.tag is null and the bump checks are skipped).
  tag="$(git describe --tags --abbrev=0 --match 'v*' 2>/dev/null || true)"
  if [ -z "$tag" ]; then echo 'export const since = { tag: null };'; exit 0; fi
  printf 'export const since = { tag: "%s", keysChanged: %s, mods: {\n' "$tag" \
    "$(git diff --quiet "$tag" -- keys.json && echo false || echo true)"
  for m in mods/tuuxic-*/; do
    m="${m%/}"; name="${m#mods/}"
    changed="$(git diff --quiet "$tag" -- "$m" && echo false || echo true)"
    old="$(git show "$tag:$m/mod.json" 2>/dev/null | sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' | head -1)"
    printf '  "%s": { changed: %s, old: %s },\n' "$name" "$changed" "$( [ -n "$old" ] && printf '"%s"' "$old" || echo null)"
  done
  echo '} };'
) > "$base/texts.js"

# One test mod per suite, checked JOBS at a time (default 1, as whistle's).
JOBS="${JOBS:-1}"
n=0
printf 'globalThis.loadStart = Date.now();\n' > "$base/t0.js"
for f in "$here"/*.test.js; do
  [ -f "$f" ] || continue
  one="$dir/run-$(printf '%03d' "$n")-$(basename "$f" .test.js)"
  cp -r "$base" "$one"
  printf 'import "./t0.js";\nimport s from "./%s";\nconsole.error(`load-ms ${Date.now() - globalThis.loadStart}`);\nexport default [s];\n' \
    "$(basename "$f")" > "$one/suites.js"
  n=$((n + 1))
done
if [ "$n" -gt 0 ]; then
  ls -d "$dir"/run-* | xargs -P "$JOBS" -I{} sh -c '
    "$1" check "$2" > "$2/out" 2>&1 || mv "$2/out" "$2/FAILED"
  ' sh "$app" {}
  for one in "$dir"/run-*; do
    ms="$(cat "$one/out" "$one/FAILED" 2>/dev/null | sed -n 's/.*load-ms \([0-9]*\).*/\1/p' | head -1)"
    echo "${ms:--} ${one##*/run-???-}"
  done | sort -rn | awk '{ all = all (NR > 1 ? ", " : "") $2 " " $1 } END { print "suite ms (of check'"'"'s ~500 ms load limit), slowest first: " all }'
  for one in "$dir"/run-*; do
    name="${one##*/run-???-}"; i=$((i + 1))
    if [ -f "$one/FAILED" ]; then
      failed+=("$name"); echo "FAIL $name"
      grep -v 'load-ms [0-9]' "$one/FAILED" | sed 's/^/     /'
    else echo "PASS $name"; fi
  done
fi

# 3. The release (.github/workflows/release.yml) through scripts/release.sh: the version it tags
# is tuuxic-layout's mod.json's, and its notes are that version's CHANGELOG entry, without the
# heading, up to the next entry (a `## ` line in a code fence isn't one).
release="$root/scripts/release.sh"
rel() { # rel <name> <wanted output> <release.sh args...>: output and exit 0, or "fails" for a non-zero exit
  local name="$1" want="$2" got st
  shift 2
  got="$(bash "$release" "$@" 2>/dev/null)"; st=$?
  i=$((i + 1))
  if [ "$want" = fails ] && [ $st -ne 0 ]; then echo "PASS: release: $name"; return; fi
  if [ "$want" != fails ] && [ $st -eq 0 ] && [ "$got" = "$want" ]; then echo "PASS: release: $name"; return; fi
  printf 'got (exit %s):\n%s\n' "$st" "$got"
  echo "FAIL: release: $name"
  failed+=("release:$name")
}
rel "the version is tuuxic-layout's mod.json's" \
  "$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$root/mods/tuuxic-layout/mod.json" 2>/dev/null | tr -d '\r' | head -1)" version
rel "notes are the version's entry" "$(tr -d '\r' < "$here/fixtures/release/notes-1.2.0.md")" notes 1.2.0 "$here/fixtures/release/CHANGELOG.md"
rel "the last entry's notes end at the file's end" "$(printf '### You\n\n- Older.')" notes 1.1.0 "$here/fixtures/release/CHANGELOG.md"
rel "a version without an entry fails" fails notes 9.9.9 "$here/fixtures/release/CHANGELOG.md"
i=$((i + 1))
if [ "$(bash "$release" notes "$(bash "$release" version 2>/dev/null)" 2>&1 | head -1)" = "### Upgrading" ]; then
  echo "PASS: release: CHANGELOG.md's notes for this version start with its Upgrading note"
else echo "FAIL: release: CHANGELOG.md has no notes for this version starting with ### Upgrading"; failed+=("release:changelog"); fi

# 4. node:test suites (tests/*.test.mjs), when node is here.
if ls "$here"/*.test.mjs >/dev/null 2>&1; then
  i=$((i + 1))
  if ! command -v node >/dev/null; then echo "SKIP: node:test suites (no node on PATH)"
  elif out="$(cd "$root" && node --test "$here"/*.test.mjs 2>&1)"; then echo "PASS: node:test suites"
  else printf '%s\n' "$out" | grep -E '^not ok|^# (pass|fail)|Error|expected|actual' | sed 's/^/     /'; echo "FAIL: node:test suites"; failed+=("node-test"); fi
fi

if [ ${#failed[@]} -eq 0 ]; then echo "PASS: tuuxic tests ($i checks)"; exit 0; fi
echo "FAIL: tuuxic tests (${#failed[@]} of $i checks: ${failed[*]})"
exit 1
