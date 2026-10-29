---
kind: pipeline
layer: mechanics
source:
  - "app/hd-wheel.js:45 at 1c02c7c (gateLine)"
  - "app/hd-wheel.js:32 at 1c02c7c (START, GATE_DEG, LINE_DEG, WHEEL)"
  - "app/inCommonApp v2.dc.html:17158 at 1c02c7c (gateOf)"
  - "app/inCommonApp v2.dc.html:15416 at 1c02c7c (HD_WHEEL)"
verified: "reconcile.js section b: 362,001 longitudes and all 384 line starts, app, module and app fallback agree; run-module-tests W rows"
status: checked
---
# Gate and line

A longitude from [[Positions]] becomes a gate and a line. Next: [[Activations]].

## The rule

| Constant | Value |
|---|---|
| where gate 41 line 1 begins | 302 deg tropical ecliptic longitude (2 deg Aquarius) |
| gate width | 360/64 = 5.625 deg |
| line width | 5.625/6 = 0.9375 deg |
| order from 302 deg forward | `WHEEL` in hd-wheel.js, 64 entries, each once (W2) |

`gateLine(lon)`: `off = norm360(lon - 302)`, `i = floor(off / 5.625)` clamped to
0..63, `within = off - 5.625 i`, `line = floor(within / 0.9375) + 1` clamped to
1..6. Returns `{ gate: WHEEL[i], line, index: i, degreeInGate: within, gateStart }`.

**The boundary rule, stated once:** an edge belongs to the gate and the line
that begin there. Half open intervals `[start, end)` all the way round. 302.0 is
41.1; 301.999 is 60.6. The tradition does not settle this (question C3 in
[[Tradition conventions]]); it is a decision so that one longitude always gives
one answer. Both 5.625 and 0.9375 are exact binary fractions, so an exact edge
is computed exactly.

## Two copies, one answer

`gateOf(lon)` in the app calls `HDWheel.gateLine()` and returns `{ gate, line }`.
With hd-wheel.js missing it computes the same arithmetic from `HD_WHEEL`, the
app's own copy of the order.

reconcile.js section b, at 1c02c7c:

| Check | Points | Disagreements |
|---|---|---|
| every 0.001 deg from -1 to 361, app vs module | 362,001 | 0 |
| the same, app fallback vs module | 362,001 | 0 |
| all 384 line starts, and 1e-9 deg either side | 1,152 | 0 |
| `HD_WHEEL` equals `HDWheel.WHEEL` | 64 | equal |

Spot values: 302 is 41.1, 301.999 is 60.6, 0 and 360 and 720 are 25.2, -58 is
41.1, 302.9375 is 41.2 and 1e-9 below it is 41.1, 358.25 is 25.1 (gate 25
begins at 28 deg 15 min Pisces), 3.875 is 17.1 (gate 25 ends at 3 deg 52 min 30
sec Aries).

## Below the line

Colour, tone and base are not computed anywhere in the build. Their widths
(question C2) are recorded in [[Tradition conventions]] for 3.2's Color work.
