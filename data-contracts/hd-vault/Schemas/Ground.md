---
kind: schema
layer: mechanics
source:
  - "app/hd-circle.js:172 at 1c02c7c (circle)"
  - "app/inCommonApp v2.dc.html:23924 at 1c02c7c (circleVals)"
verified: "run-module-tests G16 to G39; reconcile.js section c (definedFor equals hdChart defined)"
status: checked
---
# Ground

What `HDCircle.circle(members, opts)` returns for three to five people. Each
member is `{ id, name, gates, timeState }`; the app builds `gates` with
`hdGatesFor(p)`.

| Field | Type |
|---|---|
| `version`, `ok`, `size`, `memberOrder` (`'as given'`) | string, boolean, integer, string |
| `members` | `[{ id, name, timeState }]` |
| `gates` | `{ all: [gate], some: [{ gate, members }], one: [{ gate, member }], none: [gate], holders: { gate: [id] } }` |
| `channels` | `{ alone: [{ key, gates, centers, members }], together: [{ key, gates, centers, brings }], open: [{ key, gates, centers }] }` |
| `centers` | `{ everyMember, someMember, noMember, asGroup }`, each a list of centre names |
| `counts` | nine integers, every one about gates, channels or centres, none per member |
| `precision` | `{ full, unknownMembers, unansweredMembers, timeDependent }` |
| `caution` | `GROUP_CAUTION` |

Refused rather than trimmed: `{ ok: false, reason: 'too_few' | 'too_many', given, min, max }`.
Every attribution list is sorted by id (G20). Exactly eleven top level keys and
no seat (G23 to G27). Nothing persisted (G37).

A member's defined centres come from `definedFor()`, the same rule as
[[Definition]] steps 1 to 3.
