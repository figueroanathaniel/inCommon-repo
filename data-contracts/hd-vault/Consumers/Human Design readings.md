---
kind: consumer
layer: interpretation
source:
  - "app/inCommonApp v2.dc.html:20176 at 1c02c7c (hdTeachings)"
  - "app/hd-teachings.js:556 at 1c02c7c (build)"
  - "app/hd-life.js:414 at 1c02c7c (gateSCOO)"
verified: "by reading"
status: checked
---
# Human Design readings

The reading deck under the wiring (My Type, Chart, Mood, Work, Sleep, and the
rest), composed by `hd-teachings.js` and `hd-life.js` from a summary the app
builds in `hdTeachings()`.

| Summary field | From |
|---|---|
| `type`, `strategy`, `authority` | `hdChart()` |
| `profileKey`, `profileName`, `profileHow`, `cLine`, `uLine` | `hdProfile()` |
| `defined`, `open` | `hdChart().defined` against the atlas centre names |
| `channelNames` | `hdChart().activeChannels` through `HDAtlas.channel` |
| `gateCount` | `hdChart().gates.length` |
| `personalityCount`, `designCount` | `hdChart().acts` filtered by side: **14 each today**, printed in the Chart reading as "that side carries 14 activations" ([[D-01 The South Node is activated twice]]) |
| `hangingNames` | gates whose channel partner is not activated |

The teachings modules compute no position and read no ephemeris.
