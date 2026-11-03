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
| Manifesting Generator share | about 11 percent | about 33 percent | the five shares summed to 80; the app's own 2,000-birth sample gives 692 of 2,000 (34.6%) |
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
6. **Generator share.** 65% (dictionary) or almost 70% (statistics). Written as two thirds to seven tenths.
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

- **Group terms** (the three-to-five person group aura, the larger work group, and
  the business and career system). Their names are barred marks in
  `tools/check-competitor-surface.js`. A decision for the owner: describe them
  without the names, or leave them out.
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
