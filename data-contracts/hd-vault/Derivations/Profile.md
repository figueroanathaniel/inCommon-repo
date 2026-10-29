---
kind: derivation
layer: mechanics
source:
  - "app/inCommonApp v2.dc.html:19972 at 1c02c7c (hdProfile)"
  - "app/hd-atlas.js:384 at 1c02c7c (normalizeProfile, profileFor)"
  - "app/inCommonApp v2.dc.html:25516 at 1c02c7c (oracleDossier: Profile pSun.line/dSun.line)"
verified: "reconcile.js section c: normalisation never fired over 2,000 charts; the geometric argument below"
status: checked
---
# Profile

The line of the personality Sun over the line of the design Sun. Reads
[[Activations]].

## As the app computes it

`hdProfile()` finds the personality and design Sun activations in
`hdChart().acts` and hands their lines to `HDAtlas.profileFor(c, u)`, which
normalises the pair into one of the twelve profiles and returns
`{ key: 'c/u', c, u, name, line, how }`.

`normalizeProfile`: the design line must be `c + 2` or `c + 3` (mod 6). If it is
not, it is moved to the nearer of the two.

## Why the normalisation never fires on a real chart

The design Sun is 88 deg behind, which is 88 / 0.9375 = 93.87 lines. Lines run
continuously round the wheel (384 lines, 64 x 6), so the design line is the
personality line minus 93.87 lines, which modulo 6 is plus 2.13: always `c + 2`
or `c + 3`. reconcile.js confirmed it on 2,000 charts. It fires only when a Sun
activation is missing, which is the known fault in
[[Known, owned by 3.2 Task 2]].

The Oracle dossier does not use `hdProfile()`; it reads the two Sun lines
directly. On a real chart the two agree. The published rule is question C9 in
[[Tradition conventions]].
