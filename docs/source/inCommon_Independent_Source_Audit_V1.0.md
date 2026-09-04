# inCommon — Independent Source Audit V1.0

**Audit date:** July 19, 2026  
**Scope:** Companion source bundle and Verification Report V1.1  
**Authority:** Independent founder review against the inCommon Fable 5 Master Build Prompt  
**Disposition:** **Prototype accepted as an interactive design demonstration; Phase 1 acceptance withheld**

## Executive ruling

The bundle is substantially more inspectable than the original submission and V1.1 correctly downgrades several earlier claims. It demonstrates a coherent mobile product concept, broad navigation, useful information architecture, original interpretive writing, an operational angel-number reducer, local state for selected features, four theme tokens, and thoughtfully designed prototype flows.

It does **not** yet verify the product’s core calculations, birth-profile behavior, consent enforcement, deletion behavior, live AI grounding, longitudinal progress model, or production independence. Several V1.1 PASS claims conflict with the source.

The V1.1 matrix contains **29 PASS of 49 checks (59.18%)** before the additional independent reclassifications below. Because the matrix also omits requested modalities and combines UI demonstrations with functional acceptance, no revised percentage is assigned. The build does not meet the established 80% acceptance threshold.

## What is independently supported

| Area | Independent status | Finding |
|---|---:|---|
| Source availability | Partial | Core prototype, runtime, frame, reports, prompt, fixtures, schema, and Stella notes were supplied. |
| Screen and route architecture | Prototype pass | Source defines approximately 22 labeled screens and routes the five primary tabs plus subordinate screens. |
| Angel-number component lookup | Pass | Input normalization, digit reduction, master-number preservation, repeating-digit recognition, original text, and local journal insertion are implemented. |
| Selected local persistence | Partial | Insight records, ratings, notification choices, journals, assessment state, invite state, Stella scopes, messages, and theme preference use localStorage. Birth-profile onboarding does not. |
| Module gating | Partial | BaZi, Sabian, Vedic, Human Design, and Gene Keys limitations are mentioned, but not every screen or report label is consistent. |
| Reduced-motion CSS | Pass | A `prefers-reduced-motion` rule disables animation and transition. |
| No embedded secrets | Pass | No API key, password, bearer token, or private key was found in the supplied source. |
| Stella scripted fallback | Partial | Scripted branches, a pre-input crisis gate, local context toggles, a pacing limit, and source-chip rendering exist, but the grounding contract is not fully enforced. |

## Blocking findings

### B1 — Local deletion restores the data it claims to delete

**Severity:** Critical  
**Evidence:** `inCommon Prototype.dc.html`, persistence at lines 1413–1433 and deletion at lines 1816–1823.

`delConfirm()` removes both localStorage keys, then calls `setState()` and `showToast()`. Every state change invokes the debounced `persistState()`, which writes the existing personal state back to `incommon_state_v1` roughly 250 ms later. Reload occurs after 1.2 seconds, so the deleted state is restored before reload.

This was reproduced through direct execution of the supplied component logic:

- Store existed before deletion.
- Store was absent immediately after `removeItem`.
- Store reappeared after the persistence debounce with approximately 2 KB of state.

**Required correction:** cancel pending persistence, enter a deletion guard, reset memory to a nonpersonal factory state without scheduling another write, remove both keys, verify absence, and reload. Add an automated regression test.

### B2 — Onboarding does not create or update a user profile

**Severity:** Critical  
**Evidence:** `PERSIST_KEYS` excludes `ob`; onboarding completion explicitly displays “profile unchanged” at line 1754.

The onboarding inputs affect only the temporary onboarding demonstration. They do not update the hard-coded Maya profile, calculations, Stella context, modules, export profile, or persisted state.

Changing birth-time mode to Unknown changes the onboarding explanation only. Natal, Today, Human Design, Profile, Compare, and Stella continue displaying Maya’s Rising sign, houses, Human Design result, and “High confidence.” Therefore V1.1’s claim that the unknown-time path suppresses time-sensitive results is not true outside the onboarding preview.

**Required correction:** reclassify onboarding and accuracy behavior as DEMO until the entered profile becomes the source of truth across every screen. Add exact, approximate, and unknown integration tests.

### B3 — Numerology, lunar, timezone, and most timing results are displayed, not calculated

**Severity:** Critical  
**Evidence:** numerology values are hard-coded in templates and `coreNums`; the lunar dates are a static `moonPhases` array; timezone text is static; Time Machine uses hard-coded monthly windows.

The calculation fixture file contains expected arithmetic but is not connected to executable test code or application calculation functions. Only the angel-number reduction is implemented as live calculation logic.

Consequences:

- Numerology must move from PASS to DEMO.
- Historical timezone resolution must move from PASS to DEMO.
- Moon phase calculation must move from PASS to DEMO.
- Transit Time Machine remains DEMO and does not support “any selected date”; it uses a monthly slider from −60 to +36 months against a fixed list.
- “Engine v0.3.1 · reference-tested” and Stella’s “engine v0.2” claims are unsupported and must be removed or clearly marked fictional demo metadata.

### B4 — Demo chart data is presented as high-confidence calculated fact

**Severity:** Critical  
**Evidence:** natal screen line 154, Today line 35, Stella context line 1394, and Human Design screen.

The report admits the astrology and Human Design values are reference-persona demos. The user-facing screens nevertheless label them “High confidence,” “Complete,” “calculated,” and “reference-tested.” Stella is instructed to describe the same values as calculated facts.

**Required correction:** place a persistent DEMO DATA banner on every affected screen, remove unsupported engine/version claims, and prevent Stella from calling demo placements calculated facts. No confidence label may exceed the confidence of the underlying engine and input.

### B5 — Consent ledger and two-person revocation are simulated, not enforced

**Severity:** Critical  
**Evidence:** the ledger rows are largely hard-coded; `revoke()` only displays a toast; Jordan’s comparison data remains in memory and visible; invite withdrawal is promised but not implemented.

The code can display “Consent revoked — Jordan’s data removed” without changing any consent or relationship state. The ledger does not record dynamic grant/revoke/re-grant events except reflecting the current journal toggle with a hard-coded date.

**Required correction:** label these flows SIMULATED or implement stateful consent events, actual data removal, invite withdrawal, and independent second-person consent. Never show a success message without the corresponding state mutation.

### B6 — Stella’s grounding contract is not fully enforced

**Severity:** Critical  

Independent execution produced these failures:

1. With chart context disabled and timing enabled, the scripted “start” response still disclosed **Personal Year 1** and the user’s Rising-based transit.
2. A live provider response with no `SOURCES:` footer was accepted and rendered with an empty citation list.
3. Citation names are trusted from the model; they are not validated against enabled context.
4. Revoking a context category does not remove older assistant messages containing that information from the conversation history sent to a live provider.
5. Raw Insight Record text is interpolated into the system prompt, creating a stored prompt-injection path. Stella output can also be saved back as an Insight Record and reintroduced later.
6. The crisis gate covers several explicit phrases but is not a complete safety strategy and has no output-side safety check.

The optional live path transmits the assembled system prompt and chat history through `window.claude.complete`. When enabled, birth details, charts, Insight Records, and opted-in journal data can leave localStorage for an external model service. The statement “all data stays in browser localStorage” is therefore not true when live Stella is used.

**Required correction:** Stella remains PARTIAL. Add separate model-processing consent, provider disclosure, history filtering on revocation, structured context boundaries, source validation, failure on missing citations, injection defenses, output safety, timeout handling, and an adversarial test suite.

### B7 — The supplied runtime is not self-contained or production-suitable

**Severity:** High  
**Evidence:** `support.js` loads React 18.3.1, ReactDOM 18.3.1, and Babel 7.29.0 from `unpkg.com`; the HTML also loads Google Fonts. The runtime uses `new Function()` for template and JSX evaluation.

The claim “local copy — no network runtime” is false. The static server instructions also require internet access unless those dependencies are already injected by a host. `new Function()` would require a permissive `unsafe-eval` Content Security Policy and should not ship in production.

**Required correction:** compile the application ahead of time into a founder-controlled source project, pin and vendor dependencies through a normal build, remove runtime Babel/template evaluation, and test a true offline production build.

## High-priority findings

### H1 — Big Five and Enneagram are illustrative quizzes, not credible assessments

Big Five uses one question per trait. Enneagram uses five questions and makes Types 3, 6, and 8 impossible; its wing is assigned from a fixed lookup rather than assessed. Both advertised completion times are materially longer than the implemented flows.

**Disposition:** move assessment modules from PASS to DEMO. Label them “illustrative prototype” until validated, legally cleared instruments and scoring rules are implemented.

### H2 — Throughline does not incorporate newly saved insights

Insight saving and ratings update `insRecords`, but the Throughline Timeline is a separate hard-coded `TL` array. New records do not become timeline items, link to future check-ins, or update longitudinal analysis.

**Disposition:** Insight Records are PARTIAL; Throughline is DEMO.

### H3 — Four themes are token variants, not four complete visual worlds

Themes change colors, typefaces, corner radius, and darkness. Layout, icons, chart treatment, motion language, and illustration behavior remain substantially the same.

**Disposition:** theme switching passes; the requirement for four materially different visual worlds is PARTIAL.

### H4 — Accessibility is substantially incomplete

Most interactive controls are clickable `<div>` elements without semantic buttons, keyboard focus, roles, labels, or keyboard activation. Reduced motion is present, but this is not enough for an accessibility pass.

### H5 — The “30 years of practice” AI claim must be removed

The Stella UI and system prompt characterize an AI persona as having 30 years of practice. This is a false experiential credential. Replace it with transparent wording such as “AI guide using founder-approved astrology, numerology, and reflective content.”

### H6 — Required modules are missing from the matrix and prototype

The current Library does not implement or separately account for all requested modalities, including Chaldean numerology, Tzolkin/Mayan calendar, chakras, archetypes, attachment styles, a 16-type framework, relational preferences, values, strengths, spiritual gifts, dream reflection, meditation, rituals, affirmations, and other specified modules. The Gene Keys item has a toast but no dedicated disabled shell or official link.

The requirements matrix must include explicit rows for every requested module with PASS, DEMO, GATED, SPEC’D, or DEFERRED status.

## Additional correctness issues

- The Today screen says **Friday, July 18, 2026**; July 18, 2026 is Saturday.
- Many saved Insight, Tarot, I Ching, and Angel entries use hard-coded July 18/19 dates rather than the actual event time.
- I Ching randomly selects from only five hexagrams rather than implementing a cleared 64-hexagram casting method.
- Several “notify me” actions display toasts without notification registration or delivery.
- The local-storage schema documents `notifs` as an object, while the source stores an array.
- “No network writes” is incompatible with the optional live Stella bridge.
- Source-chip presence in the UI does not prove that a claim is grounded.

## Independent acceptance decision

| Gate | Decision |
|---|---|
| Interactive concept | **Accepted** |
| Product and information architecture | **Conditionally accepted** |
| V1.1 verification report | **Not accepted as accurate without amendment** |
| Calculation integrity | **Not accepted** |
| Consent and deletion integrity | **Not accepted** |
| Stella grounding and privacy | **Not accepted** |
| Phase 1 lock | **Withheld** |
| Responsive pass / stakeholder deck | **Deferred until integrity repair** |

## Required V1.2 repair pass

Fable should complete an **Integrity Repair Pass** before adding features:

1. Correct every V1.1 status contradicted by this audit and retain V1.1 unchanged.
2. Fix and automatically test local deletion.
3. Put the whole prototype in explicit Demo Mode and remove unsupported calculation/credential claims.
4. Either connect onboarding to one profile source of truth or label it a non-persistent preview.
5. Implement tested numerology functions or downgrade all numerology outputs to demo.
6. Replace static timezone/lunar claims with real engines or demo labels.
7. Repair Stella’s scope enforcement, history revocation, source validation, provider consent, privacy disclosure, timeout, and safety behavior.
8. Replace consent success toasts with real state transitions or plainly label them simulated.
9. Rebuild deletion, export, and ledger tests around actual stored fields.
10. Reclassify Big Five and Enneagram as illustrative prototypes.
11. Connect saved Insight Records to Throughline or mark Throughline static.
12. Produce a complete modality matrix.
13. Remove the “30 years” claim.
14. Compile a network-independent production-style bundle without runtime Babel or `new Function()`.
15. Add semantic controls, keyboard support, focus states, and screen-reader labels.
16. Supply executable automated tests and raw results—not arithmetic fixtures alone.

No production feature expansion is authorized by this audit. The next acceptable artifact is V1.2 plus its executable regression evidence.
