---
kind: pipeline
layer: shell
source:
  - "data-contracts/hd-vault at 1c02c7c"
verified: "every note below exists and every wikilink in the vault resolves (link check in the pull request)"
status: checked
---
# 00 Index

The Human Design logic map: every place inCommon computes, stores, moves or reads
Human Design, mapped at commit 1c02c7c (main, 28 October 2026) for assignment
1.3. Open this folder as an Obsidian vault, or link it into one. The repository
copy is the source of truth; Obsidian's own `.obsidian/` folder is ignored.

Every note opens with frontmatter: `kind`, `layer` (as
`tools/check-layer-boundary.js` has it), `source` (file:line at the commit),
`verified` and `status`. Links are by note title, with double square brackets.

**Start here:** [[Inventory]] for every site, [[Chart address]] for assignment
1.2, and the discrepancy table below.

## Pipeline

The chain from a birth to activations, in order.

- [[Birth instant]]
- [[Positions]]
- [[Design moment]]
- [[Gate and line]]
- [[Activations]]

## Topology

The wiring as facts.

- [[Centres]]
- [[Channels]]
- [[Gates]]

## Derivations

What the app derives from the activations.

- [[Definition]]
- [[Type]]
- [[Authority]]
- [[Strategy]]
- [[Profile]]
- [[Incarnation cross]]

## Schemas

The data structures, every field.

- [[Activation]]
- [[Chart address]]
- [[Composite row]]
- [[Ground]]
- [[HD chart]]
- [[Oracle dossier (HD part)]]
- [[Transit reading]]
- [[computed_state]]

## Consumers

Every module and screen that reads Human Design, and the full inventory.

- [[Inventory]]
- [[Book of Changes]]
- [[Circle]]
- [[Cycle Audit Design lane]]
- [[Gates now card]]
- [[Human Design Atlas]]
- [[Human Design readings]]
- [[Learn pages and search]]
- [[Saved people]]
- [[Synastry composite]]
- [[Tests that hold it]]
- [[The Oracle]]
- [[The wiring stage, 3D and Wheel]]
- [[The wiring, 2D]]
- [[Timing Lexicon and the Together slide]]
- [[Today Human Design card]]

## Discrepancies

Where two copies disagree, or the app and the tradition may. Ranked in the table below.

- [[D-01 The South Node is activated twice]]
- [[D-02 Two gate name tables disagree on six gates]]
- [[D-03 Saved people charts store the wrong instant for an untimed birth]]
- [[D-04 Saved people charts use the standard offset in summer]]
- [[D-05 Self-projected authority lights no centre in the Atlas]]
- [[D-06 Mean lunar node where the tradition may use the true node]]
- [[D-07 Positions on the wrong side of an edge]]
- [[D-08 One line per gate in the gate list]]
- [[D-09 The birth stamp ignores the zone]]
- [[Known, owned by 3.2 Task 2]]

## Verification

Outside checks.

- [[Astral body cross check]]
- [[Tertiary log]]
- [[Tradition conventions]]

## The discrepancy register

| Note | Severity | Charts of 2,000 | Reader surface today | Owner |
|---|---|---|---|---|
| [[D-06 Mean lunar node where the tradition may use the true node]] | changes a Type or Authority (disputed: depends on C4) | 89 Types, 357 node gates | the wiring, Type, Authority | owner decision; then workstream 3, workstream 6 |
| [[D-03 Saved people charts store the wrong instant for an untimed birth]] | changes a gate or line | 408 of 600 untimed | none yet (stored, unread) | workstream 1, with 3 |
| [[D-04 Saved people charts use the standard offset in summer]] | changes a gate or line | 292 of 1,535 summer | none yet (stored, unread) | workstream 1, with 3 |
| [[D-07 Positions on the wrong side of an edge]] | changes a gate or line (precision limit) | 23 of 19,750 positions | a gate or line, rarely | workstream 3 (3.2 panel), workstream 6 |
| [[D-09 The birth stamp ignores the zone]] | changes a gate or line in a stored reading | not measured | kept Oracle reading after a zone repair | workstream 1 |
| [[D-01 The South Node is activated twice]] | cosmetic | 2,000 | "carries 14 activations" in the Chart reading; 3D keys | workstream 3, workstream 6 |
| [[D-02 Two gate name tables disagree on six gates]] | cosmetic | six gates | gate names differ between screens | workstream 3, workstream 6 |
| [[D-05 Self-projected authority lights no centre in the Atlas]] | cosmetic | one Atlas entry | the Atlas wiring | workstream 3, workstream 6 |
| [[D-08 One line per gate in the gate list]] | cosmetic | 1,999 | the Activated Gates list | workstream 3 |
| [[Known, owned by 3.2 Task 2]] | listed, not re-derived | 427 Types on the fallback path | | workstream 3 (3.2 Task 2) |

## What agreed

Every duplicated piece of logic other than the above agreed exactly: the channel
and centre tables (app, topology, atlas), `gateOf()` against `HDWheel` over
362,001 longitudes and every edge, `hdChart()` against `hdGatesFor()`,
`HDTransit`, `HDCircle.definedFor()` and the composite definition on 2,000
charts, and Type, Authority and Definition against an independent implementation
on 2,000 charts and 100,000 random channel sets.
