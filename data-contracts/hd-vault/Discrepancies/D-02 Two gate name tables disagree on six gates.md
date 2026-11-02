---
kind: discrepancy
layer: interpretation
source:
  - "app/inCommonApp v2.dc.html:15417 at 1c02c7c (GATE_NAMES)"
  - "app/hd-atlas.js:265 at 1c02c7c (GATES)"
verified: "reconcile.js section e"
status: checked
---
# D-02 Two gate name tables disagree on six gates

**What differs.**

| Gate | `GATE_NAMES` (app) | `HDAtlas.GATES[n][0]` |
|---|---|---|
| 21 | The Hunter | Control |
| 24 | Rationalization | Rationalizing |
| 25 | Spirit of the Self | The Spirit of the Self |
| 30 | Recognition of Feelings | Feelings |
| 46 | Determination of the Self | Determination |
| 61 | Inner Truth | Mystery |

**Reader surface.** The same gate is named two ways on different screens:
`GATE_NAMES` feeds `hdChart().gates[].name`, the 3D tooltips, the daily gate
sheet, the Cycle Audit Design lane and the Oracle dossier; the atlas feeds the
Atlas, Today's card and search. Gate 21 is "The Hunter" on the 3D stage and
"Control" in the Atlas.

**Not this.** CLAUDE.md records six names (2, 10, 29, 47, 61, 62) where inCommon
differs from the Celestial Codex on purpose. That is a recorded choice and a
different comparison.

**Severity.** Cosmetic.

**Owner.** Workstream 3 (content): one table, the other reading it. Which
spelling is right is a content decision and wants the Human Design reviewer
(D1 in docs/hd-upgrade/02). Request to workstream 6: a row that the two agree.
