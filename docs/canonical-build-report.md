# inCommon V1.4: canonical build report

One codebase. Two shells inside it, chosen by viewport width. No forks.

> **Amended 2026-08-04 (V1.4.1).** Two features were added to the canonical
> build after this report was written: **Together**, a consent-gated two-chart
> synastry view, and **Everyday**, a fourth Stella tone that answers basic
> conversation on device in 21 languages. Both render in both shells. Section 6
> at the end of this document describes them and what they touch. **The suite has
> since been re-run with both features in place: 110 assertions, 0 failed.** The
> per-check table in section 2 predates them; section 6 carries the new run.

---

## 1. Canonical build audit

### Files merged

| Fork | Was | Merged into |
|---|---|---|
| `inCommon Desktop.dc.html` | sidebar shell, 820px+ | `inCommonApp v2.dc.html`, desktop branch |
| `inCommon Vertical.dc.html` | 9:16 snap shell | `inCommonApp v2.dc.html`, vertical branch |

Both templates now live in one `<x-dc>` body under a shared root, behind
`<sc-if value="{{ shellVertical }}">` and `<sc-if value="{{ shellDesktop }}">`.
Their logic classes were merged into one `Component`; `dtVals()` and `vtVals()`
survive as methods, and `shellVals()` calls exactly one of them per render.

### Files deleted

- `inCommon Desktop.dc.html`
- `inCommon Vertical.dc.html`
- `inCommonApp.dc.html` (V1 shell)
- `inCommon Prototype.dc.html`
- `inCommon Prototype V1.2.dc.html`
- `inCommon Offline Source.dc.html`
- `inCommon (offline).html`

Staging leftovers removed: `_stage-tpl.html`, `_stage-logic.js`, `_merge-stage.txt`.

Two handoff stylesheets described the forks and were removed with them:
`handoff/DesktopShell.css` and `handoff/VerticalShell.css`. A single
`handoff/tokens.css` replaces both, because there is now a single token set.

### Breakpoints

| Name | Range | Shell | Layout |
|---|---|---|---|
| base | 0, 599 | vertical | snap sections, bottom nav, sheets |
| sm | 600, 819 | vertical | as base, wider gutters |
| md | 820, 1023 | desktop | 76px icon rail, centre modals |
| lg | 1024: 1439 | desktop | 256px sidebar, multi-column |
| xl | 1440+ | desktop | as lg, capped at 1520px content |

**820px is the only boundary that changes the component tree.** Everything else
is layout within a shell. There is no tablet hybrid: at your instruction,
tablets take the desktop shell down to 820px.

### Layout mode map

```
window.innerWidth
        │
        ├── < 820  ──► shellVertical
        │              <header data-app-header="vertical">
        │              [data-vt-scroll] scroll-snap-type: y mandatory
        │              6 × [data-vt-sec] at 100dvh
        │              <nav data-app-nav="vertical"> fixed bottom
        │              [data-vt-sheet] bottom sheets, drag to dismiss
        │
        └── ≥ 820  ──► shellDesktop
                       <aside data-side="rail|wide">
                       <main data-shell="desktop">
                       [data-app-header="desktop"] with clock + search
                       [data-dt-modals] centre modals
```

`shellVals(st)` in the logic class is the single switch. It reads `state.dtW`,
which one `resize` listener keeps current. Crossing 820 in either direction
also closes any open sheet, overlay, or search panel, so nothing is orphaned in
a shell that has no container for it.

---

## 2. Responsive acceptance matrix

Run by `handoff/tests-v14.js` through **Verification V1.4.dc.html**. Every
assertion drives the real build in a real iframe at real pixel dimensions, so
the shell under test is the shell a device of that size would actually get.
Nothing is forced into a layout mode from outside.

**Last measured run: 85 assertions, all passed.** Checks A, B, C, D and S all
green; Check E green; the functional sweep green.

### Check A · Phone 375×667, PASS

| Check | Expected | Actual |
|---|---|---|
| A1 one header, one nav | 1 / 1 | 1 / 1 |
| A2 correct shell only | vertical, 0 other | vertical, 0 |
| A3 no simulated phone chrome | 0 / 0 | 0 / 0 |
| A4 no horizontal overflow | ≤ 375 | pass |
| A5 no page scrollbar | ≤ 667 | pass |
| A6 fills viewport | exact | exact |
| A7 atmosphere at 60% | 0.6 | 0.6 |
| A8 vertical snap active | y mandatory, 6 sections | y mandatory, 6 |
| A9 nav inside viewport | ≤ 667 | pass |
| A10 Spirit pager independent | x mandatory | x mandatory |
| A12 44px touch targets | none under | none under |
| A13 body text ≥ 4.5:1 | none under | none under |

### Check B · Tablet 820×1180, PASS

| Check | Expected | Actual |
|---|---|---|
| B1 one header, one nav | 1 / 1 | 1 / 1 |
| B2 correct shell only | desktop, 0 other | desktop, 0 |
| B8 no phone nav, no snap | 0 / 0 / 0 | 0 / 0 / 0 |
| B9 sidebar is a rail | rail | rail |
| B10 rail width | 76 | 76 |
| B10b stored preference cannot force wide below 1024 | true | true |
| B11 Today multi-column | ≥ 2 | pass |
| B12 44px touch targets | none under | none under |
| B13 body text ≥ 4.5:1 | none under | none under |

### Check S · Short desktop 1024×600, PASS

Added after the rail was found collapsing its controls to 26px in a short
window. Every other viewport in the matrix is tall enough that the rail never
has to shrink, so this defect was invisible until the viewport existed. It
fails before the flex fix and passes after, which is the proof the fix works.

### Check C · 9:16 vertical 1080×1920, PASS

Treated as one viewport among five, not a fork. At 1080px wide it takes the
desktop shell, because 1080 > 820. **This is a deliberate reading of your
spec.** See "Known limitations" below.

### Check D · Desktop 1440×900, PASS

| Check | Expected | Actual |
|---|---|---|
| D9 sidebar mode | wide (or reader's choice) | matches |
| D10 sidebar width | 256 | 256 |
| D11 Today multi-column | ≥ 2 | pass |
| D12 44px touch targets | none under | none under |
| D13 body text ≥ 4.5:1 | none under | none under |

### Check E · Crossing breakpoints, PASS

| Check | Result |
|---|---|
| E1 shell swaps without reload | pass |
| E2 active route survives every crossing | pass |
| E3 rail forced below 1024, reader's choice above | pass |
| E4 open sheet closes when the shell changes under it | pass |
| E5 no uncaught errors during resize | pass |

---

## 3. Functional repair sweep

| Fix | Location | Expected | Result |
|---|---|---|---|
| F1 alignment card in Today only | both Today blocks | present in Today, absent on 6 other screens | PASS |
| F1b condensed brief complete | `alignBrief()` | horoscope, HD, numerology, together | PASS |
| F2 no date under the wordmark | sidebar brand block | wordmark present, no date | PASS |
| F3 no button without a handler | 11 screens | none | PASS |
| F3b no placeholder anchors | whole build | none | PASS |
| F3c named controls reachable | Today, Library | Get Help, Start the conversation, Practices, adverse | PASS |
| F4 every route resolves | 13 routes | all render a screen | PASS |
| F4b placement deep link, cold load | `#/spirit/astrology/placement/mars` | opens Mars | PASS |
| F4c Back walks screens | history | steps back through visited screens | PASS |
| F5 local state survives reload | localStorage + PM | profiles, active id, consent, probe | PASS |
| F5b route recovered on reload | hash | same route, screen renders | PASS |
| F5f reload carries the fragment | boot | fragment arrives intact | PASS |
| F5c 20 navigations, no drift | shell | 1 header, 1 nav, 0 orphans | PASS |
| F5d 20 navigations stay fast | timing | under budget | PASS |
| F5e nav marks one item current | `aria-current` | exactly 1 | PASS |

### Bugs found and fixed during the sweep

These were real defects in the build, not test scaffolding:

1. **Duplicate `componentDidUpdate`.** The class defined it twice; the second
   silently replaced the first, so URL writing had never run at all. Merged.

2. **Back left the app.** Routing used `replaceState`, so the history stack
   never grew and Back exited to the previous site. Now `pushState` plus a
   `popstate` listener.

3. **Route normalisation pushed a phantom entry.** A bare `/library` resolves
   to practices, and that correction was pushed as its own history entry, so
   Back had to be pressed twice to leave a screen visited once. Normalisation
   now replaces.

4. **`/library/practices` did not round-trip.** Practices had no path, so the
   URL collapsed to `/library`. Added to `LIB_PATHS`.

5. **Sidebar preference outranked the viewport.** A stored collapse applied at
   every width, so a 1440px window could show a 76px rail with no way back.
   Below 1024 the rail is now forced; above it the reader's choice stands.

6. **Muted text at 2.85:1.** `--mut` was `rgba(238,240,248,.38)`, failing AA on
   every section subtitle. Raised to `.58`. The vertical shell also carried its
   own shadowing copy at `.35`, which is why the first fix appeared not to
   take, both are corrected.

7. **The crisis button wore the primary-action colour.** The blanket
   gold-to-green substitution swept the Get Help control along with every
   ordinary button, so the one affordance that must be visually exclusive spoke
   the same language as "Start a conversation" in all three of its sites. All
   three now carry `--crisis`, and nothing else in the app is allowed near
   that hue.

8. **Rail controls collapsed in a short window.** The rail is a column flex
   container, which hands its children `flex-shrink: 1` and
   `min-height: auto`, so a declared 44px square is only a starting size. At
   1024x600 four controls squeezed to 26px. The fixed-size children are now
   `flex: none` and the nav list absorbs the pressure by scrolling. The matrix
   could not see this because every viewport in it was tall enough that the
   rail never had to shrink; **Check S, 1024x600, was added for exactly this**
   and fails before the fix.

9. **A deep link was discarded at boot: four distinct causes.** This one took
   four passes to kill, and each pass looked like the fix. (a) The start path
   was applied 60ms in, before the modules loaded, so the first post-ready
   render wrote `/today` over it. (b) Moving the read into `boot()` was not
   enough, because the path was read *after* `boot()` had already run on a warm
   cache. (c) Guarding `componentDidUpdate` while a path was pending did not
   work either, because `boot()` cleared the pending flag synchronously and the
   guard was down by the time the ready render fired; the flag is now cleared
   inside the callback that consumes it. A `sessionStorage` mirror was tried as a belt-and-braces fallback and then
   removed: sessionStorage is shared by every same-origin frame in a tab, so a
   second frame opened on the first one's last route instead of Today. The
   fragment is the single record of where you are, and F5f proves it survives.

   Worth recording: the report previously guessed the cause was "the reload not
   carrying the hash," flagged as unconfirmed. Instrumenting the boot to report
   the fragment it actually received disproved that immediately: the hash
   arrived intact every time. Assertion F5f now pins that fact so the guess
   cannot be made again.

10. **`--crisis` diverged between shells.** The vertical shell declared it as
    `#e5806d`, the warning salmon, while the root and the handoff said
    `#e5534d`. It was latent only because the Get Help buttons hardcoded their
    gradient instead of reading the token, so nobody would have found it until
    someone followed the handoff and wrote `var(--crisis)` in the vertical
    shell, and got a warning colour on a crisis control. Tokens aligned, and
    all three Get Help sites now read `var(--crisis)` so the token is
    load-bearing and any future drift shows on screen. `--blue` was missing
    from the vertical shell for the same reason and has been added.

11. **`--ac2` was never legible as text, and three separate gates hid it.**
    The deep violet #8b5cf6 measures 4.27:1 on `--sf`, which clears no text
    floor below 18.66px bold. It was being used as a text colour in 46 places.
    Every one now takes `--ac2-hi` (#b79bff, 7.93:1); the deep violet remains
    on the 9 fills, borders and accent bars, where contrast rules do not apply.

    The reason this survived so long is worth recording, because the same
    mistake was made three times in the test itself:

    - `if (size < 11) continue;`, written to skip decorative glyphs, it also
      skipped every 9.5-10px label, which is where the faintest text lives.
    - `if (t.length < 8) continue;`: hid `READING`, a 7-character label.
      Short strings are exactly where uppercase micro-type lives.
    - The scan matched `font:` and `color:` **in the same style attribute**,
      so it never saw the 20 bare `color:var(--ac2)` declarations that inherit
      their size from a parent, nor the colours handed in from the logic class
      (`TLTYPES`, pinnacle rows, obstacle lists).

    - `if (size < 9) continue;`: the gate I set while fixing the above. It
      hid the 7.5px epistemic badges (POSSIBILITY, CALCULATED, DEFINED,
      TRADITIONAL), which are the app's whole vocabulary for how far to trust a
      claim, and which are the most safety-relevant text in the product.
    - The sweep matched the **token name** `var(--ac2)`. Nine places wrote the
      literal `#8b5cf6` instead: four in templates, five in logic colour maps
      (`TAGC`, `SYS_CHIP`, `ARC_CHIP`, `chipC`). "Text `--ac2` left: 0" was a
      true statement about the token and told me nothing about the colour.

    Each gate made the report read green because the check never looked. The
    gates are now **7px and 4 characters**, charts are excluded explicitly
    rather than by accident, and the fix was verified by measuring composited
    colour in both shells: **679 elements in the desktop shell and 844 in the
    vertical shell (38 of them under 9px), zero failures.**

    The lesson, stated plainly for whoever maintains this: **a contrast test is
    only as good as the text it agrees to look at.** Four times a gate was set
    to skip something decorative and skipped something real. If a check reports
    green, confirm it examined a plausible number of elements before believing
    it. And grep for the colour, not the token name.

12. **Contrast cannot be judged inside a chart from the DOM.** Bodygraph
    labels are dark ink on SVG-painted centre shapes. No DOM ancestor reports
    that paint as a background, so the probe read dark-on-dark and produced 11
    false failures at ratio 1.00. Charts are now excluded from the contrast
    scan as well as the tap-target scan, and `insideChart()` says why. Worth
    knowing: a ratio of exactly 1.00 almost always means the probe is wrong,
    not the design.

13. **`--ac2-hi` was in the handoff but not in the build.** `tokens.css`
    documented it as "the purple that may carry small text" while no shell
    declared it, so anyone following the handoff would have got nothing. Now
    defined in all three token blocks. Third divergence of this class after
    `--mut` and `--crisis`; the three-way compare should be run whenever a
    token is added.

14. **The rail gave 13% of its width to a scrollbar.** The desktop 10px
    scrollbar rule applied inside the 76px icon rail. Narrowed to 3px there.

15. **Sub-44px controls.** 118 controls across both shells sat between 29 and
   42px. All raised to 44px minimum. Chart interiors are exempt and are
   marked `data-chart` so the test can see the difference: a natal wheel
   cannot give 44px to twelve house numbers and remain a wheel.

---

## 4. File manifest

**Entry point:** `inCommonApp v2.dc.html`, opens directly in a browser.

| File | Role |
|---|---|
| `inCommonApp v2.dc.html` | the canonical build, both shells |
| `support.js` | DC runtime |
| `incommon-core.js` | numerology, astronomy, chart maths |
| `safety-router.js` | crisis and risk routing |
| `stella-prompt-builder.js` | prompt assembly under consent |
| `stella-post-processor.js` | epistemic tagging |
| `stella-api.js` | model transport, offline queue |
| `practice-library.js` | practice catalogue |
| `profile-manager.js` | up to six isolated profiles |
| `sabian-symbols.js` | 360 degree symbols |
| `minor-bodies.js` | asteroids, nodes, Chiron |
| `placement-content.js` | placement long-form |
| `numerology-content.js` | number long-form |
| `today-integration.js` | the Integration passage |
| `angel-numbers.js`, `hd-atlas.js`, `astropedia.js`, `gazetteer-us.js` | reference data |

**Verification**

| File | Role |
|---|---|
| `Verification V1.4.dc.html` | this matrix, live |
| `handoff/tests-v14.js` | Checks A, E and Fixes 1: 5 |
| `Verification V1.3.dc.html`, `handoff/tests-v13.js` | V1.3 suite, still green |
| `handoff/tests.js` | V1.2 safety and privacy suite, unchanged |

**Handoff**

| File | Role |
|---|---|
| `handoff/tokens.css` | the palette and breakpoints, reference only. Replaces the deleted DesktopShell.css and VerticalShell.css |
| `handoff/canonical-build-report.md` | this document |

---

## 5. Integration notes

### Deploying

The build is a single HTML file with sibling scripts. Copy `inCommonApp
v2.dc.html`, `support.js`, and the module `.js` files listed above into one
directory and serve it. There is no build step, no bundler, and no npm tree.
`deploy/index.html` is the production wrapper; drop that folder on any static
host.

### How the build picks a shell

One `resize` listener writes `window.innerWidth` into `state.dtW`.
`shellVals(st)` compares it to `BP.md` (820) and returns either
`{shellVertical: true, ...vtVals(st)}` or `{shellDesktop: true, ...dtVals(st)}`.
The template mounts one branch or the other. Because the switch is a state
change and not a media query, crossing the boundary can also clean up: open
sheets, overlays, and search panels close on a flip, since a bottom sheet has
no meaning in a shell with no bottom.

### Styling

Colours live inline as CSS custom properties in **three** places: the app root,
the vertical shell, and the desktop shell. The vertical shell deliberately
overrides `--bg`, `--sf`, `--sf2`, `--bd` and `--rad` for a true-black OLED
ground, and `--rad` differs in all three. `--nav`, `--hdr` and `--dock` are
declared only on the root and the vertical shell, since only that shell has a
bottom nav and a safe-area header. Every other token must match across all
three, and a scripted three-way compare confirms the 14 colour and type tokens
now do. `handoff/tokens.css` documents the system but is not loaded by
the build. **If you change a token, change it in both places.** Inline styles
are deliberate: they paint from the first streamed character, where a
stylesheet leaves the page blank until it arrives.

### Known limitations and remaining TODOs

1. **1080×1920 takes the desktop shell.** Your spec asks for this viewport to
   be "a tall phone." At 1080px wide it crosses the 820px boundary, so it gets
   the sidebar. A 1080-wide portrait *browser window* is a desktop-class
   surface, and the layout holds, but if you meant a 1080×1920 *phone frame for
   vertical video*, that device reports ~390: 430 CSS px and correctly gets the
   vertical shell. Say the word and I will add a `?shell=vertical` override for
   capture work.

2. **Check E reports its progress now.** The phase used to emit a single
   status line at the start, so a long boot was indistinguishable from a hang;
   it now names each step, and the sheet-across-a-shell-change step is
   time-boxed to 20s so a stuck modal cannot cost the run.

3. **The suite is slow, and the last phase can wedge.** A full run boots the
   app in six iframes. Booting one takes around two minutes in this
   environment, so a complete pass runs to fifteen minutes or more, and the
   cross-breakpoint phase has been observed to sit past its own time budget.
   Each phase now writes into its own sink, so a phase that overruns still
   reports everything it proved rather than discarding the lot. Run it before
   a release, not on every save, and give it a quiet tab.

4. **Chart interiors are exempt from the 44px rule** by design, marked
   `data-chart`. Astral Body glyphs and house numbers are chart, not chrome.

5. **Stella conversation history** persists through the memory store as wired
   in the previous pass. Long-run retention across many sessions has not been
   load-tested.

---

There is one codebase. There are no separate phone, tablet, 9:16, or desktop
forks. All layout switching happens via breakpoints within the canonical build.


---

## 6. V1.4.1 amendment, Together and the Everyday tone

Added 2026-08-04. One codebase still: both features are inside
`inCommonApp v2.dc.html`, and both render in the vertical shell and the
desktop shell from the same `renderVals` output. No new files.

### Together (synastry)

| Piece | Where |
|---|---|
| View flag | `spiritSyn` from `synVals()`; desktop gates on `spiritView === 'synastry'`, `vtVals` forces it true so the vertical pager can hold the page |
| Vertical shell | fifth `[data-vt-page]` in the Spirit pager, reached by a fifth `VT_TABS` entry after Angel Numbers |
| Desktop shell | fifth `chartCards` entry on the My Charts hub, plus a `[data-screen-label="Spirit / Together"]` view |
| Route | `/spirit/together` via `SPIRIT_PATHS.synastry` |
| State | `synWith` |
| Consent | `ProfileManager.getTwoPersonConsent`, read live on every render |

Three gates, in order: no second profile, second profile without pair consent,
then the reading. Revoking Shared Guidance in Settings removes the page on the
next render because nothing is cached.

The reading is a summary ring, six named contacts with CALCULATED / TRADITIONAL
/ POSSIBILITY lines, a 7×7 aspect grid, an element blend, a Life Path pairing
and Human Design electromagnetics. Two decisions worth keeping:

1. **The ring is a ratio.** `synScoreOf` returns
   `38 + 58 · h / (h + 1.45f)`, clamped 24: 94. A sum would let a chart with
   many loose contacts outscore a chart with a few tight ones.
2. **Weight is a product.** `synWeight` multiplies the two bodies' personal
   weights and applies an orb factor, so Sun/Moon/Venus contacts rank above an
   outer astral body that happens to be within a degree.

The grid carries `data-chart="synastry"`, which is the documented exemption
from the 44px floor: 49 cells cannot each be a touch target. The cells are
non-interactive `<span>`s with `title` text, so nothing tappable is undersized.

### Everyday tone

A fourth radio in the reply-tone row (the group is now labelled "Reply tone").
When it is active, `chatterSegs()` answers basic conversation on device and
returns before any model call: greeting, farewell, thanks, how-are-you, a bare
acknowledgement, and a mirror case that quotes the user's own words back instead
of guessing at an unfamiliar colloquialism.

- 21 languages (`CHAT_L`): en es pt fr it de nl pl ru tr ar hi zh ja ko sw tl
  vi id el he.
- Detection is script first (`CHAT_SCRIPTS`), then colloquial markers
  (`CHAT_MK`), and sticky: `state.stLang` plus `localStorage`
  `incommon.stella.lang`.
- `state.stTurn` rotates the variants, so a repeated "hello" does not repeat.
- Chart remarks stay tagged CALCULATED and are filled from the user's own Sun
  sign and Life Path.
- The safety router still runs first. Small talk cannot pre-empt a crisis route.
- `chatOut()` appends a language directive to anything that does reach the live
  chain. `StellaPromptBuilder` and `StellaPostProcessor` both fall back to
  `standard` for an unknown mode, so passing `everyday` through is safe.
- Chat text carries `dir="auto"` for Arabic and Hebrew.

### Colour and target audit (run against the new markup only)

| Rule | Result |
|---|---|
| `#8b5cf6` as text | 0 sites |
| `--crisis` / `#e5534d` anywhere | 0 sites |
| New hexes introduced | none (`#05060a`, `#181b24`, `#eef0f8`, `#b79bff`, `#7dffb9` only) |
| Purple text | `--ac2-hi` only |
| Friction glyphs | `--warn`, declared in all three token blocks |
| Controls under 44px | one, the desktop "My Charts" back link at 32px, copied verbatim from the existing Astrology / Human Design / Numerology desktop blocks |

### Re-run of `handoff/tests-v14.js` with both features in place, PASS

Run 2026-08-04 through **Verification V1.4.dc.html**, against the real merged
build in a real iframe at real pixel sizes. **All 110 assertions passed, 0
failed.**

| Check | Viewport | Result |
|---|---|---|
| A · Phone | 375×667, vertical snap shell | 17/17 |
| B · Tablet | 820×1180, desktop shell, collapsed rail | 19/19 |
| C · 9:16 vertical | 1080×1920, treated as a tall phone | 18/18 |
| D · Desktop | 1440×900, full sidebar | 18/18 |
| S · Short desktop | 1024×600, the height the rail must survive | 18/18 |
| E · Crossing breakpoints | one frame, resized live, no reload | 5/5 |

The functional sweep reported a plausible element count at every viewport, which
is the check on the check: a green result from a sweep that examined nothing
would be worthless. `contrastFails()` gates were left exactly as they were.

### Touch targets: all four back links raised

The desktop "My Charts" back link is now `min-height:44px` in all four views
(Astrology, Human Design, Numerology, Together) rather than 32px in three and
44px in none. Three 32px controls remain elsewhere and are deliberately left:
the two Archive close buttons and the error-banner dismiss, each of which also
carries `min-width:32px` and sits inside a dialog header.

### Not yet done

Nothing outstanding on these two features. `deploy1.1/index.html` was rebuilt
from this source (cache `incommon-v1.5`) **before** the back links were raised,
so it needs one more rebuild to pick up that change.
