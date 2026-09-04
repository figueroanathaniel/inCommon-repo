# Change log — V1.1 → V1.2 (Integrity Repair Pass)

Controlling document: `uploads/inCommon_Independent_Source_Audit_V1.0.md`. Every entry maps finding → change → executed evidence (`handoff/test-results-v1.2.json`, 55/55 pass, exitCode 0, 2026-07-21). V1 prototype and V1/V1.1 reports retained unchanged; all repairs live in `inCommon Prototype V1.2.dc.html` + `incommon-core.js`.

## Blocking findings
- **B1 — deletion did not survive the debounced write.** Persistence moved into `incommon-core.js` `createPersistence()`: `deleteAll()` cancels the pending debounce, removes both keys, verifies absence, writes a tombstone that blocks schedule/hydration until `reenable()` (re-onboarding). Two-step UI verifies + reloads. Evidence: P1, P2, P3, IT1, IT10.
- **B2 — onboarding was a non-persistent preview presented as real.** Onboarding now commits: profile becomes persisted state (`profile` in `PERSIST_KEYS`), consent answers become `consentEvents`, and the app computes from it thereafter. Evidence: IT2 (live profile drives values), schema v2.
- **B3/B4 — demo data presented as computed, with "High confidence" badges and fake engine-version claims.** DEMO banners on Today/Natal/HD/Compare/Moon/Time Machine; engine-version and "validated ephemeris" claims removed; confidence badges demoted to labeled demo status. Astrology remains a fixed reference persona and says so — including inside Stella's prompt.
- **B5 — consent revocation was a toast, not a state change.** Revoke now flips scope, appends a ledger event (`via`), excludes the block from Stella's prompt, resets the invite flow; ledger derives from real events. Evidence: C1, C2, IT7.
- **B6 — Stella grounding was advisory.** New enforced contract: SOURCES line required, chips resolved against a registry to real enabled source ids, dated insight chips must match records, failures withhold the reply with a visible notice; per-message scopes filter history on revoke; prompt-injection sanitizer; output crisis check; 20 s timeout; scripted-branch scope leak fixed (start-branch no longer discloses Personal Year with chart off). Model-processing consent modal gates first live egress. Evidence: S1–S9, H1, Z1, G1/G2, W1/W2, IT4, IT5, IT6.
- **B7 — "self-contained bundle" claim false.** README dependency disclosure corrected (unpkg React/Babel required at runtime). Production build: **UNRESOLVED / deferred**.

## High-priority findings
- **H1 — assessments presented as validated instruments.** Labeled illustrative demo instruments (also inside Stella's prompt); honest durations.
- **H2 — Insight Records and Throughline were disconnected.** Saved records now feed the Throughline rendering.
- **H5 — Stella header claimed "30 years of practice."** Replaced: she is software; prompt forbids implying lived experience.
- **Hard-coded dates/weekdays.** All date displays and record saves now compute live (`fmtToday`/`fmtShort`). Evidence: D1, D2; IT2.
- **Birth-time certainty ignored.** `deriveVisibility(timeMode)` suppresses (unknown) or windows (approximate) Rising/houses/Moon-degree/HD/Sabian across Natal, Today, HD, and Stella's prompt. Evidence: V1–V3, IT3, IT3b.

## New defects found while wiring the V1.2 test harness (this pass)
- **Core module was never loaded by the page** — the helmet lacked `<script src="./incommon-core.js">`, so every core-backed feature silently ran its no-op fallback. Fixed; IT2b proves the app's persistence object is core-built.
- **Persistence never fired from UI updates** — the runtime invokes `componentDidUpdate` without `prevState`, and the guard `if (ps) persistState()` therefore never ran (would also have thrown in the chat autoscroll path). Now unconditional (debounce makes it cheap) with a guarded autoscroll. Evidence: IT1, IT8.

## Test infrastructure added
`incommon-core.js` (UMD, one file executed by app + browser suite + Node), `handoff/tests.js` (43 pure + 12 integration assertions incl. both audit repro cases), `Test Runner V1.2.dc.html` (auto-runs, SHA-256 of sources), `handoff/run-tests-node.js`, `handoff/test-results-v1.2.json` (verbatim executed output). Integration tests run the real prototype in an iframe under `?test=1` (namespaced `_test` storage) via the documented `window.__incommon` hook.

## Unresolved / deferred (honest list)
- B7 production build (CDN + in-browser transpile).
- Real ephemeris, lunar, timezone engines — all astrology/HD/moon values remain DEMO-labeled; licensing-gated (spec §20).
- Two-person exchange is SIMULATED (no real second party, no server).
- T9 adversarial red-team suite for prompt injection; T11 provider/model/retention/cost demonstration.
- H6 modality matrix: most §4 modalities beyond the built set remain SPEC'D/DEFERRED (see report §1).
- Enneagram/Big Five remain illustrative demo instruments (reduced item sets; Enneagram answer keys cannot reach types 3/6/8).
