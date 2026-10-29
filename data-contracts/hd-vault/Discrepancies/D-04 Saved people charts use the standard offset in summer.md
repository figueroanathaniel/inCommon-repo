---
kind: discrepancy
layer: shell
source:
  - "app/people-library.js:152 at 1c02c7c (normalize: Date.UTC minus tz_offset)"
  - "app/inCommonApp v2.dc.html:16258 at 1c02c7c (the app's note that the stored offset is the standard one)"
verified: "reconcile.js section c2: 1,535 summer and 1,535 winter births in New York, London and Sydney"
status: checked
---
# D-04 Saved people charts use the standard offset in summer

**What differs.** `normalize()` subtracts the stored `tz_offset`, which is the
zone's standard offset (the gazetteer keeps -5 for New York all year). The
reader's own chart asks Intl for the offset on the birth date. A summer birth is
therefore stored an hour late.

**Evidence.** reconcile.js c2: births given with the standard offset (-5 New
York, 0 London, +10 Sydney) at the same clock time, compared with the zone aware
`hdGatesFor()`: stored gates differ in 292 of 1,535 summer births and 8 of 1,535
winter births. All eight winter cases are dates when the zone was not on its
standard offset in January: seven in London in 1969 to 1971 (Britain kept summer
time all year from 1968 to 1971) and one in New York in January 1974 (the United
States ran daylight time through that winter).

**Reader surface.** None today, as [[D-03 Saved people charts store the wrong instant for an untimed birth]].

**Severity.** Changes a gate or line in stored data.

**Owner.** Workstream 1, with workstream 3; the same fix as D-03.
