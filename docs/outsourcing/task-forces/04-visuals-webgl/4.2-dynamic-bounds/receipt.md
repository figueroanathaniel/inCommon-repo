# 4.2 dynamic layout bounding boxes

Date: 2026-11-02 UTC
Branch: taskforce/04-visuals-webgl
Start: 909e58ec37891fa3275697a800df36908404e675
Delivery: commit containing this receipt.
Status: architectural patch implemented; independent final QA still required.

## Architecture

HDPane.computeStageBoundaries reads rectangles supplied by the host. Its
proposed height is max(0, min(pane.top, page.bottom, viewport.bottom) minus
stage.top minus 8px). Width remains the measured host width. isValid compares
the actual measured stage.bottom against pane.top, not two assigned copies
of the same boundary. Source tests deliberately provide overlapping rectangles
and confirm the validity check reports false.

The host writes --hd-stage-height for both the WebGL frame and the readable
2D frame. Pane/page ResizeObservers, scrolling, viewport resizing and the
sheet's animation end trigger remeasurement. Observers/listeners are removed
on close, low state, shell exit, DOM replacement and app unmount. The existing
hd-scene.js ResizeObserver consumes the resized frame and updates renderer
size, camera aspect and projection. No canvas positioning or fixed pixel
header assumption is added to the renderer, and no camera-centering claim is
made. No scene DOM, network or database access is added.

The sheet's 46dvh rule, Get Help stacking, no-backdrop layout, follow setting
and desktop column behavior remain unchanged.

## Validation

The adjacent browser-check.txt records 14/14 passing browser checks on the
final production bundle. Command:

CHROMIUM_PATH=/usr/bin/chromium node tools/check-hd-pane-clear.js deploy/v6.4 --shots /tmp/hd-bounds-final

Environment: Chromium, SwiftShader, reduced motion, iPhone 13 touch emulation
at 390x844 and 375x667, desktop at 1440x900. This is the repository regression,
not TF6's original external PC1-PC14 check. Tests use real first/second presses
located through pickAt, measure actual canvas and pane bounds, and verify the
selected Sacral projection is visible. Screenshots are adjacent.

Phone measurements:
390x844: stage.bottom 380.25px, pane.top 388.25px.
375x667: stage.bottom 298.81px, pane.top 306.83px.
Both satisfy stage.bottom <= pane.top. The 375px phone still has only about
60px of stage height below its existing header within the owner's pane share.

Source/state checks: 14/14 passed, including a negative overlap check,
variable header positions and a shorter page boundary.
Module tests: 519/519 passed.
Also passed: check-three-lifecycle (103), check-dead-controls,
check-layer-boundary, token-compare and check-purple-text.
Full drift/H, normal-motion walkthrough, physical devices, screen readers,
RLS checks and live parity were not run in this pass. No helper review or
merge/deployment approval is claimed.

## Production compilation

node tools/build-bundle.js: exit 0, 63/63 modules inlined, Google fonts.
app/hd-study-pane.js: 13,114 bytes.
app.html: 11,948,903 bytes including the build header.
Complete deploy/v6.4: 382 files, 25,591,360 bytes.
app.html SHA-256:
cc279a9b6e90000b8281a69a68520075545de64aa97c2cc700e05536ab166d4b
production-manifest.txt records exact file sizes and SHA-256 hashes.
No production service was changed.
