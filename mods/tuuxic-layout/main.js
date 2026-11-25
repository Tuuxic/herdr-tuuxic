// Tuuxic layout: carries the release record (mod.json, release.js) and the whistle range compare
// (range.js). Ships only with the layout. Herdr needs a view, so this one draws nothing and
// never shows ("place": "none").

import { View, div } from "gpui-kit";
import { VERSION } from "./release.js";

export default class Layout extends View {
  render() {
    return div().id(`tuuxic-layout-${VERSION}`);
  }
}
