---
kind: discrepancy
layer: mechanics
source:
  - "app/inCommonApp v2.dc.html:15404 at 1c02c7c (PLNS includes South Node)"
  - "app/inCommonApp v2.dc.html:17202 at 1c02c7c (North Node pushes a derived South Node, in hdChart collect)"
  - "app/hd-teachings.js:121 at 1c02c7c (personalityCount printed; designCount on the next line)"
verified: "reconcile.js section c: 2,000 of 2,000 charts carry 14 activations a side"
status: checked
---
# D-01 The South Node is activated twice

**What differs.** The tradition activates thirteen points per side
([[Activations]]); `HDTransit` declares thirteen. `hdChart()` produces fourteen:
it iterates `PLNS`, which contains `South Node` (asked of `lonRaw()`, mean node
plus 180), and when it reaches `North Node` it pushes a second South Node
(`gateOf(lon + 180)`). The two rows are identical.

**Evidence.** Any instant, for example 2000-01-01 12:00 UTC: `hdChart().acts`
has 28 rows; filtering `kind === 'personality'` gives 14, two of them
`South Node` with the same gate and line.

**How many.** 2,000 of 2,000.

**Reader surface.**
- The Chart reading says "that side carries 14 activations" for each side
  (hd-teachings.js:121 and 122, from `personalityCount` and `designCount`).
- The 3D model has two rows keyed `p:South Node` and two `d:South Node`.

No gate, channel, centre, Type or Authority changes: the duplicate is the same
gate.

**Severity.** Cosmetic, but it is a stated count that is wrong in the
tradition's own terms.

**Owner.** Workstream 3 (drop one of the two, most simply the
`if (n === 'North Node')` derivation, or `South Node` from the iteration). Request
to workstream 6: a row that `hdChart().acts` has thirteen per side.

**Fixed in d6e8000** (on `taskforce/03-refactor-features`). The North Node derivation is gone, so each side carries thirteen and the Chart reading says 13. R1 in `tools/run-module-tests.js` lifts the collect step out of the app and fails on the code before.
