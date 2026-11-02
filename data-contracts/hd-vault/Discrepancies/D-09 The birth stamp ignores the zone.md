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

**Fixed in f6b38fd.** The stamp now ends with the zone and the stored offset.
Nothing stores the stamp itself; it is derived each time a profile is read.
What moves once is every memo and slot keyed on it. A kept Oracle reading for
the current period is asked for again, and the server answers it from its own
copy, which is keyed on the dossier rather than the stamp. Older kept readings
age out under the cap of twelve. O8 holds the repair path, and it fails on the
code before.
