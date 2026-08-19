# inCommon, Project Briefing for AI Assistants

**Purpose of this file.** Attach it to a new chat with any assistant (Kimi,
ChatGPT, Claude) to bring it up to speed on inCommon in one read. It is
self-contained: everything an assistant needs to reason about the product, the
code, the constraints, and the open work, without access to the repository.

Current version: **V1.5.1** (2026-08-06). Last briefing update: 2026-08-08.

---

## 1. WHAT INCOMMON IS

A consent-first self-knowledge app combining astrology, numerology, human
design, tarot, and guided reflection. It reads a birth chart, names its
sources, and never claims to know what will happen.

It is a **local-only, offline-first** application. No cloud sync, no backend, no
network calls in normal operation. All state lives in localStorage / IndexedDB
on the device. It installs as a PWA (Add to Home Screen on iOS) and ships as a
single bundled HTML file.

**The epistemic rule is the product.** Every interpretation carries one of four
tags, and no untagged spiritual or psychological claim appears anywhere:

| Tag | Means |
|---|---|
| `[CALCULATED]` | Derived from the chart or the sky. Degrees, dates, positions. |
| `[TRADITIONAL]` | What a tradition says. Attributed, never stated as fact. |
| `[POSSIBILITY]` | A framing offered for testing, not a prediction. |
| `[SYNTHESIS]` | The app drawing the threads together. |

---

## 2. TECHNICAL SHAPE

**Framework.** Design Components (`DCLogic`), a React-class-like runtime. The
entry point and single source of truth is `inCommonApp v2.dc.html`. Logic is a
`class Component extends DCLogic` with `renderVals()` feeding a template of
`{{ dotted.path }}` holes; `<sc-for>` / `<sc-if>` handle repetition and
branching. No JSX in the template, no expressions in holes.

**Styling is inline only.** No stylesheets, no CSS classes, no design-token
files at runtime. The build paints from the first streamed character, which is
why. `handoff/tokens.css` documents the system but is never loaded.
`@font-face`, `@keyframes` and body resets live in the DC helmet.

**One codebase, one breakpoint.** Two shells live inside the one file, chosen by
viewport width in `shellVals()` off `state.dtW`: a vertical snap shell below
820px, a desktop sidebar shell at 820px and up. **There are no phone / tablet /
9:16 / desktop forks and there must never be.** 820px is the only width that
changes the component tree. A feature added to a shared array (e.g.
`chartFeatures`) reaches both shells from one insertion: that is the whole
point of the rule.

**Distribution.** `deploy1.1/` holds the bundled build: `index.html` (~1.6 MB
self-contained), `sw.js` (cache-first for local modules, stale-while-revalidate
for Google Fonts), `manifest.json`, icons, splash.

---

## 3. THE COLOUR RULES, NON-NEGOTIABLE

Measured against the app's own surfaces, not guessed.

| Colour | Contrast | Allowed use |
|---|---|---|
| `#8b5cf6` purple (`--ac2`) | ~4.2:1 | Fills, borders, accent bars, chart glyphs. **Never text, at any size.** |
| `#b79bff` (`--ac2-hi`) | 7.93:1 | Every purple text, chip, badge. |
| `#2f4fd6` cosmic blue | 3.07:1 | Borders, atmosphere, glow only. |
| `#7d9bff` (`--blue`) | 7.66:1 | Blue text. Also the angles on the wheel. |
| `#2fff8f` (`--ac`) | high | Primary actions, active nav. |
| `#e5534d` (`--crisis`) | n/a | **Safety controls only.** Nothing else goes near this hue. Get Help must never wear the action colour. |
| `#59b37d` (`--ok`) | n/a | Success. Deliberately muted so it never reads as an action. |

**When auditing colour, grep the hex, not the token name.** A `var(--ac2)` sweep
once reported "0 remaining" while nine sites wrote the literal `#8b5cf6` and
kept failing.

**Tokens are declared in three places**: the app root, `[data-vt]` (vertical
shell), and the desktop shell. Only `--bg`, `--sf`, `--sf2`, `--bd`, `--rad` may
differ, plus `--nav`/`--hdr`/`--dock` which the desktop shell does not declare.
Everything else must match in all three. `--mut`, `--crisis` and `--ac2-hi` have
each silently diverged before. Run the three-way compare when adding a token.

### Wider design system
```
Background        #0d0c11        Card surface   #17151e -> #1a1922
Raised surface    #201d2a        Border         rgba(211,173,110,.16)
Text primary      #e8e6ee        Text secondary rgba(232,230,238,.55)
Accent gold       #d3ad6e        Accent violet  #a98fd6
Display font      Marcellus, serif      (--fd)
Body font         Newsreader, Georgia   (--fb)
UI font           Karla, system-ui      (--fu)
Radius            18px cards, 12px inner, 999px buttons
Motion            .2s ease out, .3s ease in. Nothing hurries.
```

---

## 4. TOUCH TARGETS

44px minimum on every control, in both shells. The single exception is anything
inside `[data-chart]`: a natal wheel cannot give 44px to twelve house numbers,
and a 7x7 synastry grid cannot give it to 49 cells. Charts carry that attribute
so the tests can tell the difference.

Dialog-header icon buttons (close, dismiss) intentionally remain at 32px as
secondary chrome. There are three: two Archive close buttons and the error
banner dismiss.

---

## 5. VOICE

Scholarly and unhurried. **Never the vocabulary of machinery**: no calculate,
compute, algorithm, data, process, system, function, output, input, variable,
parameter. Use instead: reveals, shows, speaks, suggests, indicates, points
toward, unfolds, emerges, dwells in, carries the quality of, holds the memory
of.

**No em dashes anywhere in generated content.** Use a period, a comma, or a
colon.

**Attribute once, then speak.** Name the system one time, then describe
declaratively inside that frame: "Astrology puts your Sun in the tenth house,
and reads Scorpio there as..." The tag and the attribution carry the
epistemics; the prose does not have to. Hedging every clause after the frame is
established makes the voice mush. Hedging is not honesty.

**Time.** All astrological and numerological reckoning is standardised on
Eastern time regardless of device location. Display: "Monday, July 28, 2026 -
11:47 AM EST". The clock refreshes every 60 seconds.

---

## 6. WHAT SHIPPED, SCREEN BY SCREEN

**Today.** Greeting, Today's Alignment panel, per-tradition sections that
navigate into Spirit, Today's Transits disclosure (state persisted in
`incommon.transits.open`), EST footer.

**Spirit.** Five views.
- *My Astrology*: interactive natal wheel, placement grid, stelliums, retrograde
  panel, Important Today. Houses and angles are clickable.
- *My Human Design*: centres, channels, gates, type and authority.
- *My Numerology*: Life Path, Personal Day/Month/Year, Challenge, four
  Pinnacles, number detail pages.
- *Angel Numbers*.
- *Together*: two-chart synastry, consent gated on both sides.

**Library.** Sabian Lexicon (360 verified symbols after Marc Edmund Jones,
public domain, modified for modern sensitivity), **My Tarot** (78 cards),
Astropedia, Human Design Atlas, practices, traditions.

**Throughline.** Timeline of journal entries, mood, practices, angel-number
sightings, kept readings. The Readings filter is the tarot surface.

**Settings.** Profiles (max 6), consent, birth data, PIN, deletion, account,
mailing list.

**Account gate.** One overlay at the app root above both shells, z-index 200,
max-width 440px, works unchanged at 375 / 820 / 1440 because it never depends
on the shell around it. Five ways in: email, phone, Google, Facebook, TikTok,
ChatGPT. Entirely local: no mail is sent, no texts, no network. OAuth opens a
real popup with a real `postMessage` handshake, but falls back to inCommon's own
consent screen because a provider needs a whitelisted https redirect URI and a
client secret that cannot live in a browser. The seam is one line:
`window.INCOMMON_OAUTH[id] = {clientId, redirectUri, scope}`.

**Multi-profile.** Max 6. Active profile drives every reading. Birth-data
consent is assumed at creation; memory consent (journal, mood, conversations) is
OFF by default. PIN-gated switching and deletion.

---

## 7. THE ASSISTANT WAS REMOVED

An AI guide named **Stella** was the original centrepiece. As of V1.4.6 she is
removed from **every user-visible surface**: nav entries, the chat panel, the
snap screen, four "Ask Stella" buttons, the `/stella` route, the floating
bubble, and all copy (rewritten to speak as inCommon or in the passive).

**Internal plumbing was deliberately left untouched**: state keys
(`stellaOpen`), localStorage keys (`incommon.stella.*`), module globals
(`StellaPromptBuilder`, `StellaAPI`), memory-kind keys (`stella_conversation`),
and comments. The three script tags still load. Nothing calls them. Renaming
would be a large silent-risk refactor for zero user benefit.

Files preserved but dormant: `stella-api.js`, `stella-prompt-builder.js`,
`stella-post-processor.js`, `stella-voice-v144.js`, `safety-router.js`, plus the
voice reconciliation docs in `handoff/`.

**If an assistant is asked to restore any of this**: a mode is not wired until it
exists in all three of `stella-prompt-builder.js` (MODES), `stella-post-
processor.js` (LIMITS), and `stella-api.js` (CONFIG.models). All three fail the
same way: silently, by falling back to standard. Grep the mode name across all
three before believing it works.

---

## 8. THE ENGINES

**`incommon-core.js`**: chart reckoning. `fullChart()` = planets + EXTRA (nodes,
Chiron, asteroids) + `anglePoints()`. Angles (Ascendant, Midheaven, Descendant,
IC) exist only when birth time AND place are known.

Three deliberate exclusions around angles, each for a reason:
- `stelliums()` filters group `angle`, a stellium is a gathering of bodies, and
  the Ascendant is not a body.
- `natalAspects()` drops angle-to-angle pairs, AC always opposes DC and MC is
  square to both by construction. That is geometry, not a feature of a chart.
- the wheel glyph ring filters group `angle`: they are already labelled on the
  rim, and a second glyph would draw every angle twice.

**Retrograde.** `retroScan()` scans ±300 days at **one-day steps** and groups
contiguous runs. One day matters: Mercury's passage is about three weeks, so a
coarser step can miss a whole retrograde. Cached per calendar day (~9,600 `lonOf`
calls on first open, then free). `openStart`/`openEnd` mark runs touching a
window edge so the UI never prints a station date it cannot actually see.

**Placement pages.** Every planet, asteroid, node and angle has a page with:
House, Sign in House, Planet, Planet in House, Planet in Sign, Dignity
(conditional), Synthesis, Strengths/Challenges/Opportunities/Obstacles, Degree
Analysis, Sabian Symbol, **Aspects to this point** (tightest first, capped at 8),
**Transits here now** (tighter orbs than natal: 4/4/3/3/2 against 8/8/6/4/3,
each marked tightening or separating). Engine: `placement-content.js`.

Decan rulers follow the **Chaldean** sequence (Aries: Mars, Sun, Venus), each
with a ruler "filter" description. This is deliberate. Do not swap it for the
triplicity sequence without saying so.

**Houses.** Clickable from two surfaces: 30-degree wedge `<path>` on the wheel
(inside `[data-chart]`), and the twelve list rows (buttons, 44px). Content comes
from `PlacementContent`, never from new prose, so a house can never contradict a
planet page. Empty houses name the cusp ruler, say where that ruler sits, and
state the traditional reading that an empty house is handled without a resident
planet insisting on it.

**Today's Alignment: three modes.** `alignMode` is `today` | `shuffle` |
`custom`. The three system lines above Together always report the real day; only
the synthesis line reads the chosen pairing, with a caption naming which pairing
and why.
- *today*: live sky. Top contact within orb, Sun's gate.
- *shuffle*: one of up to ten live transits paired with one of the gates the
  transiting bodies currently occupy. Seeded off `alignSeed` so a re-render never
  swaps the reading under the reader.
- *custom*: chips for the transit and chips for the gate, both pools drawn from
  **live** positions. The reader recombines today's sky; they do not invent one.

`alignVariant()` rebuilds centre, definedCenter, natalHasGate, chan and partner
from the chosen gate before the Integration passage is built, so a custom gate
reads its real centre rather than the Sun's.

**`today-integration.js`** (`window.TodayIntegration`) is pure and testable.
`intElements(d)` feeds it **qualities, never identifiers**: aspect class and the
two bodies' energies, the centre theme, defined/borrowed ground, whether a
channel completes, day/year/blend essences, moon phase and whether it is
filling. `build()` returns context + interaction + possibility as one passage,
deduped by sentence, invitational only. Variation is seeded from the element
combination, so a state is reproducible and different states diverge.

**Synastry.** Summary ring 24 to 94 is a **ratio** of harmonious to frictional
contact weight, not a running total, so a busy chart cannot score high just for
being busy. Weight is the **product** of the two bodies' personal weights times
an orb factor, which keeps Sun/Moon/Venus contacts above an outer planet that
happens to sit close. Six named contacts, 7x7 aspect grid, element blend, Life
Path pairing, HD electromagnetics. Voice is celebratory and addressed to two
people at once. The caveat under the ring is load bearing: a number is a
summary, not a verdict.

**`tarot.js`**, UMD, no profile access, no network, same shape as
`astropedia.js` and `hd-atlas.js`.
- 78 cards. 22 Majors written individually (upright, reversed, love clause,
  finance clause, historical note, utility). 56 minors as a 14x4 table, with
  history and utility carried at the **suit** level because that is honestly
  where a minor's history lives: the suit is the old object (baton, chalice,
  sword, coin) and the rank is the number.
- `draw()` is a seeded xorshift Fisher-Yates. Seed stored in state, so a reading
  re-renders identically and a kept reading traces to the exact shuffle.
- **No card is ever described alone.** Passages are built from relations:
  adjacency (card i hands on to card i+1), first/pivot/last arc, suit weight and
  absent suits, elemental balance, orientation ratio, Major density, repeated
  numbers, court count, aces.
- Three depths: **Quick** (3 cards, 3 sentences), **Divine** (6 or 9 cards, four
  passages), **Celestial** (3 to 11 cards, seven passages plus a checkable
  prediction). Three topics: Love and Romance, Finance, General.
- Tags: draw is CALCULATED, meanings TRADITIONAL, synthesis SYNTHESIS,
  prediction POSSIBILITY.

---

## 9. THE HARD-WON LESSONS

These are failures that already happened. They repeat if forgotten.

1. **Grep the hex, not the token name.** A token sweep reported clean while nine
   sites wrote the literal colour.

2. **A mode is not wired until it exists in all three sites.** Prompt builder,
   post-processor, API config. All three fail silently by falling back.

3. **Before adding an element to a view, check whether it is already there under
   a different name.** The wheel has two label systems: `wheelHouses` (SVG
   geometry) and `wheelLabels` (HTML overlay buttons). A grep on one field name
   found the list and nothing else, so twelve dead house-number buttons sat at
   the exact point users aim for, swallowing the wedge click, while a redundant
   SVG `<text>` was added that never laid out at all. Same shape repeated for the
   ASC/DC/MC/IC rim labels: caught the second time, because the lesson stuck.

4. **A dead control is not visually distinguishable from a live one.** Nothing in
   a screenshot or an assertion shows that a button does nothing. The only way to
   find it is to click it, or to read the handler.

5. **When a feature loops over user data, spot-check the heaviest case.** The
   house sheet shipped 73% boilerplate because it was checked on houses 1, 5 and
   10, two empty, one with two bodies, so the loop never ran more than twice.
   House 4 holds four bodies: one shared sentence appeared five times. Check the
   house holding the stellium, which is also the house a user opens first.

6. **Generated prose needs a sweep, not a spot check.** The tarot weaver produced
   "A 11 card draw", "the number 7 2 times", "1 of them belong", and lowercase
   sentences spliced mid clause. Fixed with `firstSent()`, `cap()`, `artN()`,
   `wordN()`, then swept **400 seeds** across every depth, count and topic looking
   for double spaces, orphan articles, "undefined", and a lowercase letter after a
   full stop. One reading reading well says nothing about the other 400.

7. **The symptom is often a missing sentence, not an error.** `SIGN_INFO` writes
   rulers as prose ("the Sun"), body names carry no article, so a `.find()`
   silently failed for Leo and Cancer and a whole clause vanished. Nothing threw.

8. **A rebuilt bundle cannot be verified by a plain reload.** The preview caches
   `index.html`. Use `location.href = location.pathname + '?cb=' + Date.now()`
   before believing any version number read out of a rebuild. The bundle itself
   cannot be grepped: assets are stored compressed and UUID-mapped, so plaintext
   and naive base64 probes both miss. Cost of not knowing this once: a filename
   was churned to bust a cache that was never the problem.

9. **A voice reference has to be tested against the pipeline, not beside it.** Six
   gold-standard persona responses arrived and all six would have been withheld, not for tone, but for contracts the document could not see: no tags, em dashes,
   unattributed tradition claims, no SOURCES line, over the word ceiling.

10. **Update assertions when the product changes; never loosen the load-bearing
    ones.** Removing the chat composer removed the mic button, which was the
    handle three tests used on the voice sheet. It was repointed to the real
    control, not deleted, because if that block opens nothing, the following
    assertions sweep an empty DOM and report green having proved nothing.

11. **Held features do not need to ship.** Reading mode was fully wired and then
    deliberately unwired because it had no UI entry point and was unreachable code
    in a 1.6 MB bundle. Unwiring is not deletion: every artifact stayed in the
    repo.

---

## 10. VERIFICATION

`Verification V1.4.dc.html` runs `handoff/tests-v14.js`: Checks A to E plus S
(short desktop) and a functional sweep. **110 assertions**; the passing shape is
A 17/17, B 19/19, C 18/18, D 18/18, S 18/18, E 5/5, functional 15/15. A full run
takes 15+ minutes. Viewports covered: 320x568, 360x640, 375x667, 390x844,
393x873, 412x915, 430x932, 768x1024, 1080x1920, 1280x900.

**The gates in `contrastFails()` are load-bearing.** `size` and `t.length` have
each been set too high at some point and each time they hid a real failure. Do
not raise them to quiet a red result. **If a check reports green, confirm it
examined a plausible number of elements before believing it.**

---

## 11. OPEN WORK

1. **The V1.4 harness has not been re-run** against V1.5.0 (angles, Together
   modes) or V1.5.1 (tarot). The new tarot surface adds controls at 44px in both
   shells but has not been measured by Check A.
2. **`deploy1.1` still carries V1.4.9.** The bundle has not been rebuilt since.
3. **Tracked gap:** `everyday` tone is declared in none of the three mode sites.
   It falls back to standard's prompt, 140-word cap and model everywhere. Dormant
   and unreachable now that the assistant surface is gone, which lowers urgency
   without fixing it.
4. **Tracked gap (moot as written):** reading-mode discovery. There is no tone
   selector to add a fifth chip to, because there is no assistant surface at all.
   If a reading UI ever returns it starts from nothing.

---

## 12. FILE MAP

| File | Holds |
|---|---|
| `inCommonApp v2.dc.html` | **The app.** Both shells. Single source of truth. |
| `incommon-core.js` | Chart reckoning, aspects, transits, retrograde |
| `profile-manager.js` | Profiles, birth data, consent |
| `placement-content.js` | Placement page content engine |
| `numerology-content.js` | Numerology content engine |
| `tarot.js` | 78-card deck and the weaver |
| `astropedia.js` / `hd-atlas.js` | Reference libraries |
| `angel-numbers.js` | Angel number library |
| `sabian-symbols-data.js` | 360 symbols |
| `today-integration.js` | Pure integration passage builder |
| `minor-bodies-ephemeris.js` | Nodes, Chiron, asteroids |
| `gazetteer-us.js` | Birthplace lookup |
| `practice-library.js` / `memory-store.js` | Practices, local memory |
| `stella-*.js`, `safety-router.js` | Dormant. Load, never called. |
| `handoff/tests-v14.js` | The 110-assertion harness |
| `handoff/tokens.css` | Documents the system. Not loaded. |
| `web-design-system.md` | Visual governance |
| `PROJECT_MEMORY.txt` | Full versioned worklog, V1.3.1 onward |
| `deploy1.1/` | Bundled build, sw.js, manifest, icons |

---

## 13. HOW TO WORK ON THIS

- Read `PROJECT_MEMORY.txt` before changing anything. It records not just what
  was done but why, and several entries exist specifically to stop a mistake
  being made twice.
- Never fork the shell. One file, one breakpoint.
- Inline styles only.
- Every new interpretive line carries a tag.
- No em dashes in generated content.
- Add to a shared array when you want both shells to render something.
- Run the three-way token compare when adding a token.
- Spot-check generated prose at its **worst** case, and sweep seeds when the
  prose is generated from a shuffle.
- Update `PROJECT_MEMORY.txt` with a new version entry when the pass is done.
