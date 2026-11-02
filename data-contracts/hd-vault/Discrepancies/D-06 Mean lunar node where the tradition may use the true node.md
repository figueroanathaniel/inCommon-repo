---
kind: discrepancy
layer: mechanics
source:
  - "app/inCommonApp v2.dc.html:16417 at 1c02c7c (meanLunarNodeOf)"
  - "app/lunar-mean-points.js:30 at 1c02c7c (meanNode)"
verified: "reconcile.js section g; the true node estimator checked against JPL Horizons osculating lunar elements (Astral body cross check)"
status: disputed
---
# D-06 Mean lunar node where the tradition may use the true node

**What differs.** The app's North Node is the mean node (Meeus, plus nutation).
Whether the tradition's own software uses the true (osculating) node or the mean
one is question C4, not yet answered from a primary source
([[Tradition conventions]]). Secondary sources read for this note say the true
node: one vendor's documentation states that professional Human Design tools use
the true node and that some free calculators use the mean one. That is not the
original publisher's word, so this note is **disputed** until C4 comes back with
a citation that has been opened and read.

**Evidence.** reconcile.js g, 2,000 births 1950 to 2010, mean node against a true
node computed from astronomy-engine's Moon state vector (checked against Horizons
to 0.02 deg):

| Measure | Result |
|---|---|
| worst separation | 1.896 deg |
| personality North Node in a different gate | 357 (17.9%) |
| same gate, different line | 1,230 |
| any node activation changes, either side | 1,784 |
| defined channels change | 358 |
| **Type changes** | **89 (4.5%)** |
| Authority changes | 89 |

**Reader surface.** The node gates on the wiring, every channel and centre they
complete, and in 89 of 2,000 charts the Type and Authority.

**Severity.** Changes a Type or Authority, if the tradition uses the true node.

**Owner.** A convention decision for the owner, informed by C4 and the Human
Design reviewer (D1). The implementation would be workstream 3 (a true node in
`lonRaw()`, measured against Horizons the way the ten bodies are), and the test
row workstream 6.
