// tuuxic-bar's whistle blocks (props `whistle: "under" | "full"`, or `corner: true`) and its hints
// overlay (props `part: "hints"`): the shell around whistlebar.js, which decides what shows. It
// reads whistle's public keys and draws; it never runs whistle's core or claims keys.

import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { shared, setShared, layout, focused, panes, run, openOverlay, closeOverlay, readTextFile, appHome } from "herdr";
import { barModel, hintsSpec, isCorner } from "./whistlebar.js";
import { HINTS_BOX, hintsColumns, keyWidth, labelWidth, columnWidth } from "./box.js";

const call = (f) => { try { return f(); } catch { return null; } };
const OVERLAY = "tuuxic-bar.hints-overlay";
// tuuxic's hints switch (Settings → Keyboard writes it): false hides the hints box.
export const HINTS_KEY = "tuuxic.whistle-hints";
// The last event seq any copy handled, so a new copy (one per layout change) goes on from there.
const SEEN = "tuuxic-bar.seen";

export class WhistleBlock {
  constructor(props, cx) {
    this.props = props ?? {};
    this.kept = { last: Number.isInteger(shared(SEEN)) ? shared(SEEN) : null, flash: null };
    this.box = undefined;
    this.size = null;
    this.installed = undefined;
    this.ui = undefined;
    cx.spawn(async (cx) => {
      this.installed = (await readTextFile(`${appHome()}/mods/whistle/mod.json`)) != null;
      this.ui = (await readTextFile(`${appHome()}/mods/whistle-ui/mod.json`)) != null;
      cx.notify();
    });
  }

  world() {
    const keynav = shared("keynav") ?? null;
    const entry = typeof keynav?.active === "string" ? `keynav.field:${keynav.active}` : null;
    return {
      installed: this.installed, props: this.props, size: this.size, viewport: this.viewport ?? null,
      layout: layout(), focused: focused(), panes: panes(), hintsOff: shared(HINTS_KEY) === false,
      shared: { keynav, ...(entry ? { [entry]: shared(entry) ?? null } : {}) }, ...this.kept,
    };
  }

  // The badge: whistle-ui's settings, or Settings → Keyboard without whistle-ui.
  openSettings() {
    if (this.ui !== false) run("whistle-ui.settings");
    else run("mod.open", { name: "tuuxic-settings", props: { section: "keyboard" } });
  }

  // Opens, replaces or closes the hints overlay after the drawing.
  sync(spec) {
    const sent = spec ? JSON.stringify(spec) : null;
    if (sent === this.box) return;
    const isLead = Boolean(spec);
    const wasLead = this.box !== undefined && this.box !== null;
    this.box = sent;
    if (!isLead && !wasLead) return;
    Promise.resolve().then(() => {
      const id = shared(OVERLAY) ?? null;
      if (id) { call(() => closeOverlay(id)); setShared(OVERLAY, null); }
      if (spec) { const nid = call(() => openOverlay(spec)); if (nid) setShared(OVERLAY, nid); }
    });
  }

  render(t) {
    this.viewport = call(() => globalThis.window?.viewport_size?.()) ?? this.viewport;
    const published = { whistle: shared("whistle"), hints: shared("whistle.hints"), events: shared("whistle.events"), config: shared("whistle.config") };
    const world = this.world();
    const out = barModel(published, world);
    if (out.last !== this.kept.last && out.last != null) Promise.resolve().then(() => setShared(SEEN, out.last));
    this.kept = { last: out.last, flash: out.flash };
    this.sync(hintsSpec(published, world));
    if (isCorner(this.props)) return div().id("tuuxic-whistle-corner").size_full();
    return renderBar(out.bar, t, (size) => { this.size = { width: size.width, height: size.height }; }, () => this.openSettings());
  }
}

// The bar: whistle-ui 2.0.0's, with tuuxic's filled green TYPE badge that opens the settings,
// and the key sequence with its group while one runs.
function renderBar(vm, t, onSize, onBadge) {
  const row = h_flex().id("tuuxic-whistle").size_full().bg(t.chrome).items_center().gap(10).text_size(11.5).on_size_change(onSize);
  const marker = vm.marker ? div().flex_none().pr(10).text_color(t.blocked).child(vm.marker) : div();
  if (vm.problem) return row.px(10).child(div().flex_1().min_w(0).truncate().text_color(t.blocked).child(vm.problem));
  if (!vm.badge) return row.pl(10).child(div().flex_1().min_w(0).truncate().text_color(vm.muted ? t.dim : t.muted).child(vm.label ?? "")).child(marker);
  const on = vm.badge === "WHISTLE";
  const badge = h_flex().id("tuuxic-whistle-mode").h_full().px(10).flex_none().items_center().font_bold().cursor_pointer()
    .bg(on ? t.accent : t.done).text_color(t.background).tooltip("Whistle settings")
    .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
    .on_click(onBadge)
    .child(vm.badge);
  const middle = vm.sequence
    ? h_flex().flex_1().min_w(0).gap(12).items_center().overflow_hidden()
      .child(div().flex_none().font_bold().text_color(t.accent).child(vm.sequence.keys))
      .child(div().flex_none().text_color(t.foreground).child(vm.sequence.title))
    : div().flex_1().min_w(0).truncate().text_color(t.muted).child(vm.label);
  return row.child(badge).child(middle).child(marker);
}

const { ROW, PAD, HEAD, GAP, ARROW, INNER } = HINTS_BOX;
const labelOf = (i) => (i.group ? `+${i.label}` : i.label);

// The hints box: whistle-ui 2.0.0's (title row, columns, +group).
export function renderHints(value, width, t) {
  const vm = value && value.v === 1 && Array.isArray(value.items) ? value : null;
  if (!vm) return div().size_full();
  const { columns } = hintsColumns(vm.items, width);
  const top = h_flex().h(HEAD).flex_none().px(PAD).gap(8).items_center()
    .child(div().font_bold().text_color(t.accent).child(vm.keys ?? ""))
    .child(div().text_size(11).font_medium().text_color(t.foreground).child(vm.title ?? ""))
    .child(div().flex_1())
    .child(div().text_size(11).text_color(t.dim).child(vm.exit ?? ""));
  return v_flex().id("tuuxic-whistle-hints").size_full().bg(t.chrome).border_1().border_color(t.accent).text_size(12)
    .child(top)
    .child(h_flex().flex_1().items_start().gap(GAP).px(PAD).pb(8)
      .children(columns.map((col) => v_flex().w(columnWidth(col)).flex_none()
        .children(col.map((i) => h_flex().h(ROW).gap(INNER).items_center()
          .child(div().w(keyWidth(col)).flex_none().font_bold().text_color(t.accent).child(i.key))
          .child(div().w(ARROW).flex_none().text_color(t.dim).child("→"))
          .child(div().w(labelWidth(col)).flex_none().whitespace_nowrap().text_color(i.group ? t.accent : t.foreground).child(labelOf(i))))))));
}
