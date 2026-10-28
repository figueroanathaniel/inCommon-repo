# Task forces: how a delegation is organised

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
| 2 | Security Hardening & RLS | not yet | not yet | brief and assignments still in `../` and `../assignments/` |
| 3 | Refactoring & Feature Additions | not yet | not yet | as above |
| 4 | Interactive Visuals (WebGL / three.js) | not yet | not yet | as above |
| 5 | Load Time & Performance Tuning | not yet | not yet | as above |
| 6 | QA, Unit Testing & Documentation | not yet | not yet | as above |

## Standing up the next task force

Only when the owner asks for it, and in one commit on the new branch:

1. Branch from current main as `taskforce/<nn>-<slug>` (the owner approved
   the pattern on 28 October 2026); the charter records the name.
2. Make `task-forces/<nn>-<slug>/`. Move the workstream's brief in as
   `brief.md` and its assignments in under the naming above, with `git mv`
   so their history follows them. Fix every reference to the old paths
   (`grep -rn` the old file names across the repo).
3. Copy `01-data-schema/CHARTER.md` and change only what is the task force's
   own: the name, the branch, the file table and "History".
4. Update the workstream's row in the table above, the "Brief" cell of the
   roster and the status board in `../00-README.md`, and add a line to its
   change log.
5. Open the standing pull request and record its number in the charter.

## Rules that hold for every task force

- **Seats change only with the owner's approval**, in writing. The roster
  cell changes, the charter's "History" gets a line, and nothing else in the
  folder names an agent.
- **Everything for the delegation is on its branch.** Work that belongs to
  another task force's files is a request in the standing pull request,
  never an edit ("Who owns which files" in `../00-README.md`).
- **Merges follow the merge order** in `../00-README.md`: the task force
  branches merge into main in workstream order, each rebased on main after
  the one before lands, every gate green.
- Every rule in `../00-README.md` and CLAUDE.md still applies. Where this
  page and CLAUDE.md disagree, CLAUDE.md wins and this page is corrected.
