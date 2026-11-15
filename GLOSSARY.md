# Tuuxic

A complete Herdr workspace: a sidebar with spaces and agents, a tab strip, framed terminals, a
side panel for files and changes, and whistle's bar. Herdr's own concepts (space, tab, pane,
agent) mean what they mean in Herdr; whistle's terms are in whistle's glossary.

## Window

**Top bar**:
The row across the top of the window with the logo, the space numbers, search and the
window buttons; hidden until shown.
_Avoid_: header, title bar

**Sidebar**:
The column on the left holding the spaces and the agents.
_Avoid_: left panel, navigator

**Rail**:
The sidebar narrowed to a strip of number badges and icons.
_Avoid_: collapsed sidebar, mini sidebar

**Tab strip**:
The row of tabs above the terminal area.
_Avoid_: tab bar, tabs row

**Terminal area**:
Where the selected tab's panes sit, each framed with its own header.
_Avoid_: main area, workspace, editor

**Side panel**:
The column on the right that shows Files, Changes or browser notes, one at a time; hidden
until opened.
_Avoid_: right panel, drawer, inspector

**Whistle's bar**:
Whistle's strip under the terminals, showing what has the keyboard and, with whistle mode on,
the mode badge.
_Avoid_: status bar, bottom bar, the bar

## Agents

**Working**:
An agent busy on its task.
_Avoid_: running, active

**Blocked**:
An agent that needs the person before it can go on.
_Avoid_: waiting, needs you, needs input, paused

**Done**:
An agent that finished its task.
_Avoid_: finished, complete

**Idle**:
An agent with nothing to do.
_Avoid_: inactive, stopped

## Keyboard

**Whistle mode**:
The setting that turns whistle on or off; off, whistle's bar only shows what has the keyboard.
_Avoid_: keyboard mode, whistle switch

## Releases

**Layout version**:
Tuuxic's own version, the one each release is tagged and published under; a release names the
mod versions and the whistle range it ships with.
_Avoid_: tuuxic version, release number

**Mod version**:
One tuuxic-* mod's own version, which moves on its own because each mod can be installed alone.
_Avoid_: package version

**Whistle range**:
The whistle versions a layout version allows; whistle outside it, or missing, leaves tuuxic
working without whistle and saying why.
_Avoid_: whistle dependency, pinned whistle

**Listing**:
An entry in herdr.dev's gallery: one folder of the repo that can be added on its own, either the
layout with every mod or a single mod.
_Avoid_: entry, package, gallery item
