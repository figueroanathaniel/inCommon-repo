---
kind: topology
layer: mechanics
source:
  - "app/hd-topology.js:51 at 1c02c7c (CENTER_OF)"
  - "app/hd-wheel.js:39 at 1c02c7c (WHEEL)"
  - "app/inCommonApp v2.dc.html:17594 at 1c02c7c (gateCenter)"
  - "app/inCommonApp v2.dc.html:19971 at 1c02c7c (hdCenterOf)"
  - "app/inCommonApp v2.dc.html:15417 at 1c02c7c (GATE_NAMES, interpretation)"
  - "app/hd-atlas.js:265 at 1c02c7c (GATES, interpretation)"
  - "app/iching.js:61 at 1c02c7c (HEX, interpretation)"
verified: "reconcile.js sections a and e"
status: checked
---
# Gates

Sixty four gates, numbered 1 to 64. **A gate is its number**: the number is the
mechanics, everything else about a gate is interpretation layered on it.

## Facts held about a gate (mechanics)

| Fact | Where | Checked |
|---|---|---|
| its place on the wheel | `HDWheel.WHEEL` index, `gateStart(gate) = 302 + 5.625 index` | [[Gate and line]] |
| its centre | `HDTopology.CENTER_OF[gate]` | equal to `HDAtlas.GATES[n][1]` and to the app's `gateCenter()` for all 64 |
| its channels | `HDTopology.channelsFor(gate)` | [[Channels]] |
| its six lines | 0.9375 deg each, 1 to 6 | [[Gate and line]] |

`gateCenter(g)` in the app finds a gate's centre by searching `HD_CHANNELS`;
every gate is in at least one channel, so it places all 64. `hdCenterOf(g)`
asks the atlas (which delegates to topology) and falls back to `gateCenter()`.

## Names (interpretation)

Two tables in the build name a gate, and they disagree on six gates:
[[D-02 Two gate name tables disagree on six gates]].

| Table | Read by |
|---|---|
| `GATE_NAMES` in the app | `hdChart().gates[].name`, the 3D tooltips, the Oracle dossier, the Cycle Audit's Design lane |
| `HDAtlas.GATES[n][0]` (`HDAtlas.gateName`) | the Atlas, Today's Human Design card, search |

`CLAUDE.md` records six gate names (2, 10, 29, 47, 61, 62) where inCommon
differs from the Celestial Codex on purpose. Those are a recorded choice, not a
fault, and are a different six from D-02.

**Hexagram N is gate N.** `iching.js` names each hexagram (1 The Creative, 41
Decrease); the Atlas folio quotes it as the gate's epigraph. That identity is
asserted over all 64 by harness row N26b.
