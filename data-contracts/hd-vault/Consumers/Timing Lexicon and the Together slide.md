---
kind: consumer
layer: interpretation
source:
  - "app/timing-lexicon.js:458 at 1c02c7c (GATE)"
  - "app/timing-lexicon.js:737 at 1c02c7c (GATE_LINE)"
  - "app/timing-lexicon.js:1127 at 1c02c7c (CHANNEL)"
  - "app/inCommonApp v2.dc.html:18240 at 1c02c7c (horoTogetherLexicon)"
verified: "tools/check-timing-lexicon.js reads its key sets from the app and hd-topology.js"
status: checked
---
# Timing Lexicon and the Together slide

Interpretation keyed by mechanics: `GATE[n]` (64), `GATE_LINE[n][0..5]` (384),
`CHANNEL[min-max]` (36). Keys are gate numbers, gate and line, and the topology
channel key, exactly the [[Chart address]] forms `gate:n`, `line:n.l` and
`channel:a-b`. Reads no ephemeris.
