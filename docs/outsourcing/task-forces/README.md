# Task forces: how a delegation is organised

All six task forces share [FOUNDATION.md](../FOUNDATION.md) and
[BOT-PROMPTS.md](../BOT-PROMPTS.md), routed by the central roster. Read them
at startup and return the shared completion receipt. Historical PR examples
do not override current GitHub state.

Decided by the owner on 28 October 2026, starting with Task Force 1. Each
workstream in `../00-README.md` becomes a task force: one team, one branch,
one folder, and everything to do with that delegation in those two places.
Every task force repeats the same shape, so a reader who knows one knows all
six.

## The shape

| Part | Where | What it holds |
|---|---|---|
| Seats | the roster in `../00-README.md` | primary, secondary, tertiary; the only place an agent is named |
| Branch | named in the charter | every commit for the delegation |
| Standing pull request | from that branch into main | the review thread, the gate output, the helper logs |
| Folder | `task-forces/<nn>-<slug>/` | `CHARTER.md`, `brief.md`, and every assignment file |

Inside a folder, assignment files are named `<workstream>.<round>-<topic>.txt`.
When a round gives each seat its own file, the seat goes last:
`1.3-hd-mapping-primary.txt`, `-secondary.txt`, `-tertiary.txt`.

## The task forces

| # | Task force | Folder | Branch | State |
|---|---|---|---|---|
| 1 | Data Mapping & Schema Architecture | `01-data-schema/` | `taskforce/01-data-schema` | constituted 28 October 2026 |
| 2 | Security Hardening & RLS | `02-security-rls/` | `taskforce/02-security-rls` | constituted 28 October 2026 |
| 3 | Refactoring & Feature Additions | `03-refactor-features/` | `taskforce/03-refactor-features` | constituted 28 October 2026 |
| 4 | Interactive Visuals (WebGL / three.js) | `04-visuals-webgl/` | `taskforce/04-visuals-webgl` | constituted 28 October 2026 |
| 5 | Load Time & Performance Tuning | `05-performance/` | `taskforce/05-performance` | constituted 28 October 2026 |
| 6 | QA, Unit Testing & Documentation | `06-qa-tests-docs/` | `taskforce/06-qa-tests-docs` | constituted 28 October 2026 |

## Standing up the next task force

All six were stood up on 28 October 2026. For a seventh, only when the owner
asks for it, and in one commit:

1. Branch from current main as `taskforce/<nn>-<slug>` (the owner approved
   the pattern on 28 October 2026); the charter records the name.
2. Make `task-forces/<nn>-<slug>/`. Move the workstream's brief in as
   `brief.md` and its assignments in under the naming above, with `git mv`
   so their history follows them. Fix every reference to the old paths
   (`grep -rn` the old file names across the repo).
3. Copy a charter (`02-security-rls/CHARTER.md` is the plainest) and change
   only what is the task force's own: the name, the branch, the notes, the
   file table and "History".
4. Update the workstream's row in the table above, the "Brief" cell of the
   roster and the status board in `../00-README.md`, and add a line to its
   change log.
5. Open the standing pull request and record its number in the charter.

## Rules that hold for every task force

- **Seats change only with the owner's approval**, in writing. The roster
  cell changes, the charter's "History" gets a line, and nothing else in the
  folder names an agent.
- **Approval and delivery are separate records.** An assignment's Status is
  the owner's decision; its Delivered cell in the charter says when, how and
  by whom it reached each seat. Neither is written for the other.
- **Everything for the delegation is on its branch.** Work that belongs to
  another task force's files is a request in the standing pull request,
  never an edit ("Who owns which files" in `../00-README.md`).
- **Merges follow the merge order** in `../00-README.md`: the task force
  branches merge into main in workstream order, each rebased on main after
  the one before lands, every gate green.
- Every rule in `../00-README.md` and CLAUDE.md still applies. Where this
  page and CLAUDE.md disagree, CLAUDE.md wins and this page is corrected.
