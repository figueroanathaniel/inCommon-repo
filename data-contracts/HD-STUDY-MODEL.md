# The Human Design study model: notes, chart versions, other people's charts, import and export

Assignment 1.2, Task 1. **Status: the owner approved O1 to O9 as recommended
on 29 October 2026. Awaiting workstream 2's privacy review (2.2 Task 1).
Nothing in it is built.** No migration is written until that review is
resolved; a finding from it changes this file first.

Written 29 October 2026 from the code at `main` 18a066b. Every "today" claim
names the file it was read from. Where a sentence is a proposal it says so;
where it is an inference rather than a measurement it says that too.

## 0. What exists today

Read from the code, not from earlier documents.

| Thing | Where | What it does now |
|---|---|---|
| The reader's own birth data | `incommon.profiles.v1[.u.<uid>]`, profile fields `birth_date`, `birth_time`, `birth_location`, `birth_lat`, `birth_lon`, `timezone`, `tz_offset`, `birth_time_unknown` | `PM.updateProfile()` overwrites them in place. There is no history. Synced to `profiles` whatever the birthData switch says (DATA-MAP G2). |
| The time question | `app/birth-time.js` `TIME_STATE` | three states: `known`, `unknown` (the reader said so), `unanswered`. No precision beyond that. |
| Saved people, live | `incommon.friends[.u.<uid>]` (the app's `FRIENDS_KEY`, `contactAdd()`), card shape `{ n, d, t, l, la, lo, tz, to }`, `source` `card` or `manual` | what synastry, Circle and every screen read. Twelve on add (`CONTACT_MAX`), forty from older builds kept. Device only. |
| Saved people, the module | `incommon.people.v1`, `app/people-library.js` | the store with the five rules (notes off, deleting is deleting, no invented placements, four layers, nothing leaves). Written once by `migrateLegacy()`, **read by nothing** (vault, Saved people). Device wide, keyed inside by the owner's profile id, so neither profile deletion nor account erasure reaches it (G6). |
| Notes | `people-library.js` `notes` | one free text field per saved person, off by default, destroyed when switched off. Nothing attaches a note to a part of a chart, for the reader or anybody else. |
| Addresses in a chart | `data-contracts/hd-vault/Schemas/Chart address.md` | 1.3's proposal: `centre:`, `channel:`, `gate:`, `line:`, `activation:`, `facet:`. Not in code. |
| Export | `PM.exportProfile()`, schema `incommon.profile.v1` | profile, consents, consented practice data, memories the consent allows, the Throughline. **No saved people, no kept Oracle readings** (G15). Settings downloads it as JSON. |
| Import | none | |
| Sending a chart | the card, `cardOf()` / `cardLink()` | a link whose fragment carries name, date, time, place, coordinates and zone; the fragment never reaches a server. Receiving one is the sender's consent. |
| Sending a reading | the synastry image, `synCardCanvas()` | carries first names and counts and **no birth data**, and says so on the image. This is the precedent 2.2 names. |
| What the policy promises | `app/privacy.html` sections 3, 5 and 14 | saved people stay on the device and are not copied to the account; a card carries birth details; enter another person's details only with their permission. |

Two facts shape everything below. **The live saved people store is not the one
with the rules**, so building on `incommon.people.v1` means moving the screens
onto it (workstream 3's change). And **a profile can already be another
person**: a reader may make a profile for a partner or a child, and that
profile's birth data syncs like the reader's own. The model does not change
that; section 9 asks workstream 2 to look at it.

## 1. The decisions that are the owner's

**Decided by the owner on 29 October 2026: every recommendation below, O1 to
O9, as written.** So: own chart notes under `journal`; own notes and versions
sync with the profile; other people's charts stay on the device; clients are
`kind: 'client'` in the one store, their cap left to D4; the export carries
people only on a separate tick, off by default; no share link; a zone repair
makes a version; Clear birth data removes the history; no `.mmi` import until
its shape is public or licensed. The table keeps the options and reasons as
the record of what was weighed.

O2 and G2 together: versions follow the profile row, and the owner decided
G2 the same day: a saved profile keeps syncing (DATA-MAP G2), so its versions
will too once step 3 is built.

| # | Decision | Options | Recommended | Why |
|---|---|---|---|---|
| O1 | Which consent gates notes on the reader's own chart | (a) `journal`, (b) a new category `study` | **(a) `journal`** | They are the reader's own words, which is what `journal` already means. (b) adds a Settings switch, a seventh `CONSENT_TYPES` entry and a default of off for every existing profile; worth it only if readers want study notes synced while their journal is not. |
| O2 | Do the reader's own notes and chart versions sync | (a) device only, (b) sync with the profile | **(b)** | "One account reads the same on every device" already covers the profile, and a note on another device that names a version it cannot see is a note that half works. Versions follow the profile row's own rule, so whatever G2 decides for the profile decides for its history. |
| O3 | Do other people's charts sync | (A) device only, as today; (B) synced rows under RLS; (C) synced, encrypted on the device so the server holds only what it cannot read | **(A) for phase 1** | It is what the Privacy Policy and `people-library.js` rule 5 promise. (B) puts third parties' birth data on the server under the reader's account, which needs a policy change and a lawful basis per person. (C) keeps rule 5's spirit, but a lost passphrase loses every client, and key handling is a project of its own. Decide (B) or (C) only once a practitioner tier exists (D4). |
| O4 | A practitioner's client list | (a) the same store, `kind: 'client'`, with a consent record and its own cap; (b) a separate store | **(a)** | One set of rules, one deletion path, one export path. A client differs from a saved person in three fields (section 5), not in kind. The cap is a pricing question (D4). |
| O5 | Does Settings' export carry saved people and clients | (a) never, (b) on a separate tick, off by default, (c) always | **(b)** | A reader's export is their own backup, and a practitioner moving devices needs the clients. Off by default because an export file is easy to send by accident, and it holds other people's birth data. |
| O6 | A share link | (a) none, files and images only; (b) a fragment link, like the card; (c) a server link that can be revoked | **(a) for phase 1** | (b) cannot be revoked: a link that has been sent is out. (c) means the server holds a chart, often somebody else's, which is (B) of O3 by another door. A handout file or image, made on the device and sent by the reader, does the job the study asked for (free, readable, no paywall). If (c) is wanted, 2.2 Task 3 specifies it. |
| O7 | An automatic zone repair (`reresolveLocations()`, the Puerto Rico fix) | (a) silent, as now; (b) a new chart version with reason `zone_repaired` | **(b)** | It moves the instant and so can move gates. A note written before it should be able to say so. |
| O8 | Clear birth data and the version history | (a) history kept, (b) history removed with the birth data | **(b)** | A reader who clears their birth data has asked for it to be gone. A history that keeps every earlier birth time defeats the button. Notes stay (they are the reader's words) and read as unresolved until a birth date is given again. |
| O9 | `.mmi` import | (a) not built until its shape is public or licensed; (b) built from a sample file | **(a)** | No public description of the format was found (section 6.3). Reading a closed format from a sample is a legal question before it is an engineering one. |

## 2. Shared pieces

### 2.1 A chart's subject

Every note and version belongs to a subject, written as one string:

| Subject | Form | Example |
|---|---|---|
| a profile on this account | `profile:<profileId>` | `profile:5b0e...` |
| a saved person or client | `person:<personId>` | `person:p3f9a1c...` |

A subject string never contains a name or a birth detail. A person id is the
one `people-library.js` already mints (`'p' + 16 hex`).

### 2.2 The birth record

One shape, used by a version, an import row and an export. It extends what a
profile and a card already carry with the two things an import has to say and
the app has no field for: how precise the time is, and where it came from.

| Field | Type | Notes |
|---|---|---|
| `date` | `YYYY-MM-DD` | required |
| `time` | `HH:MM`, 24 hour, or `null` | `null` whenever `time_state` is not `known`. Never noon. |
| `time_state` | `known` / `unknown` / `unanswered` | birth-time.js's three states, unchanged |
| `time_precision` | `exact` / `approximate` / `null` | new. `approximate` with `time_window_min` (plus or minus minutes) is "about 3 in the afternoon". |
| `time_window_min` | integer or `null` | new, only with `approximate` |
| `time_source` | `AA` / `A` / `B` / `C` / `DD` / `X` / `XX` / `null` | new, optional. The Rodden rating astrologers already use for how a birth time is known (record, memory, biography, unreliable, conflicting, no time, no date). The app never infers it. |
| `place` | text | what the reader or the file named |
| `lat`, `lon` | numbers | required for a version to be drawn; an unresolved place is refused, as the first run refuses it |
| `zone` | IANA name | |
| `offset_recorded` | hours or `null` | the offset the source wrote down, kept as written |
| `offset_used` | hours | the offset birth-time.js computes for that date in that zone, which is what the chart is drawn from |
| `zone_check` | `agrees` / `disagrees` / `not_given` | new. `disagrees` is never resolved silently (section 6.1). |

### 2.3 Addresses

1.3's Chart address proposal is adopted as written, and its two open questions
are answered:

- **Both line forms are kept.** `line:20.3` is the line in the system (a
  student's note on 20.3 in general); `activation:personality:Sun` is "the line
  my Sun holds" and follows the Sun. A note picks one.
- **`facet:cross` is reserved and does not resolve** until a cross is computed
  (vault, Incarnation cross). A note on it resolves as `unavailable`.

Colour, tone and base, if 3.2 computes them, grow an activation's value
(`20.3.4`), and no address changes.

## 3. Notes

### 3.1 The shape

| Field | Type | Notes |
|---|---|---|
| `id` | text | minted on the device, like a memory's local id |
| `subject` | section 2.1 | |
| `address` | section 2.3 | |
| `version` | the chart version id it was written against | |
| `resolved` | object | what the address resolved to at writing (below) |
| `text` | text | the reader's words, at most 4,000 characters |
| `created_at`, `updated_at` | ISO | |

`resolved`, by kind, holds derived values only and never a birth detail:

| Kind | `resolved` |
|---|---|
| centre | `{ defined }` |
| channel | `{ defined, by: [activation addresses] }` |
| gate | `{ held, lines: [n], by: [...] }` |
| line | `{ held, by: [...] }` |
| activation | `{ value: 'gate.line' }` |
| facet | `{ value }` (`Generator`, `Sacral`, `1/3`, `Split`) |

Plus `provisional: true` when the version's `time_state` is not `known` and the
address can depend on the time (the two Moon activations and anything they
define: the Chart address note measures the Moon at a line every 1.7 hours).

### 3.2 When the birth data changes

A note is never moved, rewritten or deleted because the chart changed. On
reading, the address is resolved again against the current version and
compared with `resolved`:

| Outcome | Meaning | What the screen is told |
|---|---|---|
| `same` | the current version resolves it identically | nothing |
| `changed` | resolves differently (a channel no longer defined, a Moon moved line) | the note, its version, then and now |
| `unresolved` | no birth date, or a facet not computed | the note, marked unresolved |

Addresses never disappear (Chart address note: every centre, channel, gate and
line exists in every chart), so there is no "orphaned note". What the screen
does with `changed` is workstream 3's and 4's to design; the model only
guarantees the comparison is possible, because the old version and the
snapshot are both kept.

### 3.3 Whose notes, and the gate

| Subject | Stored | Gate | Default |
|---|---|---|---|
| `profile:` | the profile's own key (section 7) | O1 (`journal` recommended) for sync; always kept on the device | on, as journal entries are |
| `person:` | on the person record itself | the record's `notes_enabled` | **off**, by rule 1. Turning it off destroys `notes` and every chart note, in one write, by rule 2's reasoning. |

A note on another person's chart never syncs under O3 (A), whatever the
reader's journal switch says. The reader's consent switches are the reader's
consent about the reader's data; they cannot consent for anybody else.

## 4. Chart versions

A version is a birth record (2.2) with an identity:

| Field | Type | Notes |
|---|---|---|
| `id` | text, minted on the device | |
| `subject` | section 2.1 | |
| `seq` | 1, 2, 3 ... | per subject |
| `reason` | `initial` / `time_corrected` / `date_corrected` / `place_corrected` / `zone_repaired` / `imported` | `zone_repaired` is O7 |
| `birth` | section 2.2 | |
| `chart_hash` | `PeopleLibrary.chartHash()` of the birth | the same hash the pair cache keys on, so two versions that describe one instant are recognised as one |
| `created_at` | ISO | |

Rules:

1. **A version stores the birth, never the chart.** The chart is computed when
   read, which is the rule CLAUDE.md's cache section rests on: a stored chart
   outlives the arithmetic that made it (STATE_VERSION 2, 3 and 4 each made
   every stored state wrong). So "the old one stays readable" means its birth
   is kept and its chart is drawn again, with today's arithmetic.
2. **A version is made only when the instant or the place can move.** A change
   to the date, the time, the time state, the coordinates or the zone makes
   one; a change to the name, the avatar or the PIN does not. Two edits that
   leave the same `chart_hash` make none.
3. **The current birth stays where it is today** (the profile fields, the
   person record), so nothing that reads a profile changes. Versions are the
   history beside it. The first version of an existing profile is written
   lazily: the moment its birth data first changes, the old values become
   version 1 and the new ones version 2.
4. **Deleting the subject deletes every version.** Clear birth data deletes
   the history too (O8), on the device and, when synced, on the server.

## 5. Other people's charts, and a practitioner's clients

**One store: `incommon.people.v1`, under `people-library.js`'s five rules.**
Its own header calls it "the one store, not two". The screens move onto it from
`incommon.friends` (workstream 3), after 1.4 G6 gives it a deletion path, and
the old key is left in place by `migrateLegacy()`'s existing rule.

A record gains five fields. Each is additive, and `merge()` already copies
every field it does not know, so an older build keeps them (migration policy
rule 7).

| Field | Type | For |
|---|---|---|
| `kind` | `person` / `client` | O4 |
| `versions` | `[version]` | section 4, on the record so one delete removes them |
| `chart_notes` | `[note]` | section 3, on the record, written only while `notes_enabled` |
| `subject_consent` | object, below | what the reader says this person agreed to |
| `birth_meta` | `{ time_precision, time_window_min, time_source, offset_recorded, zone_check }` | section 2.2's new fields, for the current birth |

`subject_consent`:

| Field | Values | Notes |
|---|---|---|
| `basis` | `card` / `stated` / `none` | `card`: the person sent it (the only basis the app can see). `stated`: the reader says the person agreed. `none`: typed or imported with no statement. |
| `scope` | subset of `store`, `notes`, `handout` | what was agreed to |
| `stated_at` | ISO or `null` | |
| `withdrawn_at` | ISO or `null` | a withdrawal clears `notes` from scope, which destroys the notes |

The app records a statement; it cannot verify one, and no screen may present
`stated` as proof. For a `client`, adding the record asks for `basis` and
`scope` (a practitioner's working relationship is the case where asking is
natural), and `notes_enabled` may be switched on only when `scope` holds
`notes`. For a `person` nothing new is asked; the field defaults to `none`, or
`card` when the record came from one.

What a client record does not get: a sync path (O3 (A)), a counter, a "last
seen", or any field that ranks one client against another, by the same
reasoning that keeps Circle free of a seat.

The cap: twelve for `person`, unchanged and still refusing rather than
trimming. A `client` cap is the owner's, with D4.

## 6. Import and export

### 6.1 Rules every import keeps

1. **An import is a deliberate act** with a file the reader chose. It never
   runs from a link or on open.
2. **Each row is a birth record (2.2) or it is refused**, and the refusals are
   listed by row with the reason. Nothing is half imported.
3. **No time is no time.** A missing or empty time imports as `time_state:
   unknown` with `time: null`. Never noon.
4. **A place has to resolve.** Coordinates win when given; a place name with no
   coordinates goes through the same lookup the first run uses; neither is a
   refusal.
5. **A recorded offset is kept and checked, never trusted or dropped.** The
   chart is drawn from `offset_used` (birth-time.js, "the offset belongs to the
   birth date"); a recorded offset that differs is stored as `offset_recorded`
   with `zone_check: disagrees`, and the record is flagged for the reader to
   look at. That is how a source's zone mistake, or a revision of the zone
   database since, is seen rather than absorbed.
6. **A local time that did not happen or happened twice** (the hour a clock
   skipped or repeated) is refused with that reason, because only the person
   who knows the birth can say which side it was.
7. **The cap refuses, it does not trim.** An import that would pass twelve
   imports the first rows up to the cap and names the rest as not imported.
8. **Imported people come in with `subject_consent.basis: none`**, whatever the
   file says, and `source: 'import'`. A file's claim about consent is not the
   person's.
9. **Duplicates update, they do not double**, by `chart_hash`, as `add()`
   already does.

### 6.2 CSV, the first format

A header row; column order free; UTF-8. Proposed columns, all lower case:

| Column | Required | Accepts |
|---|---|---|
| `name` | yes | up to 80 characters |
| `birth_date` | yes | `YYYY-MM-DD` (also `DD/MM/YYYY` only when a `date_order` column says so; a date that reads two ways is refused) |
| `birth_time` | no | `HH:MM` 24 hour, or `h:mm AM/PM`; empty is unknown |
| `time_precision` | no | `exact`, `approximate` |
| `time_window_min` | no | integer |
| `time_source` | no | a Rodden rating |
| `place` | one of place or coordinates | text |
| `lat`, `lon` | | decimal degrees |
| `timezone` | no | IANA name; looked up from the coordinates when absent |
| `utc_offset` | no | hours, as the source recorded them |
| `kind` | no | `person` (default) or `client` |

The export writes the same columns, so a CSV round trips. Notes are not in the
CSV: a note is attached to an address and a version, which a flat row cannot
hold honestly.

### 6.3 Maia Mechanics' `.mmi`

Searched for on 29 October 2026 from public sources only: the product's own
site says it imports charts "from your MMI library through a convenient .mmi
import feature", and a third party help page describes moving a chart to it by
a share link, not a file. **No public page found describes what is inside an
`.mmi` file**: not its encoding, its fields, or whether one file holds one
chart or a library. The vendor's article on upgrading MMI versions returned an
error and could not be read. So this model does not document its shape, and
O9 recommends not building it until the shape is published or licensed.
What the importer would have to produce is already fixed: a birth record
(2.2), through 6.1's rules.

### 6.4 inCommon's own export, `incommon.charts.v1`

A JSON file made on the device and handed to the reader's own download or share
sheet. Never uploaded.

```
{
  "schema": "incommon.charts.v1",
  "exported_at": "...",
  "includes": { "birth_data": true, "notes": true, "people": false },
  "subjects": [
    {
      "kind": "self" | "person" | "client",
      "id": "...",
      "display_name": "...",
      "birth": { section 2.2 } | null,
      "versions": [ section 4 ],
      "notes": [ section 3 ],
      "subject_consent": { section 5 }
    }
  ]
}
```

`includes` is written into the file so anybody opening it can see what it
holds. `people` is O5's tick. Importing this file is 6.1 with every field kept,
notes included. Settings' existing `incommon.profile.v1` export gains the
profile's own versions and notes (they are the reader's data and an export that
leaves them out is the G15 fault again); saved people join it only under O5.

### 6.5 What a handout carries (for 2.2 Task 3)

The model defines the payload; 2.2 writes the rules. A handout is mechanics
only: Type, Strategy, Authority, Profile, Definition, defined centres, defined
channels, and whichever notes the reader picks. **Birth date, time and place
are absent unless the reader turns each on.** The name is a first name and is
off by default for a client.

One caution for 2.2, and it is an inference from the motion rates the Chart
address note measured, not a measurement: **a full activation list at line
level is close to a birth date.** The slow bodies' gates narrow the year, the
Sun's line (one every 23 hours) the day, and the Moon's line (one every 1.7
hours) the time. A handout that prints all twenty six gate.line values with no
birth data may still identify the birth to within a day or two and a few hours.
Whether a handout may list activations, and at what depth, is the question 2.2
should measure before it rules (method in section 9).

## 7. Storage

### 7.1 On the device

| Key | Scope | Shape | Written by |
|---|---|---|---|
| `incommon.p.<pid>.chartVersions.v1` | profile | `{ v: 1, versions: [ section 4 ] }` | ProfileManager, when birth fields change |
| `incommon.p.<pid>.chartNotes.v1` | profile | `{ v: 1, notes: [ section 3 ] }` | ProfileManager |
| `incommon.people.v1` (existing) | device wide today, account scoped after G6 | records gain section 5's fields | `people-library.js` |

Both new keys carry the profile id in the name, so `accountStorageKeys()`
finds them as it is. `_dropProfileKeys()` has to be given both, in the same
change that adds them, or they become G5's fault again. Neither renames or
reshapes an existing key, so the migration policy's "write forward" rules do
not bite; its testing rules (8 to 10) still apply, and the harness gets rows
for: a profile with no versions changing its time (version 1 and 2 appear), an
edit that changes only the name (none appears), Clear birth data (versions
gone, notes kept), delete profile (both keys gone).

### 7.2 On the server (O2 (b), decided)

| Object | Change | RLS |
|---|---|---|
| `memories` | widen the `memory_type` check to add `chart_note`; the note is the memory's `content`, `consent_required` is O1's category | existing policies, existing two-step rule |
| `chart_versions` | **new table**: `id bigint identity`, `profile_id uuid not null references profiles(id) on delete cascade`, `local_id text not null`, `seq int not null`, `reason text not null`, `birth jsonb not null`, `chart_hash text not null`, `created_at timestamptz not null`, unique `(profile_id, local_id)` | **enabled, no policies.** Workstream 2 writes them (2.2 Task 2), and it joins the list in `server/mfa-policies.sql`. |

Why notes ride in `memories`: the consent gate, the three way merge, the single
row deletion (`del-memory`, K62) and the export already exist there, so a note
gets a deletion path and an export path by construction. Why versions do not:
they are birth data, not the reader's words, and they follow the profile row,
not a memory gate.

The `memory_type` change is the one that can stop a push (K69): **the server
is widened first, then `SYNC_MEMORY_TYPES` and K69 change together**, never
the other way round.

Two new outbox operations: `del-chart-versions` (every version of a profile,
for Clear birth data, O8) and nothing for notes (`del-memory` covers them).
`server/account/index.ts` deletes `chart_versions` with the account
(workstream 2's file; profile cascade covers it, the account function should
still name it, as it names the others).

### 7.3 Nothing on the server for other people

Under O3 (A), decided, there is no table for saved people, clients, their versions or
their notes. Under (B) or (C) the table would be workstream 1's and its rules
workstream 2's, designed then.

## 8. Every new piece of data: consent, deletion, export

The check the 1.2 secondary is asked to make.

| Data | Consent category | Deleted by | Exported by |
|---|---|---|---|
| Own chart version | follows the profile row (G2) | delete profile (key and cascade), Clear birth data (key and `del-chart-versions`), delete account (cascade and account function) | `incommon.profile.v1` and `incommon.charts.v1` |
| Own chart note | O1 (`journal`) | `del-memory` per note; delete profile; delete account | both exports, through memories; withheld from the export when its consent is off, as journal entries are today |
| A person's or client's version | none: device only, governed by the record | deleting the person (one write) | `incommon.charts.v1` under O5 |
| A person's or client's chart note | `notes_enabled`, and for a client `subject_consent.scope` holds `notes` | switching notes off, withdrawing consent, deleting the person | `incommon.charts.v1` under O5, with `includes.notes` |
| `subject_consent` | none (it is the record of one) | with the person | with the person |
| `birth_meta` | as the birth it describes | with the record | with the record |

Not new, and carried as known: G6 (saved people not reached by profile
deletion or account erasure) is the precondition for section 5, owned by 1.4;
G15 (saved people in no category, not in the export) is answered by section 5
and O5.

## 9. For workstream 2's privacy review (2.2 Task 1)

**This section is the author's account of the design, not a review of it.**
2.2 Task 1 is a review of this file, and Helpers item 2 says nobody reviews
their own work, so it is done by a session that did not write this file.
The questions it is asked to answer, per kind of data (who can read it, who can
share it, what a client has consented to, how it is deleted), with what this
design claims for each:

1. **Own versions and notes on the server.** Claimed: readable only by the
   owning account through `owns_profile()`, never by another account, never
   by anon; the two-step rule covers `chart_versions` once listed. To check:
   the policy for `chart_versions` is written and the isolation test covers it.
2. **Version history as retained birth data.** Claimed: Clear birth data
   removes it on the device and the server. To check: no path (pull, merge, a
   second device's push) brings a cleared version back, the same way K65 to
   K67 hold deletions.
3. **Third parties never reach the server.** Claimed: no table holds them under
   O3 (A); the card and the import both keep them on the device. To check: no
   push path reads `incommon.people.v1`, and the Oracle dossier never carries a
   saved person (it is built for the active profile).
4. **A profile used for another person.** Not changed here, and worth a
   finding of its own: a profile made for a partner syncs that person's birth
   data under the reader's account today, which Privacy Policy section 5
   describes as "your profiles". Whether that needs words or a control is
   workstream 2's call to raise.
5. **`stated` consent.** Claimed: recorded, never shown as proof. To check: no
   screen or export presents it as the person's own act.
6. **The handout.** To measure before ruling: for a sample of birth moments,
   count how many minutes across 1900 to 2100 share the handout's activation
   set (at gate level, and at line level). That number is how close a "no birth
   data" handout is to birth data.
7. **The export file.** Claimed: made and kept on the device, `includes` says
   what it holds, people off by default. To check: nothing uploads it, and the
   share sheet path names the file honestly.

## 10. After approval: the order of work (Task 2)

Each a commit series prefixed `1.2:`, tested on the local Postgres with the
stubbed auth schema, each migration idempotent with its DOWN:

1. Device: `chartVersions` and `chartNotes` keys, ProfileManager writers,
   `_dropProfileKeys()`, Clear birth data, exports; harness rows (7.1).
   **Built 29 October 2026** at the owner's request, ahead of the review:
   `app/profile-manager.js` 1.6.0, rows O9 to O18. If the review changes
   anything here, this step changes with it.
2. Server (O2 (b)): `0004-chart-versions.sql` (the table, RLS on, no
   policies) and `0005-memories-chart-note.sql` (the widened check), handed to
   workstream 2 for policies before the owner applies them.
3. Client sync, after the server is widened: `SYNC_MEMORY_TYPES`, K69, the
   `chart_versions` push and pull, `del-chart-versions`, K rows.
4. People: section 5's fields in `people-library.js`, after 1.4 G6; the screens'
   move from `incommon.friends` is workstream 3's.
5. Import and export: the CSV and `incommon.charts.v1`, with rows for every
   rule in 6.1.
6. `DATA-MAP.md` and `local-storage-schema.md` updated to what is true.

## 11. Not decided here

Screens (how a `changed` note looks, where a version list lives) are
workstream 3's and 4's. Prices and caps for clients are D4. Group features need
names of inCommon's own (D3). Colour, tone and base are 3.2's. The share link,
if O6 changes, is 2.2 Task 3's to specify.
