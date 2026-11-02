---
kind: consumer
layer: shell
source:
  - "app/inCommonApp v2.dc.html:23288 at 1c02c7c (FRIENDS_KEY)"
  - "app/inCommonApp v2.dc.html:23364 at 1c02c7c (contactAdd)"
  - "app/inCommonApp v2.dc.html:13872 at 1c02c7c (peopleReady)"
  - "app/people-library.js at 1c02c7c"
verified: "reconcile.js section c2"
status: checked
---
# Saved people

Two stores hold other people today:

| Store | Shape | Written by | Read by |
|---|---|---|---|
| `incommon.friends` (account scoped through `acctKey`) | `{ id, card: { n, d, t, l, la, lo, tz, to }, source, addedAt }`, twelve at most | `contactAdd()` | synastry, Circle, every screen |
| `incommon.people.v1` | people-library records with [[computed_state]] | `migrateLegacy()` once, from the guest's plain `incommon.friends` | nothing |

Every screen computes a saved person's chart live with `hdGatesFor()` from the
card, which is correct. The stored copy is not, and 1.2 will build on it:
[[D-03 Saved people charts store the wrong instant for an untimed birth]],
[[D-04 Saved people charts use the standard offset in summer]].
