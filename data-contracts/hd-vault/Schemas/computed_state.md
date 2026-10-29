---
kind: schema
layer: shell
source:
  - "app/people-library.js:60 at 1c02c7c (STATE_VERSION)"
  - "app/people-library.js:152 at 1c02c7c (normalize)"
  - "app/people-library.js:177 at 1c02c7c (chartHash)"
  - "app/people-library.js:199 at 1c02c7c (computeStateFor)"
  - "app/people-library.js:214 at 1c02c7c (blank)"
  - "app/people-library.js:379 at 1c02c7c (migrateLegacy)"
  - "app/inCommonApp v2.dc.html:13855 at 1c02c7c (peopleCompute)"
  - "app/inCommonApp v2.dc.html:13872 at 1c02c7c (peopleReady)"
  - "app/profile-manager.js:847 at 1c02c7c (exportProfile, which does not carry saved people)"
verified: "reconcile.js section c2 (600 people, three zones)"
status: disputed
---
# computed_state

The chart people-library.js stores on each saved person record, in
`incommon.people.v1` (`{ <owner profile id>: [record] }`, device only, never
synced). Layer: shell (the store); the arithmetic is the app's `peopleCompute()`,
handed in through `PeopleLibrary.configure({ compute })`.

## The record (fields that carry Human Design)

| Field | Type | Notes |
|---|---|---|
| `birth_date` | string `YYYY-MM-DD` | |
| `birth_time` | string `HH:MM` or null | null when not known |
| `birth_tz` | string | IANA zone or empty |
| `tz_offset` | number or null | the zone's **standard** offset as the gazetteer stores it |
| `time_unknown` | boolean | derived: no `HH:MM` time |
| `computed_state` | object or null | below |
| `computed_state_version` | integer | `STATE_VERSION`, 3 |
| `chart_hash` | string | first 32 hex of SHA-256 of `v3|instant|t or u|lat|lon` |

## `computed_state`

| Field | Type | Notes |
|---|---|---|
| `v` | integer | `STATE_VERSION` |
| `longitudes` | `{ body: degrees }` | the twelve `PLNS` bodies, rounded to 0.001 deg |
| `gates` | array of integer | from `hdGatesFor()`, both sides |
| `channels` | array of `min-max` keys | |
| `centers` | array of centre names | |
| `ascendant`, `midheaven`, `houses`, `house_rulers`, `moon`, `personal_points` | null when the time is unknown | `moon` is the only one `peopleCompute()` fills |
| `time_unknown` | boolean | |

## How its instant is chosen, and why that is wrong today

`normalize()` takes the instant as `Date.UTC(date, time) - tz_offset hours` for a
known time, and **00:00 UTC on the date** for an unknown one. `peopleCompute()`
then:

- takes `longitudes` at that instant, and
- takes `gates` from `hdGatesFor({ birthDate: UTC date, birthTime: UTC time or
  '', timeUnknown, timezone: '', tzOffset: 0 })`, which for an unknown time is
  **12:00 UTC**.

So an untimed record's longitudes and gates are taken twelve hours apart, and
neither is noon where the person was born, which is what the reader's own chart
and the `STATE_VERSION` 3 comment say. And a known summer time given with the
standard offset is an hour out. reconcile.js measured both:
[[D-03 Saved people charts store the wrong instant for an untimed birth]] and
[[D-04 Saved people charts use the standard offset in summer]].

## Who reads it

Nothing, today. The app's saved people live in `incommon.friends` (account
scoped, card shape) and every screen computes their chart with `hdGatesFor()`
from the card. `incommon.people.v1` is written once, by `migrateLegacy()`, the
first time `compositeFor()` calls `peopleReady()`, from the guest's plain
`incommon.friends` key. `chartHash()` is used live, as the pair cache key.

Assignment 1.2 (charts of other people) will build on this store, which is why
D-03 and D-04 matter before it does.

## Consent, deletion, export (DATA-MAP.md)

Consent: none; device only by design, and no category in DATA-MAP.md's consent
table covers saved people. Deletion: not reached by `_dropProfileKeys()` or
`accountStorageKeys()` (DATA-MAP G6). Export: none; `exportProfile()` does not
carry `incommon.people.v1`. The consent and export halves are DATA-MAP G15, added
when this note was found to claim they were already listed.
