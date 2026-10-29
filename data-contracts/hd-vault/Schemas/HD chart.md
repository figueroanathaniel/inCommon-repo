---
kind: schema
layer: mechanics
source:
  - "app/inCommonApp v2.dc.html:17189 at 1c02c7c (hdChart)"
  - "app/inCommonApp v2.dc.html:17229 at 1c02c7c (_hd = {...})"
verified: "reconcile.js sections c, f and f2"
status: checked
---
# HD chart

The object `hdChart()` returns for the active profile. Memoised in `this._hd`
on the profile's `birthStamp` (see [[D-09 The birth stamp ignores the zone]]).
Every call counts `chart_generated` once per new stamp.

| Field | Type | Range | Produced from |
|---|---|---|---|
| `type` | string | `Reflector`, `Manifesting Generator`, `Generator`, `Manifestor`, `Projector` | [[Type]] |
| `authority` | string | `'<Name>: <instruction>'`, eight names | [[Authority]] |
| `strategy` | string | one sentence, `HD_STRATEGY[type]` | [[Strategy]] |
| `desc` | string | one sentence, `HD_TYPE_DESC[type]` | interpretation, keyed by type |
| `defined` | Set of string | centre names from [[Centres]] | [[Definition]] steps 1 to 3 |
| `activeChannels` | array of `[a, b, centreA, centreB]` | rows of `HD_CHANNELS`, low gate first | [[Channels]] |
| `gates` | array of `{ gate, name, line, body, kind }` | sorted by gate, one row per activated gate | first activation of that gate: [[D-08 One line per gate in the gate list]]; `name` from `GATE_NAMES`: [[D-02 Two gate name tables disagree on six gates]] |
| `acts` | array of [[Activation]] | 28 rows today (14 per side), 26 by the tradition | [[Activations]] |
| `definition` | string | `'<Name>: <gloss>'`, `HD_DEFINITION[min(parts, 4)]` | [[Definition]] |
| `definitionParts` | integer | 0 to 4 | [[Definition]] |

Not in it: the profile (computed by `hdProfile()` from `acts`, see [[Profile]]),
the incarnation cross (not computed, see [[Incarnation cross]]), the instants,
the design arc, the ephemeris used, and whether the design side was solved or
fell back. 3.2's inspection panel needs the last four: [[Birth instant]] and
[[Design moment]] list them.

Nothing in it is stored. It is rebuilt on page load from the profile.
