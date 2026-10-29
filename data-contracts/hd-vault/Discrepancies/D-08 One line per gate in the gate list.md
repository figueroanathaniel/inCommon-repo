---
kind: discrepancy
layer: mechanics
source:
  - "app/inCommonApp v2.dc.html:17228 at 1c02c7c (gates, in hdChart: acts.find, first activation)"
  - "app/inCommonApp v2.dc.html:27322 at 1c02c7c (acts.find, in hdSelOf for g:)"
verified: "reconcile.js section c: 1,999 of 2,000 charts hold some gate at two lines"
status: checked
---
# D-08 One line per gate in the gate list

**What differs.** `hdChart().gates` has one row per activated gate, with the line
and body of the first activation found, which is the personality one. When the
same gate is activated at two lines (usually a slow body or the node, in one gate
at both instants), the other line is not in the list. `hdSelOf('g:<n>')` does the
same.

**How many.** 1,999 of 2,000 charts have at least one such gate.

**Reader surface.** The Activated Gates list and a gate's detail sheet show one
line; the wiring and the 3D stage, which read `acts`, show both.

**Severity.** Cosmetic: no gate, channel or centre changes, but a line the reader
holds is missing from the list.

**Owner.** Workstream 3 (list `acts`, or carry every line on the gate row).
