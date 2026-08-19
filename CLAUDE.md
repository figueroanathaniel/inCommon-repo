# inCommon: project rules

## One codebase
`inCommonApp v2.dc.html` is the canonical build and the only app file. Two
shells live inside it, chosen by viewport width in `shellVals()` off
`state.dtW`: vertical snap shell below 820px, desktop sidebar shell at 820px
and up. **Do not create phone / tablet / 9:16 / desktop forks.** 820px is the
only breakpoint that changes the component tree.

## Colour rules that are not negotiable
Measured against the app's own surfaces, not guessed:

| Colour | Ratio | Allowed use |
|---|---|---|
| `#8b5cf6` purple (`--ac2`) | ~4.2:1 | fills, borders, accent bars, chart glyphs. **Never text, at any size.** |
| `#b79bff` (`--ac2-hi`) | 7.93:1 | every purple text, chip, and badge |
| `#2f4fd6` cosmic blue | 3.07:1 | borders, atmosphere, glow only |
| `#7d9bff` (`--blue`) | 7.66:1 | blue text |
| `#2fff8f` (`--ac`) | high | primary actions, active nav |
| `#e5534d` (`--crisis`) | n/a | **safety controls only.** Nothing else goes near this hue. Get Help must never wear the action colour. |
| `#59b37d` (`--ok`) | n/a | success. Deliberately muted so it never reads as an action. |

When auditing colour, **grep the hex, not the token name.** A `var(--ac2)`
sweep once reported "0 remaining" while nine sites wrote the literal `#8b5cf6`
and kept failing.

## The theme boundary
Three identities plus a modifier: `midnight` (the default, today's tokens
exactly), `dawn` (warm, Petrona display), `gold` (the older gold and violet),
and a contrast modifier that hardens whichever identity is active rather than
being a fourth palette. `THEMES` and `HC_SHARED` live on the logic class;
`themeVarsFor(scope)` builds the override string for one root.

**A theme is token deltas, never style holes.** The literal midnight tokens stay
in the markup and each of the three roots ends with ONE hole that appends
overrides, so midnight paints from the first streamed character and pays nothing.
Putting a hole on painted properties (`background:{{ card }}`) leaves the app
unpainted until the stream finishes: holes cannot resolve mid-stream.

`--ac` (#2fff8f) and `--crisis` (#e5534d) are absent from every delta, so the
colour table below holds in all four combinations. Gold gets a green primary
button on purpose.

The atmosphere hue is `--atmc`, a bare RGB triplet that substitutes inside
`rgba(var(--atmc),.32)`, because that layer had the cosmic blue written out in
33 places and kept it in every theme. The glow's second lobe is `--atmc2`
(midnight `139,92,246`), separate from `--ac2` because it is atmosphere rather
than accent and moves with the identity: dawn takes it warm, gold takes it
violet. Neither triplet appears in `HC_SHARED`, so hardening never shifts the
glow. Both are asserted per identity by the T `d` rows, because a hue is painted
rather than written and no contrast sweep can see it: a midnight glow under dawn
passes every ratio and still looks wrong.

**Colour policing is part of the boundary, not an afterthought.** The first pass
shipped three identities while 186 midnight literals were still written into
template style attributes, so those surfaces stayed midnight under dawn and gold.
Grep the template zone for `#[0-9a-f]{3,8}` after any theme work: the ONLY hexes
allowed between `</helmet>` and the logic class are `#2fff8f`, `#8b5cf6`,
`#e5534d`, `#000`, `#fff`, and the three token-declaration roots themselves.
Everything else is a token. The ones that were missing:

| Token | Value | Themed? |
|---|---|---|
| `--onac` | `#05060a` | no, it is the ink ON the fixed action colour |
| `--ac-hi` | `#7dffb9` | no, it is the fixed action colour hovered |
| `--sf-g` | `#181b24` | yes, the second stop of the card gradient |
| `--chl` / `--chl2` | `#24222c` / `#1c1a23` | yes, natal wheel rings |
| `--rail1` / `--rail2` | `#0b0d13` / `#080a0f` | yes, desktop rail gradient |

`--onac` and `--ac-hi` are deliberately absent from every theme delta. They read
as ordinary dark and green, but they belong to `--ac`, which is fixed, so
theming them would break the one contrast pair the colour table guarantees.
`var()` in an SVG presentation attribute (`stroke="var(--chl)"`) resolves
correctly and is how the chart rings pick up the theme.

Theme is per profile (`incommon.theme.<id>`), inheriting the device value once
(`incommon.theme.device`) and owned independently after.

`contrastFails()` never read literal hexes: it measures what is painted, via
`getComputedStyle` and the effective background. What it lacked was coverage,
so the T rows run the same gate at the same 4.5:1 floor over each identity and
each identity hardened. 128 assertions, none relaxed, none removed.

## Tokens are declared in three places
The app root, `[data-vt]` (vertical shell), and the desktop shell. Only
`--bg`, `--sf`, `--sf2`, `--bd`, `--rad` may differ, plus `--nav`/`--hdr`/
`--dock` which the desktop shell does not declare, and the reading scale
(`--rd`, `--rdlh`, `--rd2`, `--rdlh2`, `--rdd`, `--rddlh`), where `--rdd`
is deliberately 13.5px on the phone roots and 15.5px on the desktop shell
because reading size is a function of viewport. **Everything else must
match in all three.** `--mut`, `--crisis` and `--ac2-hi` have each silently
diverged before. Run the three-way compare when adding a token.

## The accessibility boundary (V1.7.0)
Fifteen audit gaps, group G in the harness. The rules that are easy to undo:

**Announcements follow state, not handlers.** `announceChanges()` diffs
`ANNOUNCE_KEYS` so a change reached by keyboard, click or deep link announces
identically. The DC runtime calls `componentDidUpdate(prevProps)` with **no
prevState**, so a two-argument signature silently disables every announcement;
the previous values are snapshotted in `_annSnap` instead.

**There is one `componentDidUpdate` and one `componentWillUnmount`.** Both
already existed further down the class. A second definition of either does not
merge, it replaces: the duplicate `componentWillUnmount` added during this pass
would have dropped the recorder timers and every window listener on unmount.
Add to the existing method, never declare a second.

**The focus trap is driven by a MutationObserver, not by the update hook.** The
runtime commits `sc-if` bodies in a later tick than `componentDidUpdate`, so
the hook fires, finds no dialog, and the sheet that appears a frame later is
never trapped. That read as a working trap in a hand test and failed in the
app. The keydown listener is still per dialog, attached on open and removed on
close. Sheet presence in the DOM **is** open, because every sheet is behind an
`sc-if`: do not reintroduce a box measurement, a sheet caught mid animation
measures zero.

**The skip link is a button.** An `href` fragment writes to `location.hash`,
which is the router, so a conventional skip link navigates the app instead of
moving focus.

**`lang` is `state.uiLang`, seeded `en`, never `chatLangKey()`.** That key is
the language Stella was last spoken to in and it survives in storage: a device
with `ja` left in it labelled this English interface as Japanese and pointed a
screen reader at a Japanese voice. Translate the interface, then add to
`UI_LANGS`.

**Live regions are written to directly, never through state.** A setState per
announcement re-renders the whole app. Read them by re-querying: a held node
reference across re-renders is the one thing guaranteed to read the wrong text,
which is how three G6 rows failed on a working implementation.

`synBandFor(score)` is a method rather than an inline conditional because the
ring only draws with a second person on the device, and a rule that can only be
verified in one setup is a rule that quietly stops being verified.

## Touch targets
44px minimum on every control in both shells. There are exactly two exceptions,
both marked with an attribute so the tests can tell the difference, and neither
is to be widened:

`[data-chart]`: a natal wheel cannot give 44px to twelve house numbers.

`[data-skip]`: the skip link is 1x1 until focused, which is the point of it, so
it is the one control that is deliberately not a touch target. The exemption is
paid for by G1c, which focuses it and measures the box it grows to. Ten
tap-target rows failed on it before it was marked, across every viewport and
every theme, which is the gate working.

## Verification
`Verification V1.4.dc.html` runs `handoff/tests-v14.js`: Checks A to E plus S
(short desktop), the functional sweep, the theme phase, the removal phase
(group R, V1.6.0) and the ADA phase (group G, V1.7.0). 206 assertions. A full
run takes 25+ minutes.

**The theme phase runs at two widths.** `THEME_WIDTHS` is exported so G13 can
assert the coverage is still two wide. A contrast gate measured at one size is
how a palette ships a failing pair at the other. `Verification R (removal
phase).dc.html` runs group R alone in about a minute.

**`frame()` busts the cache, and must keep doing so.** The build registers a
service worker, so a harness frame can be handed a precached copy of an older
bundle: the phase then grades a build that is not on disk. That happened once
and read exactly like a passing removal (R1 said the gate was absent; the gate
was present in the file and the frame was showing V1.5.7). The buster goes in
before the hash, or a deep-link frame addresses `?v=` as part of its route.

**Each phase owns its frame, its budget and its export.** The theme rows once
rode at the tail of `runSweep` and were cut when the sweep overran its cap: they
did not fail, they vanished, and the total read 108 instead of 134. `runThemes`
is now its own export. A new phase gets its own `race()` call, and a group key in
`GROUPS`, or its rows count toward the total and render nowhere.

**The harness must never set `themeProf` to a sentinel.** `themeVals()` compares
`state.themeProf` against `themeProfId()` and reloads that profile's stored theme
when they differ, so `themeProf: 'harness'` silently clobbered every theme case
back to `incommon.theme.device`: eighteen rows measured one identity six times
and reported green. Pass `win.__incommonApp.themeProfId()`. Every T row now also
asserts which identity was live, because that is what proves the contrast and
tap rows beside it measured the palette they name.

**The gates in `contrastFails()` are load-bearing.** `size` and `t.length`
have each been set too high at some point and each time they hid a real
failure. Do not raise them to quiet a red result. If a check reports green,
confirm it examined a plausible number of elements before believing it.

## What V1.6.0 removed
Four things came out, and the removal phase asserts they stay out.

**Stella and the safety router are unwired, not deleted.** No module is loaded,
no route reaches a chat, `send()` returns with a debug note. The seams to
re-wire are the four script tags in the helmet, the conjunction in
`modulesReady()`, and `send()`/`flushOutbox()`. Remove script tags and the
`modulesReady()` conjunction in the same change or the app never boots: it gates
`ready` and the splash sits forever.

**The crisis controls are not part of that removal.** Get Help, the Yellow Pages
and the directory are safety controls, not AI. A phase built of absence checks
would happily pass a build that took them out too, so R6b asserts they are
still there.

**The account gate is one screen now.** First run is keyed on
`incommon.firstrun` and writes straight to the active profile. `piReveal` /
`piOn` / `piLabel` stayed in `authVals()` on purpose: they read as account
controls and are not, they mask birth data on the profile card.

**Epistemic tags are hidden, not unwritten.** `tagLine(tag, text)` keeps its
signature and every call site still names its claim kind; the function returns
`hasTag:false`. Four sites bypassed it and needed their own edit: `atlasBlocks`
forced `hasTag:true` back on, the angel rows printed the badge with no `sc-if`,
six literal `POSSIBILITY` spans sat in the markup, and two `sc-if`s had
`hint-placeholder-val="{{ true }}"` which would flash a badge mid-stream.

**Together is Synastry, but only the two-person feature.** The daily Together
horoscope page (the three systems read as one) keeps its name, and F1b still
asserts it on Today. `/spirit/together` is kept as an alias in `openPath()`.

## Zero em dash
No em dash or en dash anywhere: not in app copy, not in generated readings, not
in comments, not in the docs. Use a comma, a colon, or a full stop. The rule is
enforced mechanically in three places and all three have to agree: the sweep
over source, `checkVoice()` in `stella-voice-v144.js` (which builds its
detector from `String.fromCharCode(8212, 8211)` so the file can obey the rule
it enforces), and the NEVER block in the Stella system prompt.

The sweep pattern has to cover all three encodings, because two of them are
invisible to a search for the character itself: the literal character (U+2014 em,
U+2013 en), the JavaScript escape (backslash u 2014, backslash u 2013), and the
HTML entity forms (ampersand mdash or ndash semicolon, plus the decimal 8212 and
8211 and hex 2014 and 2013 numeric forms). The entity form is the one that got
missed: it renders as a dash and no literal-character grep will ever see it.
This paragraph names the code points rather than printing them, for the same
reason `checkVoice()` builds its detector from `String.fromCharCode`.

Three traps, all three hit once already: a blind find-and-replace will corrupt a
regex character class; it will silently disarm the test fixture that proves the
detector works; and a sweep scoped to a hand-listed set of files will leave the
rule false in every file nobody listed. When sweeping, cover every project
surface (the app, the sibling components, the content modules, handoff, the
docs), check any `[...]` the match lands inside, and never let a fixture lose
the character it is testing for. `deploy/` and `deploy1.1/` hold bundled
copies and regenerate from source, `uploads/` is the user's own file, and
`support.js`, `doc-page.js` and `ios-frame.jsx` are vendored scaffolding.
Those four are out of scope; everything else is in it.

## Style
Inline styles only, no stylesheets: the build paints from the first streamed
character. `handoff/tokens.css` documents the system but is not loaded.
