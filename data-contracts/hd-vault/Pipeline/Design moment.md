---
kind: pipeline
layer: mechanics
source:
  - "app/inCommonApp v2.dc.html:17181 at 1c02c7c (designT)"
  - "app/arc-solver.js:80 at 1c02c7c (designMoment)"
  - "app/arc-solver.js:55 at 1c02c7c (solve)"
verified: "reconcile.js section c: 2,000 births, 0 unsolved, 86.599 to 92.010 days, measured arc 87.999722 to 88.000278 deg; one case against a fresh JPL Horizons fetch (Astral body cross check)"
status: checked
---
# Design moment

The second instant a chart is read at: the moment the Sun stood 88 degrees of
ecliptic longitude before its place at birth. Previous: [[Birth instant]]. Next:
[[Positions]] at that instant, then [[Activations]].

## How the app gets there

`designT(tP)` calls `ArcSolver.designMoment(t => lonOf('Sun', t), tP)`:

1. target = `norm360(Sun(tP) - 88)`, with `arc` 88 unless overridden.
2. bracket `[tP - 96, tP - 83]` days.
3. bisection on the signed separation in (-180, 180], stopping when the
   residual is at or under one arcsecond (1/3600 deg) or the bracket is under
   1e-9 days, at most 80 halvings.
4. returns `{ t, target, solved, iterations, residual, daysBefore }`.

If the solver is missing or the bracket holds no crossing, `designT()` returns
`tP - 88.36`, the flat fallback. That fallback is a known fault owned by 3.2
Task 2: [[Known, owned by 3.2 Task 2]].

## Measured (reconcile.js, 2,000 births 1950 to 2010)

| Quantity | Result |
|---|---|
| unsolved | 0 |
| days before birth | 86.599 to 92.010 |
| worst residual | 0.000278 deg (inside the one arcsecond tolerance) |
| arc actually measured, Sun(tP) minus Sun(tD) | 87.999722 to 88.000278 deg |

The residual tolerance is one arcsecond, 1/3375 of a line: a design Sun that
sits within an arcsecond of a line edge can land either side of it. One case
was checked against Horizons in [[Astral body cross check]].

## Fields for the inspection panel (3.2 Task 3)

| Field | Type | Unit or form | Where |
|---|---|---|---|
| design instant | Date | ISO 8601 UTC | `designMoment().t` through `t2000` inverse |
| solar arc solved to | number | degrees, the target is 88 | `opts.arc`, and `Sun(tP) - Sun(tD)` measured |
| residual | number | degrees | `designMoment().residual` |
| iterations | integer | halvings, 0 to 80 | `designMoment().iterations` |
| days before birth | number | days | `designMoment().daysBefore` |
| solved | boolean | false means the 88.36 day fallback drew the design side | `designMoment().solved`; `designT()` does not return it today |

`designT()` returns only `t`, so a screen cannot currently tell a solved design
moment from the fallback. 3.2 Task 2 owns surfacing that.
