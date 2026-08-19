# c. verification

> **Note added during migration.** The text below is the handover document,
> kept as written. Two things differ in this repository. The harness files are
> in `app/` rather than `b. app/`, for the same reason the note gives: the
> runner loads the app by relative path. And `run-tests-node.js` is not here,
> because it requires `handoff/tests.js`, which was not in the handover. Its
> place is taken by `run-fixtures.js`, which covers N1 to N6 and A1 to A3 from
> the fixtures and says so in its own output. That is narrower coverage than
> the suite this note assumes, deliberately and visibly.

The harness is the contract. 206 assertions, and they are the reason a
refactor of this app is safe to attempt at all.

**The files live in `b. app/`**, not here, because the runner loads the app
by relative path and both must share a directory. Here you get the node
runner, the fixtures and this note.

## Running it

Serve `b. app/` and open `Verification V1.4.dc.html`. It starts on load and
takes **25+ minutes**: it boots the real app in real iframes at real pixel
sizes, ten phases deep. Watch the pass and fail counters at the top.

`Verification R - removal phase.dc.html` runs group R alone in about a
minute, which is the fast smoke test.

## The phases

    A B C D S   the same acceptance matrix at five viewport sizes
    E           one frame resized live, asserting the app survives the change
    F           the functional repair sweep, fixes 1 to 5
    T           every theme identity, plain and hardened, at two widths
    R           what V1.6.0 removed, asserted absent, and the crisis
                controls asserted present
    G           the fifteen ADA gaps, each driven rather than read off an
                attribute

## Things that have bitten, and are written into the harness

- **A phase must own its frame, its budget and a group key.** Theme rows once
  rode at the tail of another phase and were silently cut when it overran:
  they did not fail, they vanished, and the total read 108 instead of 134.
- **Cache-busting is load bearing.** The build registers a service worker, so
  a frame can be handed a precached older bundle and the phase then grades a
  build that is not on disk. That happened, and it read exactly like a pass.
- **The gates inside `contrastFails()` are load bearing.** Both have been
  set too loose at some point and each time hid a real failure. If a check
  reports green, confirm it examined a plausible number of elements first.
- **A fixed sleep is not a wait.** The runtime commits conditional bodies a
  tick or more after the app reports ready, so five rows once reported a
  missing first-run screen on a build where it was present and correct.
- **`sleep()` runs off a Worker clock**, not `setTimeout`. A hidden tab
  clamps timeout chains to roughly one a minute and a full run would never
  finish in the background.

`run-tests-node.js` and `calculation-fixtures.json` check the calculation
layer headlessly, which is the part worth wiring into CI first.
