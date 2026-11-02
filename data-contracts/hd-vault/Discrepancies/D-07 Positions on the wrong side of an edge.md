---
kind: discrepancy
layer: mechanics
source:
  - "tools/check-astral-bodies.js at 1c02c7c (reports gate / line moved 2 / 23 of 19750)"
  - "tools/fixtures/astral-bodies-horizons.json at 1c02c7c"
verified: "boundary.js over the fixture; three instants fetched fresh from JPL Horizons (Astral body cross check)"
status: checked
---
# D-07 Positions on the wrong side of an edge

**What differs.** The ten bodies are within 0.03 deg of Horizons, but a body
that close to a gate or line edge can land on the other side of it. In the
fixture, 23 of 19,750 positions land in a different line from Horizons', and 2
of those in a different gate.

**Evidence.** Three of them, fetched fresh from Horizons (quantity 31, 500@399,
UT), in [[Astral body cross check]]: Venus on 1993-04-20 00:00 UTC is 3.87537 in
the app (gate 17.1) and 3.87484 at Horizons (gate 25.6); Neptune on 1971-02-12 is
34.3 against 34.4; Mercury on 1955-02-10 is 30.2 against 30.3.

**How many.** For a single position, 23 in 19,750 (0.12%). Nine of the 23 are
the Moon, all after 2075, where the app runs 0.012 to 0.021 deg ahead of
Horizons; the other fourteen are slower bodies within 0.0045 deg of an edge. Inside
1950 to 2010 there are five: Mercury 1955, Jupiter 1956, Neptune 1971, Venus
1993 and Neptune 2003.

**Reader surface.** A gate or line on the wiring, rarely.

**Severity.** Changes a gate or line. It is the precision limit of the ephemeris,
not a fault in the arithmetic; nothing short of a better ephemeris removes it.

**Owner.** Workstream 3 for 3.2's inspection panel (say when an activation sits
within the ephemeris's measured error of an edge, which is the honest version of
this), workstream 6 for a row naming the instants. No change to the positions.
