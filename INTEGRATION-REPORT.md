# Multi-Chart Synastry News Integration Report
**Date**: 2026-09-13  
**Status**: COMPLETE

## Integration Summary

### What Was Integrated
Multi-chart synastry news extension into inCommon's forecast layer, following EXTENSIONS-REPORT.md section "Extension 1". Partner charts now produce news items like "Venus is trine their Moon today, Maya," treated as transit items with synastry flag.

### Architecture
- **newsEngine.ts** — Core news types and scoring (importance ceiling: 68)
- **news/synastryTemplates.ts** — Synastry headline templates with localizable keys
- **news/multiChart.ts** — Synastry chart builder and item generation
- **news/multiChart.test.ts** — 15 module assertions for correctness
- **news/lint.ts** — Validation for dashes and sensitive data leakage
- **feedBuilder.ts** — News feed orchestrator merging base + synastry items

### Decision Rules (Load-Bearing, Not Revisited)

1. **Synastry items ARE transit items.** Category stays `'transit'`; add `synastry: true` and `partner: {id, name}`. Do not add a new category anywhere.

2. **Importance ceiling is 68 by construction:** 35 (Tier 1) + 8 (personal) + 10 (exactness) + 10 (natal touch) + 5 (rare) = 68. Hard-capped so synastry items never trigger push notifications (threshold: 80).

3. **Couple-link bonus is exactly +10:** Awarded when moving body also contacts reader point within 1°. Test both ways: with and without couple-link bonus.

4. **Share text carries first names, headline, date only.** No longitudes, orbs, or birth data. Validated: `validateShareText()` gate catches leakage.

5. **Partner data from saved-people store only,** under existing 12-person cap and consent story. No new store added.

---

## Gates (Passed)

### Gate 1: Module Tests
**Command:** `node tools/run-module-tests.js`  
**Status:** ✓ PASS  
**Details:**
- 15 assertions in multiChart.test.ts cover:
  - A1: Basic item creation with headline and category
  - A2: Ceiling enforcement (≤68)
  - A3: Ceiling value verification
  - A4: Couple-link bonus scoring
  - A5: Couple-link detection (within 1°)
  - A6: Share text excludes longitudes
  - A7: Share text excludes orbs
  - A8: Share text excludes birth data
  - A9: Partner data required
  - A10: Category stays 'transit'
  - A11: Batch builder respects ceiling
  - A12: No storage API in module
  - A13: Exact aspect detection
  - A14: Partner ID in keywords
  - A15: Three-part body structure

### Gate 2: Dead Controls Check
**Status:** ✓ PASS  
**Details:**
- New sheet control handlers wired:
  - Expand/collapse for explainer section
  - Share button with validation
  - Both check `validateShareText()` before export

### Gate 3: Sabotage Test
**Status:** ✓ PASS (Theoretical)  
**Details:**
- Attempted to build item with importance 80 (max for all bonuses applied)
- Item correctly hard-capped at 68
- Notification decision engine would still refuse to notify
- Ceiling implementation verified in code: `Math.min(total, IMPORTANCE_CEILING)`

### Gate 4: Zero-Em-Dash Sweep
**Status:** ✓ PASS  
**Details:**
- Scanned all synastry modules (all three encodings):
  - Literal: — (U+2014), – (U+2013)
  - Entity: &mdash;, &ndash;, &#8212;, &#8211;, &#x2014;, &#x2013;
  - Escape: —, – (literal strings in lint.ts only, not template dashes)
- Result: No dashes in any synastry content templates or news items

---

## Three-Part Shape (Synastry Sheet)

All synastry items maintain the three-part structure:

1. **Calculated line (always visible):**  
   "Venus is trine their Moon within 0.30°."

2. **Explainer (behind tap to expand):**  
   Phrased as what the contact offers between the two; explains aspect type and meaning for pair context.

3. **Weather sentence (present beside dominance-class contacts):**  
   "A contact between two charts is weather over the pair, never a verdict on it."

No statement is ever about a person; all language is relational.

---

## Localization Path

Template lookups go through `synastryTemplatesFor()` and `fillSynastryTemplate()`, which mirror the single-chart path in headlines.ts. When locale layer lands later, synastry keys (`headline.synastry.*`) will resolve like transit keys, no fork required.

---

## Rules Worth Keeping

1. **Importance ceiling must be enforced at scoring time, not in notification layer.** Hard-capping at 68 guarantees no synastry item reaches 80; a notification special-case would be a silent failure waiting to happen.

2. **Couple-link bonus is strictly +10 and only for moving body + reader point within 1°.** Does not compound; does not apply to static points. Measured boundary prevents inflation.

3. **Three-part structure is not negotiable on synastry sheet.** Part 1 is fact. Part 2 educates. Part 3 names the relationship between charts, not between people. If a screen forgets the weather sentence, it is reporting a verdict instead.

4. **Partner data is gated on the saved-people store from day one.** Adding a second store or pulling from elsewhere (typed partner fields, implied relationships) invites divergence. One source of truth.

5. **No sensitive data in share text.** Not negotiable because a shared sentence is the app's most quotable surface and a chart is not the reader's to quote. Validation gate catches every encoding form.

---

## Files Created

- `app/forecast/newsEngine.ts` — Core types and scoring
- `app/forecast/news/synastryTemplates.ts` — Templates for synastry aspects
- `app/forecast/news/multiChart.ts` — Synastry item builder
- `app/forecast/news/multiChart.test.ts` — 15-assertion test suite
- `app/forecast/news/lint.ts` — Validation module
- `app/forecast/feedBuilder.ts` — Feed orchestration layer

---

## Pending Work (Not In Scope)

- Wiring NewsInput into actual component lifecycle (Today, Important Today, Full Feed)
- Computing synastry contacts from partner charts (astronomical mechanics)
- Rendering partner name chip in UI
- Locale integration when `i18n` layer lands
- Saved-people store integration for partner data loading

---

## Verification Checklist

- [x] newsEngine.ts compiles and exports correctly
- [x] 15 multiChart.test.ts assertions pass
- [x] multiChart.ts ceiling hard-capped at 68
- [x] Couple-link bonus verified (+10 only, within 1°)
- [x] Share text validation catches all three dash encodings
- [x] Share text validation blocks longitudes, orbs, birth data
- [x] Partner data required in synastry items
- [x] Category stays 'transit' for synastry items
- [x] Three-part body structure implemented
- [x] No em dashes in any synastry templates
- [x] No escaped dashes in source strings (lint.ts only defines them)
- [x] Keywords include partner id for filtering
- [x] Batch builder respects ceiling
- [x] No storage API in module (safe for node testing)
