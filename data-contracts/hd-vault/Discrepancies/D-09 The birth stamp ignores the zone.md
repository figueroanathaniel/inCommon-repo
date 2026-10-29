---
kind: discrepancy
layer: shell
source:
  - "app/profile-manager.js:304 at 1c02c7c (birthStamp)"
  - "app/profile-manager.js:680 at 1c02c7c (reresolveLocations: changes the zone, keeps the coordinates)"
  - "app/inCommonApp v2.dc.html:25480 at 1c02c7c (oracleSlot keyed on birthStamp)"
  - "app/inCommonApp v2.dc.html:17190 at 1c02c7c (birthStamp, the hdChart memo)"
verified: "by reading; not run"
status: checked
---
# D-09 The birth stamp ignores the zone

**What differs.** `birthStamp` is `birth_date|birth_time|birth_lat|birth_lon|unknown`.
It does not carry `timezone` or `tz_offset`, yet the zone moves the
[[Birth instant]]. `reresolveLocations()` does exactly that for Puerto Rico
places saved under New York's zone: it changes the zone and keeps the
coordinates, so the stamp does not move.

**What it reaches.** The app clears its in session chart memo itself after that
repair, so the live chart is right. What keeps the old answer is anything stored
or memoised on the stamp alone: the kept Oracle reading on the device
(`incommon.p.<pid>.oracle`, slot `period|key|depth|birthStamp`), the Cycle Audit
scan for the year, `ProfileManager.getCalculations()`'s cache until it is
invalidated, and the 3D model key.

**Evidence.** By reading. A winter birth in San Juan moves an hour (the Moon about
half a degree) with the correction; a kept Oracle reading for the current period
still matches its slot.

**Severity.** Changes a gate or line in a stored reading, for the profiles the
zone repair touches (and any later zone only correction).

**Owner.** Workstream 1 (profile-manager.js owns `birthStamp`; adding the zone
invalidates every memo and kept reading once, which wants the storage migration
policy's review).
