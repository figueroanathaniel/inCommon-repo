---
kind: derivation
layer: mechanics
source:
  - "app/inCommonApp v2.dc.html:17189 at 1c02c7c (hdChart: defined, adj, piece, parts)"
  - "app/inCommonApp v2.dc.html:17233 at 1c02c7c (HD_DEFINITION)"
  - "app/hd-circle.js:138 at 1c02c7c (definedFor)"
  - "app/hd-composite.js:112 at 1c02c7c (composite, definition)"
verified: "reconcile.js section f (2,000 charts) and f2 (100,000 random channel sets): 0 disagreements with an independent implementation written from this note"
status: checked
---
# Definition

How many separate pieces the defined centres fall into. Reads [[Activations]],
[[Channels]] and [[Centres]]; feeds [[Type]] (indirectly, through the same
graph) and the definition line on the wiring.

## The rule as the app computes it

1. The activated gate set is every gate on either side ([[Activations]]).
2. A channel is defined when both of its gates are in that set.
3. A centre is defined when a defined channel touches it.
4. Build a graph whose nodes are the defined centres and whose edges are the
   defined channels.
5. `parts` is the number of connected components of that graph.
6. `definition = HD_DEFINITION[min(parts, 4)]`.

| parts | Name (the text before the colon) |
|---|---|
| 0 | No Definition |
| 1 | Single Definition |
| 2 | Split Definition |
| 3 | Triple Split |
| 4 | Quadruple Split |

Four is the most the topology allows (nine centres, each piece at least two
centres); the `min` is a guard, not a cap that ever fires.

## Where else the same graph is built

`HDCircle.definedFor()` and `HDComposite.composite().definition` build the
defined centres by the same rule (steps 1 to 3) for a Circle member and for a
pair. They do not count parts. All three agree on the defined centres for every
one of 2,000 charts (reconcile.js section c).

## Measured

Over 2,000 births 1950 to 2010: 16 No Definition, 751 Single, 965 Split, 244
Triple, 24 Quadruple. The published rule is question C9 in
[[Tradition conventions]].
