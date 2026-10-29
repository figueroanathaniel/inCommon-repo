---
kind: schema
layer: mechanics
source:
  - "app/inCommonApp v2.dc.html:17198 at 1c02c7c (collect, in hdChart: acts.push)"
  - "app/hd-transit.js:73 at 1c02c7c (activations)"
  - "app/inCommonApp v2.dc.html:29878 at 1c02c7c (_hsModel.acts)"
verified: "reconcile.js section c"
status: checked
---
# Activation

One body, on one side, in one gate and line. Produced by [[Activations]].

## In `hdChart().acts`

| Field | Type | Range | Notes |
|---|---|---|---|
| `body` | string | `Sun`, `Earth`, `Moon`, `Mercury`, `Venus`, `Mars`, `Jupiter`, `Saturn`, `Uranus`, `Neptune`, `Pluto`, `North Node`, `South Node` | `South Node` appears twice per side: [[D-01 The South Node is activated twice]] |
| `kind` | string | `personality`, `design` | the side |
| `gate` | integer | 1 to 64 | from [[Gate and line]] |
| `line` | integer | 1 to 6 | |

Not carried: the longitude, the instant, colour, tone, base. A screen that needs
the longitude asks `lonOf()` again.

Order: `PLNS` order with Earth after the Sun and the derived South Node after the
North Node, personality first, then design. Nothing reads the order as meaning.

## In `HDTransit.activations()` and `HDTransit.reading()`

`{ body, gate, line }`, thirteen rows in `HDTransit.BODIES` order (Sun, Earth,
Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, North Node,
South Node). `gate` and `line` are `null` when a body cannot be placed. No
`kind`: a transit has one instant. See [[Transit reading]].

## In the 3D model (`_hsModel.acts`)

`{ key, kind, body, glyph, gate, line, lon, tip }` where `key` is
`kind.charAt(0) + ':' + body` (`p:Sun`, `d:Moon`) and `lon` is the middle of the
activated line, not the body's longitude (a drawing position). Because of
D-01 the key `p:South Node` and `d:South Node` each occur twice.

## Produced and read

| Produced by | Read by |
|---|---|
| `hdChart()` | [[The wiring, 2D]], [[The wiring stage, 3D and Wheel]], [[Human Design readings]], [[Today Human Design card]], [[The Oracle]], [[Human Design Atlas]] (Cross gates) |
| `HDTransit` | [[Gates now card]], [[Human Design Atlas]] (the sky ring) |
