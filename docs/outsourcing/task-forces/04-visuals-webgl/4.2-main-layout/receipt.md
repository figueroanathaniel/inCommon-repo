# 4.2 measured page layout, integrated with main

Date: 2026-11-02 UTC
Branch: taskforce/04-visuals-webgl
Starting remote tip: be19e0e05f8cb230bb6940c7bcfa223a4d4f8d09
Main integrated: 5a589e360a9efcbe64f041c91fb683828ab79bd7
Delivery: the merge commit containing this receipt, retaining both parents.
Status: ready for independent QA; no merge to main or deployment performed.

## Remote audit and integration

Before editing, git ls-remote reported main at 5a589e3 and the visuals branch
at be19e0e. The earlier geometric repair was present on the remote visuals
branch, rather than missing. Its code is retained. Main is now integrated
without reset, rebase, force push, or discarded visuals commits.

Conflict resolutions: keep main's side-specific gate lines and the visuals
selection border together in the app; retain both hd-study-pane.js and
share-rules.js in source service-worker precaching; regenerate app.html from
the resolved source. Other main changes arrived through the merge unchanged.

## Layout changes

hdPaneRevealStage lives in app/hd-study-pane.js, not app/hd-scene.js.
It now selects the closest [data-vt-page] explicitly. Its scroll target is:

scrollTop + stage.top - (page.top + page.clientTop) - 8px.

The measured page boundary includes the sample banner, title and tab slots;
231px is not hardcoded because those elements vary by viewport and state.
The earlier 72px sizing assumption and external header subtraction remain
removed. The host supplies --hd-stage-top from the actual stage viewport top
plus an 8px gap. The open-state frame height is the remaining 46dvh reserve
minus that value, with the obsolete 240px minimum removed. The same host
rule fits the 2D frame. The 46% share is unchanged.

app/hd-scene.js now explicitly documents the renderer boundary and separates
the existing frame measurement from W/H calculation. Its resize behavior is
unchanged: read the actual frame through ResizeObserver, never reposition
host layout from the renderer. No scene DOM, fetching or storage was added.
Follow behavior, desktop column rules and Get Help stacking are unchanged.

## Executed verification

CHROMIUM_PATH=/usr/bin/chromium node tools/check-hd-pane-clear.js deploy/v6.4 --shots /tmp/hd-pane-main

Exit 0, 14/14 passed: Chromium/SwiftShader, touch phone emulation, reduced
motion; 390x844, 375x667 and 1440x900. Real first/second presses use pickAt.

| Viewport | Stage bottom | Sheet top | stage.bottom <= pane.top |
|---|---:|---:|---|
| 390x844 | 380.23px | 388.25px | true |
| 375x667 | 298.81px | 306.83px | true |

Sacral's projected position is visible after opening at both phone sizes.
Desktop checks also pass. Browser output and screenshots are adjacent.
This is the independent repo regression added in be19e0e, not a claim to
have executed TF6's separately supplied original PC1-PC14 script.

Passed: run-tests-node, run-fixtures, run-module-tests (519/519),
check-dead-controls, check-layer-boundary, check-three-lifecycle (103),
check-hd-study-workspace (13), check-purple-text and token-compare.
check-hd-study-rls: exit 2, NOT RUN because Postgres binaries are unavailable.

Not run on this integrated tree: full drift/H phases, cover/routes/swipe/
registration browser gates, normal-motion walkthrough, physical devices,
screen readers or live parity. Previous browser results in the earlier
receipt are not represented as reruns here. No new helper review occurred.
Haiku should run the independent final validation against this commit.

## Production compilation

node tools/build-bundle.js: exit 0, 63/63 modules, Google fonts.
app.html: 11,947,594 bytes including its 127-byte build header.
Complete deploy/v6.4: 382 regular files, 25,590,051 bytes.
app.html SHA-256:
a39eab5b26a6ba3bfb14b736081f6381fe7bcf7e4aa29c5040c3d25508b4c7ff
production-manifest.txt records exact sizes and SHA-256 for every shipped file.
