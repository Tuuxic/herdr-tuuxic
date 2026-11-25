// Settings → Keyboard, the bar control (spec §3): which of tuuxic-bar's whistle bars shows, and
// the layout.show / layout.hide steps that pick one. Pure: main.js passes layout() and runs steps.

const UNDER = "tuuxic-whistle", FULL = "tuuxic-whistle-full";

// The choices, as Settings and the palette name them.
export const BAR_LABELS = [["under", "Under the terminals"], ["full", "Full width"], ["hidden", "Hidden"]];

function find(node, test) {
  if (!node || typeof node !== "object") return null;
  if (test(node)) return node;
  for (const child of node.children ?? []) {
    const found = find(child, test);
    if (found) return found;
  }
  return null;
}

// "under", "full" or "hidden"; null when the layout has no tuuxic-whistle blocks.
export function barChoice(layout) {
  const under = find(layout, (n) => n.id === UNDER), full = find(layout, (n) => n.id === FULL);
  if (!under && !full) return null;
  if (under && !under.hidden) return "under";
  if (full && !full.hidden) return "full";
  return "hidden";
}

// [command, args] pairs to run, in order, for a choice. Hide first so two bars never show.
export function barSteps(choice) {
  if (choice === "under") return [["layout.hide", { id: FULL }], ["layout.show", { id: UNDER }]];
  if (choice === "full") return [["layout.hide", { id: UNDER }], ["layout.show", { id: FULL }]];
  return [["layout.hide", { id: UNDER }], ["layout.hide", { id: FULL }]];
}

// Whether the layout has a `"mod": "whistle"` block (the anchor whistle runs in).
export const hasWhistleBlock = (layout) => Boolean(find(layout, (n) => n.content?.mod === "whistle"));
