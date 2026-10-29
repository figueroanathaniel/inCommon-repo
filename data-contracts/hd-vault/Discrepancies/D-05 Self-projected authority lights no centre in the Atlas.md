---
kind: discrepancy
layer: interpretation
source:
  - "app/inCommonApp v2.dc.html:21657 at 1c02c7c (HD_AUTH_CENTRE: key self)"
  - "app/inCommonApp v2.dc.html:21774 at 1c02c7c (authOf splits on space, paren, colon)"
  - "app/hd-atlas.js:184 at 1c02c7c (AUTHORITIES: Self-projected (G))"
verified: "reconcile.js section d"
status: checked
---
# D-05 Self-projected authority lights no centre in the Atlas

**What differs.** `authOf(name)` takes the atlas entry's name up to the first
space, `(` or `:` and looks it up in `HD_AUTH_CENTRE`. "Self-projected (G)"
gives `self-projected`, and the table's key is `self`, so the lookup is
undefined and the G is not lit. Every other authority lights its centre
(Emotional the Solar Plexus, Sacral, Splenic the Spleen, Ego the Heart, Mental
the Ajna, Lunar none by design).

**Evidence.** Opening Authorities, Self-projected (G) in the Atlas: the wiring
lights nothing.

**Severity.** Cosmetic.

**Owner.** Workstream 3 (key the table `self-projected`, or split on the hyphen
too). Request to workstream 6: a row that every authority entry except Lunar
lights a centre.

**Fixed in d6e8000** (on `taskforce/03-refactor-features`). The table is keyed `self-projected`. R2 runs `authOf()` over every Atlas authority, and it fails on the code before.
