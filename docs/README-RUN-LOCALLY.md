# inCommon, Companion Source Bundle (V1.2)

Everything needed to run, inspect, and re-verify the prototype locally, founder-controlled, no Fable account required.

## Contents
| File | Role |
|---|---|
| `inCommon Prototype V1.2.dc.html` | Current app build: all screens, logic, live numerology, consent + persistence wiring |
| `inCommon Prototype.dc.html` | V1 build (retained unchanged, historical) |
| `incommon-core.js` | Shared core (UMD): numerology, angel numbers, dates, birth-time visibility, guarded persistence, consent events, citation validation, crisis gate. The SAME file is executed by the app, the browser suite, and the Node suite |
| `Verification Report V1.2.dc.html` | Current report (change log, matrix, executed-test evidence) |
| `Verification Report V1.1.dc.html` / `Verification Report.dc.html` | Prior reports (retained unchanged) |
| `Test Runner V1.2.dc.html` | Browser test runner: auto-runs 55 assertions on load, shows pass/fail + SHA-256 of sources under test |
| `support.js` | Runtime: template hydration, JSX transpile, hot reload (see dependency disclosure) |
| `ios-frame.jsx` | Device-frame component (presentation only) |
| `doc-page.js` | Print/pagination shell used by the reports |
| `uploads/inCommon_Fable_5_Master_Build_Prompt.md` | Founding specification |
| `uploads/inCommon_Independent_Source_Audit_V1.0.md` | Independent audit driving the V1.2 repairs |
| `handoff/tests.js` | Test suite (UMD; 43 pure + 12 integration assertions) |
| `handoff/run-tests-node.js` | Node runner for the pure half: `node handoff/run-tests-node.js` |
| `handoff/test-results-v1.2.json` | Executed results, captured verbatim from the runner (timestamp, env, SHA-256, all 55 assertions) |
| `handoff/calculation-fixtures.json` | Test vectors (numerology/angel executed; tz/lunar/astrology are licensing-gated targets) |
| `handoff/local-storage-schema.md` | Persistence schema v2 (all keys, shapes, deletion guard) |
| `handoff/stella-grounding.md` | Stella grounding contract v2 (scopes, citation validation, safety, limits) |
| `handoff/changelog-v1.2.md` | Audit finding → fix → evidence map |

## Run locally
1. Unzip to a folder.
2. Start any static file server there, e.g. `python3 -m http.server 8000` (or `npx serve`).
3. Open `http://localhost:8000/inCommon%20Prototype%20V1.2.dc.html`.
4. Do **not** open via `file://`, browsers block local script/JSX fetches; a static server is required.

## Re-run the verification suite
- **Browser (all 55):** open `http://localhost:8000/Test%20Runner%20V1.2.dc.html`. It fetches `incommon-core.js` + `handoff/tests.js`, prints SHA-256 of both, runs the pure suite, then boots the real prototype in a hidden iframe and drives the integration tests.
- **Node (43 pure):** `node handoff/run-tests-node.js`, emits the same JSON shape; DOM integration tests are reported `skipped`.
- Integration tests use `?test=1`, which suffixes every storage key with `_test`: your real app data is never touched.

## Test hook (documented dev API)
The V1.2 prototype exposes `window.__incommon` (the mounted component) and, with `?test=1`, namespaced storage. This is what `handoff/tests.js` drives: `setState`, `numVals()`, `visVals()`, `sysPrompt()`, `canned(q)`, `reply(q)`, `sendText(t)`, `ensurePersist()`, and the `renderVals()` handlers (`revoke`, `forgetChat`, `delConfirm`). Remove the hook line in `componentDidMount` for any public deployment.

## Reset demo state
Data & Consent → Delete (two-step; verifies storage is empty, then reloads), or clear localStorage keys `incommon_state_v1`, `incommon_theme`, `incommon_state_v1__tombstone`.

## Dependency disclosure (corrected in V1.2: audit B7)
- **NOT self-contained:** `support.js` loads React, ReactDOM, and Babel from the unpkg CDN at runtime. Offline or CDN-blocked, the app does not boot. A production build replacing CDN + in-browser transpile remains **open (B7)**.
- **External, cosmetic:** Google Fonts. Offline it degrades to system fonts; nothing breaks.
- **Host-optional AI egress:** Stella upgrades to a live model only when the embedding host provides `window.claude.complete`. V1.2 gates the FIRST live call behind an explicit model-processing consent modal (named provider bridge, revocable on the Data screen; consent recorded in the ledger). Declined or absent → scripted library under the same grounding rules, tagged "Scripted · offline." Provider, model, retention, and unit costs for production remain undemonstrated (T11).
- **No** analytics, accounts, or other network writes. All personal data stays in browser localStorage.
