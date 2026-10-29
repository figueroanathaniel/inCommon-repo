---
kind: pipeline
layer: mechanics
source:
  - "app/birth-time.js:207 at 1c02c7c (instant)"
  - "app/birth-time.js:166 at 1c02c7c (utcOffsetFor)"
  - "app/inCommonApp v2.dc.html:16235 at 1c02c7c (natalDateFor)"
  - "app/inCommonApp v2.dc.html:16295 at 1c02c7c (natalDate)"
  - "app/inCommonApp v2.dc.html:15998 at 1c02c7c (t2000)"
  - "app/profile-manager.js:291 at 1c02c7c (_decorate, birthStamp)"
verified: "reconcile.js section c (2,000 instants through natalDateFor), run-module-tests B rows (B13b, B13c)"
status: checked
---
# Birth instant

The first step of every chart. A profile's birth date, time and zone become one
instant in UT, and that instant becomes `t`, days from J2000.0, which is the
scale every position function takes. Next: [[Positions]].

## How the app gets there

1. `natalDateFor(p)` hands the profile's `birthDate`, `birthTime`,
   `timeUnknown`, `timezone` and `tzOffset` to `BirthTime.instant()`.
2. `instant()` decides the time state (see [[Birth instant#The three time states]]).
   A known time is read as given. An unknown or unanswered time is read as
   12:00 local, the placeholder.
3. `utcOffsetFor(tz, y, mo, d, hh, mi, fallback)` asks Intl for the zone's
   offset on that date, twice, because the offset depends on the instant and
   the instant on the offset. With no zone or `manual`, the stored `tz_offset`
   is the fallback, and with nothing at all an untimed birth takes Greenwich.
4. The instant is `Date.UTC(y, mo, d, hh, mi) - offset * 3,600,000` ms: the
   offset is subtracted in milliseconds so a fractional zone keeps its half or
   three quarter hour (B13c holds it).
5. `t2000(date) = date.getTime() / 86,400,000 + 2,440,587.5 - 2,451,545.0`.
   This is UT days from J2000.0. astronomy-engine's `MakeTime(t)` reads a
   number as exactly that, and converts to TT itself.

With `birth-time.js` missing, `natalDateFor()` falls back to its own copy:
`p.hasBirthTime` decides known or not, and `birthUtcOffset()` repeats the Intl
loop. That copy is the older rule and is reached only when the module is absent.

## The three time states

| State | Stored as | Read as |
|---|---|---|
| known | `birth_time` HH:MM | that minute, local |
| unknown | `birth_time_unknown` true | 12:00 local, marked assumed |
| unanswered | `birth_time_unknown` absent, no time | 12:00 local, marked assumed |

Seconds are not carried: a birth time is to the minute.

## Fields for the inspection panel (3.2 Task 3)

Every field a reader could be shown to explain this step, with type and unit.

| Field | Type | Unit or form | Where it comes from |
|---|---|---|---|
| birth date as given | string | `YYYY-MM-DD` | profile `birth_date` |
| birth time as given | string or empty | `HH:MM`, 24 hour, local | profile `birth_time` |
| time state | enum | `known`, `unknown`, `unanswered` | `BirthTime.timeState()` |
| assumed time | string or empty | `12:00` when not known | `instant().assumedTime` |
| zone | string | IANA name, `manual`, or empty | profile `timezone` |
| offset on that date | number | hours east of UT (negative west), fractional allowed | `instant().offset` |
| offset source | string | what Intl or the fallback answered | `instant().offsetSource` |
| ambiguous | boolean | the time falls in a clock change hour | `instant().ambiguous` |
| UT of birth (the personality instant) | Date | ISO 8601 UTC, to the minute | `instant().date` |
| t | number | days from J2000.0, UT scale | `t2000()` |

The design instant, the solar arc it was solved to, the iterations and the
ephemeris are in [[Design moment]] and [[Positions]].

## What invalidates it

`birthStamp` is `birth_date|birth_time|birth_lat|birth_lon|unknown flag`
(profile-manager.js:304). It does not carry the zone or the offset, which is
[[D-09 The birth stamp ignores the zone]].
