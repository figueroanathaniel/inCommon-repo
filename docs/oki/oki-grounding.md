# Oki: grounding contract v2 (V1.2)

Source of truth: `sysPrompt()`, `safetyGate()`, `reply()`, `sendText()`, `canned()`, `effScopes()` in `inCommon Prototype V1.2.dc.html`, plus `SOURCE_REGISTRY`, `validateCitations()`, `filterHistory()`, `sanitizeForPrompt()`, `crisisCheck()`, `withTimeout()` in `incommon-core.js`. This document is a faithful extract, not a second implementation. Test ids refer to `handoff/test-results-v1.2.json`.

## Architecture
Oki never calculates. Pre-computed results are injected as labeled CONTEXT blocks: only for scopes enabled in the Context panel (`okiCtx`). Since V1.2 the prompt explicitly labels astrology/HD context as **demo persona data** and numerology as **computed by incommon-core** (the same tested functions the suite executes). With no live provider (or consent declined), a scripted library answers under the same scope rules, tagged "Scripted · offline" (scope leak regression: IT4).

## Citation contract (audit B6, enforced, not advisory)
Every live reply MUST end with `SOURCES: <1, 3 pipe-separated chips>`. `validateCitations()` then:
1. rejects replies with **no SOURCES line** (S1, IT5: the exact acceptance bug the audit reproduced);
2. resolves each chip against `SOURCE_REGISTRY` (Natal/Numerology/HD→`chart`, Transit/Moon→`transits`, `Insight · date`→`insights` with the date required to exist in her records, Journal→`journal`, Assessment→`assess`, Synastry→`duo`; Scripted/Safety always legal): model-invented chips are rejected (S4);
3. rejects any chip whose scope is currently **disabled** (S3, IT6) and any insight citation whose date is not in records (S5, S7);
4. one bad chip poisons the whole reply (S9).
A rejected reply is **withheld**: the user sees a visible notice naming the failure and a scripted fallback instead. Validated scopes are stored on each message (`msg.scopes`) so revoking a scope later also filters that reply out of both the visible thread and the model history (H1).

## Injection defense + output check
- User-authored text (insight records, journal context) is interpolated only through `sanitizeForPrompt()`: whitespace collapsed, `SOURCES:` neutralized, `` ` { } < > `` stripped, capped at 200 chars, wrapped in «guillemets», and the prompt instructs Oki to treat guillemet content as quoted data, never instructions (Z1).
- Model **output** is re-checked: crisis language in a reply routes to the deterministic safety message instead (output gate in `reply()`).
- Live calls run under `withTimeout(…, 20000)`: a hung bridge falls back to scripted (W2).

## Crisis safety gate (deterministic, pre-model)
`safetyGate()` runs before consent modal, pacing, and any model call; crisis phrasing is never interpreted, never sent to a provider (G1/G2 cover the regex both ways). Response: scripted human-support redirect (988, findahelpline.com, local emergency).

## Model-processing consent (V1.2)
The FIRST message that would reach a live bridge opens a consent modal naming the provider bridge (`window.claude.complete` as configured by the embedding host), listing exactly which enabled scopes would leave the browser. Accept → recorded in `consentEvents` (`model-processing/grant`) and on the Data screen (revocable). Decline → scripted-only. No consent, no egress.

## Rate limit (anti-dependency, spec §10: 11)
6 messages per rolling 60 s; the 7th is blocked with the pacing toast (IT9).

## Consent & memory
- Context toggles live in `okiCtx`; the Data & Consent ledger derives from real `consentEvents` (newest-first, with `via`) plus labeled demo history rows (C2, IT7).
- Two-person revoke removes Jordan's data from context (`TWO-PERSON DATA: EXCLUDED` in the prompt), appends a ledger event, and resets the invite flow (IT7). Two-person exchange itself is SIMULATED: no real second party.
- "Forget this conversation" resets to the greeting and the purge propagates to the persisted store (IT8).
- Birth-time mode gates what Oki may state: `unknown` suppresses Rising/houses/Moon-degree/HD in the prompt with an explicit never-guess instruction (IT3).

## Known limits (V1.2)
- Live provider, model, retention, and unit costs remain **undemonstrated** (T11 PARTIAL). Grounding is enforced by local validation, not provider guarantees.
- Prompt-injection resistance has unit coverage (Z1) but **no adversarial red-team suite** (T9 PARTIAL).
- The scripted library is a finite branch set; its scope behavior is tested (IT4) but it is not a model.
