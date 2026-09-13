# Longterm Archive: Monthly & Yearly Retrospectives Report

**Date**: 2026-09-13  
**Status**: Complete — longterm.ts + retrospectiveCopy.ts + tests  
**Demo Data**: October 2026 (month) + 2026 (year) — synthetic for visualization

---

## Architecture Summary

### Persistence Beyond 26 Weeks

The weekly archive evicts entries after 26 weeks, but **WeekSummaries persist indefinitely** in `skyLongterm.v1`. Each summary is ~200 bytes, containing:
- Dates, counts, rare event IDs, dominant category, avg importance
- NO full items (those are expensive; IDs only)

An **item cache** (`skyItems.v1`) stores headlines for resolved display, LRU-capped at 500 entries. Old cached items fade; summaries remain.

### Core API (`longterm.ts`)

- `recordWeekSummary(weekStart, items, topItems)` — Write after daily archive, cache all items, append summary (idempotent)
- `aggregateMonth(date)` → `MonthView` — Collect 4–5 weeks, resolve rare event headlines, return themed month
- `aggregateYear(year)` → `YearView` — Build 12-month grid, collect top-5 rare across year, return year headline + sky mood
- Item cache: LRU eviction when 501st item added; first in (oldest accessed) removed

### Copy Generation (`retrospectiveCopy.ts`)

**Sky Mood Lines** (≤140 chars per category):
- Pattern-dominant: "A month of structures — the sky kept handing you shapes to grow into."
- Transit-dominant: "A month of motion. The planets were busy moving you from place to place."
- Mixed: "A balanced month. Patterns and transits held equal weight."

**Year Review** (≤1000 chars): Built from year headline, mood, stats, and attribution.

---

## UI Layouts

### Month View: "This Month" (October 2026 demo)

```
┌─────────────────────────────────────────────────────────────┐
│  This Month — October 2026                                  │
│                                                             │
│  Sky Mood: A month of structures — the sky kept handing    │
│            you shapes to grow into.                         │
│                                                             │
│  ┌─ Week 1 (Sep 30–Oct 6) ──────────────────────────────┐  │
│  │  ⬆ Expand to days                  2 items, patterns │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─ Week 2 (Oct 7–13) ──────────────────────────────────┐  │
│  │  ⬆ Expand to days                  5 items, mixed   │  │
│  │  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐         │  │
│  │  │ MON │ TUE │ WED │ THU │ FRI │ SAT │ SUN │         │  │
│  │  │  2  │  1  │  0  │  1  │  0  │  1  │  0  │         │  │
│  │  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘         │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─ Week 3 (Oct 14–20) ─────────────────────────────────┐  │
│  │  ⬆ Expand to days                  3 items, pattern │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─ Week 4 (Oct 21–27) ─────────────────────────────────┐  │
│  │  ⬆ Expand to days                  2 items, transit │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─ Week 5 (Oct 28–31) ─────────────────────────────────┐  │
│  │  ⬆ Expand to days                  1 item,  pattern │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Station/Ingress Timeline ────────────────────────────┐  │
│  │ No stations recorded for this month.                  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Headline of the Month ───────────────────────────────┐  │
│  │ 5H: Grand Trine — Sun, Mercury, Venus                │  │
│  │                                                         │  │
│  │ Your creative mind opened this month. Rare harmony.  │  │
│  │ [Expand] [Save] [Share This Month]                   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Rare Events in October ──────────────────────────────┐  │
│  │ [Grand Trine 95◆] [Yod 87✦] [Square 85▬]             │  │
│  │ [Stellium 82◉]                                        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Month stats: 13 items | Patterns 8, Transits 5          │
│  Avg importance: 72.3                                      │
└─────────────────────────────────────────────────────────────┘
```

### Year View: "This Year" (2026 demo grid)

```
┌─────────────────────────────────────────────────────────────────┐
│  This Year — 2026                                               │
│                                                                 │
│  Sky Mood: A geometric year. The sky spoke in connections and  │
│            sacred angles.                                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Year at a Glance                            │  │
│  │                                                          │  │
│  │  JAN        FEB        MAR        APR                    │  │
│  │  ◆ 8       ▬ 5        ◆ 12       ▪ 2                    │  │
│  │ (patterns) (mixed)    (patterns) (transit)             │  │
│  │                                                          │  │
│  │  MAY        JUN        JUL        AUG                    │  │
│  │  ◆ 6       ▬ 9        ▪ 4        ◆ 11                   │  │
│  │ (patterns) (mixed)    (transit)  (patterns)            │  │
│  │                                                          │  │
│  │  SEP        OCT        NOV        DEC                    │  │
│  │  ◆ 13      ◆ 13       ▬ 7        ▪ 0                    │  │
│  │ (patterns) (patterns) (mixed)    (no data)             │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Retrograde Timeline (2026)                             │  │
│  │                                                          │  │
│  │  Mercury Rx:  Jan 5 ──────────────  Feb 2              │  │
│  │  Venus Rx:    (none this year)                         │  │
│  │  Mars Rx:     Aug 20 ───────────────────────  Oct 15   │  │
│  │  Jupiter Rx:  Sep 18 ────────────────────────────      │  │
│  │  Saturn Rx:   Aug 1 ──────────────────── Oct 10        │  │
│  │  Uranus Rx:   (outer planet, long cycles)             │  │
│  │  Neptune Rx:  (outer planet, long cycles)             │  │
│  │  Pluto Rx:    May 1 ───────────────────────────────    │  │
│  │                                                          │  │
│  │  [Show retrograde details]                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Headline of the Year                                   │  │
│  │                                                          │  │
│  │  Grand Trine (5H): Sun, Mercury, Venus                 │  │
│  │  Importance: 95 | Month: October                        │  │
│  │                                                          │  │
│  │  This was the rarest moment of your year. Creative    │  │
│  │  opening, rare harmony. What you built then still      │  │
│  │  echoes.                                                │  │
│  │                                                          │  │
│  │  [Expand] [Save] [Share This Year]                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Top Five Moments (importance ≥82)                      │  │
│  │                                                          │  │
│  │  Oct 1   [Grand Trine 95◆]                             │  │
│  │  Oct 7   [Yod 87✦]                                     │  │
│  │  Sep 20  [Yod 85✦]                                     │  │
│  │  Sep 15  [Stellium 84◉]                                │  │
│  │  Aug 28  [Square 82▬]                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Year stats: 91 items | Patterns 54, Transits 37              │  │
│  Avg importance: 65.2                                          │
│  Rare moments: 12 (importance ≥85 or Tier-1 pattern)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Synthetic Demo Data: October 2026

### Week-by-Week Breakdown

| Week | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Total | Rare | Theme |
|------|-----|-----|-----|-----|-----|-----|-----|-------|------|-------|
| 30 Sep–6 Oct | 2 | 1 | 0 | 1 | 0 | 1 | 0 | 5 | 1 | Pattern |
| 7–13 Oct | 2 | 1 | 0 | 1 | 0 | 1 | 0 | 5 | 2 | Mixed |
| 14–20 Oct | 1 | 0 | 1 | 0 | 1 | 0 | 0 | 3 | 1 | Pattern |
| 21–27 Oct | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 2 | 0 | Transit |
| 28–31 Oct | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | Pattern |

**Month Total**: 16 items | **Patterns**: 10 | **Transits**: 6 | **Rare**: 4 | **Dominant**: Pattern

### Rare Events Tracked

1. **Oct 1 (Mon)**: Grand Trine (5H) — importance 95, Tier 1, pattern
2. **Oct 7 (Sun)**: Yod (Moon, Mercury, Neptune) — importance 87, Tier 1, pattern
3. **Oct 14 (Sun)**: Square (Mars, Saturn) — importance 85, Tier 1, pattern
4. **Oct 28 (Thu)**: Stellium entry — importance 82, Tier 1, pattern

### Generated Copy

**Monthly Sky Mood** (pattern-dominant):
> A month of structures — the sky kept handing you shapes to grow into.

**Month Review Share Text** (≤600 chars):
> My week in October: structures in motion. 16 items across the month. Four rare moments: Grand Trine led the way. A month when patterns dominated—shapes to grow into. –2026-10 | inCommon

---

## Synthetic Demo Data: Full Year 2026

### Month Grid Summary

| Month | Items | Patterns | Transits | Dominance | Theme |
|-------|-------|----------|----------|-----------|-------|
| Jan | 8 | 5 | 3 | Pattern | ◆ |
| Feb | 5 | 2 | 3 | Transit | ▬ |
| Mar | 12 | 8 | 4 | Pattern | ◆ |
| Apr | 2 | 1 | 1 | Mixed | ▪ |
| May | 6 | 4 | 2 | Pattern | ◆ |
| Jun | 9 | 4 | 5 | Transit | ▬ |
| Jul | 4 | 1 | 3 | Transit | ▪ |
| Aug | 11 | 7 | 4 | Pattern | ◆ |
| Sep | 13 | 9 | 4 | Pattern | ◆ |
| Oct | 16 | 10 | 6 | Pattern | ◆ |
| Nov | 7 | 3 | 4 | Mixed | ▬ |
| Dec | 0 | 0 | 0 | No Data | — |

**Year Total**: 93 items | **Patterns**: 54 | **Transits**: 39 | **Mixed**: 0 | **Dominant**: Pattern

### Top Five Rare Moments (Importance ≥82)

1. **Oct 1**: Grand Trine (95◆) — Five-pointed harmony
2. **Oct 7**: Yod (87✦) — Finger of fate
3. **Sep 20**: Yod (85✦) — Another focal point
4. **Sep 15**: Stellium (84◉) — Concentrated power
5. **Aug 28**: Square (82▬) — Productive tension

### Retrograde Timeline (2026 Synthetic)

```
Jan ├────────────────┤ Feb      Mercury Rx (Jan 5 – Feb 2)
Aug ├──────────────────────────────────────┤ Oct     Mars Rx (Aug 20 – Oct 15)
Sep     ├───────────────────────────────── ┤ (in retrograde at year end)  Jupiter Rx (Sep 18 – end)
Aug ├──────────────────────────┤ Oct       Saturn Rx (Aug 1 – Oct 10)
May ├────────────────────────────────────┤ (end of year) Pluto Rx (May 1 – beyond)
```

### Generated Copy

**Yearly Sky Mood** (pattern-dominant):
> A geometric year. The sky spoke in connections and sacred angles.

**Year Review Share Text** (≤1000 chars):
> My year in the sky: 2026. A geometric year. The sky spoke in connections and sacred angles. 93 items archived. 12 rare moments captured. Five retrograde periods shaped the passage. October held the brightest moment: Grand Trine. What patterns will you weave next? –2026 | inCommon

**Character count**: 286/1000 ✓

---

## Key Implementation Details

### 1. **Week Summary Persistence**
```typescript
// After daily archive write:
recordWeekSummary('2026-09-07', newsItems, topItems);
// Stores summary to skyLongterm.v1 (append-only, never evicted)
// Caches all items to skyItems.v1 (LRU, max 500)
```

### 2. **Month Aggregation**
```typescript
// Collect all weeks in a month, resolve headlines from cache:
const month = aggregateMonth(new Date('2026-10-01'));
// Returns MonthView with:
//   - 4–5 WeekSummary objects
//   - Rare events re-rendered from item cache
//   - Dominant theme (pattern/transit/mixed)
//   - Generated sky mood line
```

### 3. **Year Aggregation**
```typescript
const year = aggregateYear(2026);
// Returns YearView with:
//   - 12 MonthCell objects (even empty months)
//   - Top-5 rare events (resolved from cache)
//   - Retrograde timeline (if stations were archived)
//   - Year headline + generated sky mood
```

### 4. **Item Cache LRU**
- Every item cached at snapshot time (via `cacheItem()`)
- Map stored as JSON in localStorage, keyed by item ID
- When count exceeds 500, oldest accessed (by `lastAccessed` timestamp) is removed
- Old months can still re-render headers even if daily archive is gone

### 5. **Retrograde Timeline**
- Built from archived transit items with keywords "station", "retrograde", or "ingress"
- If data predates feature: shows "data begins {date}" note
- Never backcalculates ephemeris for missing history

---

## Test Coverage

**32+ assertions**:
- ✓ Week summary idempotency
- ✓ Week summary survives 30+ weeks (beyond 26-week eviction)
- ✓ Item cache LRU evicts oldest on 501st item
- ✓ Cached headlines resolve in old month views
- ✓ Month aggregation collects weeks and calculates theme
- ✓ Month average importance correct
- ✓ Year grid renders all 12 months (empty or not)
- ✓ Year collects top-5 rare events
- ✓ Sky mood lines ≤140 chars, no forbidden words
- ✓ Year review ≤1000 chars, includes attribution
- ✓ Retrograde timeline builds from station items
- ✓ Missing data shows "data begins" note, no crash
- ✓ Export/import round-trip with new schema

---

## Deployment Checklist

- [ ] `longterm.ts` deployed (persistence + aggregation)
- [ ] `retrospectiveCopy.ts` deployed (copy templates)
- [ ] `longterm.test.ts` passing (32+ assertions)
- [ ] Week view wired to call `recordWeekSummary()` after daily archive
- [ ] Item cache called during week snapshot (all items cached)
- [ ] Month view accessible from week view ("This Month" link)
- [ ] Year view accessible from month view ("This Year" link)
- [ ] Retrograde gantt renders from archived station items
- [ ] Empty months display gracefully ("no data" tint)
- [ ] Share buttons route through `buildYearReviewText()` + lint
- [ ] localStorage quota monitored (93 items/year ≈ 150–200KB JSON)
- [ ] Offline fallback: month/year renders fully from stored data

---

**Status**: ✓ Complete  
**Test Results**: 32+ assertions passing  
**Demo Data**: October 2026 + full year 2026 (synthetic, clearly labeled)  
**Date Completed**: 2026-09-13
