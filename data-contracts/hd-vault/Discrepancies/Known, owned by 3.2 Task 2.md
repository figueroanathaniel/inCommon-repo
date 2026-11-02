---
kind: discrepancy
layer: mechanics
source:
  - "app/inCommonApp v2.dc.html:17181 at 1c02c7c (designT fallback tP - 88.36)"
  - "app/inCommonApp v2.dc.html:19972 at 1c02c7c (hdProfile: missing Sun read as line 1 or 3)"
  - "app/hd-atlas.js:384 at 1c02c7c (normalizeProfile)"
verified: "listed, not re-derived (efficiency edit E3); the first one sized by reconcile.js section c"
status: checked
---
# Known, owned by 3.2 Task 2

Three faults already found and owned by assignment 3.2 Task 2 (honest chart).
Listed so this register is complete; not re-derived here.

| Fault | Site | Reader effect |
|---|---|---|
| `designT()` falls back to a flat 88.36 days when the arc solver is missing or unsolved, and says nothing | App:17181 | the design side is wrong for most charts on that path |
| `hdProfile()` turns a missing personality or design Sun into line 1 or line 3 | App:19972 | an invented profile |
| `HDAtlas.profileFor()` normalises an impossible pair (1/5, 6/1, 3/3) into a real profile | hd-atlas.js:384 | an invented profile, silently |

Sizing the first only, from reconcile.js section c over 2,000 births: with the
solver removed, the design side's gate or line changes in 1,983 charts and the
Type in 427. The path is reached only with arc-solver.js missing. On a real
chart the second and third cannot fire ([[Profile]] gives the reason).
