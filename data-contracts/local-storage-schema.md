# Local storage schema

Rewritten 27 October 2026 from the code at `main` 2240744. The previous
version described the V1.2 prototype's single `incommon_state_v1` blob, which
the app no longer reads or writes. Every key here was found by searching `app/`
(the app, its modules, `cover.html`), not carried over from that document.
Where a key goes on the server, and which consent gates it, is in
`DATA-MAP.md` beside this file. Before renaming any key or changing its shape,
read `STORAGE-MIGRATION-POLICY.md`.

**Scope** says how many copies a browser holds:

- **profile**: one per profile; the profile id is in the key (`<pid>`). With no
  active profile, the app falls back to `default` (Oracle, study, theme) or
  `legacy` (birth name) in place of the id.
- **account**: one per signed in account on this browser. ProfileManager
  appends `.u.<userId>` (`scoped()`, `PM.accountKey()`, the app's `acctKey()`);
  signed out, the plain key is the guest's. The first account to open the app
  on a browser that already holds a guest store takes it, these keys included
  (`scope()`).
- **device**: one per browser, shared by every account and profile on it.
- **tab**: sessionStorage, one per tab.

**Sync** is `yes` when `app/incommon-cloud.js` sends it, `no` when it never
leaves the device.

Storage is reached three ways: the app's `readLS` / `writeLS` (JSON, never
throw), `read` / `write` in `profile-manager.js` (the same), and direct
`localStorage` calls in the modules and for a few flags.

## Profile scoped

| Key | Shape | Written by | Sync |
|---|---|---|---|
| `incommon.consent.<pid>` | `{ schemaVersion: 3 (2 when the app made it), profileId?, updatedAt, consents: { <type>: { granted, updatedAt } }, events: [{ ts, id, granted }] }`, the last 50 events | `PM.setConsent()`, the app's `setConsent()` | yes, `events` to `consent_events` |
| `incommon.consent.data.<pid>` | `{ journal: [{ ts, practiceId, stellaVisible, notes, s }], mood: [...], ... }` by CATS category | the practice flow (`dkey()`) | no |
| `incommon.p.<pid>.memories` | `[{ id, profile_id, memory_type, content (a JSON string), created_at, is_private (0/1), consent_required, kept? (1) }]`, newest first, at most 800 | `PM.addMemory()`, `PM.deleteMemory()`, `PM.importSynced()` | yes for journal, mood, practice_completion, stella_conversation; no for archive_deleted |
| `incommon.p.<pid>.throughline` | `[{ id: 'm<ms>', date, type, title, preview, body, manual: true, spoken?, tag? }]` | the app (`mkey()`), `PM.importSynced()` | yes, to `throughline_entries`, journal gated |
| `incommon.p.<pid>.oki` | the Oki conversation | nothing since V1.6.0; `PM.importSynced()` | yes, to `oki_messages`, conversation gated |
| `incommon.p.<pid>.oracle` | `{ <period>|<periodKey>|<depth>|<birthStamp>: { reading, at, ... } }`, the 12 newest | the Oracle page (`oracleKeep()`) | no (the server keeps its own, per account) |
| `incommon.p.<pid>.oracleConsent` | the Oracle's own consent mark | the Oracle page | no |
| `incommon.p.<pid>.oracleDeep` | set once an in-depth reading was asked for | the Oracle page | no |
| `incommon.p.<pid>.study` | `{ path, ... }` study progress | `studySave()` | no |
| `incommon.p.<pid>.chartVersions.v1` | `{ v: 1, versions: [{ id, subject, seq, reason, birth, chart_hash, created_at }] }`; absent until the birth is first corrected (1.2, `HD-STUDY-MODEL.md` section 4) | `PM._birthMoved()`, from `PM.updateProfile()` and `PM.reresolveLocations()`; removed by Clear birth data and `_dropProfileKeys()` | not yet (1.2 step 3) |
| `incommon.p.<pid>.chartNotes.v1` | `{ v: 1, notes: [{ id, subject, address, version, resolved, text, created_at, updated_at }] }` (section 3) | `PM.addChartNote()`, `updateChartNote()`, `deleteChartNote()`; removed by `_dropProfileKeys()` | not yet (1.2 step 3, journal gated) |
| `incommon.p.<pid>.birthName` | string, the full name at birth | the numerology pages (`nkey()`) | no (the screen says it stays on the device) |
| `incommon.theme.<pid>` | `{ key, hc }` | `themeWrite()` | no |
| `incommon.charts.<pid>` | none found | removed by `_dropProfileKeys()` only | no |

Two device wide keys hold profile scoped rows inside the value, keyed by
profile id: `incommon.people.v1` and, by pair hash, `incommon.paircache.v1`
(below). Neither is removed with the profile (DATA-MAP G6).

## Account scoped

| Key | Shape | Written by | Sync |
|---|---|---|---|
| `incommon.profiles.v1` / `incommon.profiles.v1.u.<uid>` | `{ schemaVersion: 2, activeId, defaultId, profiles: [{ id, name, avatar_color, avatar_kind, avatar_image, avatar_sign, pin_hash, created_at, birth_date, birth_time, birth_location, birth_lat, birth_lon, timezone, tz_offset, location_resolved, birth_time_unknown }], pairs: [{ key, a, b, enabled, enabled_by, enabled_at }] }`, at most 6 profiles | ProfileManager only | yes, to `profiles` and `pairs` |
| `incommon.firstrun[.u.<uid>]` | `true` | first run, registration, a pull that adopted the account | no |
| `incommon.sample[.u.<uid>]` | the sample profile's id | `ensureProfiles()`; removed by the registration card and by adoption | no |
| `incommon.friends[.u.<uid>]` | `[card]`, at most 40 | saved cards | no |
| `incommon.adverse.log[.u.<uid>]` | `[{ ts, practiceId, title, flaggedForReview }]`, at most 50 | the practice "this did not help" flow | no |
| `incommon.mem.archived[.u.<uid>]` | the Archive's list | the Archive | no |

## Device wide

| Key | Shape | Written by | Sync |
|---|---|---|---|
| `incommon.people.v1` | `{ <profileId>: [person record] }` | `people-library.js` | no, by design |
| `incommon.paircache.v1` | composites keyed by the two chart hashes | `pair-cache.js` | no |
| `incommon.people.migrated` | `true` once `incommon.friends` was moved into the People Library | the app | no |
| `incommon.theme.device` | `{ key, hc }`, the last theme chosen on this browser | `themeWrite()` | no |
| `incommon.chart.expanded` | `'1'` / `'0'` | the expanded wheel | no |
| `incommon.hd.read` | the chosen Human Design reading view | the wiring page | no |
| `incommon.desktop.sidebar` | boolean | the desktop shell | no |
| `incommon.install.dismissed` | `true` | the install hint | no |
| `incommon.forecast.open`, `incommon.transits.open` | boolean | Today | no |
| `incommon.obs.keys` | `'1'` once the Observatory's keys were shown | the Observatory | no |
| `incommon.help.country` | country code for the help line | Get Help | no |
| `incommon.practice.sleep7` | the day the seven night count began | the Sleep Hygiene Check | no |
| `incommon.voice.rate`, `incommon.voice.mode`, `incommon.voice.loop`, `incommon.voice.shuffle` | the reading voice's settings | the Oracle voice | no |
| `incommon.voice.marks` | `[{ id, at, reading, idx, section, frac, posLabel, text }]`, at most 60 | the Oracle voice's marks | no |
| `incommon.crisis.audit` | `[{ type: 'crisis_button_accessed', timestamp }]`, at most 100, nothing else | `crisisAudit()` | no |
| `incommon.stella.lang` | the chat language | the unwired chat | no |
| `incommon.stella.outbox` | declared (`OKEY`), no reader or writer found | none | no |
| `incommon.geocache` | places found online, by typed spelling and by label | `geocode-online.js` | no |
| `incommon.minorbodies.calibration.v1` | the minor body calibration | `minor-bodies-ephemeris.js` | no |
| `incommon.analytics.optin`, `incommon.analytics.agg` | the opt in, and counts kept on the device (the endpoint is null) | `analytics.js` | no |
| `incommon.signin.remember` | `{ on: true, login? }` or `{ on: false }` | `rememberSet()` | no |
| `incommon.signin.ephemeral` | `'1'` when the sign in ends with the browser | `rememberSet()` | no |
| `sb-lkzcybzhjjxdqetwwdrx-auth-token` | the supabase-js session | supabase-js | it is the session |
| `incommon_cloud_map_v2` | `{ hashes: { <table>: { <rowKey>: <hash> } }, pulled: { <userId>: <iso> } }` | `incommon-cloud.js` | bookkeeping |
| `incommon_cloud_outbox_v2` | `[{ op: 'del-profile' \| 'del-memory' \| 'del-memories', pid, id?, type? }]` | `incommon-cloud.js` | flushed as deletes |

## Tab and cookie

| Key | Where | Meaning |
|---|---|---|
| `incommon.guest.chosen` | tab | the reader chose to go on without an account |
| `incommon.guest.default` | tab | No on the cover's question: skip the first run, keep the default profile |
| `incommon.register` | tab | Yes or Create an account: show the registration card |
| `incommon.learn.guest` | tab | arrived from a Learn page |
| `incommon.signin.out` | tab | this tab logged out; Back must not bring a signed in screen back |
| `incommon.ring.handoff` | tab | the cover's ring animation state, read once by the app |
| `incommon.vtsec` | tab | the phone shell's section, handed across a refresh and read once |
| `incommon.signup.from` | tab | the UTM fields of the visit, sent with a sign up |
| `incommon_pin_recovery` | tab | a PIN recovery is under way |
| `incommon_signin_live` | cookie | the browser session a not-remembered sign in belongs to |

## Legacy and inert

- `incommon.consent`, `incommon.consent.data`, `incommon.throughline.manual`:
  the single profile keys from before profiles. `migrateLegacyProfile()` moves
  them under the first profile once, and the app falls back to them only when
  no profile is active.
- `incommon.chart.view`, `incommon.cycle.view`, `incommon.hd.view`,
  `incommon.signin.via`: only ever removed, as cleanup of older builds.
- `incommon_state_v1`, `incommon_state_v1__tombstone`, `incommon_theme`: the
  V1.2 prototype's keys, in `createPersistence()` in `incommon-core.js`, which
  the app does not call.
- `incommon.memory`: an IndexedDB database in `memory-store.js`, which the app
  does not load.
- `incommon.v14.probe`: written by the verification suite only.
- `incommon.profile.v1` and `incommon.profiles.v1` also name the two export
  formats (`exportProfile()`, `exportAll()`); as export schema names they are
  not keys.
