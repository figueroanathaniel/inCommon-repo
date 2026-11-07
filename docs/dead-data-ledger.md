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

### Run 2, 2026-11-07 08:18Z (main dc1a03f)

What changed since run 1:
- Live site: Netlify production deploy 6aee9ef7 is `ready`, published
  2026-11-07 03:46Z from main **dc1a03f** (Merge PR #200), the commit this run
  was scanned at.
- Main gained PRs #195 (harmonics replaces Important Today), #197 (Astropedia
  lexicon) and #200 (retrogrades, pulls under Placements, aspect grid).
- Open PRs now: #198 (`feature/numbers-lexicon`), #199
  (`feature/astropedia-lexicon-3`) and this ledger, #196.
- Supabase: the same five functions, same versions (oracle v62, billing v44,
  account v36, store v28, oracle-voice v20). No change.
- New candidate: B3, `retroSel`. Checked and clean: the Important Today removal
  in #195 left nothing behind (`todayLines`, `todayBody`, `retroTabs` and
  `retroBody` have 0 matches in the app file).
- A1, B1 and B2 are unchanged in substance; line numbers below are updated to
  dc1a03f. 97c93bf still applies cleanly to dc1a03f.
- Branches: 133 besides main, 111 fully merged (3 newly merged, none deleted).

### Run 3, 2026-11-07 16:18Z (main c870ce5)

What changed since run 2:
- Live site: Netlify production deploy 6aef2d30 is `ready`, published
  2026-11-07 13:52Z from **2e0e0e4** (Merge PR #202). Main is now c870ce5
  (#205 aspect sheet voice, #207 At Home and Held together), which is **not
  live yet**, and the Netlify API reports this deploy as `locked: true`.
  Checked: both fields read from the Netlify API. Inferred: a locked deploy
  stops later commits publishing on their own, so #205 and #207 wait until
  someone unlocks or publishes.
- Open PRs: #198 and #199 as before, plus #203, #204, #206 and #208 (all
  active feature work, Keep). This ledger is #196.
- Supabase: the same five functions, same versions. No change.
- New candidates: B4 `ASP_PLAY` and B5 `lowerFirst()`, both left unread by
  #205 (commit 75ddc86).
- A1: `plEpi` and `nmEpi` still present; 97c93bf still merges without
  conflict. B1 to B3 unchanged.
- Slow scan (Nate's request, 14:30Z): full report at
  `/mnt/project-files/dead-data-ledger/slow-scan-2026-11-07.md`. Pruning
  tests (Nate's request, 15:45Z): 14 pass or fail tests that decide keep or
  delete, at `/mnt/project-files/dead-data-ledger/pruning-tests.md`. Both
  are summarised under section I below. Nothing was deleted.

## Candidates

### A. Questions routed here by Nate

**A1. Packet cover epigraph rows (`plEpi`, `nmEpi`)**: verdict: **Keep the
epigraph text; the ruled row around it is the dead part.**
- Asked 2026-11-06 19:17Z: should the placement and numerology packet covers
  lose their epigraph rows, as the Atlas did?
- Checked: the rows are live. `app/inCommonApp v2.dc.html` renders
  `{{ plEpi }}` at lines 5609 and 9198 and `{{ nmEpi }}` at 5771 and 9870 (dc1a03f),
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
  does. It has no PR. It is 60 commits behind main (run 2), and its diff still applies
  to main dc1a03f cleanly (`git apply --check` passed in runs 1 and 2).
- Recommendation: do not delete the epigraph text. Bring 97c93bf to main (PR
  from that branch) when Nate wants it; that settles the row without losing
  content. Not checked: how it looks on a phone; no screenshot was taken.

### B. Unused data inside the app file

**B1. `todaySections` (old Today rows)**: **Safe to delete** (with B2).
- `todayValsBase()` builds `todaySections` (line 26454, and an empty one at
  26437, at dc1a03f). No template reads it: the only two matches for `todaySections` in
  the app file are those two assignments. Inferred: leftover from the Today
  page before the forecast moved onto each chart (4 November).

**B2. Astrology green edge on alignment rows**: **Safe to delete the field**;
not drawn anywhere.
- `alignRows` passes `'#2fff8f'` as `edge` for Astrology (line 26541 at dc1a03f;
  `#8b5cf6` and `#7d9bff` for the other two). `todayVals()` hands these rows
  to the chart forecast banners as `fbAstro`, `fbHd`, `fbNum`. Checked all
  five banner loops (lines 1054, 1425, 2109, 8508, 9315): none reads
  `r.edge`. The other `.edge` templates in the file iterate different lists
  (`g.rows`, `sec.rows`, cards).
- Why it matters: if anyone wired it up, action green would become a category
  colour, which CLAUDE.md forbids. Removing the unused `edge` argument
  removes the trap.

**B3. `retroSel` (old retrograde tab selection)**: **Safe to delete** (new in
run 2).
- Written once, by the retrograde search row at line 21674:
  `searchSpirit('astrology', 1, { featOpen: 'retro', retroSel: r.n })`. Read
  nowhere: that is its only match in the app file. Inferred: #200 replaced the
  retrograde tabs with the retrograde glance (`rxGlance`), which does not read
  it. CLAUDE.md's "Each retrograde body is a plain button" paragraph still
  names `retroSel`, so a removal should correct that sentence too. Not checked:
  whether the search row should now open that body's glance instead; that is a
  behaviour question, not dead data.

**B4. `ASP_PLAY` (aspect possibility table)**: **Risky** (new in run 3).
- Its only reader in the app, the aspect sheet line at 19523, was removed by
  #205 (75ddc86). Now its definition at line 18129 is its only match in the
  app file. `tools/check-aspect-text.js` still lifts it and checks every
  aspect has an entry, so deleting it means changing that gate in the same
  change. CLAUDE.md's "Aspects teach what the contact offers" names it.

**B5. `lowerFirst()`**: **Safe to delete** (new in run 3).
- Defined at line 18064; its only call was the same removed line. No tool
  reads it.

### C. Retired Oki stack (unwired in V1.6.0)

**C1. `app/oki-api.js`, `oki-prompt-builder.js`, `oki-post-processor.js`,
`safety-router.js`, `memory-store.js`, `evaluation-suite.js`**: **Risky.**
- Checked: none is loaded by the app file or included in `deploy/v6.4`.
- Still named by: `app/sw.js` precache list (the dev service worker; the
  bundle's own sw.js does not list them), `tools/check-layer-boundary.js`
  (lines 106 to 111), `app/components/*.dc.html`, and docs.
- To delete: edit both of those files in the same change, then run
  `check-layer-boundary`. `safety-router.js` is a retired router, not the
  live crisis surfaces, but treat it with the safety rule in mind.

**C2. `app/oki-voice-v144.js`**: **Keep for now.** CLAUDE.md (lines 3454,
4388) and `tools/build-bundle.js` (line 617) cite its `checkVoice()` as the
pattern for the voice check. Not loaded by the app. Inferred: reference only.

**C3. `app/components/` (15 `.dc.html` files)**: **Risky**, and the two
crisis ones are **Keep** until Nate says otherwise.
- No app page, tool or bundle references any of them. They include
  `CrisisButton` and `CrisisResources`; the live crisis surfaces are in the
  app file, but safety is not negotiable, so these wait for an explicit call.

**C4. `app/ios-frame.jsx`, `app/ephemeris-worker.js`**: **Risky.** Not
loaded by the app. ios-frame is used by the verification reports and the
components above; ephemeris-worker is listed in `check-layer-boundary.js`.

### D. Ephemeris router modules

`ephemeris-router.js`, `ephemeris-backend-swiss.js`, `ephemeris-backend-current.js`,
`ephemeris-integration.js`, `ephemeris-points.js`: **Keep (for now).**
CLAUDE.md says none of them supplies a position, but the app file still loads
them and initialises the router in `componentDidMount()`. Removing them is a
code change, not a cleanup.

### E. Old bundle folders

**E1. `deploy/v6.2` (13 MB) and `deploy/v6.3` (15 MB)**: **Safe to delete.**
Netlify publishes `deploy/v6.4`; the store shells and drift check read the
folder from `build-bundle.js` (v6.4). Remaining mentions are in docs and
comments. Netlify keeps its own deploy history for rollback.

**E2. `preview/` (15 MB)**: **Risky.** `netlify.toml` serves
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

### G. Branches (133 besides main, run 2)

Method: GitHub compare of each branch against main.

**G1. Fully merged (0 commits not on main): 111 branches**: **Safe to
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
feature/astro-harmonics-aspects (run 2), feature/astropedia-lexicon (run 2), 
feature/retrogrades-pulls (run 2).

**G2. Commits not on main**: **Risky**, check each before deleting. A branch
"1 ahead" may have been squash-merged (content on main under another commit)
or abandoned.

| Branch | Ahead | Behind | Last commit | Note |
|---|---|---|---|---|
| feature/numbers-lexicon | 7 | 3 | 2026-11-07 | **Keep**: open PR #198 |
| feature/astropedia-lexicon-3 | 2 | 3 | 2026-11-07 | **Keep**: open PR #199 |
| chore/dead-data-ledger | 1 | 14 | 2026-11-07 | **Keep**: this ledger, PR #196 |
| feature/packet-covers | 1 | 60 | 2026-11-06 | **Keep**: holds 97c93bf, see A1 |
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

### I. Slow scan of 7 November (summary)

Full evidence in the slow scan report named in run 3. Headlines, checked at
2e0e0e4:
- Page weight: `app/jpl-derived-points.js` is 43% of every page load (2.21 of
  4.20 MB gzipped); only the Expanded Chart's planetary nodes and Lilith read
  it. **Keep**; loading it lazily is a separate change for Nate.
- Old bundles `deploy/v6.2` and `deploy/v6.3` (26 MB): **Safe**, removal
  trial owed. `preview/fonts-self` and `app/assets/canonical`: **Risky**,
  named in CLAUDE.md. `celestial-codex/`: **Risky**.
- 33 methods never called (about 427 lines): **Safe**, except the Oki ones
  (Oki is kept unwired by rule) and `personalWeek`/`weekNo` (test U7).
- Nine scripts loaded on every visit and never called (news, i18n,
  multiChart, skyWire, lint, feedBuilder): **Risky**, their gates test them.
- Dead state keys (sabQuery, sabSign, icOpenLine, dailyNumOpen, numListsOpen,
  hsSky, retroSel, flushing): **Safe**.
- Repo size: removing files will not shrink the 87 MB repo much; history
  holds over 100 copies of the 12 MB bundle.

## Not covered yet
- Unused functions and state keys inside `app/inCommonApp v2.dc.html` beyond
  B1 and B2 (36,465 lines; a fuller sweep is next).
- `docs/`, `reports/`, `verification/`, `celestial-codex/` folders.
- Unused database tables and columns in Supabase.
