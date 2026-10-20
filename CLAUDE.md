# inCommon: project rules

## One codebase
`inCommonApp v2.dc.html` is the canonical build and the only app file. Two
shells live inside it, chosen by viewport width in `shellVals()` off
`state.dtW`: vertical snap shell below 820px, desktop sidebar shell at 820px
and up. **Do not create phone / tablet / 9:16 / desktop forks.** 820px is the
only breakpoint that changes the component tree.

## Ephemeris architecture (V1.0.0)
**Read this first: none of the router below supplies a position.** It is
initialised in `componentDidMount()` and closed on unmount, and nothing between
those two calls asks it for anything; `swisseph-wasm` has never been installed.
Every chart comes from `lonOf()` and `lonRaw()` in the app class, and the ten
astral bodies there come from `astronomy-engine` now: see "The ten astral bodies
come from a library" below. The list is kept because the files still load.

**Dual-backend ephemeris system** with graceful fallback. Modules:
- `ephemeris-points.js`: centralized point registry (17 points, single source of truth)
- `ephemeris-backend-current.js`: the fallback, existing simplified ephemeris (Kepler + analytical)
- `ephemeris-backend-swiss.js`: the primary, Swiss Ephemeris WASM (if `npm install swisseph-wasm` run)
- `ephemeris-router.js`: the orchestrator. Selects backend, handles fallback transparently
- `ephemeris-integration.js`: the migration helper. Eases integration into Component lifecycle
- `ephemeris-cache.js`: optional in-memory memoization (existing, unchanged)

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

## My Charts is three charts, and the Library is six tabs
Decided by the owner on 2 October 2026. The Spirit tab is named **My Charts**
(the id, the address `/spirit` and the state key stay `spirit`) and holds three
charts, in this order: Human Design, Astrology, Numerology. On the phone that is
a pager of three pages (`VT_TABS`), on the desktop the hub of three cards, and
Today lists the same three through the same `chartCards`. Synchronicities,
Synastry, the tarot reading, the Dream Journal and the Month Ahead are no longer
Spirit pages, and the Throughline accordion that sat on the desktop hub is gone.

**The Month Ahead is removed from the project**, not hidden: `monthVals()`,
`monthReading()` and its helpers, `gateRuns()`, `fmtMonth()`, the state keys, the
address, the search row and the N9 to N12b rows are all deleted, and those ids
stay retired because an id is an identity, not a position. `/spirit/month` now
lands on the hub like any unknown Spirit address.

**The Library is six tabs, in this order** (`LIB_SUBS`, state key `libSub`, the
default is `study`): Study, Journal, Readings, Throughline, Archive and The
Commons. Each room belongs to exactly one tab (`LIB_VIEW_SUB`) and is entered
from it, so Back returns to it. `libSubOf()` normalises a stored value, because a
device can hold the old `library` key.

| Tab | Holds, in this order |
|---|---|
| Study | Human Design Atlas, Astropedia, The Numbers (coming soon: a dashed card, deliberately not a control), My Tarot, Dream Symbols, Sabian Lexicon |
| Journal | Synchronicities, Dream Journal, then the ten practices grouped by caution: Universal caution first, then Mild caution, each group alphabetical. A leading quotation mark does not count when sorting, so the Spiritual Bypass check is filed under S |
| Readings | Tarot on the left half and The Book of Changes on the right, a divider between. Each half opens its own room (`libView` `reading` and `iching`) |
| Throughline | the record, as it was |
| Archive | the Archive, as it was |
| The Commons | Synastry, and the Circle that renders inside it |

**Every item is listed once.** The Archive no longer carries a card back to the
Throughline, the desktop Today page no longer carries a Throughline button, the
Yellow Pages row is not in the Study list, and the Book of Changes is not in
Study as well as Readings. Throughline and Archive live in the Library and
nowhere else: N45 holds that, and N41 to N46 hold the rest of this table, so a
list that is true once cannot quietly become true twice.

**The help square is drawn once per screen.** It is a 52px square carrying the
inCommon symbol, wearing `--crisis`, never the action colour. On the phone it is
the Get Help button on every screen (`helpGo`, the dock), and the Library does
NOT draw its own beside it: the phone's Library shell has no banner (N47). On the
desktop there is no dock button, so the Library carries the Self Help Yellow Pages
square as a `position: sticky` footer on every tab (`libBanner`), hidden inside a
room or a practice because those are not tabs (N44). Do not add a second square
to a shell that already has one.

**Rooms the old Spirit pages became.** `libView` `angel` (Synchronicities,
`/library/synchronicities`, gate `libAngel`), `dreamj` (the Dream Journal,
`/library/dream-journal`, `libDreamJ`), `reading` (the tarot reading,
`/library/readings/tarot`, `libReading`), and The Commons is a tab rather than a
room (`/library/commons`, `libSyn`). `LIB_PATHS` is keyed by `libView`. The old
Spirit addresses (`/spirit/synchronicities`, `/spirit/angel-numbers`,
`/spirit/dreams`, `/spirit/tarot`, `/spirit/synastry`, `/spirit/together`,
`/spirit/i-ching`) and `/library/practices` are kept as aliases in `openPath()`,
and `currentPath()` rewrites the address to the new one on arrival.

**The rule that outlived the move: a screen has to exist in the shell the reader
is standing in.** The phone and the desktop each carry their own Library markup,
so the six tabs, the rooms and the banner are written once and placed in both,
and `vtVals` and `dtVals` both name the rooms in their `libShell` exclusion list.
A `libView` that list does not name paints the shelf with every gate switched
off, which is a blank screen with no way back. The old fault of that shape was
`libView: 'angel'` on the phone while Synchronicities was a pager page.

**The matching rule for the values: a room's vals are present exactly when the
room is open**, and the room's gate is the state (`libView === 'angel'`), not the
width. `angelVals()`, `tarotVals()` and `dreamVals()` are asked for on the phone
only while their room is the one showing. The gate must not be `vertical` alone
any more: that was right while a page was always mounted in a pager, and wrong
now, because it would paint the room under every Library tab.

**Six tabs do not fit a phone.** The strip scrolls sideways, and
`syncLibTabIntoView()` (from the one `componentDidUpdate`) moves its own
`scrollLeft` so a tab chosen by an address or a search row is on screen.
It must not use `scrollIntoView`, which would also move the snapped page.

## Synchronicities is one page with two lookups
The page was Angel Number Encounters and it read repeating numbers. It is now
Synchronicities, and it reads a repeating number or a repeated animal sighting.
The vals function is still `angelVals()` and the gate is `libAngel` (it was
`spiritAngel` while this was a Spirit page: see "My Charts is three charts"),
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

`/library/synchronicities` is the address, a Journal room. `/spirit/synchronicities`
and `/spirit/angel-numbers` are kept as aliases in `openPath()`, the same way
`/spirit/together` is kept for Synastry.

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
`libDreamJ`, addressed `/library/dream-journal`: a Journal room on both shells
(`libView: 'dreamj'`). It was the eighth Spirit pager page until 2 October 2026,
and `/spirit/dreams` is kept as an alias.

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
of quietly stepping back through it. The Oracle is the one screen that calls a
model, by the owner's decision, and it does not lend that to anything else: see
"The Oracle took Throughline's seat" below.

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

## Planet is astral body, and where it is not
The owner asked for the word replaced, and it is, everywhere a reader can see
it. This section exists because the terminology test three sections above would
have KEPT it: planet is the field's own word rather than anyone's brand, so by
that test a private substitute costs comprehension and buys nothing. The test
was applied, it argued for keeping, and the owner decided otherwise. That is
the owner's call and it is recorded here rather than argued again.

**The rename was classified by position, never by guessing.** A space is fatal
in an identifier and harmless in a sentence, so the two cases cannot share one
substitution. Every byte of every source file was marked CODE, STRING, COMMENT
or TEXT, and the word was replaced according to where it stood: identifiers
became camelCase (`wheelPlanets` to `wheelBodies`, `openPlanet` to `openBody`,
`planetInSign` to `astralBodyInSign`, `planet1`/`planet2` to `body1`/`body2`),
and prose became "astral body", article aware, so "a planet" became "an astral
body" rather than "a astral body".

**Template placeholders are identifiers wearing quotes.** `{planet1}` inside a
catalog string is the key of the params object the substituting code passes, so
it had to move with the identifier or every headline would render the brace.
341 of them, across `app/i18n/` and `app/forecast/`, and the i18n suite's
placeholder parity row (L5/I5) is what proves the two halves still agree. The
one miss the first pass made was the other shape of the same thing: a bare
`'planet'` inside a string, in the test fixture's expected-placeholder list,
which is a name rather than a sentence and had to become `'body'`.

**Three places keep the old word on purpose, and each is a decision.**
`planetary` is a different word from planet and was left, which keeps
`planetaryNodeOf`, the eight `planetary nodes` and one reader-facing
"planetary placements" as they were. `'planet'` survives as a quoted literal
in the CAT_COLOR paragraph above, because that paragraph is the record of a bug
whose content WAS that literal. And `app/gazetteer-world.js` was never touched:
Planeta Rica is a town in Colombia and a reader born there has to be able to
find it.

**Astronomy keeps its own words, and that is a ruled exception.** Dwarf planet
and minor planet are formal classifications, from the IAU and the Minor Planet
Center, and they sit in `CAT_LABEL` and in the source notes beside asteroid,
centaur, comet and TNO, which are formal classifications too and were never in
scope. Renaming those two and not the other four made them the odd ones out.
Six sites carry them and none is app vocabulary:

| Where | What it says |
|---|---|
| `CAT_LABEL` | TNOs & Dwarf Planets |
| `placement-content.js` Eris, Haumea, Makemake | "The dwarf planet, found in ..." |
| `placement-content.js` TNO section comment | "trans-Neptunian objects and dwarf planets" |
| `pointRegistry.ts` the `tno` category | same |
| `bodySourceNote()` | "orbital elements for minor planet 10 Hygiea" |

Two sentences beyond the labels were plainly false after a blanket swap and are
corrected rather than exempted, because they are claims about the solar system.
Eris "led astronomers to redefine what a planet is", which is the 2006
definition and the entire reason that body is famous; and Sedna "never comes
near the planets", where the word means the eight and nothing else would carry
the sentence. **The test for this class: if the sentence would still be true
with the word changed, it is vocabulary and the rename applies. If it becomes
false, astronomy owns the word.**

**Reports, records and the historical docs were left alone**, which is the same
rule the version-in-a-filename section states: a record of what was written on
a date is not a pointer to be maintained. The ~20 report `.md` files at the repo
root, `docs/`, `verification/` and `data-contracts/` all still say planet, and
that is correct.

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

**Circle renders inside Synastry in both shells, and Synastry is The Commons
tab of the Library.** `circleVals()`, gated on nothing but the modules being
present, spread beside `synVals()` at the single call site, and the markup sits
inside `libSyn` and OUTSIDE `synOpen` so it is reachable when no pair is chosen.
It is not a page of its own: this is where it belongs, which is the same call
`hd-composite` made, and a screen of its own would be a second place to open the
same group.

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
They can reach `window.MinorBodies`, which `minor-bodies-ephemeris.js` installs,
uninstalls and recalibrates, so their answer is not a function of `t` alone.
Cache a null taken before install and the Expanded Chart says "not computed"
for the rest of the session. The bench drives that case rather than asserting it.
All five now read `minor-body-elements.js` FIRST (the asteroids since their
fetch, Chiron since 29 September 2026), which is static generated data and is a
pure function of `t`, so they could be cached on that path. They are not, because the fallback is still there behind them and a cache
that is only sometimes safe is a cache nobody can reason about.

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

**Seventy-nine of the eighty compute; the one that does not says why.**
Chiron and the four asteroids come from `window.MinorBodies`. The eight
planetary nodes (Standish/JPL mean elements), Lilith (mean) and Selena, the
three named comets (Halley/Hale-Bopp/Hyakutake, mundane only), Vertex and
Antivertex, Part of Spirit, the Aries Point and the Sun/Moon midpoint are
formulas inside the app. The other fifty-one (asteroids, centaurs, TNOs,
Eris and Sedna, and the eight Hamburg hypotheticals) come from
`minor-body-elements.js`: see "The expanded chart's bodies are fetched"
below. Lilith (osculating) is the one left `status: 'unavailable'`, with its
own reason (`LILITH_OSC_WHY`) rather than a generic one, by the rule
engine.ts's own header states: a missing position is honest, an invented one
is not. Vertex, Antivertex and Part of Spirit also stay unavailable without
a birth time, and say that.

**Ring 1 and ring 2 are a stagger band, not a distance from centre.** Both
sit inside the sign boundary, where the small card's glyphs already lived;
ring 1 (the ten bodies, both nodes, Chiron, the four main asteroids, Lilith,
Selena) staggers near that boundary at the original size, ring 2 (everything
else this wheel draws) staggers in a smaller band further toward the centre,
in a smaller glyph, so eighty points does not compete with the sixteen core
ones for the same rim space. `RING1_IDS` is the membership list.

**Comets are the one category excluded from the wheel by default.**
`fullChart()` computes and lists them unconditionally - the table and the
seven sub-tables below it always carry all three - but `placedRows` (which
feeds `wheelBodies`/`wheelLabels`, the SVG) drops `category === 'comet'`
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
`wheelBodies`' SVG `<title>` and every points-table row's `title` attribute
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

## The expanded chart's bodies are fetched, and every one is measured
Fifty-one of the eighty expanded points shipped with no orbital elements, so
the table read "n/a: no ephemeris" and, worse, clicking any expanded point
opened a blank page: `placementVals()` handed `PlacementContent.build()` a
body it had no entry for, `build()` returned null, and the page switched
itself off. Even the twenty-nine that had positions drew nothing on click.
Both halves were fixed, and the rule for each is worth keeping.

**Positions: `minor-body-elements.js`, generated, never typed.**
`tools/fetch-minor-body-elements.js` asks NASA JPL Horizons for heliocentric
osculating elements (J2000 ecliptic) every year from 1900 to 2100 and for
Horizons' own geocentric apparent longitude every 181 days, then keeps, per
body, the widest epoch spacing whose worst case against those references
stays within 0.1 degree: twenty years for the Kuiper belt, one year for the
near Earth asteroids, two for the main belt. The module solves Kepler from
the NEAREST epoch, which is why this works: an osculating set is exact at its
epoch and drifts only by what the planets do in the gap. (The perturbers are
the planets: this is a fact about the solar system rather than app vocabulary.) Worst case over all
52 real bodies is 0.128 degree (Apollo); 47 of the 52 are under 0.07.

**Ceres, Pallas, Juno and Vesta were the last four real bodies not fetched, and
they were wrong by up to 169 degrees.** They sat on
`minor-bodies-ephemeris.js`'s single epoch coplanar model with mean longitudes
that module's own header called provisional while claiming "a few tenths of a
degree", which was never measured and was wrong by two orders of magnitude.
Against 404 Horizons apparent longitudes from 1900 to 2100 the shipped elements
measured an RMS of 35 to 110 degrees, flat across every window from 1980-2010 to
1900-2100, so a wrong phase rather than drift: a reader's Ceres could be in the
opposite sign and nothing in the build could tell. They are fetched now, at
0.032 to 0.058 degree, and they earn their degree symbol by that measurement.
Chiron was left out here on the argument that a fifty year orbit Saturn and
Uranus keep perturbing is chaotic. That is true of one set of elements carried
across the century, which is what the fitted fallback is (0.92 degrees at
worst), and not of an osculating set taken at the nearest epoch, which is what
this module does for every centaur. **Chiron is fetched now**, since 29
September 2026, when the Celestial Codex was found asking Horizons for it: 51
epochs four years apart, 0.025 degrees at worst against 404 references.

**The fetcher merges now, and that is what made a four body change reviewable.**
`--only id,id` fetches just those and seeds `DATA` from the generated block
already on disk, so the other 56 entries are re-serialised from their own bytes.
Horizons revises its orbit solutions, so a full refetch moves recorded worst
cases that the change never touched, and a diff nobody can read is a diff nobody
checks. Verified on the run that added the four: 56 of 56 pre-existing entries
byte identical, in the module and in the fixtures both.

**The fallback is fitted too, and it says what it is worth.** A missing
`minor-body-elements.js` should cost accuracy rather than the four bodies, which
is the order eris and sedna already use, so the elements behind it were fitted by
the method the Chiron block states: `a` published and held, `n` from it by Kepler
III, only `L0`, `e` and `varpi` free, half the references held out of the fit.
That takes 169 degrees to 9.1 (Ceres), 164 to 29.6 (Pallas), 153 to 7.9 (Juno)
and 71 to 2.3 (Vesta), and no further, because the limit is secular perturbation
rather than geometry: projecting the orbits in three dimensions was tried and
measured and moved Pallas only to 18.6. So `accuracyDeg` is per body and
`bodyAccuracyNote()` picks its sentence from the number, because one sentence
saying the sign holds is true of Chiron at 0.92 and plainly false of Pallas at
29.6. More epochs would fix it properly, and more epochs is exactly what
`minor-body-elements.js` already is: a fallback does not need a second copy of
the thing it falls back from.
The reduction (Meeus Sun, light time, precession, nutation, aberration) was
measured to 0.001 degree against the Swiss Ephemeris on the hypotheticals, so
the table is limited by elements, not arithmetic.

**The fetcher checks the name Horizons returns.** A mistyped designation is
a real, different asteroid and would look exactly right. It caught one on its
first run: Atlantis is 1198, and 2791 is Paradise.

**The hypotheticals are not fetched**, because they do not exist. Their
elements are the Witte/Sieggruen set refined by James Neely, as the Swiss
Ephemeris carries them (epoch and equinox J1900), and their references were
taken from swisseph-wasm. Their pages say they are not bodies.

**`tools/check-minor-body-elements.js` re-measures every recorded worst case**
against `tools/fixtures/minor-bodies-horizons.json` (24,240 positions), holds
every body under a 0.2 degree ceiling, asserts real bodies return null
outside the span they were measured over, and accounts for all 81 registry
ids: app formula, this module, or declared unavailable with the sentence the
page shows. Nudging one Hygiea epoch by 0.3 degree turns it red. The count is
81 rather than 80 because Part of Fortune joined the app's expanded registry,
and each id must be accounted for exactly ONCE, which is why moving the four
asteroids into this module also took them out of `APP_COMPUTED`.

**Degree symbols are earned by that number.** `degreeSafe()` lets a fetched
body name a degree when its measured worst case is at or under
`DEGREE_SAFE_WORST` (0.2). The comets do not: one osculating set each,
unmeasured across a lifetime. **There is no list of names any more.**
`DEGREE_SAFE_EXCEPT` held the four asteroids, then Chiron alone, and went when
Chiron was fetched: a list is what stays behind when a measurement moves. A
body this module does not carry, which for Chiron and the four asteroids means
the fitted fallback is drawing it, is judged by the fallback's own
`accuracyDeg`, so the same body names a degree from the fetched elements and
withholds it on the fitted ones. `degreeSafe()` lowercases a name before asking,
because the expanded chart addresses a point by id and the wheel by name, and a
name only lookup once let `pallas` through. Group E's row asserted a copy of the
list, then a rule over the list, and went red on a correct change both times;
E10 now runs the app's own `degreeSafe()`, lifted out of it, with the fetched
elements present and with them missing, under both spellings, and E10c names
Chiron. Making the fallback branch permissive turns both red.

**Readings: 75 entries in `placement-content.js`, keyed by registry id.**
Same fields and grammar as the 21 core bodies, because the same composer
reads them. `keyFor()` resolves the five ids that already had entries under
plain names; `label` is what a sentence says. The definition carries the
origin (myth, discovery, how the point is defined), because a minor point
without its origin is a keyword with nothing under it. The comet entries say
they are mundane on the page, and Hylonome's role names reaching someone
before any reading.

**A registry point is addressed by id, never by name.** Two points are named
Cupido (asteroid 763 and the Hamburg hypothetical). `pointKey(r)` is
`r.id || r.name` and every route into a placement page, the wheel's stagger
map, its labels, the highlight and the search rows use it. `pointLabel(r)`
adds "(Hamburg)" for the hypotheticals. `radiusFor` keyed by name was how the
labels of every expanded point silently vanished off the wheel mid-change.

**Two outer ring points are not aspected to each other.** With every body
placed, asteroid to hypothetical and centaur to TNO pairs were 393 of 708
contacts on the sample chart and tripled the overlay's render. A minor body is
read by what it touches among the astral bodies, lights, nodes, angles and ring 1.
`stelliums()` counts the core and ring 1 only, for the same reason: with
eighty points placed every sign holds three of something.

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

## The Aspects grid filters, and a bug it walked into on the way in
Tracing "filter by category involved" back to its source field surfaced a
defect that predates this pass: `CAT_LABEL`, `CAT_COLOR` and the Points
table's own `catOrder` all keyed the ten core bodies as `'planet'`, but
`fullChart()` has always stamped them `category:'body'` (`x.name.indexOf
('Node') !== -1 ? 'node' : 'body'`). Grouping the table by category filtered
`sorted` for `r.category === 'planet'`, which no row has ever carried, so
the "Astral Bodies & Nodes" section silently returned zero rows and the Sun
through Pluto simply never appeared in Group mode. The North and South
Node were unaffected by coincidence, since their own category really is
`'node'`. `CAT_COLOR`'s `'planet'` key had the same fault but no visible
symptom, because its call sites already fall back to the same green a
correct lookup would have returned. All three now key on `'body'`, matching
what the rows actually carry.

**Filter chips are two independent groups, OR'd inside each and AND'd
between them.** An aspect matches the category filter if EITHER end of the
pair carries the selected category, since an aspect belongs to both bodies
it connects, never to one alone. Both chip lists are built from what is
actually present in `asps` rather than a fixed nine-entry menu, so a chart
with no comet contacts never offers a Comets chip that would filter to
nothing.

**The row a reader clicks and the pair the wheel highlights read the same
array by construction, not by convention.** `chartExpandAspSel` stores the
clicked row's `id`, which is its index into `asps` as `chartExpandVals()`
builds it; the wheel's own `wheelBodies` computation calls
`natalAspects(expanded, {...})` with the identical arguments (rich mode,
same minor-aspect and minor-scale flags) to get an array that is
positionally identical, and resolves the same index against it. Two
separately-computed arrays staying in lockstep is not fragile here because
`natalAspects()` is a pure function of chart state: same inputs, same
output, every time. Filtering the grid's rendered rows never touches `id`,
so toggling a chip cannot point a live highlight at a different pair than
the one a reader actually clicked. The highlight is gated on
`chartExpandOpen`, because the small card's own "Expanded Chart" pill also
sets `chartMode:'expanded'` without opening this dialog, and a stale
selection leaking into that view would highlight a pair nobody clicked.

**"Exact" is one degree, stated rather than assumed.** The tradition does
not fix a single number for it, and `EXPANDED_ORBS` itself runs 2 to 10
depending on the aspect, so this figure is a stated choice for the grid's
own dot marker, not a value read off any existing table.

**Measured, not assumed, per CLAUDE.md's own standing rule for this
number.** `fullChart(true)` costs about 8.5ms cold and 0.3ms once its
`_fcStamp` memo is warm; `natalAspects(true, {rich:true, ...})` costs about
3.5ms over 199 pairs; the filter-chip and exact-flag passes added by this
work are one more O(n) walk over that same array and do not move the
total measurably. The full `chartExpandVals()` call, table, houses, chips
and all, measured under 8ms warm. No Web Worker was added for this: none
exists anywhere in this app (see "The expanded wheel" above), the total
is nowhere near the 150ms budget that precedent already argues from, and
`postMessage` would add a serialization cost to a computation that is
already cheaper than the round trip.

**`EXTENDED-POINTS-REFERENCE.md` is generated now, not hand-typed.** It
carried a header claiming to be auto-generated while reading "98 points"
and "81+ expanded" against a registry that has held 97 and 80 for as long
as `integration.test.ts` has asserted the count. `tools/
build-extended-points-doc.js` requires `ephemeris/pointRegistry.ts`
directly, the same way `check-point-registry.js` does, and writes every
count, category grouping and one-line symbolism from what the registry
actually exports. Re-run it after any registry change; the file is not
meant to be edited by hand again.

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
name a sign and an aspect and cannot name a degree, so on this fit
`degreeSafe()` withholds the Sabian symbol, and the page says why rather than
leaving a gap. Group E asserts the reference positions, the worst case, that `a`
was held, that Kepler still holds, and that the dead model stays dead. Measure
the body, record the worst case, let that decide what it may say.

**This fit is the fallback now.** Since 29 September 2026 Chiron comes from
`minor-body-elements.js` first, fetched from Horizons at 51 epochs and
measured at 0.025 degrees, so it names its degree like any fetched body (see
"Where the Codex computed better"). This fit draws Chiron only when that module
is missing, and the rule above still governs it there.

## The Book of Changes

`iching.js` holds all sixty four hexagrams and the casting engine; the room is
`/library/i-ching`, gate `libIChing`, vals `ichingLibVals()` for the reference
half and `ichingVals()` for the consultation.

**Both halves are one room, and that is not the shape the other systems use.**
Tarot is split: the reading is a Readings room, the deck is a Study room. This
one is not: the Book of Changes is a book you consult, so the consultation sits
at the front of the room that holds the sixty four, and the room is listed once,
on the Readings tab, on the right half beside the tarot reading.

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
stored standard offset again, every summer row goes red at once. **Those rows
check the offset, and an offset can be right while the instant is wrong**: all
three fractional zones read 5.5, 5.75 and 13.75 correctly while `Date.UTC`
dropped the fraction on the way to the instant. B13c checks the instant.

**The assumption is returned, never hidden.** A chart with no time is still
drawn, for 12:00 noon local, because a solar chart is worth having. (Until 29
September 2026 the sentence said local and the arithmetic took Greenwich; B13b
holds them together now.) What is not
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

## The ten astral bodies come from a library, and they are measured
Until this pass the Sun, Moon and planets came from a hand written series in
`lonRaw()`: a two term Moon and a coplanar first order Kepler model for Mercury
to Pluto. Nothing in the build compared them with anything outside it, while the
asteroids were held to JPL Horizons to a twentieth of a degree. Against 19,750
Horizons positions from 1900 to 2100 the series was out by 1.3 degrees on the
Moon, 3.9 on Venus, 6.5 on Mars and 2.9 on Pluto, and a comment beside it said
"well inside a degree".

What that changed, over 2,000 random births from 1950 to 2010, with one set of
Human Design rules and only the positions swapped:

| Changed | Share |
|---|---|
| Any activated gate | 74% |
| Defined channels | 39% |
| **Authority** | **8.8%** |
| **Type** | **8.4%** |

It is the same class of error as the 88 day design side, a third of its size,
and it survived the same way: nineteen gates were green, because every one of
them tested what it was pointed at and none was pointed at the foundation.

**`astronomy-engine` 2.1.19 (MIT, Don Cross) is vendored** as
`app/astronomy-engine-2.1.19.min.js`, byte for byte from the npm registry
tarball, and named with its version the way the Supabase client is. It measures
0.023 degrees at worst on the Moon and under 0.006 on the other nine. It is one
browser file and needs no bundler, and needing a bundler was the reason the
series was hand written in the first place.

**`modulesReady()` waits for `window.Astronomy`.** Helmet scripts are hoisted as
async tags, so without the wait a chart drawn before the library lands is
memoised from the fallback for the session, the trap the minor bodies had with
`window.MinorBodies`. The wait cannot hold the splash forever: `boot()` gives up
after 50 tries and shows its banner, and `lonRaw()` answers from the old series,
which is kept as the fallback for exactly that case. Verified both ways in a
browser: a six second delay boots with the library in place, and a blocked file
boots at about 9.6 seconds on the fallback.

**Mars outward are read off a four day grid.** A library position costs 20 to
45us, and 155 for Pluto, whose orbit it integrates numerically.
`transitWindows()` asks for 1,986 in a row during boot and went from about 10ms
to over 100. Cubic interpolation between library positions on a grid anchored at
J2000 measures 0.0003 degrees at worst for Mars and 0.00003 or less for the
rest, and the scan now takes about 6ms in a browser, less than before. Mercury
and Venus measure 0.05 and 0.002 on the same grid and are asked for directly, as
are the Sun and the Moon. Two things about the grid are easy to undo. Neighbours
are unwrapped onto the middle node before they are mixed, or a crossing of 0
Aries averages 359 and 1 into 180: this pass made that bug once, in a scratch
test. And a lone cold call costs four nodes, which the position cache in front
of `lonOf()` pays once. `bench-ephemeris.js` loads the same file now, so the
ratios quoted in "The one cache that holds positions" were measured against the
old series; run the bench rather than quoting them.

**`check-astral-bodies.js` is the gate** and `fetch-astral-bodies.js` makes its
fixture. It lifts `lonRaw()` out of the app the way `bench-ephemeris.js` does,
loads the vendored file, and holds all ten bodies to 0.03 degrees, a thirtieth of
a Human Design line, against every Horizons position. It also asserts that the
old series FAILS that ceiling with the library removed, which is what proves it
can go red; walks the grid against the library at a quarter day through all 164
crossings of 0 Aries in the fixture; pins the vendored file's SHA-256; asserts a
non-finite instant answers NaN; and checks the two seams that fail silently,
`modulesReady()` and the `app/sw.js` precache. Each of those was sabotaged once
and turned it red.

**Only a finite instant reaches the library.** `MakeTime` throws on NaN, where
the series quietly answered NaN, so a half typed partner birth date that parses
to an invalid date would have thrown out of a render instead of drawing nothing.
`lonRaw()` hands a non-finite `t` to the series, and the gate asserts NaN comes
back for all ten bodies.

**`people-library.js` `STATE_VERSION` was 2 for this, and is 3 since the
Codex comparison changed untimed noon and the angles.** Its own comment says the number
moves when the arithmetic of `computed_state` changes, and the bump is what
invalidates `pair-cache.js`, so no stored composite outlives the positions it
was made from.

**This changes existing readers' charts**, as the design side fix did: about one
birth in twelve reads as a different Type. It is a correction rather than a
change, and it is worth saying out loud.

**The deploy bundle was rebuilt in place.** `deploy/v6.3/` carries the library
and the cover's sign in, so the deploy preview shows what the source does. There
was no version bump, by the rule in "Where things live in this repository":
rebuilding does not earn one, and the stamp moves when a build has been deployed
and confirmed live. The two earlier v6.3 rebuilds made the same call.

## A routed jump owns the pager tab until it lands
`vtGoTab()` sets `vtTab` and then smooth scrolls the pager to that page, and
the pager's scroll handler derives `vtTab` from `scrollLeft` on every scroll
event. (The pager has three pages now; the account below is from when it had
nine, and the guard is unchanged.) So a jump from the first Spirit page to the ninth walked the state
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

**The sections had the same fault and no guard, for longer.** `vtGoSection()`
smooth scrolls the snapped column, and `vtOnScroll` derives the section index
back out of `scrollTop` on every frame of that travel and writes `tab` with it,
because the section index IS the tab. So a jump to Library crossed Today and
Spirit, and `currentPath()` followed: the address walked, the announcements
walked, and since `_routeNav` is consumed by the first write, the ones after it
were `pushState`, which put screens nobody visited onto the Back stack. E2 is
the row that catches it, and it caught it on a breakpoint crossing rather than
on a tap, because `syncSectionToTab()` reconciles by calling `vtGoSection()` the
moment the vertical shell mounts.

`_vtRouteSec` is the same claim for the column: staked in `vtGoSection()` AFTER
`vtSettle()` (which opens by clearing any settle already running, so a claim
staked before it is released two lines later, exactly as vtGoTab's own comment
says), released by `vtStopSettle('S')`, and honoured in `vtOnScroll` on the
section write alone. `vtHide` and `vtSolid` are left to update during the
travel: they are about the header, not about where the reader is.

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
page of its own, because Synastry is already the two person surface and
already carries the consent story, the one sided label and the partner picker.
Synastry is The Commons tab of the Library now.

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
the one that is easy to undo: the desktop sets a `spiritView` for a chart, the
phone leaves it null and scrolls its pager to the page holding the same thing.
A row that wrote a `libView` the vertical shell does not name would close the
sheet onto an empty shelf with no way back, and the state would look correct
while it did. `searchTab()`, `searchSpirit()` (the three charts, pages 0 to 2 of
the pager), `searchLib()` and `searchAngel()` are the target builders.
`searchLib()` names the tab as well as the room, from `LIB_VIEW_SUB`, so Back
from the room lands on the tab it was reached from.

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

## The Timing Lexicon, and why the Together slide reads from it
The owner reported on 12 October 2026 that the Custom buttons on Today's
Together slide "don't change much", and asked for a full body of original
explanations for every transit, gate and number. Both were true and they were
one problem. Measured by clicking every button in a browser: with the wording
that shipped, **all ten transit buttons produced the identical paragraph**,
because `horoTogether()` read `d.hits[0]`, the live sky, rather than
`dv.hits[0]`, the reader's choice. Gate clicks moved about 12% of the words
and number clicks 5%, because a choice only dropped a gate name or a three
word essence into frames picked by a hash of the date.

**`app/timing-lexicon.js` is the corpus, interpretation layer, global
`TimingLexicon`.** It reads nothing: no ephemeris, no clock, no storage. A
transit is three pieces written for it: `MOVE[mover][aspect]` (60), what this
body does at this angle; `MEET[mover][point]` (192), what it does to this
natal point, naming the return or cycle where a body meets its own place; and
`PLACE[point][c|e|h]` (48 questions), one per point per kind of contact. Twelve
movers, five aspects and sixteen natal points are 960 contacts and every one
reads differently. A gate is `GATE[n]` (`sky`, `held`, `open`, `ask`),
`GATE_LINE[n][0..5]` (all 384 lines, each written for its own gate) and
`CHANNEL` (the 36 pairs, read when a transit completes one with a natal gate).
`LINE[1..6]` stays as the description of what each position is, returned as
`lineKind`, and is the fallback only if a gate's line were ever missing. A number is `NUMBER[v][role]` for day, month, year, Life
Path, Challenge (0 to 8) and Pinnacle, masters included where the role can
reach them. No origin or method field, by the owner's rule of 11 October.

**The 384 lines are each written, not composed, and they are held to it.**
The owner asked on 12 October 2026 for every gate line to be written. The six
positions are read as six ways of meeting the gate's theme (the groundwork, the
gift that works unwatched, the lesson by trial, the door through people, the
public view others project onto, the long view), and the first draft leaned on
one sentence frame per position: "comes naturally here, and others..." opened
about thirty second lines and "seen from a height... were the ones that..."
about thirty sixth lines. 131 were rewritten for that, and the rule that came
out of it is the one to keep: **a frame that repeats under the six word cap is
still a template**, so check four word runs across the lines before believing a
pass is finished. None of the 384 is a rendering of the oracle text or of
anybody's line keynotes. TL15 reads the I11 and I12 fixtures out of
`run-module-tests.js` rather than retyping them, and refuses any six word run
shared with `iching.js`'s own hexagram lines, because hexagram N is gate N and
a gate line that leaned on the hexagram line beside it would be one text
wearing two names. TL6b holds all 384 distinct, six per gate, returned for
their own gate and line, and free of any span ("this week", "today").

**Gate text is time neutral on purpose.** A gate on this slide can be carried
by the Moon for hours or Pluto for years, so a gate entry that said "this week"
was false for most carriers. The span belongs to the mover (`PACE`), never to
the gate.

**`horoTogetherLexicon()` composes the slide** and returns null when the
module is missing or a key is unknown, so the old wording still answers. Its
salt carries the choice, so sentence order moves with what was picked rather
than with the date alone. The paragraph is drawn as paragraphs
(`alignTogetherParas`): the transit and where it lands first, the design and
the number in the seeded order, and the question last. The question follows
the system the reader last changed (`alignLast`), so a number chosen by hand
is answered with the number's question. Measured after: ten of ten transit
paragraphs distinct, about a third of the words changing per transit click,
38% per gate click now that each line is its own, and 16% per number click.

**`tools/check-timing-lexicon.js` is the gate.** It reads the key sets out of
the app (`PLNS`, `ASPECTS`, `anglePoints()`) and out of `hd-topology.js`
rather than typing them, so a body or angle the app starts producing without
an entry fails rather than quietly falling back. It asserts 960 distinct
readings, distinct pieces, the six word phrase cap of three the app holds
itself to, no dash, no "you are", astral body rather than planet, no rating
vocabulary, and that every question is one. Its detectors are tested on
planted fixtures first (TL0). Add to the corpus by adding to the module and
running the gate; a new entry that repeats an old one's phrasing is the fault
this whole pass removed.

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
(group N). 278 assertions (G11c and G11d joined group G on 19 October 2026; group N is 58 rows since 2 October 2026: the Month
Ahead rows left and seven Library rows, N41 to N47, arrived). A full run takes 25+ minutes.

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
after a real click, so **32 of 34 is the expected clean result there, not a
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

**A GPU-less container is a different failure mode from a starved pane, and it
is the one this repo's own automation runs under.** The two paragraphs above
are about a real WebGL context that is being fed frames too slowly. There is a
third case neither covers: a machine with no GPU exposed at all, no `/dev/dri`,
no PCI VGA or 3D device, no `nvidia-smi`. There Chromium's WebGL falls back to
SwiftShader, a software rasterizer, and the render is correct rather than
starved: `H2b` read 95.1 and then 97.8 percent lit against the source cover, and
97.8 against `deploy/v6.3/index.html`, all comfortably inside the healthy band
this section already names. What moves is the clock, not the picture. Measured
rather than guessed at: the phase took 473.7s against the source cover and
583.4s against the bundle once the budget was raised to let it finish, about
2.6 and 3.2 times the 180s `runCover` is written for, not the order of
magnitude a first guess might reach for. The phase's own `H-TIMEOUT` fires with
every substantive row already green when the budget is left at 180s, which
reads exactly like the litPct failure above and is not it: the buffer was full,
the wall clock ran out. Raising the budget, served rather than written to disk,
is enough to watch the phase actually finish under SwiftShader, and it does, at
both ends: the source cover and the built bundle each passed all 17 substantive
rows this way, `H16` correctly landing on `app.html` rather than the source
filename when the bundle was the one under test.

**What a SwiftShader pass cannot say anything about is the failure H1's own
banner exists to name**: a driver that has crashed and recovered, or one the
OS has disabled after repeated resets. Those are properties of a real driver
under real load, and a rasterizer that never opens a hardware context cannot
reach them either way. A green H suite from a container like this one is real
evidence the shader compiles and paints; it is not evidence about the crash
and recovery path, and only a machine with a GPU can speak to that.

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

**N8 asks the screen to match the model, not to contain a word.** It used to
test a Sky row against a typed alternation of range words, and `tlLine()` writes
four shapes: `F to T`, `since before F, through T`, `from F, still running past
T`, and `since before F, and still running past T`. The list knew three of them.
It carried `onward`, which no shape produces, and it did not carry `through`,
which is what a window that opened before the scan did says about itself. So the
row went red on a correct screen, and only in the months where the heaviest
closed window happens to be one that opened early, which is the worst way for a
gate to be wrong: right most of the time. It now reads `r.range` off the rows the
model built and asks the rendered text to carry one verbatim, which the template
allows because the range is a single placeholder. **Do not tighten this back into
a word list.** Proven strictly stronger rather than assumed: rendering `from time
to time` in place of every range passes the old alternation and turns the new row
red.

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

**The pager rows are N36 and N36b, and were `N18`/`N18b` twice over.** (They
assert the three chart pages and the six Library tabs now, and that the
Synchronicities room renders in the phone Library with its handlers on.)
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
Four things came out, and the removal phase asserts they stay out. One screen
has since brought a model back on purpose, the Oracle, through a server function
rather than through Oki, and none of what follows is undone by it: see "The
Oracle took Throughline's seat".

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

## Discovery belongs to the reader: do not explain a screen before it is opened
Decided by the owner on 10 October 2026, and it is a design principle rather than
a one-off edit. A subheader that tells the reader what a control or a reading is
about, what it holds, or why it exists, takes away the thing they came to do,
which is find out. The app does not give everything away. When a title and the
thing it names are enough, the line under the title goes.

**What was removed, and only this.** The owner named each line, and the rule is
not a licence to strip other subtitles. Removed: the Oracle's "The heavens, read
for you alone." (phone page and the desktop heading); "the day's omen", "the
seven-day tide" and "the lunar chapter" under Today, This Week and This Month;
the numerology "Calculated from the reduced birth month, day, and year in turn."
line, for the period cycle only (every other number keeps its own "Calculated
from" line, because it was not listed); the Settings line "Colour and type only.
Nothing here changes a calculation, and the choice belongs to this profile
rather than to the device."; the "One profile so far. Add another for a
partner..." line; and the four theme descriptions (Deep Field, Midnight, Dawn,
Gold). **Do not remove any other subheader, and do not add one back.** Before
deleting a line of this kind, ask whether the owner named it.

**What this does not touch.** Consent language, safety copy, error and empty
states, accessible names and the sentences that say what a calculation cannot do
(`availability()`, the missing birth time note) are not subheaders. Those exist
so a reader is not misled, and they stay.

## No disclaimers, and no line saying how a reading is made
Decided by the owner on 11 October 2026, and it widens the section above. Small
grey text that tells the reader what a screen is, how a number was worked out,
where a reading came from, what leaves the device, or what a reading is not, is
gone from both shells. The owner's words: "they give away the math/process
behind this. We don't do that."

**What went.** The Oracle's consent paragraph (`orPrivacy`) and its heading; the
availability note and "Left uncomputed" (`btAvailNote`, `btAvailList`); "What
this wheel is drawn from" (`chartSummary`); the "Read from ..." lines under the
three daily readings; orb tables and transit notes on a placement page; the
degree withheld sentence (`plNoSabianWhy`); every footer that said a reading is
the tradition's, was not quoted, or was computed on the device (Astropedia,
the Atlas, the Book of Changes, tarot, the dream registry and journal,
Synchronicities, numerology); "Calculated from"; the bodygraph gloss
(`bgNote`); the connection row caution, the Circle caution and its precision
and footer lines, the one sided synastry note and `synCaveat`; the privacy
notes beside saving a person and sending a card; the Settings explanations of
consent, memory, deletion, the PIN, the picture and analytics; the Library and
Today card descriptions; the "Worth remembering" and "What this is not"
reading sections and the Astropedia method and caution sections.

**What stays, and why.** Crisis and safety copy (the Get Help lines, "If you are
in immediate danger", the practice risk levels and their caution), errors,
empty states, field labels, the two-step setup instructions, the payment terms
beside the Luminary button (cancellation terms are owed at the point of sale),
and the sample banner, shortened. The modules still return `CONFIG_CAUTION`,
`GROUP_CAUTION` and `availability().note`; the screen no longer draws them.

**This overrides earlier sections where they disagree**: the availability line
above the wheel ("The birth moment has three states"), the gloss ("The
wiring"), the caution rendered beside the row ("Connection charts" and
"Circles"), `otherNote` ("Anything Else logs and does not interpret"), and the
consent sentence on the Oracle. Harness rows N18b and N33 assert the absence
now, with the owner's approval of 11 October 2026.

**What a disclaimer said now lives in the legal pages**, which is where the
owner put it: see "The Terms, the Privacy Policy and Contact Support" below.
The Oracle's consent paragraph is Privacy Policy section 6, nearly word for
word, and the button that sends is still the reader's own press.

**Do not add a line of this kind back.** Before writing a sentence under a
title, ask whether it explains the screen, the method or the source. If it
does, it does not ship.

**One exception, and only in the store apps**: the Oracle names Moonshot AI in a
one line footer there, because Apple requires it (owner, 12 October 2026; see
"The app stores"). The website still carries no such line.

## The Terms, the Privacy Policy and Contact Support
Asked for by the owner on 11 October 2026: the Oracle's disclosure in a privacy
policy, a generic and accurate About that discloses no method, folded into
Terms & Conditions, and the Terms "right above the privacy policy". The owner's
answers decide four facts written into both pages: **Nathaniel J. Figueroa, an
individual in Florida**, until an LLC is formed; **Florida law and courts**;
**16** as the minimum age (a parent's permission to subscribe under 18); and
**Contact Support** as the contact route, because there is no domain for an
email address yet. `docs/LEGAL-SETUP.md` is the owner's half, including what a
lawyer should read before launch.

**Two plain pages, `app/terms.html` and `app/privacy.html`.** No script, no web
font and no third party request, so reading the privacy policy sends nothing
anywhere, and they print. `build-bundle.js` copies both beside `index.html`,
rewrites their way back to `./app.html`, refuses a dash, and refuses a cover
that links the Privacy Policy above the Terms. `_headers` revalidates both.

**The Terms sit directly above the Privacy Policy everywhere they are linked**:
the cover (`.legal.links`, shown only once the form is open), Settings in both
shells twice (Support & legal, under the crisis rows, and again in the page's
`<footer>` above the credit line, the owner's request of 11 October 2026), and
the Luminary purchase, where the automatic renewal sentence sits beside them
because Florida and California both want renewal terms before the purchase.
The cover's Create New Account mode shows `.agree`, the line that makes signing
up an agreement to both. H5 counts the cover's links outside `.legal` and
`.learn`, because neither is a way in.

**The pages describe the build, so they move with it.** A new outside service,
anything new sent to the Oracle, a price or plan, the SMS provider, the LLC or
the domain each needs both pages and the date changed in the same change. K55
holds the facts that would drift first: the operator, Florida, 16, the Oracle's
sent and not sent lists, the support route, the renewal sentence, the link
order in the app and on the cover, and no dash.

**Contact Support writes one row to `support_requests` (`server/support.sql`).**
Anybody may insert, nobody may read back through the API, user_id and status
cannot be chosen by the sender, and a trigger throttles five per address per day
and two hundred an hour. `supportSend()` in `incommon-cloud.js` posts to the
REST API directly, with the reader's token when fully signed in and the anon key
otherwise, because the client is absent for a reader who never signed in and a
session held for its two-step code would be refused by the restrictive policy
(the table is in `server/mfa-policies.sql`'s list). It sends topic, email and
message and nothing else (K54). `#/support` lands on Settings with the dialog
open, which is the address both pages link. Driven against the real SQL on
Postgres 16: anonymous and signed in sends land, a forged user id or status is
refused, an aal1 session with a factor is refused, nothing reads back, and the
sixth send from one address is refused.

**The About card says what inCommon is and nothing about how.** The old card
named the safety gate, the claim tags and the device storage, two of which were
no longer true. The Settings card and the Terms carry the same opening; the
disclaimers went to the Terms, sections 3 and 4.

## The accessibility statement is the third legal page
Asked for by the owner on 12 October 2026. `app/accessibility.html` is built the
same way as the Terms and the Privacy Policy (no script, no web font, no third
party request) and `build-bundle.js` copies it with them (`LEGAL_FILES`). It is
linked in Settings in both shells, in the Support & legal list and in the footer,
**directly under the Privacy Policy**, and from the two legal pages. K55's order
rule is untouched: the Terms still sit directly above the Privacy Policy, and the
statement comes after both.

**Every claim on it is measured, not hoped.** The 4.5:1 floor in every theme,
the Higher contrast setting, zoom left on, the skip link, focus held and returned
by dialogs, arrow keys in menus, announcements, the two chart summaries, 44px
targets, and reduced motion. It says "partially conformant" because there has
been no independent audit, and it names the known limits: the wheel's house
numbers (the `[data-chart]` exemption), the cover's WebGL image, the theme sweep
measuring Today only, and the third party pages. **If a change makes a sentence
on it untrue, change the page and its date in the same change.** Feedback goes
through Contact Support under "Something is not working": no new topic was added,
because `server/support.sql` checks the topic list and a new one would fail until
the owner ran the SQL again.

## The fonts can be swapped, and the real site still uses Google
Added 12 October 2026 (`docs/FONTS.md`). The four faces live in `app/fonts/`
(WOFF2, OFL 1.1, Google's own `@font-face` rules pointed at local files).
**Every published build still loads Google Fonts.** `build-bundle.js --fonts
self` swaps a build to the local copy: the block between `<!-- fonts:google -->`
and `<!-- /fonts:google -->` in the app and the cover becomes one link to
`./fonts/fonts.css`, the app's `FONTS = 'google'` becomes `'self'` (which
`faceHref()` reads for Dawn's Petrona), the fonts are copied in, the service
worker precaches the first screen's faces, and the two Google origins leave the
CSP. The build refuses if either marker or the `FONTS` word goes missing, so the
swap cannot quietly stop being possible, and it refuses a self build that still
names Google anywhere except `faceHref()`'s own Google branch (`FACE_GOOGLE`).

**`--preview <dir>` builds a whole site into its own folder and touches nothing
else**: no write to `deploy/`, no root `_redirects`, no `netlify.toml`. It is
seeded from the bundle folder's hand written files and adds `X-Robots-Tag:
noindex`. It refuses to write inside `deploy/` or `app/`. `preview/fonts-self/`
is the committed result, and `netlify.toml` gives each `preview/<name>` a branch
deploy context, `preview-<name>`, so pushing that branch serves it at its own
address. `check-competitor-surface` skips `preview/`, as it skips `deploy/`.

**Switching the real site is `FONTS_DEFAULT` plus the Privacy Policy, together.**
A production build refuses a self hosted bundle while `privacy.html` names Google
Fonts, and a Google bundle once it stops naming it. A google build also puts the
CSP origins back and takes the font lines out of `sw.js`, so the word can be
flipped either way and every file follows; on the current bundle it changes none
of them.

## Luminary is not sold in the EU or the UK yet
Decided by the owner on 12 October 2026 (`docs/LUMINARY-EU-UK.md`): a seller
outside them owes VAT from the first sale, so the purchase is held there until
volume pays for the registrations. Everything else stays free and open.

**Three layers, and only the last one is the wall.** The page guesses a country
from the time zone (`lumCountry()`, the EU 27, Monaco, the UK and the Isle of
Man, and nothing else) and sends it with the status and the checkout; the server
answers `regionOpen: false` and the gate shows "Codex Luminary is not available
in your country yet." in the existing note slot, with no plans and no button;
a checkout for that country is refused with `REGION` (reason `region`, K34b)
before Stripe is asked. And because a time zone is only a guess, the webhook
reads the billing address and the card's issuing country on
`checkout.session.completed` and **cancels and refunds** a subscription where
either is in the EU or the UK (`refuseIfClosed()`). Every step tolerates a
retried webhook: the cancel is skipped once cancelled, and the refund carries an
idempotency key. Only an explicit `regionOpen: false` closes the page, so an
older server sells exactly as before.

**The rest is built and switched off.** `LUMINARY_TAX` turns on Stripe Tax for
every checkout; `LUMINARY_SELL_EU_UK` opens the two markets and is refused unless
`LUMINARY_TAX` is on too. Open, an EU or UK reader pays the US price before tax,
converted at the 12 October 2026 rates (`LOCAL`, EUR 11.59 / 107.01 and GBP
9.80 / 90.57, the owner's choice), plus their own country's VAT, exactly as the
US price is plus sales tax. Stripe holds those as tax exclusive prices under
`incommon_luminary_<plan>_<cur>` on the same product and Stripe Tax adds the VAT;
the page is shown the total for the guessed country from `VAT`, rounded the way
Stripe rounds, because EU and UK law want the price shown to be the price paid.
**A VAT rate that changes has to change in `VAT` the same week**, or the page
and checkout disagree. VAT number collection and the 14 day withdrawal waiver
come with it as a required tick.
The page formats whatever price the status quotes (`lumPriceRows()`), and falls
back to `LUM_PLANS`; the server's US quote formats identically to it. With both
switches off, a US checkout sends Stripe exactly the fields it always did: that
was checked against a fake Stripe, along with the refusal, the refund, the
retried webhook and both switches on. Do not let a checkout through for a closed
country "because the page already hid the button": the page is courtesy.

## The app stores
The owner confirmed on 12 October 2026 that inCommon ships on the App Store and
Google Play as well as the web. `docs/APP-STORE-SETUP.md` is the requirement list.
In-app account deletion is built (next section). **The Oracle's disclosure is
built, in the store apps only**: Apple 5.1.2(i) wants the third party AI named on
screen before anything is sent, and the owner chose (12 October 2026) one line
in small type as a footer on the Oracle page, "Your first name and a chart
summary are sent to Moonshot AI to write each reading.", drawn only when
`nativeApp()` is true (`orAiNoteOn`). **It is the one exception to "No
disclaimers"** and it does not reach the website; do not widen it to the web or
lengthen it without the owner. **Luminary in the apps is the stores' own
billing, through RevenueCat**, built and switched off until its keys are set:
see "Luminary in the apps is RevenueCat's" below. The apps never sell through
Stripe; the one Stripe page they open is a gift, by the owner's decision of 18
October 2026 (see "The Cycle Audit").
Apple's minimum EULA terms are Terms section 22, "Apps from Apple and Google"
(added 12 October 2026 at the owner's request), which still owes the
developer's postal address before the first submission.

## The store apps are a Capacitor shell around the bundle
Started 12 October 2026 (`docs/NATIVE-APP.md`). `native/` is Capacitor 8.5.3,
pinned, with `ios/` (Swift Package Manager) and `android/` generated by the
Capacitor CLI and committed; `native/www/` and each platform's copy of it are
generated and ignored. **The app carries its files, never the website**, because
Apple rejects a remote site in a shell (4.2) and files on the phone are what work
offline. `tools/build-native.js` makes `www` from `deploy/<version>/`: the app is
`index.html` (Capacitor opens it, and the app should open on the app), the cover
is `cover.html`, every link back to the app is rewritten to `./index.html` with
the count asserted, and the service worker and the host's files are left out. It
refuses a bundle older than the app source and a bundle without the native check.

**`nativeApp()` asks Capacitor, and six things hang on it and nothing else**:
the Oracle footer above; Luminary never sold in the app (`lumBuy()` and
`lumManage()` do nothing there, and no gate is drawn); no service worker
registered; `coverHref()` answering `./cover.html`; every add-on free
(`addonsOpen()`); and Support inCommon, the gift (`giftOn()`). The first and
the last two changed on 18 October 2026: see "Codex Luminary is one payment". Driven in a browser with
`window.Capacitor` stubbed, and without it: every one of those in the shell, none
of them on the web; the footer measured clean in all eight themes at 375 and
1440. `tools/build-icons.js --native` draws the icon and splash sources into
`native/assets/` from the same definition as every other icon, and
`@capacitor/assets` cuts the platform sizes from them; the default run is
unchanged, byte for byte. **The app id `com.incommon.app` is a placeholder** and
becomes permanent at the first upload, so it is the owner's to choose before
then.

## Luminary in the apps is RevenueCat's
**Retired on 18 October 2026, and the plugin is out of `native/`**: nothing is
sold in the apps (see "Codex Luminary is one payment"). This section is the
record of what was built. `server/store` stays, dormant, so a store subscription
that exists keeps counting.

Asked for by the owner on 12 October 2026 ("start the in-app purchases with
RevenueCat"); `docs/REVENUECAT-SETUP.md` is the owner's half. Inside the apps
Luminary is bought with Apple's In-App Purchase and Google Play Billing, with
`@revenuecat/purchases-capacitor` 13.7.3 pinned in `native/` and nothing else
native. **`RC_KEYS` is the switch**: RevenueCat's two PUBLIC app keys, made to
ship in an app, and while the one for a platform is empty `rcOn()` is false and
the app sells nothing, exactly as before this existed. The secret key lives only
in Supabase.

**The plugin is reached through the bridge by name**, `rcCall()` calling
`Capacitor.nativePromise('Purchases', method, args)`, because this app has no
bundler to load the plugin's JavaScript wrapper and the wrapper is only that
call plus error tidying. The method names and arguments were read out of the
plugin's own Swift and Kotlin for 13.7.3; a version bump means reading them
again. A cancel on the store's sheet is code 1 and says nothing.

**The page decides nothing about who paid.** The reader's Supabase user id is
RevenueCat's app user id (`status().userId`). After a purchase or a restore the
app calls `storeSync()`, which carries only `{ action: 'sync' }` (K57); the
`store` function (`server/store/index.ts`, JWT verification off like billing)
asks RevenueCat's REST API about the reader its token names and writes
`store_subscriptions` (`server/store/schema.sql`). RevenueCat's webhook, believed
only on the exact `REVENUECAT_WEBHOOK_AUTH` header, does the same for every
uuid an event names and nothing else: a webhook body is a list of whom to look
up, never a statement of what they bought. Billing's status and the Oracle's
paywall read both tables, so a Luminary is a Luminary wherever they paid, and a
Stripe checkout is refused for a reader who already holds an app subscription.
**A table of its own, not a source column**: a `subscriptions` row is a Stripe
customer, and a reader can hold one of each.

**Each subscription is managed where it was bought.** In the app: the store's
prices in the reader's currency (`rcPlanRows()`), Restore purchases (Apple
requires it), renewal terms naming the Apple or Google account, and Manage
subscription opening the store's own settings. On the website an app subscriber
sees the plan line marked App Store or Google Play and no Manage billing. The
website's EU and UK hold does not apply in the apps, because the stores are the
seller and pay the VAT.

**The legal pages were written ahead of the keys**, by the owner's request of
12 October 2026: Terms section 7 (an app subscription is priced, cancelled and
refunded by the store, and deleting the account does not cancel it), section
12 and section 22 (Apple's minimum terms, Google Play, store billing; Contact
is 23 now); Privacy Policy sections 2, 7, 11 and 15 (RevenueCat named, with
what it receives and returns); and `delete-account.html`. If what the store
function stores or what RevenueCat is sent changes, those change with it.
Driven with the plugin stubbed, both shells and both platforms: the configure
call with the user id, offerings, buy, cancel, a failed buy, restore with and
without a purchase, the member line, Manage, the deletion dialog's store line,
no key, and the website unchanged; the gate, the member line and the dialog
measured clean in all 16 theme cases at 1440 and 375. The function was run
against a fake RevenueCat and database for 27 cases and typechecked strict.

## Deleting an account is the reader's own button
Built 12 October 2026 at the owner's request, because both stores require it
(`docs/ACCOUNT-DELETION.md`). **Delete account** sits under Delete this profile in
the profile card, both shells, drawn only while signed in (`menuAcctDelOn`), and
opens one dialog (`accountDeleteVals()`, state `adOpen`): what goes, a switch to
erase this device too (off by default, because the account going does not have to
take the journal with it), and the word `delete` typed to arm the button, which
wears `--warn`, never `--crisis`: deleting an account is not a safety control.

**The order is the design.** `server/account/index.ts` cancels Luminary at Stripe
and deletes the Stripe customer FIRST, because that is the one step that can keep
charging, and if Stripe fails nothing is deleted; then RevenueCat's customer, when
it is set up (an app subscription is the store's to cancel, and the dialog says
so before the reader deletes: `adStoreOn`); then every row, children before
parents so it is right whether or not the project's keys cascade; then the auth
user LAST, so a failure above leaves the reader able to sign in and retry. Every
step is safe to run twice. A table the project never created is skipped, any
other error stops the run. The server checks the typed word again, and refuses an
aal1 session on an account with a verified authenticator, like billing and the
Oracle. Support requests stay, unlinked, as the Privacy Policy says.

**On the device, success forgets the account**: `accountDelete()` removes the sync
map, the outbox and the remembered login and signs out locally. The map matters
most: it records rows as uploaded, and a later sign in to a new account would
otherwise skip them. With the switch on, this account's profiles and every key
scoped to them go too (`PM.accountStorageKeys()`), and nothing of any other
account on the browser; with it off they become the guest's
(`PM.releaseToGuest()`), which is what "you can keep using inCommon without an
account" needs now that a deleted account's own store could never be opened
again. See "Each account has its own profiles on a device". Either way the reader reaches the cover through the marked tab Log Out
uses. K56 holds the module half; the function was driven against a fake Stripe
and an in memory database (only the reader's rows go, Stripe down deletes
nothing, a failing table keeps the sign in). `delete-account.html` is the public
page Google asks for, built like the legal pages and copied by `LEGAL_FILES`; the
Terms (sections 7 and 17) and the Privacy Policy (sections 15 and 16) name the
button, dated 12 October 2026. If what the function deletes changes, that page
and those sections change with it.

## One account reads the same on every device
Built 13 October 2026 at the owner's request ("build pullAll so accounts sync
across devices"). Until then the cloud module only pushed: a second phone
signed in to an account and opened on a blank birth page. `pull()` in
`incommon-cloud.js` (exported as `pullAll` too) reads the whole account and
merges it in, and `sync()` is pull then push. It runs when a session starts,
and the app's `cloudSync()` asks again when the page comes back into view or
the signal returns, at most once a minute.

**The merge is three way, and the hash cache is the base.** A row whose local
copy still hashes to what this device last synced was not touched here, so the
server's copy is taken; a row changed here since keeps the local copy and the
push after the pull sends it. That is per whole row: two devices editing the
same profile offline end with the last one to sync. A row this device synced
and the server no longer holds was deleted elsewhere and is deleted here.
Throughline entries are append only, so they are only ever added, and a pulled
one is recorded as sent so it is never uploaded twice.

**Four rules keep a pull from deleting anything it should not**, and each has a
row that goes red without it (sabotaged and checked): one table that fails to
read applies nothing (K65); a server holding no profiles deletes nothing (K65);
a deletion still in the outbox is not undone by the pull (K67); and a device's
FIRST pull for an account sends an absent row again instead of deleting it
(K66), because of the bug below. The first pull is recorded per account
(`map.pulled[userId]`), since one browser can hold several.

**Deleting one memory used to delete them all on the server.**
`deleteMemory({ id })` emitted `memory:deleted` with no type and no id, and the
cloud module queued that as `del-memories` for the whole profile. It carries the
id now and queues `del-memory`, which deletes that row (K62). The first pull
rule above is what repairs an account an older build already emptied: the
device that still holds the entries uploads them again.

**ProfileManager writes what came down, through `importSynced()`**, so the
storage shapes stay its own. It emits `sync:pulled`, never `profile:deleted` or
`memory:deleted`, because those would queue the same deletion straight back up.

**The sample profile gives way.** `cloudPlaceholders()` names the profile a blank
device invents while it is still exactly the sample; when the account brings a
profile of its own the sample is dropped rather than synced, and a device that
had nothing of its own (`adopted`) skips the birth page, because it was set up
somewhere else. `cloudPulled()` repaints afterwards.

**Pages, not one answer.** PostgREST returns at most its row limit (1,000 by
default) whatever is asked, so `fetchAll()` reads by `range()` until a page
comes back empty (K68 holds a 1,160 memory account against a 1,000 row cap).
Profiles and pairs are read with `account_id` and the child tables with the
account's profile ids, on top of RLS rather than instead of it.

**Only the four memory types the server accepts travel** (`SYNC_MEMORY_TYPES`:
journal, mood, practice_completion, stella_conversation), because
`public.memories` has a check constraint naming exactly those and one refused
upsert stops the whole push. The Archive writes `archive_deleted` rows when a
reader deletes an entry, and until 14 October 2026 that one row stopped every
later push from that device: no more memories, no Throughline, no deletions.
Those rows stay on the device. K69 reads the constraint out of
`server/cloud-schema.sql` and holds the module's list equal to it, so a new
memory type needs the constraint widened on the server, the schema file and
the list changed together.

What does not sync, unchanged: memories whose consent is off, `kept` rows, the
Archive's `archive_deleted` rows, the Oracle's kept readings,
`incommon.consent.data.<pid>`, saved people, and theme.
K58 to K68 drive two devices, each the real profile-manager.js and its own copy
of the cloud module, against one in memory database; the app half was driven in
Chromium with Supabase faked: a fresh browser signed in, skipped the birth page,
opened on the account's profile with its journal, consent and Throughline, sent
no sample up, and picked up an entry written elsewhere when it came back into
view.

## Each account has its own profiles on a device
The owner reported on 12 October 2026 that three accounts signed in on one
browser all opened onto the same birth data. The profile list was one device
wide store, `incommon.profiles.v1`, and every account and the guest read it.
Everything else a reader owns is already keyed by profile id (memories,
journal, consents, Oracle readings, saved people, theme), so scoping that ONE
store by account separates all of it, and the cloud push follows because
`buildPlan()` reads the store.

**`scope()` in `profile-manager.js` decides, once per page, at the first read of
the store.** It reads the session supabase-js left in localStorage
(`sb-<ref>-auth-token`), which is how anybody becomes signed in: on the cover,
then by navigating here. Signing out and deleting an account navigate away, so
no page changes owner while it is open, and caching the answer is correct. A
signed in account's store is `incommon.profiles.v1.u.<userId>`; signed out it is
the plain key, the guest's. A session the browser has closed (the remember me
mark without its cookie) and one still owing its two-step code read as signed
out, as they do everywhere, so a password alone opens nothing. That module's
`owesCode` is the third copy of the rule and K46 holds all three equal. It
lives in this module rather than calling the cloud module because helmet
scripts load async and the store is read before that module is sure to exist.

**Five device wide keys hold one reader's data and move with the account**
(`ACCOUNT_KEYS`): first run, the sample marker, received cards, the adverse
log and archived memories. The app reaches them through `acctKey()`, which is
why those five are getters on the logic class now rather than string fields.
Device preferences (`incommon.theme.device`, the sidebar, the section) stay
device wide on purpose.

**The first account to open the app on a device that already holds profiles
takes them**, with the `ACCOUNT_KEYS`. Nothing in the old store says whose it
was, so this is the only rule available offline, and it is right for the common
case of one reader per device. Every account after that opens onto a blank
store and the birth page, and the guest store is blank once claimed. An
account's blank store does not inherit the pre-profile legacy keys either:
`migrateLegacyProfile()` copies those only into the guest's.

**Log Out keeps the account's data on the device under its key**, and it comes
back at the next sign in. Deleting an account hands it to the guest unless the
reader erases it (see "Deleting an account is the reader's own button").

O1 to O7 in `run-module-tests.js` load the real module once per page over one
shared storage, which is how a browser moves between the cover and the app, and
all six that test separation go red with the owner forced to null. Driven in
the built bundle too: a device holding a guest profile, then account A (takes
it), account B (the birth page), A again (its own profile), signed out (blank).

## Swiping on the phone is one chain, read left to right
The order is Today, the three charts (Human Design, Astrology, Numerology), the
six Library tabs, the Oracle, Settings. A sideways swipe moves one step along
that line, so the last chart hands on to the first Library tab, the last Library
tab to the Oracle, and the other way back (landing on the last chart or the last
tab when going backwards). `vtSwipeStep(dir)` does the move and `vtBindTouch()`
reads the gesture. Three things are easy to undo.

**The pager's own horizontal scroll never fired on a phone.** The section column
is `touch-action: none` and what is inside inherits it, so a swipe on the
My Charts pager did nothing at all; this was measured, the pager stayed at
scrollLeft 0 through a real swipe. The swipe is read from the same touch
listeners the section bands use. If the browser did move the pager under the
finger, `vtBindTouch` leaves it alone so a gesture is never handled twice.

**It must not fire where a sideways gesture already means something.**
`vtHScrollableAt()` refuses a touch that starts on anything scrolling sideways
(the Library tab strip, a wide table), on a field, on `[data-chart]` (the wheel
pans and zooms) or on `[data-noswipe]`; and `vtSwipeStep` does nothing inside a
room (`libView`), with a placement, number, dream or aspect selected, or while a
dropdown is open.

**It lands exactly, because it goes through the existing routes.** Sections use
`vtGoSection` and pages use `vtGoTab`, which pin the scroll offset after the
smooth scroll, so `scrollTop` equals the section's `offsetTop` and the pager
sits on a multiple of its width. A swipe that wrote scroll offsets itself would
fight snap and the routed-jump claims described above.

## A row of pills becomes a dropdown when it is a choice of one
The Human Design readings (My Type, Chart, Mood, Work, Sleep, Diet & Exercise,
Health, Synastry, Just Me, At Me) and the Throughline filter were rows of pills,
which on a phone wrapped to three lines above the content. Each is one button,
right aligned, naming the current choice, and opening a `role="menu"` of
`menuitemradio` buttons. State is `ddOpen` (`'hd'` or `'tl'`). Choosing, tapping
outside, or Escape closes it; Escape hands focus back to the button that opened
it (`data-dd-trigger`), and the arrows, Home and End move focus without
choosing (`ddKeys`). The pills are gone from the markup, not hidden, so there is
no second control for the same choice. The panel is painted over an opaque
`--bg` with `--sf2` on top, because under Deep Field `--sf2` carries alpha and a
menu over text must not let the text through. The cap is `min(40vh, 300px)` so it
stays clear of the dock on a short phone.

## The credit line is the last thing on the Settings page
"Created and maintained by Nathaniel J. Figueroa." sits at the bottom of the
Settings page in both shells, centred, in the smallest type in the app (7px,
below the 7.5px badges). It used to head the About card. It sits inside the
page's `<footer>`, under the Terms and Privacy Policy links, and the footer
carries `margin-top: auto` inside the column so it stays at the bottom whatever
the content above it grows to.

**That footer is the shell's `contentinfo` landmark, and it says so.** G5 asks
for one. It used to be the method footer on Today, which went with the
disclaimers on 11 October, and the shell shipped with none: G5 went red on the
live v6.4 bundle. A `<footer>` nested inside a section or `main` has no
implicit landmark role, so the attribute is written out (`role="contentinfo"`)
in both shells. The Terms, the Privacy Policy and the credit line are exactly
what that landmark is for; do not move the role back onto anything that
explains a reading.

## The security headers, and where a new outside service has to be named
Added 11 October 2026, before launch. `docs/SECURITY.md` is the review and the
owner's dashboard checklist; this is the part a code change can break.

**`deploy/v6.4/_headers` sends a Content-Security-Policy on every page**, and
`connect-src` names every origin the pages may talk to: this site, the
project's Supabase (https and wss) and the Nominatim place search. **A new
outside service has to be added there**, or the browser refuses the request
with a console error naming the policy and the feature fails while the code
looks correct. Fonts are `style-src` and `font-src`. `'unsafe-inline'` and
`'unsafe-eval'` stay because `support.js` compiles templates with
`new Function` and the pages carry inline scripts; do not remove them without a
build step that replaces both. `frame-ancestors 'self'` is what lets the
verification harness frame the app and nobody else. The file is hand written:
`build-bundle.js` leaves `_headers` alone, so it moves by hand with the folder
at a version bump. Dragging the repository root does not serve it.

**The free Luminary list counts confirmed addresses only.** `isAdmin()` in both
server functions requires `email_confirmed_at` as well as a match in
`LUMINARY_ADMIN_EMAILS`. Matching the address alone gave paid readings to
whoever registered a listed address first.

## Two-step sign in is optional, and a password alone is refused in three places
The owner asked on 11 October 2026 for two-step sign in, optional. A reader
turns it on in the profile card (`mfaVals()`, beside Phone number in both
shells): a QR code and the setup key from `mfaEnrollStart()`, then the first
code (`mfaEnrollVerify()`). Turning it off asks for a current code first
(`mfaDisable()`). The factor is TOTP, an authenticator app, because Supabase
offers it on every plan and a texted code needs the SMS provider. The owner's
half is `docs/TWO-STEP-SETUP.md`.

**A password that passed still makes a session**, at aal1, and the code lifts
it to aal2. So three places refuse an aal1 session for an account with a
verified authenticator, and each is needed. `incommon-cloud.js` holds it in
`held` rather than `session`, so every call that asks for a session finds none
and the app reads as signed out (courtesy). `server/oracle` and
`server/billing` answer `MFA_REQUIRED`, which the module reads as signedOut.
And `server/mfa-policies.sql` is a restrictive policy on every table, which is
the wall: without it a stolen password reads the record straight from the REST
API. **A table added later has to be added to that file's list.**

`owesCode()` is the rule in the module and a copy of it is in the cover's plain
script, which reads the stored session before the module loads; K46 holds the
two equal. A token that cannot be read owes the code: fail closed. Every way the
cover makes a session (password, emailed link, old sign in link, texted code)
returns `mfa: true` when it owes, and the cover's `mfa` mode asks for the code
and then goes on to what the sign in was for (`afterMfa`: the app, a replace
from an email return, or choosing a new password after a recovery link).
"Use another account" from that step signs the half session out of the browser.

**Two traps this build hit.** supabase-js prefixes the server's raw SVG with
`data:image/svg+xml;utf-8,`, and the template runtime splits a style attribute
at every semicolon, so the QR code painted blank until `mfaQrBg()` rebuilt the
address without one. And the cover's raytracer starves a software renderer, so
a browser drive of the sign in steps reads as a hang under SwiftShader; drive
them with WebGL off, where the plain sign in script runs exactly the same.

K46 to K51 hold the module and the cover's copy of the rule; the rest was
driven in a browser against a fake auth server, and the database rule against
a real Postgres. The dialog and the cover's code step measured clean in all 32
theme cases at 1440 and 375, and at 320x568.

## Cloudflare Turnstile guards the five calls that can be scripted
Added 11 October 2026. The owner made the widget; the cover carries it
(`TURNSTILE_SITE_KEY`, action `signin`) and `docs/TURNSTILE-SETUP.md` is the
owner's half. **Supabase Auth verifies the token itself** once CAPTCHA
protection is on in the project, so there is no siteverify code in this repo and
the secret key lives only in the Supabase dashboard.

Supabase's server asks a token of five calls and only these: `/token` for the
password grant, `/signup`, `/recover`, `/otp` and `/resend`. Code checks,
refreshes, emailed links and the two-step code are exempt. So the cover asks
for one on `in`, `up` and `forgot` (`needsToken()`) and on "Text me a new
code", the module passes it as `captchaToken` on exactly those calls (K52), and
a refusal reads as `captcha` (K53). **A new call to any of those five
endpoints has to carry a token**, or it breaks the day the check is switched on.

Three things are easy to undo. The script loads when the form opens, never
before, so a plain visit to the desktop cover sends nothing to Cloudflare. A token
is good once, so the widget is reset after every call (`captchaSpent()`) and a
run already in flight is waited for rather than started twice. And
`challenges.cloudflare.com` is in `script-src` and `frame-src` in
`deploy/v6.4/_headers`; K53 holds the cover's origin and the policy equal.

**The check is shown whenever the form is open** (the owner, 11 October 2026),
as `appearance: 'always'`, in `in`, `up`, `forgot` and `code`. It was shown
only to hand typed details for one revision, and that hid it from everybody
whose browser or password manager filled the form, which read as no check at
all. `open()` loads and runs it (`capRun()`), so the desktop cover still sends
nothing to Cloudflare until "enter here" is pressed, and a phone, whose form is
open on arrival, loads it at once. A token that expires while the form sits
open is fetched again. Nothing is said beside it: the "One more step" sentence
is gone. The slot is out of the row until the widget is drawn
(`.captcha.shown`), because an empty frame there pushed Sign in off the
password's line. A press
still waiting on the check has sent nothing, so choosing another mode withdraws
it (`sendGen`, `preSend`); before that, "Sign in instead" did nothing while a
Create New Account press waited for a tick.

**Deploy the page before switching the check on in Supabase.** The reverse
order refuses every sign in until the page arrives. Driven in a browser with
Cloudflare's test keys: the always passing key put a token on sign in, sign up
and the reset email, the blocking key told the reader and sent Supabase
nothing, the interactive key drew the box and said why, and no key fetched
nothing from Cloudflare.

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

**The way in is a subtitle, and it waits for the title** (on the desktop; a
phone shows the sign in form straight away, see "Signing in on the cover"). The arrow in the top
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

**A lower rung must not paint a black hole around the hole.** `uSteps` falls from
235 to 62 down the ladder, and a ray that passes the hole spends most of its
budget crawling through the disk zone at `dt` 0.20. At the low rungs it was
still in flight when the loop ended, neither captured nor escaped, so it took no
sky: a solid black saucer swallowing the outer disk and the starfield around the
hole. It was reported as the event horizon "cutting out" on desktop, and it only
shows once the ladder has fallen, which is why 1280x720 and 1920x940 were whole
in this container and 2560x1080 was not; a real machine reaches it through a wide
or dense display on an integrated GPU. The fix is after the loop and leaves the
integration alone: a ray with an impact parameter above `BCRIT` is never
captured, so one that ran out of steps is treated as escaped and reads the sky
along the direction it has. Below `BCRIT`, or inside r 3.0, it stays black. That fallback was not enough on its own: it painted the black away but the
disk's upper and lower arcs were still missing at the bottom rung, because those
rays had been abandoned before they reached the disk, and the sky they read was
smeared into streaks. The real fix is in the integration's step LENGTH, not its
count: `dts = max(1.0, 190.0 / uSteps)` scales `dt` up as the budget falls (to a
cap of 4.0), so every ray still finishes its journey at a coarser step. It is
1.0 at 190 steps and above, so the top three rungs run the code they always ran.
The test that found it forces a rung: replace `let qi = 2;` with the rung wanted
and stub `drop()` and the two averaging branches, serve that copy, and render at
2560x1080. Rung 0 is the truth, rung 8 should show the same picture at a lower
resolution, and a missing arc or a black dome above the hole is this fault again.
Do
not read a screenshot taken at one size as proof of the ladder: the rung is
chosen by how fast the machine is, so check the render at the bottom rung too.

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
not re-run. One hash is not an address and is left on the cover: one carrying
`access_token`, `error` or `error_code`, which is how an email the cover sent
comes back (see "Signing in on the cover"). P9 of that drive holds that a deep
link is still forwarded.

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

## Signing in on the cover: a password, and why the emails come back after the #
The owner asked for Google sign in on the cover on 28 September 2026, as part of
moving toward the Celestial Codex direction, then for an emailed sign in link
the next day, and later that day for an email and a password in place of the
link. It rides the Supabase project the cloud sync already uses, so there is one
account system, not two. The cloud UI spec's "No provider sign-ins" line
describes the temporary Settings surface of step 4 and is superseded here for
the cover.

**Google is gone, not hidden.** It was hidden in v6.4 and taken out on 29
September 2026 at the owner's request ("for now, take away the google oauth"),
because a Google Cloud OAuth client is a setup the owner is not paying for. The
button, its handler, its sentences, `providerEnabled()` and `oauthStart()` are
all removed. To bring it back: a Google provider in Supabase (Authentication,
Providers, with a Google Cloud OAuth client whose redirect URI is the project's
`/auth/v1/callback`), then the button and the two functions from git history
(commit c098bf4 and before). It would come back as `?code=` on a PKCE client,
and `oauthFinish()` still finishes exactly that.

**The emailed sign in link is gone too, and the reason is the one to keep.** It
rode PKCE so that it came back to the cover as `?code=`, before the `#`, where
neither page routes. The price of PKCE is that the code verifier lives in the
browser that asked, so the link only finished there. People open email on the
phone, or in a mail app's own browser, and the report was exactly that: it
opened in a different browser and did not sign anybody in. The owner asked for a
password instead ("replace the send link with a password entry").

**A password sign in needs no flow at all, and the two emails left use the
implicit one.** `signInWithPassword` returns a session in its own response.
What still sends email is confirming a new address and choosing a new password,
and on the implicit flow both come back with the session's tokens after the
`#`: nothing is kept in the asking browser, so they work wherever they are
opened. So the cover has ONE client, `coverLib()`, on the implicit flow, with
`detectSessionInUrl` off so a token is taken only where the cover chose to take
it, and `persistSession` on, writing to the same localStorage key the app's own
client reads. K15 asserts that shape and goes red on `pkce`.

**The `#` is the router, so the cover's hash forward leaves a token hash alone.**
Any hash carrying `access_token`, `error` or `error_code` stays on the cover.
Forwarded, it would arrive in the app as a route with the tokens sitting in its
address bar. The sign in script reads it, drops it from the address with
`replaceState` BEFORE anything is asked, and hands the tokens to
`adoptSession()`, which calls `setSession`: supabase-js checks the access token
with the server before it stores anything, so a hand written hash signs nobody
in, and the address the cover then names is the server's, never the url's. A
`type=recovery` hash opens the form in its set mode and asks for the new
password (`passwordSet()`, `updateUser` on the adopted session); every other
type goes on to the app signed in. P7 of the browser drive forged a token and
nothing was stored.

**Four modes, one form**, and two more since 30 September 2026 (`code` and
`back`, in the next section). `data-mode` on `#mailform` is `in` (email, password,
Sign in), `up` (email, a new password of eight or more, the newsletter box,
Create New Account), `forgot` (email, Send reset link) and `set` (a new password,
Save password). A mode is a set of rows, never a second form, so what is typed
in one survives into the next, the password included: somebody who filled in
both fields and then pressed Create New Account has already chosen it.

**Create New Account is a button, not a link**, in its own full width row under
Sign in, named as the owner asked for it on 29 September 2026 ("i want to be
able to click Create New Account and create a new account"). It was a small
underlined link, which read as secondary on a form whose two jobs are signing in
and making an account. The first press shows the newsletter box and turns the
form's own button into Create New Account; the second press makes the account.
It takes two because the box starts ticked, and a sign up sent before the box
was ever on screen would record a yes nobody saw asked. Focus goes to the box
when both fields are already filled, so the reader meets it on the way. The password field's `autocomplete` moves
with the mode, `current-password` or `new-password`, so a password manager
saves and fills the right thing. `Continue without an account` is hidden only in
`set`, where the reader is signed in and the sentence would be false.

**Three answers from a sign up, because Supabase gives three.** With Confirm
email on, which is the project default and what the newsletter list depends on,
a new address gets a confirmation link and no session: the cover says so, puts
the form back on sign in with the address kept, and the link signs them in
wherever it is opened. With it off, the session comes back at once. And an
address that already has a confirmed account is answered like a new one, so no
stranger can test an address for an account; the only tell is a user with no
identities, which `passwordSignUp()` reports as `exists` so the reader is sent
to sign in rather than told to wait for an email that will never come. K35.

**Every refusal is a reason, never a throw**, chosen by Supabase's code where it
sends one and by its message where an older project does not: `wrong`,
`unconfirmed`, `exists`, `weak`, `same`, `closed`, `rate`, `offline`. The order
in `authReason()` matters once: a new password equal to the old one is refused
with a sentence that also matches the weak one, so `same` is tested first. K22
holds all of it, and goes red if that line is removed. Eight characters is
checked on the page before anything is sent (K23); a project that asks for more
still refuses, and that reads as `weak`.

**Readers who signed up by the emailed link have no password.** The wrong
password sentence says so and points at Forgot password, which sets one: a
recovery email works for an account with no password exactly as for one with
one. This includes the owner's own account.

**A link sent before the change still works.** A sign in link already in
somebody's inbox returns as `?code=`, and `oauthFinish()` still exchanges it: the
PKCE client stored the verifier under the same key the cover client reads, and
the exchange does not care which flow the client was made for. K18 and P11.

**Every Supabase call is still in `incommon-cloud.js`**, and none of the cover's
needs `init()`, because the cover has no ProfileManager. The module's header
rule, never touching the network without a session, carries its one exception
in writing: signing in, making an account or asking for a new password on the
cover, and taking the session an emailed link brings back, none of which
carries local state. K15 to K25 and K35 to K37 cover the module (K17 was
Google's and went with it); an eleven case browser drive with Supabase faked
covers the page, including the confirmation and the reset each opened in a
fresh browser context. Every cover address has to be in Authentication, URL
Configuration, Redirect URLs, or Supabase sends the email's reader to the Site
URL instead. Supabase's built in sender allows only a few emails an hour, and
confirmation emails count, so launch traffic wants a custom SMTP sender.

**The script is plain, not part of the module, and loads nothing until asked.**
With no WebGL the module dies at the renderer, and a way in that died with it
would be a second failure on top of the first. The two files it needs, the
vendored Supabase client and `incommon-cloud.js`, are loaded on the first submit
or on the return from an email, never at page load. The app address is read off
the "enter here" link rather than written a third time, because
`build-bundle.js` asserts there are exactly two copies of it. The build copies
both files beside `index.html` as `SIGNIN_FILES` and refuses if the cover stops
naming either one. Once signed in, the reader goes on through the link, so the
module's exit runs, exactly as "Continue without an account" does.

**The module is loaded as `./incommon-cloud.js?v=` its own VERSION**, and the
build refuses a cover whose `?v=` is not the one the module declares. The
bundle's worker serves everything but a navigation cache first, under a cache
name that moves once per release, so a device that had loaded the module for
the emailed link would have been handed that copy by the password cover: no
`passwordSignIn`, and the reader told the sign in files did not load. Bump the
module's VERSION and the cover's `?v=` together whenever the cover starts
calling something new.

**What an email brings back is read for what it means and never echoed.**
Anybody can write a link to the cover with any `error_description` in it, and a
sentence of theirs painted on the first screen would read as ours: a crafted
"call this number" came back as the cover's own fixed sentence and nothing of
its text. `error_code` is a fixed vocabulary, so it may choose the sentence and
is still never shown: `otp_expired` says the link expired or was used, and
everything else reads as did not finish, each pointing at the password and at
Forgot password. It is read from the hash, where the implicit flow puts it, and
from the query, where PKCE did. A failed load of the two files is forgotten so
the next press retries, and a return through the back button lets the held
button go. `incommon.signin.via`, which chose between the link's sentences, is
read by nothing now and is removed once from any browser that still holds it.

**One thing on the cover changed that the section above states as a rule.** It
has more than one control now: H5 still counts one `a[href]`, because the
sign in controls are buttons that do not navigate by themselves. With Google
gone, the rim is again the only green of any kind on the cover.

**Opening the form centres the title and the form as one column.** At rest the
way in hangs below the middle so the title sits over the hole. Four rows hung
the same way ran off the bottom of a phone, so `body.open` puts the subtitle
back in the flow and `align-content: safe center` centres the two together; a
screen too short for the column, a phone on its side, scrolls it. Measured
across nine sizes from 320x568 to 1920x1080 in every mode: every control inside
the viewport and at least 44px tall, nothing overlapping the title, the one
exception the phone on its side, which scrolls as designed.

**"enter here" is the way to signing in, and only that.**
Decided by the owner on 29 September 2026, in v6.4, and narrowed on 30
September ("on desktop, enter here should only open up the email and password
entry area"). A press of "enter here" opens the form in its place, with
"Continue without an account" under it, and never goes into the app: a second
press takes the reader back to the first empty field. The way in without an
account is that button, and Sign in goes in on its own once it succeeds. Three
things keep it from costing anybody the way in they had:

- **The link is still a real anchor with a real href**, untouched in the markup,
  so with the sign in script dead it navigates exactly as it always did, and the
  build's two copies of the app address and its `<a class="enter" href=...>`
  check are unchanged. `aria-controls` and `aria-expanded` are written by the
  script for the same reason: only while it runs does the link open anything.
- **"Continue without an account" goes on through the link** by clicking it,
  so the module's exit, the rim becoming the mark, runs exactly as before. The
  plain script's listener is registered before the module's (a plain script
  runs while the page parses, a module after it), stops every press of the link
  with `stopImmediatePropagation`, and steps aside only when `through` is set,
  which only Continue without an account and a finished sign in set.
- **A return that did not finish opens the form by itself**, an expired link
  or a refused one, because what that reader needs next is the password or a
  new link, one field away rather than one press away.

H15 asserts both steps now, in one row so the
phase stays at 17: the first press opens the form without leaving or starting
the exit, the opened state passes 44px and 4.5:1 with the page at the top where
both sweeps can see it, and "Continue without an account" runs the exit. P13 of
the password drive presses the link twice and three times and stays on the
cover.

**On a phone there is no "enter here" at all.** The owner asked on 30 September
2026 for the phone to show the email and password and nothing in front of
them, so the form is open from the start and the link is not drawn. A phone is
what the app calls one, narrower than 820, or a touch screen under 500 tall,
which is the same phone on its side and would otherwise get the desktop's link
at 844 wide. The sign in script sets `body.phone` and CSS hides the link from
that class, never from a media query alone: with the script dead the form cannot
open, and a link hidden by width would leave a phone with no way in at all. The
anchor stays in the markup either way, because Sign in and Continue without an
account go on through it. Nothing is focused on load, so the keyboard does not
spring up over the page before the reader has seen it. P15 drives it at 390 wide
with touch, and a tablet keeps the desktop's link.

**The password has an eye.** A button at the field's right end shows what was
typed and hides it again (the owner, 30 September 2026): a slashed eye while it
is hidden, an open eye while it shows, one fixed name, "Show password", with
`aria-pressed` carrying the state. Its press is cancelled on `pointerdown` and
`mousedown` so focus stays in the field, because on a phone focus leaving the
field drops the keyboard; the click still lands. The field goes back to a
password field the moment the form is sent, so a password manager sees one when
it offers to save. It is a 44px target inside the field, which leaves it room.
The field is wrapped in `.pw` for that, so the mode switch hides the wrapper,
not the input. P14.

**Without WebGL the way in was invisible, and it is not any more.** The title
and the way in are revealed by `body.live`, which the module adds on its first
frame. With no WebGL the module dies before that, so the whole column sat at
opacity 0 under the SIGNAL LOST message: a device without WebGL could neither
sign in nor go in. `body.signal-lost`, set by the 9 second fallback, brings the
column up now, the wordmark at the dim its own rule already gave it. Measured
with WebGL disabled: both at 0 before, both at 1 after.

**Signing in on a new device brings the account down** (see "One account reads
the same on every device"). The first run used to say "No account, no sign-in",
which contradicted a reader who had just signed in on the cover; the Codex page
below replaced it and does not say it. The tucked away classic form still does, so if it is ever
brought back, that sentence goes back to the consent language pass.

## Remember me and the phone
The owner asked on 30 September 2026 for a Remember me box ("i need loyal users
to have that convenience"), for signing in by phone, and for the phone on the
profile to recover the password by text. `docs/PHONE-SETUP.md` is the owner's
half: nothing here sends a text until Supabase has an SMS provider, and until
then a number is answered with `phoneOff`, in words, and email is untouched.

**The password is never this page's to keep.** A password in localStorage is
readable by every script that ever runs on the origin and by anybody holding the
device, and it would be the one secret this app stored in the clear. So
Remember me keeps three things and the password is not one of them: the login,
in `incommon.signin.remember`, filled back into the field next time; the
session, which is what staying signed in is; and the password goes to the
browser's own password manager, through `PasswordCredential` where Chromium has
it and through the `username` and `current-password` autocomplete names
everywhere else. Q1 of the drive scans every stored value for the password and
K44 does the same in the module.

**Unticked, the session ends with the browser, and that took a sweep.** The
session sits in localStorage, which survives a closed browser, so a box that
only forgot the login would change nothing a reader could see. An unremembered
sign in sets `incommon.signin.ephemeral` and a cookie with no expiry,
`incommon_signin_live`, which the browser drops on closing. Mark present and
cookie gone means the browser was closed, and the stored session is removed
before any client reads it: by `ephemeralSweep()` in `init()` on the app, and by
the cover's own copy at load. The two copies share four names (the two keys, the
cookie, and `sb-<project>-auth-token`), and K38 reads both files and holds them
equal, because the cover loads nothing until asked and so cannot call the
module to do it. K45 and Q3, reopened with the session cookie dropped, prove it
on both pages. A browser that restores session cookies on relaunch keeps the
reader signed in, which is that browser's choice and not a fault here.

**Remembered, the cover offers the way on, not the form.** `back` mode: "Signed
in as ...", one Continue button that goes in without a request, and "Use another
account" to reach the form with the login filled. It is read from the stored
session at load, never from the network. `?signin=1` skips it on purpose: the
app sends a reader there because it found no session, so a stored one is stale.
The desktop still opens it with "enter here", by the owner's rule of 30
September; the phone shows it at once.

**One field takes an email or a number**, "Email or phone", `type=text` so a
phone keyboard does not hide the digits behind an email layout. The module
decides which it is (`idOf()`, `normPhone()`): ten digits, or eleven starting
with 1, is a US or Canadian number, `00` is the international prefix, and
anything else needs its `+` and country code, because guessing a country is how
a code goes to a stranger. The cover's `isPhone()` only picks a label and hides
the newsletter box; it never decides what is sent. Numbers are shown grouped
only where the grouping is certain, `+1 555 123 4567`, and as sent otherwise.

**A number has two paths through Supabase, and both end in a session.** A sign
up by phone is `signUp({ phone, password })`, which texts a code with phone
confirmations on; the code is `verifyOtp` type `sms`. A new password by phone is
`signInWithOtp` with `shouldCreateUser: false`, then the same `verifyOtp`, then
`set` mode on the session it brought, which is the step the reset email leads to
as well. Supabase has no reset text as such, and a code that signs the number's
account in is the honest equivalent.

**Nobody learns whose number has an account.** Supabase refuses a code for a
number with no account (`otp_disabled`, "Signups not allowed for otp"), and the
module answers that exactly as it answers a sent code, as the reset email does
for an address. Q5 drives both and compares the sentence. `exists` on a sign
up is the one tell, and it is the same one email already has.

**`code` mode sends a text only when pressed for.** A number that was never
confirmed (`phoneUnconfirmed`) is taken to the code step with "Text me a new
code" under it, and nothing is sent until that is pressed: a text costs money,
and an automatic one on a failed sign in is a way to make the page send texts
to a number the typist does not hold. Q6 counts zero.

**A phone on an existing account is the app's, not the cover's.** Most accounts
were made by email, so the profile card (Profile, in the profile menu) has a Phone number item in both shells:
the number, `updateUser({ phone })`, then the texted code as `verifyOtp` type
`phone_change`, on the session the app already holds. `phoneAddVerify()` writes
the confirmed user into the module's session and notifies, so the menu names the
number at once rather than after the auth event lands. Signed out, the dialog
says why and offers the cover's sign in. Q7 and Q8 drive it in both shells, Q9
signed out, and all five states measured clean over the 32 theme cases at 1440
and 375 (no pair under 4.5:1, nothing under 44px).

**The rows.** K38 to K45 in the module; Q1 to Q9 in a browser drive with
Supabase faked, and P1 to P15 of the password drive still 15 of 15; the layout
sweep at nine sizes now walks `code`, `set` and `back` through the real script,
with the phone on its side scrolling as designed and nothing else out of place.

## The first run is three stations on one line, and inCommon's old form is tucked away
The owner asked on 29 September 2026 for the Celestial Codex's birth page to
become the first run, with inCommon's put away rather than deleted, and on 20
October 2026 for that page to be re-imagined without "Cast My Codex". So the
Codex's words are gone ("The First Inscription", "Tell the Codex when you
arrived", the three coordinates line, the button), and what came from it in
substance stays: one card, the full birth name, the date and the time side by
side where there is room, and a place search that lists candidates with their
coordinates and zone.

**The page now.** The wordmark between two `--ac2` bars, a horizon drawn in SVG
(half the zodiac's ring, a tick at every sign boundary, a light at the top,
`aria-hidden`; no `img`, `canvas` or `iframe`, which G4 refuses inside the
gate), "Where your sky begins." in the display face, and no line under it, by
"No disclaimers". The card is three stations on a rail: **Your name**, **The
moment** (date, time, the unknown switch) and **The place**. Each station has a
node on the rail that fills with `--ac2` once it is answered (`cxN1` to `cxN3`
in `authVals()`: a name typed; a whole date and either a whole time or the
switch; a place that resolved), so the page shows how far along the reader is
without a sentence saying so. The nodes are fills, never text. The one action
is "Reveal my sky", a pill in `--ac`, and Skip for now stays under the card (R2,
G4). The state names still say `authCodex` and `cx*`: they are identifiers, and
renaming them would buy nothing.

**Tucked away means one flag.** `FIRSTRUN_CLASSIC` on the logic class is false,
`authVals()` sets `authCodex` or `authBirth` from it, and inCommon's form is still
in the markup whole behind `authBirth`. The two pages share every field, handler
and check, so setting the flag true brings the old page back with nothing else to
change.

**What was adopted, and what was kept from inCommon because it is correctness
rather than style.** The Codex's time field was a native `type=time` defaulting
to 12:00 and marked known, which is exactly the two faults "The birth moment has
three states" exists to prevent: a platform dependent control, and a noon that
reads as an answer. So the time stays digits and an explicit 24h, AM or PM, empty
until typed, and "I don't know my birth time" is a switch that records unknown
rather than a default. The Codex showed a chosen place's coordinates and zone;
this page adds the offset that applied on the birth date and whether daylight
saving was in effect, which is the part that moves the Ascendant. Errors stay
field level, with `aria-invalid` and `aria-errormessage` per field, because G7
holds that. And the page is drawn in tokens: the one action wears `--ac`, the
labels wear `--ac2-hi` because `--ac2` is never text, the rail, nodes and
horizon wear `--ac2` as fills and strokes, and the heading's gradient runs between `--tx` and
`--ac2-hi` so it holds its contrast in every identity. The Codex's gold has no
token here, and a hex in the template is exactly what the theme boundary bars.

**What it requires.** The Codex refused to cast without a name, a date and a
place. Here the date is required, because a cast with no date casts nothing,
and a place that was typed has to resolve, because an unplaced city used to save
quietly and draw whole sign houses. The name is not required: a chart does not
need one, and inCommon's rule that the date alone is enough to begin still
holds. Skip for now stays, under the card, and R2 and G4 hold it there.

**The name is split the way the Codex split it.** The full name goes to the
birth name store the Numbers page reads, `incommon.p.<id>.birthName`, because
Expression and Soul Urge read every letter; the profile is named by its first
word, which is what the Codex called the reader.

**The place search is debounced and memoised, and that is measured.** A
`Gazetteer.search` over 170,000 places costs about 150ms and a
`PM.geocode` of one exact name about 130ms, and `authVals()` runs on every
render of this page. So the search reads `afPlaceQ`, a copy of the text that
settles 350ms after the last keystroke, the Codex's own debounce, and both
answers are kept for the text they were asked about. Coordinates typed as
latitude, longitude are an answer rather than a search: their digits otherwise
matched six towns in Kazakhstan. A place typed out in full counts as picked.

**The page holds still while it is filled in.** It used to be centred with
`margin: auto`, so every line that appeared moved the whole card: the place
candidates pushed the button 278px, the unknown time switch took the time field
away and pulled the place up, and an error banner above the card shifted every
field down while somebody was typing in them. Now the column is top aligned, the
place candidates float over the card as a dropdown (`position:absolute` under the
input), the date and time errors, the place messages and the unknown time note
each live in a reserved slot, the time field keeps its row when the switch is on,
and the form error sits inside the card above the button, so the only thing it can
move is the button. Measured by driving the page: name, date and place stay at the
same y through typing a place, switching the time off and casting with errors.
Anything new that appears here belongs in a reserved slot or an overlay, never in
the flow above a field.

**G7 finds the date field by type now**, inside the gate, because its label moved
from "Birth date" to "Date of birth". What that row tests is the error wiring,
and it should not break on a wording change again.

## The phone sample banner is pinned, so every section carries its shadow
The sample banner in the vertical shell is `position:absolute` under the header,
deliberately outside the scroll so it is never a snap stop. Every section pads
its top by `var(--hdr)` alone, so the banner covered the first 62 pixels of each
page at 390 wide and 78 at 320: the date on Today, the introduction on Spirit.
`main` had it too.

Each of the five sections now opens with `data-sample-spacer`: the banner's own
row, laid out the same way, `visibility:hidden`, `aria-hidden`, with spans where
the banner has a button, behind the same `sampleOn`. It takes the banner's exact
height at any width and any text size without measuring anything, measured equal
at 320, 390 and 430. **If the banner's padding, gap, font or button box
changes, change the spacer with it**, or the page starts short of it again.

## The Oracle took Throughline's seat, and Throughline went to the Library
The owner asked on 29 September 2026 for Throughline to become a tab in the
Library and for its place in the nav to go to the Celestial Codex's Oracle,
"where the user will be able to get their full fix of what they come to find",
in the Codex's language, and chose a reading written by a model over one
composed on the device. That reverses the V1.6.0 stance for this screen and for
this screen alone. It is the owner's call and it is recorded here rather than
argued again.

**Throughline is the fourth Library tab.** The six tabs are Study, Journal,
Readings, Throughline, Archive and The Commons (see "My Charts is three charts,
and the Library is six tabs"), and `libTL` is the gate: `libSub === 'throughline'`
with no room and no practice open. It is NOT gated on `curTab()`, the way the
Study, Journal and Readings lists are not, because the phone draws the Library
section whichever section is in view. The markup is
the old tab's, moved, with `position:relative` added to its wrapper so the "+"
still anchors to the record rather than to the section. `/library/throughline`
is the address, and `/throughline` is kept as an alias in `openPath()`, the same
way `/spirit/together` is kept for Synastry. Every handler that used to write
`tab: 'throughline'` writes the Library tab now, and the two search rows go
through `searchLib()`.

**The Oracle is `tab: 'oracle'`**, `DT_NAV` and `VT_SECTIONS` in the same seat,
so the phone's section indices did not move and nothing that scrolls to
Settings by index changed. Its icon is new in `build-ui-icons.js` and
`icons.json` both, by the registry rule: the sky as a whole with the lens on its
side, which is an eye. `oracleVals()` is spread beside `dreamVals()`, and the
vertical shell forces `isOracle` true in `vtVals()` the way it forced
`isThroughline`.

**The words are the Codex's.** Today, the day's omen; This Week, the seven-day
tide; This Month, the lunar chapter; Standard and In-Depth; The Stars,
astrological weather; The Design, your energetic current; The Numbers, the
cycle's cadence; Love & Kinship, Work & Purpose, Spirit & Body; Celestial
Currents; Windows of Time; Shadow Work, what asks to be met; For the Journal;
A Small Ritual, the auspicious hue, and the mantra; and its two loading lines
and its "silent for now". The screen is drawn in tokens, with every purple
line in `--ac2-hi` and the one action in `--ac`, like the first run.

**The theme phase does not see this screen**, because it measures `#/today`
only, so it was measured by hand with the harness's own `contrastFails()` and
`tapTargets()` lifted out of `tests-v6.0.js` unchanged: four identities, each
hardened and not, at 1440 and 375 wide, with a full in-depth reading on screen
(55 elements) and with the consent panel. All 32 cases: no pair under 4.5:1
and no control under 44px.

**The key is never in the page.** `server/oracle/index.ts` is a Supabase Edge
Function that holds `MOONSHOT_API_KEY` as a secret; the app calls it through
`incommon-cloud.js`, which is still the only module that talks to Supabase.
`oracleRead()` answers every failure as a reason the page can say in words,
never a throw, and K26 to K29 cover that, K28b the Luminary refusal. The
function lives in `server/`, not `supabase/functions/`, because this repository
is connected to Supabase's GitHub integration, which watches a `supabase/`
folder and can open preview branches that are billed. `docs/ORACLE-SETUP.md` is
the owner's setup, with the cost of a reading and the prepaid balance that
bounds it.

**Kimi writes the readings**, Moonshot AI's model, which the owner chose on 29
September 2026 in place of Claude. It is asked with `fetch`, not a client
library: the API is one POST to `api.moonshot.ai/v1/chat/completions`, and a
library would be a dependency that can move under a function pasted into a
dashboard. The Codex's schema goes as a strict `json_schema` named
`horoscope`, the instructions as the system message (first and unchanging, so
Kimi's cache serves them at a sixth of the price), the dossier as the user
message. What comes back is read leniently, from the first `{` to the last
`}`, because a code fence around a paid reading is not worth failing it, and
then held to the schema's required keys, because half a page is worse than an
error.

**`kimi-k2.6` with thinking off is the default for both depths, and the reason
is the clock.** Supabase stops a function at 150 seconds on the free plan.
Kimi's own API writes `kimi-k2.6` at about 70 tokens a second and `kimi-k3` at
40 to 60, and an in-depth reading is several thousand tokens. The Codex asked
for more thought before an in-depth reading; that is `ORACLE_DEEP_THINKING`,
off by default, `on` for `kimi-k2.6` or `kimi-k3`'s own `low`, `high` and
`max` (it cannot be switched off there, so off means low). The function
abandons the call at `ORACLE_TIME_LIMIT` (140 seconds) and says TIMEOUT rather
than being killed mid write with a pending row. Measured speeds are from
Artificial Analysis, not from this build, which has never called Kimi.

**Kimi's failures map onto the Codex's two codes.** A rate limit or an
overloaded engine is RATE_LIMITED; an empty balance
(`exceeded_current_quota_error`, also a 429, so the type decides), a refused
key, a model name Kimi does not have, a server error or no connection at all is
OUT_OF_CREDITS, silent for now, and the row is released because nothing was
written. A content filter is REFUSED and a reading cut off at the token limit
is TOO_LONG; both count, because Kimi wrote and was paid. The function was run
under Node against a fake Kimi and a fake Supabase (auth and PostgREST in
memory) for 37 cases, request shape, every error path, the timeout, the daily
limit and the knobs, and typechecked strict against the real Supabase types.

**It operates as the Codex's Oracle did, and that was checked, not assumed.**
The owner made it the condition of merging (29 September 2026), so the Codex's
own code was read and run rather than recalled. The server asks with the
Codex's `INSTRUCTIONS` and `DEEP_INSTRUCTIONS` word for word, its two JSON
schemas key for key, its request line (`Compose the ... horoscope for
{label}. DOSSIER:`), its period keys and labels, its instants (the day at noon
UTC, the week at its Thursday, the month at its fifteenth). The page asks the moment the Oracle is open and again
when the period or the depth changes, as the Codex's query did, shows its orb,
line and skeleton while it waits, its drop cap, its sections in its order, and
fails in its words: silent for now with no retry, resting and clouded over with
Ask again. `oracleDossier()` is the Codex's `buildCosmicContext()` line for
line, including the first name it sent. The Codex's builder was bundled with
esbuild and run on the same births, and the dossiers compared line by line.

**Where it does not, and why each one stays.** These are the whole list:

- **The model is Kimi.** The Codex asked an OpenAI model through its own
  adapter. The instructions and schema are the same; the prose will not be.
  Nor is the extra thought the Codex asked for before an in-depth reading,
  which is off by default here for the time limit above.
- **The first reading waits for one press**, Consult the Oracle, beside the
  sentence saying what is sent. The Codex kept birth data on its server from
  sign up; inCommon promises the chart stays on the device until the reader
  says otherwise. After that press the screen behaves as the Codex's did.
- **The ask waits 600ms after the screen comes into view**, because the phone
  draws every section at once and a reader scrolling past must not pay for a
  reading they never looked at. The Codex's tabs mounted only when chosen.
- **A daily limit of six attempts**, and a claim on the key before the model is
  called. The Codex had neither and bounded its bill by caching alone.
- **No dash reaches the page**, by inCommon's rule: the weekly label says "to"
  where the Codex wrote a dash, and the server strips any the model writes.
- **Each reading is given an emphasis, a voice and a well of imagery**
  (owner, 13 October 2026), so two readers with the same chart get readings
  that differ in what they lead with and how they sound, never in what they
  say about the sky. `voiceFor()` picks one of 8 lenses, 6 registers and 5
  image sources from a hash of the reader's id, the period and its key, and
  adds a line holding every placement, aspect, gate, number and date to the
  dossier. It rides in the user message, after the request line, so the
  system message is still the Codex's text word for word and still the part
  Kimi's cache serves. One reader keeps one pair for a period (both halves of
  an in-depth reading match) and the next period turns to another. Two
  readers land on the same three about one time in 240, and the model's own
  sampling still separates them then. Nothing new leaves the device.
- **Where the two apps compute a chart differently, the dossier carries
  inCommon's chart**, so a reading cannot contradict the wheel, the wiring or
  the numbers page beside it. Where the Codex computed better, inCommon took
  its method (see "Where the Codex computed better, inCommon took its
  method"), so what is left is where inCommon is right or the two are choices:
  the master numbers inCommon keeps in every personal cycle (a Personal Month
  or Day of 11 where the Codex reduced it to 2), the Ascendant to within
  arcseconds (inCommon pairs the apparent sidereal time with the true
  obliquity where the Codex took the mean one), six of the 64 gate names (2,
  10, 29, 47, 61, 62), and Black Moon Lilith, which is the mean lunar apogee
  here: the Codex's formula is the perigee, so its Lilith sat in the opposite
  sign for every reader, and copying it would have copied that. Run against
  the Codex's own builder on two births after these changes, 115 of 138
  dossier lines are identical and every difference is one of those.

**What leaves the device is the Codex's dossier**: the first name, positions,
houses and aspects, the Human Design type, authority, profile, centres,
channels and Sun gates, the numbers including the name numbers, and the sky at
the period's instant with its transits to the chart; the in-depth dossier adds
the Codex's advanced points, minor aspects and every activation. No journal
entry, and no birth date, time or place. The positions are enough to work out
roughly when somebody was born, and the consent panel says exactly that.

**Asking on open is paid for once per period.** A reading is kept on the device
under `incommon.p.<id>.oracle`, keyed by period, period key, depth and the
profile's birth stamp, so a corrected birth time finds nothing rather than the
old chart's reading, which is what the Codex did by deleting its readings when
the birth data changed. The server keeps it too, keyed by a hash of the
dossier, so opening the Oracle again, here or on another device, costs
nothing. The consent is `incommon.p.<id>.oracleConsent`. `deleteProfile()`
cascades both keys. `oracleAutoAsk()` runs from the one `componentDidUpdate`;
leaving the screen forgets a failure, so coming back tries again, as the
Codex's query did on a remount.

**The server holds the limits the page cannot.** A daily limit per reader
counts readings written or being written, and a failed attempt does not use one
up (changed 10 October 2026: a timeout was costing readers one of their six
for nothing); failures are bounded at four times the limit so a broken request
cannot run up the bill; a row is claimed
before the model is called, and a partial unique index lets only one pending
or finished row exist per key, so a double press or a second tab waits rather
than paying twice. The table is written only by the function with the service
role; a reader may read their own rows and nothing else, so nobody can delete
the rows the limit counts. An in-depth reading is refused with
PREMIUM_REQUIRED before any of this, and before the stored reading is looked
up, as the Codex's `requirePremium` did, so a refusal costs nothing and counts
nothing. Every string the model returns has dashes replaced
before it is stored, by a detector built from char codes.

**The page does not say resting while a reading is on its way.** Two answers
used to paint "The oracle is resting" over a reading that was being written.
PENDING is the server saying a reading for this key is already being written,
which is what a reload in the middle of one looks like, and a phone reloads a
backgrounded tab often. RATE_LIMITED is Kimi saying it is writing another, and
on the $1 recharge tier Kimi writes one at a time for the whole app. So while
the reader is on the screen `oracleAsk()` waits them out (`ORACLE_WAIT`): every
ten seconds for up to six minutes on PENDING, which outlasts the server's five
minute release of a stuck row, and at 15, 30 and 45 seconds on RATE_LIMITED,
with the loading panel up and a line saying which it is. Only then does it rest.
Leaving the screen stops the waiting, and coming back asks again. The page also
asks for one reading at a time: another slot in flight or waiting defers the
next, which says it is waiting its turn, and the one componentDidUpdate asks
for it once the first is answered. Driven with the function faked: W1 to W5,
nine rows.

**The server says PENDING before it counts the limit.** It used to count first,
so asking again for the reader's sixth reading while it was being written came
back LIMIT and read as silent for now. It looks for a pending row for the same
key after the finished one and before the count; O38 of the fake Kimi harness
fails on the old order. Asking again for a reading being written costs nothing:
no row is claimed and the model is not called.

**A signed out reader is sent to the cover**, `?signin=1`, which opens the
sign in form at once and drops the query. The Oracle needs an account because a
reading is written for one person and kept with them; a sample chart is refused
on the page before anything is sent, because the Oracle writes for one person
and a sample is nobody.

## The in-depth reading is prepared ahead, and still opened with a press
The owner asked on 10 October 2026 for the Luminary reading to load in seconds.
It cannot be written in seconds: an in-depth reading is about six thousand
tokens, a minute or two of a model writing, and the function gives up at 140.
So the writing is moved to before the reader asks, and the owner chose that the
reader should still open it with the **Consult the Oracle** button rather than
have it appear on its own. This reverses "the page asks the moment the Oracle is
open" for the in-depth reading only. Standard readings are unchanged and still
ask when the screen opens.

**What the page does now.** `oracleWillAsk()` is false for `deep`, so nothing is
asked on open. On the In-Depth screen a Luminary who has agreed once sees
`orDeepGate`: the button and nothing else, whether the reading is already on the
device or not. Pressing it (`orDeepGo`) records that this slot is opened
(`orOpened`) and shows the reading at once if it is kept, or asks for it if it
is not, with the loading panel and the usual wait. `orOpenDeep()` also sets
`incommon.p.<id>.oracleDeep`, which is deleted with the profile like the other
Oracle keys.

**The preparing is `oraclePrepareAuto()`, from the one `componentDidUpdate`.**
Four seconds after everything is true it asks, quietly, for the current
period's in-depth reading: the page is ready, the reader is signed in on a chart
that is theirs, has agreed to the Oracle, has asked for an in-depth reading
before (`oracleDeep`), and the server has confirmed Luminary. It asks once per
slot per session, so the daily limit of six attempts is not spent on a page
nobody opened, and `lumAuto()` asks billing at start for a reader with
`oracleDeep` set rather than only when the Oracle is open, or the premium
answer would arrive too late to prepare anything. A reader who has never asked
for an in-depth reading sends nothing, which is what keeps the promise that the
chart stays on the device until they say otherwise, and keeps the cost to
someone who reads them.

**Quiet is a mode of `oracleAsk(period, depth, again, quiet)`.** A quiet ask
says nothing aloud, keeps the loading panel off the screen (`oracleVals` does not
count it as busy until the slot is opened), shows no error if it fails, keeps
waiting out PENDING and RATE_LIMITED when the reader is not on the Oracle, and
does not make a standard reading wait behind it (`orNonQuietBusy()`). The moment
the reader presses the button for that slot it is not quiet any more: the
panel, the announcement and any error are theirs. A failed preparation is
forgotten, and pressing the button asks again.

**What it does not fix.** The first in-depth reading a reader ever asks for, and
any period not yet prepared, still takes the full minute or two. Only the
current period is prepared, so weekly and monthly in-depth readings are written
when asked. Driven rather than read, in a browser with the cloud module faked:
no ask on open, the press asks, a prepared reading shows within half a second of
the press with no second request, a failed preparation is silent and the button
still works, and a standard reading still asks on open.

## The in-depth reading is written in two calls
Added 10 October 2026. One call for the whole reading ran past the function's
wall clock, so `oracleRead()` in `incommon-cloud.js` asks twice for depth `deep`:
`part: 'a'` (the standard fields written deeper, with `keyTransits`), then
`part: 'b'` (chapters, timing, shadow work, journal prompts), and the server
answers b with the two joined. The second half is stored under `chart_key + '.b'`,
so the table and its unique index are untouched. A reading counts once toward the
daily limit: `.b` rows are excluded from that count and bounded by it separately,
and b is refused unless a is done. A server that still answers the first call
with chapters already in it makes the client skip the second call, so the page
and the function can be deployed in either order. Do not merge the two schemas
back into one call, and do not count the b rows as attempts, or a reading costs
two of the six. K29b holds the client half.

## The first half is shown while the second is written
Added 10 October 2026. `oracleRead()` takes an optional `onFirst` callback and
calls it with the first half of an in-depth reading as soon as that call
answers, before the second is asked for. The page keeps it in `_orFirst[slot]`,
in memory only, and shows it once the slot has been opened with the button, with
a dashed status line (`orMoreOn`) saying the chapters, timing, shadow work and
journal prompts are still being written. It is never passed to `oracleKeep()`:
the kept reading is the whole one, so a half is never mistaken for it. If the
second half fails the first stays on screen, the line turns into the error and
Ask again appears. A new ask clears it. K29c holds the client half.

## In depth is Codex Luminary, and Stripe takes the payment
The owner asked on 29 September 2026 to charge for the advanced readings with
the Stripe payment the Celestial Codex had. The Codex's Luminary is ported
whole: $12.99 a month or $119.99 a year, Stripe Checkout, the billing portal,
the webhook, the lazy re-sync (a row is asked of Stripe again when it is not
active, past its paid period, or six hours old, so it comes right with no
webhook at all), admin addresses that pass without paying, and the Codex's
words on the gate. In inCommon Luminary unlocks the in-depth reading and
nothing else; the gate says in a line of its own that every chart, the wiring,
the numbers and standard readings stay free. `docs/LUMINARY-SETUP.md` is the
owner's half.

**One function, `server/billing/index.ts`, does the four jobs the Codex had four
handlers for**: status, checkout and portal for the page, and Stripe's webhook,
told apart by the `stripe-signature` header. One copy of the code that reads
Stripe's answer, rather than a webhook function and a billing function that can
drift. That is why it is deployed with **JWT verification off**: Stripe cannot
send a Supabase token. Readers are still named by `auth.getUser()` and refused
without one, and a webhook is believed only when `constructEventAsync` checks
its signature with the Web Crypto provider, because Deno has no Node crypto.

**inCommon's own lookup keys**, `incommon_luminary_monthly` and `_annual`, not
the Codex's, so pointing it at the Stripe account the Codex used can never pick
up or re-price the Codex's product. The first checkout makes the product
("Codex Luminary") and both prices.

**A 7-day free trial, once per reader, card taken at checkout** (the owner's
decision of 12 October 2026, both plans). The billing function grants it:
`trialOpen()` is false for anybody whose row carries a `stripe_subscription_id`
(syncCustomer keeps one once any subscription has existed, cancelled ones
included) or who has a `store_subscriptions` row of any status, and checkout
asks Stripe's own subscription list before adding `trial_period_days`, so a
missed webhook cannot hand out a second trial. The status carries `trialDays`,
and the page words the button and the terms beside it from that alone
("Start your 7-day free trial", the charge date and amount, how to cancel);
`trialing` already counted as paid in billing and the Oracle. Terms has a
"Free trial" part under "Price and automatic renewal". The apps' trials are
store introductory offers, so the page shows none of this in the apps. A
closed EU or UK country's trial is cancelled by `refuseIfClosed()` with
nothing to refund, since its first invoice is zero.

**Managed Payments is switched off on every checkout.** Stripe turns it on by
default for a new account, which makes Stripe the seller of record and refuses
any product without a tax code; on `2025-02-24.acacia`, the version `stripe@17`
pins, it refuses the session outright ("Managed Payments is not supported on
API version"). That is how checkout first failed in the sandbox on 12 October
2026: the customer and both prices were made and no session came back. inCommon
is the seller (the Terms, the EU and UK hold, `LUMINARY_TAX`), so the checkout
sends `managed_payments: { enabled: false }` itself rather than trusting a
dashboard default, through a widened params type because `stripe@17`'s types
predate the field. Turning it on would make Stripe the merchant of record and
is the owner's decision, with the legal pages changed in the same change.

**The website's gate names no price** (owner, 13 October 2026). It invites:
the plans read Monthly and Yearly, "Billed monthly" and "Billed yearly", the
annual one marked Best value where it is cheaper, and the button says Become a
Luminary or Start your 7-day free trial. The figures are Stripe Checkout's to
show, and it shows the price and the renewal before anything is paid, so the
renewal sentence beside the button says "at the price shown at checkout" and a
trial names its charge date without its amount. The store apps keep the prices,
because Apple wants the price on the purchase screen (3.1.2). The Terms
name no price either (owner, 13 October 2026): section 7 says the plan's price
and tax are shown at checkout and confirmed in the receipt, which is why
Stripe's customer receipts must stay on. A price change still owes 30 days'
notice, as the Terms promise.

**The paywall is the Oracle function, not the page.** The page's gate is
courtesy; `server/oracle` reads `subscriptions` itself and answers 402
PREMIUM_REQUIRED before it looks up a stored reading, as the Codex's
`requirePremium` did. When the page believed the reader paid and the server
did not, the page drops its belief, asks billing again with a sync, and shows
the gate. The table is written only by the billing function with the service
role, so nobody makes themselves a Luminary by writing a row.

**The page asks billing once, when the Oracle is first opened with a session**
(`lumAuto()`, from the one `componentDidUpdate`), never on render: the phone
draws every section at once, and a status per paint would be a Stripe call per
paint for anybody whose row has gone stale. Stripe returns the reader to the
page's own address with `?luminary=success` or `cancelled` before the hash;
`lumReturnRead()` drops it at mount, lands on In-Depth, and asks with a sync up
to five times while it still reads unpaid, which is the Codex's "Confirming
your payment with Stripe". A `pageshow` from the back-forward cache lets a held
checkout button go.

**Driven, not read.** 42 rows in a browser, both shells, against a faked
Supabase and Stripe: the gate in place of a reading, no in-depth call while
locked, the plan and price on the button, the checkout request and the
navigation to Stripe, the return confirming and welcoming, the member line and
the portal, a cancelled checkout, billing not deployed, and the server
refusing a page that believed it was paid. The gate and the member line
measured by hand in all 32 theme cases (four identities, hardened and not, two
widths): no pair under 4.5:1 and no control under 44px. The function was run
under Node against a fake Stripe for 25 cases, webhook signatures included,
and typechecked strict against `stripe@17`. K30 to K34 hold the cloud calls.

## The Cycle Audit: the long passages, pay what you want on the website
Asked for by the owner on 18 October 2026 as "the Cosmic Tax Ledger": the
multi-year passages of the slow astral bodies across a chart, each read as what
it asks to be set down (the Tax) and what it builds (the Dividend), with three
questions. The owner chose that the Oracle's model writes it on the server,
that one payment of the reader's choosing opens it for the account for good
($3 floor, $12 preset), and that the store apps give it away and carry a gift
instead. Later the same day that payment became Codex Luminary and opens every
add-on: see "Codex Luminary is one payment" below. `docs/CYCLE-AUDIT.md` is the owner's half.

**It lives on Today now, as a widget and a sheet** (the owner, 19 October
2026: "treat it like the weather channel widget"). It was the Oracle's fourth
period for one day and read as awkward there, so `ORACLE_PERIODS` is three
again and `orPeriodOf()` turns any stored `cycle` back into `daily`. The
plumbing underneath still calls the period `cycle`: `oracleSlot`, `oracleAsk`,
the kept reading and the server's period are unchanged, so nothing stored or
deployed had to move. `oracleAsk` treats the sheet being open (`cyOpen`) as the
reader being on the screen, and `oracleAutoAsk` leaves `cycle|` slots alone
while it is.

**The widget is free and draws three studies on one twelve year axis**
(`cycleWidgetVals()`, `cw*`), placed on Today in both shells: on the phone
after the greeting, on the desktop at the top of the right column. A hero line
names the heaviest passage under way (or the next one), three tiles give each
lane's state, and the chart has three lanes and a Now line through all of
them. **Stars** is the passages from `cyclePassages()` plus any under way,
packed into at most three rows, a tick at each exact date. **Design** is
`cycleDesign()`: Uranus, Neptune and Pluto staying on a gate the reader holds
(filled) or on a gate that completes a channel with one (outlined), sampled on
the same `cyLon` walk and memoised by `cycleScanKey()`. Saturn is left out of
the lane because it changes gate too often to read at this scale; the sheet
lists it. **Numbers** is the Personal Year for each year with the Pinnacles as
a band under it, from `numerology()` and the core's `personalYear()`, masters
in `--ac2-hi`. Every mark has a minimum width so a short stay never paints as a
sliver.

**Tapping opens the sheet** (`cyOpen`, `cycleSheetVals()`, `cy*`), a full
screen dialog in both shells with the scene's stage beside or above it. The written reading comes first, because it is what the tap
was for: the sample, sign in, consent and gate states, then the ledger
(`cyDash()`, unchanged). Under it the passages list, the Design list (six,
then all), and the Personal Years. The gate is `lumGateVals('cycle', 'cg')`,
written as its own `cg*` keys so it cannot collide with the Oracle's; a return
from Stripe for it lands on `#/today` with the sheet open. `cycleSheetAutoAsk()`
asks for the reading 400ms after the sheet opens, the same rule the Oracle's
standard reading follows.

**It is drawn in depth, and the flat chart is its fallback** (the owner, 19
October 2026: "make the audit cycle completely interactive like it was made on
Unreal Engines. It should breathe with the reader's curiosity"). `app/cycle-scene.js`
(shell layer, global `CycleScene`) draws the widget's chart and the sheet's
stage as one three.js landscape: the Stars lane is an arch of light per passage,
as tall as its `weight`, with a pillar at each exact date; the Design lane is lit
slabs (own gate) and outlines (a channel); the Numbers lane is a tile per year as
tall as its Personal Year with the Pinnacles as a band; Now is a column of light.
In the full view a wheel of the sky hangs in the corner and turns with the
instant the reader is looking at, a line from each slow body to the natal point
it touches. The reader drags (or uses the arrow keys) through the years, hovers
a passage to name it, taps one for a card that scrolls to its ledger, zooms with
the wheel, a pinch or the + and minus buttons, and Now brings the probe back.
Several things are easy to undo:

- **It computes nothing.** Every passage, stay, year and pinnacle arrives in
  `cycleSceneModel()`, built from the same scan the lists read, and the four
  positions on the wheel come through `opts.lonAt`, the app's `cyLon`. Nothing
  new leaves the device and no outside origin was added: three.js is the copy
  the cover vendors, imported with `import('./three.module.js')` on first use,
  which resolves beside the page in the source shell, the bundle and the store
  apps alike.
- **One renderer, two hosts.** `[data-cy-scene="mini"]` in the widget and
  `[data-cy-scene="full"]` on the sheet's stage. `cycleSceneSync()`, from the
  one `componentDidUpdate`, moves the one canvas to whichever is in the
  document (the sheet's first) and retries a few times 60ms apart, because the
  runtime commits an `sc-if` a tick after the hook.
- **It reads its palette off the page, and only once it is in the page.** The
  first pass read the tokens while its root was out of the document, got empty
  computed styles, and drew the whole scene in fallback grey. `readTokens()`
  returns null until the root is connected, the scene keeps Deep Field numbers
  for that frame, and `attach()` reads again. A theme change reaches it through
  the same identity key `skySync` uses.
- **It falls back rather than failing.** WebGL 2 missing (`CycleScene.supported()`),
  three.js not loading, or a lost context sets `cwSceneFail`, and the flat chart
  and the sheet's plain header come back (`cwChartOn`, `cySceneOff`).
- **The sheet is full screen, and the shell's dialog rules had to be told.**
  `[data-dt-modals] [role=dialog]` caps every desktop dialog at 620px and
  `[data-vt-modals]` makes every phone dialog a rounded bottom sheet, so the
  stage came out 180px wide. The overlay and the dialog carry `data-immersive`,
  which the head stylesheet exempts. Desktop: the stage beside a 340 to 440px
  panel. Phone: the stage over the panel, at 52vh.
- **The timeline is a slider.** `role="slider"`, `aria-valuetext` naming the
  date, the passages under way, the gate and the Personal Year, written directly
  by the scene (never through state). Keyboard focus holds the probe where the
  reader left it; a click focuses the slider too, and that must NOT hold it, or
  a mouse reader's probe never goes back to now. The focus ring is keyboard only
  for the same reason. The host is `data-noswipe`, and the widget's canvas is
  `touch-action: pan-y`, so a sideways drag scrubs and a vertical one scrolls.
- **Breathing is one number.** Curiosity rises with pointer movement, hovering,
  dragging and keys and decays over eight seconds; it raises the glow, the
  bloom, the dust's pull toward the pointer and leans the camera in. Under
  reduced motion nothing animates: frames are drawn on change and the camera
  cuts.
- **It runs only where it is seen.** An IntersectionObserver and the page's
  visibility gate the loop (the phone draws every section at once), it drops to
  30 frames a second at rest, and a quality ladder lowers the pixel ratio and
  then the bloom when frames run long.
- **The passages the audit reads are the lit ones.** The full view draws all
  twenty years of passages, and drawn alike they summed to white; the rest stand
  behind at 0.4.

Driven in Chromium on SwiftShader (`sdrive.js`, 42 rows over both shells): it
paints (pixels read back), hover names a passage, a drag and the keys move the
probe and its readout, a sideways drag does not turn the page, the probe returns
to now, Enter and a tap open the full view with the same canvas, the wheel
shows four bodies, a tap opens the card and its button reaches the passage,
zoom and Now, all eight theme cases at 1440 and 390 with the scene repainting
from each palette, the fallback without WebGL and with three.js blocked, and
reduced motion drawn and still. The flat chart's own drive runs without WebGL.

**The dates are free and computed on the device; only the reading is sold.**
`cycleWindows()` finds every passage of Saturn, Uranus, Neptune and Pluto across
the ten natal bodies, the Ascendant and the Midheaven, from the start of last
year to twenty years ahead, conjunct, square, trine and opposite at 1.5
degrees, joining runs of one contact less than 400 days apart into one passage
with every exact date. A computed date cannot be scarce, by the same rule as the
month reading, so the list is drawn for any chart of the reader's own. The scan
reads each body off a cubic through library positions every 20 to 40 days
(`CY_STEP`, measured within a hundredth of a degree), walks it every two days
and bisects the edges and exact dates: about 1,800 library positions and a tenth
to a fifth of a second, once a year per profile. It asks the library directly
(`cyLon`) so a twenty year walk does not flood lonRaw's grid or the position
cache, and it is never run inside the press that opens the screen: `cycleSoon()`
runs it on the next tick and the list says it is finding the passages. **It is
anchored to the calendar year, not to today**, so the dossier, and the reading
the server keeps for it, do not change every morning.

**The audit reads at most eight passages** (`CY_MAX`), the ones under way first,
then by `CY_WEIGHT` (the slowest bodies, hard contacts, longer passages), shown
in the order they arrive. The list opens on those eight and expands to every
passage. The Pluto case the owner gave is the fixture: Pluto crosses 15 Aquarius
five times from April 2032 to December 2033 and 28 Aquarius five times from
April 2041 to December 2042 (Z2 and Z3). The brief said 2029, which is where
Pluto stands near 10 Aquarius; the dates come from the library, never from a
brief.

**What leaves the device** (`cycleDossier()`): the first name, the touched
natal points with sign, degree and house, each passage with its dates, and the
Human Design type, strategy and authority and the Life Path, which the
questions are asked through. No birth date, and nothing that moves with today.
Privacy Policy section 6 says so.

**Each passage is drawn as a ledger** (the owner's layout, 18 October 2026),
`cyDash()`, in both shells: a header with the passage's state as a badge
(Active Outer Transit, Outer Transit Ahead) and the natal coordinate it lands
on; then two columns that stack on a phone, The Surrender Ledger (Deconstruct,
the Tax, and Reconstruct, the Dividend, as short lists) and Timeline & Shadow
Integration (the cycle stage, the years, a bar filled to today with a node at
every exact date, and Cross-System Shadow Prompts, one question each from The
Stars, The Design and The Numbers). **Everything but the lists and the
questions is the device's arithmetic, never the model's prose**: a written
passage is matched to its computed window by name, the dossier's order as the
fallback, and the title, window, coordinate, stage and timeline come from the
window. The schema asks for `tax` and `dividend` as lists and each prompt as
`{system, question}`; a reading kept in the older shape (paragraphs, plain
questions) is split into its sentences and drawn without the system labels, so
it still reads. The layout brief labelled the coordinate "NASA Ephemeris
Precision Coordinate"; it says "Natal Mars" and the like instead, because a
line naming the method is what "No disclaimers" removed, and because the
positions come from astronomy-engine, which is not NASA. Its year range used a
dash, and reads with middle dots. Z8 holds the dashboard against the Pluto
fixture and an older reading.

**The owner's style sheet was translated into tokens, not pasted.** Inline
styles only, and the 768px media query became the two shells: two columns in
the desktop markup, one in the phone's, with the phone's padding at 20px
rather than 32px because a 390px screen cannot give 64px to padding. Its
crimson Tax and emerald Dividend became `--ledger-tax` (amber `#e0a458`) and
`--ledger-div` (teal `#4fb8c4`), fixed hues declared in all three roots like
the category hues, because crimson sits on `--crisis`, which nothing but
safety may go near, and emerald on `--ac` and `--ok`, which mean an action and
a confirmed value. Its ✕ and ✓ markers became a hollow ring and a filled dot
(set down, built), because a cross and a tick read as wrong and right, and a
passage is never good or bad. Its violet text (`#c084fc`, `#8b5cf6`) is
`--ac2-hi`; `system-ui` is `--fu`, the theme's own face, with the prompts in
`--fb` italic because Karla carries no italic. **Z9 counts every `sc-if` and
`sc-for` and holds them equal**: the first ledger pass replaced its block by
slicing between anchors and took the long view's opening `sc-if` with it, and
the page still drew, because the runtime forgave the stray closer.

**The server writes it with inCommon's own instructions** (`CYCLE_INSTRUCTIONS`
and `CYCLE_SCHEMA` in `server/oracle/index.ts`), not the Codex's, and they carry
this file's rules for interpretive writing: what a passage offers and asks,
never what the reader is, no "you are", never good or bad, no predictions of
harm, astral body rather than planet, and questions only the reader can close.
The voice and emphasis line and the dash cleaner apply as to every reading.

**The paywall is the server**, and since the same day it is Codex Luminary's
(see "Codex Luminary is one payment"): the Oracle refuses a Cycle Audit on the
website with PREMIUM_REQUIRED unless `opened()` finds the reader Luminary. **The apps are told
apart by the origin Capacitor gives its web view** (`capacitor://localhost`,
`https://localhost`), which a browser page cannot write. A script outside a
browser can, and that is accepted on purpose, because what it would get is what
installing the app gives anybody.

**Support inCommon is the owner's donate button, in the apps only**
(`GIFT_IN_APP`, `giftOn()`): beside Contact Support, in the Settings footer
after Accessibility, and in the profile menu. It is called a gift on every
surface because inCommon is not a charity and "donate" says tax deductible to
most people. It needs no account (the `support` action is answered before
anybody is named), opens Stripe in the device's browser, and comes back to
`thanks.html`, built like the legal pages and noindex. **Apple and Google may
refuse a payment link inside an app** (Apple 3.1.1 outside the US storefront,
Google's payments policy for anything but a registered charity); if review
does, `GIFT_IN_APP = false` is the whole change.

**The return address was refusing the live site.** `OWN()` in the billing
function named incommon.netlify.app and not incommonspace.com, so from 16 to 18
October every checkout from the live site came back BAD_REQUEST. Both names are
on it now, and the function harness reproduced the refusal on the old code
before the fix.

Held by Z1 to Z7 (the scan, lifted out of the app), K34c to K34e (the cloud
calls), K55 (eight Terms links now, the unlock gate in each shell), a 42 row
browser drive with the cloud module faked (both shells, website and app, the
gate, the return, the reading, a closed country, an older billing function,
the gift, eight theme cases at 1440 and 390), and 13 cases of the billing and Oracle functions run under
Node against a fake Stripe, Supabase and Kimi, typechecked strict.

## Codex Luminary is one payment, of the reader's choosing, and opens every add-on
Decided by the owner on 18 October 2026: "all add-ons should assume the cycle
audit's form of payment. One-time reader's choice. For everything." One
payment opens every add-on, and the Luminary subscription is retired. **This
overrides the Luminary sections above where they disagree**: "In depth is
Codex Luminary, and Stripe takes the payment" (the plans, the prices, the
trial, the renewal terms, the gate's wording), "Luminary in the apps is
RevenueCat's" (nothing is sold in the apps now), and the RevenueCat half of
"The app stores".

**The add-ons are the in-depth Oracle readings, Omni tarot and the Cycle
Audit's readings**, and any added later joins them. What stays free: every
chart, the numbers, standard readings, Light and Divine tarot, and the dates of
every Cycle Audit passage. It keeps the name Codex Luminary, and the gate says
Become a Luminary.

**One unlock, one table.** The billing function's `unlock` opens a one time
Checkout on a custom amount price (`LUMINARY`, lookup `incommon_luminary_once`,
$3 floor, $12 preset), and `checkout.session.completed` writes
`luminary_unlocks` (`server/oracle/schema.sql`), refunding instead a payment
whose billing or card country is in the EU or the UK while those stay closed
(`recordUnlock`). A status asked with a sync finds a paid session the webhook
missed (`recoverUnlock`). The status says `isPremium` for every add-on, `once`
for a payment, the plan and its end for a subscription, and `floor`, which the
page names beside the button; a billing function that sends no floor has
nothing to sell, and the gate says payments are being set up.

**The subscription is retired, not erased.** `checkout` answers RETIRED. A
reader who subscribed before keeps it on its terms until they cancel: the row
is still synced from Stripe, a live one still opens every add-on, the member
line says when it ends, and Manage billing opens the portal. The trial, the
EUR and GBP prices, the VAT table and RevenueCat's selling code are gone from
the app and the billing function. `server/store` and the account function's
RevenueCat cleanup stay, dormant, for any record that exists, so a store
subscription that exists still opens every add-on on the website and the
deletion dialog still says to cancel it with the store. The plugin is out of
`native/` (package, lockfile, and the generated Android and iOS registrations,
put back to exactly what they were before it went in), so Capacitor's own three
packages are the whole native dependency list again.

**`opened()` in the Oracle function is the one check**, for in depth, the
Cycle Audit and Omni alike: an admin, the apps' origin, a `luminary_unlocks`
row, or a live subscription in either table. The page mirrors it as
`addonsOpen()`: native, or `lum.isPremium`.

**One gate, written once per screen.** `lumGateVals(from, p)` words it for the
add-on the reader reached for (`LUM_GATE`: deep, cycle, omni) and returns
`gate*` for the Oracle and `tg*` for the tarot room, spelled out so
check-dead-controls can see them. `lumBuy(from)` sends a return address with
`?lumfrom=` naming that add-on, because the hash cannot say whether the reader
was on In-Depth, the Cycle Audit or Omni, and `lumReturnRead()` puts them back
there. In the Cycle Audit's sheet the reading's gate sits above the free lists.

**Omni is written on the server, so the lock holds.** Its composer moved out of
`app/tarot.js` into `server/oracle/tarot-omni.js`, and the app's `read()`
answers null for Omni without one. The Oracle function answers `{ kind:
"tarot", seed, count, topic }` by running that composer against
`server/oracle/tarot.js`, which `tools/build-bundle.js` copies from
`app/tarot.js` on every build and the build refuses an app copy that carries
the composer again. No model and nothing stored: the same shuffle gives the
same reading, so nothing is limited or kept. The room deals the cards itself
from the seed and shows the passages the server returns (`tarotReading()`,
`tarotOmniSoon()`), with a panel for signing in, the gate, waiting and errors.
The moved composer was checked against the old one over 342 shuffles with no
difference. A determined reader can still rebuild it from the helpers
`app/tarot.js` exports for it (`PARTS`); the composed reading is what the
lock protects.

Held by J1 to J4 (the composer stays on the server, the copies agree, the
reading is whole and steady, the bundle carries none of it), K32, K34b to
K34f and K57 (the cloud calls), K55 (one time terms in place of renewal), 14
function cases against a fake Stripe, Supabase and Kimi (the unlock, RETIRED,
the refunds, the sync, a subscriber from before, Omni written exactly as the
composer writes it and refused without Luminary), and a 56 row browser drive.

## Master numbers are kept wherever a number is read
The owner asked on 29 September 2026 for "the rest of the master numbers".
`InCommonCore.reduce()` always kept 11, 22 and 33 for the Life Path, the
Birthday, the name numbers, the Personal Year and the Personal Month; the app
class reduced the Personal Day, the Personal Week, the pinnacles, the cycles
and the year and day blend all the way to one digit. `numKeep()` keeps the
three now, everywhere a number is read. `numReduce()` stays for the two places
arithmetic needs a single digit: a challenge is a difference of fully reduced
parts, and the first pinnacle ends at 36 less the Life Path's root. Content
lookups fall back to the root where a table has no master entry. 44 and the
other doubled numbers are not masters in the tradition these tables come from
(nor in the Codex), so they reduce. U1 to U7 lift the methods out of the app
and hold all of it.

## The double digit is read before the root: the Book of Numbers
Decided by the owner on 19 October 2026: "My 6 for example would be a 33 before
reduced to a 6, so my life path is actually Master Number 33. This is the
fundamental principle of organizing this information." A single digit is where
a number ends, not what it is. The double digit a reduction passes through is
the number's own frequency, and it is read first.

**The matrix is the owner's, and it is generated, never typed.**
`docs/source/book-of-numbers-matrix.csv` holds every compound from 10 to 99:
its root, the reduction, a title, a category (Master Number, Karmic Debt, Elite
Auspicious, Standard Sub-Frequency) and a description.
`tools/build-number-matrix.js` writes `app/number-matrix.js` (global
`NumberMatrix`, interpretation layer) from it and refuses a matrix with a
compound missing or doubled, a root that is not the compound's digital root, an
unknown category or a dash; `--check` says whether the module still matches.
Change the CSV, then run the tool. The descriptions are the owner's words and
are drawn as written.

**A master met on any standard route is the number.** `settle(routes)` in
`incommon-core.js` takes the raw totals the standard methods reach for one
number and returns `{ value, root, compound, master }`. The Life Path and the
Personal Year are settled over two routes: each part reduced and added (the
route the app always took, fixture N1) and every digit of the date added. The
name numbers are settled over the whole name added letter by letter and each
word reduced and added (`NumerologyContent.fromName()`, which now returns
`compounds`). Because a digit sum keeps the value mod 9, every route ends on
the same root, so the only thing the rule can change is whether that root is
read as its master: 1985-01-09 is 1 + 9 + 5 = 15 by its parts and 33 by its
digits, and its Life Path is 33. U8 holds that case, U9 holds over every day
from 1940 to 2010 that a number only ever moves to a master of its own root.

**This changes existing readers' numbers**, about one Life Path in ten (2,698
of 25,568 days from 1940 to 2010 moved to 11, 22 or 33), and the Oracle's
dossier, the profile card's motto and Today read the same value. It is the
owner's principle rather than a correction of arithmetic, and it is worth saying
out loud.

**`compound(raw)` is the first value from 10 to 99 on the way down** (128 gives
11, 199 gives 19). Where a master was met the compound is the master; otherwise
it is the first route's own double digit, so nothing the page showed moves
where no master is found. The Numbers page carries it on every number that has
one: Life Path, Birthday (the day itself), Personal Year, Month and Day, the
three name numbers, the four Pinnacles and the three period cycles. Challenges
are differences of single digits and have none.

**`numCmp(c, v)` is the one place a compound becomes a label**: 33/6 for a
master, 24/6 or 38/11 otherwise, with the matrix title beside it on the card
and the category, title and description on the number's own page, in both
shells. Everything wears `--ac2-hi` except a karmic debt on a birth number. The
reduction math column is kept in the data and never drawn, by "No disclaimers".
U10 to U15 hold the rest.

**Karmic debt is found on any route and read on the birth numbers only**
(owner, 19 October 2026, after asking whether the first pass matched the
tradition; it did not, on both counts). `karmicOf(routes)` in the core walks
every route all the way to its root and returns each 13, 14, 16 or 19 it
passes, so 1940-01-04, 10 by its parts and 19 by its digits, owes 19 though its
compound is 10; 608 Life Paths from 1940 to 2010 had a debt the first pass did
not show. The modern school reads it on the Life Path, Birthday, Expression,
Soul Urge and Personality, so only those pass `debts` to `numCmp()`: a debt
compound there wears `--warn`, and a debt the shown compound does not carry
gets its own line on the card (`debtLine`) and its own block on the number's
page (`numDebts`). The Personal Year, Month and Day, the Pinnacles and the
cycles pass nothing: a compound of 13 to 19 there keeps its title and
description in the ordinary colour, and its category label is dropped so it is
never called a debt. A master still sets the number when a route also owes a
debt; both are shown. **Two choices this does not make for the reader, recorded
so they are not mistaken for oversights**: 19 is the modern school's debt where
Cheiro, whose titles fill most of the matrix, reads it as the Prince of Heaven,
and the owner kept the debt; and a compound's own description can sit beside a
debt it does not mention (10, "a clean karmic slate", above a debt of 19).
U16 to U18 hold it.

## A debt compound on a cycle has a name of its own
Asked for by the owner on 19 October 2026: the Personal Year, Month and Day,
the Pinnacles and the period cycles read no karmic debt, so their titles should
not say debt either. The matrix CSV carries two more columns, **Cycle Title**
and **Cycle Description**, filled on the four Karmic Debt rows and empty on
every other: 13 The Season of Steady Labor, 14 The Season of Temperance, 16 The
Tower Season, 19 The Season of Self-Reliance. These four titles and
descriptions were drafted in this pass, in the matrix's own register, and are
the owner's to rewrite in the CSV. `NumberMatrix.get(n, { cycle: true })` answers with them and no category;
`numCmp()` asks for it whenever no `debts` list is passed, which is exactly the
cycles. `build-number-matrix.js` refuses a Karmic Debt row without both, any
other row with either, and a cycle reading that says debt. U19 holds it.

## The Numbers stage
Asked for by the owner on 19 October 2026: the Numbers page "interactive, as if
it were made by Unreal Engine". It opens with a real CSS 3D scene, in both
shells, above the summary: a grid floor tilted 58 degrees under a perspective
camera, an orbit ring, the Life Path floating over the centre on a beam, and
every other number standing on the orbit as an upright sprite. Under it, a HUD
panel names the number in front, its compound and any debt, with previous,
next and Open. Depth, overlap and the shrink toward the back are the browser's
perspective, not arithmetic. `numStage()` builds it from the same rows the cards
use, so the stage and the cards cannot disagree.

**Six things are easy to undo.**
- **The orbit turns rather than jumping.** The spinner is `rotateZ(numSpin)` and
  every sprite carries `rotateZ(-numSpin)` under the same transition, so the
  two cancel at every frame and the numbers ride the ellipse upright.
  `numFocusTo()` keeps the spin cumulative and always takes the short way, and
  `numSpinNow()` rests it at 180 so the first number starts in front rather than
  behind the Life Path. U20 holds that.
- **Choosing is two presses**, as in a game menu: the first brings a number to
  the front, the second opens its reading. Arrow keys turn the orbit and carry
  focus with it; a sideways swipe turns it on a phone (the stage is
  `data-noswipe`, so the screen chain does not also move).
- **Nothing per frame goes through state.** The camera tilt (`numCam()`) and
  the card tilt and highlight (`numTilt()`, `[data-sheen]`) write the element's
  own style, the way live regions are written, because a setState per pointer
  move re-renders the whole app. Touch and reduced motion skip both, and the
  sheet's global rule stills every transition and the two ambient animations
  (`nsOrbit`, `nsHover`).
- **The camera layer takes no pointer** (`pointer-events: none` on
  `[data-ns-cam]`). It sits at screen depth, and the numbers on the far half of
  the floor are behind it, so without this only the near half could be clicked.
  The same goes for the sprite buttons: each box ignores the pointer and its
  visible orb and label take it, because the boxes overlap their neighbours.
- **The sprite boxes are wider than what they draw**, because Chromium clips a
  3D layer's shadow to its own box: at the orb's width the Life Path's glow was
  cut into a lit column.
- **The Life Path floats high enough that the back of the orbit is never
  hidden** (a 150px beam on the desktop, 120px on the phone). On the floor it
  covered whichever number stood behind it.

Measured with the harness's own `contrastFails()` and `tapTargets()` over the
Numbers screen, since the theme phase sees Today only: four identities, each
hardened and not, at 1440 and 375, about 80 elements each, no pair under 4.5:1
and no control under 44px.

## The natal chart is drawn three ways: 3D, Orbital and 2D
Asked for by the owner on 19 October 2026: "Update the astrology page to make it
as if it was built by unreal engine. Make a 3D natal chart, an orbital option,
and a standard 2D chart. Make the logos fit elegantly." The Birth Chart has a
**Chart view** radiogroup in both shells, 2D, Orbital and 3D in that order,
state `chartView`. **2D is where it opens, every time** (see "2D opens
first").

**2D is the SVG wheel, untouched**, and it is also the fallback. 3D and Orbital
are one scene, `app/chart-scene.js` (shell layer, global `ChartScene`), drawn
the way `cycle-scene.js` draws the Cycle Audit: three.js imported from the
cover's vendored copy on first use, the palette read off the page, bloom, a
quality ladder, the loop only while the host is on screen, and nothing animated
under reduced motion. Without WebGL 2, or when three.js does not load, or when
the context is lost, the scene says so (`csFail`), `chartViewNow()` answers
`2d`, and the switch is not drawn: a reader never sees a choice that cannot be
made.

**It draws the model, never its own chart.** `this._csModel` is built inside
the same vals block that draws the 2D wheel, from the same `placedRows`, the
same stagger radii (`radiusFor`, so a body stands at the radius the 2D wheel
puts it, on a pillar whose height is its stagger level), the same
`natalAspects()` and the same `CAT_COLOR`, so the three views cannot disagree.
It is rebuilt only when the chart changes (birth stamp, mode, comets, minor
aspects, name); focus, the selected aspect, the open house and the chosen
placement travel separately (`setFocus`, `setSelection`). The one position the
scene asks for itself is today's, for the Orbital view's Today's sky, and it
comes through `opts.lonAt`, which is the app's `lonOf()`. `SIGN_EL_C` is the one
table of element colours, read by the 2D labels and handed to the scene.

**3D is the wheel as an astrolabe; Orbital is the same sky as an orrery.** In 3D
every ring, division and degree tick is drawn in the disc's shader, the rims
stand up out of it, bodies stand on pillars over their longitude, the aspects
are ribbons bowed over the inner field and the angles are beams at the rim. In
Orbital each body sits on its own orbit in the order the bodies stand from the
Earth, the nodes on the Moon's, the minor points on belts (asteroids between
Mars and Jupiter, centaurs between Saturn and Uranus, TNOs beyond Pluto), and
the zodiac slides outward into a belt round all of it. **The angle from the
centre is still the longitude**, so it is the same chart; only distance has
been given a meaning. The two are one morph, not a cut: the radii are shader
uniforms and the ribbon ends are uniforms, so nothing is rebuilt on the way.
Today's sky (a `role="switch"`, Orbital only) lays a ghost on each orbit where
the body stands now, with the arc it has travelled since birth.

**"Logos" was read as the glyphs**, the sign and body symbols, and that is the
choice to revisit if the owner meant the inCommon mark. Each glyph is set on
its optical centre: astrological symbols sit at different heights in every font
that carries them, so `medallion()` measures `actualBoundingBox` and places
the ink, not the text box, in the middle of a roundel ringed in the 2D wheel's
colour for it. Glyphs are drawn at a pixel size that follows the stage
(`ui`, from its shorter side), so a phone's chart is not wearing a desktop's
roundels, and the minor points of the Expanded Chart get a plain small roundel
with their degree left to the tooltip and the panel, or eighty of them bury the
ten that matter.

**Choosing is two presses, as on the Numbers stage.** A tap or a click on a body
brings it forward (the camera turns it to the front) and names it in the panel
under the stage; a second press on it, or Open the reading, opens its placement
page. The panel's ‹ and › and the arrow keys on the focused stage step through
the bodies, and the keyboard step is spoken (`speak()`, never through state).
A ribbon selects its aspect (`aspSel`), the house band opens a house (`dpSel`),
and the zoom cluster drives whichever view is showing (`zoomDir` lays it as a
row in the deep views, where a column would sit on the chart). Picking is done
on the screen, by projecting each body and sampling each ribbon, which is why
a ribbon a few pixels wide can still be hit.

**The stage is `[data-chart]`**, so its canvas is judged as chart; the switch,
the Today's sky control, the zoom cluster and the panel are outside it and were
measured with the harness's own `contrastFails()` and `tapTargets()` over the
astrology screen, since the theme phase sees Today only: 3D and Orbital, four
identities, hardened and not, at 1440 and 375. All 32 cases clean, 179 to 183
elements each. **G11 now chooses 2D before it reads the SVG**, because that is
the view it describes; G11c holds the stage to the same role description and
summary, and passes on a build without WebGL 2 because the 2D wheel is then all
there is. Driven in Chromium on SwiftShader: the stage paints, hover names a
body, the two presses focus and open it, Next and the arrow keys step, a ribbon
selects its aspect, the morph runs both ways, Today's sky lays ten ghosts, a
theme change re-reads the palette, and with WebGL off or three.js blocked the 2D
wheel comes back with no switch.

## The wiring is drawn three ways: 3D, Wheel and 2D
Asked for by the owner on 19 October 2026: "Redesign the human design page to
make the ux like it was made by unreal engine. Completely interactive, high
quality visuals, 3D options with 2D available. Compact, highly engaging, drive
the experience to reflect the human design philosophy." The Wiring has a
**Wiring view** radiogroup in both shells, 2D, Wheel and 3D, state `hdView`.
**2D is where it opens, every time** (see "2D opens first"). The layer control
(Personality, Design, Both, `bgMode`) drives every view.

**2D is the SVG wiring, untouched**, and the fallback. 3D and Wheel are one
scene, `app/hd-scene.js` (shell layer, global `HDScene`), built the way
`chart-scene.js` is: the cover's vendored three.js on first use, the palette
read off the page, bloom, a quality ladder (which here also drops a rung at once
after three frames over 120ms), the loop only while the host is on screen, and
nothing animated under reduced motion. Without WebGL 2, without three.js or on a
lost context it says so (`hsFail`), `hdViewNow()` answers `2d`, and the switch is
not drawn. `hdSceneSync()` runs from the one `componentDidUpdate`.

**It draws the model, never its own chart.** `this._hsModel` is built in the
wiring vals from the same `hdChart()` the SVG reads: the nine centres at the
SVG's own `BG_POS` boxes, in the shapes the field draws them, coloured from the
atlas as the SVG colours them; all thirty six channels; every activation with
its gate and line. Centres keep the chart's own definition in every layer, as
the SVG does; gates and channel halves follow the layer. The one thing the scene
is handed besides the model is the sky now (`setSky`), the same minute's
hd-transit reading the gates card on Today reads.

**A channel is two halves and a half lights from its own gate**: Personality in
`--tx`, Design in `--hd-des`, a gate held by both as a braid of the two, and the
sky now in `--blue`, dashed. That is how a hanging gate reads, as half a channel
reaching for somebody else, and it is why the scene draws all thirty six rather
than only the defined ones. `--hd-des` (`#df9a5f`) is a fixed hue declared in all
three roots beside the ledger hues: the tradition's design red sits on
`--crisis`, which nothing but safety may go near. It is a fill and a stroke,
never text. Gates sit on the edge of their centre facing the centre their first
channel runs to, with the channels between one pair of centres kept parallel
(`layoutGates`), and a channel whose straight path would cross a third centre
bows toward the reader to pass in front of it.

**Wheel is the same chart with the sky put back round it**: the sixty four gates
as a ring at the body's waist in `HDWheel`'s order from gate 41, and each
activation leaves its column for the place on the ring its astral body stood,
with a thread down to the gate it lights. The activations peel away one at a
time rather than as a block. It is one morph, not a cut. "Wheel" was chosen over
the field's own name for this figure because that name belongs to somebody.

**The philosophy is in the behaviour and never in a sentence**, by "Discovery
belongs to the reader" and "No disclaimers". Defined centres hold their light;
open centres are glass that takes on the colours of the defined centres their
channels reach and never settles, and fill with them when named. Defined
channels carry a flow that rises from the lower centre to the higher. A defined
Solar Plexus breathes on a nine second wave, a defined Sacral hums, a defined
Root builds. And the body wakes the way its type meets the world (`planWake`):
a Manifestor's lights from the motor that reaches its Throat on its own; a
Generator's waits, its Sacral asking, until the reader does anything at all,
and that press is the response, so it wakes the body and names what was pressed
in one; a Manifesting Generator's answers at twice the speed; a Projector's open
centres see first and the defined follow from the G; a Reflector's comes up all
at once, and for a Reflector the sky now is on until the reader turns it off
(`hdSkyOn`), because that chart takes its shape from the sky. A waiting body
wakes on its own after seven seconds, so nobody is left in front of a dark
chart. The wake runs on the wall clock rather than scene time, so a slow machine
shows fewer frames of it rather than a longer one.

**Choosing is two presses, as on the chart and the Numbers stage.** A press
names a centre, gate, channel or activation (`hsFocus`), dims what it does not
touch and threads the activations it involves; a second press, Enter, or Open
the reading opens the detail sheet the SVG already opens (`hdSelOf`). Picking is
done on the screen, activation before gate before channel before centre. The
arrow keys and the panel's arrows step through the nine centres and then the
defined channels (`model.steps`), and a keyboard step is spoken. With nothing
named the panel under the stage is the type, and Open your type opens it; Whole
chart clears a focus.

**The page was made compact around the stage.** Both shells open on the stage
and its panel; the type card keeps its description and puts Strategy,
Authority, Profile and Definition in a grid of four (`hdTiles`), which is where
the Your Lines card went (the profile sheet carries both lines); and Activated
Gates, Defined Channels and the centres share one control (`hdList`) instead of
four stacked lists. The readings are unchanged.

**The stage is `[data-chart]`** and carries `aria-roledescription="human design
wiring"` and the same summary as the SVG, which moved up to the stage card so
both views point at it. G11d holds both views to it. G14b checks every zoom
cluster now, because on the phone every chart page is mounted at once and the
first Zoom in on the page may be the wiring's. Measured with the harness's own
`contrastFails()` and `tapTargets()` over the Human Design screen, since the
theme phase sees Today only: 3D and Wheel, four identities, hardened and not, at
1440 and 375, all 32 cases clean, 75 to 76 elements each. Driven in Chromium on
SwiftShader: the stage paints, hover names a centre, the two presses focus and
open it, a gate and an activation are picked over their centre, the arrow keys
step and Enter opens, the layer and the sky now reach the scene, the morph runs,
2D is the SVG with no stage, the view is kept, a Generator body waits for the
press and wakes from its Sacral, a theme change repaints, and with WebGL off or
three.js blocked the SVG comes back with no switch.

## The Human Design readings are a deck, and the full text stays
Asked for by the owner on 19 October 2026: "For the drop down menu with lots of
text, make it scrollable, ux centered, fit it into the concept of the new page.
Keep the long text option open as well. Make it fit and make it engaging,
dynamic, fun." The reading under the choice of one (My Type, Chart, Mood and the
rest, `hdTab`) is six paragraphs of fifty to a hundred and fifty words and four
lists, which on a phone was most of a metre of scrolling.

**The choice of one is still a dropdown**, by "A row of pills becomes a dropdown
when it is a choice of one". Its menu contains its own scroll
(`overscroll-behavior: contain`) and ticks the current choice; the Throughline
filter shares that markup and got the tick with it. The reading's title and
kicker moved out of the card to sit beside it.

**Cards are the default; Full text is the old layout, one press away**, kept
per device (`hdRead`, `incommon.hd.read`). `hdDeckCards()` makes a card of each
paragraph with its first sentence set as the lead, splits a paragraph past
ninety words at the sentence nearest its middle so the cards are of a size, and
makes a card of each of the four lists. **The cards are the same sentences in
the same order**: nothing is dropped or rewritten, and the drive asserts every
sentence of the reading is on a card. The deck is a native sideways scroll
with snap, the next card showing at the edge (which is the whole invitation to
swipe, by "Discovery belongs to the reader"), a progress bar, a counter, the
arrows either side, and the arrow keys, Home and End on the focused deck.
A card is capped in height and scrolls inside itself past the cap.

**The card in front is state (`hdCard`), written from the deck's scroll only
when the index changes**, never per frame. A new reading starts at its first
card. A card behind the one in front is set back by scale and a quieter border,
never by opacity, because `contrastFails()` reads an element's own opacity and
not its ancestors', so a dimmed card would fail its readers while passing the
gate. The deck is `data-noswipe` and scrolls sideways, so the phone's section
chain never takes a swipe that starts on it.

Measured over the Human Design screen with the harness's own `contrastFails()`
and `tapTargets()`, deck on screen: four identities, hardened and not, 1440 and
375, all 32 cases clean, 103 to 104 elements each. Driven in both shells:
next, a hand scroll and the keys each move the card in front, every sentence is
on a card, the menu scrolls and ticks, a new reading starts at card one, and
Full text is the long layout and is kept.

## The scenes say Loading, open at rest, and give a finger Free look
Asked for by the owner on 19 October 2026: on a phone, scrolling fought the
3D charts for vertical drags; every chart (the astrology wheel, the wiring and
the Cycle Audit) showed abstractions and moving blocks until it loaded, and
"Loading..." was to stand in their place; and the Human Design type lost its
"Full Type" label, left aligned in its box.

**Free look is the reader handing the stage the vertical drag.** On a touch
screen a vertical drag is the page scrolling, so by default only a sideways
drag turns the astrology and Human Design scenes. A `role="switch"` on the
stage, "Free look" (`csFree`, `hsFree`, top right where the bracket was),
makes one finger orbit both ways and holds the page still (`setExplore()` sets
the pad's `touch-action` to `none`); a pinch still zooms. It is offered only
where a finger drives the stage (`touchUi()`: the phone shell or any coarse
pointer), so a mouse desktop keeps its bracket. It turns itself off when the
stage leaves the screen (`onExploreEnd`, from the scene's IntersectionObserver),
so the page never comes back to a stage still holding the reader's finger, and
the stage wears a violet outline while it is on. The Cycle Audit's full stage
already took every drag (`touch-action: none` in full mode) and its widget
only scrubs sideways, so it needed no switch. Two finger gestures were the
alternative and were not chosen: they need a sentence to be found, and
"Discovery belongs to the reader" bars the sentence.

**Loading holds the place; nothing is drawn and then swapped.** Three causes,
three fixes:
- The scene scripts load async, and until they arrived the views fell back to
  the flat chart and then swapped it out. `scenePending(name)` keeps a deep
  view while its script may still come (`componentDidMount` waits up to eight
  seconds, then `_scenesSettled` lets the fallback be the answer), so the
  stage is the stage from the first paint. The streaming hints were flipped
  with it (`cvDeep`, `hvDeep`, `cwSceneOn` hint true; the flat ones false).
- Each stage, the cycle widget's band and the cycle sheet's stage carry a
  `role="status"` "Loading..." over a plain `--bg` until the scene reports it
  has drawn (`csLive`, `hsLive`, `cwSceneLive`, from `onReady`). The scenes'
  own backdrop is plain `--bg` now, not a gradient, and **a scene reports
  ready only once the faces have loaded** (`fontsOk`, with a three second
  ceiling), because labels drawn in the fallback face and redrawn a moment
  later were the blocks jumping.
- The cycle widget's finding state was two pulsing grey blocks; it is
  "Loading..." in a 520px slot, about the height of the finished widget, so
  the page does not grow under the reader when the scan lands.

**The scenes open where they rest.** All three used to fly in from a wider,
turned camera. They now start at their resting framing and the only arrival is
the canvas fading up. The wiring's wake (the body lighting by type) starts at
that reveal rather than at build time, so it is not spent behind Loading; a
Generator's seven second wait for a response is counted from the reveal too.

**The Human Design type is the type alone**, left aligned in its button, which
still opens the type's reading.

Driven on a phone with real touch through the DevTools protocol: a vertical
drag on the stage scrolls the page and leaves the tilt alone; with Free look on
the same drag tilts the wiring and the page holds still; off gives the scroll
back; scrolling the stage away ends it; the astrology stage carries it; a mouse
desktop has none. Filmed on a throttled connection: the stage holds its place
with Loading for about three seconds, then the finished scene, and the flat
wiring is never visible.

## The 3D scenes fade in from behind Loading, and nothing else on the stage arrives first
Asked for by the owner on 19 October 2026: "The 3D objects should stay behind a
loading screen until they fade in for effect. Never show the units before
they're a utility." Loading was already in place, but it was an `sc-if` that
vanished the frame the scene reported ready, and every control on the stage
popped in with it at full strength while the canvas was still dark.

**Loading is a veil now, not a removal.** Each stage's `role="status"` stays in
the markup while the deep view is drawn and dissolves over 0.8s
(`csVeilO`/`csVeilV`, and `hs`, `cw`, `cy` the same), ending at
`visibility: hidden` so it leaves the accessibility tree and stops taking the
pointer. Under it the canvas fades up over 1.2s (all three scene modules), so
the scene comes through the veil rather than appearing after it.

**The units wait for the scene** (`csUiO`/`csUiV`, `hsUiO`/`hsUiV`,
`cyUiO`/`cyUiV`). On the astrology stage: the corner brackets, the stage
outline, Free look, Today's sky, the zoom cluster, the body panel under the
stage and the Chart view switch. On the wiring: the same, plus The sky now,
the Personality and Design key, the panel and the Wiring layer control. On the
Cycle Audit's sheet: zoom and Now (Close is never held back, because closing
works from the first frame). While the scene loads they are `opacity: 0;
visibility: hidden`, so they hold their place in the layout, take no focus and
no press, and are not read out; once it is live they fade in over 0.6s after a
0.6s delay, which lands them as the canvas finishes. In the 2D view they are a
utility at once (`!deep || live`), so the flat wheel and wiring are unchanged,
and without WebGL the switch is not drawn at all, as before. The cycle scene's
own readout waits for the reveal too (`_readOn` in `showRead()`).

**Hide by visibility, never by `sc-if`.** Removing a control while the scene
loads would move the stage when it came back, and a view switch that appears
above a stage pushes the stage down under the reader. Under reduced motion the
global rule makes every one of these fades instant.

Driven on SwiftShader, both shells: astrology on the desktop, the wiring on the
desktop and the phone, the Cycle Audit widget on Today and its sheet opened
before the scene was live. In every one the order was the veil alone, the
canvas through the veil, then the units; with WebGL off the 2D wheel came up
with its zoom cluster showing and no veil.

## The stages are built before they are asked for
Reported by the owner on 20 October 2026: 3D loaded slowly when opened, and at
once after a trip through 2D, Orbital or Wheel and back. The trip was the clue:
by then the scene object existed, compiled, and moving it between hosts costs
nothing. The first visit was paying for three.js, the renderer, the content and
every program while the reader watched Loading.

**`scenePrewarm()` builds the wiring and then the chart while the reader is
somewhere else**, one at a time, two seconds after the app is ready, in idle
time. Since 2D opens first it builds every stage whatever view is showing, for
3D or the depth view already chosen, and the Cycle Audit's first, because it is
on Today. A scene with no stage on the page waits in **the lot** (`sceneLot()`): a
box at `left:-10000px` inside `[data-vt]` or `[data-app-root]`, so it reads the
shell's own tokens, `inert` and `aria-hidden`, where its IntersectionObserver
reports it unseen and no loop runs. A scene whose stage is mounted but off
screen, the phone's next chart page, is built where it stands. `prebuild()` in
each scene module builds now rather than waiting on `buildNear()`'s observer,
which would never fire in the lot, and disconnects that observer so a second
build cannot start when the stage scrolls into view; `build()` refuses once
ready for the same reason.

**A scene is revealed where it is seen** (`shown` waits for `visible`, or for
no IntersectionObserver at all). A stage built in the lot draws and compiles
there, but its fade, its `onReady` and the wiring's wake belong to the moment
the reader arrives, so `csLive` and `hsLive` mean on screen and drawn, as before.

**Leaving a stage parks the scene in the lot instead of detaching it**
(`scenePark()`), so it keeps a connected root, its palette and a theme change
made while it waits. The two creation paths share `chartSceneMake()` and
`hdSceneMake()`, so a prewarmed scene and one made on the stage carry the same
callbacks.

Measured on SwiftShader after twelve seconds on Today: the chart live 1.3s after
the address changed on the desktop (4.3s before) and the wiring 0.5s; on the
phone the wiring 1.2s after entering My Charts and the chart 1.1s after the
swipe. Opening My Charts straight away on the phone, the chart is now built
while the reader is on the wiring page and comes up 0.6s after the swipe.

## 2D opens first, and the Cycle Audit has a 2D of its own
Decided by the owner on 20 October 2026: "Flip the order of the charts from
3D, wheel/orbital, 2D to 2D, wheel/orbital, 3D. Make a 2D audit cycle and load
that first as well." The switches read 2D, Orbital, 3D and 2D, Wheel, 3D, and
the Observatory's own pair reads Orbital, 3D. `chartView` and `hdView` start at
`2d`, and so does `cyView`.

**The choice is not kept** (the owner, 20 October 2026: "Start with the 2D
option as the default"). It was stored per device for one release, and a reader
who had once pressed 3D kept opening on 3D, which read as the default never
having changed. A view picked now lasts the visit; the next load opens on 2D.
`componentDidMount` removes `incommon.chart.view`, `incommon.hd.view` and
`incommon.cycle.view` once, because nothing reads them, and no switch writes
them. Do not store a view again without the owner.
The streaming hints were flipped with them (`cvFlat`, `hvFlat`, `cwChartOn`
hint true; the deep ones false), so nothing deep flashes while the page
streams.

**The Cycle Audit's 2D is the flat chart it already had**, the three lanes on
one twelve year axis, now a choice rather than only the fallback. State
`cyView`, `2d` first; the switch (`cwViews`,
from `cycleViews()`) sits above the chart in the widget in both shells and at
the top of the sheet. It reads 2D, Rings, Orbital, 3D where the scene can run
and 2D, Rings where it cannot (see "The Cycle Audit is drawn four ways").
In 2D the sheet has no
stage: it opens on its plain header, the switch and the flat chart in a card
above the reading (`cyFlatOn`), reading the same `cw*` values the widget draws,
so the two cannot disagree. The widget's switch waits for the scene like every
other stage unit (`cwUiO`/`cwUiV`).

**3D stays one press from fast.** `scenePrewarm()` builds all three stages in
the lot while 2D is showing (see "The stages are built before they are asked
for"), and `cycleSceneMake()` is shared by the prewarm and the sync. Measured on
SwiftShader with the stages built: Cycle Audit 0.3 to 0.5s from the press to
live, the chart 0.2 to 0.6s, the wiring under 0.3s, both shells. The one slower
reading, about 4s on the Cycle Audit, came when the press landed during another
stage's first draw in the lot, which is SwiftShader building pipelines and is
not a cost a real GPU pays.

## The Cycle Audit is drawn four ways: 2D, Rings, Orbital and 3D
Asked for by the owner on 20 October 2026, after asking whether the audit had a
middle option like the chart's Orbital and the wiring's Wheel: "Both", meaning
a Rings view and an Orbital view. The switch reads 2D, Rings, Orbital, 3D, and
`cycleViewNow()` is the one answer to which is showing: Rings needs nothing but
SVG, and Orbital and 3D fall back to 2D where the scene cannot run. 2D still
opens first and nothing is kept.

**Rings is the widget's twelve years wound into a spiral** (`cycleRings()`,
`cwRing*`), one turn a year from the centre outward, January at the top, the
months clockwise. A passage that crosses New Year carries on round the next
turn instead of breaking off, which is the thing the flat chart cannot show.
It reads the same packed rows (`starRows`, `designRows`) and the same numbers
the flat chart draws, so the two cannot disagree: the passages ride a turn's
outer half (`--ac2-hi` hard, `--atmc2` easy), the stays on a gate its inner
half in `--blue`, dashed where the stay completes a channel, the exact dates
are dots, now is a lit dot with a line in from the centre, and the centre names
the month and the Personal Year. The spine at twelve o'clock names every other
year and every year's Personal Year. It is drawn in the widget and in the
sheet's card, where 2D's flat chart was (`cwRingsOn`, beside `cwChartOn`).

**The turns alternate two tones and a master year is violet.** The first pass
tinted each turn by its number, blue at 1 to the warm lobe at 9, and the blend
went grey in the middle years. A Personal Year is a category, not an amount, so
nothing grows with it now: alternating tones read as tree rings, and a master
wears violet as it does on the Numbers page. Orbital's paths use the same rule.

**Two template traps, both hit on the way in.** The runtime lowercases a
camelCase SVG attribute it does not know, so `strokeWidth`, `strokeOpacity`
and `textAnchor` were silently dropped and the bands drew as thin full strength
lines: the stroke properties are in `style`, which it passes through. And a
`{{ }}` hole is an HTML span, which an SVG `text` cannot render, so every
dynamic label was invisible: the labels are an HTML layer over the drawing,
placed in percent of it. **Put dynamic text over an SVG, never inside one.**

**Orbital is the same scene as 3D, laid out as a sky** (`setLayout()` in
`cycle-scene.js`, called from `cycleSceneSync()` before `attach()`). The
landscape gives way to a polar chart on the same floor: the natal wheel in the
middle with a spoke from each point out to the zodiac, one band per slow body
(Saturn innermost, Pluto outermost), and in each band the body's path with time
running outward across the band and longitude running round. A retrograde is
the path doubling back, so a passage that is exact five times is the path
crossing one bearing five times, each crossing a point. The zodiac and the
sixty four gates, in `HDWheel`'s order from gate 41, ring the outside; a stay
on a gate lights the gate and a sector of its body's band across the gate's arc
for as long as it stays. The path alternates tone by year, the bodies stand
where they are at the probed instant with a line to each natal point they
touch, now and the probe are rings across every band, and the Personal Year of
the instant sits in the middle.

**It computes nothing either.** The paths arrive in the model (`paths`, a
longitude every three days across the span) read off the cubic nodes the scan
already walked (`_cyNodes`, kept by `cycleWindows()`), so no library position is
asked for twice; the gate order is `HDWheel`'s, handed in as `gates`.

**The two layouts are one stage and one morph.** The camera eases between the
landscape's rig and the sky's; the landscape leaves by fog (`fogAdd()`: every
landscape material is drawn through `fogK`, and the sky, the stars and the
Orbital layout are not fogged), its labels and dust fade with it, and the sky's
materials share one uniform, `uOrb`, that brings them up over the second half.
The probe, the card, the readout and the keys carry across. Every pick carries
`userData.orb` and `pickAt()` takes only the layout showing. Under reduced
motion the morph cuts. The warm up shows both layouts for the compile call,
because `compile()` walks only what is visible and a hidden layout's programs
would otherwise be linked on the main thread the first time it is chosen.

**The disc is fitted by projecting its rim** (`fitDisc()`), because at a low
camera the near side is much the larger and a fit from the radius alone cut it
off; it fits the rim's height and `viewShift()` takes out how far off centre that
height sits, with a view offset that goes back to none in the landscape, in
flight and on a resize. The widget's camera height follows the band's shape, low
for a wide desktop band and higher for a phone's. A sideways drag runs time,
since the sky has no floor to point at; in the sheet a vertical drag tilts and
the wheel and the buttons zoom, as in 3D.

**Measured.** With the harness's own `contrastFails()` and `tapTargets()` over
the widget and the sheet, in Rings and in Orbital, four identities, hardened
and not, at 1440 and 375: 64 cases, no pair under 4.5:1 and no control under
44px, the ring labels counted. Driven in Chromium on SwiftShader, desktop and
phone: the four views in order, Rings drawn with its bands, passages, dates and
labels, Orbital live and its pixels read back, a drag running the probe, the
morph to 3D and back, the sheet in Orbital with a tap on an exact date opening
that passage's card, and Rings in the sheet.

## The Observatory: the full screen chart, flown
Asked for by the owner on 19 October 2026: "Make the full screen expansion an
Observatory. People should feel like they're going in a certified space
expedition facility. ... Free motion in every direction: up, down, left, right,
diagonal, ascend, descend, strafe left, strafe right, dash up, and dash back,
dash left, and dash right. Omni directional motion: on every chart, but
especially in the full screen observatory in the astrology tab. Generate
appropriate images for each astral body as they are encroached upon." The
maximize button (the expand chart button) opens it; `chartExpandOpen` is still
its state, so everything that already opened, closed, persisted or escaped the
old overlay does the same to the Observatory.

**It is the card's own scene, moved.** `chartSceneSync()` puts the one
`chart-scene.js` scene into `[data-cs-scene="obs"]` while the Observatory is
open and calls `setMode('obs')`, and back into the card's
`[data-cs-scene="1"]` (and `setMode('stage')`) when it closes. While it is open
the card's host behind it is never taken in its place, and the Observatory is
deep even when the card shows 2D. Without WebGL 2 it shows the 2D wheel in the
middle and the manifest round it, exactly as the overlay did.

**Flight is one module for every chart.** `app/flight.js` (shell layer, global
`Flight`) is a camera with a position, a yaw and a pitch, and no roll. W S
forward and back, A D strafe, E or Space ascend, Q or C descend (the world's
up, as an editor viewport flies), the arrows look, Shift boosts, a double tap
of any move key or X dashes that way, and two keys at once is a diagonal,
normalised. Keys are read by `code`, so the hand position is the same on every
layout. Cruising speed is the distance to the nearest surface, so the open
field crosses quickly and a body slows the reader as they close on it; a dash
is a separate impulse that decays on its own. `travel()` is the autopilot
along a curve, and any input takes the controls back. A standard gamepad flies
too, and `mountPad()` builds the touch stick (flick it to dash) and the Ascend,
Descend and Dash buttons, which are real named buttons a press can operate.
`Flight.claimedElsewhere()` is what keeps flight off a field being typed into,
off the arrows of a radio group, tab list or slider, and off Space and Enter on
a button.

**On the cards it is the same flight, taken off and landed.** On the astrology
stage, the wiring and the Cycle Audit the move keys take off from wherever the
camera is (Space only once flying, because Space opens on a card), a drag looks
while flying, two fingers move in Free look (the pair sliding strafes and
climbs, spreading goes forward), the wheel pushes along the view, and Escape, 0,
Home or the reset control lands: the camera eases back onto the scene's own
resting rig rather than jumping. hd-scene and cycle-scene take this glue from
`Flight.mixin()`, installed on first use because flight.js may load after them;
chart-scene carries its own, because the Observatory needs more of it. Under
reduced motion a frame is drawn on change except while flying, the autopilot
cuts instead of travelling, and a dash is a short step with no lens kick.

**The bodies become worlds as the reader closes on them.** `app/body-globes.js`
(shell layer, global `BodyGlobes`) generates each surface on the graphics card
from noise, so it holds its detail however near the reader comes and downloads
nothing. A globe is made when the camera is inside thirty of the body's radii,
crossfades in over the orb from thirty to fourteen while the glyph gives way,
and is disposed beyond forty six; at most sixteen exist at once. Each is drawn
from what is known of it: the Sun's granulation, spots and corona; the Moon's
maria and craters; Venus's cloud; Mars's rust and caps; Jupiter's belts and
Great Red Spot; Saturn's rings with the Cassini Division and the planet's
shadow on them; Uranus tipped on its side and ringed; Neptune's dark spot;
Pluto's heart; Ceres's bright spot; Haumea stretched and ringed; Chariklo and
Chiron ringed; Arrokoth as two lobes; the comets as a nucleus, a coma and two
tails pointing from the Sun. Every globe is lit from where the chart's own Sun
stands. **The colours are the bodies' own, not tokens**: a theme does not
repaint a planet, which is the same reasoning the fixed category hues rest on,
and none of these colours is text.

**The points that are not bodies are not drawn as worlds.** The nodes, Lilith,
Selena, the Vertex, the Parts, the Aries Point, the midpoint and the Hamburg
hypotheticals are lattices of light, a node as two planes crossing and a
hypothetical dashed, because their pages already say they are not bodies and
the image has to agree. Lilith is a dark one, a rim round nothing. **None of
them is solid**: the first build gave Lilith an opaque black core, and in a
chart where she stands beside Saturn she hid the planet.

**What moves every frame is the scene's; the station is the app's.** The scene
draws the reticle, the target's bracket and the arrow to it when it is off
screen, the telemetry strip (heading as a zodiac degree, altitude, speed, range
to the target, the time in UTC), the approach banner, the motion streaks, the
launch from further out down onto the station, the boot lines once per page,
and the close-up: the target's world rendered into the same canvas under the
target panel's transparent window (`[data-obs-pip]`), through a second camera
that sees only layer 1 (the worlds, the stars and the sky). The app draws the
header, the manifest (Bodies, Aspects, Houses), the target panel, the controls
card and the touch pad's container, and writes the live range into
`[data-obs-range]` by direct DOM write, never through state. The HUD is
`aria-hidden`; the stage carries a role description and a described-by naming
the keys, and `onArrive` speaks the arrival.

**The lens is centred on the open sky, not the screen.** On a wide screen the
rails cover the sides, so `--obs-l` and `--obs-r` on the dialog name their
widths, the scene reads them (`readInset()`), shifts the camera's principal
point with `setViewOffset` and frames the station on the free width. The
telemetry, the banner and the boot lines centre on the same region, the
off-screen arrow rides its edge, and the HUD is clipped to it, so nothing of it
shows under a panel or through the close-up window.

**One target, shared with the card**: `csFocus`. A first press on a body (in
the scene, a manifest row or the target panel's arrows) targets it and flies
there; a second press on the target opens its reading, the same two press rule
as every stage, and the reading closes the Observatory. In the scene a second
tap on the target flies instead, and the reading is the panel's button. Brackets
step the target, Enter or T flies to it, O opens it, H or Home returns to the
station, V switches 3D and Orbital, P shows or hides the panels. A contact
(an aspect row, a contact chip, a ribbon in the scene) frames both its ends; a
house looks down onto its sector. Hovering a row with a mouse lights the body.

**Below 1100 wide the panels are a drawer.** A target pill under the
telemetry opens it on the Target tab; the Manifest button opens it on the
others. Closing the drawer, the controls card, or flying from the drawer hands
focus back inside the dialog (`obsRefocus()`): the control that had it is gone,
and focus left on the page is outside the trap, where neither Escape nor the
flight keys reach. The drive that found this pressed Escape after closing the
drawer and nothing happened.

**The controls card opens on the first visit**, once per device
(`incommon.obs.keys`), and is a button in the header after that. It names
controls; it explains nothing about a reading, so "No disclaimers" is not
touched by it.

**Measured, not assumed.** With the harness's own `contrastFails()` and
`tapTargets()` over the dialog: four identities, hardened and not, at 1440 (the
plain station, the Aspects tab, the controls card) and 390 (the plain station,
the drawer on Target, the drawer on Bodies, the controls card), 56 cases, no
pair under 4.5:1 and no control under 44px. Driven in Chromium on SwiftShader,
source and bundle: the launch, flying to Saturn and Jupiter with the globe
filling the view and the close-up drawn, W held and a double tapped D, the
drawer on a 390 touch screen with the stick, a manifest row targeting and
flying, the houses tab, hover from a row, Escape from every state, and the 2D
fallback with WebGL off. Flight was driven on the wiring and the Cycle Audit
too: take off, dash, land. N40 and N40b find the dialog by its new name, The
Observatory, and its close control, Close the Observatory.

**What it replaced.** The overlay's grid (`.chartx-grid`, its named areas, the
narrow tab bar) and the seven sub-tables below the points table are gone; every
point is in the manifest once, grouped by category as the sub-tables were. The
rules the overlay sections above record for its data still hold: the aspect id
is an index into the one rich pass the wheel draws, the filter chips are built
from what is present, and comets are off the wheel until the Comets box is
ticked.

## The 3D stages compile in parallel, build when near, and wait for their own faces
Reported by the owner on 20 October 2026: "opening the app shows a bunch of
black boxes in the 3D objects". The boxes were the Loading veils, flat `--bg`,
which is near black under Deep Field, held up for seconds. A CPU profile of the
astrology page found where the seconds went, and there were three causes:

- **The first frame linked every shader on the main thread.** three.js compiles
  a material's program on its first render, and its first `getUniforms` waits
  for the link: 5.9 of the 6 seconds between three.js arriving and the stage
  going live, with the page frozen. Each scene now calls `warmUp()` from
  `render()` before its first frame: `compileAsync` over the scene and over the
  post quad with each of its three materials, which uses
  `KHR_parallel_shader_compile` where the browser has it, and the scene renders
  nothing until that resolves. Measured with `renderer.info.programs`, all
  thirteen of the chart's programs exist before the first frame and the frame
  adds none.
- **A phone built every stage at once.** The phone mounts every section, so the
  Cycle Audit widget, the wiring and the wheel all built and compiled together.
  `attach()` calls `buildNear()` now, an IntersectionObserver with a quarter of
  a screen of margin vertically and one screen either side, so a stage builds
  as it comes into view and the chart beside it in the pager follows. (The
  pager clips its pages, so in practice the neighbour builds as the swipe
  reveals it, behind its veil, without freezing anything.)
- **The faces gate waited on every face the page was loading.** It used
  `document.fonts.ready`, and Settings' theme previews ask for Petrona, which no
  scene draws in: two seconds behind Loading for nothing. `waitFaces()` loads
  the scene's own `--fu` (400, 600, 700) and `--fd` by name, with the same three
  second ceiling.

**The veil is sky, not a black box.** Every Loading veil (`cs`, `hs`, `cw`,
`cy`, `obs`) paints the atmosphere the scene will come up in, two radial washes
of `--atmc` and `--atmc2` over `--bg`, rather than `--bg` alone. Loading still
holds the place and the scene still fades up through it, by "The 3D scenes fade
in from behind Loading".

Measured on SwiftShader, desktop astrology from the address to live: 10.8s
before, 6.4s after, and the main thread's compile stall from 5.9s to 2.4s. What
is left of that stall is the software rasterizer building its pipelines at the
first draw, which a real GPU does not do once the programs are linked.

**On iOS the scenes draw straight to the canvas** (`GFX` at the top of each of
the three scene modules). The owner's iPhone (Chrome, which is WebKit, as every
browser there is) showed the Cycle Audit's 3D with hard edged black rectangles
stepped like the GPU's own tiles, filling in over about a minute (20 October
2026): the offscreen chain, a multisampled half float target blurred and
composited for the bloom, coming back with tiles missing. The direct path is the
one the quality ladder already falls to, so it was drawn and tested; it keeps
the canvas's own antialiasing and loses only the bloom's halo, since every glow
in these scenes is additive in its own shader. `?gfx=` tries the others on any
device without a build: `post` (the chain as it was), `nomsaa` (the chain
without its multisampled target, the likeliest single culprit) and `direct`.
**This container has no WebKit**, so the fault was diagnosed from the
screenshot and the fix confirmed on the iPhone, never here; if `nomsaa` comes
back whole on an iPhone, the bloom can return there without the multisampling.

## The world place list is fetched when a birth place is asked for
Asked for by the owner on 20 October 2026, as the next load cost after the 3D
stages above. `app.html` was 12.3 MB, 4.1 MB over the wire with brotli,
and 7.7 MB of it was `gazetteer-world.js` inlined, which only a birth place
reads. Every visit downloaded it before the first paint. The page is 4.8 MB
now, about 1.3 MB gzipped, and the list sits beside it as a file.

**`gazWant()` fetches it the first time a place surface is drawn**: the first
run's place search (`birthPlaceInfo()`), the profile form, the synastry form,
and at boot when a profile holds a place and no coordinates. The page keeps
`gazetteer-us.js` inline, and the world file appends its rows into the same
array, setting `Gazetteer.WORLD` when it has (`gazReady()`). `gazArrived()`
runs everything that ran without it again: the place memos are dropped
(`_placeHitsQ`, `_placeGeoQ`), `reresolveLocations()` places any profile saved
while it was still on its way, and the page re-renders.

**A submit that needs it waits for it rather than failing.** `birthSubmit()`
and `synFormSave()` hand themselves to `gazWant(then)` when a typed place does
not resolve on the US list alone, and run again when the list lands. While it
is loading the place slot says "Loading places..." instead of nothing found. A
fetch that fails lets the waiting submit go on with the US list and the online
lookup, saying what it would have said, and the next press asks again; a
render never retries on its own, so a dead connection is not a request per
keystroke.

**The bundle copies it rather than inlining it** (`PLACE_FILES` in
`tools/build-bundle.js`), and refuses a bundle where the file is missing, the
app no longer names `./gazetteer-world.js`, or the helmet loads it again. It is
not precached, because a worker that installed it would charge every visit for
it again; the bundle worker's runtime cache keeps it after the first use, and
`build-native.js` carries it into the store apps with the rest of the folder.

Driven in Chromium against the bundle: a returning reader on Today never
requests it; the first run fetches it, finds Zürich, picks it and casts with
47.37 N and Europe/Zurich at 1440 and 390; a cast pressed with the file held
back four seconds waits and lands Kyoto; and a stored profile in Coimbra with
no coordinates asks for the list at boot and is placed. Lisbon would not have
tested it: the US list's fallback already knows the large world cities.

**Puerto Rico is Atlantic time, and the US list had it as New York's** (found
20 October 2026, adding Rio Piedras at the owner's request). `STATE_TZ` filed
`PR` under `E`, so every Puerto Rico place in `gazetteer-us.js` carried
`America/New_York` and a winter birth was drawn an hour late: 06:30 on 9
January 1985 in San Juan came out at 11:30 UTC instead of 10:30. The world
list's own Puerto Rico rows were right all along, but the US rows rank first.
`PR` is code `R` now, `America/Puerto_Rico`, minus four, no daylight saving,
and `reresolveLocations()` gives a stored profile whose coordinates sit on the
island and whose zone is New York's the right zone once at boot. Rio Piedras
is in the US list rather than left to the world list, which never carried it:
a search for it found Rio Piedras in Salta, Argentina.

## Where the Codex computed better, inCommon took its method
The owner asked on 29 September 2026 for the same attention paid to where the
Celestial Codex beat inCommon as had been paid to where inCommon beat it. Five
things, each measured:

- **The sidereal time and the obliquity.** The Codex took the apparent sidereal
  time from astronomy-engine and an obliquity that moves with the date;
  inCommon took the mean sidereal time and the J2000 obliquity, held fixed.
  `skyFrame()` asks the library for the apparent sidereal time and the true
  obliquity (the pair that belongs together) for the Ascendant, the Midheaven,
  the Vertex and the East Point, with the old arithmetic as the fallback.
  Over 20,000 random births the Ascendant moves 0.22 arcminutes on average and
  2.5 at worst, at 60 degrees of latitude; no sign changes, and the whole
  degree changes for 50 of them.
- **Noon for a birth with no time is local noon.** `availability()` has always
  said "12:00 noon local"; `instant()` drew noon at Greenwich. The Codex drew
  local noon, which is the middle of the day the reader was born in, so no body
  can be off by more than half a day of its motion. B13b.
- **A half hour zone keeps its half hour.** Found while testing the one above,
  and the Codex had it right: `Date.UTC(y, mo, d, hh - offset, mi)` truncates a
  fractional hour, so every birth in India, Nepal, Iran, Afghanistan,
  Newfoundland and central Australia was drawn 30 or 45 minutes early, seven to
  eleven degrees of Ascendant. The offset is subtracted in milliseconds now, at
  all eight sites that did it (`birth-time.js`, `people-library.js`, and the
  app's fallback path and daylight saving probes). The thirty two zone rows checked the offset and never the
  instant, which is how it survived; B13c checks the instant, and both rows go
  red on the old code.
- **Chiron is fetched from Horizons**, as the Codex asked Horizons for it: 51
  epochs four years apart, 0.025 degrees at worst against 404 references,
  where the fitted set in `minor-bodies-ephemeris.js` (still the fallback) is
  0.92. See the corrected sections on the expanded chart's bodies and on
  Chiron below.
- **Ego authority is two authorities, and the definition is named.** The Codex
  said Ego Manifested (the Heart reaches the Throat) or Ego Projected, where
  inCommon said Ego; and it named the definition, Single, Split, Triple Split,
  Quadruple Split or none, which inCommon did not show. `hdChart()` carries
  both now, the wiring's card shows a Definition row in both shells, and the
  Oracle's dossier reads them from the chart rather than working them out a
  second time. The lookups that match an authority to its atlas entry match on
  the first word, so "Ego manifested" still finds "Ego (Heart)".

`people-library.js` `STATE_VERSION` went to 3 for the first three, which
invalidates every stored pair.

## The profile icon opens a menu, and Profile opens the card
The owner asked on 29 September 2026 for Log Out and Delete in the profile
icon's sheet, and on 30 September for the icon to open a list instead:
**Profile, Settings, Get Help, Log Out, in that order**, with Support inCommon
between Settings and Get Help in the store apps only (18 October 2026, see "The
Cycle Audit"). `profileMenuVals()`
holds all four, and the icon in both shells is `pmenuGo`, named "Profile menu"
with `aria-haspopup` and `aria-expanded`. On the desktop the list drops from the
icon; on the phone it is a bottom sheet, because `[data-vt-modals]` makes every
vertical dialog one and a dropdown there would be the one dialog that is not.

**Profile opens the card**, which is the old profile sheet headed by who the
chart says the reader is: the big three, the Human Design type, the Life Path,
and a motto. Under it sits what the sheet already held, the profiles on the
device, Change your picture, Phone number and Delete this profile, less Log
Out, which **moved** to the menu rather than being copied, so there is one way
out of the account. `profileCardVals()` computes only while the card is open,
from `chartAt()`, `ascendant()`, `hdChart()` and the core's `lifePath()`, the
same methods the wheel, the wiring and the numbers page read, so the card cannot
disagree with them. A Rising with no birth time says it needs one, and the
sample chart says it is the sample, with Use mine beside it.

**The motto is composed, never written by a model.** `mottoFor(lp, sun, type)`
takes one clause from each system: the Life Path gives the aim
(`MOTTO_LP`, all twelve numbers, masters included), the Sun the manner
(`MOTTO_SUN`), and the type the way in, which is the strategy said as an action
(`MOTTO_TYPE`). "Build what lasts. At an unhurried pace, answer what lights you
up." Every clause is something to do and none says who the reader is, the same
line the three part readings keep. V2 and V3 hold all 720 combinations
distinct, two sentences each, dashless, and free of "you are". The Oracle stays
the one screen that calls a model.

**Settings is the tab**, `tab: 'settings'`, and on the phone
`syncSectionToTab()` carries the reader there, which is why the menu does not
scroll anything itself.

**Get Help prompts a call, to the line for where the reader is.**
`helpCountry()` reads the device's time zone first, because that follows the
phone, and the language's region only when the zone says nothing (UTC). It knows
the four countries `crisis-directory.js` covers, and `callVals()` takes that
country's first crisis line with a phone: 988 (call or text) in the US and
Canada, Samaritans 116 123 in the UK and Ireland, Lifeline 13 11 14 in Australia,
each with the emergency number beside it. **Anywhere else it gives no number**,
because a number that does not connect is worse than none at a moment like this;
it says to call the local emergency number and offers findahelpline.com and the
full list. It wears `--crisis`, never `--ac`, and opening it logs the same one
anonymous timestamp the crisis sheet does (`crisisAudit()`). The call button is
white on the crisis gradient, about 3.7:1, which is why it is 19px bold: that
passes as large text, and the contrast sweep cannot read a gradient to catch it.
V4 to V5b hold the country and the line.

**Driven, and measured.** Both shells: the menu's four rows in order at 48px,
Escape closes it, Profile opens the card with values equal to the app's own
methods and no Log Out in it, Settings lands on Settings, Get Help opens the
prompt with `tel:` and `sms:` links and logs one timestamp, More lines opens the
crisis sheet, and Log Out signs out and reaches the cover. London, Sydney,
Toronto and Tokyo each get their own answer. The menu, the card and both forms
of the prompt measured clean in all 32 theme cases at 1440 and 375, and fit at
320x568, 375x667, a phone on its side, 1024 and 1920, scrolling where they are
taller than the screen.

**Delete this profile opens the same dialog Settings opens**, typed name and
all. ProfileManager refuses to delete the last profile on a device, so for that
one the dialog says what happens instead: inCommon starts over with a fresh
profile and the birth page opens, which is what deleting the only profile means
to the person doing it. A fresh profile is made and made active BEFORE the old
one is deleted, so the refusal never fires.

**Log Out signs out and keeps everything on the device, and Back cannot undo
it.** It marks the tab (`incommon.signin.out` in sessionStorage) and goes to
the cover as a new history entry. A plain script at the top of the app sends
any app page reached through history (`back_forward`, or a back-forward cache
`pageshow`) in a marked tab to the cover, hidden until it goes, so Back after
Log Out brings the home screen up rather than the app. It is a new entry and
not a replacement, because a replacement left nothing of the site behind the
cover and Back left the site. The cover reloads itself to its first screen when
restored from that cache in a marked tab. Any other way into the app clears the
mark. The other half is on the cover: a cover reached through history by a
reader who is signed in and owes no code goes straight back into the app on
Today (`backIn()`), so Back from Today after signing in reads as Today
refreshing rather than as being signed out. A marked tab is never sent in. And
`signOut()` in `incommon-cloud.js` falls back to a local sign out when the
server cannot be told, because supabase-js keeps the stored session on a
network failure and the cover would then offer the reader straight back in.
**It signs out this device and no other** (`scope: 'local'`, K70). supabase-js
defaults to a global sign out, which revokes every refresh token the account
holds, so logging out on one phone signed the reader out everywhere and their
next visit on the laptop asked them to sign in while it still looked signed in
(Refresh Token Not Found in the auth log, reported 18 October 2026). `accountLogOut()`
calls the cloud module's `signOut()` and goes to the cover, `coverHref()`, which
is `./` in the bundle and `./cover.html` in the source shell, because the app
is `app.html` in one and the long name in the other. The line beside it names
the signed in address or number, or says "back to the cover" when there is
none. The Settings button that used to say "Log out" cleared birth data, which
is a different act wearing the same word, so it says "Clear birth data" now.

**Signed out with a blank store lands on sign in, not the birth page** (owner,
13 October 2026). Log Out, close the site, open the app again: the session is
gone, the guest store is blank because the account took the profiles, and a
blank store is first run, so the reader was asked for their birth moment when
what they had to do was sign in. A session that ended with the browser (no
Remember me) arrives the same way. `signedOutLanding()` is checked once in
`boot()`, before `ensureProfiles()` writes anything: no `PM.owner()`, first run
not done, not framed, and no `incommon.guest.chosen` in sessionStorage, and the
page goes to `coverHref() + '?signin=1'`. The cover's Continue without an
account sets that mark for the tab, or it would bring a guest straight back.
Checked at boot only, so Clear birth data in Settings still opens the birth
page. The harness is exempt by the frame check, because every phase starts from
a clean origin and grades the first run.

**The Cloud card is gone from both Settings screens**, replaced by a comment
where it stood. Signing in happens on the cover now, and a second account door
in Settings would be a second place for the two to disagree. The cloud
vals are left in place, unrendered, so bringing the card back is a markup change
only.

## The newsletter is asked for at sign up, and can be refused there
The owner asked on 29 September 2026 for a newsletter that signs readers up when
their account is made, with an opt out box. The box sits under the password in
the cover's Create New Account form, "Send me the inCommon newsletter", ticked.
Its answer goes with the sign up request as user metadata (`newsletter`, `newsletter_source`,
`newsletter_decided_at`), and Supabase writes metadata only when that request
creates the account, so the answer is recorded once, at creation, and a
returning reader who unticks it changes nothing. K24 and K25 hold the shape.

Nothing is sent to any mailing service from the app. `docs/NEWSLETTER-SETUP.md`
is the owner's half: the query that reads the list out of `auth.users` (only
confirmed addresses), choosing a sender, and the rules the box lives under. **A
box that starts ticked is not consent in the EU or the UK**, and that page says
so, because it is the owner's decision whether to start it unticked or confirm
by email there, and it should be made knowingly.

**Since the password replaced the emailed link, the box sits in Create New
Account and nowhere else**, so it is asked exactly when an account is made and
a sign in carries no options at all (K24). The list reads only confirmed
addresses, which holds only while Confirm email stays on in the project.

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
  deployment.** `deploy/v6.4/` holds the bundle stamped `incommon-v6.4`, and
  those two numbers are the same number on purpose: a folder called `v1.7`
  holding a bundle stamped `v5.8` told a reader nothing. Rebuilding does not
  earn a bump. The stamp changes when a build has been deployed AND confirmed
  live, and the folder is renamed in the same change, because a shelf of near
  identical folders and two files claiming one version with different bytes is
  the failure `check-deployed.js` exists to catch.
- **There are three ways this repo reaches a host and all three now work.**
  Git connected, where `netlify.toml` names the publish directory. Dragging
  `deploy/v6.4/`, where that folder's own `_redirects` and `_headers` travel
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
  bundle, so the thing you upload is `deploy/v6.4/`. A host pointed at
  `deploy/` itself, or at the repo root, serves a directory with no page in
  it: the deploy succeeds and the link is broken, which is a failure with no
  error anywhere in it. **The folder is named ONCE, in `BUNDLE` at the top of
  `tools/build-bundle.js`, and everything else is generated from it or reads it
  from there.** `netlify.toml` is written by the build, the same way the two
  `_redirects` already were, and `check-deployed.js` parses `BUNDLE` out of the
  builder rather than declaring its own copy.

  It used to be three hand written constants with comments asking whoever
  changed one to change the others, and both copies drifted. `check-deployed`
  sat on v6.2 while the builder wrote v6.3, so the deploy check compared the
  live site against a bundle nothing had written in a week. `netlify.toml` sat
  on v6.2 too, so a git connected deploy served the previous bundle while a
  dragged repository served the current one: the same repository, two different
  sites, both deploys succeeding, nothing anywhere reporting it. A comment
  asking a human to keep two constants in step is the thing that drifts. Both
  tools also pointed at `deploy/index.html` for as long as the bundle sat
  there and silently stopped working when it moved: the build refused to run
  and the deploy check refused to compare, and neither said anything a build
  log would show.
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
uploaded whole. The bundle's `app.html` and `manifest.json` name those copies
as `./icon-192.png` and so on: `build-bundle.js` rewrites the app's three
`../inCommon%20Logo/icons/` addresses and refuses if the count is not three.
Until 15 October 2026 they shipped unrewritten, and from a site root that
address is answered by the catch all with the app, so a home screen icon was
an HTML page.

`tools/` holds thirty four scripts. Twenty one are gates and are worth running
before you believe a change is done: `run-tests-node.js`, `run-fixtures.js`,
`run-module-tests.js`, `check-purple-text.js`, `check-dead-controls.js`,
`token-compare.js`, `check-competitor-surface.js`, `check-layer-boundary.js`,
`check-aspect-text.js`, `check-chart-tone.js`, `check-prose-repeats.js`,
`check-hd-atlas-map.js`, `check-point-registry.js`, `check-ephemeris-engine.js`,
`check-harmonic.js`, `check-patterns.js`, `check-harmonic-patterns.js`,
`check-registry-integration.js`, `check-minor-body-elements.js`,
`check-astral-bodies.js`, `check-timing-lexicon.js`.
Ten generate:
`build-bundle.js`, `build-number-matrix.js` (`app/number-matrix.js`, from the owner's Book of Numbers CSV), `build-learn-pages.js` (`learn/` and `sitemap.xml`, run by `build-bundle.js`), `build-native.js` (`native/www/` for the store apps), `build-icons.js`,
`build-ui-icons.js`, `build-gazetteer.js`, `fetch-minor-body-elements.js`
and `fetch-astral-bodies.js` (both need network: JPL Horizons), `build-extended-points-doc.js`
(`EXTENDED-POINTS-REFERENCE.md`, from `ephemeris/pointRegistry.ts`, so the
doc's own counts can never drift from the registry's). `check-deployed.js` compares what
is served with what was built. `bench-ephemeris.js` measures the position
cache and asserts it did not change an answer.

`drift-check.js` is none of the three above and does not run cold the way
the other thirty do. It is the only script in `tools/` that drives a
real browser, because it exists to answer a different question:
`check-deployed.js` asks whether the live site matches what was built, and
this asks whether the current `deploy/<version>/` itself still matches the bytes the seven
deterministic verification phases (M, E, F, G, T, R, N) last passed against,
skipping the browser run entirely when a `sha256sum` says it does. It needs
Playwright and a Chromium binary this repo installs for nobody, and says so
plainly rather than throwing a bare module-not-found when neither is on the
machine. Its baseline, `tools/fixtures/drift-check-baseline.json`, is
generated by a passing `--force --record-baseline` run and never hand-typed,
the same discipline `hd-topology.js` and `check-minor-body-elements.js`'s
own fixture already hold elsewhere in this repo: a hash a human edits by
hand is a hash that drifts the first time nobody remembers to.

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
Boomerang is a Yod plus a fourth body opposing the apex, nothing more),
`detectBoomerang()` was rewritten to that actual shape, which is always
achievable. `apex` on the returned pattern now names the release body
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
between two bodies, both biquintile [144°] from a third - checked against
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

## Search engines are given the cover, the legal pages and the Learn pages
Added 15 October 2026. The cover is a canvas, so what a crawler read of the
home page was the wordmark, "enter here" and, from the markup, the SIGNAL LOST
line. Its head now carries a title, a description, a canonical address, Open
Graph and Twitter tags with `og-image.jpg` (cut from the horizontal lockup in
`inCommon Logo/identity/`, 1200x630), icon links, and JSON-LD naming the
WebSite and INCOMMON LLC. The SIGNAL LOST text is written by the 9 second
timer rather than sitting in the markup.

**The cover links them, once, under the legal links** (`.learn`, the owner,
16 October 2026), so a reader can read before signing in and a crawler, which
reads nothing on a canvas, has a link to follow. It shows at rest and with the
form open, leaves with the way in on scroll (`wayEls`), and is not a way in.

**`app.html` carries `noindex, follow`.** The catch all answers every unknown
path with it, so indexing it puts one unfilled template under every address
anybody links. The legal pages keep `index, follow`.

**`/learn/` is the app's reference writing at plain addresses** (the owner,
16 October 2026): the 64 gates, the 64 hexagrams, the written angel numbers,
the dream registry and the animals, 355 pages. `tools/build-learn-pages.js`
writes them into the bundle from the same modules the app reads, and
`build-bundle.js` runs it before listing the folder for `_redirects`, so they
are rebuilt with every bundle and cannot disagree with the app. They are not a
fork: no script, no chart, no state, only text, styled like the legal pages.
The modules' caution and method fields are not drawn, by "No disclaimers", and
an angel number the module only composes gets no page. The build refuses a
dash, a mark `check-competitor-surface.js` bars (it skips `deploy/`, so the
marks are asserted over the output), bodygraph in a heading, and any `/learn/`
link that was not built. **Change the writing in the module, never in a page.**

**Every Learn page opens the same entry inside the app** (the owner, 17
October 2026), because the app's screens live after the `#` and no search
engine can index them, so a Learn page is the only way in from a search. The
button is `/app.html?from=learn#<entry>`, the entry addresses are
`/library/human-design-atlas/gate/<n>`, `/library/i-ching/hexagram/<n>`,
`/library/dreams/<category>/<key>`, `/library/synchronicities/number/<n>` and
`/library/synchronicities/animal/<slug>`, resolved in `openPath()`, and one it
cannot find lands on its room. `learnGuest()` lets that visitor straight in for
the tab: no sign in page, no birth page, the sample chart behind them and Use
mine on the banner. It writes nothing else, so a later visit that did not come
from a Learn page meets the first run as before. Every one of the 354 links was
driven in a browser to its entry.

**The site's address is written once in the generator and twice beside it**:
`SITE` in `tools/build-learn-pages.js`, the head of `app/cover.html`, and
`deploy/<version>/robots.txt`. The generator refuses to build when the cover's
canonical or the robots `Sitemap:` line disagrees with `SITE`, and it writes
`sitemap.xml` itself (the cover, the legal pages and every Learn page; never
app.html). It is `https://incommonspace.com`, the apex, since the domain was
connected on 16 October 2026; incommon.netlify.app answers with a 301 to it,
path and query kept, by the first rule in `deploy/<version>/_redirects`
(hand written, so it moves with the folder at a version bump): setting the
apex as primary in Netlify forwards www but leaves the Netlify address
serving the site, and that address cannot be removed. Deploy previews and
branch deploys are other hosts and are not redirected. If the address moves, change
the three together, then submit the sitemap again in Search Console.
Description copy follows the voice rules: no method, no fate, no dash.
