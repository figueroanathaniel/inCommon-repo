# v6.2 worklog: the verification pass

Run 8 September 2026, against `incommon-v6.2`. No source file was changed in
this pass. It is a verification record: what was run, what it said, and the one
environmental fact that had been reading as a build defect.

`docs/worklog-v6.1.md` closed with G at 31 of 33 and no H row at all. Both are
addressed here, and one of them is now closed for the first time.

---

## What is actually deployed

The version stamp and the bundle folder are the same number by rule, and that
rule only holds if the bytes on the CDN are the bytes on disk. They are, for the
app:

| file | built | served |
|---|---|---|
| `app.html` | 10,332,911 bytes, sha `30d88cb7b31c9946`, `incommon-v6.2` | identical |
| `index.html` (cover) | 50,056 bytes, sha `efed1ccce2714977`, `incommon-v6.2` | 50,586 bytes, sha `14f844510243fdb5` |

**The app passes. The cover is 530 bytes larger than what was built**, and
`check-deployed` calls that a FAIL, correctly. The cause is the host rather than
the build: Netlify is injecting a hosting comment and two meta tags, and its
pretty URL asset optimization rewrites the arrow's `href="./app.html"` into a
bare `/app`. That rewrite happens to resolve, because `_redirects` sends `/app`
to the bundle, so the cover works and the deep links work. It is still a file
nobody in this repo wrote.

**The checker was not weakened to accommodate it**, and it should not be. Its
whole reason to exist is that a version stamp is a label and only a hash is
evidence, and this is exactly the case it was built for: same stamp, different
bytes. The fix is two toggles in the Netlify dashboard, asset optimization and
the hosting snippet, which is outside this repo. Until that is done the deploy
check is red on the cover by design and green on the app, and that split is the
useful reading rather than a number to be quieted.

---

## The twelve local gates

All twelve exit 0 against the working tree.

| gate | result |
|---|---|
| `run-module-tests` | 246/246, across eleven modules |
| `run-tests-node` | 43/43 |
| `run-fixtures` | 9/9 |
| `check-purple-text` | clean, `#b79bff` used 14 times |
| `check-dead-controls` | 35 dialogs, level matched across both shells |
| `token-compare` | 41 tokens, all three sites agree where they must |
| `check-competitor-surface` | 0 findings |
| `check-layer-boundary` | 1,368 string literals in mechanics, prose only where PROSE declares it |
| `check-aspect-text` | 2,100 synastry closers, all distinct |
| `check-chart-tone` | luminaries decide, in both directions |
| `check-prose-repeats` | 0 over the cap of 3 |
| `check-hd-atlas-map` | every value resolves to a real section |

`bench-ephemeris` and `check-deployed` are not gates and are not counted here.
`tools/` holds eighteen scripts now: twelve gates, four generators, and those
two. CLAUDE.md still says thirteen and eight, which was true before
`check-aspect-text`, `check-chart-tone`, `check-prose-repeats` and
`check-hd-atlas-map` arrived. That paragraph wants correcting.

---

## All eight phases, against v6.2

| Phase | Result | Cost | Guard |
|---|---|---|---|
| M acceptance matrix | 90/90 | 46.5s | all 5 viewports reached the last row (A:17 B:19 C:18 D:18 S:18) |
| F functional sweep | 16/16 | 51.5s | 16 arrived against 16 declared |
| T theme | 64/64 | 29.7s | 2 widths, 87 elements, all four identities live |
| E breakpoint crossing | 5/5 | 11.1s | 5 rows returned, frame booted |
| N new surfaces | 56/56 | | 56 arrived against 56 declared |
| R removal | 14/14 | | all 14 ids present |
| G ADA | 31/33 | 47.2s | G1c and G12b focus blocked, see below |
| H cover | **17/17** | | see below |

**245 of 245 in the six phases with no environmental dependency**, plus 31 of
the 33 in G, plus all 17 in H. Every phase was started from a cleared origin
with the worker unregistered and the caches dropped, so each graded the bytes on
disk rather than a precached earlier build.

**G is 31 of 33 and that is the documented clean result here.** G1c and G12b need
a window the operating system has focused. The runner's own probe reports
`activeElement` true, `matches(":focus")` false, `hasFocus` false, which is the
pane and not the build. Nothing in this pass changed that and nothing in this
pass can. To close them, open `verification/Verification G - ada phase.dc.html`
in a real browser and click into it.

One row went red on the first G run and was not a regression. G6 reported
`emptyPolite:false`. `speak()` is a write and clear cycle costing about 1660ms
against a 1900ms sample, so the margin is about 240ms, and it lost it once. Re
run from a clean origin, G6 is green. That row is a timing margin, not a build
defect, and it is worth knowing it can lose.

---

## H had never been recorded passing, and the reason was not the cover

This is the part of the pass worth keeping.

**Group H has no row in the v6.1 worklog.** That file records M, F, T, E, N and
R and stops. So there was no prior pass to regress from, and H was the one phase
in the suite whose result nobody had.

It failed at H1, repeatedly, and H1 gates the whole phase: `if (!booted) return
A;`, so a red H1 produces a run of exactly one row. The cover boots fine
standalone. WebGL is present and reports
`ANGLE (Intel, Intel(R) UHD Graphics 600 ...)`, so the GPU blocklist symptom
CLAUDE.md describes was not what this was. A fresh tab reproduced it, so it was
not context exhaustion either.

**The Claude Browser pane does not composite continuously.** An armed, self
rescheduling `requestAnimationFrame` counter recorded **0 frames in 3010ms**
with `document.visibilityState` reading `"visible"` the whole time. Frames are
produced only while a screenshot is being captured, roughly seven per capture.
That is not a throttle like the backgrounded tab clamp CLAUDE.md already warns
about for `setTimeout`. It is the compositor not running at all.

`app/cover.html` sets both of the things `coverReady` polls for from **inside**
the render loop:

    if (!live) {
      live = true;
      window.__EH_LIVE = true;
      requestAnimationFrame(() => document.body.classList.add('live'));
    }

No frames means no boot, `coverReady` times out at 20s, and the 9 second
fallback in the head has long since added `signal-lost` and faded the SIGNAL
LOST notice up. Which is the fallback working exactly as designed: from inside
the page, a renderer that has produced no frames in nine seconds is a dead
renderer, and it cannot tell the difference between a driver that gave out and a
host that is not painting.

**So the fix was pacing, not code.** Nothing in `app/`, `verification/` or
`app/handoff/` was touched. Three runs, each pumping screenshots to force
compositing:

| run | how the frames were pumped | result |
|---|---|---|
| 1 | 10 captures at 0.1 scale, a round trip after navigating | 14 of 17. H12, H15, H16 red: the exit and scroll beats never got a sustained loop |
| 2 | 23 captures, still starting a round trip after navigating | 15 of 17. H12, H15 and H16 went green, H3 and H8 red instead |
| 3 | navigate and 24 captures in the **same** batch, then 20 more | **17 of 17** |

Run 2 is the informative one. H3 asserts no SIGNAL LOST on a healthy boot and
reported `{fallback:0.71, lostClass:true}` while H1 passed, which says the cover
did boot but only after the 9 second fallback had already fired. H8 then failed
downstream of it, measuring the now visible SIGNAL LOST text at 4.26:1 against
its background. Two red rows, one cause, and the cause was that the first frame
landed on the wrong side of nine seconds.

Batching the navigation together with the first captures put frames inside that
window. H2b, the row that proves the pixel read actually happened rather than
being inferred from a first frame, reported **saw 900x640, max 207, 95.1% lit**.

**What this means for anyone running H later.** A red H1 in an automated pane is
still the environment and not the build, and CLAUDE.md already says so. What it
does not yet say is that a browser pane can report `visibilityState: "visible"`
and composite nothing, and that a phase whose boot signal is written inside a
render loop cannot pass there without frames being forced. The G runner prints a
banner for its two focus dependent rows and the H runner prints one for a missing
WebGL context. Neither covers this case, and a probe that counts rAF frames
before the phase starts would.

**One real gap in the H runner, found while doing this.** It has no declared row
count. `runF` counts, `runCross` counts, and the N runner was given a count last
pass for precisely the reason CLAUDE.md records, that a phase can fail by
vanishing rather than by going red. H's only completeness guard is its
`H-TIMEOUT` row and the H1 gate. Seventeen is the number a healthy run emits,
and it is not written down anywhere a short run would be checked against.

---

## What was not done

- **No source file was modified in this pass.** The three items below are
  identified and unstarted.
- **CLAUDE.md's `tools/` inventory is stale**, saying thirteen scripts and eight
  gates against eighteen and twelve.
- **The H runner has no declared row count**, and should have one, with the boot
  guard subtraction written beside it the way the N runner's is.
- **The Netlify toggles** that keep `check-deployed` red on the cover are a
  dashboard change, not a repo change.
