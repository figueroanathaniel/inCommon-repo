---
kind: derivation
layer: mechanics
source:
  - "app/inCommonApp v2.dc.html:17189 at 1c02c7c (hdChart: authority)"
  - "app/inCommonApp v2.dc.html:21657 at 1c02c7c (HD_AUTH_CENTRE, interpretation)"
  - "app/inCommonApp v2.dc.html:21774 at 1c02c7c (authOf, myAuth, in atlasVals)"
  - "app/inCommonApp v2.dc.html:20588 at 1c02c7c (authority lookup in hdPopVals)"
  - "app/inCommonApp v2.dc.html:25541 at 1c02c7c (authWord in oracleDossier)"
  - "app/hd-atlas.js:184 at 1c02c7c (AUTHORITIES, interpretation)"
  - "tools/run-module-tests.js N1 to N8 (hdChart authority line, read from the app)"
verified: "reconcile.js sections d, f and f2: 0 disagreements over 100,000 random channel sets, every one of the eight outcomes reached"
status: checked
---
# Authority

Reads the defined centres and the Throat piece from [[Type]]. Feeds the
authority card, the Atlas, the teachings and the Oracle dossier.

## The rule as the app computes it

The first condition that holds wins.

| Order | Condition | Authority (text before the colon) |
|---|---|---|
| 1 | Solar Plexus defined | Emotional |
| 2 | Sacral defined | Sacral |
| 3 | Spleen defined | Splenic |
| 4 | Heart defined, and the Throat defined with the Heart in its piece | Ego manifested |
| 5 | Heart defined otherwise | Ego projected |
| 6 | G defined | Self-projected |
| 7 | any centre defined | Mental |
| 8 | nothing defined | Lunar |

Why rows 4 to 6 come out right. Once rows 1 to 3 have failed, the Heart can be
defined only through 21-45 (to the Throat) or 25-51 (to the G), because its
other two channels define the Spleen or the Solar Plexus. And the G can be
defined only through a channel to the Throat (1-8, 7-31, 10-20, 13-33), because
its other channels define the Sacral, the Spleen or the Heart. So row 6 is
exactly "the G connected to the Throat", which is the published condition for
Self-projected, and row 4 is the Heart reaching the Throat either directly or
through the G.

Harness rows N1 to N8 in `tools/run-module-tests.js` read this line out of the
app and hold the order: Solar Plexus before Sacral.

## Over the sample

2,000 births: Emotional 1,048, Sacral 659, Splenic 175, Self-projected 48,
Mental 37, Lunar 16, Ego manifested 10, Ego projected 7. The random channel sets
reached every outcome (Ego projected 467 times, Ego manifested 781).

## The strings, and who reads them

`hdChart().authority` is a sentence: `'<Name>: <instruction>'`. Every reader
splits at the colon and then matches by the first word.

| Reader | Match | Result for each of the eight |
|---|---|---|
| `HDAtlas.AUTHORITIES` by prefix (atlasVals) | first word, lower case, `indexOf(first) === 0` | every one lands on its entry; both Ego forms land on Ego (Heart) |
| the authority sheet (hdSheet) | first word, `indexOf(first) !== -1` | the same eight entries |
| `HD_AUTH_CENTRE` through `authOf()` | splits the atlas entry's name on space, `(` or `:` | Self-projected (G) becomes `self-projected`, which is not a key, so it lights no centre: [[D-05 Self-projected authority lights no centre in the Atlas]] |
| the Oracle dossier | a fixed map to the Codex's names | Mental is sent as "Mental (Environmental)"; the Ego split is kept |

The published precedence and the Ego split are question C8 in
[[Tradition conventions]].
