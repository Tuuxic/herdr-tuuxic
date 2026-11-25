// Tuuxic's release record (ADR 0003): the layout version, the oldest Herdr the layout and its
// mods run on, and the whistle range it is tested with. mod.json repeats all three for agents
// and other mods (a mod can't import JSON); a test fails if they drift apart. Bump them
// together with CHANGELOG.md at a release.

export const VERSION = "1.0.0";
export const MIN_HERDR = "0.1.15";
export const WHISTLE = ">=2.0.0 <3.0.0";
