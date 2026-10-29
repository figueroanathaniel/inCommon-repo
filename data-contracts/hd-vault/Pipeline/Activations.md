---
kind: pipeline
layer: mechanics
source:
  - "app/inCommonApp v2.dc.html:17189 at 1c02c7c (hdChart, collect)"
  - "app/inCommonApp v2.dc.html:23063 at 1c02c7c (hdGatesFor)"
  - "app/hd-transit.js:50 at 1c02c7c (BODIES, OPPOSITE)"
  - "app/hd-transit.js:73 at 1c02c7c (activations)"
  - "app/inCommonApp v2.dc.html:15404 at 1c02c7c (PLNS)"
verified: "reconcile.js section c: hdChart, hdGatesFor and HDTransit.activations agree on every one of 2,000 charts at both instants"
status: checked
---
# Activations

Each body at each of the two instants, as a gate and a line. This is the input
to everything in Derivations/. Previous: [[Gate and line]]. Shape:
[[Activation]].

## The two sides

| Side | Instant | Also called |
|---|---|---|
| personality | [[Birth instant]] | conscious, drawn black in the tradition |
| design | [[Design moment]] | unconscious, drawn red in the tradition |

## The bodies

The tradition activates thirteen points per side (question C6 in
[[Tradition conventions]]): Sun, Earth, Moon, North Node, South Node, Mercury,
Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto.

| Point | How the app gets it |
|---|---|
| Earth | Sun plus 180, derived in `hdChart()`, `hdGatesFor()` and `HDTransit` |
| South Node | North Node plus 180, derived in the same three places |
| the other eleven | `lonOf(name, t)` over `PLNS` |

**`PLNS` already contains `South Node`**, and `hdChart()` derives one more
from the North Node, so every side carries the South Node twice and fourteen
rows rather than thirteen. The two rows are identical (both are the mean node
plus 180). That is [[D-01 The South Node is activated twice]]. `HDTransit`
declares its own thirteen and is not affected; `hdGatesFor()` returns a set of
gate numbers, so the duplicate cannot show there.

## Three builders, one result

| Builder | Returns | Used by |
|---|---|---|
| `hdChart()` | the reader's chart, every activation as `{ body, kind, gate, line }` | the wiring, the readings, Today, the Oracle, the 3D stage |
| `hdGatesFor(p)` | a Set of gate numbers for any person, memoised on date, time, unknown flag, zone and offset | synastry composite, Circle, people-library |
| `HDTransit.activations(lonOf, ms)` | thirteen `{ body, gate, line }` at one instant, in a declared order | the gates now card, the Atlas sky ring |

reconcile.js section c, 2,000 births: `hdGatesFor` equals the `hdChart()` gate
set in 2,000 of 2,000; `HDTransit.activations` at the personality and the design
instant matches `hdChart()` in 2,000 of 2,000 each.

## One gate, two lines

1,999 of 2,000 charts hold at least one gate at two different lines (a slow
body, usually Uranus, Neptune, Pluto or the node, sits in one gate at both
instants). `hdChart().gates` keeps one line per gate, the first activation
found, which is the personality one: [[D-08 One line per gate in the gate list]].
