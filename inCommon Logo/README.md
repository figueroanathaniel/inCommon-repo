# The mark

Two circles and the lens they share. It says one thing: a whole is a whole,
and what two of them have in common is a third thing that belongs to neither
alone. That is also the argument the app makes about a birth chart, a number
and a design.

```
rings   #8b5cf6      shared lens  #2fff8f
field   #0B0910      wordmark     #F4F2FA
```

Violet carries the two wholes. **Green is reserved for what they share** and
is never decoration: in the icon set it appears only where a screen is
genuinely about an overlap.

## What is here

`identity/` — the three identity sheets, exported 2026-08-18: the primary
mark, the horizontal lockup, and the app icon at four sizes plus the mono
variant. The mark holds at favicon size because the lens reads as one green
point of light.

`icons/icon-192.png`, `icon-512.png`, `splash.png` — the PWA assets, the only
copies in the source tree. `app/manifest.json`, `app/sw.js` and the app helmet
all reach them by `../inCommon%20Logo/icons/`. Keep the space escaped, and
rename this folder only by rewriting all three together.

`icons/*.svg`, `_set.svg`, `icons.json` — the app's own icon set, fifteen
glyphs plus a contact sheet and a table. **Generated.** Do not hand-edit them:

```bash
node tools/build-ui-icons.js
```

Rerunning that reproduces all sixteen files byte for byte, which is not true
of a manual export and is the whole reason they are drawn from a definition.
`tools/build-icons.js` does the same for the PWA PNGs, rasterising the mark
from its analytic shape so the icons can never drift from the mark the app
draws on its own boot screen.

## The copies under deploy/

`deploy/v1.7/` carries its own `icon-192.png`, `icon-512.png` and
`splash.png`. Those are build output, not a fork: a deploy directory is
uploaded whole and has to stand alone. When the mark changes, rerun the
generators and rebuild the bundle rather than editing the bundle's copies.
`deploy/v1.7/index.html` also carries the mark inline, as an SVG data URI
favicon.

## The mark this replaced

A gold-ringed violet orb, retired 2026-08-18. It is in
`../../Archive 8-26/2026-08-04 v1.4.2/`. Anything still showing it is looking
at a stale build.

The colour rules that govern the mark are in `CLAUDE.md` under "Colour rules
that are not negotiable", and `app/components/Palette Decision.dc.html`
records why each was chosen.
