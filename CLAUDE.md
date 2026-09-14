# inCommon: project rules

## One codebase
`inCommonApp v2.dc.html` is the canonical build and the only app file. Two
shells live inside it, chosen by viewport width in `shellVals()` off
`state.dtW`: vertical snap shell below 820px, desktop sidebar shell at 820px
and up. **Do not create phone / tablet / 9:16 / desktop forks.** 820px is the
only breakpoint that changes the component tree.

## Ephemeris architecture (V1.0.0)
**Dual-backend ephemeris system** with graceful fallback. Modules:
- `ephemeris-points.js` — Centralized point registry (17 points, single source of truth)
- `ephemeris-backend-current.js` — Fallback: existing simplified ephemeris (Kepler + analytical)
- `ephemeris-backend-swiss.js` — Primary: Swiss Ephemeris WASM (if `npm install swisseph-wasm` run)
- `ephemeris-router.js` — Orchestrator: selects backend, handles fallback transparently
- `ephemeris-integration.js` — Migration helper: eases integration into Component lifecycle
- `ephemeris-cache.js` — Optional in-memory memoization (existing, unchanged)

**Architecture**: Swiss WASM (if available) → fallback to current if unavailable.
Graceful degradation: if WASM fails to load, app auto-switches to current ephemeris.
Initialize in `Component.componentDidMount()`; clean up in `componentWillUnmount()`.

**Layering rule**: Basic chart = category 'basic' + nodes + angles (if timed).
Expanded adds asteroids + centaur. No duplication: expanded-only items link back to basic.

**No Swiss dependency at install**: optional. App works with current ephemeris alone.
To add Swiss: `npm install swisseph-wasm` (v0.1.0+, GPL-3.0).

See `app/EPHEMERIS-ARCHITECTURE.md` and `app/INTEGRATION-GUIDE.md` for full docs.

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
Four identities plus a modifier: `deepfield` (**the default**, today's tokens
exactly), `midnight` (the previous default, kept whole as a delta), `dawn`
(warm, Petrona display), `gold` (the older gold and violet), and a contrast
modifier that hardens whichever identity is active rather than being a fifth
palette. `THEMES` and `HC_SHARED` live on the logic class; `themeVarsFor(scope)`
builds the override string for one root.

**The default identity is whichever one has an empty delta**, and that seat is
Deep Field now. Six places name the default key and they must agree: the
initial `themeKey` in state, `get theme()`, `themeKeyOf()`, the seed in
`themeLoad()`, the free path in `themeVarsFor()`, and the current key in
`themeVals()`. Midnight lost the seat and lost nothing else: its delta carries
the exact values the three roots held before, so selecting it returns the app
to the palette it shipped with, token for token.

**A theme is token deltas, never style holes.** The literal Deep Field tokens
stay in the markup and each of the three roots ends with ONE hole that appends
overrides, so the default paints from the first streamed character and pays
nothing.
Putting a hole on painted properties (`background:{{ card }}`) leaves the app
unpainted until the stream finishes: holes cannot resolve mid-stream.

`--ac` (#2fff8f) and `--crisis` (#e5534d) are absent from every delta, so the
colour table below holds in all four combinations. Gold gets a green primary
button on purpose.

The atmosphere hue is `--atmc`, a bare RGB triplet that substitutes inside
`rgba(var(--atmc),.32)`, because that layer had the cosmic blue written out in
33 places and kept it in every theme. The glow's second lobe is `--atmc2`
(Deep Field `242,214,158`, midnight `139,92,246`), separate from `--ac2` because
it is atmosphere rather than accent and moves with the identity: Deep Field
takes it warm so the lower lobe reads as a horizon, dawn takes it warm, gold
takes it violet.

The same fault survived in the third lobe until V1.9: it had the action green
written into it as `rgba(47,255,143,.07)`, so every identity carried a green
centre and the app felt charged in a way none of the palettes had chosen. That
lobe is `--atmc3` now. Deep Field turns it cold, dawn and gold set their own,
and no colour is written into the layer any more.

`--atmo` is how present an identity's sky is, because the strength was a literal
too. Deep Field runs `.85`, the other three run `.6`. The lobe alphas inside the
gradient are NOT the dial: `.5`, `.32` and `.07` are structure, the theme phase
asserts them per identity, and an identity that wants more sky raises `--atmo`.

None of the four appears in `HC_SHARED`, so hardening never shifts the glow.
`--atmc` and `--atmc2` are asserted per identity by the T `d` rows, because a hue
is painted rather than written and no contrast sweep can see it: a midnight glow
under dawn passes every ratio and still looks wrong.

**The sky is generated, not an asset.** `skyStart` hangs a canvas in the
atmosphere layer and paints it from `--tx`, `--atmc2` and `--atmc`, so a theme
change re-tunes it and no colour is written into the layer. Three things about it
are easy to undo. It reads its tokens through `skySync`, called from the one
`componentDidUpdate`, and only when the identity or the contrast modifier
actually changed, because a token delta appended at a hole tells the canvas
nothing. It holds still rather than disappearing under reduced motion, because
the setting asks for stillness and a sky that vanishes is a different design. And
it is `aria-hidden` and inert, like the gradient and the grain beside it.

**Surfaces carry alpha under Deep Field.** `--sf`, `--sf2` and `--sf-g` are
`rgba()` there, so the sky reads through the cards instead of only in the
gutters, which is the whole point of an atmosphere. That was measured before it
shipped, against the brightest point of the glow: `--tx` moves from 15.72:1 to
15.16:1 and `--mut` from 5.93:1 to 5.87:1, so no pair the colour table
guarantees changes band. Midnight, dawn and gold set opaque surfaces in their
deltas and are unaffected.

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

## A category is not a semantic colour
`--ac` means a primary action, `--ok` means a confirmed value, `--crisis` means
safety. None of them means "this row is about astrology". The chart cards and the
Library rooms were tinted per category out of exactly those tokens, seven cards
and six rooms deep, which is why a screen with one real action on it had green in
nine places. Category tint is gone: one wash drawn from `rgba(var(--atmc),...)`,
and the identity of a row is carried by its icon and its name, which is what
those were for. The Get Help row keeps `--crisis` and its own gradient, because
it is a safety control rather than a room, and R6b is what says so.

## The icon registry has to hold every icon that is asked for
`uiIcon(id)` returns `'none'` for an unknown id, and `mask: none` paints the
element as a solid block of `background-color`. `UI_ICONS` shipped with seven
entries while the app asked for fourteen, so every content icon in the build,
the seven chart cards on Today and on Spirit and the rooms beside them, rendered
as a filled square. It looked like a design choice and it was a missing key. The
source of truth is `inCommon Logo/icons/icons.json`; if you add an icon there,
add it to `UI_ICONS` too, and if a chip ever renders as a solid square that is
the first place to look.

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
the language Oki was last spoken to in and it survives in storage: a device
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

## Where tarot lives
Two different things share the word, and they are not on the same tab.

**The reading is a Spirit page**, beside the wheel and the numbers: a topic, a
depth, a card count, a seeded shuffle. `tarotVals()`, gate `spiritReading`,
addressed `/spirit/tarot`, the sixth page of the pager on the phone and a
`spiritView` on the desktop. It used to hang off the Throughline behind
`tlFilter === 'reading'`, which put the making of a thing inside the account of
it, and `vtVals` forced that gate false to keep the timeline whole, so on the
phone it could not be reached at all.

**The deck is a Library page**: all 78 cards as reference, nobody draws it.
`tarotLibVals()`, gate `libTarot`, addressed `/library/tarot`, and it renders
inside the Library section on both shells.

The rule underneath both: **a screen has to exist in the shell the reader is
standing in.** `vtVals` decides which Library view the vertical shell draws, and
a `libView` it does not name paints the shelf with every one of its own gates
switched off, which is a blank screen with no way back. That is what
`libView: 'angel'` did on the phone for as long as Synchronicities has been a
Spirit pager page: the Library card wrote an address whose screen was somewhere
else, and the report was that the number field would not take typing.
Synchronicities has one home per shell, so `goAngelGo()` and `openPath()` both
split on the width and send the reader to the page rather than to the address.

The matching rule for the values: **the vertical shell renders every Spirit page
at once**, so a page's vals must be present whenever that shell is up. Both
`tarotVals()` and `angelVals()` gate on `vertical` alone for that reason. Asking
for `curTab()` as well paints the page with no handlers on it, which is an input
with no value binding and no change handler: it looks right and does nothing.

`monthVals()` is the third page under that rule and the newest: `/spirit/month`,
the seventh page of the phone pager, `spiritView: 'month'` on the desktop,
reached by `goMonthGo()` and by an `openPath()` branch that splits on the width
exactly as Synchronicities does.

**The month reading carries Human Design as its own section**, "The gates the
Sun walks", between the reader's windows and the marked date. It walks
`gateRuns()` over the month and asks each run where the gate's centre sits in
this chart and which channels it closes against a natal gate. The Earth is asked
too, because it sits opposite and the gate boundaries line up across the wheel,
so both change gate on the same day. **A gate that is already natal closes
nothing new**, which is why `closing()` returns empty for it: a channel with
both gates natal is one the chart already has, and calling it a transit would
be a false finding. A closing run that begins inside the month joins the marked
date candidates at weight 2.5, below the lightest transit window, so it names
the day only when the slower sky offers nothing.

**A sentence the reader has just read is shortened, not repeated.** Neighbouring
gates share a centre, so October walks six in a row through the Spleen, and the
full centre sentence six times over read as the app running out of things to
say. A run in the same centre as the one before says so in one clause, and each
long explanation (defined, open, natal, closing, unanswered) is given once per
month and shortened after.

## Synchronicities is one page with two lookups
The page was Angel Number Encounters and it read repeating numbers. It is now
Synchronicities, and it reads a repeating number or a repeated animal sighting.
The vals function is still `angelVals()` and the gate is still `spiritAngel`,
because the number half is still the angel number half; `sightMode` picks which
lookup is on screen and `animalLookup()` is the second one.

**One log, both kinds.** `angelSightings()` reads both tags, `angel_number` and
`animal_sighting`, and the screen shows them in one run. Splitting the list by
kind would throw away the only thing that turns a sighting into a pattern, which
is the dated run underneath.

**The two halves are not equally readable and the page says so.** An unlisted
number is composed from its digits, because that is what the practice itself
does with one. An unlisted animal returns null: an animal cannot be read from
its letters, so the page offers the journal prompt instead of a meaning it would
have had to invent. Do not add a composed fallback to `animal-symbolism.js`.

**Each animal is written in three parts and they stay apart on the page**: what
the tradition holds, where that reading came from, and what it may be doing for
the person who noticed. The third is never a statement about the reader.

`/spirit/synchronicities` is the address. `/spirit/angel-numbers` is kept as an
alias in `openPath()`, the same way `/spirit/together` is kept for Synastry.

## Anything Else logs and does not interpret
Synchronicities has three tabs now. The number half composes a meaning from the
digits, because that is what the practice itself does with an unlisted number.
The animal half refuses to, because an animal cannot be read from its letters,
and offers the journal prompt instead. The third offers nothing at all, and the
absence is the feature rather than a gap in it.

**The case that decided it.** Somebody associates a make and colour of car with
a person who is no longer in their life. A general symbolism for a green pickup
truck is the wrong shape for that entirely, and worse than the wrong shape it is
an answer arriving where the reader was the only one who had one. Some
repetitions mean something between two people and nobody else, and a dictionary
cannot reach them. A symbolism registry for this may be written later, with a
construct designed around exactly that delicacy. Until then the honest surface
is the record.

**So there is no lookup, no registry and no composed fallback**, and the stored
entry has no meaning field for something to fill in later. `otherJournal()`
writes circumstantial prompts only: what was happening just before, where and
with whom, whether it has come up before. Nothing asks what it means, because a
leading question is a reading wearing a question mark. **Do not add a lookup
here without the construct that governs it.**

**The absence is said on the screen**, not only in a comment. A reader who finds
two tabs that explain a thing and a third that does not would reasonably assume
the third is unfinished, so `otherNote` says plainly that no meaning is offered
and why. N18b asserts that sentence is present, and that nothing interpretive
reaches either the entry or the panel.

**It is the same kind of entry as the other two**: tag `other_sighting`, type
`event`, written through `remember('journal', ...)`, so it lands on the
Throughline exactly as a number or an animal does and `angelSightings()` shows
all three in one run. Splitting the log by kind would throw away the only thing
that turns a sighting into a pattern.

**Its colour means nothing on purpose.** `--ac2-hi` and `--blue` are carrying
which lookup produced a row. There is no lookup behind this one, so it takes
`--mut` and a neutral glyph rather than borrowing a colour that says something.
`markC` moved into `angelSightings()` for that reason: the two way conditional
that used to live in `sightPast` would have painted the third kind blue.

## Writing a sighting down, and keeping it
Adding an entry opens a composer: the prompts for that kind, each with its own
answer field, and a freehand field under them. `sightBody()` joins the prompts,
each followed by its answer, and the freehand text into one journal body. An
unanswered prompt is saved as the bare question, which is exactly what an entry
held before the composer existed, so older entries and new ones read alike.

**A reader may keep one entry while journal memory is off.** The keep switch
passes `keep` to `addMemory()`, which stamps `kept: 1` on the row, and
`getMemory()` skips the consent filter for a kept row and only for it. The
switch appears only while the setting is off, because with memory on it would
be a control that does nothing. The consent setting still governs every other
row; a kept row is the reader's own explicit exception, written one entry at a
time, never a default.

## The Dream Journal
`dream-symbols.js` holds the registry, `dreamVals()` the page, gate
`spiritDream`, addressed `/spirit/dreams`, the eighth page of the phone pager
and `spiritView: 'dream'` on the desktop. `goDreamGo()` splits on the width
exactly as `goMonthGo()` does, and there was never a Library address for it.

**A dream is a journal memory with a tag**, the same shape a sighting is, which
is what puts it on the Throughline stamped with the window covering its date
without a second store or a second idea of what an entry is. `dream` is a
`TLTYPES` row and a `tlFilters` entry: without the first it falls through to
LIFE EVENT, which is the one thing a dream is not, and without the second it is
reachable only under Everything.

**This file and `animal-symbolism.js` disagree on purpose.** A crow on the path
and a crow in a dream are different events, and both readings are true of their
own occasion. Do not merge them and do not make one cite the other. Thirteen of
the seventeen animals appear in both, saying different things, and that is
correct.

**The three parts survive.** Every entry is meaning, origin, possibility, kept
apart on the page as in the sighting file, and the third is never a statement
about the reader. "You are avoiding your anger" is a diagnosis this app is not
entitled to make; "what was chasing you, and had you seen it before" is a
question only the dreamer can close.

**Confidence is about the text, never about the reading.** `detect()` scores how
sure it is the word is there. It has never scored whether the interpretation
fits, and the screen says which of the two it is showing. Two bugs made that
score lie once and both are permanent test rows now (N21): duplicate term forms
counted one occurrence twice, and a negation window of 22 characters reached
across a sentence boundary, so "the light would not turn on. A snake was on the
stairs" deleted the snake. Punctuation becomes a pipe token in `norm()` for
exactly that reason, and the negation check stops at it.

**Nothing here calls a model.** Every line of the analysis is computed on the
device from the registry, which is why it works offline, why it is identical for
the same text twice, and why the feature stays inside the V1.6.0 removal instead
of quietly stepping back through it.

**The two kinds of link are never merged.** `dreamLinks()` returns `figures`, a
dream animal that was then actually seen, and `near`, a sighting inside 48 hours
with nothing in common. The second is labelled as timing on the page, because
two things happening close together is a fact about the calendar until the
reader is the one who connects them. Matching is forward only: a sighting before
the dream is not the dream anticipating anything.

**The sea is its own entry.** Filing `sea` and `ocean` as aliases of Rough Water
labelled "I could smell the sea" as emotional turmoil, which is the detector
putting a word in the dreamer's mouth. Still Water, Rough Water and The Sea are
three readings and stay three.

## Terminology: what gets replaced, and the test that decides
Five field terms were put up for replacement on 28 August 2026. Four were kept
and one was renamed, and the test that separated them is worth more than the
result.

**The test: can a reader see it, and is the word the field's or somebody's
brand?** A term only earns a rename if it both reaches a reader and functions as
a name. An identifier nobody sees cannot be flagged and is not worth the churn.
A word the whole field uses is the standard, and inventing a private substitute
costs the reader comprehension and buys nothing.

| Term | Real count | Reader visible | Decision |
|---|---|---|---|
| Penta | 0 | 0 | Nothing to do. All three hits were `pentacles`, the tarot suit. |
| Connection Chart | 1 | 0 | One comment. Source only. |
| Composite | 29 | **0** | Kept. Every use is a comment, a script src or an identifier, and composite charts are older than Human Design. |
| Transit | 103 | ~55 | Kept. Plain astronomy, centuries older than this field. |
| **Bodygraph** | 36 | ~23 | **Renamed where it names, kept where it describes.** |

**Count transit carefully.** A grep for it returns 162 and 59 of those are the
CSS property `transition`. The real figure is 103. A rename argued from the
wrong number is a rename argued from nothing.

**That test is now a gate, and it is not a list of banned substrings.**
`tools/check-competitor-surface.js` holds the marks, and each term carries its
shape rather than only its spelling, because the substring version fails the
build on the app's own data. `Penta` reaches Penta-di-Casinca and
Lancusi-Penta-Bolano in the birth-place gazetteer and Pentacles in the tarot
deck. `WA` reaches Washington 400+ times, in both gazetteers, in the state and
capital tables, in the Seattle fixture in four component pages and in
`calculation-fixtures.json`, and in every two-letter identifier in minified
React. `Jovian` reaches `docs/reference/jovian-archive/`, which is the research
the rule was written from, so the gate would fail on its own evidence.
`compatibility` reaches `astropedia.js` and `hd-teachings.js`, where both
sentences exist to say synastry is not compatibility: banning the substring
bans the disclaimer.

The four shapes are `mark` (the name, barred outright), `label` (barred only
where it names a surface, which is how lowercase bodygraph stays legal in prose
and illegal in a heading or an `aria-label`), `identifier` (barred as a field
name or object key, which is the machine-checkable half of "there is no score":
a schema cannot carry compatibility if nothing may be named it), and `phrase`.
`figure` is in the phrase alternation because that is what the removed ring was
actually called, and a list barring score but not figure lets it back in under
its own name. Bare `score` is deliberately absent: `detect()` scores how sure it
is a word is present, and that is legitimate.

**Every override carries a reason and the gate refuses to run without one.** It
also fails on an override that matched nothing, because a stale exemption is a
rule nobody is reading. And it refuses to report green when it cannot see: too
few files walked, the app not reached, fewer than twenty label positions found,
or no mark found inside `docs/reference/` where they are known to be.

## Circles, and the Ground one stands on
`hd-circle.js` holds two things. **Between** is the two person overlay under its
inCommon name and delegates to `hd-composite.js`: there is not a second engine,
and G35 asserts it returns exactly what calling the composite directly returns.
**Circle** takes three to five people and returns a **Ground**: what the group
holds in common, as gate numbers, channel keys and centre states, every one of
them attributed to the members who carry it.

**A Ground has no pairwise rows and that is the whole design.** A Circle of five
contains ten Betweens, and a Ground listing all ten with their counts would be a
ranking whatever the fields were called: two numbers side by side get compared,
and the reader is told which two of their friends fit best. A Between is opened
deliberately, one pair at a time, on the surface that already carries the
consent story.

**No score, and the proof is behavioural rather than a missing field.** An absent
field is easy to add back. What is asserted instead is a property: **permuting
the members permutes the member list and nothing else**, over all 120
permutations of a five person Circle (G20). Every count in a Ground is about
gates, channels or centres and **none is per member** (G18), because a per
member count is a league table with one step missing.

**G20 caught a real defect on its first run.** Attribution lists were built in
member order, so 117 of 120 permutations produced a different object. Nothing
downstream read that order, which is exactly why it would have survived. Every
attribution list is sorted by id now. An order that means nothing and moves with
the input is an order somebody eventually reads as a ranking.

**There is no anchor, and that is a decision rather than an omission.** This
module shipped with one for exactly one revision. It was the seat the reading
was taken from, passed in rather than computed so no measurement could choose
it, carrying `permissions: 'none'`, and a test proved it was inert: the same
Circle read from all five seats gave a byte identical Ground apart from that one
field. Every defence worked and they defended the wrong thing. **`permissions:
'none'` is read by code.** A person reads five names with one of them singled
out and labelled, and no adjacent sentence undoes that. In a family or a
friendship, being the named one, or not being it, is the whole content of the
screen. The safe version of a distinguished seat in a small group of real people
is not a carefully labelled one, it is none.

So a Ground has no seat, no centre, no first member and no perspective. G23 to
G27 hold that shut: no field anywhere is named like a seat, an `anchor` passed
in options is **ignored rather than honoured**, no member carries a field
another lacks, the word does not appear in the module's code, and the top level
shape is locked to eleven named keys so a seat cannot come back under a word
nobody thought of. If a screen needs to know whose device it is, that belongs to
the screen: it is a fact about the session, not a finding about the group, and
it must not travel inside the reading.

**A Ground is mechanics, so it carries no prose.** Gate numbers, channel keys,
centre names, member ids, and the screen writes the sentences. The one string is
`GROUP_CAUTION`, returned from the module for the same reason `CONFIG_CAUTION`
is, and G39 asserts nothing else in a Ground is a sentence. This is the shape
`layers()` in hd-composite still owes.

**Nothing is persisted and nothing is memoised.** `pair-cache.js` is
deliberately not consulted: it is the two person cache, its key is a digest of
two birth moments, and reaching into it from a group reading would put group
state behind a pair key. G37 asserts the module names no storage API.

**Three to five, and it refuses rather than trims**, naming `too_few` or
`too_many` and the count it was given, the same rule the twelve person library
follows. A member with no birth time stays in the Ground and is named, with the
affected mechanics listed.

**Circle renders inside Synastry in both shells, and is not a ninth Spirit
page.** `circleVals()`, gated on nothing but the modules being present, spread
beside `synVals()` at the single call site, and the markup sits inside
`spiritSyn` and OUTSIDE `synOpen` so it is reachable when no pair is chosen.
Two reasons, and the first is the one that matters: the Spirit pager has eight
pages and the indices are load bearing, so a ninth renumbers what `openPath()`
and `vtGoTab()` point at and renumbers N24. The second is that this is where it
belongs anyway, which is the same call `hd-composite` made.

**The reader is supplied by the shell, never by the Ground.** hd-circle returns
no seat, so the person holding the phone is marked on the chip row and nowhere
else: `ciYou`, rendered as a dashed label rather than a button, because they
cannot be removed from their own circle and a control that does nothing is
worse than a label that says the true thing. Inside the reading every member is
drawn by first name, the reader included, so no row is shaped differently from
any other. Do not add a sort to `circleVals()`: the module's lists come back
sorted by id already, and an order applied above the module reintroduces
exactly what G20 exists to catch, where G20 cannot see it.

**A chip at the cap still turns off.** Five is the ceiling, and a sixth is
refused, but an already chosen member can always be removed, or a reader who
picked five is stuck with no way to swap. `circleWith` is in `ANNOUNCE_KEYS`
and is diffed by its joined ids rather than by reference, because the array is
rebuilt on every setState and a reference compare announces on every render.

## The one cache that holds positions, and why its key is a number
`ephemeris-cache.js` memoises `lonOf()` by body and instant. It is the second
cache in the build and it is nothing like the first: `pair-cache.js` writes to
localStorage because a composite is expensive to make and cheap to keep, and a
position is the opposite, so this one lives in memory and dies with the page.

**It does not violate compute on read.** A position is not derived user state.
It is where a body was at an instant, true for everybody, carrying no birth
record and no name. The rule exists so that editing birth data cannot leave a
stale reading behind, and nothing keyed by an instant can go stale that way.

**Three departures from how a cache is normally written, all measured.**
`tools/bench-ephemeris.js` reproduces them, and it prints ratios because the
absolute times move by 3x between runs on one machine.

- **The key is a number.** Keyed on the instant rendered as a string, the cache
  is not measurably faster than no cache: 5% on one run and negative on the
  next, because building the key costs about what the answer costs. Body name to
  an integer slot and a Map on the raw float `t` is about **10x** the string
  version and makes a `transitWindows` walk **90%** faster.
- **There is no LRU.** LRU wants bookkeeping on every hit, and against a
  recompute measured in microseconds that costs more than the miss it prevents.
  At the ceiling this clears wholesale.
- **There is no TTL.** A position at an instant does not expire. Cold entries
  are never wrong, only unused, and the ceiling collects them.

**It loses on one path and the bench says so.** Filling is not free, so a walk
that never repeats an instant comes out about **20% slower** than no cache.
`transitWindows` is exactly that walk, since it memoises its own result per day
per profile and only ever runs cold, and it pays about a millisecond. That is
paid once per day per profile, against ten unmemoized natal call sites that all
ask for one instant on **every** render. Ten renders pay the walk back. A
benchmark that printed only the wins would have hidden this, so
`bench-ephemeris.js` prints the loss too.

**Chiron and the four asteroids are never cached, and that is correctness.**
They read `window.MinorBodies`, which `minor-bodies-ephemeris.js` installs,
uninstalls and recalibrates, so their answer is not a function of `t` alone.
Cache a null taken before install and the Expanded Chart says "not computed"
for the rest of the session. The bench drives that case rather than asserting it.

**Nothing is rounded on the way in.** `designT()` bisects `lonOf` to an
arcsecond through `arc-solver.js`, and Prompt 3's "rounded to the nearest
minute" would hand the solver a step function to find a crossing in.

**The cache is optional and absent from `modulesReady()`.** With the module
missing, `lonOf()` is exactly `lonRaw()`. A performance memo must never be able
to stop the app booting.

## The expanded wheel: 96 points, computed inline, no worker
The maximize button on the chart card (⛶) already existed; this built what it
opens. `chartExpandGo` was already forcing `chartMode: 'expanded'`, and the
overlay already drew the SAME wheel the small card does and read a table from
`fullChart(true)` - what was missing was the data. `EXTRA` carried five
points (Chiron, Ceres, Pallas, Juno, Vesta); `EXPANDED_REGISTRY` carries all
eighty from `app/ephemeris/pointRegistry.ts`, ported by hand rather than
loaded as a module, because browsers do not run TypeScript and this app has
no bundler. `expandedLonAt()` is the same hand-port of
`app/ephemeris/engine.ts` and `cometSolver.ts`, both already checked against
real test vectors by `tools/check-ephemeris-engine.js`: same constants,
same Kepler solve, copied rather than re-derived so the two could not
silently disagree. Basic mode is untouched - `chartAt()`, `PLNS` and
`fullChart(false)` never see any of this.

**Twenty-nine of the eighty compute for real; the rest say so honestly.**
Chiron and the four asteroids already came from `window.MinorBodies`. New:
Eris and Sedna (full 3D Keplerian, `TNO_3D`), the eight planetary nodes
(Standish/JPL mean elements), Lilith (mean) and Selena, the three named
comets (Halley/Hale-Bopp/Hyakutake, mundane only), Vertex/Antivertex, Part of
Spirit, the Aries Point, and the Sun/Moon midpoint. The other fifty-one
asteroids, centaurs, TNOs and Hamburg School hypotheticals have no orbital
elements sourced anywhere in this codebase and stay `status: 'unavailable'`
with a real reason (`UNCOMPUTED_WHY`), by the same rule engine.ts's own file
header states: a missing position is honest, an invented one is not.

**Ring 1 and ring 2 are a stagger band, not a distance from centre.** Both
sit inside the sign boundary, where the small card's glyphs already lived;
ring 1 (planets, both nodes, Chiron, the four main asteroids, Lilith,
Selena) staggers near that boundary at the original size, ring 2 (everything
else this wheel draws) staggers in a smaller band further toward the centre,
in a smaller glyph, so eighty points does not compete with the sixteen core
ones for the same rim space. `RING1_IDS` is the membership list.

**Comets are the one category excluded from the wheel by default.**
`fullChart()` computes and lists them unconditionally - the table and the
seven sub-tables below it always carry all three - but `placedRows` (which
feeds `wheelPlanets`/`wheelLabels`, the SVG) drops `category === 'comet'`
unless `chartExpandShowComets` is on. One state flag, checked in one place,
rather than a second copy of the point list.

**Category colour is a fixed hue, not a themed one**, the same reasoning
`--ac`/`--crisis` already rest on: asteroid amber and centaur teal
(`--cat-ast`/`--cat-cen`, declared beside `--crisis-lo` in all three token
roots), comet orange (`--cat-com`), TNO reusing `--ac2` (violet already
meant "expanded" on this wheel), node/hypothetical reusing `--dim`. Chart
glyphs are `check-purple-text.js`'s own standing exemption from the
never-as-text rule, so this needed no new carve-out.

**The expanded aspect table is a different table, not a scaled copy of the
basic one.** `EXPANDED_ASPECTS`/`EXPANDED_ORBS` add quincunx, semisextile,
semisquare and sesquisquare to the five majors, at the wider orbs the brief
asked for; `natalAspects(expanded, opts)` only reaches that table when
`opts.rich` is true, which is exactly the maximize overlay and the small
"Expanded Chart" pill (both share `chartMode`), never the basic grid.
`opts.minorScale` halves the orb for any pair touching a point outside
{body, angle} - the codebase's existing precedent for this (the `patterns.ts`
work under `app/aspects/`) halves minor-point orbs the same way, for the same
reason: an asteroid trine should need to work harder for its orb than a Sun
trine does. **`ASP_COLOR` needed the four new keys before any of this could
render**: the aspect detail panel and `wheelAspects` both index it as
`ASP_COLOR[x.asp][0]` with no fallback, and a missing key there is not a
blank line, it is `Cannot read properties of undefined (reading '0')` on the
very first click - caught by testing the actual click, not by reading the
diff. `aspectLegend` reads `Object.keys(this.ASP_COLOR)` for the row list
under the wheel, so it had to be told to stay at the original five keys
outside expanded mode, or the basic chart's own legend would start
advertising aspect lines it can never draw.

**One tooltip builder, not two.** `pointTooltip(r, houseLabel)` is what both
`wheelPlanets`' SVG `<title>` and every points-table row's `title` attribute
call: name, glyph, DMS position, house, then the two SYMBOLISM lines
(tooltip → the point's own meaning, reference → "Used in reference to"). An
unavailable point never reaches the position formatter; it returns "n/a: no
ephemeris" instead. That reads as an em dash in most people's idea of the
phrase and is written with a colon on purpose: CLAUDE.md's zero-em-dash rule
applies to a tooltip exactly as it applies to a sentence, and no exception
was made for one just because the brief that asked for this row happened to
write the phrase with one.

**The points table's Speed column needed the actual formula re-evaluated at
each half-day sample, not the natal instant reused twice.** `vertexOf()`
used to always read `natalDate()` internally regardless of what `t` it was
handed, so asking it for a position a half day either side returned the same
number twice and reported zero motion for Vertex and Antivertex. It now
takes an explicit `t` that defaults to the natal instant. `partOfSpirit` and
`sunmoonMidpoint` had the matching version of the same bug one level up:
`expandedSpeedAt()` was reusing one `ctx.sun`/`ctx.moon` computed once for
the natal instant, so a formula built entirely from `ctx` also read as
motionless no matter how fast the Moon was actually moving. Both are fixed
the same way: recompute what the half-day offset should have changed, not
just the parameter that happens to vary for most other points.

**The seven sub-tables below the main one are a plain browsable reference**,
the same shape the Library's rooms already are (see the dream registry's
"browsable now" precedent above): independent of the main table's own
search/sort/group state, closed by default so the panel opens tidy at
ninety-six rows, each one a `{category, open, toggle, rows}` built once in
`chartExpandVals()` from the same `allRows` the main table already computed
- never a second read of the chart.

**No Web Worker exists anywhere in this app** (`engine.ts`'s own file header
already says so: "There is no Web Worker wiring anywhere in this app"), so
the acceptance criterion asking for async worker computation is not met
literally. What is true instead, measured rather than assumed: a full
`fullChart(true)` plus the rich `natalAspects()` pass over all ninety-six
points and roughly two hundred aspects took 20ms end to end in this session's
own testing, comfortably inside the 150ms budget on the main thread, the
same way `computeAll()`'s own header already argues for the ~97-point spec
module it mirrors.

## The maximize button opens a portal that is not a portal
The ⛶ button, the focus trap, all three dismiss paths, the backdrop and the
wheel's fixed sizing were already built in the pass above. What was missing
was two panels: the Aspects grid and the narrow-width tab bar that the brief
called for as "Points | Aspects | Houses" below 900px.

**The Aspects panel reads the same rich pass the wheel's own lines already
draw**, `natalAspects(true, {rich, minorAspects, minorScale})`, so the grid
and the wheel can never disagree about which contacts exist. It renders as a
row of small chip cards rather than a table, per the brief's own "horizontally
scrollable": a vertical list here would just be a second points table wearing
different columns.

**`.chartx-grid` uses named grid-template-areas now, not implicit row
placement.** The houses, points and aspects panels used to fall into rows in
DOM order; below 900px all three now share ONE named area, `content`, and
`chartExpandVals()`'s own `panelDisplay()` is what decides which of the three
is actually `display:flex` at a time. That is the tab switch: the other two
panels are still in the DOM, just not painted. Grid areas were chosen
specifically because DOM order would otherwise decide which panel a reader
saw first if two ever ended up visible at once, which is exactly the kind of
markup order dependency this pass was trying not to introduce alongside brand
new markup.

**Three deviations from the brief, and codebase convention won each time.**
The brief named a bare `chart.expanded` localStorage key; every key in this
app is `incommon.`-namespaced, so it is `incommon.chart.expanded`. The brief
asked for a portal (`createPortal` or equivalent); there is no portal
anywhere in this codebase, it relies on `position:fixed;inset:0` for
full-viewport stacking, already verified across every viewport this session
tested, and retrofitting one real DOM portal into a buildless, hooks-free
runtime for one dialog would be the kind of one-off abstraction CLAUDE.md
elsewhere warns against. And the brief asked for body scroll lock while open;
`html,body{overflow:hidden}` is already permanent and global in this app's one
stylesheet, so toggling it per-dialog would be dead code layered on top of a
rule that never turns off.

## Mechanics and interpretation, and which way the arrow points
Two layers. **Mechanics** takes the ephemeris and a birth record and returns
structured data: gate numbers, line numbers, centre states, channel
connectivity, positions, places, dates. It is the only layer that touches the
ephemeris and it reads nothing from the layer above it. **Interpretation** is
inCommon's own writing, keyed by what mechanics returned, and it computes no
positions. **Shell** is storage, profiles, network, safety routing, analytics
and the dormant Oki modules, listed so the manifest is complete.

The reason to hold the line is not tidiness. Mechanics is facts and a system,
which nobody owns, so it stays publishable as facts. Interpretation is the part
that is ours, and it is the only part with any licensing exposure at all. A
module that mixes them has no clean answer to either question.

`tools/check-layer-boundary.js` is the gate. It reads the dependency graph the
way this build actually has one: **there is no import graph**, so it resolves
the exported global of every module and looks for that name inside every other
module. **An unclassified `app/*.js` is a failure**, which is the whole point.
A new module cannot arrive unlabelled and sit on the wrong side without
somebody saying so.

**There is no 32-character string cap and there must not be one.** It was
specified as one and it would delete `CONFIG_CAUTION`, the 158-character
sentence hd-composite returns so it cannot drift between the two shells and so
a screen that forgets it fails C11 to C15 rather than shipping quietly. Prose
is measured instead: six words, real sentence punctuation, five lowercase
function words, and no `|` record separator. All four are needed. A plain word
count reports the gazetteers as 266 pages of writing, because
`Little Rock,34.7465,-92.2896,202591|Fort Smith,...` counts as words.

**`EDGES` is empty, and that is the result of splitting the atlas.** There is no
mechanics module that reads an interpretation module. Both entries that used to
sit there were `hd-composite` and `hd-circle` reaching into `hd-atlas` for the
channel table, because that module held the wiring as well as the writing.

**`hd-topology.js` is the wiring, as facts.** The thirty six channel pairs, the
gate to centre map, the nine centres, and nothing else. It was GENERATED from
the tables that were in the atlas rather than retyped, because sixty four gate
to centre mappings copied by hand is sixty four chances to put a gate in the
wrong centre and produce a chart that is wrong and looks right. Nothing in it
may describe: Y7 fails on any string of four words or more.

**hd-atlas is the writing, and it reads topology**, which is interpretation
depending on mechanics, the direction the boundary allows. It keeps `CHANNELS`
keyed by the same strings, and Y1 asserts the two key sets are identical, which
is the same discipline that already holds the app's own channel table to the
atlas.

**`layers()` lives in hd-atlas now.** It assembles that module's own writing, so
keeping it in hd-composite meant a mechanics module reading an interpretation
one however the text was stored. `HDAtlas.layers(row, nameA, nameB)` takes a row
exactly as hd-composite returns one and looks the descriptor up from
`row.gates`, so **a composite row carries no writing at all** and no text passes
through a mechanics module on its way to a screen. C33 asserts that.

**Y4 has to compare against `ATLAS.GATES`, not `ATLAS.centerOf()`.** That
function delegates to topology now, so comparing the two asks topology whether
it agrees with itself and passes whatever either says. It was written that way
first and a sabotage that moved gate 1 into the Throat sailed through it.
`GATES` still records the centre in position 1 and is a genuinely independent
copy of the same fact, which is what makes the row able to fail.

**`layers()` composes no prose and must not start again.** It held the
tradition line and all six possibility questions, which was the largest
crossing in the build. They live in `hd-atlas.js` now, beside the channel
descriptors the tradition line quotes, as templates with `{holder}` and
`{other}` tokens. `layers()` is the function that knows which of the two people
holds a channel, so it is the one that substitutes, and it composes nothing.

**The output did not change, and that was checked rather than assumed.** All
six states plus both tradition templates and the unnamed-channel fallback were
compared against the old implementation row for row: 36 rows, zero differences.

**Three independent guards keep it out**, which is deliberate, because the
tempting regression is a hardcoded fallback for when the atlas is missing and
that would pass a test that only looked at the happy path. C33 asserts the
behaviour: with no atlas reachable the two text layers come back EMPTY rather
than invented, because a reading with no tradition line is honest and an
invented one is the debt growing back. C35 names the seven moved sentences as
fixtures, the way I12 does for the rewritten hexagram lines. And
`check-layer-boundary` catches any new sentence at all. Reintroducing one
question turns all three red.

`layers()` takes an optional fourth argument for the atlas. The app passes
nothing and the global is found, which is what C34 covers; a Node caller passes
`{ atlas: ATLAS }`.

**What it cannot check is separation, only direction.** Prompt 1 asked for two
layers with no shared module. The shell loads both by design and always will,
so that is not a property this build can have. One way dependency is, and it is
the half that carries the weight.

## The wiring, and why the prose still says bodygraph
`MYBODYGRAPH HUMAN DESIGN` is a mark Jovian Archive holds, so the exposure is
in the places where the word functions as the name of something this app offers:
a heading, an accessible name, a role description. It is not in the places where
it is ordinary description of a chart type, which is the strongest fair use
position available and also the word a reader may already know.

So the section is **The Wiring** and the sentences still say bodygraph the way
they say chart. Ten label sites moved: the heading in both shells, the layer
control's accessible name, the figure's `aria-roledescription` and
`aria-label`, and the screen reader summary. Assistive uses of the old name
went from six to zero; one rendered use remains and is descriptive prose, kept
on purpose.

**The gloss is load bearing, not tidiness.** `bgNote` and the atlas both say
the wiring, which the field calls a bodygraph. Naming our own surface and then
using the field's word descriptively is the entire legal posture in one
sentence, and it is also what keeps a heading and the prose under it from
reading as two unrelated words.

**The term was not invented for the problem.** The app already spoke this way:
"a quieter wiring, not a worse one", "the same wiring twice". It came out of the
writing rather than a naming exercise, and it pairs with the wheel on the
astrology side. That is the bar any future substitution has to clear.

## There is no compatibility figure anywhere
The synastry ring drew a number out of 100 with a band under it, and it was the
loudest thing on the screen: two people looked at a figure before they read a
word. It is gone, along with the two methods that made it, `synScoreOf()` and
`synBandFor()`. Removed rather than left unwired, because an unwired scorer is
a scorer somebody wires back up.

What the screen says instead is how many contacts fall inside orb and how many
of them are the easy kind. A count is a fact about contacts; it becomes a rating
the moment it is divided by anything. The shared card carries the same two
counts and no figure, because a shared image is the most quotable surface this
app has.

`synWeight()` stays and is not a score: it orders the contacts inside ONE pair
so the loudest three can be shown first. It has never compared one pair against
another and must not be made to.

G9b and G9c changed from asserting the band to asserting the absence, in the
same idiom group R uses. N2 asserts the card carries counts and that `score`
and `band` are undefined on it.

## Chiron is fitted, measured, and is the method for the bodies after it
The app carried two Chiron models: a dead one in the app class calibrated to a
single 2018 ingress, which is what the "runs about 4 degrees fast" comment was
about, and the live one in `minor-bodies-ephemeris.js`. Only the second was
ever called. The dead one is deleted, because two models for one body is two
answers for one body.

The live one is now fitted against **81 NASA JPL Horizons positions** (target
2060 Chiron, geocentric apparent ecliptic longitude at 500@399, two year steps,
1900 to 2060, retrieved 2026-08-27). Before: RMS 0.732 degrees, worst 1.519.
After: **RMS 0.559, worst 0.923, none over one degree.**

**The rule that keeps a fit honest, and the one to copy for the next body: `a`
and `n` are not free parameters.** The semi-major axis is the published one and
the mean motion comes from it by Kepler's third law. Letting `a` float gave a
better residual and an object at 11.37 AU, which is not Chiron. What may be
fitted is the phase and the slowly varying angles, `L0`, `e` and `varpi`,
because those are genuinely mean over the interval for a body Saturn and Uranus
keep perturbing.

**Accuracy decides which claims a body has earned.** At 0.92 degrees Chiron can
name a sign and an aspect and cannot name a degree, so `degreeSafe()` withholds
the Sabian symbol from it and from the four asteroids, and the page says why
rather than leaving a gap. Group E asserts the reference positions, the worst
case, that `a` was held, that Kepler still holds, and that the dead model stays
dead. Measure the body, record the worst case, let that decide what it may say.

## The Book of Changes

`iching.js` holds all sixty four hexagrams and the casting engine; the room is
`/library/i-ching`, gate `libIChing`, vals `ichingLibVals()` for the reference
half and `ichingVals()` for the consultation.

**Both halves are one room, and that is not the shape the other systems use.**
Tarot is split: the reading is a Spirit page, the deck is a Library page. This
is not, for two reasons. The vertical shell carries Spirit as a pager and the
page indices are load bearing, so a tenth page moves what `openPath()` and
`vtGoTab()` point at and renumbers N24. And it is the wrong shape for this
system anyway: the Book of Changes is a book you consult, so the consultation
sits at the front of the room that holds the sixty four. A Spirit page can be
added later without moving anything.

**`iching` is deliberately absent from `SPIRIT_PATHS`.** It was in it, and that
made `/spirit/i-ching` resolve to a `spiritView` no shell draws, which is a
blank screen with no way back: the same fault `libView: angel` had on the
phone. The address is kept, as an alias in `openPath()` that lands in the
Library, because a reader who knows where the tarot reading sits will try the
matching Spirit address. N27b asserts both the alias and the absence.

**The two methods are two oracles, not two labels on one.** Three coins give 6
and 9 one time in eight each, so every line is equally likely to change and a
change is as likely to go either way. The yarrow ritual gives 6 one chance in
sixteen, 7 five, 8 seven and 9 three: it changes less often, and when it
changes it is three times more likely to be yang giving way than yin
hardening. Whole commentaries rest on that asymmetry. A build that rolled a
number from six to nine would be answering with a third oracle nobody has ever
used, and it would look completely correct, so N26 asserts the weights differ
AND counts eighteen thousand cast lines per method against the true
distributions. A weights table nothing reads is decoration.

**The changing lines are the middle of the thing.** A build that showed the two
hexagrams and not the lines would show where a situation is and where it is
going while leaving out the only part the tradition treats as instruction. When
nothing changes the page says so in a sentence rather than leaving a gap, the
same way `availability()` names what a chart cannot compute.

**Hexagram N is gate N.** Human Design took the wheel from this book, so the
room says so on every figure and the reading says so on the one it cast. That
cross link is the reason both systems live in one app, and N26b asserts it over
all sixty four rather than trusting the two registries to agree.

**Nothing is quoted, and the first build of this room did not manage that.**
The judgments, images and questions were written for inCommon and scanned
clean. The 384 line readings did not: 172 of them carried phrasing from the
translation that is in copyright, and from hexagram 41 on they were close to
verbatim. It read as finished work, which is why it got as far as a passing
gate before anything noticed.

**The fix was a change of kind, not a find and replace.** A line reading is
commentary on what the line position means, not a rendering of the oracle
text. Hexagrams 1 to 16 were already written that way, which is exactly why
they scanned clean, and 17 to 64 were rewritten to match. Swapping phrases
would have left "a jug of wine, a bowl of rice, earthenware, handed in through
the window" sitting there untouched, because nothing in it is a formula.

**The verdicts stay, and the reason is the terminology test.** Good fortune,
misfortune, no blame and humiliation are the omen verdicts the Zhouyi itself
uses. Legge renders them that way in 1882 and he is public domain, so they are
the field's standard vocabulary rather than anyone's authorship, and a private
substitute would cost the reader comprehension and buy nothing. That is the
same test that kept transit and composite. What went is the phrasing no other
translator arrives at by accident: perseverance furthers, remorse disappears,
it furthers one to cross the great water, the superior man.

**Two rows hold the line and they test different things.** I11 lists the
distinctive phrasing. **Do not add the verdicts to it to make it stricter**:
the room would then fail its own gate for using the words the tradition uses.
I12 lists nine sentences that were actually removed, as fixtures, because a
line can be copied without using any phrase on I11's list, and that is how the
bulk of this got in. I12 caught a rewrite of mine reusing "obstruction on
obstruction" the first time it ran, which is the row working.

**The footer had to change with the text.** It said no translation is quoted,
full stop, which was overreaching about the verdicts sitting directly under
it. It now says the readings are ours and the verdicts are the ancient text's
own terms. The third part of each entry is a question only the reader can
close, which is the same three part shape `dream-symbols.js` and
`animal-symbolism.js` keep.

**A room that takes the whole pane has to switch the shelf off.** `libShell`
excludes it in both shells. `dreams` was never added to those two lists when
that room shipped, so the Dream Symbols room drew with an empty `flex:1` shelf
on top of it: `libList` goes false the moment `libView` is set, so what is left
is the container and the tab strip and no content. Same fault the atlases had,
same fix, and both are in the list now.
## The dream registry, and the room it lives in
Someone dreamt of a tornado, the journal read every other image in the dream,
and had nothing for the one that was obviously the point. Weather is now its own
category, sixteen images, because weather is the mood of a whole scene made
visible and it is the one class of image the dreamer never chooses.

**Entries may carry variants, and variants are tradition, not a fourth claim.**
A tornado watched from a porch and a tornado you are standing in are not one
dream, and an entry that gives a single reading for both is why a symbol
dictionary reads like a horoscope. The three part rule is unchanged: what the
reading holds, where it came from, and a question only the dreamer can close.

**The registry is browsable now.** Until this pass the only way to reach a
reading was to have dreamt the thing and typed it, so nobody could look up what
water means without first dreaming about water. `/library/dreams` is the room,
gate `libDreams`, vals `dreamLibVals()`, and it reads the same table
`detect()` reads, so an entry cannot say one thing in the journal and another
in the library. `search()` walks the same term index the detector walks for the
same reason. Remember the rule that catches this class of bug: a `libView` the
vertical shell does not name paints a blank shelf, so `vtVals` names `dreams`.

## The sky twinkles, and the twinkle is per star
A field where every star pulses on one clock reads as the page flickering. What
reads as a sky is each star holding its own phase, its own rate and its own
depth, so no two arrive at their brightest together and a third of the field
barely moves. Small stars twinkle harder than large ones, which is how the
atmosphere does it.

Phase and drift advance by elapsed time, not per frame. The drift had that bug
and ran twice as fast on a 120Hz panel. The delta is clamped, because a tab
that was backgrounded for a minute returns with a vast one and every star jumps
at once.

Under reduced motion the sky holds at full brightness rather than mid dip: a sky
frozen halfway through a twinkle looks like a rendering fault rather than a
choice. The glow is two elements now, the cold lobe overhead and the warm
horizon below, drifting on different periods in opposite directions, because as
one element the whole sky slid together and read as a blob panning.

## The birth moment has three states, not two
`birth-time.js` owns every decision about what a chart is drawn from, and it is
a module rather than a method because a wrong answer here produces a chart that
is complete, internally consistent and about somebody else. That is the one
error the app cannot notice afterwards, so the arithmetic lives where
`tools/run-module-tests.js` can reach it without a browser.

**A blank field is not an answer.** `known` is a time that can be read,
`unknown` is the reader having said they do not know it, and `unanswered` is
the question still being open. The third is stored as `birth_time_unknown`
being absent rather than false, which is exactly right for every profile written
before this: those readers were never asked. Only `unknown` is a decision, and
it has to be made on the form, never inferred from an empty field.

**The offset belongs to the birth date.** A zone's standard offset applied year
round puts every summer birth an hour late, which is about fifteen degrees of
Ascendant and routinely a whole rising sign. Daylight rules have changed
repeatedly and differ by country, so Intl is asked rather than a hand written
rule, and it is asked twice because the offset depends on the instant and the
instant depends on the offset. Thirty two births in the module gate hold that
line, chosen from the awkward side of rules that have since changed: the winter
Britain stayed on summer time, the years Portugal ran on central European time,
the five years Russia kept daylight saving permanently, the Sydney games
starting it early, China's brief experiment with it, and three zones whose
offset is not a whole number of hours. If a future change starts reading a
stored standard offset again, every summer row goes red at once.

**The assumption is returned, never hidden.** A chart with no time is still
drawn, for 12:00 noon local, because a solar chart is worth having. What is not
allowed is drawing it quietly: `availability()` names what cannot be computed,
`birthTimeVals()` puts that sentence above the wheel and the bodygraph in both
shells, and the list is the point of it. A wheel with no house numbers and no
explanation reads as a chart that does not have any, and a reader who does not
know a time is missing cannot go and find one.

**The time field is text plus an explicit clock**, not `input type=time`. A
native time control is a different control on every platform, and in some
webviews it cannot be typed into at all, which is how a wrong hour gets into a
chart while looking like it took the right one. A text field with 24h, AM and PM
beside it is the same control everywhere, and it refuses a contradiction rather
than resolving one: "13:00" with AM selected is two answers, and only the reader
knows which they meant.

**`p.hasBirthTime` was the wrong source of truth** and is no longer what
decides. Only profile-manager sets that flag, so a partner reached from a shared
card or typed into the synastry form carried a real birth time, was read as
noon, and had their Moon put in the wrong gate with nothing saying so.
`natalDateFor()` asks the module, which decides from the time itself.

## The design side is an arc, not a duration
The bodygraph is two passes: the birth moment, and the moment the Sun stood 88
degrees of arc earlier. The build took the second as a flat **88.36 days**, and
that is the single largest calculation error this project has had.

The Earth is fastest at perihelion in January and slowest at aphelion in July,
so 88 degrees of solar arc takes between **86.6 and 92.0 days**. Measured across
twelve birth months, the flat constant lands up to **3.6 days** out. On the
design side that is up to 3.5 degrees of Sun, nearly four lines and enough to
flip a gate, and up to **46 degrees of Moon**, which is more than eight gates.

What that changed, measured over 48 sample birthdays a week apart across 1990,
old arithmetic against new:

| Changed | Of 48 |
|---|---|
| At least one activated gate | 43 |
| Defined channels | 28 |
| Defined centres | 27 |
| **Authority** | **19** |
| **Type** | **13** |

A quarter of readers were being given the wrong Type, and Type and Authority are
the two things the whole practice is built on. Nothing reported it, because a
wrong gate looks exactly like a right one.

`designT()` solves it now, through `arc-solver.js`, which bisects a longitude
function the app supplies rather than carrying an ephemeris of its own. Twenty
halvings at most, an arcsecond of tolerance, and the iteration count is returned
so a runaway bracket is a failed test rather than a wrong date. The old constant
survives as the fallback for a build with the module missing, because an
approximate bodygraph beats a blank screen.

**This changes existing readers' charts.** Someone who was told they are a
Projector may now read as a Generator. That is a correction rather than a
change, but it is a correction people will notice, and it is worth saying out
loud rather than letting them find it.

The same solver is what a return chart needs: `crossings()` returns every
crossing in a window rather than the first, because Saturn and Chiron can cross
a natal longitude three times and one date for a three pass return is a false
statement about when something happens. Nothing calls it yet.

## A routed jump owns the pager tab until it lands
`vtGoTab()` sets `vtTab` and then smooth scrolls the pager to that page, and
the pager's scroll handler derives `vtTab` from `scrollLeft` on every scroll
event. So a jump from the first Spirit page to the ninth walked the state
through every page between them, and everything that follows `vtTab` followed
it there: `aria-current` crossed the tablist, and the live region announced
pages nobody asked for. A deep link into the Dream Journal read aloud as five
other screens first.

It was invisible until a page got heavy enough to slow the animation. N24 reads
the tab 700ms after routing to `/spirit/dreams`, had always been catching the
arrival, and started catching page 5 once the composite rendered five groups of
rows. The row was right; the timing was the least interesting thing about it.

`_vtRouteTab` is claimed before the scroll starts and released by
`vtStopSettle('T')`, which already fires when the jump lands or when a gesture
takes over, so a reader who swipes mid flight still keeps their swipe. Do not
let the scroll handler write the tab during a routed jump.

## The wheel boundary rule
`hd-wheel.js` holds the gate order and the mapping, as data. A gate is 5.625
degrees, a line is 0.9375, gate 41 opens the wheel at 302 degrees, and the tie
break is stated once: **a boundary belongs to the gate and the line that begin
there**, half open intervals all the way round. 302.0 is gate 41 line 1;
301.999 is gate 60 line 6. The tradition does not settle this, floating point
cannot represent most boundaries exactly, and what a reader is owed is that the
same longitude always gives the same answer. Twelve rows assert it, including a
sweep at every thousandth of a degree against the app's own fallback literal.

## The gates in the sky now
`hd-transit.js` returns every body's gate and line at an instant, in a declared
order, and splits that list by whether a chart holds each gate. It is the on
device half of the daily transit study of 11 September 2026, which is a draft
and not ratified. Its bucket cache (Prompt 3) and its notifications (Prompt 6)
were dropped: a position is already memoised by `ephemeris-cache.js`, and this
build raises no notification, which A13 holds.

**The instant is a minute, and it is the start of that minute.** The Moon moves a
line in under two hours, so a day is not an instant, and a reading taken at local
noon is not the sky now. `reading()` floors to the minute and carries the instant
inside it, so the card can say which minute it shows. The civil day belongs to a
zone and the instant belongs to nobody: one minute is the 11th in Tonga and the
10th in Pago Pago and the gates are the same in both. X11 to X14 hold that,
across a New York clock change.

**The module reads no clock and carries no ephemeris.** The app hands it
`lonOf` and `Date.now()`, the same shape `arc-solver.js` takes, which is what lets
X5 put the Moon exactly on a line boundary and read the minute either side. X1
loads it with the clock and Intl both broken, and X18 fails on any storage API.

**The order is declared, never sorted.** The app's `PLNS` order, each derived
body after its source. An order computed from positions moves with the sky, and
an order that moves is one somebody eventually reads as meaning something.

**Numbers only.** No gate names, no keynotes, no sentence in the module (X17)
and none on the card beyond its headings and one line when there is no birth
date. Interpretive text for this layer waits on review (Open Gate 5). No field
counts, ranks or remembers anything (X16), and a reading knows nothing about
yesterday, so there is nothing a streak could be built from.

**The card is on Today in both shells and is not inside the alignment.** The
alignment can be stepped to another date through `horoNow()`; this card is always
now, so `gnowVals()` asks `Date.now()` and never `horoNow()`. It memoises one
reading per minute in `_gnow`, which the clock tick replaces on the minute.
**The split is drawn only from a birth date the reader gave.** `dob()` falls back
to a demo date for the rest of Today, and splitting against that would put gates
in a chart nobody has, so with no birth date the card lists the sky and says
what would complete it. **A stored date is not enough**: first run writes the
placeholder into the default profile, so `birthDate` is set while the banner
says none of it is yours. The gate is `usingSampleBirth()` as well, which is how
the first build of this card got it wrong. "In your chart" wears `--ac2-hi` on a `--ac2` border,
never `--ac`: whether a gate is natal is not an action.

## Connection charts
`hd-composite.js` overlays two bodygraphs and returns structured data: which of
the thirty six channels complete only when the two are together, which both
people already close alone, which one closes and the other does not, and which
the pair does not reach at all. It renders inside Synastry rather than as a
ninth Spirit page, because Synastry is already the two person surface and
already carries the consent story, the one sided label and the partner picker.

**Six states, not four.** Electromagnetic (one gate each, different gates),
companionship (both hold the whole channel), dominance (one holds it whole, the
other holds neither gate), compromise (one holds it whole, the other holds one
gate of it), shared gate (the same single gate both sides, which is not one of
the four and is reported as resonance), and absent. The first version folded
dominance and compromise together, which threw away the difference between
"they hold this and you do not touch it" and "they hold this and you have half
of it", and it filed shared gates under absent, so two people who both carry
gate 34 were told the channel was out of reach of both: true of the channel,
false about them.

**Direction is not optional.** Dominance and compromise are asymmetric, and a
row that says a channel is dominant *between* two people has described neither
of them and invited the reader to fill in the blank, usually wrongly. Every such
row carries who holds it and who does not, by name, and swapping the two people
inverts it. C9 asserts that.

**The word is about a channel and never about a person.** `CONFIG_CAUTION` is
returned on every dominance and compromise row and rendered beside the row, not
in a tooltip and not in a footnote: read carelessly next to a real
relationship this vocabulary can validate a coercive dynamic or manufacture
suspicion in a healthy one. Nobody is labelled dominant anywhere. C11 to C15
assert the sentence is present where it belongs and absent where it does not.

**There is no score, and there will not be one.** No percentage, no rating, no
ranking, no best match, and no field that could be turned into one without
adding arithmetic that is deliberately absent. Rows C24 to C26 assert it over
the whole returned object, so a helper that adds one fails the gate. Counts are
kept because a count is a fact about channels and stops being one the moment it
is divided by anything. Note that the astrology synastry ring on the same screen
DOES carry a 0 to 100 figure: that predates this and is a separate feature, and
if the rule is meant to cover it too, that is a product decision with its own
change.

**A bodygraph is personality and design.** The composite reads `hdGatesFor()`,
which collects both passes exactly as `hdChart()` does for the reader's own.
The first version read `synGatesOf()`, which walks an astrology chart: ten
bodies, about thirteen gates, roughly half a bodygraph each. Overlaying two half
charts finds a fraction of the channels that are there and reports the rest as
absent, which is a confident wrong answer.

**The layers stay apart on the page.** The calculated line is always visible,
the tradition and the question sit behind tap to expand, and the third is never
a statement about either person or about the relationship. This is the same
three part shape `animal-symbolism.js` and `dream-symbols.js` keep, and it is
how the labelling requirement is met without reintroducing the epistemic badges
V1.6.0 removed: the headings carry it, and group R still passes.

**Twelve saved people, and the cap refuses rather than trims.** A cap that
truncates deletes somebody's saved person to make room and says nothing. A list
already longer than twelve, from the build that allowed forty, is left alone:
the limit is on adding. Keeping a typed person is off by default and the privacy
notice sits beside the switch that does it, not in a policy nobody opens. A card
someone sent is mutual; a birth date the reader typed is not; the reading says
which of the two it is looking at.

**The synastry form could not open.** Twelve literals in the `off` bag sat
after the spread of `formVals` and won, so `synFormOpen` was false in every
state that returned `off`. The state where it is most needed is the empty one:
no second profile, no card, nobody typed, which is exactly where the screen
offers to take somebody. The handler existed and the switch flipped and nothing
appeared.

## Counting, and what it may never hold
`analytics.js` counts names of features and days. It is off until a reader
turns it on in Settings, off means the store is absent rather than withheld, and
turning it off again deletes what was gathered.

**The shape is the promise.** `emit()` takes one argument, a name from a fixed
list. There is no payload parameter, so no call site can attach a journal line,
a chart, a birth date or a search term even by accident, and the only writer
writes a day stamp, a recognised name and an integer. A policy about what
callers should do would be weaker than a signature that gives them nowhere to
put it. Row A5 asserts it by handing `emit()` invented private data and then
searching the raw store for it.

**The endpoint is dark.** `exportPayload()` builds exactly what would be sent
so the shape can be reviewed; `transmit()` refuses every time because
`ENDPOINT` is null. Wiring an address is a deliberate change with its own
consent copy, not a constant to be filled in quietly.

**It cannot interrupt anybody.** There is no notification in this build, and the
way this module stays inside quiet hours and category controls is by having
nothing in it that can raise one. Row A13 asserts the API is never reached, and
it tests for a call rather than for the word, so the header can explain itself.

`docs/ANALYTICS-EVENTS.md` is that schema written out, and row A17 asserts the
two lists are identical: a name added to the module and not to the page fails
the gate rather than shipping undocumented.

## Dated timing, and what earns a row
Three features share one engine and one rule, and the rule is the part worth
keeping.

`transitWindows()` walks day by day from 210 days back to 120 ahead and returns
every contact between the slow movers and the natal points as a run with an
opening date, a closest date and a closing date. Mars is the fastest body in it:
the Moon crosses everything monthly and clears it inside a day, so a Moon window
is a row that is true, unfalsifiable and useless. Orbs are tighter than the
wheel's, because a Pluto window drawn at 8 degrees does not close inside a
lifetime. **It is not `horoArc()` and must not be folded into it.** horoArc
starts from a contact that is live today and asks how long it has been loud;
this starts from nothing and finds the windows that opened and closed in March,
which is the only way an entry written in March can be told what it was written
under.

**`tlAll()` is the reader's own hand and nothing else.** It is what "marked
moments" counts and what the weekly reflection reads. The timeline screen reads
`tlLine()`, which merges the sky in and stamps each of the reader's entries with
the window covering its date. Merging sky rows into `tlAll()` would inflate a
count of what the reader did with a list of what the sky did.

**A window has to earn its row.** It appears only if it is open today or if
something the reader actually wrote falls inside it, capped at `TL_SKY_MAX`. The
first build merged every window the scan found and put thirty Mars rows above
three real entries, which is the record turned into the app talking to itself.
Future windows are never merged: a forecast inside a record is the one thing
that screen has never been.

**The month reading is dated, not gated.** A computed reading cannot be scarce,
and locking the page until the 1st would be a date invented to look like an
event. So it says which month it is for, when the next one lands, and when you
are reading ahead. The stepper is clamped to the scan window rather than
offering months the arithmetic cannot see.

**The synastry card carries no birth data.** First names, the figure, the band,
the count and three contacts. The score is derived from two charts and does not
contain them, which is what makes the picture safe to send. A one sided reading
says so on the card: the screen carries that line, and a card that dropped it on
the way out would be the app claiming an agreement on the reader's behalf, to an
audience that cannot see the screen. It paints from live tokens through
`cardToken()`, so a card shared from dawn is a dawn card.

## The search bar is one index over the whole app
`searchAll(q)` is the index and it is the only one. `dtSearchGroups()` and
`vtSearchGroups()` are one line each that call it, because a result that exists
on the desktop and not on the phone is the same fault as a Library card writing
an address whose screen is somewhere else.

**It reached two shelves out of fifteen.** Placements and the 360 Sabian
degrees, while the help text beside the control already promised the journal and
the atlases and the empty line told the reader those two were all there was. It
reaches every screen and every room now, the reader's own record, their
placements and their numbers, the practices, the 78 cards, the 64 hexagrams, the
dream registry, the animals, the repeating numbers, the gates and channels and
centres and types and profiles and lines, the astrology reference, the degrees,
the people saved on this device, and the lines that answer.

**A row never writes state. It names a target, and `searchGo()` resolves it
against the shell standing there.** That is the whole routing rule, and it is
the one that is easy to undo: the desktop sets a `spiritView`, the phone leaves
it null and scrolls its pager to the page holding the same thing. A row that set
`spiritView: 'dream'` on the phone would paint a Spirit view no vertical shell
draws, which is a blank screen with no way back, and the state would look
correct while it did. `searchTab()`, `searchSpirit()`, `searchLib()` and
`searchAngel()` are the four target builders, and Synchronicities needs the
fourth for exactly the reason `goAngelGo()` is a method rather than a `setState`.

**Where the module has its own search, the bar calls it.** The hexagrams, the
dream images and the animals come back through `IChing.search`,
`DreamSymbols.search` and `AnimalSymbolism.suggest`, so what the bar finds and
what the room finds cannot disagree. The crisis lines come through
`CrisisDirectory.search` and, when the hit is not one of the urgent ones, the
row opens the Yellow Pages' own "show everything" filter as well as the
category, or it lands on a page that does not show the thing that was searched
for.

**`searchGo()` clears what is open inside a room, and `openPath()` does not
have to.** An address names a room; a search result names a card, a hexagram, an
image or a degree. Without `ttCard`, `icHex`, `dlOpen` and `lexDeg` in the clean
bag, opening the tarot deck from the shelf showed whatever card the last search
happened to land on.

**A word inside a paragraph is a real hit and a weak one, and it is capped at
three per group.** Unbounded, one common word turned the astrology group into
all twelve signs: every one of them says "well" somewhere in its paragraph.
Titles first, then keywords, then the writing, and `SEARCH_DEEP` is what keeps
the last of those from burying the thing the reader typed.

**The safety rows wear `--crisis`, and the row glyph is themed for it.** Every
row in the sheet is drawn identically, so without a per-row colour the Get Help
destination and every crisis line would have taken `--ac`, which is the one
thing R6b says must never happen. The glyph is `aria-hidden` decoration, so
nothing in the contrast table moves.

**The scan costs nothing until it is used.** `dtVals()` and `vtVals()` call it
on every render, and it returns an empty array before it reads a single registry
under two characters.

N37 to N39 are the coverage, and they drive rather than read: the control is
clicked, the field is typed into through a real input event, and the row is
clicked, because the failure this surface can have is the one that reads as
correct. N37b names all thirteen groups one query at a time, so a shelf that
silently drops out of the index is a red row rather than a quiet absence.

## Aspects teach what the contact offers
Five tables, and each has one job. `ASP_MEAN` is the short gloss inside
generated sentences. `ASP_SHORT` is one sentence, used as a row subtitle and at
the end of the Today contact paragraph. `ASP_NATURE` is the teaching text for
the sheet: the angle, what the elements and modalities at that angle have to do
with each other, and what the contact makes possible. `ASP_POSS` and `ASP_PLAY`
are the possibility layer. **Do not put `ASP_NATURE` in a subtitle**: it is
several sentences, and a row that carries a paragraph stops being a row.

The writing is framed as what the aspect offers the reader to work with, not as
a verdict on them. A square is productive tension that builds skill, not a
problem; a trine is a gift that deepens with use, not a free pass. `ASP_CLOSE`
is untouched and must stay that way: `check-aspect-text` holds its closers to
single unique sentences naming both bodies.

## Learn from Atlas lands on the entry, not the section
`hdAtlasTo(sec, item)` takes the section and the entry inside it. The item is
slugged by `atlasSlug()` and stored as `atlasItem`; `atlasVals()` gives every
block and row an anchor, `incommon-atlas-<section>-<slug>`, and the entry asked
for wears a green left edge so the eye finds it after the scroll.
`scrollAtlasIntoView()` looks for the entry first and falls back to the section
after 900ms, so an item that matches nothing still lands somewhere true.

The idents: a Type by its name, a profile by its key (`1/3` slugs to `1-3`), a
centre by its `CENTERS` key, a gate row as `g<n>`, a channel row by its pair, a
strategy and an authority by name. The chart popup passes the one it is about.
Learn from Atlas passes the reader's own entry where the tab has one
(`hdAtlasItemFor()`: Type and sleep give the Type, mood the authority, work the
strategy) and null otherwise, which lands on the section as before.

**A search row cannot scroll**, because its target is state rather than a
handler. `syncAtlasItem()`, called from the one `componentDidUpdate`, scrolls
once per new item. `hdAtlasTo` marks the item it scrolls to itself in
`_atlasScrolled`, so the two never run the same scroll twice. Toggling a section
and leaving the atlas clear `atlasItem`, and every clean bag that clears
`atlasSec` clears it too.

The anchors are on the HD atlas markup only. Astropedia shares the block and
row markup byte for byte, so an edit to it has to be anchored on `atlasSecs`, or
a replace across the file lands on four sites instead of two.

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

## The files that carry the version, and the ones that must not
Two files are named for the build they validate and are renamed when the version
moves: `verification/Verification v6.0.dc.html` and `app/handoff/tests-v6.0.js`.
They were `Verification V1.4.dc.html` and `tests-v14.js` until 28 August 2026,
which by then meant a suite named for V1.4 validating a v5.9 build. Live
references live in exactly three places, all of them runners: the harness itself
and the two phase runners beside it.

**Historical documents keep the old name on purpose.** `docs/canonical-build-report.md`,
`docs/PROJECT_MEMORY.txt`, `docs/inCommon-BRIEFING.md`,
`data-contracts/STORAGE-AUDIT-2026-08-16.md` and the README inside the deploy
bundle all say a run was performed by `Verification V1.4.dc.html`. That is a
record of what happened on a date, not a pointer to be maintained, and editing it
to say a filename that did not exist at the time would be falsifying the record
to keep a grep tidy.

**A version in a filename is only correct while it is current**, which is why
almost nothing else carries one. `tests-v13.js`, `Verification V1.3.dc.html`,
`docs/changelog-v1.2.md` and the run screenshots are all named for the thing
they actually are, and renaming any of them to v5.9 would make them lie.

## Verification
`Verification v6.0.dc.html` runs `handoff/tests-v6.0.js`: Checks A to E plus S
(short desktop), the functional sweep, the theme phase, the removal phase
(group R, V1.6.0), the ADA phase (group G, V1.7.0) and the new surfaces phase
(group N). 276 assertions. A full run takes 25+ minutes.

The theme phase runs four identities now rather than three, which is what took
the total from 236 to 252: eight cases at two widths at four rows each. The T ids
are positional, computed from the case index, so adding an identity renumbers
every row after it. That is inherent to the way they are built and not a sign
anything was removed.

**The theme phase runs at two widths.** `THEME_WIDTHS` is exported so G13 can
assert the coverage is still two wide. A contrast gate measured at one size is
how a palette ships a failing pair at the other. `Verification R (removal
phase).dc.html` runs group R alone in about a minute, `Verification N - new
surfaces.dc.html` does the same for group N in about two, `Verification T -
theme phase.dc.html` runs the 64 theme rows in about 40 seconds,
`Verification G - ada phase.dc.html` runs the 33 ADA rows in about 55, and
`Verification F - functional sweep.dc.html` runs the 16 F rows in about 50.

`Verification M - acceptance matrix.dc.html` runs checks A, B, C, D and S, 90
rows across five viewports, in about 35 seconds, and `Verification E -
breakpoint crossing.dc.html` runs the 5 resize rows in about 12. **Every phase
has a runner of its own now**, so no part of the suite needs the 25 minute run
to be exercised.

**`runCross` is the one phase that RETURNS its rows instead of filling a
sink.** Every other export takes a sink and writes into it as it goes, so an
overrun keeps what it proved and reports the rest as unreached. This one does
not, so a timeout loses all five rows and the report is empty rather than
short. An empty result from group E is never "nothing to say": it is the run
failing to finish, and the E runner says so in those words rather than showing
a blank list.

**The matrix rows are NOT uniform across viewports, and that is by design.**
A runs 17, B runs 19, C, D and S run 18. Row `10b` fires only for a desktop
shell narrower than 1024, which is B alone, and row `11` measures a
multi-column Today inside the desktop branch the phone never enters. A guard
that demands every viewport ran the same rows reddens every healthy run, which
is a guard somebody switches off. **What truncation actually looks like is a
viewport that stops part way through**, and the rows run in numeric order, so
the M runner checks that each viewport REACHED ROW 18 and that no `tag + '0'`
boot guard appeared. That catches a cut run without assuming which
conditionals fired.

**The F runner counts its rows, because this phase has failed by vanishing.**
The theme rows once rode at the tail of `runSweep`, the sweep overran its cap,
and they were cut from the total rather than failing: the report read 108 where
it should have read 134, and it was green. So the F runner prints how many rows
arrived against how many the suite declares, and calls a short run void.
**Sixteen is the number, not seventeen.** The suite makes seventeen `t('F...')`
calls and `F0` is a boot guard that only fires when the app fails to load and
then returns, so a healthy run never emits it. Every phase has a guard row of
that shape, so subtract it before setting a count: a guard that reddens every
good run is a guard somebody switches off.

**The G runner probes for real focus before it starts, and says so on the
page.** G1c and G12b cannot pass in a window the OS has not focused, and their
failure looks like a build defect: G1c reports the skip link as
`{tall:false, wide:false, visible:false}` and G12b reports
`{announced:false, canLeave:true}`. The runner runs CLAUDE.md's own one line
test on a throwaway button first, and prints a red banner naming
`document.activeElement`, `matches(':focus')` and `document.hasFocus()` when
they disagree. An automated browser pane typically cannot hold that focus even
after a real click, so **31 of 33 is the expected clean result there, not a
regression**. To separate blocked from broken without focus, check that
`[data-skip]:focus` still resolves: it carries `min-height:44px !important`,
`width:auto !important` and `clip:auto !important`, which is exactly what G1c
measures, so a rule that is present and a row that is red is an unfocused
window rather than a broken skip link.

**Group H is the cover, and it is the only phase that loads `app/cover.html`.**
Every other phase points at the app through `SRC`, so until this existed the
first screen a visitor meets had no gate at all. `runCover` derives the cover
path from the app path rather than taking a second one, so there is one thing to
keep in step. `Verification H - cover phase.dc.html` runs it alone in about a
minute; it is also the last phase in the full runner, because it leaves the
origin different.

**H2 is the row the phase exists for, and it reads pixels rather than status.**
A shader that fails to compile does not throw: the loop runs, the first frame
lands, `__EH_LIVE` goes true and the reveal fires over a canvas painting
nothing. That happened during this page's build, from one duplicated brace, and
the console said `useProgram: program not valid`, which names no brace. So H2
reads the drawing buffer back through `gl.readPixels` and asks whether anything
was painted. It reads the WHOLE buffer, not the middle: the middle of this image
is the silhouette, which is genuinely black, so a centre sample would report a
working render as a dead one. **A first frame landing is not proof a shader
compiled**, and no row anywhere should be written as though it were.

**Two rows in this phase were flaky before they were right, and both for the
same reason.** The cover is a raytracer, and in a 1280x860 frame one animation
frame can cost several hundred milliseconds, so anything read at a fixed offset
after an action can land before the handler has run. `coverScrollTo` waited
260ms and reported the glyph at the PREVIOUS scroll position, which reads
exactly like a stuck handler; it waits on the scroll event now, and `scrollFade`
is registered first so it has already run by the time that fires. H15 sampled
once at 700ms and reported the exit as not running when it was; it polls for the
drop now. A test that fails on a slow machine and passes on a fast one is worse
than no test.

**The phase unregisters service workers at both ends.** H16 navigates its frame
to the app, and the app registers one; on the next run the cover is served
through it and the boot never completes, so the phase fails its own H1 the
second time it is run in one tab. `frame()` busts the document cache and this is
the other half of the same problem, because subresources are served cache first.

**A red H1 with no context is the environment, not the build.** The runner
probes for WebGL before it starts and prints a banner naming
`GL_VENDOR = Disabled` and `BindToCurrentSequence failed`, which is what a GPU
process that has given out after many contexts in one session reports. That is
the same courtesy the G runner pays its two focus dependent rows. Restart the
browser and run the phase in a fresh window rather than reading it as a broken
cover.

**H2 needs a real animation loop, and an automated browser pane does not supply
one.** A pane that only produces frames while a screenshot is being captured
puts `dt` in the band `drop()` treats as a stalled machine, so the quality
ladder falls several rungs at once and the step count goes from 190 toward 62.
The bright core survives that and the faint sky does not, which is exactly the
shape of the failure: `painted` passes on `max` every time and only
`mostlyLit > 50` falls. Measured over five runs on 8 September 2026, the same
bytes read 95.2%, 95.2%, 24.5%, 24.5% and 6.9% lit. **A varying litPct on an
unchanged build is the frame supply, not the cover.** H11, H12 and H15 went red
under the same conditions and they are the timing rows named above, so the
whole failure set has one cause.

**That was settled by diffing rather than by another run**, after four runs had
falsified a degraded GPU and then the launch surface. `deploy/<version>/index.html`
is `app/cover.html` with three differences and no more: the build's header
comment and the app address in its two places. There is no third thing for a
bundle run to be measuring, so a bundle H2 that reds while the source is green
is the pane. Diff the two covers before spending a run on the difference
between them.


**The theme sweep measures `#/today` and nothing else.** Four identities, each
hardened, at two widths, and every one of the 64 rows is taken on the Today
screen: `runThemes` navigates there and stays. So a green theme phase says
nothing about a palette on any other surface, and a new screen is NOT covered
by it however many rows are green. Circle was measured separately, by hand,
over the same eight cases: worst pair 6.00:1 in midnight, 42 elements per case,
no tap target under 44px in any palette. If that reads as a gap worth closing,
the fix is a second screen in the sweep rather than trusting the count.

**Read `__vTThemeMs`, never the wall clock.** A backgrounded tab clamps
`setTimeout` to roughly one call a minute, and this phase once reported 428s for
about 10s of work because of it. The T runner prints its own elapsed time and
says so. Front the tab before believing a duration.

**Group N drives, it does not read attributes.** The card is painted and its
pixels are sampled, the windows are recomputed and checked against their own
scan bounds, the month stepper is walked to both ends, and the animal field is
typed into through a real input event, because setting state cannot reproduce
the failure that field has actually had. N3 is the row the card feature exists
for: no birth date, time or place reaches the picture. N20 to N24 are the Dream
Journal, and N21 is the one to keep: the detector shipped with two bugs that
each inflated a hit count without ever throwing, and an overcounting detector is
worse than a broken one because it reads as a finding.

**N37 to N39 are the search bar**, and they are driven rather than read for
the same reason: the control is clicked, the field is typed into through a real
input event, and the row is clicked. Reading `searchAll()` would pass on a
build whose sheet rendered with its handlers missing. N37b names all thirteen
groups one query at a time, so a shelf that drops out of the index is a red row
rather than a quiet absence, and N38 is the routing rule on the shell that
breaks it: a row that wrote a Spirit view on the phone would close the sheet
onto a blank screen and look correct doing it.

**N29 to N35 are Circle, and they are driven for the same reason.** The chips
are clicked and the cap is walked into through the real controls, because the
failure this surface can have is the one that reads as correct: a section that
renders with its handlers missing. Reading `circleVals()` would pass on exactly
that build. Proven by sabotage rather than assumed: making the chip handler
inert while leaving the chips on screen turns **N30, N32, N33, N34 and N35**
red, and N29 and N31 stay green because the section still renders, which is
what those two are about.

**N31 is the shell-level twin of G16 and G23.** The module cannot return a
score or a seat; N31 asserts the SCREEN does not add one above it, over the
rendered text and the keys the shell hands the template. Adding `ciAnchorRank`
to the vals and a `78%` to a sentence turns it red on both counts. N32 is the
matching one for order: it asserts the rendered section is identical with the
members chosen the other way round, which is where somebody sorting chips for
tidiness would reintroduce exactly what G20 catches, in the one place G20
cannot see. **Keep N32's `twoMembers` assertion**: without it the row passes on
a dead build, because two empty sections are also identical.

`FRIENDS_KEY` joins the two stores this phase already puts back, because a
circle needs other people on the device and a card is how a reader gets one.
Three stores now, and the finally block restores all three.

**The Spirit pager rows are N36 and N36b, and were `N18`/`N18b` twice over.**
Two different pairs carried those ids: the third kind of sighting, which
CLAUDE.md cites above and which sits correctly between N17 and N20, and the
Spirit pager. Both ran and both passed, so nothing was ever skipped, but the
report printed four rows under two ids and a failure in one would have been
ambiguous against the other. The pager pair moved, because it was the one out
of numeric place. **An id is an identity, not a position**: N29 to N33 run
between N4b and N5, and N34 to N36b run near the end, so do not renumber a row
to make the run order tidy. The only rule is that an id appears once.

**A run starts from a clean origin, or it grades the run before it.** The
harness serves the app from its own origin and several phases need the first run
screen, so a second run in the same tab finds first run already dismissed and a
profile already made: G4 and G7 then fail on a build that is fine, and the F5
frame misses its boot budget beside them. Clear that origin between full runs.
The two rows that cannot pass in a hidden or unfocused pane are G1c and G12b,
and both need real focus. The one line test that separates that from a real
failure: focus the element, then compare `document.activeElement` against
`el.matches(":focus")`. In an unfocused window the first is true and the second
is false, so no `:focus` rule applies and no focus event fires, while every
other measurement looks normal. The skip link styling itself is sound: the
runtime compiles `style-focus` into a class rule with `!important` on every
property, which is what lets it beat the element’s own inline styles.

**A phase that writes must put it back.** Group N journals, and the harness runs
the app in an iframe on the same origin, so its writes land in the same
localStorage a reader uses. Both keys it can touch, the profile memories and the
manual Throughline entries, are snapshotted before anything writes and restored
in the finally block. A phase that leaves entries behind is a phase that edits
the reader’s record.

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

**Oki and the safety router are unwired, not deleted.** No module is loaded,
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
over source, `checkVoice()` in `oki-voice-v144.js` (which builds its
detector from `String.fromCharCode(8212, 8211)` so the file can obey the rule
it enforces), and the NEVER block in the Oki system prompt.

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
Inline styles only, with one stylesheet: the build paints from the first
streamed character. `handoff/tokens.css` documents the system but is not loaded.

**The one sheet lives in the document `<head>`, never in `<helmet>`.** It is
the shell frame rather than the styling: `body{margin:0}`, `html,body` height
and overflow, the snap and pager rules, the `[data-vt-page] > [data-screen-label]`
rules that decide how a phone page scrolls, and the keyframes. It was declared
in the helmet, and the runtime hoists helmet children by snapshotting them once
and copying each one's textContent: a style element is copied by its text, the
snapshot is taken while the document is still streaming, and what landed in the
head was an empty sheet that was never filled again. The app then painted with
the browser's defaults, starting with an 8px body margin, so the shell sat inset
on all four sides and 16px taller than the viewport. On a phone that reads as an
app smaller than the screen that can be dragged around.

It failed silently for a long time: the sheet was in the file, the tag was in
the head, and nine rows of the acceptance matrix (A5, A6, A8, A9, A10, B5, B6,
C5, C6, and D5/D6/S5/S6 at the wider sizes) were the only thing saying so.
`build-bundle.js` refuses to ship a bundle whose head has no sheet, or whose
helmet has one again.

## The cover, and the two pages the site has now
`app/cover.html` is the Event Horizon screen: a Schwarzschild raytracer, the
wordmark, and "enter here" under it. It is the first thing a visitor meets, and it is the
reason the site has two pages instead of one. The app is `app.html` in the
bundle now; `index.html` is the cover.

**The shader half is the design and is ported, never retyped.** `VERT`,
`COMMON`, `BRIGHT_FRAG`, `DOWN_FRAG` and `UP_FRAG` came across byte for byte and
were checked against the reference after the edits, because the constants in
them are physical rather than art directed. Two shaders now differ:
`MAIN_FRAG` gains the mark at the very end, below the photon ring and the
shimmer, with the geodesic integration and everything above it untouched;
`FINAL_FRAG` lost the grain and gained the same mark on the way out. The mark
is one function, `markLight()`, in its own `MARK` string, which both shaders
prepend after `COMMON` so `COMMON` itself stays byte for byte.

**`FINAL_FRAG` lost the grain whole.** The two
layer film grain was taken out whole rather than turned down: a `uGrain` of 0.0
is a dial somebody restores by accident, and an absent pass is a decision. The
uniform went, `uSeed` went with it because it existed only to reseed the hash
per frame, `h21` went because grain was its only caller, and `c = max(c, 0.0)`
went because `aces()` already returns `clamp(..., 0.0, 1.0)` and the only thing
that could drive a channel below zero was grain subtracted from a near black
pixel. Chromatic aberration, bloom, vignette and the ACES fit are untouched, so
the post chain is still five passes and only the last one is shorter.

**The four corner brackets are gone too**, DOM and both CSS blocks. Nothing
else read `.frame`, so the removal is total rather than hidden behind an
opacity of zero.

**The horizon wears the mark's violet, and that is the whole of the merge.**
A single ring on the silhouette's own edge, at `uHoleR`, which is the photon
ring's radius. The boundary of the shadow is not a drawn circle: it is where the
last light that could reach the camera came round, so the outline rides on light
already there rather than being laid over it. It is centred on `uHoleS`, the
hole's projected screen position, which the camera already hands both shaders
every frame, so it tracks the drift instead of sitting at the middle of the
viewport, and it is drawn in `MAIN_FRAG` rather than the post pass so the bright
pass sees it: it blooms, catches the vignette and takes the aberration with
everything else. That is the difference between merged and pasted on.

The stroke is `0.173` of the radius, the mark's own ratio from
`build-icons.js`, applied to the one circle there is. It is the only number in
that block that is not free. Nothing sizes to the frame any more, so nothing can
run off the edges.

**The full mark was here for two revisions and was removed on purpose.** Two
circles of the mark's own proportions, centres one radius apart, with the
silhouette lying in their shared lens and green on the lens boundary. Every
number in it was right and it still read as a graphic sitting on the picture,
which is the one thing it existed not to be. What survived is the part that was
never sitting on anything. If it is ever rebuilt, the geometry is
`R0 0.26`, centres `+-0.13`, stroke `0.045`, so the offset is `R/2`, and
`uMarkR` wants to be exactly twice the hole's screen radius so the lens is as
wide as the shadow and tangent to it.

**There are two rims, and the green one is a departure that was taken on
purpose.** `inCommon Logo/README.md` reserves `#2fff8f` for what two wholes
share and says it is never decoration. With one circle on screen nothing is
being shared, so the green line inside the violet one is not carrying that
meaning: it is a second rim, chosen for the cover. The rule it departs from is
a real one, so the departure is recorded here rather than quietly taken, and
the next person reading this should not have to work out whether it was
noticed.

Two things keep it honest. It is thin, so it is a line rather than a shape
competing with the one control on the page, which is the cream "enter here"
and stays cream. And it is the only green on the cover, so nothing else can start
borrowing it.

**The violet is desaturated in the shader, not rewritten as a new hex.** The
source still says `#8b5cf6`, so its provenance is readable, and the pull toward
its own luminance is the adjustment: one number, visible and tunable. A muted
literal in its place would be a violet matching nothing in the palette and
saying nothing about where it came from. It is mixed after `lin()`, in linear
space, because that is where the channels are proportional to light;
desaturating the sRGB triplet first bends the hue on the way through.

**The stroke is half the mark's ratio, and that is the one knowing departure
from it.** `build-icons.js` draws at `0.173` of the radius. That ratio was set
for a shape the size of an icon, and this circle is the width of the screen,
where it reads as a band rather than an outline. The green line is half again,
and drawn as a Gaussian rather than a cut band: at two pixels a smoothstep edge
crawls when the camera drifts, and the lowest quality tier renders the scene at
`0.58` of the buffer, which is where that would show first.

**Two additive lights in the same pixels sum toward white, and this block hit
that twice.** Green laid on violet made the lens boundary pale cyan; then the
horizon ring, running through the lens interior where the green bleed lived,
came out cyan top and bottom and violet only at the left and right extremes, so
the one line whose whole job was to outline the hole changed colour around it.
Both were fixed by subtraction rather than by tuning. Neither can happen now
that one colour is drawn, but any second light added here has to say which
colour owns the pixels it lands on.

**A spliced shader block is a shader that will not compile, and it fails
black.** Replacing this block by slicing between two anchors left a duplicate
closing brace, which ended `main()` early: the page painted nothing and the
console said `useProgram: program not valid` and `Feedback loop formed between
Framebuffer and active Texture`, neither of which names a brace. `__EH_LIVE`
still went true, because the loop runs whether or not the program is valid, so
the reveal fired over a black canvas. Read the block back after editing it, and
do not trust a first frame as proof the shader compiled.

**A decorated I is set into the shadow, and it arrives last.** An illuminated
initial: a slab serif stem and two serif bars in `#fff8e7`, the wordmark's own
colour, with hairlines, lozenges and two flanking points in `#8b5cf6` held back
by opacity rather than by a new hex, the same discipline the rim follows. It is
SVG rather than shader, because a letter drawn as a signed distance field is an
approximation of type and the ornament would be painful in GLSL, and it costs
nothing to overlay here: it sits on the shadow, which is the one region of the
image with no detail to blend into.

**It is placed from the render, not from the viewport.** `uHoleS` and `uHoleR`
are the same two numbers the rim is drawn from, so the letter cannot drift away
from the hole it sits in. `uHoleS` is in the shader's screen space, where y runs
up and x is already multiplied by the aspect, so the horizontal offset from the
centre of the viewport is `uHoleS.x * W / (2 * aspect)` and the vertical is
`-uHoleS.y * H / 2`, negated because CSS pixels run down. The box is centred by
`left/top/margin` and the transform is the offset from there, which leaves
`transform-origin` at the box centre so the scale is about the letter.

**It is `aria-hidden`.** The accessible name of this page is the `h1` that says
inCommon, and a decorative initial announcing itself as the letter I would be
noise on top of it.

**Three beats now, in order, off the one scroll number.** The wordmark leaves by
`0.42`, the rims arrive over `0.14` to `0.55`, and the letter is set in over
`0.62` to `0.92`. Each overlaps the one before it so the screen is never empty
of everything, but the letter does not begin until the rims are done: it is what
they were making room for, and starting it early reads as three things fading at
once rather than a sequence. The page went from `260vh` to `300vh` for that beat
and not for a longer scroll.

**`body.signal-lost .mark` is back in CSS, as the fallback for a dead module.**
`scrollFade()` writes the wordmark's opacity inline and folds the dim in, and an
inline style beats the rule, so while the module lives the rule is inert. It
matters when the module is not: with no WebGL the `THREE.WebGLRenderer`
constructor throws, nothing below it in the module runs, and `scrollFade` is
never defined. The 9 second fallback still fires, because it is a plain script
in the head for exactly this reason, and without the rule the wordmark would sit
at full strength on top of the SIGNAL LOST message it is meant to defer to. That
was live for three revisions after the dim was moved into JS.

**The way in is a subtitle, and it waits for the title.** The arrow in the top
corner is gone. "enter here" sits under the wordmark inside `.markwrap`, in
Marcellus at roughly a third of the wordmark's size, and fades in over 2800ms
starting 3200ms after `body.live`, so the title has finished arriving before
anything asks to be clicked. Its glow is a cream and violet `text-shadow` that
breathes slowly once it is up, and it is cream rather than `--ac` for the same
reason the arrow was white. Three things own opacity and each owns one: the
reveal is on `.markwrap`, the late fade on `.sub`, and the scroll fade on the
link itself, written inline by `scrollFade()`, which also sets it
`visibility: hidden` once it has gone so a keyboard cannot tab to it. It does
not take the signal-lost dim: with the renderer gone it is the one thing on the
page still doing its job. It is named by its own text, so there is no
`aria-label` to drift from what is on screen, and H5 and `build-bundle.js` both
look for the words.

**The link does not just navigate: the rim becomes the logo and the render
goes out under it.** At `uExit` 0 the drawing is exactly the horizon rim, two
circles of the hole's radius with coincident centres, which paints as one. As
it runs to 1 the centres separate to `R/2`, the radius grows, the stroke
thickens from the thin rim to the mark's `0.173R`, and the whole thing walks
from `uHoleS` to the middle of the screen. The mark is not drawn over the rim.
It is the rim, moved.

**The logo lands at a size the frame can hold.** It used to finish at twice the
hole's radius, and the mark is three radii wide, so on a portrait phone it
landed at 118% of the screen's width. It finishes at the smallest of 1.7 hole
radii, `0.43` of the half width and `0.60` of the half height: about 68% of a
portrait phone's width and 54% of a desktop's. Its glow is violet and drawn
only where neither the stroke nor the lens is, because two additive lights in
the same pixels sum toward white, and it rises over the second half of the exit
so the rim at rest carries none.

**The logo is drawn in `FINAL_FRAG` once the exit starts, and that is what keeps
it sharp.** The scene buffer is capped at 1.6 device pixels and cut further by
the quality ladder, so a mark drawn there and upscaled came out soft on a 3x
phone. `markLight()` crossfades from the scene pass to the final pass over the
first 18% of the exit, with weights `1 - xf` and `xf` so the handover moves
where it is drawn and not how bright it is, and the final pass hands it an edge
of three quarters of a device pixel through `uPx`. The canvas itself is sized at
the screen's density up to 3 while the scene stays at 1.6: the final pass is a
few texture reads, and the picture is the same bilinear upscale it always was,
done by the GPU instead of the compositor. `finalU` holds the SAME `uRim` and
`uExit` objects as `mainU`, not copies, so there is nothing to keep in step. Its
colours sit under the bloom threshold, so leaving the bloom behind costs nothing.

**`col *= 1.0 - uExit` is why the scene leaves and the mark stays.** Everything
above that line is the render, so one multiply takes the disk, the jets, the
starfield and the sky to black together, and the mark is added below it, in
both passes. Do not
reach for `#veil` here: it sits above the canvas and below the wordmark, so
raising it would black out the mark along with everything else, and the mark is
drawn IN the canvas.

**Three gates stage the colour, and each one exists because of a specific
wrong frame.** `split` (0.15 to 0.75) holds the green lens boundary back until
the circles have actually parted, because at `e = 0` they are coincident and
`arcs` would otherwise claim half of the single ring: that read as a ring half
violet and half green before anything had moved. `fill` (0.55 to 1.0) then
fills the lens solid and hands the boundary back to violet, so what lands is
the mark as the identity sheet draws it rather than the outlined version the
rim wears in the picture. And the fill carries `(1.0 - ring)` so the violet
stroke passes OVER the green instead of summing with it.

**That last one is the third time this block has hit the same fault.** Green
laid on violet made the lens boundary pale cyan; the horizon rim running
through the lens interior came out cyan top and bottom; and the lens fill under
the ring band went pale at the edge. Two additive lights in the same pixels sum
toward white and ACES finishes the job. Any new light drawn in this block has
to say which colour owns the pixels it lands on.

**Green filling the lens is the one place on the cover it means what the logo
says it means.** `inCommon Logo/README.md` reserves `#2fff8f` for what two
wholes share. At rest the cover has one circle and the green is a second rim,
a departure recorded above. At the end of the exit there are two wholes and a
lens, so the fill is the rule rather than an exception to it, and there is no
control left on screen for it to compete with.

**`preventDefault` is conditional, and the href is real markup.** The handler
returns without touching the event unless the first frame has landed, the
context is alive and no exit is in flight, so every other state navigates the
way an anchor does. With the module dead the anchor is all there is, which is
why the target is written in the HTML rather than assigned by JS.

**`exiting` is declared above `scrollFade`, not beside the handler.**
`scrollFade` reads it and runs at module scope, so a `let` sitting further down
is in the temporal dead zone: it throws a `ReferenceError` and takes the whole
module with it. The DOM layers are faded by writing opacity inline in the exit
step rather than through a class, because `scrollFade` already owns those
properties inline and an inline style beats a rule, and `scrollFade` returns
early while exiting so a scroll event mid transition cannot put the wordmark
back. The exit sets `transition: none` on `.markwrap` before its first write,
because the reveal transition applies to inline writes too: without it every
write landed 800ms late and 2600ms slow, and the title sat at half strength
over the finished logo as the page left. The fade starts from the computed
opacity, so a click before the reveal finishes does not jump the title up.

**The quality ladder has nine rungs, and the bottom three exist because the old
floor killed a driver.** It stopped at `0.58 / 116`, and on an Intel UHD 600
that floor still cost about 98ms a frame. Held there, the machine logged three
`igfx` driver resets in five minutes and Chrome then disabled WebGL for the
whole profile, which is a failure the page cannot report because the page is
gone. A ladder whose last rung still kills the driver has no last rung. Cost is
pixels times steps and both halves come down together, so `0.28 / 62` is about
an eighth of the old floor rather than half of it. The top is unchanged: nothing
a capable GPU sees has moved.

**Lowering the floor alone would not have worked, and this is the part to keep.**
`buildBloom()` sized its five levels off `W` and `H`, which are the full device
resolution, so the nine bloom passes cost the same at the bottom of the ladder
as at the top and a tier drop bought nothing back from roughly a third of the
frame. The chain is sized off the scene buffer now. It is sampled by UV in the
final pass, so its absolute size is free to follow the tier, and the only
visible effect is a slightly softer bloom on a machine that is already choosing
softness over stalling. Both tier-change paths rebuild the chain as well as the
scene, or the two disagree until the next resize.

**One rung at a time is the wrong response to a frame that is already too late.**
Falling a single tier per two slow frames took six slow frames to reach the old
floor, and on a machine timing out its display driver those are the frames that
lose the context. `drop()` sizes the fall from how far over budget the frame
was, so a 400ms frame falls four rungs and a 160ms frame falls two, and a single
frame over 150ms is enough on its own rather than needing a second. The
50-frame averaging window still governs ordinary drift in both directions.

**The measured symptom to recognise.** `GL_VENDOR = Disabled` and
`BindToCurrentSequence failed` in the console, WebGL unavailable in every
browser on the machine including ones that were never pointed at this page, and
`Display driver igfx stopped responding and has successfully recovered` in the
Windows System log. That is Chrome's GPU blocklist after repeated driver
crashes, not a fault in the page, and it clears on a real reboot.


**The page scrolls, and nothing scrolls with it.** Every layer is
`position: fixed`, so the scroll moves no pixels: it drives one number, read off
the scrollbar, which fades the wordmark out over the first stretch and brings
`uMark` in over the second, overlapping in the middle so the screen is never
empty of both. The height is what makes the gesture exist at all, because
`overflow: hidden` leaves nothing to link to, and a wheel handler faking a
scroll would take the scrollbar from keyboard and assistive users to animate an
opacity.

**The reveal and the scroll fade are two opacities on nested elements.**
`.markwrap` carries the reveal, a CSS transition fired once by `body.live`;
`.mark` carries the scroll fade, which JS writes per scroll event. The browser
multiplies them and neither has to know the other exists. Put both on one
element and the per frame write and the 2600ms transition fight over the
property, and the fade lags the scrollbar by whatever is left of the reveal.
`scrollFade()` also owns the signal-lost dim, which used to be a CSS rule: an
inline style it could not see would have won against it.

**`scrollFade()` is deliberately not inside `frame()`.** With no WebGL the canvas
is a black rectangle carrying the SIGNAL LOST message, and a wordmark that
refused to move while the page scrolled would read as a second failure on top
of the first. `BCRIT` is
`3*sqrt(3)/2`, which falls out of integrating the null geodesic rather than
being tuned in, and it is what sets the silhouette's apparent size and the
photon ring together. The disk bounds, the step clamp, the four star shells and
the Doppler exponents are measured values. A description of this image does not
reproduce it, so a rewrite from one is a different picture wearing its name.

**The catch-all points at the app, not at the cover.** An address that names a
screen is a reader asking for that screen, and answering it with a cover and a
link is one more click with nothing on the page saying why. So `/` is the
cover, and `/*` is the app, in all three `_redirects` files: the bundle's own,
and the two generated ones at the repo root and in `deploy/`.

**The one case no redirect can reach is a hash on the bare address**, and it is
the shape every link written before the cover existed has. `/#/spirit/dreams`
arrives at the server as `/` with nothing in the request to distinguish it, so
the cover forwards it itself, in a synchronous script above the renderer,
`location.replace` so the cover does not become a back button stop on the way
to a screen somebody asked for by name. It runs on document load, which is how
a real deep link arrives. Testing it by changing the hash on an already loaded
cover proves nothing: that is a same document navigation and the script does
not re-run.

**`start_url` names the app.** It was `./`, which is the cover now, so an
installed home screen icon would have opened the door instead of the room.
`scope` stays `./` so both pages are inside it.

**three.js is vendored, and the reason is the same one React is.** The design
reference pulled it from unpkg with SRI hashes. On a landing screen for an app
whose whole promise is that nothing leaves the device, a third party request
before the reader has clicked anything is the wrong first contact. Both files
were downloaded from the pinned `three@0.184.0` URLs and checked against those
exact hashes before they were committed, and both matched; the hashes are not
carried into the import map, because SRI asks whether a CDN handed over the
bytes that were asked for and these are served from this origin now.

**The upstream filenames are kept on purpose.** `three.module.js` imports
`./three.core.js` by that name, so renaming either means editing vendored
source, and an edit to vendored source is an edit the next re-vendor silently
drops. The version lives in the file, as `REVISION = '184'`. Both are declared
`vendored` in `check-layer-boundary.js`, because an unclassified `app/*.js` is
a failure there and that is the whole point of the rule.

**`build-bundle.js` builds both pages and refuses on four faults.** The app
address is the only thing that differs between the source shell and the bundle,
and it appears twice, once as the href on "enter here" and once inside the hash
forward, so the build asserts the count is exactly two before rewriting.
Rewriting one and missing the other ships a cover whose link works and whose deep
links go
nowhere, and nothing on screen would report it. It also refuses a cover with no
`canvas#view`, one with no labelled way into the app, one carrying a dash, and a
build with either three.js file missing, because a cover that cannot reach its
renderer is the SIGNAL LOST message on a machine perfectly capable of drawing
the thing.

Its dash detector is built from `String.fromCharCode`, the same way
`checkVoice()` in `oki-voice-v144.js` builds its own: a file that enforces the
no dash rule by containing a dash fails the sweep it exists to serve. The
escape spelling counts too, so neither may be written there.

**`shellFor()` in both service workers picks the page that was asked for.** With
one page the offline answer to any navigation was that page. With two it is a
choice, and answering `/app.html` with the cover is the wrong one. Only the bare
address falls back to the cover, which is the same split the redirects make on
the server. Both three.js files are precached in both workers: they are ES
modules behind an import map, so they arrive as their own requests and a cover
without them paints nothing.

**What the cover still fetches from a third party is the Marcellus webfont.**
That is the same call the app already makes, and the fallback stack means the
wordmark renders either way, but it is the one request left on the landing
screen and it is worth knowing rather than discovering.

**The theme phase does not cover this screen.** `runThemes` navigates to
`#/today` and stays there, so the 64 contrast rows say nothing about the cover,
and the cover is deliberately outside the theme system anyway: it is not the
app shell, it paints its own Deep Field palette from the shader, and its link
is cream rather than `--ac` because it is a cover rather than a primary action
inside the shell. Do not correct that to green.

## Where things live in this repository
Added when the files were migrated out of the design tool's flat export, where
the app, the modules, the doc pages and the harness were all siblings. Every
relative path was rewritten once to match, and three conventions came out of it
that a later change is most likely to break:

- **`app/` stays flat.** `app/inCommonApp v2.dc.html` loads its modules as
  `./module.js`. A module that moves into a subfolder stops loading, silently.
  That includes the seven dormant ones: filing them under `app/dormant/` breaks
  six component pages and the service-worker precache, sixteen references, and
  nothing throws.
- **`app/components/` reaches up.** Every page there writes `../module.js`.
- **`verification/` is a sibling of `app/`, not a child.** The runners write
  `../app/support.js` and `../app/handoff/tests-v6.0.js`, and
  `Verification v6.0` reads the app through a `SRC` constant, not a `src=`
  attribute, so a grep for script tags does not find it.

- **The folder is named for the version, and the version moves once per
  deployment.** `deploy/v6.2/` holds the bundle stamped `incommon-v6.2`, and
  those two numbers are the same number on purpose: a folder called `v1.7`
  holding a bundle stamped `v5.8` told a reader nothing. Rebuilding does not
  earn a bump. The stamp changes when a build has been deployed AND confirmed
  live, and the folder is renamed in the same change, because a shelf of near
  identical folders and two files claiming one version with different bytes is
  the failure `check-deployed.js` exists to catch.
- **There are three ways this repo reaches a host and all three now work.**
  Git connected, where `netlify.toml` names the publish directory. Dragging
  `deploy/v6.2/`, where that folder's own `_redirects` and `_headers` travel
  with it. And dragging the REPOSITORY, which is the one a person actually
  does because the repo is the thing on their desktop, and which failed
  silently for as long as it was the only shape nothing covered: `publish` is
  a build setting, a dropped folder runs no build, so the host serves a
  directory with no page in it and every address 404s.
  The root `_redirects` closes that. It is **generated by
  `tools/build-bundle.js` on every build** rather than written by hand,
  because it names the bundle folder and the bundle folder is renamed at every
  version bump: a hand written copy is a copy that points at last version's
  folder the first time somebody forgets. Assets are listed by name rather than
  splatted, because the app's paths are relative and `./manifest.json`
  resolving at the site root has to be rewritten into the bundle.
- **There are two service workers and they are different programs.**
  `app/sw.js` is the source shell and precaches all 39 modules separately,
  because `app/` is flat and the app loads them as separate script tags.
  `deploy/<version>/sw.js` precaches one inlined `index.html` and five install
  assets. **Their cache names must differ**, because `activate()` deletes every
  key that is not its own: two workers agreeing on a name means whichever
  activated last serves the other's files under its own fetch rules. **Their
  release number must not differ.** So the source shell is
  `incommon-dev-<version>` and the bundle is `incommon-<version>`, and
  `build-bundle.js` refuses to build on either fault, naming which one it hit.
  This is declared twice and asserted equal, the same way the channel table is
  held to the topology. It drifted to `v2.4` against a shipped `v6.0` for as
  long as nothing compared them.
- **Both workers fetch the shell fresh and everything else cache first.**
  A navigation goes to the network and falls back to cache when there is no
  signal. Cache first for a navigation is how a deploy fails to arrive: a phone
  holding v3.6 kept being served v3.6 out of its own cache while v3.8 sat
  correct and complete on the server. `app/sw.js` had the same fault until it
  was ported across, which is also why a harness frame could be handed a stale
  build. `frame()` still busts the cache, and that stays: belt and braces on the
  one thing that silently grades the wrong bytes.
- **React is precached, and without it a cached shell is a blank page.** The
  header of `app/sw.js` promises everything the app needs is local, and it is:
  `window.__resources` maps the two unpkg URLs to the files in `app/`. They were
  not in `PRECACHE` and never reached the cache at runtime either, so an offline
  launch served the document and all 35 modules out of cache and then **mounted
  nothing**, with no error worth the name. Verified both ways: with the server
  stopped, the app now boots, draws a 15 body wheel, renders four connection
  groups and a Circle Ground, all computed on the device. The bundle never had
  this fault because React is inlined into its `index.html`.
- **A precache entry that names a missing file costs nothing and tells nobody.**
  `./inCommon (offline).html` sat in `PRECACHE` long after that file stopped
  existing, and the install is tolerant by design (`c.add(u).catch(...)`, one
  miss must not sink the whole thing), so nothing ever reported it. It is
  removed. `docs/PROJECT_MEMORY.txt` and `docs/canonical-build-report.md` still
  name it and keep it: they record what was true on a date. The job that file
  did, a standalone offline build, is the deploy bundle now.
- **The bundle is written beside itself and renamed into place.** A plain write
  to `deploy/<version>/index.html` truncates the shipped bundle to zero the
  instant it opens the file, so a write that fails part way through does not
  leave the previous bundle alone: it destroys it. A full disk did exactly
  that, and the deploy folder was left holding a zero byte `index.html` that
  looks like a build and serves nothing. `build-bundle.js` writes
  `index.html.building` in the same folder and renames, which is atomic and
  happens only once the whole bundle is on disk. Keep the temp file in that
  folder: a rename across volumes is a copy, and the guarantee goes with it.
  On ENOSPC it now says how much room it needed and that the old bundle is
  untouched.
- **`deploy/` is a shelf, not a site.** It holds one folder per shipped
  bundle, so the thing you upload is `deploy/v6.2/`. A host pointed at
  `deploy/` itself, or at the repo root, serves a directory with no page in
  it: the deploy succeeds and the link is broken, which is a failure with no
  error anywhere in it. Three files say which folder, and they must agree:
  `publish` in `netlify.toml`, `BUNDLE` in `tools/build-bundle.js`, and
  `LOCAL` in `tools/check-deployed.js`. Both tools pointed at
  `deploy/index.html` for as long as the bundle sat there and silently stopped
  working when it moved: the build refused to run and the deploy check refused
  to compare, and neither said anything a build log would show.
- **The bundle folder carries its own serving rules.** `_redirects` resolves
  every path to `index.html`, because the router is the hash and the server
  never sees it, so without that line every address but the bare one is a 404.
  `_headers` puts `must-revalidate` on `index.html`, `sw.js` and
  `manifest.json`, which is what makes a redeploy reach an installed phone.
  They live beside the bundle rather than in `netlify.toml` so a dragged folder
  and a deploy from the repo are served identically, and no rule is written
  twice.

The mark lives once, in `inCommon Logo/icons/`; `app/manifest.json`,
`app/sw.js` and the app helmet point at it by `../inCommon%20Logo/icons/`. The
copies inside `deploy/` are build output, because a deploy directory is
uploaded whole.

`tools/` holds twenty-four scripts. Eighteen are gates and are worth running
before you believe a change is done: `run-tests-node.js`, `run-fixtures.js`,
`run-module-tests.js`, `check-purple-text.js`, `check-dead-controls.js`,
`token-compare.js`, `check-competitor-surface.js`, `check-layer-boundary.js`,
`check-aspect-text.js`, `check-chart-tone.js`, `check-prose-repeats.js`,
`check-hd-atlas-map.js`, `check-point-registry.js`, `check-ephemeris-engine.js`,
`check-harmonic.js`, `check-patterns.js`, `check-harmonic-patterns.js`,
`check-registry-integration.js`.
Four generate:
`build-bundle.js`, `build-icons.js`,
`build-ui-icons.js`, `build-gazetteer.js`. `check-deployed.js` compares what
is served with what was built. `bench-ephemeris.js` measures the position
cache and asserts it did not change an answer.

The last four gates arrived with the V1.6 and v6.1 passes and this paragraph
did not move with them, so it said eight for as long as there were twelve.
**Count the folder rather than trusting this sentence**, and correct it here
when a script is added: an inventory that is wrong is worse than no inventory,
because somebody runs the list and believes they have run the gates.

The four gates after that (`check-harmonic.js`, `check-patterns.js`,
`check-harmonic-patterns.js`, `check-registry-integration.js`) came from
porting `harmonic.test.ts`, `patterns.test.ts`, `harmonicPatterns.test.ts`
and `integration.test.ts` off Jest globals (`describe`/`test`/`expect`),
which this repo has never been able to run: no `package.json`, no
`node_modules`, no Jest anywhere. Porting them surfaced that `patterns.ts`,
`harmonic.ts` and `harmonicPatterns.ts` themselves used extensionless
relative imports and mixed type-only interfaces into value imports, the
same bug `engine.ts` already needed fixing for its own gate to load: none
of the three could actually be `require()`d until that was corrected too,
so these four gates are also what makes the underlying modules loadable at
all, not only what tests them.

Two real defects came out of writing tests the old ones never actually ran,
and both are now fixed rather than left flagged.

`detectBoomerang()` in `patterns.ts` required one point sextile (60°) to
BOTH ends of an opposition; that is geometrically impossible (confirmed by
exhaustive search), so it could never match any chart, ever, despite being
surfaced in forecast copy as a pattern the app claims to detect. Checked
against a published definition (Astrology Weekly's "Yods and Boomerangs": a
Boomerang is a Yod plus a fourth planet opposing the apex, nothing more),
`detectBoomerang()` was rewritten to that actual shape, which is always
achievable. `apex` on the returned pattern now names the release planet
(opposite the Yod's own apex), since that is the notable addition a
Boomerang has over a plain Yod, and `app/forecast/content/{headlines,explainer}.ts`
were corrected from "T-Square with an escape route" to "Yod with an escape
route" to match.

`isGoldenYodIn5thHarmonic()` in `harmonicPatterns.ts` filtered radix
patterns by name containing "Yod", which only ever matched the classical
(quincunx/sextile) Yod from `detectYod()` - never an actual Golden Yod,
because no detector for one existed anywhere in this codebase.
`patterns.ts`'s `ASPECT_ORBS` already carried `'quintile'` and `'biquintile'`
entries with nothing using either: `detectGoldenYod()` (a quintile [72°]
between two planets, both biquintile [144°] from a third - checked against
fifth-harmonic literature, and a genuinely different pattern from the
classical Yod, not a variant of it) is the missing detector, added to
Tier 1. And "becomes a Grand Trine at H5" was never the real fifth-harmonic
signature: a quintile times 5 is exactly 360° and a biquintile times 5 is
720° (also 0° mod 360°), so a real Golden Yod's three points land on the
SAME longitude at H5 - a conjunction, not 120° apart.
`isGoldenYodIn5thHarmonic()` now takes the radix points directly and checks
for that conjunction itself, rather than asking `detectPatterns()` to name
a pattern three exactly-conjunct points can never produce.

Run `"../Migration 8-26/verify-migration.sh" .` from the repo root after moving
any file. A broken script tag is invisible in a screenshot.
