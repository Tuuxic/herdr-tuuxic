# Tuuxic draws whistle's bar and hints itself

Whistle 2.0 draws nothing: whistle-ui, shipped with whistle, is its stock bar, hints box and
settings dialog. Tuuxic 1.0 draws the bar and the hints box in tuuxic-bar instead, from
whistle's public keys (the whistle state, `whistle.hints`, `whistle.events`, `whistle.config`),
so they match tuuxic's look and keep what tuuxic's bar had before 1.0 and whistle-ui lacks: the
key sequence in the bar, a clickable mode badge, a hints on/off switch, two bar spots with a
Settings control between them, and messages that stay until the next key. Whistle-ui stays only
for its settings dialog, through one 0 px corner block with `hints: false` (only a showing
whistle-ui block opens that dialog).

## Consequences

- Tuuxic-bar tracks whistle's public contracts; a whistle major can break it. The whistle range
  and the static repo suite's whistle-contract checks cover that.
- Whistle's Install step 7 adds a whistle-ui bar to any layout with the anchor but no whistle-ui
  bar, so tuuxic's RECIPE tells the agent to skip step 7 for tuuxic's layout.
- Whistle-ui's looks change with whistle releases; tuuxic's don't follow them.
