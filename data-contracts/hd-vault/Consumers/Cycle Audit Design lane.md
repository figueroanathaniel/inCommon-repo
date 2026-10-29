---
kind: consumer
layer: mechanics
source:
  - "app/inCommonApp v2.dc.html:26727 at 1c02c7c (cycleDesign)"
  - "app/inCommonApp v2.dc.html:26498 at 1c02c7c (cyLon)"
  - "app/inCommonApp v2.dc.html:26977 at 1c02c7c (cycleSceneModel)"
verified: "by reading; run-module-tests Z rows cover the passages"
status: checked
---
# Cycle Audit Design lane

`cycleDesign()` walks Saturn, Uranus, Neptune and Pluto (`CY_MOVERS`) through
the gates (`gateOf()` on `cyLon()`, the library asked directly) and keeps each
stay on a gate the reader holds (`hdChart().gates`) or on a gate that completes
a channel with one (`HD_CHANNELS`). Labels use `GATE_NAMES`. Fed to the widget,
the sheet and `cycle-scene.js` through `cycleSceneModel()`.
