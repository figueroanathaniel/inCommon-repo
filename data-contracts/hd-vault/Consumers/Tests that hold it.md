---
kind: consumer
layer: shell
source:
  - "tools/run-module-tests.js at 1c02c7c (W, X, Y, C, G, B, N rows)"
  - "tools/check-astral-bodies.js at 1c02c7c"
  - "tools/check-hd-atlas-map.js at 1c02c7c"
  - "tools/check-layer-boundary.js at 1c02c7c"
  - "tools/check-timing-lexicon.js at 1c02c7c"
  - "app/handoff/tests-v6.0.js at 1c02c7c (G11d, N26b, N29 to N36)"
verified: "by reading the row lists"
status: checked
---
# Tests that hold it

| Gate | Holds |
|---|---|
| run-module-tests W rows | [[Gate and line]]: the wheel, the boundary rule |
| run-module-tests X rows | [[Transit reading]] |
| run-module-tests Y rows | [[Channels]]: topology equals the atlas |
| run-module-tests C rows | [[Composite row]] |
| run-module-tests G rows | [[Ground]] |
| run-module-tests B rows | [[Birth instant]] |
| run-module-tests N1 to N8 | [[Authority]] order, read from the app |
| check-astral-bodies.js | [[Positions]] against Horizons |
| check-hd-atlas-map.js | the HD tab to Atlas section map |
| check-layer-boundary.js | every module's layer |
| check-timing-lexicon.js | the lexicon's keys against the app and topology |
| harness N26b | hexagram N is gate N |

Not held by any test today, each a request to workstream 6 in the pull
request: thirteen activations per side (D-01), one gate name table (D-02), the
saved people instant (D-03, D-04), and that every authority entry lights a
centre (D-05).
