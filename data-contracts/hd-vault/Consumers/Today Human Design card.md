---
kind: consumer
layer: interpretation
source:
  - "app/inCommonApp v2.dc.html:17599 at 1c02c7c (dailyData)"
  - "app/inCommonApp v2.dc.html:21986 at 1c02c7c (todayVals: hdTxt)"
  - "app/inCommonApp v2.dc.html:18535 at 1c02c7c (hdSunRun)"
  - "app/inCommonApp v2.dc.html:22343 at 1c02c7c (dailyPopBase: the gate sheet)"
  - "app/inCommonApp v2.dc.html:22125 at 1c02c7c (alignGateOptions)"
verified: "by reading"
status: checked
---
# Today Human Design card

Today's Human Design line ("Gate 20.3, The Now, active in your Throat
center") and its sheet.

| Value | From |
|---|---|
| the sky's Sun gate and line | `gateOf()` on today's Sun |
| its centre | `gateCenter()` |
| whether the reader holds it, and a channel it would complete | `hdChart().gates`, `HD_CHANNELS` |
| how long the Sun stays in the gate | `hdSunRun()`, a day by day walk with `gateOf()` |
| the gate's name | `HDAtlas.gateName()` on the card, `GATE_NAMES` on the sheet ([[D-02 Two gate name tables disagree on six gates]]) |

The card's text falls back to the word "bodygraph" when the centre cannot be
named, which does not happen while `HD_CHANNELS` places all 64 gates.
