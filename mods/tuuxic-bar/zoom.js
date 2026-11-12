import { exec, layout } from "herdr";

function withNode(node, id, edit) {
  if (node?.id === id) return edit(node);
  if (!node?.children) return node;
  return { ...node, children: node.children.map((c) => withNode(c, id, edit)) };
}

// A zoomed pane gets a thicker frame, so a zoomed tab looks different.
export const ZOOM_BORDER = 4;

export async function setZoomBorder(zoomed) {
  const l = layout();
  if (!l) return;
  const width = zoomed ? ZOOM_BORDER : 2;
  const look = (b) => ({ ...b, width });
  const next = withNode(l, "main", (main) => {
    const pane = main.content.pane;
    return { ...main, content: { ...main.content, pane: { ...pane, border: look(pane.border), focus: look(pane.focus) } } };
  });
  await exec("herdr-app", ["do", "layout.set", JSON.stringify({ layout: next })]);
}
