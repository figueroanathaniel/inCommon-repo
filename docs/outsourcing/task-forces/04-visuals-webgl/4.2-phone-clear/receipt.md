# 4.2 phone sheet clearance repair

Date: 2026-11-02 UTC
Branch: taskforce/04-visuals-webgl
Start SHA: 4e465092715a86f18eab0fa0ae5967979eed996b
Delivery SHA: the commit containing this receipt; no history rewrite.
Status: repair ready for independent QA, not approved for merge or deployment.

## Change

The host measures the stage's actual viewport top and supplies --hd-stage-top.
Open mobile stages, both WebGL and 2D, use the remaining 46dvh reserve minus
that measured top and an 8px gap. The old 240px minimum no longer forces the
stage underneath the reading. Reveal scrolling uses the scroller's own top,
without subtracting the header outside it. Scroll/resize listeners refresh
the measurement and are removed on close, low state, shell exit and unmount.
The scene DOM and hd-scene.js are unchanged. Its existing ResizeObserver
continues to resize the canvas. No backdrop was added, the dock stacking order
is unchanged, and 46%, follow behavior and the desktop column rule are unchanged.

## Browser proof

CHROMIUM_PATH=/usr/bin/chromium node tools/check-hd-pane-clear.js deploy/v6.4 --shots /tmp/hd-pane-clear-final

Result: 14/14 passed. Chromium, SwiftShader, iPhone 13 touch emulation at
390x844 and 375x667, desktop at 1440x900, reduced motion. Real first/second
presses are located through scene.pickAt. Checks cover first press selection,
second press opening, canvas clearance, projected Sacral visibility and phone
sheet restoration. Open geometry:

| Viewport | Stage top | Stage bottom | Sheet top | Clearance |
|---|---:|---:|---:|---:|
| 390x844 | 214.59 | 380.23 | 388.25 | 8.02px |
| 375x667 | 238.59 | 298.81 | 306.83 | 8.02px |

The smaller phone has only 60.22px left for the stage under the existing shell
chrome within the owner's fixed 46% share. It is clear of the sheet; that
limited reading size remains visible in the screenshot and is not a decision
to change the share.

Negative control: a temporary test copy forces the old 316px stage height.
At 390x844, canvas bottom becomes 530.59px against sheet top 388.25px.
Clearance and selected-element visibility fail; 2/5 rows pass, exit 1.
The production source and the committed gate contain no negative override.
Logs and screenshots are adjacent to this receipt.

TF6's supplied check-hd-pane-clear.js and full external QA receipt were not
present in workspace files or the fetched QA branch. The tools/ gate added
here is an independent regression, not a copy or claimed execution of TF6's
original PC1-PC14 suite. TF6 must rerun that original suite and walkthrough.

## Other verification

Passed: run-tests-node (43 passed, 12 browser-only skipped), run-fixtures,
run-module-tests (439/439), check-dead-controls, check-layer-boundary,
check-three-lifecycle (103), check-hd-study-workspace (13), check-purple-text,
and token-compare. drive-swipe passed 4/4, drive-routes 2/2, drive-cover 4/4.
Those three existing browser gates used a temporary launch wrapper selecting
/usr/bin/chromium; their source was unchanged. No full drift/H run or physical
device/screen-reader run was performed. Registration results are separate
from this targeted repair. No new independent helper review was performed.

## Compiler receipt

node tools/build-bundle.js: exit 0, 62/62 modules inlined, Google fonts.
Final app.html: 11,879,538 bytes.
index.html: 126,559 bytes.
Complete deploy/v6.4: 382 files, 25,500,268 bytes.
app/hd-study-pane.js: 11,433 bytes.
app.html SHA-256:
7a725e949cf1f10acb34aaba91b0e52de79c7aeb2c4bf3cc9564e04533242ed0
The adjacent production-manifest.txt records every shipped file's exact
uncompressed size and SHA-256. No production service was changed.
