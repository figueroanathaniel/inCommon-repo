# Storage audit, 16 August 2026

Recorded because `local-storage-schema.md` in this folder is the handover
document and it does not describe the build that ships. Nothing here has been
fixed. This is a list, so that whoever reads the schema next is not misled by
it.

Method: every `localStorage` call, every `readLS` / `writeLS` call site in
`app/inCommonApp v2.dc.html`, and every `read` / `write` in
`app/profile-manager.js`, resolved from symbol to literal key.

## Keys the code uses that the schema does not mention

Per profile, where `<id>` is a profile uuid:

| Key | Written by | Holds |
|---|---|---|
| `incommon.profiles.v1` | profile-manager | profile list, activeId, defaultId, pair consents |
| `incommon.consent.<id>` | profile-manager, app | per profile consent record and event log |
| `incommon.consent.data.<id>` | app | consented source data |
| `incommon.p.<id>.memories` | profile-manager | journal, mood, practice, conversation records |
| `incommon.p.<id>.throughline` | app | manual Throughline entries |
| `incommon.p.<id>.birthName` | app | birth name for numerology |
| `incommon.theme.<id>` | app | per profile theme identity and contrast |
| `incommon.theme.device` | app | device default theme, inherited once |

Device wide:

| Key | Written by | Holds |
|---|---|---|
| `incommon.firstrun` | app | absent means show the birth screen |
| `incommon.desktop.sidebar` | app | sidebar collapsed preference at 1024 and up |
| `incommon.transits.open` | app | Today transits disclosure state |
| `incommon.forecast.open` | app | Today forecast disclosure state |
| `incommon.mem.archived` | app | archived memory ids |
| `incommon.adverse.log` | app | adverse event log |
| `incommon.crisis.audit` | app | crisis control access log |
| `incommon.practice.sleep7` | app | sleep practice start date |
| `incommon.help.country` | app | crisis directory country |
| `incommon.install.dismissed` | app | PWA install prompt dismissal |
| `incommon.stella.lang` | app | last conversation language |
| `incommon.minorbodies.calibration.v1` | minor-bodies-ephemeris | calibrated orbital elements |
| `incommon.geocache` | geocode-online | places found through the online lookup |
| `incommon.friends` | app | chart cards other people chose to send |

### `incommon.geocache`, added 2026-08-17

Written by `geocode-online.js` when somebody picks a result from the online
place lookup. A flat object keyed by the folded query string, holding
`{ label, lat, lon, timezone, tzOffset, from, at }`. Each place is stored twice,
under the spelling that was typed and under the label that was chosen, because
`geocode()` is called with both at different moments.

It is a cache, not a record: `GeoOnline.forget()` clears it, deleting it loses
nothing that cannot be fetched again, and the oldest entries are dropped past
200. It is deliberately **not** profile scoped. A place is a fact about the
world rather than about a person, and two profiles born in the same town should
not each pay for the lookup.

The reason it exists at all is that `birth_location` stores a human readable
string. Writing coordinates into that field instead would have resolved without
a cache and cost the reader the name of their own birthplace, which is the
opposite of the point.

Legacy fallbacks, used only when no profile is active:
`incommon.consent`, `incommon.consent.data`, `incommon.throughline.manual`.

## Keys in the schema that the code never writes

`incommon_state_v1`, `incommon_theme`, `incommon_state_v1__tombstone`.

These are defaults inside `createPersistence()` in `incommon-core.js`.
`createPersistence` is not called anywhere in the build, so the whole
persistence layer the schema documents is dormant, and with it the deletion
tombstone and the debounced write path. Every field table in the schema
(`res`, `insRecords`, `notifs`, `msgs`, `stellaCtx`, `providerConsent` and the
rest) describes a shape nothing on a current device holds.

## Read or deleted but never written

`incommon.charts` and `incommon.p.<id>.stella` appear only in the delete
cascade in `profile-manager.js`. Nothing writes them. Harmless, and worth
knowing before someone assumes charts are cached on disk.

## Written by the test harness, not the app

`incommon.v14.probe`, plus `incommon.firstrun` and `incommon.desktop.sidebar`,
which `handoff/tests-v14.js` sets and restores. The harness shares the
device's real keys rather than namespacing them, so a run interrupted mid
phase can leave a profile in a state the app did not put it in.

## Consequence worth stating plainly

The schema says `?test=1` suffixes every key with `_test`. The current build
has no such namespacing. Anything run against a real profile writes to the
real keys.

### `incommon.friends`, added 2026-08-18

Chart cards handed over by other people, so synastry can read two real charts
without an account or a server. An array of `{ id, card, addedAt }`, newest
first, capped at 40. The card itself is deliberately small: a name, a birth
date, a time, a place and its resolved coordinates and zone. Nothing else.

This is the one key that holds data about somebody who is not the reader, so
the rules around it are stricter than anywhere else in the app.

It is only ever written by an explicit accept. A card arrives in the URL
fragment, is taken out of the address bar before anything renders, and is
shown for a decision. Tapping a link never adds anyone.

It is not profile scoped. A card was given to the person holding the device,
not to one profile on it.

Removing a friend deletes the row, and that is genuinely all it can do. The
copy says so rather than implying a recall: a card that has been sent cannot
be taken back, only forgotten here.
