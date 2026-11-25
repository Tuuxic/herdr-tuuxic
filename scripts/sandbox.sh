#!/usr/bin/env bash
# Try tuuxic (with whistle) in a Herdr home of its own, in a second Herdr window, without touching
# your own home (~/.config/herdr-app), for the release checklist's hand pass. Adapted from
# herdr-whistle v2.0.0's. Herdr picks its home from HERDR_APP_HOME; every command here sets it.
#
#   scripts/sandbox.sh reset [--tuuxic]   delete the sandbox, make a fresh home and open its window;
#                                         --tuuxic also copies this checkout's tuuxic in (mods,
#                                         layout, themes, keys.json merged) and, with WHISTLE_REPO
#                                         set to a herdr-whistle checkout, its whistle and whistle-ui
#   scripts/sandbox.sh open               open the sandbox window (the home must exist)
#   scripts/sandbox.sh close              close the sandbox window this script opened
#   scripts/sandbox.sh sync               copy this checkout's tuuxic mods, layout and themes into
#                                         the sandbox again
#   scripts/sandbox.sh agent [task]       start claude here with the sandbox as Herdr's home;
#                                         with no task, it installs tuuxic and whistle by RECIPE.md
#                                         and walks its Done when
#   scripts/sandbox.sh status             herdr-app status of the sandbox window
#   scripts/sandbox.sh path               print the sandbox folder
#
# Only the homes are apart: both windows show the same spaces, tabs and terminals (they run in
# hc), so test in a space of its own, and keys typed into a terminal reach that terminal.
# TUUXIC_SANDBOX picks the folder (default: ~/herdr-tuuxic-sandbox). Keep its path short: the
# window's socket lives in it, and Windows refuses a socket path of more than about 100 characters.
set -eu
repo="$(cd "$(dirname "$0")/.." && pwd)"
box="${TUUXIC_SANDBOX:-$HOME/herdr-tuuxic-sandbox}"
mark="$box/.tuuxic-sandbox"
die() { echo "sandbox: $*" >&2; exit 1; }
windows() { command -v cygpath >/dev/null; }
native() { if windows; then cygpath -w "$1"; else printf '%s\n' "$1"; fi; }
home_env() { HERDR_APP_HOME="$(native "$box")"; export HERDR_APP_HOME; }
running() { home_env; herdr-app status >/dev/null 2>&1; }
# Process ids of every Herdr window, yours too: the script only ever closes the one it opened.
app_pids() {
  if windows; then powershell -NoProfile -Command "(Get-Process herdr-app -ErrorAction SilentlyContinue).Id" | tr -d '\r'
  else pgrep -x herdr-app || true; fi
}

# The window's socket is <home>/herdr-app.sock; a path of 108 bytes or more (SUN_LEN) fails, and
# the window then opens but never answers status, so check before opening one.
short_enough() {
  sock="$(native "$box")/herdr-app.sock"
  [ "${#sock}" -lt 108 ] || die "$sock is ${#sock} characters; the socket path must be under 108. Set TUUXIC_SANDBOX to a shorter folder."
}

open_window() {
  [ -f "$mark" ] || die "no sandbox at $box; run: $0 reset"
  short_enough
  if running; then echo "The sandbox window is already open."; return; fi
  home_env
  before=" $(app_pids | tr '\n' ' ') "
  nohup herdr-app >/dev/null 2>&1 &
  disown
  for _ in $(seq 1 30); do running && break; sleep 1; done
  running || die "the sandbox window didn't answer within 30 s (herdr-app status)"
  # The new window's process: the one that wasn't there before (on Windows, $! is only bash's).
  for pid in $(app_pids); do case "$before" in *" $pid "*) ;; *) echo "$pid" > "$box/.pid" ;; esac; done
  echo "Sandbox window open, home $box"
}

close_window() {
  running || { echo "The sandbox window isn't open."; return; }
  [ -f "$box/.pid" ] || die "the window wasn't opened by this script; close it by hand"
  pid="$(cat "$box/.pid")"
  if windows; then taskkill //PID "$pid" >/dev/null 2>&1 || true; else kill "$pid" 2>/dev/null || true; fi
  for _ in $(seq 1 10); do running || break; sleep 1; done
  if running && windows; then taskkill //F //PID "$pid" >/dev/null 2>&1 || true; sleep 2; fi
  ! running || die "the sandbox window is still open; close it by hand"
  rm -f "$box/.pid"
  echo "Sandbox window closed."
}

copy_tuuxic() {
  mkdir -p "$box/mods" "$box/layouts" "$box/themes"
  for d in "$repo"/mods/tuuxic-*/; do
    m="$(basename "$d")"
    rm -rf "${box:?}/mods/$m"
    cp -r "$repo/mods/$m" "$box/mods/$m"
  done
  cp "$repo"/layouts/tuuxic.* "$box/layouts/"
  cp "$repo"/themes/*.json "$box/themes/"
  echo "Copied $repo's tuuxic mods, layout and themes into the sandbox."
}

# whistle and whistle-ui from a herdr-whistle checkout (WHISTLE_REPO), with their keys.
copy_whistle() {
  [ -n "${WHISTLE_REPO:-}" ] || { echo "WHISTLE_REPO not set: install whistle by RECIPE.md (scripts/sandbox.sh agent)."; return; }
  for m in whistle whistle-ui; do
    rm -rf "${box:?}/mods/$m"
    cp -r "$WHISTLE_REPO/mods/$m" "$box/mods/$m"
    echo "Copied $WHISTLE_REPO/mods/$m into the sandbox."
  done
  merge_keys "$WHISTLE_REPO/mods/whistle-ui/keys.json"
  merge_keys "$WHISTLE_REPO/keys.json"
}

# Adds each key of a keys.json ($1) to the sandbox's, section by section; a key the sandbox
# already binds keeps its binding (and is named). Like Install step 5, without asking.
merge_keys() {
  node -e '
    const fs = require("fs");
    const [from, to] = process.argv.slice(1);
    const add = JSON.parse(fs.readFileSync(from, "utf8"));
    const keys = fs.existsSync(to) ? JSON.parse(fs.readFileSync(to, "utf8")) : {};
    for (const [section, map] of Object.entries(add)) {
      keys[section] = keys[section] || {};
      for (const [key, action] of Object.entries(map)) {
        if (key in keys[section] && keys[section][key] !== action)
          console.log(`kept ${section} ${key}: ${keys[section][key]} (repo: ${action})`);
        else keys[section][key] = action;
      }
    }
    fs.writeFileSync(to, JSON.stringify(keys, null, 2) + "\n");
  ' "$(native "$1")" "$(native "$box/keys.json")"
  echo "Merged $1 into the sandbox's keys.json."
}


case "${1:-}" in
  reset)
    short_enough
    real="$(cd "$HOME/.config/herdr-app" 2>/dev/null && pwd || true)"
    [ "$(cd "$box" 2>/dev/null && pwd || true)" != "$real" ] || die "$box is your own Herdr home"
    if [ -e "$box" ]; then
      [ -f "$mark" ] || die "$box exists but isn't a sandbox (no .tuuxic-sandbox); not deleting it"
      if running; then close_window; fi
      rm -rf "${box:?}"
    fi
    mkdir -p "$box"; : > "$mark"
    open_window
    # Herdr writes its own keys.json and stock mods on the first start; tuuxic and whistle go in after.
    for _ in $(seq 1 30); do [ -f "$box/keys.json" ] && break; sleep 1; done
    if [ "${2:-}" = "--tuuxic" ]; then copy_tuuxic; merge_keys "$repo/keys.json"; copy_whistle; fi
    ;;
  open) open_window ;;
  close) close_window ;;
  sync) [ -f "$mark" ] || die "no sandbox at $box"; copy_tuuxic ;;
  agent)
    [ -f "$mark" ] || die "no sandbox at $box; run: $0 reset"
    home_env
    shift
    task="${*:-Install tuuxic from $(native "$repo") by its RECIPE.md (whistle as RECIPE.md says), then walk its Done when and report each item.}"
    exec claude "You work on a test Herdr home: $(native "$box"). HERDR_APP_HOME is set to it, so herdr-app talks to its window. Wherever RECIPE.md or Herdr's docs say Herdr's home or ~/.config/herdr-app, use that folder. Never read or change ~/.config/herdr-app itself. Its window shows the same spaces and terminals as the person's own window: never type into, close or kill a terminal you didn't start.
$task"
    ;;
  status) home_env; herdr-app status ;;
  path) echo "$box" ;;
  *) sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
