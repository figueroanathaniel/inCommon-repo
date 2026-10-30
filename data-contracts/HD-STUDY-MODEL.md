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

**`resolved` is derived from the birth, so it is treated as birth data**
(privacy review F4). Section 12 holds the measurement: a set of gate and line
values names the birth day, and often the hour. So it goes only where the birth
goes. Clear birth data sets every note's `resolved` to null, which reads as
`unresolved` and keeps the words (built, O19). It never travels on a handout. It
is in an export only when that export carries birth data. On the server it rides
in the note's memory row only while the profile row holds a birth, and the push
after a clear sends the nulled note.

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

`chart_note` is in ProfileManager's `MEMORY_CONSENT` as `journal`. Without
that entry the sync's consent gate reads a missing category as allowed, so a note
restored with no `consent_required` would leave with journal off. That is the
K71 fault (privacy review F5; built, O20).

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
| `birth_key` | the birth written out (`b1`, then date, time, unknown mark, lat, lon, zone, offset, joined by bars) | how two versions are compared. It was `chart_hash`, `PeopleLibrary.chartHash()`, until the privacy review: that hash carries STATE_VERSION, so the same birth read as a new version after every arithmetic change (F14), and a hash of a birth is the birth to anybody who can enumerate the days and places (F10), so it only looked like it hid something. It is never exported. |
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
   leave the same `birth_key` make none.
3. **The current birth stays where it is today** (the profile fields, the
   person record), so nothing that reads a profile changes. Versions are the
   history beside it. The first version of an existing profile is written
   lazily: the moment its birth data first changes, the old values become
   version 1 and the new ones version 2.
4. **Deleting the subject deletes every version.** Clear birth data deletes
   the history too (O8), on the device and, when synced, on the server.
5. **A cleared history stays cleared on every device** (privacy review F3).
   Clear birth data queues `del-chart-versions`. Three rules on the pull keep a
   second device from bringing the history back, each with a K row that goes
   red without it:
   (a) a pending `del-chart-versions` for the profile stops the pull from
   adding or keeping any version of it, as `del-memories` does for memories;
   (b) the newest `birthCleared` grant in the merged ledger, whatever followed
   it, when it is newer than the device's `birth_at`, deletes that profile's
   local versions and nulls its notes' `resolved`, so a device that never saw
   the clear still follows it. "Whatever followed it" matters: a clear and then
   a new birth leaves the ledger on the revoke the new birth writes, and a
   device that missed both still holds the cleared birth's history (K87, the
   reviewer's ninth gap). A birth that arrives in a pull moves `birth_at` to
   the pull, so what is written about it afterwards is not cleared by an older
   clear. This is the rule the profile row already follows (K82, K83, K87). **An empty birth on the server is
   never read as a clear**: since F2 it also means only that saving is off, and
   a device must not lose its history because another device turned saving off
   (the follow-up review's review, gap 1);
   (c) a device's first pull never resends `chart_versions` for a profile whose
   latest `birthCleared` event is a grant, whose latest `birthData` event is a
   revoke, or whose latest `forOther` event is a grant. K66 resends absent
   rows on a first pull, to repair an account an older build emptied, and that
   rule must not reach a history the reader cleared or withheld. Migration
   0006 holds the same on the server (the WH rows): a version for a withheld
   profile is dropped on arrival, and a profile's versions are deleted when it
   becomes withheld;
   (d) **a profile that stops being withheld sends its history again**, and
   only when it is withheld on none of the three counts: its latest
   `birthData` is not a revoke, its latest `birthCleared` is not a grant and
   its latest `forOther` is not a grant. Then, and on the event that made it
   so, the device forgets what it recorded as sent for that profile's versions
   and sends them all once more (unmarking a profile whose saving is still off
   sends nothing, by F2), as K86 sends the profile row again, because 0006
   deleted the account's copy and the device's cache still says it was sent;
   (e) **an absent version is a deletion only when the profile's latest
   `birthCleared` event is a grant.** In every other case a version the
   device synced and the server no longer holds was withheld, or is waiting to
   be sent again, and the pull keeps it. Without this, the ordinary three way
   rule (an absence after the first pull is a deletion elsewhere) would delete
   every device's history after a reader turned saving off and on again.
   (d) and (e) are the reviewer's eighth gap (30 October 2026) and each needs
   a K row that goes red without it when step 3 is built.

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
| `basis` | `card` / `stated` / `restored` / `none` | `card`: the record came from a card, which says where it came from and not who agreed (F7, below). `stated`: the reader says the person agreed. `restored`: what the reader's own backup noted (6.4); it keeps the record and notes its scope holds and opens no handout until the reader states it again (follow-up finding 11). `none`: typed or imported with no statement. |
| `scope` | subset of `store`, `notes`, `handout` | what was agreed to |
| `stated_at` | ISO or `null` | the day the word was given. A word with no day, or dated after the handout, opens nothing, and a handout word lasts a year (`share-rules.js` `WORD_DAYS`), after which the reader asks again (follow-up finding 12) |
| `withdrawn_at` | ISO or `null` | see withdrawal below |

**`card` is where the record came from, not a consent** (privacy review F7). A
card is sent from the sender's active profile, which may itself be somebody
else's chart, so a card shows that a chart arrived, not that the person in it
agreed to anything. Only `stated` with the act in `scope` permits anything past
the default. `share-rules.js` follows that rule: `card` alone does not open a
handout.

**Withdrawing takes what was withdrawn** (privacy review F8). Withdrawing
`store` deletes the record, its birth, its versions and its notes in one write,
the same as deleting the person, because a record kept after its subject said
no is the thing withdrawal exists to stop. Withdrawing `notes` destroys the
notes. Withdrawing `handout` stops handouts and deletes nothing, because the
handouts already made were sent by the reader and the app cannot reach them.

The app records a statement; it cannot verify one, and no screen may present
`stated` as proof. What it can do is make the record say more, and it does:
the day, the scope, and a year's life for a handout (finding 12). It remains a
record and a moment of friction, not a protection, and the owner was told so on
30 October 2026.

**Another person's notes and name are past the default** (finding 10). A note
is free text and can name the person, so the notes the reader picked go on a
`person`'s handout only with that person's handout word, and so does their
first name; on the reader's own chart they go as before. For a `client`, adding the record asks for `basis` and
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
   person's. inCommon's own export (6.4) carries no `subject_consent` and no
   basis (privacy review F6); it carries `consent_noted`, the scope, the day
   and any withdrawal the reader recorded, and `ShareRules.restoreConsent()`
   turns that into `basis: restored`, which keeps the person's record and
   notes where the scope held `store` and `notes` and opens no handout until
   the reader states the word again (`confirmWord()`). So a practitioner's
   restore no longer drops every client's notes (the follow-up review's
   finding 11), and a file still cannot open a handout. **The trade-off, said
   plainly**: this is a second way a person's notes come in besides the
   reader's own hand, and a hand edited file can use it. It brings in only the
   notes the file itself carries, which an import brings in anyway.
9. **Duplicates update, they do not double**, by the people store's own
   `chart_hash`, as `add()` already does. That hash is the store's, computed on
   the device and never written into an export (6.4, F10); a chart version's
   key is `birth_key` (section 4).

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
      "consent_noted": { "scope": [...], "noted_at": "...", "withdrawn_at": null }
    }
  ]
}
```

`includes` is written into the file so anybody opening it can see what it
holds. `people` is O5's tick. Importing this file is 6.1 with every field it
carries kept, notes included; `subject_consent` is not among them (6.1 rule 8,
privacy review F6), `consent_noted` comes back as `basis: restored` (rule 8),
and `birth_key` is not carried; the importer computes it again (F10).
`consent_noted` is written only for a person or a client whose record is
`stated` or `restored`.

**The file is plaintext and is named for what is in it** (privacy review F11):
`inCommon charts, with birth data, 2026-10-30.json` or `inCommon charts, notes
only, ...`, with `and other people` when O5's tick is on. That is honest about
the file and does not protect it: nobody can encrypt it without a passphrase
design, which this model does not add. `people-library.js` rule 5, "nothing
leaves", stays true of the store and becomes false of a person the reader
exports, so that module's header gains a sentence saying so in step 4. Settings' existing `incommon.profile.v1` export gains the
profile's own versions and notes (they are the reader's data and an export that
leaves them out is the G15 fault again); saved people join it only under O5.

### 6.5 What a handout carries (for 2.2 Task 3)

The model defines the payload; 2.2 writes the rules (`app/share-rules.js`). **A
handout carries Type, Strategy, Authority, Profile, Definition and whichever
notes the reader picks, and nothing else by default** (privacy review F1,
measured in section 12). The defined centres, the defined channels, the gates
and the activations are birth data for this purpose, exactly as the date, the
time and the place are: each is off until the reader turns it on, and on
another person's chart each needs that person's stated word. The name is a first
name and is off by default for anybody but the reader.

The caution this section used to carry, an inference that a full activation
list at line level is close to a birth date, was measured before 2.2 ruled:
section 12 has both measurements, and the default above follows them.

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
| `chart_versions` | **new table**: `id bigint identity`, `profile_id uuid not null references profiles(id) on delete cascade`, `local_id text not null`, `seq int not null`, `reason text not null`, `birth jsonb not null`, `birth_key text not null`, `created_at timestamptz not null`, unique `(profile_id, local_id)` | **enabled, no policies** in 0004; read, add and delete for the owner in 0005 (2.2 Task 2), no update, because a version is history. It is on the list in `server/mfa-policies.sql`. |

Why notes ride in `memories`: the consent gate, the three way merge, the single
row deletion (`del-memory`, K62) and the export already exist there, so a note
gets a deletion path and an export path by construction. Why versions do not:
they are birth data, not the reader's words, and they follow the profile row,
not a memory gate.

The `memory_type` change is the one that can stop a push (K69): **the server
is widened first, then `SYNC_MEMORY_TYPES` and K69 change together**, never
the other way round.

**Versions sync only while "Save my profile to my account" is on** (privacy
review F2, decided by the owner on 30 October 2026: section 13). That switch sets the
`birthData` consent, and the push reads it: off, the profile row goes up
without its birth (section 13) and no version goes up at all, because a version
history is more birth data than the profile row (every birth the reader ever
gave). Turning the switch off queues `del-chart-versions`, and migration 0006
deletes the profile's versions on the server when the revoke arrives, so the
history goes even if the deletion is lost. Turning it back on sends the whole
history again, and the pull never reads a withheld history's absence as a
deletion (section 4 rule 5 (d) and (e)).

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
| Own chart version | follows the profile row (G2), and only while "Save my profile" is on (F2) | delete profile (key and cascade), Clear birth data (key and `del-chart-versions`), delete account (cascade and account function) | `incommon.profile.v1` and `incommon.charts.v1` |
| Own chart note | O1 (`journal`, in `MEMORY_CONSENT`); its `resolved` as birth data (F4) | `del-memory` per note; delete profile; delete account; Clear birth data nulls `resolved` | both exports, through memories; withheld from the export when its consent is off, as journal entries are today |
| A person's or client's version | none: device only, governed by the record | deleting the person (one write) | `incommon.charts.v1` under O5 |
| A person's or client's chart note | `notes_enabled`, and for a client `subject_consent.scope` holds `notes` | switching notes off, withdrawing `notes` or `store`, deleting the person | `incommon.charts.v1` under O5, with `includes.notes` |
| `subject_consent` | none (it is the record of one) | with the person | never (F6) |
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
4. **A profile used for another person.** Raised by the review as F9 and
   decided by the owner in section 13. As written before the review: a profile made for a partner syncs that person's birth
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
   policies; written) and `0006-memories-chart-note.sql` (the widened check),
   handed to workstream 2 for policies before the owner applies them. 0005 is
   2.2's policies for 0004. **Before the owner applies 0004**: Privacy Policy
   sections 5 and 14 name the version history (privacy review F12), in the
   same change, with the date moved.
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

## 12. The privacy review, and what changed (30 October 2026)

2.2 Task 1 was done by a session that did not write this file, as section 9
asks. Its verdict: **not ready for migrations**. Its report reached the owner
as text and is not in this repository; the findings and what this file now
says about each are below. Every line number it cited was read again here
before anything was changed.

Its measurement of section 9's question 6, over 30 targets, points the same
way as `tools/measure-handout-identifiability.js` (2.2 Task 3, 40 targets in a
crowd of 3,000). They are not the same claim: the review counted the minutes
in two centuries that share a handout (whether the birth can be recovered),
Task 3 counted how often a handout is unique among 3,000 births. The review's
own figure for the five facets with centres and channels inside the birth year
rests on small samples (five of thirty targets had no hit, and clustering
across days was not measured), so it is rough:

| A handout carrying | The review: births that fit | Task 3: births alone among 3,000 |
|---|---|---|
| Type, Strategy, Authority, Profile, Definition | about 690,000 minutes | 2.4% |
| that and the defined centres and channels | about 400 minutes, inside the birth year | 39% (centres), 88% (channels) |
| the gate set alone | median 349 minutes, inside the birth year | 97% |
| all 26 activations at gate and line | median 62 minutes, one stretch, on the birth day | 99.5%, one day in two centuries |

| | Severity | Finding | Now |
|---|---|---|---|
| F1 | High | activations and gate lists are birth data; the default handout must be the five facets | **met.** 6.5 rewritten; `share-rules.js` already defaulted to the five (T rows) |
| F2 | High | versions would sync with "Save my profile" off | **decided and built** (section 13): versions and the profile row's birth both read the switch |
| F3 | High | Clear birth data does not reach a second device: no pull rule, K66 resends, the pull knows no `del-chart-versions` | **specified**, section 4 rule 5 (a) to (c); built with the sync, step 3, each with a K row |
| F4 | High | `resolved` is derived birth data and survived Clear birth data | **built** (O19) and 3.1; handouts never carry it, exports only with birth data |
| F5 | Medium | no `MEMORY_CONSENT` entry for `chart_note`, so a restored note would leave with journal off | **built** (O20) |
| F6 | Medium | importing inCommon's own export could launder consent | **fixed**: the export carries no `subject_consent`, 6.1 rule 8 and 6.4 |
| F7 | Medium | `card` overstates; an exported `stated` reads like a consent record | **fixed**: `card` is provenance only, section 5; `share-rules.js` asks for `stated` |
| F8 | Medium | withdrawing consent kept the birth data | **fixed**: withdrawing `store` deletes the record, section 5 |
| F9 | Medium | a profile made for another person syncs, feeds the Oracle and makes cards | **decided** (section 13): the data and sync half built, the screens specified for workstream 3 |
| F10 | Medium | `chart_hash` is an unsalted hash of a birth and links a person across files | **fixed**: versions carry `birth_key`, the birth written out, never exported; 0004's column renamed |
| F11 | Low | export files are plaintext with generic names; people-library rule 5 becomes false | **specified**, 6.4: named for contents, plaintext said plainly, rule 5's sentence in step 4 |
| F12 | Low | Privacy Policy sections 5 and 14 must name the version history | **section 3 built** (the device history, true since 1.7.1) and the operator path for section 14 written (`docs/LEGAL-SETUP.md`); **sections 5 and 14 drafted and held** for step 3, text in section 15. The owner applied 0004 ahead of it on 30 October 2026, since `chart_versions` stays empty until step 3 |
| F13 | Low | `mfa-policies.sql` must be re-run and the account function must name `chart_versions` | **met** by 2.2 Task 2 (0005, the list, the account function, K74) |
| F14 | Low | `chart_hash` carries STATE_VERSION, so the same birth reads as new after a bump | **built** (O21): `birth_key` |

**Two decisions were the owner's, and both are made: section 13.** The text
below is the question as it was put.

- **F2. Should a version history leave the device while "Save my profile to my
  account" is off?** Recommended: no. A version history is every birth the
  reader ever gave, which is more than the profile row, and the switch is the
  reader's own word about birth data leaving. This reads the owner's G2 answer
  ("syncing remains constant when profile is saved") as a statement about a
  saved profile, which it still is: saved, the history syncs and carries on
  where the last device left it. **Found on the way, and wider than this
  model:** the switch does not stop the profile row either. It sets the
  `birthData` consent, and the push sends profile rows whatever that consent
  says. So today the switch is a control that changes nothing about what is
  sent. That is a fault in `incommon-cloud.js` as shipped, not in this model,
  and it is raised for whoever owns the sync, with the owner deciding whether
  the switch should gate the profile row or come off the screen.
- **F9. A profile made for somebody else.** It syncs that person's birth under
  the reader's account, feeds the Oracle, and is what a card is sent from.
  Options: (a) say so in the Privacy Policy and change nothing else; (b) a
  profile marked as somebody else's stays on the device, is not sent to the
  Oracle and cannot send a card, which is O3 (A) applied to profiles; (c)
  steer such a chart into saved people rather than profiles. Recommended: (b),
  with (a) in the same change, because it is the rule this model already keeps
  for every other person's chart.

## 13. F2 and F9, as the owner decided them (30 October 2026)

**F2.** The owner: "no, and absolutely fix that. it serves no purpose if it
defaults with no option." So a version history never leaves the device while
"Save my profile to my account" is off, and the switch now governs the profile
row as well, which it never did.

Built, `incommon-cloud.js` (buildPlan and the pull, which 1.2 owns) and
`profile-manager.js` 1.7.0:

- **Off, the profile row still goes up and every birth field goes up empty**:
  date, time, place, coordinates, zone, offset, whether the place resolved and
  the unknown time mark. The row stays because memories, the ledger and pairs
  hang off it. So the account stops holding the birth at the next push, and
  the device keeps its own copy.
- **An empty row never empties a birth.** A pull reads whether the birth is
  saved from this device's decision and the account's ledger, the later one
  deciding, because the ledger arrives in the same pull. A device that held
  the birth keeps it when another device turns the switch off (K77); a device
  that never had it gets the profile without it (K76).
- **Never decided reads as on while the profile has a birth date**
  (`consentState()`, `getConsents()`), because that is what `createProfile`
  has always recorded and what every profile given its birth later has been
  synced as. Only the switch turned off reads as off. Without this, a profile
  given its birth after it was made would have shown the switch off while it
  synced, and would have stopped syncing the moment the push read the switch.
- **The cache moves with the switch**: a profile's sync hash is the hash of
  what was sent, so turning the switch either way is a change the next push
  sends, and a profile with the birth saved hashes exactly as before, so
  nothing already synced is sent again.
- Held by K75 to K78. K75, K76 and K78's first half are red on the module
  before; K77 is the guard on the new code, and goes red when the ledger merge
  is taken out.
- The Privacy Policy, section 5, says what the switch does now, dated 30
  October 2026.

Clear birth data travels as a ledger mark, so it reaches every device whatever
the switch says: section 14, finding 1. (Until then this paragraph said a clear
with the switch off cleared one device only, which the follow-up review showed
let another device upload the cleared birth again.)

**F9.** The owner: "(b), with the privacy policy wording from (a). Also,
introduce (c). Separate the primary profiles from the friends."

Built, `profile-manager.js` 1.7.0 and the sync:

- **A profile is the reader's own or made for somebody else.** `for_other:
  true` on the profile (absent, never false, on the reader's own, so their
  hash is unchanged); `createProfile({ forOther: true })`,
  `setProfileForOther(id, on)`, `isForOther(id)`, and `forOther` on every
  profile the module hands out.
- **One made for somebody else stays on the device**: no memories, no pair and
  none of its own ledger but the mark is sent, only an empty row (K79).
  Marking one that was already synced sends the empty row and the mark, and
  migration 0006 empties the account's copy and deletes its journal,
  Throughline and Oki rows when the mark arrives; nothing written afterwards
  goes up, and the profile and its journal stay on the device through the
  pulls after (K80). **Marking deletes nothing** (the 2.2 review's RV1, 30
  October 2026): it used to queue `del-profile`, and a push that failed after
  that deletion left the account with neither the row nor the mark, so
  another device read the absence as a deletion and dropped its own copy and
  journal (K88, red on the old code). A deletion an older build queued on
  marking is dropped for a profile the device still holds (K92). Unmarking it
  sends it again with every entry it holds, because what the device recorded
  as sent for its journal, Throughline and Oki rows is forgotten whenever the
  mark moves (K81, and K95 with only pushes between, red without that).
  Another device that held the account's copy learns the mark and keeps its
  own copy and journal (K84).
- **The two are listed apart**: `ownProfiles()` and `otherProfiles()`. That
  is (c)'s data half: the reader's primary profiles and the friends' are never
  one list.

**For workstream 3, the screens** (the app file is theirs; this is the
specification, and the owner can move it to this session instead):

1. Wherever profiles are listed (the profile card in both shells, the switcher,
   Settings), two groups: the reader's own first, then Friends, from
   `ownProfiles()` and `otherProfiles()`. Never one mixed list.
2. Adding a profile asks whose it is, and a profile's own page has a switch,
   "This profile is for someone else", which calls `setProfileForOther()`.
   The registration card and the first run always write the reader's own.
3. The Oracle, the Cycle Audit's reading and Omni refuse a profile made for
   somebody else on the page, before anything is sent, the way they refuse the
   sample chart. Since the follow-up the server refuses a reading too, with
   `FOR_OTHER` (the cloud module's reason `forOther`), once the profile's mark
   has reached the account; until then, and for Omni, which carries no profile,
   the page is the only place it holds.
4. No card is made from a profile made for somebody else.
5. (c), moving a friend out of profiles: "Move to saved people" copies the
   birth into the saved people store with `subject_consent.basis: none`
   (section 5) and then deletes the profile through the existing typed name
   dialog, which must say that the profile's journal and notes go with it. Until
   1.4 G6 gives the saved people store a deletion path, this writes to the store
   the Synastry screen reads today.
6. The Privacy Policy, section 14, gains this sentence in the same change as
   items 2 to 4, and not before, because before them it describes a control that
   does not exist: "A profile you mark as being for someone else stays on your
   device: it is not copied to your account, it is not sent to the Oracle, and no
   card is made from it." The policy's date moves with it.
7. A profile has no `subject_consent`, so a profile marked for somebody else
   can only ever get the base handout from `share-rules.js` (the reviewer's
   gap 7). If the screen should offer that person's word as it does for a
   saved person, the profile needs the field first; that is a model change.
8. Readers who already made a profile for somebody else are asked once, on
   the profile list, which of their profiles are someone else's, because
   nothing else would ever mark the profiles that exist today (the follow-up
   review's finding 7).

## 14. The follow-up review (30 October 2026)

The reviewing session read sections 4 to 6, 12 and 13 and the code at e5157c7
and sent sixteen findings. It did not run the K rows or the RLS harness. What
each now says:

| | Finding | Now |
|---|---|---|
| 1 | an empty birth on the server means both "cleared" and "not saved", so a clear with the switch off reached one device and another could upload the cleared birth | **built**: Clear birth data writes a `birthCleared` ledger event, which syncs whatever the switch says and carries no birth. A device whose birth is older than the clear (`birth_at`, stamped on every birth change) drops its birth, its history and its notes' `resolved` on the pull; a birth given after the clear writes the revoke and stands. K82, K83 |
| 2 | the for_other mark never left its device, so another device could push the profile back | **built**: the mark is a `forOther` ledger event, and the marked profile goes up as an empty row carrying nothing but that event, because the ledger hangs off the row. Another device learns the mark on its next pull, even one that changed the profile since, keeps its own copy and journal, and sends back only the empty row. K79, K80, K84 |
| 3 | share-rules.js shaped a profile made for somebody else as the reader's own | **fixed** on the security branch: a chart carrying `forOther` is shaped as `person`. T11 |
| 4 | only an up to date client honours the switch and the mark; an older cached build still sends the birth | **built**, the owner's yes of 30 October 2026: migration 0006 empties a profile row by the account's ledger (birth while `birthData` is revoked or `birthCleared` granted, the whole row while `forOther` is granted) when the row arrives and when an event arrives, and refuses nothing; the push sends a row again after its own moved events (K86). Postgres rows WH1 to WH12. An older build loses its own local birth at its next pull until it reloads, which is the cost, said in the migration |
| 5 | marking a profile for somebody else leaves the Oracle readings written from it, which are keyed by the account | **built**, the owner's yes: a reading carries `profile_id`; 0006 withdraws the kept readings of a profile that becomes withheld and keeps none of a withheld profile's new ones (`served`); the Oracle refuses a marked profile with `FOR_OTHER` (harness rows OR1 to OR10, K29d). Readings stored before carry no profile and are not found |
| 6 | Privacy Policy section 14 did not get the (a) wording | **held on purpose**: the sentence describes a control, and until workstream 3 builds it there is no way to mark a profile. It ships with the screen (section 13, item 6). **The owner confirmed on 30 October 2026**: "hold the section 14 sentence until the screens exist" |
| 7 | F9 is inert until the screens exist, and profiles already made for other people stay on the server | **true**. Workstream 3's spec gains: existing readers are asked once, on the profile list, which profiles are someone else's |
| 8 | F3 versions sync, F11 and F12 are specified only; G6 is open | **true, and the tables in sections 12 and 13 say so**: built means built, specified means waiting on step 3 or 4 |
| 9 | the Oracle with the switch off sends the dossier and the readings are kept | **fixed**, the owner's "fix now": the dossier still has to be sent for a reading to be written, but the account keeps no reading of a profile whose birth is not saved or was cleared, and switching off withdraws the kept ones (finding 5's mechanism). Privacy Policy section 6 says so |
| 10 | a person's picked notes go on a handout with no word | **fixed**: notes and the first name are past the default on another person's chart (section 5, T12, T4) |
| 11 | restoring a backup drops every client's consent | **fixed**: `consent_noted` and `basis: restored` (6.1 rule 8, T14) |
| 12 | `stated` is a record, not a protection | **made a stricter record**, and still a record: dated, never in the future, a year's life for a handout, and the refusal says which (T13). Section 5 says what it cannot be |
| 13, 14, 15, 16 | the card line in section 5, `chart_hash` in section 4 and 6.1, the old caution in 6.5, the word "agrees" in section 12 | **fixed** in this file |

**The reviewer then reviewed these answers** (30 October 2026, at 101eb4b, at
the owner's request in that session). Points 2 to 16 hold, point 1 holds for the
profile row, and seven gaps came back:

| | Gap | Now |
|---|---|---|
| 1 | section 4 rule 5 (b) and (c) still read an empty server birth as a clear, and 7.2 said the push does not read the switch | **fixed** in this file: both rules key on the ledger, and 7.2 says what the push does |
| 2 | 0006 covers the profile row and the readings, not `chart_versions`, memories, the Throughline or Oki messages | **`chart_versions` built** on the security branch (0006 drops a version for a withheld profile and deletes a profile's versions when it becomes withheld). Memories, the Throughline and Oki messages of a marked profile: **built**, the owner's "yes, drop them too" of 30 October 2026: 0006 drops one that arrives for a marked profile and deletes the ones held when the mark arrives (WH17, WH18) |
| 3 | the ledger is ordered by client clocks, so a device whose clock runs ahead outranks a later true event | **built** on the security branch: 0006 clamps an event dated more than five minutes ahead of the server to the server's time. The device side (`birth_at` against another device's `updatedAt`) still compares clocks; said, not fixed |
| 4 | a backup can bring a person in with notes kept (`basis: restored`), a second way in that people-library.js rule 1 does not have | **said**, in `share-rules.js`'s header and 6.1 rule 8: a file can keep the notes it already carries and can open no handout. The trade-off is the owner's to know |
| 5 | the refusal and the withdrawal need the client's `profileId`; and the Oracle function's comment said an id with no profile row is not stored, when it is | **comment corrected**. The older client point stands as disclosed |
| 6 | for a marked profile an older build loses the name and picture at its next pull, not only the birth | **said** in 0006's note |
| 7 | profiles carry no `subject_consent`, so a profile marked for somebody else only ever gets the base handout | **noted** for workstream 3 in section 13 |

The reviewer checked these answers at 2a95d7a (module tests 502/502, the RLS
harness 32 of 32): gaps 1 to 5 hold. It found an eighth:

| | Gap | Now |
|---|---|---|
| 8 | 0006 deletes a profile's versions when it becomes withheld, and nothing says what happens when it stops being withheld: the device's cache still says they were sent, and an ordinary three way pull would read their absence as a deletion and remove every device's history | **specified** for step 3, section 4 rule 5 (d) and (e) and section 7.2: the history is sent again when the profile stops being withheld, and only a `birthCleared` grant makes an absence a deletion. Data loss rather than privacy, and nothing live today: versions do not sync yet |

The reviewer checked gap 8's fix at 82f797f (module tests 502/502, the RLS
harness 32 of 32) and found two more:

| | Gap | Now |
|---|---|---|
| 9 | rule (d) sent the history again on one scope's change, so unmarking a profile whose saving was still off would send it, against F2 | **fixed** in rule (d): only when the profile is withheld on none of the three counts |
| 10 | in built code: the pull read only the latest `birthCleared` state, so a clear followed by a new birth was skipped on a device that missed both, which kept the cleared birth's version history and what its notes resolved to (against O8 and F4) | **fixed** in `profile-manager.js` 1.7.1: the pull acts on the newest `birthCleared` grant whatever followed it, when this device's birth is older than it, and a birth that arrives in a pull moves `birth_at`. K87 drives the sequence and was red on 1.7.0, with two versions and the old note's `resolved` kept. Rule (b) says the same |

**Found while building finding 4, in this session's own fix for finding 2.**
A push sent the empty row and the mark, then flushed the deletion marking had
queued, and on the live schema deleting a profile takes its ledger: a
debounced push, with no sync before it, left the account with neither, and the
other device then dropped its copy. The fake database in the K rows kept the
ledger on delete, which is why K79 to K84 passed. It cascades as the live one
does now, the push flushes deletions first, and a flushed deletion of a profile
still marked forgets what was sent for it so the next push sends it again (K85,
red before).

What finding 2's empty row still costs, said plainly: the account keeps a row
with an id and nothing else for each profile made for somebody else, so that
the mark can reach the account's other devices. A build older than this one
does not know the mark, and is finding 4.

## 15. The review of the standing pull requests (30 October 2026)

The 2.2 reviewer reviewed both standing pull requests at 7e317dd and fd745a1
and returned two required changes, RV1 and RV3, and four notes. It wrote the
privacy review these answer, so it said the review was not blind. The owner
decided RV3 in the reviewer's session ("if a profile is deleted, delete it
everywhere") and confirmed it here on the same day, with saved people
included ("yes, go ahead with all of it"). Built on the security branch:

| | Finding | Now |
|---|---|---|
| RV1 | marking a profile queued `del-profile`, flushed before the push; a push that failed after it left the account with neither row nor mark, and another device dropped its copy and journal, against section 13 | **fixed**: marking deletes nothing. The empty row and the mark go up, and 0006 empties the row and deletes the profile's journal, Throughline and Oki rows when the mark lands, so a failed push leaves the account as it was. What the device recorded as sent for those rows is forgotten whenever the mark moves. An older build's queued deletion is dropped for a profile the device still holds. K88, K92, K95 |
| RV3 | a deleted profile came back: a device that changed it since its last sync kept and resent it, and a device on its first pull resent it with its journal, because nothing on the server recorded the deletion | **fixed**: migration 0007 adds `deleted_profiles` (the account, the profile's id and the server's time, nothing else) and 0008 its rules (read and add your own, no update, no delete). Recording a deletion removes the profile's row and everything under it and withdraws its kept Oracle readings; anything sent for it afterwards is dropped without an error, and a reading finished for it is stored as `served`. Every pull reads the records and deletes the profile on that device, the first pull included and over changes made there since. Postgres rows DP1 to DP13, module rows K89 to K91, K93 |
| RV3, saved people (G6) | the people a profile saved, in `incommon.people.v1`, outlived it | **fixed for profile deletion**: `people-library.js` 1.1.0 `forgetOwner()`, called by `profile-manager.js` 1.8.0 for a deletion made here and one another device made, with a direct fallback when the module is not loaded. P30, K94, O24. **Not done: account erasure** (Delete account with "erase this device"), because the erase loop is in the app file, which is workstream 3's: it needs one call to `PM._forgetPeople(id)` for each of the account's profiles before the keys go, handed over in the security branch's charter |
| note | the ledger's fifty event cap could drop an old `forOther` grant, so a resend and `profile_withheld()` would miss the mark | **fixed**: the ledger keeps its last fifty events and the latest event of every consent beyond them. O23 |
| note | the F12 wording reads as coming before 0004 | **stands**: F12 is specified, waiting on step 3, and the migrations README gives the order |
| note | Privacy Policy sections 5 and 6 are true only once 0006 is applied | **true, and now 0007 too**: the migrations README says the app ships after 0006 to 0008 in one window, and section 5 now says a deleted profile is deleted from every device |
| note | `share-rules.js` is not loaded by the app yet | **true**, workstream 3's |

The reviewer re-checked these at 1eb9292 and found RV1 and RV3 hold. Of its
low items, the six profile case is **fixed** after the merge (profile-manager.js
1.8.1, O25, red on 1.8.0): the deleted profiles are removed before the fresh one
is made, so a device whose six profiles were all deleted elsewhere ends on the
fresh one in that pull rather than the next. A row written to a child table by
the service role carries no `auth.uid()`, so 0007 cannot drop it; nothing in
`server/` writes those tables that way, and a function that does must call
`profile_deleted()` itself.

What it costs, said plainly. The account keeps a row for every profile ever
deleted, holding two ids and a time, until the account is deleted; that is
what makes the deletion hold on a device that has not synced since. A pull
that cannot read `deleted_profiles` fails and applies nothing, so the app must
not ship before 0007 is applied. And a device the deletion would leave with no
profile starts over with a blank one, as the delete dialog does.

**F12, the wording held for step 3** (drafted 30 October 2026 at the owner's
request). Ship both in the change that syncs versions, with the policy's date
moved, and not before, because each describes syncing that does not exist yet.

Section 5, a paragraph after the "Save my profile to my account" one:

> The copy kept with your account also includes each profile's earlier birth
> details, the dated versions described in section 3, but only while "Save my
> profile to my account" is on. Switch it off and they are removed from your
> account and stay on your device. Clearing a profile's birth details removes
> them from your device and your account, and deleting the profile or your
> account deletes them everywhere.

Section 14, after "contact us.":

> We will delete that profile and everything kept with it, including its
> earlier birth details, and the devices signed in to that account will remove
> it the next time they sync.

Section 3's bullet says the app can show what a reading or a note was written
against. That screen is workstream 3's; if it does not, the clause goes.

