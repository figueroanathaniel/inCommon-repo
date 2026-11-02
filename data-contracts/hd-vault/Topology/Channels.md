---
kind: topology
layer: mechanics
source:
  - "app/hd-topology.js:41 at 1c02c7c (PAIRS)"
  - "app/hd-topology.js:70 at 1c02c7c (channelKey, pairs, channelsFor)"
  - "app/inCommonApp v2.dc.html:15418 at 1c02c7c (HD_CHANNELS)"
  - "app/hd-atlas.js:225 at 1c02c7c (CHANNELS, interpretation)"
  - "app/timing-lexicon.js:1127 at 1c02c7c (CHANNEL, interpretation)"
verified: "reconcile.js section a: the three key sets are equal and every app row's two centres equal topology's; run-module-tests Y1"
status: checked
---
# Channels

Thirty six channels, each a pair of [[Gates]] in two different [[Centres]]. A
channel is defined when both of its gates are activated, by either side, in one
chart.

## The key

`HDTopology.channelKey(a, b)` is `min-max`: `'20-34'`, never `'34-20'`. Every
module that keys a channel uses that form (topology `PAIRS`, atlas `CHANNELS`,
timing-lexicon `CHANNEL`, the composite rows, the Ground, people-library's
`channels`). The app's `HD_CHANNELS` rows are written low gate first too, so
`c[0] + '-' + c[1]` gives the same key; the 3D model and the Oracle dossier
build keys that way. [[Chart address]] proposes this key as the channel's
address.

## The thirty six

1-8 G Throat; 2-14 G Sacral; 3-60 Sacral Root; 4-63 Ajna Head; 5-15 Sacral G;
6-59 Solar Plexus Sacral; 7-31 G Throat; 9-52 Sacral Root; 10-20 G Throat;
10-34 G Sacral; 10-57 G Spleen; 11-56 Ajna Throat; 12-22 Throat Solar Plexus;
13-33 G Throat; 16-48 Throat Spleen; 17-62 Ajna Throat; 18-58 Spleen Root;
19-49 Root Solar Plexus; 20-34 Throat Sacral; 20-57 Throat Spleen; 21-45 Heart
Throat; 23-43 Throat Ajna; 24-61 Ajna Head; 25-51 G Heart; 26-44 Heart Spleen;
27-50 Sacral Spleen; 28-38 Spleen Root; 29-46 Sacral G; 30-41 Solar Plexus
Root; 32-54 Spleen Root; 34-57 Sacral Spleen; 35-36 Throat Solar Plexus; 37-40
Solar Plexus Heart; 39-55 Root Solar Plexus; 42-53 Sacral Root; 47-64 Ajna Head.

Gates 10, 20, 34 and 57 sit in three channels each (the integration channels).

## Copies, reconciled

| Copy | Count | Equal to topology |
|---|---|---|
| `HDTopology.PAIRS` | 36 | the source |
| `HD_CHANNELS` in the app, with centre names | 36 | yes, keys and all 72 centre names |
| `HDAtlas.CHANNELS` keys | 36 | yes (Y1 holds it too) |

`HDAtlas.channelsFor(gate)` returns `{ key, partner, ... }` rows; the app's
`cycleDesign()` builds its own partner map from `HD_CHANNELS`. Both read the
same thirty six.
