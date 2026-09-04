# Local-storage schema: prototype persistence v2 (V1.2)

Source of truth: state initializer + `PERSIST_KEYS` in `inCommon Prototype V1.2.dc.html`, and `createPersistence()` in `incommon-core.js`. All keys browser-local; nothing leaves the device. With `?test=1` every key below is suffixed `_test` (integration-test namespace).

## Key `incommon_state_v1` (JSON object)
Written debounced (250 ms) through `InCommonCore.createPersistence().schedule()` on every state change; hydrated once on mount (unknown fields ignored; `stellaCtx`, `profile`, `providerConsent` shallow-merged over defaults). Executed evidence: tests IT1 (write), P3 (coalescing), IT10 (delete).

| Field | Shape | Meaning |
|---|---|---|
| `res` | `string \| null` | Resonance rating on the profile insight |
| `insRecords` | `[{ t, chip, date, st, sc, rated }]` | Insight Records; `date` is a real save-time date (`fmtShort`) since V1.2 |
| `notifs` | `boolean[8]` | Notification opt-ins by row index (registration only: no delivery service exists) |
| `angelEntries` / `tarotEntries` / `ichingEntries` | `[{ n, date, ctx, tag }]`-ish journals | Saved with real dates since V1.2 |
| `ennea` | `{ phase, step?, scores?, type?, wing? }` | Enneagram demo instrument state |
| `big5` | `{ phase, step?, scores? }` | Big Five demo instrument state |
| `inv` | `{ step, name, rel, sent, sentName }` | Two-person invite flow (SIMULATED, no real second party) |
| `stellaCtx` | `{ chart, transits, insights, journal, assess, duo }` booleans | Stella's consent scopes: the only inputs to context building |
| `msgs` | `[{ who: 'u'\|'s', text, cites?: string[], scopes?: string[], note? }]` | Conversation. `scopes` (V1.2) = source ids each reply drew on, used to filter history when a scope is later revoked; `note` = visible withhold/fallback notice |
| `profile` | `{ committed, name, nameAtBirth, dobISO, dobDisplay, loc, timeMode: 'exact'\|'approx'\|'unknown', time }` | V1.2: source of truth for live numerology + date displays; `timeMode` gates Rising/houses/HD/Sabian via `deriveVisibility` (tests V1, V3, IT3) |
| `consentEvents` | `[{ scope, action: 'grant'\|'revoke', via, ts }]` | Append-only consent ledger events (reduced newest-wins; tests C1/C2, IT7) |
| `providerConsent` | `{ asked, granted, ts }` | Model-processing consent (modal before first live AI call; revocable) |

## Key `incommon_theme` (string)
`mystical | cosmic | natural | editorial`: explicit user override; removed when the host theme prop changes.

## Key `incommon_state_v1__tombstone` (`'1'` when present)
Deletion guard (audit B1). `deleteAll()` cancels any pending debounced write, removes both data keys, then sets the tombstone so a remount cannot rehydrate or re-persist stale state. Cleared only by `reenable()` (re-onboarding). Executed evidence: P1, P2, IT10.

## Deletion path (V1.2, audit B1 fixed)
Data & Consent → Delete (armed, two-step) → `deleteAll()` → storage verified empty (`verifiedAbsent`) → toast states the verification result → app reloads to factory state. The pre-V1.2 bug (pending debounce re-persisting state after deletion) is covered by regression tests P1 and IT10.

## Export path
Data & Consent → Export: downloads a JSON snapshot of every field above plus `exported` timestamp and `coreVersion`. Local file generation only: no network.
