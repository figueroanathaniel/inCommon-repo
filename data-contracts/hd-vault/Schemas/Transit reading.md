---
kind: schema
layer: mechanics
source:
  - "app/hd-transit.js:101 at 1c02c7c (reading)"
  - "app/hd-transit.js:111 at 1c02c7c (split)"
  - "app/inCommonApp v2.dc.html:21733 at 1c02c7c (hdSkyNow)"
  - "app/inCommonApp v2.dc.html:21967 at 1c02c7c (gnowVals)"
verified: "run-module-tests X rows; reconcile.js section c (activations equal hdChart at both instants)"
status: checked
---
# Transit reading

What `HDTransit.reading(lonOf, ms, opts)` returns: the gates the sky stands in
at one minute.

| Field | Type | Range |
|---|---|---|
| `instant` | string | ISO 8601 UTC, floored to the start of the minute |
| `day` | string or null | `YYYY-MM-DD`, the civil day in `opts.timeZone` (or the device's zone) |
| `activations` | array of `{ body, gate, line }` | thirteen rows, the [[Activation]] transit shape |

`split(activations, chartGates)` returns `{ inside, outside }`, each a list of
`{ body, gate, line }` in the same declared order, split by whether the chart
holds the gate; a body with a null gate is in neither.

Not stored. The app keeps one reading per minute in memory (`this._gnow`), shared
by the gates now card and the Atlas sky ring. It carries no score, no count and
nothing about yesterday (X16, X17).
