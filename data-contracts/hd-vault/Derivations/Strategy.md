---
kind: derivation
layer: interpretation
source:
  - "app/inCommonApp v2.dc.html:15420 at 1c02c7c (HD_STRATEGY)"
  - "app/hd-atlas.js:209 at 1c02c7c (STRATEGIES)"
  - "app/inCommonApp v2.dc.html:25507 at 1c02c7c (ORACLE_STRATEGY)"
verified: "by reading: a lookup on the Type string, no computation"
status: checked
---
# Strategy

Not computed. A strategy is a lookup on the [[Type]] string.

| Table | Keyed by | Holds |
|---|---|---|
| `HD_STRATEGY` in the app | the five Type names | one sentence each, copied into `hdChart().strategy` |
| `HDAtlas.STRATEGIES` | an array; `who` names the Type(s) | the atlas entry (Informing, Responding and so on) |
| `ORACLE_STRATEGY` in the app | the five Type names | the Codex's words for the dossier |

The atlas matches by `s.who.indexOf(type) !== -1`. Its four entries are
Informing (Manifestor), Responding ("Generator and Manifesting Generator"),
Waiting for the invitation (Projector) and Waiting a lunar cycle (Reflector), so
each of the five Types lands on its own entry (checked by running the lookup on
all five). A Manifesting Generator and a Generator share Responding; the app's
`HD_STRATEGY` gives the Manifesting Generator its own sentence ("Wait to
respond, then inform before you move").

Layer: interpretation. The Type is mechanics; a strategy is writing keyed by it.
