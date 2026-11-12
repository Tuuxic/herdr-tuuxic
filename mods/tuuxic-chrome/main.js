import { View, div, image, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { theme, run, props, window, shared, setShared, updates, layout, nextCommand } from "herdr";
import { announce, isActive, entered, move } from "./keynav.js";
import { lookFor, canOpen, openMod } from "./opens.js";

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

// Keyboard navigation (keynav.js): while a driver such as whistle selects the footer menu, it
// glows and j/k move a cursor over its rows; enter or l opens the one under it.
const MOD = "tuuxic-chrome";
// How this mod shows its keynav field: the field glows, its cursor item gets an outline.
const glow = (t) => t.foreground + "b3";
const frame = (t) => div().absolute().top(0).left(0).right(0).bottom(0).border_2().border_color(glow(t));
// One step through a list of ids, stopping at the ends.
function step(ids, cur, d) {
  if (!ids.length) return null;
  const i = ids.indexOf(cur);
  return ids[i < 0 ? 0 : Math.max(0, Math.min(ids.length - 1, i + d))];
}
// The footer's rows: id, what opens it.
const FOOTER = [["settings", "tuuxic-settings"], ["keys", "tuuxic-keys"], ["mods", "tuuxic-mod-manager"]];

// The sidebar's rail goes by its width, not a flag: dragging its edge narrows it too.
const narrow = () => (find(layout(), "sidebar")?.size?.px ?? Infinity) < 160;

// To the rail (on macOS wide enough for the traffic lights), or back to the width it had.
function toggleSidebar() {
  const width = find(layout(), "sidebar")?.size?.px;
  if (!narrow()) setShared("sidebar.width", width);
  // Mods edited before the rail went by width still read the flag.
  setShared("sidebar.collapsed", !narrow());
  run("layout.resize", { id: "sidebar", px: narrow() ? (shared("sidebar.width") ?? 268) : window()?.platform === "macos" ? 76 : 44 });
}

export default class WorkspaceChrome extends View {
  init(_props, cx) {
    lookFor(["tuuxic-settings", "tuuxic-keys", "tuuxic-mod-manager", "tuuxic-picker"], cx);
    if (props()?.footer) cx.spawn(async (cx) => { for (;;) { this.keynav(move(await nextCommand())); cx.notify(); } });
  }
  // A keynav move while the footer menu is the active field.
  keynav(m) {
    if (!m || !isActive(this.key)) return;
    const rows = FOOTER.filter(([, mod]) => canOpen(mod));
    const ids = rows.map(([id]) => id);
    if (m === "down" || m === "up") this.cursor = step(ids, this.cursor, m === "down" ? 1 : -1);
    else if ((m === "open" || m === "right") && this.cursor) openMod(rows.find(([id]) => id === this.cursor)[1]);
  }
  button(id, label, action) {
    const t = theme();
    return div().id(id).size(26).flex_none().flex().items_center().justify_center().rounded(0).text_color(t.muted).hover(s => s.bg(t.hover).text_color(t.foreground))
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_click(action).child(label);
  }
  // Between the rail and 160px the lists draw the rail stretched; once a drag rests there, snap to the nearer one.
  snap(cx) {
    const width = find(layout(), "sidebar")?.size?.px, rail = window()?.platform === "macos" ? 76 : 44;
    if (this.snapping || !(width > rail && width < 160)) return;
    this.snapping = true;
    cx.timer.after(400, (cx) => {
      this.snapping = false;
      if (find(layout(), "sidebar")?.size?.px !== width) return this.snap(cx);
      setShared("sidebar.collapsed", width < 100);
      run("layout.resize", { id: "sidebar", px: width < 100 ? rail : 160 });
    });
  }
  render(cx) {
    const t = theme();
    const collapsed = narrow();
    if (props()?.footer) {
      this.key = announce(MOD, props(), "Menu");
      if (entered(this, this.key)) this.cursor = "settings";
      this.keyOn = isActive(this.key);
      this.snap(cx);
      const row = (id, icon, label, dim, action) => h_flex().id(id).h(26).px(8).gap(9).items_center()
        .when(collapsed, el => el.size(30).px(0).justify_center().relative().tooltip(label)).rounded(0).border(1)
        .border_color(this.keyOn && this.cursor === id ? glow(t) : t.foreground + "00")
        .text_color(dim ? t.dim : t.muted).hover(s => s.bg(t.foreground + "14").border_color(t.foreground + "40").text_color(t.foreground)).cursor_pointer()
        .on_click(action).child(svg(`mods/tuuxic-icons/${icon}.svg`).size(14))
        .when(!collapsed, el => el.child(label));
      return v_flex().relative().size_full().justify_center().bg(t.chrome)
        .when(this.keyOn, el => el.child(frame(t))).px(collapsed ? 0 : 10).py(collapsed ? 4 : 10).gap(2).when(collapsed, el => el.items_center()).text_size(12)
        .child(row("settings", "settings", "Settings", false, () => openMod("tuuxic-settings"))
          .when(Boolean(updates().app.ready), el => el.child(div().size(6).rounded(0).bg(t.accent).when(collapsed, d => d.absolute().top(2).right(2)))))
        .child(row("keys", "keyboard", "Keybindings", false, () => openMod("tuuxic-keys")))
        // Add machine lives in Settings → Machines. Herdr has no Mods screen of its own.
        .when(canOpen("tuuxic-mod-manager"), el => el.child(row("mods", "layers", "Mods", false, () => openMod("tuuxic-mod-manager"))));
    }
    // The sidebar's brand row (Herdr's workspace-chrome header), with search opening tuuxic-picker.
    // On the rail it's just the Herdr logo, centered, and a click on it unfolds the sidebar.
    const mac = window()?.platform === "macos";
    return h_flex().size_full().bg(t.chrome).pl(collapsed ? 0 : 14).pr(collapsed ? 0 : 10).gap(4).items_center().text_size(13.5)
      .when(collapsed, el => el.justify_center())
      .when(mac && !window()?.fullscreen && !collapsed, el => el.pl(76))
      .when(!collapsed, el => el.child(h_flex().flex_1().gap(8).items_center().child(image("frame/welcome/herdr.png").size(20).rounded(5)).child(div().font_semibold().text_color(t.foreground).child("Herdr"))))
      .when(!collapsed, el => el.child(this.button("search", svg("mods/tuuxic-icons/search.svg").size(15), () => openMod("tuuxic-picker"))))
      .when(!collapsed, el => el.child(this.button("sidebar-toggle", svg("mods/tuuxic-icons/sidebar.svg").size(15), toggleSidebar)))
      // On the macOS rail the traffic lights fill the row; the agents list's » unfolds it.
      .when(collapsed && !mac, el => el.child(this.button("sidebar-expand", image("frame/welcome/herdr.png").size(20).rounded(5), toggleSidebar).tooltip("Expand sidebar")));
  }
}
