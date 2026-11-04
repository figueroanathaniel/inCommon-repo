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

## Everything in this branch that rests on my knowledge, not on a source read

Written openly at the owner's request. None of these has been approved by the owner
or checked by a Human Design reviewer.

1. **The Penta's six channels**, 2-14, 5-15, 29-46, 1-8, 7-31 and 13-33. The source says Sacral, G and Throat only. The topology also joins the G to the Throat by 10-20, which the entry leaves out on the strength of knowledge alone.
2. **Gap**: that whoever arrives to fill a gap is pulled into that role.
3. **Cross of Planning** dated 1615 to 2027, and the Cross of the Sleeping Phoenix after it.
4. **The four Quarters'** gates and themes.
5. **Stream gate sequences** for the Spleen and the Ajna, and the Solar Plexus tribal and individual streams. Only 41-30-36-35 was confirmed.
6. **Minor authority definitions** (ego manifested, ego projected, self-projected, mental, lunar): from the vault's derivation rule, not a page read.
7. **Determination's left and right pairing.**
8. **Energy, mental and classic Projector**, written as teachers' terms.
9. **Splenic fears, Ajna anxieties, Solar Plexus nervousness.**
10. **Exaltation and detriment** entry.
11. **Sacral sounds**, rising for yes and falling for no.
12. **Single source**: the base count of five, the Alpha, the Uranus opposition at 38 to 44.
