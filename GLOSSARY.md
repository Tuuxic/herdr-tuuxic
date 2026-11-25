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
One tuuxic-* mod's own version, kept because each mod can be installed alone; it changes only
in a layout release, and can differ from the layout version and from other mods'.
_Avoid_: package version

**Minimum Herdr**:
The oldest Herdr that the layout and all of its mods run on; one number for all of them.
_Avoid_: Herdr floor, required Herdr

**Whistle range**:
The whistle versions a layout version allows; whistle outside it, or missing, leaves tuuxic
working without whistle and saying why. Only the layout has one: a mod installed alone uses
whistle when it finds what it needs and otherwise goes without, with no range of its own.
_Avoid_: whistle dependency, pinned whistle

**Sandbox**:
A throwaway Herdr home in a window of its own, for trying a release without touching yours.
_Avoid_: test home, dev home

**Hand pass**:
The checks a person walks through in the sandbox before a release, beyond what CI covers.
_Avoid_: manual QA, smoke test

**Poster**:
The picture herdr.dev shows for tuuxic: the title and pitch beside a screenshot, with zooms on
the sidebar's spaces and agents.
_Avoid_: preview, preview image, screenshot

**Layout preview**:
The small schematic of the layout's blocks that the layout names as its own preview.
_Avoid_: preview, thumbnail
