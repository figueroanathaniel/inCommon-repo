---
kind: verification
layer: mechanics
source:
  - "app/hd-wheel.js:32 at 1c02c7c (START, GATE_DEG, LINE_DEG)"
  - "app/arc-solver.js:80 at 1c02c7c (designMoment, arc 88)"
  - "app/inCommonApp v2.dc.html:16417 at 1c02c7c (mean node)"
  - "app/inCommonApp v2.dc.html:17189 at 1c02c7c (hdChart: Earth and South Node derived, type, authority, definition)"
verified: "secondary sources opened and read; no primary source yet; the tertiary not yet consulted"
status: disputed
---
# Tradition conventions

Task 4b of assignment 1.3. What the app assumes about the tradition, question by
question (C1 to C9 are the tertiary's question shapes, [[Tertiary log]]), with
what has been found so far. The original publisher is named only as "the
original publisher" here; the full citation goes in the pull request.

**Status of every row: not settled.** A convention counts as settled only once a
primary source (the original publisher's documentation, the founder's published
teaching, or published calculation software documentation) has been opened and
the passage read. None has been yet. The secondary sources below were opened and
read on 29 October 2026; each is a vendor or a third party and says so.

| Q | What the app does | Secondary sources read | Bearing |
|---|---|---|---|
| C1 design moment | 88 deg of solar arc before birth, solved ([[Design moment]]) | augurine.com chart tool: "a Design point 88 degrees of solar arc earlier", "roughly 88 days before you were born" | agrees |
| C2 wheel origin and widths | gate 41 line 1 at 302 deg, `WHEEL` order, 5.625 and 0.9375 deg ([[Gate and line]]) | SharpAstrology.HumanDesign README (open source library): "a line spans 56.25 arcminutes", "A color spans 9.375 arcminutes, a tone spans 93.75 arcseconds and a base spans 15.625 arcseconds" | line width agrees (56.25 arcmin is 0.9375 deg); origin and order not stated by any source read |
| C3 boundaries | an edge belongs to what begins there ([[Gate and line]]) | none found | the app's own decision, stated in hd-wheel.js |
| C4 the nodes | **mean** node, South Node opposite ([[Positions]]) | roxyapi.com Human Design guide (vendor): "RoxyAPI defaults to the true node, the value professional Human Design tools ... use"; "Some free chart calculators and general astrology tools use the mean node instead (Genetic Matrix lets you pick either)". augurine.com: "some use the mean node and some the true node" | leans against the app: [[D-06 Mean lunar node where the tradition may use the true node]] |
| C5 Earth | Sun plus 180 at both instants ([[Activations]]) | augurine.com lists "the Sun and Earth" among the thirteen; no offset stated | consistent, not confirmed |
| C6 zodiac and bodies | tropical, geocentric; thirteen per side ([[Activations]]) | augurine.com counts "thirteen bodies, the Sun and Earth, the Moon, both lunar nodes", and the eight other astral bodies | agrees on thirteen; the app makes fourteen ([[D-01 The South Node is activated twice]]) |
| C7 type | [[Type]] | none read | unconfirmed |
| C8 authority order, Ego split | [[Authority]] | none read; harness rows N1 to N8 hold the app's order | unconfirmed |
| C9 definition and profile | [[Definition]], [[Profile]] | none read | unconfirmed |

## What would settle each

Every row needs one primary citation, opened and read, recorded here with the
passage. The tertiary's answers to C1 to C9 ([[Tertiary log]]) are the intended
route; an answer counts only once its citation has been opened. C4 matters most:
it is the one convention whose answer changes a Type in this sample (89 of
2,000).
