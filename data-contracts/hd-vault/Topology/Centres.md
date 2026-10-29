---
kind: topology
layer: mechanics
source:
  - "app/hd-topology.js:37 at 1c02c7c (CENTERS)"
  - "app/inCommonApp v2.dc.html:15419 at 1c02c7c (HD_CENTERS)"
  - "app/inCommonApp v2.dc.html:19967 at 1c02c7c (BG_POS)"
  - "app/hd-atlas.js:144 at 1c02c7c (CENTERS, interpretation)"
verified: "reconcile.js section a; run-module-tests Y rows"
status: checked
---
# Centres

Nine centres. The names are the keys every module uses; there is no other id.

| Name (the key) | Motor | Awareness | Pressure | Gates (from [[Gates]]) |
|---|---|---|---|---|
| Head | | | yes | 61, 63, 64 |
| Ajna | | yes | | 4, 11, 17, 24, 43, 47 |
| Throat | | | | 8, 12, 16, 20, 23, 31, 33, 35, 45, 56, 62 |
| G | | | | 1, 2, 7, 10, 13, 15, 25, 46 |
| Heart | yes | | | 21, 26, 40, 51 |
| Spleen | | yes | | 18, 28, 32, 44, 48, 50, 57 |
| Sacral | yes | | | 3, 5, 9, 14, 27, 29, 34, 42, 59 |
| Solar Plexus | yes | yes | | 6, 22, 30, 36, 37, 49, 55 |
| Root | yes | | yes | 19, 38, 39, 41, 52, 53, 54, 58, 60 |

The four motors are the ones [[Type]] reads: `['Sacral', 'Heart', 'Solar
Plexus', 'Root']` in `hdChart()`. Which centres are motors is question C7 in
[[Tradition conventions]].

## Where the list is held

| Copy | Order | Layer |
|---|---|---|
| `HDTopology.CENTERS` | Head, Ajna, Throat, G, Heart, Spleen, Sacral, Solar Plexus, Root | mechanics |
| `HD_CENTERS` in the app | Head, Ajna, Throat, G, Heart, Sacral, Solar Plexus, Spleen, Root, with a function phrase | interpretation, inside the shell file |
| `BG_POS` in the app | the same nine as 2D boxes | shell (drawing) |
| `HDAtlas.CENTERS` | keyed by name, with label, colour and writing | interpretation |
| the 3D model order (`_hsModel.centres`) | Head, Ajna, Throat, G, Heart, Spleen, Solar Plexus, Sacral, Root | shell |

The orders differ and nothing reads an order as meaning; every lookup is by name.

## Defined and open

A centre is defined when a defined [[Channels|channel]] touches it, and open
otherwise. Nothing else defines a centre: a single gate (a hanging gate) does not.
The same rule is in `hdChart()`, `HDCircle.definedFor()` and the composite
definition in `HDComposite.composite()`; reconcile.js found them equal on all
2,000 charts.
