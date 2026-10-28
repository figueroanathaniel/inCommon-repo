# Brief 5: Load Time & Performance Tuning

Agents: named in the roster in 00-README.md, workstream 5 (Task Force 5).
Read 00-README.md, CHARTER.md and CLAUDE.md first.

You are tuning load time and runtime performance for inCommon
(repo: figueroanathaniel/inCommon-repo, base branch: main).
Work on the Task Force 5 branch named in CHARTER.md (since 28 October 2026).

STEP 0: READ BEFORE ANYTHING ELSE
1. Read CLAUDE.md in full. These rules are mandatory:
   - one codebase; never create device-specific copies of the app
   - inline styles plus the single stylesheet in the document <head>
   - no requests to third-party CDNs
   - never edit vendored files: three.module.js, three.core.js,
     react-*.js, supabase-js-*.js
   - never change the cover shader's constants
   - no em dashes or en dashes anywhere, including comments
2. Read the full diffs of workstream 4's merged pull requests (listed under
   "Current values" in 00-README.md). They already did 3D work, including:
   - #92: 3D stages wait for shader compilation before freeing GPU memory
   - #93: unseen 3D stages release their bloom render targets, and the
     quality ladder no longer misreads gaps between frames
   - #97: fewer temporary math allocations in the close up globe graphics
   Do not redo, revert or work around those changes.
   tools/check-three-lifecycle.js guards them and must keep passing.

STEP 1: CHECK THE BASELINE IS GREEN
Run these from the repo root. All must pass before you change anything.
If any fails on untouched main, stop and report it.
  node tools/build-bundle.js
  node tools/run-tests-node.js
  node tools/run-fixtures.js
  node tools/run-module-tests.js
  node tools/check-dead-controls.js
  node tools/check-purple-text.js
  node tools/token-compare.js
  node tools/check-layer-boundary.js
  node tools/check-three-lifecycle.js
  node tools/drive-cover.js
  node tools/drift-check.js --force
Playwright and Chromium are installed globally. If require('playwright')
fails, set NODE_PATH to the output of "npm root -g".

STEP 2: MEASURE
Write tools/measure-load.js. It drives deploy/<current>/ in Playwright Chromium
at 390x844 with touch, network throttled to Slow 4G, CPU slowed 4x.
Run each measurement 5 times and record the median. Measure:
  a. Cover (index.html): first paint; time until the Continue pill can be
     pressed; time until window.__EH_LIVE is true.
  b. App (app.html#/today): bytes transferred; first paint; time until the
     window event "incommon:ready" fires; count and total duration of
     main-thread tasks over 50ms during boot; JS heap size after boot.
  c. Cover to app: press Continue, then Yes. Time until the element
     .welcome-registration-card exists and its date input can be focused.
  d. Repeat visit: a, b and c again with the service worker already
     installed.
Write the results to docs/PERF-BASELINE.md as a table.

STEP 3: LIST OPPORTUNITIES (do not change code yet)
Investigate each item below, measure its real cost, and write a ranked list
(expected gain, risk, files touched) at the end of docs/PERF-BASELINE.md.
  - app.html is about 11.8 MB because tools/build-bundle.js inlines all
    61 modules. jpl-derived-points.js alone is 5.5 MB. Next largest:
    comet-integrated-jpl.js (0.75 MB), minor-body-elements.js (0.29 MB),
    comet-hyakutake-jpl.js (0.19 MB). Find which of them Today, the
    registration card and the first run need at boot. Model any deferral
    on how gazetteer-world.js is already loaded only on demand.
  - boot() polls modulesReady() every 150ms. Check whether it waits for
    modules the first screen never uses.
  - Fonts load from Google Fonts. Compare against
    "node tools/build-bundle.js --fonts self".
  - The cover's WebGL renderer: check only whether it delays the Continue
    pill becoming usable. Do not change rendering or the quality ladder.

STEP 4: IMPLEMENT, ONE CHANGE AT A TIME, IN RANKED ORDER
For each change:
  1. Make the change.
  2. Run "node tools/build-bundle.js", then every command in STEP 1.
  3. Rerun tools/measure-load.js.
  4. If every check passes AND a measurement improved: commit with a
     message giving before and after numbers.
     Otherwise: revert the change completely, note why in
     docs/PERF-BASELINE.md, and move to the next item.
Hard rules:
  - Anything deferred must still be precached by the service worker
    (sw.js), so the app keeps working offline.
  - If you change what build-bundle.js inlines, add a refusal to
    build-bundle.js that fails the build when a deferred module has no
    loader.
  - Nothing on any screen may look or behave differently. If a deferred
    module makes content arrive later, show the existing "Loading" state,
    never an empty or broken one.
  - STOP AND ASK before any change that would need a visible tradeoff,
    touches the cover's design, or removes a feature, even temporarily.

STEP 5: FINISH
  1. Run "node tools/drift-check.js --force --with-h". The H phase can take
     over ten minutes under software rendering; that is normal.
  2. Add a section to CLAUDE.md: what is deferred, how it loads, how it is
     precached, and how to rerun tools/measure-load.js.
  3. Push the branch and open a pull request. Its description must contain
     the final before and after table, every reverted attempt and why, and
     the full check results.

SECONDARY AND TERTIARY
Approved by the owner on 27 October 2026. "Helpers" in 00-README.md applies:
the browser runner, shared seats, and the helper log every pull request
ends with. Who holds each seat is in the roster.

SECONDARY (repo access, full context). It checks the primary's numbers
rather than trusting them:
  1. On the primary's branch, it runs tools/measure-load.js itself, in its
     own session, five times, and compares the medians with the primary's
     table. A gap over 15% on any row is reported on the pull request before
     it merges. Baseline A is checked the same way, on main c259e80.
  2. For each "safe now" PR, "git diff --name-only" shows none of workstream
     4's files and no stage code in the app file.
  3. It confirms every deferred module is still precached by sw.js: load the
     app once online, go offline, and open every screen that needs a
     deferred module.
  4. It reviews each loader's failure path: what the screen shows if the
     deferred file fails to load. Block the file and look.
  5. For the JPL deferral (assignment 5.1, Task 2a), compare every planetary
     node and the lunar apogee in the expanded chart with main, to the
     arcsecond, for three fixed births. They must be identical.
  6. Baseline B is measured only after the graphics update merges, and the
     PR names the commit.
  It takes the branch over if the primary stalls.

TERTIARY: none, by the owner's decision. Browser runs come from the primary,
the secondary, or the runner named in "Helpers".
