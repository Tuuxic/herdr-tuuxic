# Single mods support whistle without depending on it

Only the layout carries a whistle range and installs whistle as a dependency. A tuuxic-* mod installed alone has no whistle range in its mod.json and doesn't check whistle's version: it uses whistle when what it needs is there (`shared("whistle")`, keynav v2) and otherwise runs quietly without it. Version-checking in every mod would have meant a second meaning of "whistle range" and a release of every mod each time whistle moved, all for a person who chose one mod rather than the layout.

## Consequences

- A whistle release that changes what a mod relies on makes single mods drop whistle silently rather than refuse it; the layout's whistle range is what tells the person why.
- Feature detection has to probe the exact contracts each mod uses, not just whether whistle is present.
