# Dead data ledger

A running list of unused files, unreferenced data, stale branches and retired
features in this repository, each weighed for what deleting it would touch.
**Nothing here has been deleted.** Nate's rule (6 November 2026): removal waits
until all work is completely done. This file is updated by a routine every
8 hours on the `chore/dead-data-ledger` branch, in a draft PR that is never
merged by the routine.

Verdicts:
- **Safe to delete**: no reference in code, build tools, the live bundle,
  open PRs, live Supabase functions, Netlify config or the store shells.
- **Risky**: something still names it (a gate, a doc, a precache list), or the
  evidence is incomplete. Deleting needs a matching edit or a closer look.
- **Keep**: live, or protected by a project rule (safety, privacy, accessibility).

Each entry says what was checked and what is inferred.

## Run log

### Run 1, 2026-11-07 00:18Z (main c794803)

Baseline checked this run:
- Live site: Netlify production deploy 6aee6274 is `ready`, published
  2026-11-06 23:28Z from main **c794803**, the commit this ledger was scanned at.
  The proxy here refuses incommonspace.com directly, so "live" below means the
  bundle Netlify reports it published from that commit (`deploy/v6.4`, per
  `netlify.toml`).
- Supabase project `inCommon` (lkzcybzhjjxdqetwwdrx) has five ACTIVE edge
  functions: oracle (v62), billing (v44), account (v36), store (v28),
  oracle-voice (v20). Each has a source folder in `server/`.
- Open PRs: one, #195 (`feature/astro-harmonics-aspects`).
- Store shells: `native/` builds from `tools/build-native.js`, which copies
  the bundle folder named in `tools/build-bundle.js` (v6.4).

## Candidates

### A. Questions routed here by Nate

**A1. Packet cover epigraph rows (`plEpi`, `nmEpi`)** — verdict: **Keep the
epigraph text; the ruled row around it is the dead part.**
- Asked 2026-11-06 19:17Z: should the placement and numerology packet covers
  lose their epigraph rows, as the Atlas did?
- Checked: the rows are live. `app/inCommonApp v2.dc.html` renders
  `{{ plEpi }}` at lines 5592 and 9163 and `{{ nmEpi }}` at 5754 and 9835,
  each between two hairline spans, and `deploy/v6.4/app.html` (the published
  bundle) carries the same markup (13 matches). The text is real content:
  `plEpi` is the body's role (`b.role`, line 33390) and `nmEpi` is the
  number's essence (`ent.essence`, line 27012). The packet pages reuse it
  as `pgEpi` (27038, 33432).
- Checked: the Atlas did not lose its epigraph. Commit 5b49df7 (6 Nov) took
  away the **ruled row** and moved the text under the title in small italic;
  CLAUDE.md line 5788 now says "The epigraph is not a row between hairlines
  either ... Do not put an uppercase label or a ruled line back on these pages."
  By that rule the packet covers are the last place still drawing the old row,
  and the purple kind label over their titles (`plKind`, `nmKind`,
  `pgKind`) is an eyebrow.
- Checked: the fix already exists. Branch `feature/packet-covers` holds one
  unmerged commit, **97c93bf** (6 Nov 16:11Z), "Packet covers: epigraph without
  rules, no label over the title": it drops the hairlines and the kind label
  and sets the epigraph in gold under the title (`data-epi`), as the Atlas
  does. It has no PR. It is 46 commits behind main, and its diff still applies
  to main cleanly (`git apply --check` passed).
- Recommendation: do not delete the epigraph text. Bring 97c93bf to main (PR
  from that branch) when Nate wants it; that settles the row without losing
  content. Not checked: how it looks on a phone; no screenshot was taken.

### B. Unused data inside the app file

**B1. `todaySections` (old Today rows)** — **Safe to delete** (with B2).
- `todayValsBase()` builds `todaySections` (line 26066, and an empty one at
  26049). No template reads it: the only two matches for `todaySections` in
  the app file are those two assignments. Inferred: leftover from the Today
  page before the forecast moved onto each chart (4 November).

**B2. Astrology green edge on alignment rows** — **Safe to delete the field**;
not drawn anywhere.
- `alignRows` passes `'#2fff8f'` as `edge` for Astrology (line 26153;
  `#8b5cf6` and `#7d9bff` for the other two). `todayVals()` hands these rows
  to the chart forecast banners as `fbAstro`, `fbHd`, `fbNum`. Checked all
  five banner loops (lines 1054, 1425, 2109, 8508, 9315): none reads
  `r.edge`. The other `.edge` templates in the file iterate different lists
  (`g.rows`, `sec.rows`, cards).
- Why it matters: if anyone wired it up, action green would become a category
  colour, which CLAUDE.md forbids. Removing the unused `edge` argument
  removes the trap.

### C. Retired Oki stack (unwired in V1.6.0)

**C1. `app/oki-api.js`, `oki-prompt-builder.js`, `oki-post-processor.js`,
`safety-router.js`, `memory-store.js`, `evaluation-suite.js`** — **Risky.**
- Checked: none is loaded by the app file or included in `deploy/v6.4`.
- Still named by: `app/sw.js` precache list (the dev service worker; the
  bundle's own sw.js does not list them), `tools/check-layer-boundary.js`
  (lines 106 to 111), `app/components/*.dc.html`, and docs.
- To delete: edit both of those files in the same change, then run
  `check-layer-boundary`. `safety-router.js` is a retired router, not the
  live crisis surfaces, but treat it with the safety rule in mind.

**C2. `app/oki-voice-v144.js`** — **Keep for now.** CLAUDE.md (lines 3454,
4388) and `tools/build-bundle.js` (line 617) cite its `checkVoice()` as the
pattern for the voice check. Not loaded by the app. Inferred: reference only.

**C3. `app/components/` (15 `.dc.html` files)** — **Risky**, and the two
crisis ones are **Keep** until Nate says otherwise.
- No app page, tool or bundle references any of them. They include
  `CrisisButton` and `CrisisResources`; the live crisis surfaces are in the
  app file, but safety is not negotiable, so these wait for an explicit call.

**C4. `app/ios-frame.jsx`, `app/ephemeris-worker.js`** — **Risky.** Not
loaded by the app. ios-frame is used by the verification reports and the
components above; ephemeris-worker is listed in `check-layer-boundary.js`.

### D. Ephemeris router modules

`ephemeris-router.js`, `ephemeris-backend-swiss.js`, `ephemeris-backend-current.js`,
`ephemeris-integration.js`, `ephemeris-points.js` — **Keep (for now).**
CLAUDE.md says none of them supplies a position, but the app file still loads
them and initialises the router in `componentDidMount()`. Removing them is a
code change, not a cleanup.

### E. Old bundle folders

**E1. `deploy/v6.2` (13 MB) and `deploy/v6.3` (15 MB)** — **Safe to delete.**
Netlify publishes `deploy/v6.4`; the store shells and drift check read the
folder from `build-bundle.js` (v6.4). Remaining mentions are in docs and
comments. Netlify keeps its own deploy history for rollback.

**E2. `preview/` (15 MB)** — **Risky.** `netlify.toml` serves
`preview/fonts-self` as a branch deploy context. Check whether that branch
still exists before removing.

### F. Root-level leftovers

**Safe to delete** (no reference outside themselves, not in any build or
deploy path): `ASPECT-PATTERNS-REPORT.md`, `EPHEMERIS-INTEGRATION-COMPLETE.md`,
`EXTENSIONS-COMPLETE.md`, `EXTENSIONS-INTEGRATION-COMPLETE.md`,
`HARMONIC-RECASTING-REPORT.md`, `INTEGRATION-FINAL-REPORT.md`,
`LONGTERM-REPORT.md`, `NEWS-BROADCAST-ARCHITECTURE.md`,
`NOTIFICATIONS-REPORT.md`, `PERSONALIZATION-REPORT.md`,
`PROMPTS-A-D-COMPLETE.txt`, `SKYWIRE-INTEGRATION-REPORT.md`,
`Human Design Field.html`, `Numerology.html`, `apply-voice.js`,
`first-half-phone.png`, `harness-debug-session-log.md`, `oracle-voice.patch`.

**Risky** (another file links to them; fix the link or move them into
`docs/`): `ARCHIVE-REPORT.md`, `EPHEMERIS-COMPLETE-DELIVERY.md`,
`EXTENDED-POINTS-REFERENCE.md`, `INTEGRATION-REPORT.md`,
`PROMPT-D-COMPLETION.txt`, `PROMPT-D-INTEGRATION-REPORT.md`.

Inferred, not read: these look like delivery reports from earlier build rounds.

### G. Branches (128 besides main)

Method: GitHub compare of each branch against main.

**G1. Fully merged (0 commits not on main): 108 branches** — **Safe to
delete.** Deleting a merged branch loses no commits. The `release/*`
branches are among them; keeping those as markers is Nate's choice.

claude/ad-signup-tags, claude/always-2d, claude/astral-body-on-v1.7, 
claude/astrology-ledger, claude/astrology-stage, claude/astropedia-room, 
claude/awesome-mccarthy-0vtt0j, claude/book-of-numbers, claude/builds-v6.4, 
claude/charming-wright-4vbibr, claude/cool-faraday-v2xsv3, 
claude/cycle-audit, claude/cycle-orbit-rings, 
claude/delegation-1-instructions-bhpilx, claude/drift-check-tool, 
claude/elegant-hopper-3o1dvz, claude/epic-cori-w609r8, claude/f1-alignment, 
claude/friendly-meitner-tllm0n, claude/gazetteer-rio-piedras, 
claude/glowing-app-icon, claude/harness-debug-log, claude/hd-reading-deck, 
claude/hd-stage, claude/learn-into-app, claude/library-shelf, 
claude/magical-cerf-plwk7v, claude/magical-thompson-etfgtg, 
claude/modest-faraday-rt51f9, claude/netlify-app-to-domain, 
claude/numbers-stage, claude/observatory, claude/peaceful-ptolemy-w2y3jt, 
claude/ring-cover-registration, claude/scene-direct-3d, 
claude/scene-loading-freelook, claude/scene-veil-fade, claude/seo-cover-meta, 
claude/views-2d-first, claude/zen-rubin-a8p9bz, design/incommon-mark-glyph, 
docs/hd-upgrade, docs/kin-common-setup, docs/outsourcing, 
docs/outsourcing-task-forces, feature/about-us, feature/bloom-views, 
feature/celestial-naming, feature/chart-controls, feature/charts-no-eyebrows, 
feature/composite-davison, feature/eyebrows-beyond-charts, 
feature/four-worlds, feature/harmonics, feature/hd-3d-blue, 
feature/hd-atlas-lesson-terms, feature/hd-atlas-lessons-lexicon, 
feature/hd-wording-pass, feature/hd-wording-weather-horizon, 
feature/kin-common-legal, feature/library-place-keeping, 
feature/node-tooltips, feature/obs-cabin, feature/oracle-orb-3d, 
feature/oracle-orb-glyph, feature/oracle-somatic, 
feature/progressions-complete, feature/retro-buttons, 
feature/sleeping-phoenix, feature/solar-return, feature/study-charts, 
feature/study-curricula, feature/study-education, feature/sync-no-eyebrows, 
feature/today-header, feature/vedic-navamsa, 
feature/wiring-labels-oracle-line, feature/wording-voice-review, 
feature/zodiacal-releasing, figueroanathaniel-patch-1, 
figueroanathaniel-patch-oracle-voice, fix/bundle-four-worlds, 
fix/expanded-chart-fit, fix/n-phase-theme, fix/oracle-loading-line, 
fix/oracle-parallel-halves, fix/precision-points-jpl, 
fix/registration-card-guest-save, fix/registration-card-signed-in, 
fix/routed-back-entry, fix/swipe-mid-flight, fix/verified-calculator-repairs, 
perf/meta-image-toolkit, qa/h11-deterministic, 
qa/hd-authority-derivation-test, release/2026-11-06, release/atlas-bundle, 
release/bundle-after-149-150, schema/data-map-20261027, 
sol/threejs-lifecycle-20261026, sol/threejs-mobile-perf-20261026, 
taskforce/01-data-schema, taskforce/02-security-rls, 
taskforce/02-security-rls-account-tier, taskforce/03-refactor-features, 
taskforce/05-performance, visuals/globe-frame-cost-20261026, 
visuals/stage-resume-20261027, 

**G2. Commits not on main** — **Risky**, check each before deleting. A branch
"1 ahead" may have been squash-merged (content on main under another commit)
or abandoned.

| Branch | Ahead | Behind | Last commit | Note |
|---|---|---|---|---|
| feature/astro-harmonics-aspects | 5 | 0 | 2026-11-07 | **Keep**: open PR #195 |
| feature/packet-covers | 1 | 46 | 2026-11-06 | **Keep**: holds 97c93bf, see A1 |
| draft/recovery-2.9.7-20261103 | 29 | 172 | 2026-11-03 | recovery draft |
| taskforce/04-visuals-webgl | 29 | 172 | 2026-11-04 | |
| qa/4.2-phone-staging | 28 | 172 | 2026-11-04 | 4.2 QA staging |
| fix/hyakutake-horizons-ephemeris | 11 | 410 | 2026-10-26 | |
| celestial-codex | 2 | 410 | 2026-10-24 | |
| claude/chart-dropdowns-flashcards | 2 | 464 | 2026-10-20 | |
| taskforce/06-qa-tests-docs | 2 | 278 | 2026-10-28 | |
| feature/chart-expand | 1 | 102 | 2026-11-05 | PR #154 merged; 1 later commit |
| feature/atlas-bubble-gentle | 1 | 146 | 2026-11-04 | |
| feature/astro-house-systems | 1 | 156 | 2026-11-04 | PR #150 merged; 1 later commit |
| docs/outsourcing-bot-foundation-20261031 | 1 | 187 | 2026-10-31 | |
| visuals/interactive-20261026 | 1 | 370 | 2026-10-27 | |
| claude/lift-interactive | 1 | 461 | 2026-10-20 | |
| claude/scene-first-load | 1 | 481 | 2026-10-20 | |
| claude/quirky-einstein-5nleai | 1 | 546 | 2026-10-12 | |
| claude/wizardly-davinci-gc1xv3 | 1 | 575 | 2026-10-11 | |
| claude/drift-check-baseline-refresh | 1 | 650 | 2026-09-22 | |
| claude/astropedia-planet-astral-body-3vari9 | ? | ? | ? | no common history with main |

### H. Live services

The five Supabase functions and `server/migrations` 0001 to 0018 are **Keep**
(all deployed or applied; migrations verified live 2026-11-04). Not scanned
this run: the database for unused tables or columns.

## Not covered yet
- Unused functions and state keys inside `app/inCommonApp v2.dc.html` beyond
  B1 and B2 (36,465 lines; a fuller sweep is next).
- `docs/`, `reports/`, `verification/`, `celestial-codex/` folders.
- Unused database tables and columns in Supabase.
