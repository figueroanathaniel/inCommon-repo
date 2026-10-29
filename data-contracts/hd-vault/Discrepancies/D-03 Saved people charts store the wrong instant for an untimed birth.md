---
kind: discrepancy
layer: shell
source:
  - "app/people-library.js:152 at 1c02c7c (normalize: unknown time is 00:00 UTC)"
  - "app/people-library.js:60 at 1c02c7c (STATE_VERSION 3, and its comment above: noon where it happened)"
  - "app/inCommonApp v2.dc.html:13855 at 1c02c7c (peopleCompute: longitudes at the instant, gates through hdGatesFor with zone empty)"
verified: "reconcile.js section c2: 600 untimed people with zone America/New_York"
status: checked
---
# D-03 Saved people charts store the wrong instant for an untimed birth

**What differs.** For a person with no birth time, people-library.js normalises
the birth to 00:00 UTC. `peopleCompute()` takes `longitudes` at that instant, and
takes `gates` from `hdGatesFor()` with the zone blanked and the offset 0, which
draws noon at Greenwich. So one stored record holds longitudes and gates twelve
hours apart, and neither is noon where the person was born, which is what the
reader's own untimed chart draws and what the `STATE_VERSION` 3 comment says
the record holds.

**Evidence.** reconcile.js c2: for 600 untimed dates with zone New York, the
stored gate set differs from the reader-style chart (noon in New York) in 408;
the stored Sun differs by more than 0.2 deg from the Sun at 12:00 UTC (the
instant the gates were taken) in 600 of 600.

**Reader surface.** None today: [[computed_state]] is written once and read by
nothing ([[Saved people]]). The pair cache key (`chartHash`) uses the same
normalised instant, which only affects caching.

**Severity.** Changes a gate or line (the Moon above all), and can change a
channel, in data that is stored but not yet shown.

**Owner.** Workstream 1 (people-library.js storage, before 1.2 builds on it),
with workstream 3 for `peopleCompute()` in the app. The fix is to give the
stored record the same instant `BirthTime.instant()` gives the reader, and bump
`STATE_VERSION`.

**Fixed, the workstream 1 half, in f6b38fd** (on `taskforce/01-data-schema`).
`normalize()` asks birth-time.js for the instant, so an unknown time is stored
at noon where it happened, and `STATE_VERSION` is 4. P27 and P29 in
`tools/run-module-tests.js` hold it, and both fail on the code before. The app
half, `peopleCompute()` reading its gates at that same instant, is workstream
3's.

**The app half is fixed in d6e8000** (on `taskforce/03-refactor-features`). `peopleCompute()` reads the gates at the stored instant, and R4 holds it. With both halves applied, reconcile.js c2 reports 0 of 600 untimed, 0 of 1,535 summer and 0 of 1,535 winter births differing from the reader's chart. Schema merges before Features, so the halves land in order. On its own, the app half reads the gates at midnight at Greenwich.
