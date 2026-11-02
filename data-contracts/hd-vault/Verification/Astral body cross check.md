---
kind: verification
layer: mechanics
source:
  - "tools/check-astral-bodies.js at 1c02c7c"
  - "tools/fixtures/astral-bodies-horizons.json at 1c02c7c"
  - "app/arc-solver.js:80 at 1c02c7c (designMoment)"
  - "app/lunar-mean-points.js:30 at 1c02c7c (meanNode)"
verified: "check-astral-bodies.js run at 1c02c7c (ok); four instants and six lunar element sets fetched fresh from the JPL Horizons API on 29 October 2026"
status: checked
---
# Astral body cross check

Task 4a of assignment 1.3. The positions every chart rests on, checked three
ways: the repository's own gate, fresh JPL Horizons fetches at instants that sit
on a gate or line edge, and the lunar node against Horizons' osculating elements.

## 1. The repository's gate

`node tools/check-astral-bodies.js` at 1c02c7c: **ok**. All ten bodies under the
0.03 deg ceiling against 19,750 Horizons positions from 1900 to 2100 (table in
[[Positions]]); the old series fails the ceiling on 9 of 10 bodies, so the gate
can go red; the four day grid is within 0.000294 deg of the library; 23 positions
land in a different line from Horizons, 2 of them in a different gate. Those 23
were listed with boundary.js (pull request) and are
[[D-07 Positions on the wrong side of an edge]].

## 2. Four public instants on an edge

Chosen from those 23 (and one built for the design side), so each has a body
within 0.01 deg of an edge. Fetched fresh from the Horizons API: observer
500@399, `QUANTITIES='31'` (ObsEcLon, apparent, ecliptic of date), `TIME_TYPE='UT'`,
`EXTRA_PREC='YES'`, ephemeris DE441 as Horizons reports it.

| Instant (UTC) | Body | App longitude | App gate.line | Horizons now | Horizons gate.line | App minus Horizons |
|---|---|---|---|---|---|---|
| 1993-04-20 00:00:00 | Venus | 3.87537 | 17.1 | 3.87484 | 25.6 | +0.00053 |
| 1971-02-12 00:00:00 | Neptune | 242.93576 | 34.3 | 242.94012 | 34.4 | -0.00436 |
| 1955-02-10 00:00:00 | Mercury | 326.37440 | 30.2 | 326.37595 | 30.3 | -0.00155 |
| 2000-04-19 18:45:00 | Sun (birth) | 30.00369 | 3.4 | 30.00371 | 3.4 | -0.00002 |

The fresh values equal the fixture's to five decimals for the first three, so the
fixture has not moved. The edges: Venus sits 0.00037 deg past 3.875 in the app and
0.00016 deg short of it at Horizons (the boundary between gate 25 and gate 17);
Neptune and Mercury straddle a line edge (242.9375, 326.375). In all three the
gate and line differ; in each the difference is inside the library's measured
error, which is the point of D-07.

**The design side of the fourth instant.** The app solves the design moment at
2000-01-22 17:39:20.742 UTC, Sun 302.00354, gate 41.1, 88.04559 days before, 14
iterations, residual 0.00015 deg. From Horizons' own Sun (30.0037131 at birth, so
the target is 302.0037131), interpolating Horizons' minute values gives
2000-01-22 17:39:30.573 UTC, between 302.0033532 (17:39) and 302.0040595
(17:40): gate 41.1 on both. The two design instants differ by 9.8 seconds, about 0.00012 deg of solar
motion, consistent with the app's 0.00015 deg residual and its 0.00002 deg at
birth. Both sides agree
on the gate and line, 0.0035 deg inside the edge at 302.

## 3. The lunar node

Not in the fixture. Six Horizons osculating element sets for the Moon (target
301, observer 500@399, `EPHEM_TYPE='ELEMENTS'`, ecliptic and mean equinox of
J2000, `TIME_TYPE='TDB'`), with OM carried to the ecliptic and true equinox of
date by IAU 2006 precession in longitude plus nutation, against the true node
estimator in reconcile.js (the osculating node from astronomy-engine's geocentric
Moon state vector, ecliptic of date):

| JD (TDB) | Horizons OM, J2000 | Of date | Estimator | Difference | App mean node |
|---|---|---|---|---|---|
| 2437000.5 | 175.2633 | 174.7069 | 174.7065 | -0.0005 | 175.2307 |
| 2440000.5 | 18.4747 | 18.0315 | 18.0496 | +0.0181 | 16.3679 |
| 2446231.5 | 48.0583 | 47.8516 | 47.8677 | +0.0161 | 46.4109 |
| 2449000.5 | 261.1893 | 261.0970 | 261.0858 | -0.0112 | 259.7904 |
| 2451545.0 | 123.9581 | 123.9542 | 123.9521 | -0.0020 | 125.0406 |
| 2455275.5 | 287.8565 | 288.0037 | 288.0157 | +0.0121 | 287.5051 |

The estimator holds Horizons' osculating node to 0.02 deg, close enough to size
[[D-06 Mean lunar node where the tradition may use the true node]]. The precession
step is approximate (it ignores the small tilt between the two ecliptics), which
is why the agreement is stated as 0.02 rather than closer. The mean node the app
draws is up to 1.9 deg from the true one.

## What these checks do not cover

The tertiary's corroboration of the four instants (P1, P2) has not been obtained:
see [[Tertiary log]]. No value above rests on it; every number here is from
Horizons directly.
