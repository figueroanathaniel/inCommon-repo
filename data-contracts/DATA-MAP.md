# inCommon data map: device, server, consent, sync

Written 27 October 2026 from the code at `main` 2240744, not from earlier
documents. Every key below was found by searching `app/` for `incommon.`,
`incommon_`, `localStorage`, `sessionStorage`, `readLS` and `writeLS`, and every
column by reading the SQL in `server/` and the writes in `app/incommon-cloud.js`
and the Edge Functions. The key by key reference, with shapes, is
`local-storage-schema.md` beside this file.

What this does not cover, because the repository does not hold it:
`cast_counters` and `entitlements` exist only as dashboard saved queries
(`server/cloud-schema.sql` header), so their columns are not mapped here.

## How to read it

- **Scope.** *Profile*: one copy per profile, the profile id is in the key (or,
  for two keys, inside the value). *Account*: one copy per signed in account on
  this browser (ProfileManager adds `.u.<userId>`; the guest uses the plain
  key). *Device*: one copy for the whole browser, shared by every account and
  profile on it. *Tab*: sessionStorage, gone when the tab closes.
- **Sync.** *Push* means `buildPlan()` sends it on every push. *Pull* means
  `merge()` brings it back down. *No* means it never leaves the device.
- **Gate.** The consent that decides whether a row may go up, read live from
  ProfileManager on every push.

## The synced record

| Data | Device key | ProfileManager field | Server table . column | Gate | Sync |
|---|---|---|---|---|---|
| Profile identity | `incommon.profiles.v1[.u.<uid>]` `profiles[]` | `id` | `profiles.id` (the local id is the primary key) | none | push, pull |
| Owning account | (the session) | (none) | `profiles.account_id`, `accounts.id` | none | push |
| Name | same | `name` | `profiles.name` | none | push, pull |
| Avatar | same | `avatar_color`, `avatar_kind`, `avatar_image` (a data URL photo), `avatar_sign` | same names | none | push, pull |
| Birth date, time, place | same | `birth_date`, `birth_time`, `birth_location` | same names (text) | birthData, "Save my profile to my account": off sends these empty (G2, since 30 October 2026) | push, pull |
| Coordinates and zone | same | `birth_lat`, `birth_lon`, `timezone`, `tz_offset`, `location_resolved` | same names | none | push, pull |
| Time question answered "unknown" | same | `birth_time_unknown` | `profiles.birth_time_unknown` | none | push, pull |
| PIN | same | `pin_hash` (salted by profile id) | `profiles.pin_hash`; `pin_updated_at` written only by `completePinRecovery()` | none | push, pull |
| Profile created | same | `created_at` | `profiles.created_at` is the server's `now()` at first upload, never the local value (G9) | none | not sent |
| Active and default profile | same, `activeId`, `defaultId` | (store level) | `profiles.is_active`, `profiles.is_default` | none | push (only when that profile's own fields changed, G1), pull on adoption |
| Last push | (none) | (none) | `profiles.updated_at` (stamped at push) | none | push |
| Two-person consent | same, `pairs[]` `{ key, a, b, enabled, enabled_by, enabled_at }` | `pairs` | `pairs.profile_a`, `profile_b`, `enabled`, `enabled_by`, `enabled_at`, `account_id` | none (governance record) | push, pull |
| Consent ledger | `incommon.consent.<pid>` `events[]` `{ ts, id, granted }`, last 50 | `getConsents()`, `setConsent()` | `consent_events.scope` (= `id`), `action` (`grant`/`revoke`), `via` (always `user`), `ts` | none (governance record) | push, pull |
| Journal entries | `incommon.p.<pid>.memories`, `memory_type: 'journal'` | `addMemory()`, `getMemory()` | `memories.local_id` (= `id`), `memory_type`, `content` (jsonb; a JSON string on the device), `created_at`, `is_private` (0/1 there, boolean here), `consent_required`, `kept` | `journal` | push, pull |
| Mood check-ins | same, `mood` | same | same | `mood` | push, pull |
| Practice completions | same, `practice_completion` | same | same | `assessments` | push, pull |
| Reading history (Oki era) | same, `stella_conversation` | same | same | `conversation` | push, pull |
| Archive records | same, `archive_deleted` | same | refused by the server's type check, so never sent (K69) | (none) | no |
| Kept rows | any memory with `kept: 1` | same | not sent while its gate is closed | its type's | no while gated |
| Manual Throughline | `incommon.p.<pid>.throughline` | (app's `mkey()`, read by the cloud module directly) | `throughline_entries.payload` (the whole item), `local_id` (`item.id`), `created_at` | `journal` | push, pull |
| Oki conversation | `incommon.p.<pid>.oki` | (cloud module reads it directly) | `oki_messages.payload`, `local_id`, `created_at` | `conversation` | push, pull. Nothing in the app writes this key since Oki was unwired in V1.6.0. |
| Phone given on the registration card | (not stored on the device) | (none) | `auth.users.raw_user_meta_data.contact_phone`, E.164 | none | sent once, at sign up (K25c) |
| Newsletter answer | (not stored) | (none) | user metadata `newsletter`, `newsletter_source` (`app-register` or `cover-signup`), `newsletter_decided_at` | none | sent once, at sign up |
| Where the sign up came from | `incommon.signup.from` (tab) | (none) | user metadata `signup_from` `{ source, medium, campaign, content }` | none | sent once, at sign up |
| Phone to sign in with | (none) | (none) | `auth.users.phone`, confirmed by a text | none | `phoneAddStart()` / `phoneAddVerify()` |

**The registration card (26 October 2026).** `regSubmit()` writes the date,
time and place into the active profile through `PM.updateProfile()`, which
re-geocodes and so fills `birth_lat`, `birth_lon`, `timezone`, `tz_offset` and
`location_resolved`; removes `incommon.sample[.u.<uid>]`; then calls
`passwordSignUp()` with `contact_phone`. On success it sets the birthData
consent on and `incommon.signin.remember` to `{ on: true, login }`. Once the
session arrives, the profile row goes up like any other.

## Written by the server only

| Table | Written by | Holds | Read by the app |
|---|---|---|---|
| `oracle_readings` | `server/oracle` (service role) | per account: `period`, `period_key`, `depth`, `chart_key` (a hash of the dossier, `.b` for a second half), `status`, `content`, `model`, and since migration 0006 `profile_id`, the profile the dossier was written from (null for a reading written before, or an id that is not a profile of the account). `status` `served` is a reading handed back and not kept (its profile was withheld, see below), `withdrawn` one that was kept until its profile was; neither has content, both count toward the daily limit | own rows (select policy); the device also keeps its own copy, see `incommon.p.<pid>.oracle` |
| `subscriptions` | `server/billing` | Stripe customer and subscription ids, status, plan, period end | through the billing function |
| `luminary_unlocks` | `server/billing` | the one time unlock: Stripe session id, amount, currency | through the billing function |
| `store_subscriptions` | `server/store` | RevenueCat's word on an app purchase | through the billing function |
| `support_requests` | the app, insert only, anon or signed in | topic, email, message, status; `user_id` stamped by default | never (no select policy) |
| `cast_counters`, `entitlements` | dashboard only | not in the repository | not mapped |

## Consent categories, and what each actually gates

The app has two lists. `CATS` in the app (Settings, `consentMap()`,
`gatherConsented()`) is `birthData, journal, relationships, assessments, mood`.
ProfileManager's `CONSENT_TYPES` is the same five plus `conversation`. Both
write the same record, `incommon.consent.<pid>`.

| Category | Gates sync of | Gates on the device |
|---|---|---|
| `birthData` | the birth fields of the profile row: off, they go up empty and the account's copy loses them; never decided reads as on while there is a birth date (G2). Settings labels it "Save my profile to my account". | set on when a profile is made with a birth date, and by the registration card |
| `journal` | `memories` of type journal, the manual Throughline | what the reader side may read back (`getMemory` with respectConsent) |
| `mood` | `memories` of type mood | same |
| `assessments` | `memories` of type practice_completion | same |
| `conversation` | `memories` of type stella_conversation, `oki_messages` | same; Settings calls it Reading History |
| `relationships` | nothing synced | `incommon.consent.data.<pid>` reads only |

## What each removal takes

| Item | Log Out | Delete account, server | Delete account, device "erase" | Delete account, device "keep" | Clear birth data | Delete profile |
|---|---|---|---|---|---|---|
| Session `sb-...-auth-token` | gone (local scope) | auth user deleted | signed out locally | signed out locally | stays | stays |
| Profile store and its profile keys | stay, under `.u.<uid>` | every row of every cloud table above, then the auth user | `accountStorageKeys()` removes them | moved to the guest (`releaseToGuest`) | birth date, time, place, coordinates and zone blanked, time question unanswered; pushed when signed in | removed, here and on every device signed in to the account; the server records it in `deleted_profiles` (0007), which removes the row and everything under it and drops what arrives for it later |
| `cast_counters`, `entitlements` rows | stay | **not deleted** (G4) | | | | |
| `support_requests` | stay | kept, `user_id` set null (by design, Privacy Policy) | | | | |
| `contact_phone`, newsletter metadata | stay | go with the auth user | | | | |
| `incommon.p.<pid>.birthName` | stays | | removed | stays, under its profile id, now the guest's | **stays** (G5) | **stays** (G5) |
| `incommon.theme.<pid>` | stays | | removed | stays | stays | **stays** (G5) |
| `incommon.people.v1` rows for the profile | stay | | removed (`forgetAccountPeople`) | stay | stay | removed here and on every device that syncs (`forgetOwner`) |
| `incommon.p.<pid>.oracle` readings | stay | server copies deleted | removed | stay | stay (no longer match the chart) | removed |
| `incommon.voice.marks`, `incommon.geocache`, `incommon.practice.sleep7` | stay | | **stay** (G7) | stay | stay | stay |
| Sync map and outbox | stay, and are shared with the next account (G3) | | removed | removed | stay | outbox gains `del-profile` |

## Gaps and mismatches

Listed before anything was changed. Each says what was checked. "Fixed here"
names the file that fixes it; everything else is left for a decision or a
follow-up, because it changes what the product does or a device key, and
`STORAGE-MIGRATION-POLICY.md` asks for its own reviewed change.

**G1. A profile switch stops every later push (fixed here, server).**
`buildPlan()` hashes the raw profile object, and which profile is active lives
on the store, not the profile. Switching sends nothing; the next edit to the new
profile sends `is_active: true` while the server still holds the old one as
active, and `profiles_one_active` refuses it. The push stops at the profiles
step, every time, so consent events, pairs, memories, the Throughline and the
deletion outbox stop going up. Reproduced on Postgres 16 with the schema of
record, and through the module in K72. Fix:
`server/migrations/0002-profiles-one-active-follows.sql`. The stale
`is_active` on the server between switches remains, and matters only when a
new device adopts the account; a client change could add the active and
default flags to the hash.

**G2. "Save my profile to my account" does not stop the profile going up
(decided by the owner, 29 October 2026: a saved profile keeps syncing, so the
push is unchanged; see below).** The Settings switch toggles the birthData consent, but the push
never reads birthData: the comment on the cloud module's consent gate says
entering birth data is the consent. Turning the switch off leaves the profile, birth data included,
syncing. Either the switch's label or the push has to change, and turning it
off would also have to decide what happens to the copy already on the server.

The owner's words, 29 October 2026: "syncing remains constant when profile is
saved. if synced today and further use continues into saturday, the saved
profile will pick up on sunday where saturday left off." Read as: once a
profile is saved to the account it stays in sync from one day to the next, so
the push keeps sending profile rows and the switch does not gate it. What the
switch's label should say is not decided by that answer.

**Superseded on 30 October 2026**, when the privacy review (F2) put the
question again and the owner answered: "no, and absolutely fix that. it serves
no purpose if it defaults with no option." The switch now governs the birth
fields of the profile row: off, they go up empty, the account loses them at the
next push, and the device keeps its own copy; a saved profile still syncs from
one day to the next as the 29 October answer asked. HD-STUDY-MODEL.md section
13 has the rules, K75 to K78 hold them.

**A profile made for somebody else goes up as an empty row and its mark** (F9,
the owner's (b), 30 October 2026, and the follow-up review's finding 2):
`for_other` on the profile; the row carries an id and nothing else, its
`forOther` ledger events go with it so the account's other devices learn the
mark, and no memory or pair goes up. Marking a synced one deletes the account's
copy first, and a push flushes that deletion before it sends the empty row, or
the deletion would take the mark with it (K79 to K81, K84, K85).

**The server holds both rules too** (migration 0006, the follow-up review's
finding 4, decided 30 October 2026). A profile row is emptied of its birth
while the account's latest `birthData` event is a revoke or its latest
`birthCleared` a grant, and emptied whole while its latest `forOther` is a
grant, when the row arrives and again when an event arrives, so a build older
than the switch cannot put the birth back. A row whose own switch or mark moved
in a push is sent again after its events (K86). The Oracle readings of such a
profile are not kept (`served`) and the kept ones are withdrawn (findings 5 and
9), and its chart versions are dropped on arrival and deleted when it becomes
withheld. An event dated more than five minutes ahead of the server is stored
at the server's time, so a device with a fast clock cannot outrank a later
event. A marked profile keeps no memory, Throughline entry or Oki message on
the account: one that arrives is dropped and the ones held go when the mark
arrives (the owner, 30 October 2026). `tools/check-hd-study-rls.js` WH1 to
WH18.

**G3. The sync map and outbox are device wide, not per account (follow-up,
client).** `incommon_cloud_map_v2` and `incommon_cloud_outbox_v2` are not
scoped by account, while the profiles are. A deletion queued by one account and
not yet flushed is flushed under the next account to sign in on the browser;
RLS matches nothing, no error comes back, the operation is dropped, and the row
it should have deleted stays on the server for good, because the first
account's next pull reads its absence as "deleted here, the outbox is carrying
it up". The map is keyed by row ids, so sharing it is otherwise harmless, but
`map.pulled` is already per account and the outbox should be too.

**G4. Deleting an account leaves `cast_counters` and `entitlements` (follow-up,
server).** `server/account/index.ts` deletes every table it names, and these
two are not named. Their columns are not in the repository, so the fix starts
with exporting their definitions.

**G5. A profile's own keys that deleting it leaves behind (follow-up, client).**
`_dropProfileKeys()` removes ten bases but not `incommon.p.<pid>.birthName`
(the full name at birth, which the screen says stays on the device) or
`incommon.theme.<pid>`. Clear birth data leaves `birthName` too, and Expression
and Soul Urge go on being drawn from it. `accountStorageKeys()` does find both, because it
matches on the profile id.

**G6. Saved people survive deleting their profile and erasing the account
(follow-up, client).** **Deleting the profile: fixed** on 30 October 2026
(`forgetOwner()`, P30, K94, O24). **Erasing the account: fixed** the same day,
at the owner's request: "erase this device" calls
`PM.forgetAccountPeople()` before it removes the account's keys (O26). `incommon.people.v1` holds every profile's saved people
in one key, keyed inside by profile id, so neither `_dropProfileKeys()` nor
`accountStorageKeys()` (which match key names) reaches them. These are other
people's birth details. `incommon.paircache.v1` is the same shape and holds
composites, not birth details.

**G7. Device wide keys that hold a reader's own words or places (follow-up,
client).** `incommon.voice.marks` (comments written against an Oracle reading,
with the reading's title), `incommon.geocache` (every place looked up online,
which includes birthplaces) and `incommon.practice.sleep7` are one per browser,
so they cross accounts on a shared browser and survive an erase. The
migration policy applies before any of them is renamed or scoped.

**G8. Restored Archive entries ignored their consent (fixed here, client).**
`restoreMemory()` writes the entry back with `consentRequired: null`, and the
push gate treated null as "nothing to ask", so a restored journal entry went up
with journal off. `memoryAllowed()` now falls back to the type's consent, as
`getMemory()` already did (`app/incommon-cloud.js`, K71). Rows restored and
uploaded before this change are still on the server; they can be found with
`select * from memories where consent_required is null`.

**G9. Device and server spell some things differently (no change).**
`content` is a JSON string on the device and jsonb on the server, `is_private`
and `kept` are 0/1 there and booleans here, the consent id is `id` there and
`scope` here, and `granted` is `action` (`grant`/`revoke`). All four are
translated in both directions and covered by the K rows. `profiles.created_at`
is not sent, so a profile adopted on a second device takes its first upload's
time rather than when it was made (follow-up: send it). `pin_updated_at` is
written only by PIN recovery. The ProfileManager comment that the avatar photo
"never leaves the device" is out of date: it is pushed, and the Privacy Policy
says so.

**G10. Device data with no cloud home (decision).** These are kept only on the
device, and "one account reads the same on every device" does not reach them:
the practice notes in `incommon.consent.data.<pid>` (journal and mood lines from
practices, read under the CATS gates), `birthName`, Oracle readings on the
device (the server keeps its own per account), study progress, per profile
theme, saved cards (`incommon.friends`), the adverse practice log and the
archive. Saved people (`incommon.people.v1`) are device only on purpose
(`people-library.js` rule 5, and the Privacy Policy). Whether any of the rest
should sync is a product and privacy choice, so no table is created for them.

**G11. Throughline and Oki rows have no deletion path (follow-up, client).** No
outbox operation exists for `throughline_entries` or `oki_messages`. Nothing in
the app deletes a single manual Throughline entry today, so nothing is lost
now, but one added later would come back on every new device's first pull.
Their upsert targets `id`, which the push never sends, so every changed item is
a new row.

**G12. Pairs orphaned by a profile deletion (fixed here, server).** `pairs` has
no foreign key to `profiles`, so `del-profile` left the pair rows, and a first
pull put them back in the store naming a profile that is gone. Fix:
`server/migrations/0003-pairs-follow-profile-deletes.sql` for every deletion
from now on; the existing orphans are listed by a query in that file for the
owner to remove. The pull could also skip a pair whose profiles are not present
(follow-up, client).

**G13. Indexes the queries need (fixed here, server).** `profiles.account_id`,
`pairs.account_id`, `throughline_entries.profile_id`, `oki_messages.profile_id`
and `support_requests.user_id` are filtered, joined or cascaded on and had no
index; `pairs.profile_b` needs one for G12. Fix:
`server/migrations/0001-sync-lookup-indexes.sql`.

**G14. Constraints not added, and why (no change).** No new NOT NULL or CHECK
was added to a table the app writes. One refused upsert ends the whole push
(the reason K69 exists), and the live rows were not inspected, so a CHECK could
fail to apply or refuse a row an older build wrote: `consent_events.scope`
takes whatever consent id a device's record holds, manual coordinates are
whatever was typed,
and a profile id made where `crypto.randomUUID` is missing is `p-...`, which the
uuid column already refuses (follow-up, client: such a device can never sync).

**G15. Two Human Design stores with no consent category and no export path
(follow-up, client and decision).** Found by assignment 1.3's step 7 check.
Saved people (`incommon.people.v1`, whose records carry `computed_state`) are in
no consent category: the table above has none for them, and `relationships`
gates nothing synced. The Oracle dossier is sent under the Oracle's own mark,
`incommon.p.<pid>.oracleConsent`, which is not one of the categories either.
`ProfileManager.exportProfile()` carries the profile, consents, memories and the
Throughline, and neither saved people nor the kept Oracle readings
(`incommon.p.<pid>.oracle`), so a reader's export holds neither. The deletion
half for saved people is G6. Whether saved people take a category, and whether
either store joins the export, is a product and privacy choice.

## Tables that need policies from workstream 2

No table was created by this work, so none starts with deny all. For the
policy review: `cast_counters` and `entitlements` are not in the repository,
so their policies cannot be read here; `pairs` is checked on `account_id`
only, and its unique key `(profile_a, profile_b)` is global, so anyone who
knew two of another account's profile ids could write that pair under their own
account, and the owner's next pair upsert would then be refused (tried on the
local Postgres: "new row violates row-level security policy (USING
expression)"), which stops their push; profile ids are random UUIDs that are
not shown anywhere, so this is a hardening item rather than a live hole;
and `owns_profile()` has no fixed `search_path`.

## Human Design: the logic map is a vault beside this file

Where Human Design is computed, stored, sent and read, field by field, is
`data-contracts/hd-vault/` (assignment 1.3, mapped at 1c02c7c), an Obsidian vault
whose `00 Index` links every note. The two Human Design items this map already
holds are described there in full: `incommon.people.v1` records carry a
`computed_state` whose stored instant was wrong for an untimed birth and an
hour out for a summer one until f6b38fd (vault notes D-03 and D-04; nothing reads
it yet), and the
Oracle dossier's Human Design lines are listed in "Oracle dossier (HD part)". No
key, table or column was added by that work.

## Notes, chart versions, other people's charts (1.2)

`data-contracts/HD-STUDY-MODEL.md` is the model for notes attached to a part of
a chart, chart versions, saved people and clients, and import and export
(assignment 1.2). The owner approved its decisions O1 to O9 on 29 October 2026;
workstream 2's privacy review (2.2 Task 1) is outstanding, and no table or
column exists until it is resolved.

**Built on the device (section 10, step 1):** two profile scoped keys,
`incommon.p.<pid>.chartVersions.v1` and `incommon.p.<pid>.chartNotes.v1`
(`local-storage-schema.md`). Neither syncs yet.

| Item | Log Out | Delete account, device "erase" | Delete account, device "keep" | Clear birth data | Delete profile | Export |
|---|---|---|---|---|---|---|
| Chart versions | stay | removed (`accountStorageKeys()` matches the id) | move with the profile | **removed** (O8) | removed | carried |
| Chart notes | stay | removed | move with the profile | **stay**, unresolved until a birth is given | removed | carried while journal is on, counted as withheld while it is off |
