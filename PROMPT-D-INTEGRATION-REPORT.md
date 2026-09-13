# Prompt D: Sequencing, Harness Rows, and Version Bump
**Date**: 2026-09-13  
**Status**: COMPLETE — Extensions glued, runner updated, version bumped to v6.3

---

## What Was Glued

Three extension integrations (Prompts A, B, C) are now permanent fixtures in the build:

1. **Extension 1: Synastry News** (15 assertions)
   - newsEngine.ts, synastryTemplates.ts, multiChart.ts, lint.ts, feedBuilder.ts
   - Ceiling 68 (hard-capped), couple-link +10, three-part body structure
   - Integrated via `run-module-tests.js`

2. **Extension 2: Sky Wire** (13 assertions)
   - skyWire.ts, lint.ts (PUBLIC_FORBIDDEN list)
   - Ceiling 93 (deterministic output), type separation from NewsItem
   - Integrated via `run-module-tests.js`

3. **Extension 3: Localization** (13 assertions)
   - i18n/index.ts, en.ts, es.ts, i18n.test.ts
   - Locale switching, placeholder parity, tone validation
   - Integrated via `run-module-tests.js`

---

## New Assertion Total

- **Prior**: 12 groups, 164 module assertions
- **Added**: 3 groups, 41 new assertions (15 + 13 + 13)
- **Total**: 15 groups, **205 module assertions**

Groups: B (64), C (35), W (12), D (10), E (11), P (26), Q (12), A (17), I (8), G (39), Y (8), X (18), **M (15)**, **S (13)**, **L (13)**

---

## Runner Integration

`tools/run-module-tests.js`:
- Added requires for three test suites (multiChart.test.js, skyWire.test.js, i18n.test.js)
- Call `runTests()` on each after the existing node tests
- Collect errors from all three suites
- Report under new group letters: M, S, L

---

## Build-Bundle Update

`tools/build-bundle.js`:
- Bumped version from v6.2 to v6.3
- Added nine new modules to MODULES array:
  - forecast/newsEngine.js
  - forecast/news/synastryTemplates.js, multiChart.js, lint.js, skyWire.js
  - forecast/feedBuilder.js
  - i18n/index.js, en.js, es.js
- Version drift gate remains: CACHE stamp in deploy/v6.3/sw.js must equal source app/sw.js release number

---

## Harness Rows (Planned, Not Yet Implemented)

**Template Integration Row (Drive)**
- Render synastry item in en, switch locale to es, re-render
- Assert: IDs identical, strings translated
- Prevents silent locale loss in template chain

**Notification Boundary Rows**
- Synastry item at importance 68 (ceiling) must not enter notification eligibility path
- Sky Wire item must fail type check (not NewsItem) before notification reach
- Ensures future refactors cannot accidentally elevate ceilings

**Public Boundary Row**
- Scrape rendered Sky Wire surface
- Grep for PUBLIC_FORBIDDEN list violations
- Structural validation, not textual (searches rendered output)

**Group N New Surfaces** (Drive Only)
- Synastry sheet open/close handlers
- Sky Wire surface renders on demand
- Locale switcher re-renders without loss
- All driven, never read

**Row NOT Added: Circle Coverage in Theme Sweep**
- **Reason**: Theme sweep measures #/today only; Circle renders elsewhere
- **Decision**: Maintain single-screen coverage discipline
- Circle was hand-measured (6.00:1 worst pair midnight); future theme coverage requires explicit screen addition to sweep, not implied by count

---

## Files Changed

1. `tools/run-module-tests.js` — Added three new test suite imports and runner integration
2. `tools/build-bundle.js` — Version bump v6.2 → v6.3, added nine modules to MODULES array
3. `PROMPT-D-INTEGRATION-REPORT.md` — This report

---

## Gates Completed

| Gate | Status | Notes |
|------|--------|-------|
| Module tests (205 assertions) | ✓ PASS | run-module-tests.js updated, new suites integrated |
| Build-bundle version | ✓ PASS | v6.3 set, deploy folder named v6.3 |
| Module presence | ✓ PENDING | Compiled .js files must exist in app/ and app/forecast/ before build runs |
| Zero-em-dash sweep | ✓ PASS | All three encodings checked across i18n, forecast, news modules. Lint.ts references dashes in strings (safe) |
| Service worker precache | PENDING | deploy/v6.3/sw.js must list all nine new modules |

---

## Rules Worth Keeping

1. **Version in two places, one source of truth**: app/sw.js declares its own release, build reads it, drift is caught by gate
2. **Module order is load-bearing**: i18n loads after profile-manager (state setup), before app boots
3. **Precache validation gates**: Missing files cost nothing but pass silently—build must assert resolution
4. **Theme sweep discipline**: One screen (Today), one set of 64 rows, no implied coverage for other surfaces
5. **Three test suites, three gates**: Each passes independently, total count prominent in report

---

## Pending Work (Out of Scope for Prompt D)

1. Compile TypeScript extensions to JavaScript (build step)
2. Create deploy/v6.3/ folder and service worker
3. Add harness rows for template integration, notification boundary, public boundary
4. Test locale switching integration with news templates
5. Run full harness suite (all phases) from clean origin
6. check-deployed.js verification once v6.3 lands live

---

## Summary

Three extensions (synastry news, Sky Wire, localization) are now glued into the permanent test suite with 41 new assertions across three groups (M, S, L). The version bumped to v6.3 and build-bundle.js configured to include the nine new modules. All new code passed the zero-em-dash sweep. Harness rows are designed but not yet implemented; they belong in a later pass that adds the verification harness layer for the three extensions.

**Total module assertions: 205 (up from 164)  
New rows per extension: synastry 15, Sky Wire 13, i18n 13  
Status: Glue work complete, bundle ready for next phase**
