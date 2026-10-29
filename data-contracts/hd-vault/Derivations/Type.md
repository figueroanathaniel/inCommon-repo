---
kind: derivation
layer: mechanics
source:
  - "app/inCommonApp v2.dc.html:17189 at 1c02c7c (hdChart: seen, motors, motorThroat, sacral, type)"
  - "app/inCommonApp v2.dc.html:15420 at 1c02c7c (HD_STRATEGY)"
  - "app/inCommonApp v2.dc.html:21655 at 1c02c7c (HD_TYPE_LIGHT, interpretation)"
verified: "reconcile.js sections f and f2: 0 disagreements over 2,000 charts and 100,000 random channel sets against an independent implementation written from this note"
status: checked
---
# Type

Reads the defined centres and the defined-channel graph from [[Definition]].
Feeds [[Strategy]] and a good part of every reading.

## The rule as the app computes it

Let *defined* be the defined centres, and let *throat piece* be every centre
reachable from the Throat through defined channels (empty when the Throat is
open). The motors are Sacral, Heart, Solar Plexus and Root. *Motor to Throat*
means the Throat is defined and its piece contains a motor.

| Order | Condition | Type |
|---|---|---|
| 1 | no centre defined | Reflector |
| 2 | Sacral defined and motor to Throat | Manifesting Generator |
| 3 | Sacral defined | Generator |
| 4 | motor to Throat | Manifestor |
| 5 | otherwise | Projector |

`hdChart()` computes the Throat's reach with a breadth first walk from the
Throat over the defined-channel graph (`seen`). The Sacral itself counts as the
motor when it reaches the Throat, directly by 20-34 or through the G, the
Spleen or another centre.

The published rule is question C7 in [[Tradition conventions]].

## Measured

Over 2,000 births: Manifesting Generator 692, Generator 716, Projector 412,
Manifestor 164, Reflector 16.

## What else moves a Type

| Cause | Charts of 2,000 whose Type changes | Note |
|---|---|---|
| the 88.36 day fallback in place of the solved arc | 427 | [[Known, owned by 3.2 Task 2]] |
| the true node in place of the mean node | 89 | [[D-06 Mean lunar node where the tradition may use the true node]] |
| the position error against Horizons | not measured per chart; 2 gate and 23 line flips in 19,750 single positions | [[D-07 Positions on the wrong side of an edge]] |
