# Human Design Atlas V1.1: lessons, lexicon, sources and open questions

Asked for by the owner on 3 November 2026: Bedrock, Weather and Horizon lessons
(after the "what you'll learn" grouping on Ra.TV), plus every standard term and
its variants. Branch `feature/hd-atlas-lessons-lexicon`. Nothing here is merged
or deployed, and `deploy/` was not rebuilt.

## What changed

- `app/hd-atlas.js` (V1.1.0): `TIERS` and `LESSONS` (21 lessons, 7 per tier, in
  the owner's order), `CIRCUIT_OF` and `circuitOf()` (all 36 channels, one
  family each), and `LEXICON` (80 new entries) merged with the 16 existing
  `TERMS` into one alphabetical lexicon of 96. Three new chapters (Bedrock,
  Weather, Horizon) after the introduction; "Further terms" is now "The lexicon".
- `app/inCommonApp v2.dc.html`: the Atlas reads the lessons (tiles numbered I to
  VII, kicker "Bedrock lesson 1 of 7", epigraph, every variant as a facet, links
  to the reference shelves, "In your chart" for Type, Strategy, Inner Authority,
  Profile, Definition and Angle); lexicon tiles show their initial letter and
  link to their lesson; the global search indexes the lessons. No markup change.
- `tools/run-module-tests.js`: rows F1 to F8.

## Existing Atlas text that was wrong, and is corrected

| Where | Was | Now | Evidence |
|---|---|---|---|
| Projector authority | self-projected, splenic, mental, or ego | adds emotional; ego named as ego projected | Authority rule in the vault (Solar Plexus first for every type with it defined); the published dictionary: "A defined Solar Plexus is always the Inner Authority" |
| Manifesting Generator share | about 11 percent | about 35 percent (Generator also about 35) | the five shares summed to 80; Jovian product page: Generators about 70%, "half of which are pure Generators, the other half are Manifesting Generators"; the app's own 2,000-birth sample gives MG 692 (34.6%) and Generator 716 (35.8%). See "Type shares" below |
| Projector share | about 22 percent | about 20 percent | published "just over 20%"; app sample 412 of 2,000 (20.6%) |
| Manifesting Generator strategy, signature, not-self | respond then inform; satisfaction and peace; frustration and anger | the published convention (same as Generator) first, with the teachers' addition named as such | published dictionary: "the Strategy, Aura, Not-Self Theme, and Signature are the same" as the Generator |
| Projector aura | focused and penetrating | focused and absorbing (penetrating noted) | published dictionary: Projectors "absorb and take in the other in a very focused way"; "penetrating" appears only in product copy |
| Reflector aura | sampling and resistant | resistant and sampling | published dictionary wording order |
| Variables term | Determination and Environment below, Motivation and Perspective above | left arrows Design (Determination top, Environment bottom), right arrows Personality (Motivation top, Perspective bottom) | four sources agree on the positions |
| Individual circuitry | sub-circuits Knowing, Centering and Integration | Knowing and Centering circuits with the Integration channels | published dictionary lists six circuits; Integration is a channel set |

## Sources read (3 November 2026)

- Published dictionary: jovianarchive.com/pages/human-design-dictionary (read in full)
- jovianarchive.com pages on Variable, substructure, View, definition, statistics, the nine centers
- Independent: barneyandflow.com (environments, motivations, perspectives, cognition),
  splenic.substack.com (variables case study), vickiedickson.com (environment),
  mindbodyspiritfood.substack.com (digestion), human-design-variables.pages.dev,
  nicolyawilliams.com (four arrows), humandesignguide.substack.com (colors, tones),
  Wikipedia (Human Design)
- inCommon's own: `data-contracts/hd-vault/` (authority order, type and definition counts over 2,000 births)

Everything is written in inCommon's own words. Nothing is quoted or closely
paraphrased. Fidelity to the published convention is not a claim that the
system is valid; the intro's caution stands.

## Open: where sources disagree

1. **Individual emotional wave theme.** The dictionary itself says "uncertainty" in
   one entry and the product pages say "passion". The lexicon gives passion and names the other.
2. **Fourth arrow's name.** Motivation (Jovian Variable page, two independent sites) or
   awareness (a Jovian story, one site). Written as Motivation, awareness noted.
3. **Perspective color 4.** Wanting (Jovian) or Want (two independent sites). Written as Wanting.
4. **Which arrows come from the Sun and which from the Nodes.** Not mapped in full by
   any source; they conflict. The lessons do not state it.
5. **Uranus opposition.** 38 to 44 in one dictionary entry, 38 to 43 in another. Written 38 to 44.
6. **Generator share.** 65% (dictionary) or almost 70% (statistics). Written as two thirds to seven tenths. See "Type shares" below.
7. **10-34.** Counted in the Centering circuit by teachers and among the Integration
   gates by the dictionary. Filed under Centering so each channel has one family; the lesson says it joins the Integration gates.
8. **Simple and wide split.** Teachers' names, not in the published four; the lesson says so.
9. **Left or right: tone or arrow.** The Jovian substructure page gives tones 1 to 3 left,
   4 to 6 right; three sites read the arrow's direction. These are the same thing drawn two ways; no source says that explicitly.

## Open: single source, or from knowledge with no source read

These are in the lessons as written and should be checked by a Human Design reviewer before merge.

- Cross of Planning 1615 to 2027 and the Cross of the Sleeping Phoenix (no page read gives dates).
- The four Quarters' gates and themes (the dictionary names them and their 16 hexagrams only).
- Stream gate sequences for the Spleen (54-32-44, 38-28-57, 58-18-48), the Ajna
  (64-47-11-56, 63-4-17-62, 61-24-43-23) and the Solar Plexus tribal and individual streams. Only 41-30-36-35 was confirmed.
- Ego manifested, ego projected, self-projected, mental and lunar authority definitions:
  from the vault's derivation rule, not from a published page read today.
- Determination left and right pairing (consecutive or alternating and so on): one source, no left or right labels.
- Base count of five: one Jovian page.
- Energy, mental and classic Projector: teachers' terms, written as such.
- Splenic fears, Ajna anxieties, Solar Plexus nervousness: from knowledge.
- Exaltation and detriment entry: from knowledge.
- Sacral sounds (rising for yes, falling for no): from knowledge.

## Deliberately left out

- **Biological correlations of the centers** (glands and organs): left out under the no-health-claims rule.
- **The 192 cross names** and the 64 Ra gate names: the trademark study recommends against Ra's naming.
- **The older angle names** (personal destiny, fixed fate, transpersonal karma): the
  voice rule bars fate language. The Angle lesson says older names exist without printing them.

## Tests run on this branch

`run-module-tests` 527/527 (F1 to F8 new), `check-hd-atlas-map` (18 sections),
`check-competitor-surface` 0 findings, `check-layer-boundary`, `check-prose-repeats`,
`check-purple-text`, `check-dead-controls`: all pass. A preview bundle was built to
a scratch folder with `build-bundle.js --preview` and walked in Chromium at 390x844
and 1440x900: 12 entries each, no page errors, no horizontal overflow.
Not run: the browser harness gates (drift-check, drive-*), contrast and tap-target
sweeps over the new chapters, and `check-hd-study-rls`.


## Type shares, checked 3 November 2026

Asked for by the owner: the Manifesting Generator share, every respected source.
V is a verbatim quotation from the page; nothing below is copied into the app.

| Source | Generator incl. MG | MG alone | Projector | Manifestor | Reflector | Method stated |
|---|---|---|---|---|---|---|
| Jovian Archive, Human Design Dictionary | "roughly 65%" (V) | not given | "a little over 20%", and "Projectors (23%)" in the Non-Energy entry (V) | "roughly 10%" (V) | "approximately 1-2%" (V) | none |
| Jovian Archive, Type and Strategy page | "about 70%" (V) | not given | "about 20%" (V) | "about 9%" (V) | "just over 1%" (V) | none |
| Jovian Archive, Statistics page and its blurbs | "almost 70%" (V) | not given | "just over 20%" (V) | "about 9%" (V) | "around 1.3 or 1.4%" (V) | the page names its dataset (nearly 50 million charts since the mid 2000s, plus over 2 million saved charts) but ties no figure to it in its own text |
| Jovian Archive, Generator and MG product page | "around 70%" (V) | "Half of which are pure Generators, the other half are Manifesting Generators" (V), so about 35% | n/a | n/a | n/a | none |
| Jovian Archive, MG page | no figure | no figure | | | | "There are only four Human Design types. Manifesting Generators are not a fifth type." (V) |
| Jovian Archive, Generator page | no figure | no figure | | | | "two variations under the Generator umbrella": Pure Generators and Manifesting Generators (V) |
| IHDS, Genetic Matrix, myBodyGraph, Human Design America listing | no figure on any page reached | | | | | |
| Wikipedia, Human Design | no figure | | | | | MG "sometimes designated a fifth energy type" (V) |
| inCommon's own engine, 2,000 random births 1950 to 2010 | 70.4% (1,408) | 34.6% (692) | 20.6% | 8.2% | 0.8% | computed here; an independent check of the published figures, not a source |

**What the app says now.** Generator about 35 percent, Manifesting Generator about
35 percent, Projector about 20, Manifestor about 9, Reflector about 1, which sums to
100 and sits within about a point of both the half and half split Jovian publishes
and the engine's own sample.

**Disagreements, all left visible rather than resolved:**
1. Generators together are 65% in the dictionary and about 70% everywhere else Jovian publishes. The engine sample agrees with 70.
2. Projectors are 20% in most places and 23% in one dictionary entry. The engine gives 20.6.
3. Reflectors are given as just over 1%, 1.3 to 1.4%, and 1 to 2%. The engine gives 0.8 on 2,000 births, too small a sample to separate these.
4. Whether MG is a type. Jovian says it is not a fifth type; Wikipedia and many teachers treat it as one. The lexicon says both.
5. No source states how any share was derived. No computed population study was found.

**Not reached:** the full text of The Definitive Book of Human Design, humandesign.ai,
and any peer reviewed or computed population study (none located).

**Terms added to the lexicon on the strength of this:** Generator, Pure Generator
(named on Jovian's Generator and MG pages and in its dictionary) and Manifesting
Generator. "Classic Generator" was looked for and found on no source read, so it is
not used.


## Group terms, added 4 November 2026

The owner decided the group terms belong in the dictionary. `check-competitor-surface.js`
carries a reasoned override for each name in `app/hd-atlas.js` only, so no inCommon
surface may take the name. Wa needs none: the gate bars the capital WA.

| Term | What was read | Status |
|---|---|---|
| Penta | Jovian "The Penta" article: an aura that forms with three people, "channels that run between the Sacral Center, through the G Center, to the Throat", no Spleen, Ajna, Solar Plexus, Ego or Root; family and small-business use. Size three to five (Wa Immersion talk), three or more (Group Mechanics product page) | the six channel numbers are from knowledge, see below |
| Wa | Jovian product page: "9 people or more", "nine to sixteen people", "sixteen or more" (all on one page), driven for material success; Wa Immersion talk: built on Pentas | the size disagreement is written into the entry |
| Trans-Auric Form | Jovian dictionary "Design of Forms": two transpersonal forms, the Penta and the Wa; the Trans-Auric Forms article | sourced |
| Gap | Wa Immersion talk: "A gap is a place that determines where everybody's attention goes" | the role-filling clause is from knowledge |
| Alpha | Jovian dictionary, read only through a fetch tool's summary: "three Pentas and an Alpha" | single source, not read verbatim |
| BG5 | BG5 Business Institute exists (its org chart and practitioners' pages); not on any Jovian page read | described only as the business and career application |
| OC16 | one passing mention on the Wa Immersion page, as a business knowledge base for large groups | described only that far |

## The knowledge items, researched on 4 November 2026

The twelve items below went in from memory, without a source read, and were
listed here openly. The owner asked on 4 November 2026 that nothing rest on
knowledge alone, so each was checked against published pages and then kept,
corrected or removed. "Summary" means the page was read through a fetch tool's
summary rather than verbatim.

| # | Item | Found | Done |
|---|---|---|---|
| 1 | Penta channels 2-14, 5-15, 29-46, 1-8, 7-31, 13-33, not 10-20 | Barney and flo(w), "Penta": the six channels by name, G to Sacral and G to Throat; 10-20 not among them | kept |
| 2 | Gap: a newcomer is pulled into the role | not found; the same page defines a gap only as energy nobody in the group carries | role clause removed |
| 3 | Cross of Planning 1615 to 2027, then the Sleeping Phoenix | Jovian, "Global Cycles" and "The 2027 Cycle Transition", verbatim | kept |
| 4 | Quarters, their gates and themes | humandesignlife, "Quarters and Godheads" (republished from Jovian): Initiation 13 to 24, Civilization 2 to 33, Duality 7 to 44, Mutation 1 to 19; purpose fulfilled through mind, form, bonding, transformation; the cross follows the Personality Sun | kept, opening gates and themes added |
| 5 | Stream gate sequences | Jovian dictionary: the Ajna's three streams by name (verbatim), the Spleen's three themes and the wave's three variations (summary), and 41-30-36-35 (verbatim). No other gate sequence found | every unconfirmed sequence removed; names kept |
| 6 | Minor authority definitions | Jovian "Minor Authorities": the three names and the open Solar Plexus, Sacral and Spleen; "No Direct Inner Authority": Reflectors and Mental Projectors. The wiring is the app's own derivation (`authOf()`), consistent with the type rules | kept; "also called environmental" removed, wording follows Jovian |
| 7 | Determination left active, right passive | not found; Jovian "Left, Right and the 16 Variables" calls a left arrow strategic and a right arrow receptive | replaced with the published words |
| 8 | Energy, mental and classic Projector | Jovian uses Mental Projector; Projector called "a non-energy Type"; energy and classic Projector not found as terms | only the mental Projector kept |
| 9 | Splenic fears, Ajna anxieties, Solar Plexus nervousness | not found on any page read | removed |
| 10 | Exaltation and detriment as astral bodies that fix a line | not found; the Jovian dictionary calls both "often misleading" terms for "a polarity of a Line" | rewritten to the dictionary's framing |
| 11 | Sacral sounds rising and falling | "uh-huh" and "unh-unh" confirmed (Jovian, "Sacral Authority"); pitch not found. The Atlas never carried the pitch claim | nothing to change |
| 12 | Base count of five, the Alpha, Uranus opposition 38 to 44 | five bases and 69,120 bases: Jovian dictionary, verbatim; 38 to 44: dictionary, "Mid-Life Point", verbatim; the Alpha only as part of the Wa, summary | kept; the Alpha entry already says little else was found |

**Corrected the same day by a wider search (below):** rows 7 and 10 were wrong.
Jovian does use "active" and "passive" for the arrows, and does teach line fixing by
astral bodies. Both are restored.

## Wider research, 4 November 2026

The owner asked for a search beyond Jovian, for the kinds within every type, and for a
probability that each removal was true to the tradition as Jovian and Ra Uru Hu teach
it. Anything above 90% goes back in as the tradition, or as an honourable mention of
modern study. **The probabilities are judgement, not a calculation**: they weigh how
many independent pages agree, whether Ra's or Jovian's own material says it, whether
any page contradicts it, and whether it fits the wiring the app already computes.

### Kinds within each type

| Term | Sources read | Ra or Jovian | Definitions agree | Atlas |
|---|---|---|---|---|
| Type plus authority (emotional Projector, Generator emotional) | Ra's reading titles on Jovian product pages, one blog | yes | yes | added to Kinds of Projector |
| Mental Projector | Jovian Projector hub, Ra's readings, three blogs | yes | yes, one outlier | kept |
| Energy and classic Projector | three teacher blogs (Laura Olsen, Ann Smyth, Being Awakened) | no; Jovian calls the Projector a non-energy type | no: each blog draws the line differently | named as modern terms, no definition |
| Pure Generator | Augurine, a Jovian guide | yes | yes | already in the lexicon |
| Manifesting Generator as a kind of Generator | Jovian guide, one blog | yes | mostly | already in |
| Emotional Manifestor | one self-description | only as an authority | n/a | not added |
| Kinds of Manifesting Generator or Reflector | none found | none | n/a | none |

### The removals, scored

| Removed item | Evidence | Probability | Done |
|---|---|---|---|
| Line fixing: astral bodies exalt a line or put it in detriment, and an activation fixes it | Jovian "Line Fixing in Human Design", the Rave I'Ching guide, a 2005 blog, Ra quoted on the names; juxtaposition and harmonic fixing on Jovian | 97% | restored; a line may carry more than one body a side |
| Arrows: left active, right passive | Jovian "Variable" article and hub ("receptive, passive, and open"), three more pages | 97% | restored |
| The seven splenic fears, gate by gate | Ra's Rave Anatomy II contents (18 authority, 48 inadequacy), Satyori, humandesignlife, plum-bassoon, Bonnie Sorsby; no contradiction | 93% | added |
| The Ajna's fear is anxiety (the principle) | Ra's Rave Anatomy II contents: "The Fear of the Ajna is Anxiety" | 93% | added |
| An anxiety per Ajna gate | three teacher lists; only 17 and 43 agree | 60% | named as modern study, no list |
| A nervousness per Solar Plexus gate | two teacher lists agree closely; nothing from Jovian | 85% | named as modern study, no list |
| Tribal emotional stream 19, 49, 37, 40 | humandesignlife, humandesigninsight; 6-59 is outside it | 93% | added; "or 6 and 59" stays out |
| Ajna streams 64-47-11, 63-4-17, 61-24-43 | Satyori, Jovian "The Mental Streams" for 24-43-23; the channels fit the circuits | 91% | added, ending "at the Throat" since 56, 62 and 23 were not read |
| Splenic streams 54-32-44, 38-28-57, 58-18-48 | one page (humandesignlife); circuits fit | 90% | not above 90; left out |
| Individual emotional stream 39, 55, 22, 12 | one page; channels fit | 90% | left out |
| Gap: a newcomer is pulled into the role | two pages say a group seeks to fill its gaps; none says the arrival takes it | 40% | left out |
| Energy and classic Projector as defined before | definitions disagree across three blogs | 50% | only the names, as above |
| Determination's six left and right sides | one page for four of them, two for Sound and Light | 80% | sides left out |
| Reflector about 28 days | five pages; one says 29.5; Jovian says a cycle of the Moon | kept as on main | n/a |

Pages added by this search: jovianarchive.com/blogs/chart-interpretations-components/line-fixing-in-human-design-exaltation-detriment-and-juxtaposition;
jovianarchive.com/Stories/118/Variable-_The_Blueprint_of_Brain_Body_and_Mind;
jovianarchive.com/pages/projector-human-design; jovianarchive.com/Products/371/The_Art_of_Reading_Projectors;
jovianarchive.com/Stories/2/The_Mental_Streams; satyori.com/human-design/spleen-center-human-design/;
satyori.com/human-design/ajna-center-human-design/; humandesignlife.squarespace.com (Splenic and Solar Plexus centre posts);
humandesigninsight.com/tribal-emotional-wave/; the Rave Anatomy II contents (Ra Uru Hu); lauraolsen, annsmyth and
beingawakened Projector posts; issuu Rave I'Ching guide; plum-bassoon-jhnw.squarespace.com (fear gates, Penta, determination).

Left as it was on main: Reflector "about 28 days" predates this branch, and Jovian
says only that the Moon passes all the gates in about a month.

Pages: jovianarchive.com/pages/global-cycles-in-human-design,
/pages/the-2027-cycle-transition-in-human-design, /pages/human-design-dictionary,
/products/minor-authorities, /products/no-direct-inner-authority, /products/projector,
/products/reflector, /products/advanced-1-left-right-and-the-16-variables,
/pages/sacral-authority-in-human-design-trusting-the-gut-response;
humandesignlife.squarespace.com/blog/2017/3/11/quarters-and-godheads-of-the-human-design-mandala;
barneyandflow.com/penta.

## The Projector, the modern study and the field study, 4 November 2026

The owner asked for the Projector to be defined with the same effort as the other
types and its kinds named as modern, for "Pure Generator" to read as Generator, for a
modern study with named weights, for a field study the reader can contribute to, and
for the Gap clause to be discerned heavily. This pass supersedes two rows above:
energy and classic Projector are now defined, and the splenic streams and the
individual emotional stream were scored again.

**What changed in the Atlas itself**

- The Projector's definition, and three lexicon entries: Energy Projector (Heart,
  Solar Plexus or Root defined, none joined to the Throat, still a non-energy type),
  Classic Projector (no motor; definition in the Spleen or the G; splenic or
  self-projected authority) and Mental Projector (Ra Uru Hu's own name; definition only
  in the Head, Ajna and Throat; no direct inner authority). The folio carries them as
  "Kinds, in modern use", saying energy and classic came after him.
- "Pure Generator" is gone as a term; the Generator entry carries the share and its
  sibling.
- The Ajna stream lesson now names the Throat gates (56, 62, 23) and the Solar Plexus
  lesson names the individual stream (39, 55, 22, 12), each scored 95 below.

A first draft said an energy Projector draws on a motor "in bursts" and takes its
authority from the highest motor. Neither was supported, and the second is wrong (Root
to Spleen gives splenic authority), so both were removed before the commit.

**The weights.** Names in the app's own sky: Fixed star (91 to 100, the Atlas itself),
Bright (80 to 90), Dim (70 to 79), Twinkling (60 to 69, field study) and Below the
horizon (under 60, field study). The owner's two bands overlap at 60 to 69 and 70 to
89; the reading taken is that 70 to 89 is mentioned with a reliability note and
anything under 70 is a field study. A score is judgement over the same four things as
above: independent agreement, whether Ra's own material says it, contradiction, and
fit with the wiring the app computes.

| Claim | Score | Weight |
|---|---|---|
| Energy and classic Projectors, as defined above | 85 | Bright |
| Splenic streams 54-32-44, 38-28-57, 58-18-48 | 90 | Bright |
| A sense per splenic stream | 75 | Dim |
| Solar Plexus fears of the tribal stream (30, 36, 6) | 85 | Bright |
| The rest of the Solar Plexus nervousness list | 75 | Dim |
| Ajna anxieties for 4, 17, 43, 24 | 80 | Bright |
| The anxiety of gate 47 | 55 | Field study |
| The anxiety of gate 11 | 50 | Field study |
| Determination's left and right sides | 85 | Bright |
| Ajna Throat ends (56, 62, 23) | 95 | Atlas |
| Individual emotional stream 39, 55, 22, 12 | 95 | Atlas |

**The Gap clause, discerned.** It was one sentence carrying four claims, and they do
not share a weight:

| Part | Score | Why |
|---|---|---|
| A group's attention fixes on what it lacks | 85, Bright | Ra's Group Mechanics names the gaps; teaching sites agree and none contradicts |
| A newcomer who carries the missing part is pulled into the role | 60, Twinkling | sites and app libraries say it; nothing of Ra's was found that says the arrival takes it |
| A newcomer without the wiring is conditioned into it | 40, Below the horizon | one app library; it reads as plausible conditioning theory, not as a teaching |
| The group comes to over rely on the one who carries it | 50, Below the horizon | two teaching sites, no primary source |

**The field study.** Every claim under 70 carries a form: how well it fit (Not at all,
A little, Mostly, Exactly, Not sure) and, as a separate question, how charged the moment
was (Quiet, Stirred, Electric). The tally reports fit among the sure answers, fit in the
quiet moments alone, and fit where the reader's own chart holds the gate, so a claim
that only fits when a moment is electric shows it. The words stay on the device. Sent,
if the reader is signed in and chooses: the claim key, the two answers and whether the
chart holds it. One note a day per claim per account; totals are shown from ten notes.
Migration 0018 holds it and is not applied: it waits on the Privacy Policy paragraph
going live.

**Sources this pass**, as recorded on each claim: Rave Anatomy II excerpts, Ra Uru Hu's
Group Mechanics chapter titles, the founder's publisher (Projector hub, The Gates of
Fear, The Mental Streams), HD and Me, Human Design Insight, GetHumanDesign, Satyori,
humandesignlife, and five teaching blogs on the Projector kinds, the earliest dated
2018. Ra's 2010 remark on determination is as one site quotes it, not read in the
original.

**Tests run**: module tests 529 of 529 (K54b new: signed out refusal, bounds, tally
body and parsing); RLS 101 of 101 across 10 runs (FS1 to FS8 new, and a run without
0018 that must fail five of them); competitor surface, prose repeats, dead controls,
violet text, atlas map (19 sections), layer boundary, token compare and chart tone all
clean. Driven in Chromium against a preview bundle at iPhone 13 and 1440x900: the study
chapter's intro, a Bright claim with no form, a field claim's form, both radios
checked at 44px, a note saved to the device with fit and charge apart, the tally
answering "could not be reached" with Supabase blocked, and the Projector folio with
its kinds, no page errors. **Not driven**: the signed in send, which needs a live
project with 0018.
