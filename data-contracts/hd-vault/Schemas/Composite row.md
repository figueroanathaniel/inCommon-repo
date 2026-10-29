---
kind: schema
layer: mechanics
source:
  - "app/hd-composite.js:112 at 1c02c7c (composite)"
  - "app/inCommonApp v2.dc.html:23459 at 1c02c7c (compositeFor)"
  - "app/pair-cache.js:137 at 1c02c7c (openOne)"
verified: "run-module-tests C rows; reconcile.js section c (self composite definition equals hdChart defined)"
status: checked
---
# Composite row

`HDComposite.composite(gatesA, gatesB, opts)` classifies each of the 36
[[Channels]] for two people. Input is two gate sets (arrays, Sets, or
`{ gate }` rows); the app passes `hdGatesFor(me)` and `hdGatesFor(other)`.

## The returned object

| Field | Type |
|---|---|
| `electromagnetic`, `companionship`, `dominance`, `compromise`, `sharedGate`, `absent` | arrays of rows |
| `counts` | one integer per state, and `total` (always 36) |
| `definition` | `{ channels: [key], centers: [name], channelCount }`, what the two define together |
| `precision` | `{ full, who, note }` from the two time states |
| `identical` | boolean, the two gate sets are equal |

## A row

| Field | Type | Present on |
|---|---|---|
| `key` | string, `min-max` | every row |
| `gates` | `[a, b]` | every row |
| `centers` | `[centreA, centreB]` | every row |
| `state` | `{ a, b, aGate, bGate }`, each side `BOTH`, `ONE` or `NONE` | every row |
| `type` | one of the six | every row |
| `fact` | one sentence naming both people | every row |
| `brings` | `{ a: gate, b: gate }` | electromagnetic |
| `gate` | integer | sharedGate |
| `holder`, `other`, `holderName`, `otherName`, `caution` | strings | dominance, compromise |
| `sharedGate` | integer | compromise |

No score, no percentage, no rank (C24 to C26). `fact` and `caution` are the only
sentences; the screen no longer draws `caution` (CLAUDE.md, "No disclaimers").

## Cached

`compositeFor()` puts a structural copy (keys and holders only, no names, no
prose) through `PairCache.openOne(hashA, hashB)`, stored in
`incommon.paircache.v1` under `STATE_VERSION`. The screen always draws a fresh
`build()`; the cache is a cost control for a future group view. The hash is
`PeopleLibrary.chartHash()`, which normalises with the stored standard offset:
see [[computed_state]].
