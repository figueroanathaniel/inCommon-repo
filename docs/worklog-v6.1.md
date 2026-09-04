# v6.1 worklog: four reported faults

Pass run 3 September 2026, against `incommon-v6.1`. Four items were reported
from use. All four are fixed, verified in both shells, and in the built bundle.

`docs/v1.2-worklog.md` is not this. That file is a resume point from the V1.2
integrity pass and records what was true in July, so this pass gets its own
file rather than being appended to it.

---

## 1. Planets would not open on mobile

**Reported as** a tap on a planet glyph doing nothing on a phone.

**What it actually was.** Not touch binding, not `preventDefault`, and not a
parent drag handler. The handler was correct and fired: a synthetic click on the
glyph node set `spiritView: 'placement'` and opened the sheet, on mobile, before
any change. The fault was the size of the thing being aimed at.

The visible glyph on the wheel is not the SVG circle. It is an absolutely
positioned `<button>` from `wheelLabels`, and it was **34px**, with the degree
label beside it at **30px**, on a wheel that renders 333px wide at 375px
viewport. Missing a 34px target does not fall through to nothing: the house
`<path>` underneath carries its own `onClick`, so a near miss opened a house
panel instead of the planet. That is what "swallowed" looked like from outside.

**Fix.** Three `hit` sizes in `wheelLabels` go to 44px: the planet glyph, its
degree label, and the four angles. Sign glyphs and house numbers stay at 26px,
which is the exemption CLAUDE.md already grants (`[data-chart]`): a wheel cannot
give 44px to twelve house numbers, and 61 of the 62 wheel controls sit inside
`[data-chart]`, so no G phase row moves.

**Verified** at 375x812: all ten planets measure 44px, and a hit test at each
planet's centre followed by a click on whatever is actually topmost opens that
planet. Mars, Saturn and Pluto each landed on their own degree label, which
shares the same `openPlanet` handler, and each opened the right body.

## 2. Aspect descriptions were generic and all ended the same way

**What it actually was.** The panel's closing line was:

    'It may show up as ' + a.mean + ' meeting ' + b.mean + ', ' +
    (square || opposite ? 'usually as a cost before it becomes a strength.'
                        : 'often so smoothly you stop noticing it.')

Two strings, shared by every pair of bodies in the app. A reader who opened
three aspects read the same last line three times. There was no interpretive
paragraph at all, and nothing in the text came from the reader's own chart.

**Fix.** Three tables and one method.

- `ASP_PULL`, 21 bodies: what each one WANTS, as distinct from what `PL_MEAN`
  already says it governs. An aspect is two wants meeting at an angle.
- `ASP_PLAY`, 5 aspects: how the angle behaves in a life. Middle of the
  paragraph, never the last sentence.
- `ASP_CLOSE`, 5 aspects: each builds its sentence from **both** body names and
  **both** pull phrases, so the closer is a function of the triple and two
  triples can only collide by being the same triple.
- `aspectLines(x, houseOf, ordinal)` builds the depth paragraph from the chart
  on screen: both bodies' degree and sign, the houses they occupy and those
  houses' themes, and the orb stated as volume rather than as a number.

`houseOf` and `ordinal` are passed in rather than reached for, because both
close over the Ascendant and natal Sun of the chart being drawn.

**Verified.** `tools/check-aspect-text.js` sweeps every ordered pair at every
aspect: **2,100 closers, 2,100 distinct, zero shared last lines**, against the
400 the brief asked for. On a real chart, 33 aspects gave 33 unique closers, and
every closer is a single sentence, so there is no trailing shared clause. Real
output:

> Uranus at 17 degrees Capricorn and Neptune at 17 degrees Capricorn. Both sit
> in your 12th house, so the whole exchange happens on one ground: solitude and
> the inner room. [...] At 0.1 degrees this is one of the tightest contacts in
> your chart, so it runs most days rather than occasionally.

The gate fails on both regressions that matter: two bodies sharing a pull phrase
(named collision), and the old boilerplate being put back (419 shared closers).

## 3. Learn from Atlas did not open the Atlas

**What it actually was.** `hdAtlasTo(sec)` set `tab`, `libView` and `atlasSec`
and stopped. That is the whole journey on the desktop and none of it on the
phone, where the shell is a column of snapped sections and Library is somewhere
the reader has to be MOVED to. So the state was right and the reader was still
looking at the Spirit page they tapped from, which is exactly why opening the
Atlas by hand afterwards showed it already in the right place.

**Fix.** The section move goes in the `setState` callback, not beside it:
`vtGoSection` would otherwise chase a section the pending render has not put on
screen. `angelBack` already did this correctly and was the model.

**Verified** from the Spirit section on a phone viewport: one call moves
`vtSec` 1 to 2, sets `libView: 'hdatlas'` and `atlasSec: 'gates'`, and the
Library section lands at the top of the viewport (`scrollTop` 1624, exactly two
section heights) showing "Library / Human Design Atlas". The smooth scroll takes
about two seconds, so a check at 1.2s reports a false negative.

## 4. Log Out

**Added** to Settings in both shells, between the export card and the self help
card. `logOut()` clears `birthDate`, `birthTime` and `birthLocation` on the
active profile, removes `incommon.firstrun`, and clears the open view state so
Settings cannot be reopened onto a reading of a chart that no longer exists.

Two details that are easy to get wrong:

- The time question goes back to **unanswered**, not to no. `birth-time.js`
  separates a reader who said they do not know from one who was never asked, and
  somebody starting again is the second. Passing `timeUnknown: false` reads back
  as `timeAnswered: false`, which is that third state.
- `incommon.firstrun` is **removed**, not set false, because `authStep()` reads
  it with a false default. Removing it is what makes the birth screen the
  landing page on the next cold start as well as immediately.

**Verified.** Birth fields empty, `timeAnswered: false`, birth entry screen
shown, and after a cold reload it still lands there. Exactly one storage key
disappeared (`incommon.firstrun`); the journal entry, both theme keys, the
consent record and the profile all survived.

### The colour, and why it ended up as --warn

The brief specified `#e5534d`. CLAUDE.md reserves that hue for safety controls
only, so that red reliably means Get Help and nothing else, and putting an
account control in it teaches the reader that red is also mundane. Built as
specified first, measured clean (44px, 4.89 to 5.47 across the four identities),
and flagged. The rule won: the control wears `--warn` now, which is the token the
app already uses for destructive but not urgent, and is exactly what Delete All
wears two cards away.

It is the better result on its own terms as well. `--warn` is themed where
`--crisis` is fixed, so the control moves with the identity instead of sitting
at one red in all four, and the contrast improves in every one of them:

| Identity | with --crisis | with --warn |
|---|---|---|
| Deep Field | 5.47 | **7.98** |
| midnight | 5.47 | **7.98** |
| gold | 5.27 | **7.68** |
| dawn | 4.89 | **6.96** |

Floor is 4.5. Dawn resolves `--warn` to its own warmer value, which is the
theme boundary working as intended. Behaviour is unchanged and was re-verified
after the swap: birth cleared, time back to unanswered, birth screen shown,
one storage key gone, journal kept.

No `--crisis` remains anywhere on this control, so R6b keeps meaning what it
says: the crisis hue belongs to Get Help and the Yellow Pages alone.
---

## Gates after the pass

`run-module-tests` 246/246. `check-aspect-text`, `check-layer-boundary`,
`check-competitor-surface`, `check-purple-text`, `token-compare`,
`check-dead-controls`, `bench-ephemeris`, `run-fixtures` all green. No em or en
dash in anything touched.

Bundle rebuilt at `incommon-v6.1`, 10,300,703 bytes, 32 of 32 modules inlined,
and loaded cache busted (`?cb=`) from `deploy/v6.1/index.html`: all four fixes
confirmed present in the built artifact, not only in source.

**Phases:** see the section below. Group N has been run.

---

## Group N after the pass, and a hole found in its runner

**56 of 56 passed**, no failures, no duplicate ids, both written stores put back.
That covers the two surfaces this pass touched most: N drives the wheel and the
aspect panel rather than reading their attributes.

**The count moved, and that mattered more than the pass.** An earlier run of N in
this same session reported "All 51 assertions passed", green. The suite makes 57
distinct `t('N...')` calls and `N0` is a boot guard that only fires when the app
fails to load, so a healthy run emits **56**. The earlier run was five rows short:
the five search rows, N37 to N39, which run last. No timeout row, no `N-ERR`, no
boot guard. The phase simply ended before them and the page reported success.

I could not reconstruct why that run stopped where it did, and I am not going to
pretend otherwise. What is certain is the structural fault that let it pass
unnoticed: **the N runner never counted its rows.** `runF` counts, `runCross`
counts, and CLAUDE.md records why, because the theme rows once vanished out of
`runSweep` and the total read 108 instead of 134 and was green. N had the same
hole and had already fallen through it.

`EXPECTED = 56` is declared in the runner now, with the boot-guard subtraction
written down beside it so nobody raises the number to quiet a red result. A short
run prints, in `--crisis`:

> 56 rows arrived and the suite declares 61. Rows went MISSING rather than red,
> which is how this phase has failed before. Treat this run as void.

That line is from an actual sabotage run with `EXPECTED` set to 61, because a
guard nobody has watched fail is not yet a guard. Restored to 56, a clean run
prints "56 rows arrived against 56 declared. Nothing was cut."

**Where this leaves the suite.** M, F, T, E and N have all been re-run against
this pass and are green, and every one of them printed its own completeness
guard rather than only a pass count:

| Phase | Result | Cost | Guard |
|---|---|---|---|
| M acceptance matrix | 90/90 | 61.6s | all 5 viewports reached the last row (A:17 B:19 C:18 D:18 S:18) |
| F functional sweep | 16/16 | 70.4s | 16 arrived against 16 declared |
| T theme | 64/64 | 39.3s | all four identities live |
| E breakpoint crossing | 5/5 | 17.7s | 5 arrived, frame booted |
| N new surfaces | 56/56 | ~82s | 56 arrived against 56 declared |
| R removal | 14/14 | ~35s | R1 to R6b, all 14 ids present |

The M row counts are deliberately uneven: row 10b fires only for a desktop shell
narrower than 1024, and row 11 measures a multi column Today inside the desktop
branch, so a guard demanding uniformity would redden every healthy run.

R matters here for a reason beyond habit: R3b asserts the document loads no
oki, stella or safety-router script, and this pass added markup and methods to
the app shell. It also clears incommon.firstrun and puts it back, which it did.

**G is the only phase not current**, and it cannot be made current here. G1c and
G12b need a window the OS has focused; in an automated pane 31 of 33 is the
expected clean result, not a regression. To close it, open
`verification/Verification G - ada phase.dc.html` in a real browser and click
into it: the runner prints a red banner naming document.activeElement,
matches(":focus") and document.hasFocus(), and it disappears when focus is real.

---

# Second pass, 3 September 2026: nine reported items

All nine are done and verified in both shells and in the built bundle.

## The root cause under items 3 and 6

Both were reported as dead controls and neither was. On the vertical shell
`vtGoSection()` moved the reader between sections and never set `state.tab`, so
a reader standing in Spirit had `curTab() === 'today'`. Fifteen gates ask
`curTab()`. Most carry a `vertical ||` escape and survived; the two that did not
were exactly the two bugs:

- `numberDetailVals` gated on `curTab() === 'spirit'`, so tapping a number in
  Numerology set `spiritView: 'numberDetail'` and rendered nothing (item 3).
- `synVals` gated the same way and returned its off bag, so every control on the
  phone's Synastry page, Add a profile included, rendered with no handler (item 6).

`vtGoSection` and `vtOnScroll` now keep the tab and the section together, and
those two vals carry the `vertical ||` escape their siblings already had.

**And a second, larger version of the same fault.** `synToSettings` set
`tab: 'settings'` and left the reader looking at Spirit, 2436px away. That is
what `hdAtlasTo` did before it was fixed by hand last pass, and more than twenty
call sites have the shape. Patching them one at a time is the wrong move, so the
shell reconciles instead: `syncSectionToTab()`, called from the one
`componentDidUpdate`, moves the section when it disagrees with the tab. It
cannot ping pong with `vtOnScroll`, which sets the pair together.

## Item by item

| # | Item | Status |
|---|---|---|
| 1 | Sovereignty language in Synastry and Month Ahead | done |
| 2 | Toolbar icon routes to the section root | done |
| 3 | Numerology buttons on mobile | done, root cause above |
| 4 | Synastry deeper, varied, less objective | done, 2,100 swept |
| 5 | Back button removed from Spirit on mobile | done, 3 sites |
| 6 | Mobile Synastry Add a profile | done, root cause above |
| 7 | Prose audit and natal tone | done |
| 8 | Human Design Horoscope to Alignment | done |
| 9 | Birth time preset hh:mm | done |

**Item 1.** The synastry panel closed every contact with "never an outcome, and
it says nothing at all about whether either of you wants it", so six contacts on
a screen meant the same hedge six times. That heading is gone. "Whether it feels
like that between you is yours to say, not the chart's" is gone. One nod remains,
in the obstacles block, phrased as an observation about how charts get misused
rather than an instruction about the reader's authority.

**Item 4.** `SYN_FRAME` holds four different sentence SHAPES per aspect, chosen
by a stable hash of the two body names, so Venus square Mars always reads one way
and never the way Moon square Saturn does. 2,100 lines swept, all distinct, all
twenty frames reachable, no two opening alike.

**Item 5.** Three `spiritBack` buttons removed from the phone Spirit pages. The
desktop keeps its own, differently styled, "back to Spirit" control.

**Item 9.** Two fields with a fixed colon between them, `hh` and `mm`, numeric
keypad on both. What is stored is unchanged: one "H:MM" string that
`birth-time.js` still normalises, so the engine and the three time states are
untouched. An incomplete minute reads as invalid, which is correct.

## Item 7, finished

**The register.** `SIGN_ELEMENT`, `SIGN_MODALITY`, `TONE_WEIGHT`, `TONE_VOICE`,
`chartTone()` and `toneVoice()`. Element is counted over every placed body with
the Sun, Moon and Ascendant at weight three, because an unweighted count lets
four asteroids outvote the luminaries and hands a Cancer Sun with a Pisces Moon
a fire chart. Ties go to the Sun's own element, then the Moon's.

Wired into all four generators the brief names, verified across two readers on
the same build:

| Surface | earth reader | water reader |
|---|---|---|
| Today, the alignment close | It becomes real at the point you handle it. | Let it sit before you name it. |
| The Month Ahead, how to hold it | same | same |
| A natal aspect paragraph | same | same |
| A synastry contact, the lesson | same | same |

**The Atlas is deliberately excluded.** It says of itself that it is a reference
for the whole system, not a reading of anybody, and that it knows nothing of
your birth moment. Giving it a voice drawn from the reader's chart would
contradict the one thing it asserts about itself. That is a decision, not a
surface I ran out of time for.

**The repeat audit, which was the other half.** `tools/check-prose-repeats.js`
reduces every prose literal in the logic class to its six word sequences and
counts them across DIFFERENT strings. Six is the length where a distinctive turn
of phrase starts; four catches ordinary English and eight only catches near
duplicates. The cap is three appearances.

It found two real habits and both are fixed:

- **The privacy toast, five times identically.** "It stays private until journal
  memory is on" closed the save on a number, an animal, a third kind of
  sighting, a month reading and a dream. Somebody keeping four things in one
  sitting read the same eleven words four times. Each surface now says the same
  fact in its own words.
- **The no contact line, four times identically.** "Nothing of yours sits within
  three degrees of it" opened the transit headline, the month reading and two
  eclipse paths. Varied, with the three degree fact intact in every one.

580 prose strings, 10,703 six word phrases, nothing over the cap. Sabotaging four
toasts back to identical turns the gate red with the phrase named.

**What the register is not.** It moves a sentence and never makes a claim: the
mechanics, the houses, the orbs and the numbers are identical for every reader.
`check-chart-tone.js` fails on any voice string that asserts something about the
person reading it, which is the line between a register and a horoscope writing
itself.

**One judgement recorded rather than buried.** The content modules hold a great
deal of hand written prose, and it keeps its own voice. Retoning that per reader
would mean generating it, and generated writing is worse than written writing.
The four element voices are applied where sentences are already composed at
runtime, which is every surface the brief named.

## Two defects the new gates caught in my own work

**The synastry frames were ungrammatical and unique.** The pull phrases are
infinitives, and eleven of twenty frames dropped them into slots needing a noun:
the app rendered "agree by default about to be wanted without having to earn it"
and "opens Sam's Mercury toward to get the thought said". Every one of those
lines was distinct, so a uniqueness sweep passed them. `ASP_PULL_ING` holds the
noun form now and the gate checks fourteen preposition seams.

**The tone detector handed every tie to water.** Three luminaries at weight three
is nine and nine minor bodies at weight one is also nine, so the commonest
interesting chart is an exact tie, and a fixed alphabet order settled all of them
the same way. Ties go to the Sun's own element now, then the Moon's. The spread
check that found it also caught a biased fixture in the gate itself, which was
mine and not the app's.

## Gates and build

`run-module-tests` 246/246. Nine `tools/` gates green, including the two new
ones. No em or en dash. Bundle rebuilt at `incommon-v6.1`, 10,322,790 bytes,
loaded cache busted from `deploy/v6.1/index.html?cb=final` with all eight
completed items confirmed in the artifact.

**Not re-run:** the seven browser phases. This pass changed navigation, the
Spirit pages and the birth form, so M, F, N, R and E should all be run before
this ships. G still needs a focused window.

## All seven phases after the second pass

| Phase | Result | Cost | Guard |
|---|---|---|---|
| M acceptance matrix | 90/90 | 82.9s | all 5 viewports reached the last row |
| F functional sweep | 16/16 | 56.9s | 16 arrived against 16 declared |
| N new surfaces | 56/56 | ~84s | 56 arrived against 56 declared |
| T theme | 64/64 | 35.0s | all four identities live |
| R removal | 14/14 | ~35s | all 14 ids present |
| E breakpoint crossing | 5/5 | 13.8s | 5 arrived, frame booted |
| G ADA | 31/33 | ~60s | blocked, see below |

**One row went red and it was the rename doing its job.** F1b asserts the four
titles of the Today pager in order, and its fixture still said "Human Design
Horoscope". Item 8 renamed that page to "Alignment", so the row failed on a
correct build. The fixture is updated to "Alignment" and the row still asserts
all four titles in order, so it fails if a page goes missing or the pager loses
its order. Only the expected string moved, and it moved because a label was
deliberately renamed, not to turn a red row green.

Nothing else in 245 assertions moved, which is the useful result: this pass
rewired section and tab navigation on the phone, added a reconciler to the one
componentDidUpdate, removed three buttons from the Spirit pages and replaced the
birth time control, and M, F, N, R, E and 31 of G are unchanged by all of it.

**G is 31 of 33 and cannot be closed here.** G1c and G12b need a window the OS
has focused; the runner's own probe reported activeElement true, matches(":focus")
false, hasFocus false, which is the environment and not the build. To close them,
open the G runner in a real browser and click into it.

## Re-run after item 7: all six runnable phases, on the finished build

`check-prose-repeats` joins the gate list, so ten `tools/` gates now.

| Phase | Result | Cost | Guard |
|---|---|---|---|
| M acceptance matrix | 90/90 | 85.3s | all 5 viewports reached the last row |
| F functional sweep | 16/16 | ~57s | 16 arrived against 16 declared |
| N new surfaces | 56/56 | ~83s | 56 arrived against 56 declared |
| T theme | 64/64 | 53.5s | all four identities live |
| R removal | 14/14 | ~36s | all 14 ids present, firstrun restored |
| E breakpoint crossing | 5/5 | 26.7s | 5 arrived, frame booted |

**245 of 245 assertions, on the build that ships.** Every phase started from a
cleared origin with the worker unregistered and the caches dropped, so each
graded the bytes on disk. Nothing was carried over from an earlier run: M, T, R
and E were re-run after the tone work rather than being assumed to stand, and
they did not move.

Bundle at `incommon-v6.1`, 10,323,295 bytes.

**G is 31 of 33 and is the only thing left in this repo.** G1c and G12b need a
window the operating system has focused; the runner's own probe reports
activeElement true, matches(":focus") false, hasFocus false, which is the pane
and not the build. Open `verification/Verification G - ada phase.dc.html` in a
real browser and click into it: the red banner naming those three values
disappears when the focus is genuine, and both rows should go green.
