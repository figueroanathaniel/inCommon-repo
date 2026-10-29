---
kind: consumer
layer: shell
source:
  - "app/inCommonApp v2.dc.html:21967 at 1c02c7c (gnowVals)"
  - "app/inCommonApp v2.dc.html:19439 at 1c02c7c (hdWeatherVals)"
verified: "run-module-tests X rows; by reading"
status: checked
---
# Gates now card

The card on Today and the Human Design Weather band: the sky's thirteen
activations this minute, split by the reader's gates.

| Value | From |
|---|---|
| the activations | `HDTransit.reading()` per minute ([[Transit reading]]) |
| the split | `HDTransit.split()` against `hdChart().gates` |
| whether to split | only for a birth date the reader gave (`usingSampleBirth()` false) |

Numbers only: body, gate, line. Shares the per minute memo with `hdSkyNow()`.
