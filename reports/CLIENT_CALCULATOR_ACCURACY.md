# Client calculator accuracy watchlist

Run all checks with:

```sh
node tools/check-calculator-regressions.js --json reports/calculator-regression-results.json
```

This command runs the six independently mergeable regression groups, continues
after a failure and exits nonzero if any included group fails. The separate
full acceptance runner and the known-failing Lilith/node/comet checks remain
in draft PR #86. They have not been repaired or reclassified as passing. The descriptive boundary audit is reported
separately. Known failures remain failures. A passing regression means the model
still meets its stated sampled tolerance, not that every printed arcsecond or
interpretive partition is correct. No change in this audit certifies astrology's
interpretive claims.

## Isolated problems and inherited effects

| Calculation | Measured finding | Effect and disposition |
|---|---|---|
| Eight planetary ascending nodes | Sampled maximum differences from the selected Swiss heliocentric osculating convention: Mercury 21.2′, Venus 18.9′, Mars 16.6′, Jupiter 16.4′, Saturn 20.9′, Uranus 25.8′, Neptune 24.2′, Pluto 24.1′ | The live formulas are approximate J2000 orbital parameters, so this includes a definition/frame mismatch. Explicit acceptance failure until the runtime implements the selected date-general convention. |
| Mean lunar North and South Nodes | Up to 18.1″ from Swiss mean node in eight sampled dates | Small compared with the planetary-node gaps, but can change a partition arbitrarily close to its edge. Both live formulas are checked. |
| Mean Black Moon Lilith | 197.6 to 411.6″ (3.3 to 6.9′) from Swiss in eight dates | Live dispatcher is tested; its `ok` label does not justify seconds precision. Acceptance fails. |
| Selena | Inherits mean Lilith's error under this app's opposite-apogee convention | Same eight-date reference check. This convention is explicit; it is not a universal definition of Selena. |
| Osculating Black Moon Lilith | Unavailable at all eight reference dates | Actual dispatcher is exercised. Mean Lilith cannot substitute for it. Acceptance fails. |
| Halley | Static two-body solver misses the 1994 JPL reference by 0.1826° (11.0′) | Acceptance fails; additional independent comet epochs and an integrated runtime replacement are still needed. |
| Hale-Bopp | Static two-body solver misses the 1994 JPL reference by 0.2313° (13.9′) | Same repair requirement as Halley. One natal comparison is not a multi-year error bound. |
| High-latitude Ascendant | Before repair, 4 of the initial 64 location/date cases selected the opposite horizon point, nearly 180° from Swiss | Repaired by selecting the eastern crossing from hour angle. Current 72-case suite includes both polar regions and is within 0.451″. Houses and dependent lots now use that corrected Ascendant. |
| Day/night sect and Fortune/Spirit | Selecting the correct polar Ascendant requires computing actual above/below-horizon geometry instead of assuming the same zodiac semicircle orientation | Repaired for the live angle context. 72 sect checks and 144 lot-formula checks pass, using reference Sun/Moon longitudes. This tests lot geometry separately from solar/lunar ephemeris error. |
| Canvas and astronomy frame name collision | Both methods were named `skyFrame`; JavaScript used the final declaration | Renamed the astronomical method `chartSkyFrame`, including the East Point caller. The angle gate guards against reintroducing the collision. |
| Minor-body model near partition edges | Across 24,644 sampled positions: 9 sign differences, 14 gate differences, 115 gate/line differences | These samples were also used in fitting. They describe observed disagreements and are not an independent holdout bound. The boundary audit reruns and records the affected bodies. |
| Missing astronomy modules | Core Astronomy Engine is already required by `modulesReady()` and precached; older fallback models remain in code | The existing primary-body gate tests these load safeguards and proves the coarse fallback fails the reference tolerance. This audit does not assume a missing module is a normal accepted chart. Expanded-body fallback precision still requires explicit runtime handling. |

## Minor bodies requiring closest monitoring

The largest observed errors in the stored fitting-reference sample are Apollo
7.673′, Diana 5.549′, Dejanira 5.274′, Hylonome 5.017′, Proserpina 4.298′,
Nemesis 4.218′, Chariklo 3.958′, and Metis 3.949′. Monitor the other bodies as
well: smaller errors also cross boundaries when the longitude is close enough.
Hygiea and Juno remain in the audit despite their historical text anomalies;
their current sampled maxima are about 2.50′ and 3.49′. Quaoar's natal patch
does not remove its roughly 2.77′ sampled maximum elsewhere.

For Equal House, the implemented rule is

`h(λ, a) = 1 + floor(mod(λ − a, 360) / 30)`.

A cusp belongs to the house beginning there. The angle suite checks 1,764
edge cases with independent expected house numbers, including exactly
representable cusp values. If the errors in longitude and Ascendant have
justified bounds `eλ` and `ea`, classification can only be guaranteed when
the distance to the nearest cusp exceeds `eλ + ea`. A sampled maximum by
itself is not a proven bound at every unsampled moment. The same interval
logic applies to sign, degree, gate and line boundaries. Runtime uncertainty
propagation and suppression of ambiguous interpretations are still pending.

## Checks and execution

- Ten primary bodies: 19,750 stored Horizons positions, with a 0.03° model
  tolerance, plus interpolation and module-load safeguards. This is deliberately
  a different precision tier from the one-arcsecond angle/constructed-point
  acceptance target.
- Sixty-one minor bodies and defined hypothetical orbits: 24,644 references,
  per-body recorded sample maxima and date-span checks. The overall regression
  ceiling is 0.2°, not a claim that all bodies miss by that amount.
- Hyakutake: dated integrated JPL interpolation, four independent epoch checks,
  and rejection outside the supported table span. Orbital uncertainty and
  interpolation error remain separate quantities.
- ASC, MC and Vertex: eight instants from 1975 to 2026 at nine places, including
  Ecuador, Kenya, Nepal, Australia and both polar regions. Observed maxima are
  0.4502″ ASC, 0.1305″ MC and 0.3298″ Vertex. These are sample results, not a
  global guarantee at a geometric singularity or every historical birth.
- Constructed nodes and Lilith: reproducible Swiss 2.10.03 fixtures from
  `tools/generate-client-swiss-reference.py`. The generator refuses a Moshier
  fallback for osculating apogee. The app does not bundle Swiss Ephemeris.
- Timezone and shared modules: the existing regression suite, including
  historical offset changes and fractional-hour offsets.
- Dated 97-row reconciliation: retained as a snapshot integrity check.

The GitHub workflow `.github/workflows/calculator-regressions.yml` is prepared
for relevant pull requests, manual execution and a daily 08:17 UTC schedule.
Each run saves the six regression-group outputs and the descriptive boundary
audit, including failures. It does not run the two unresolved acceptance groups
retained in draft PR #86. Scheduled execution only
becomes active after the workflow reaches the repository's default branch;
local preparation does not activate background execution or publish changes.

The next runtime repair should replace the planetary-node conventions and lunar
points, followed by the remaining comet solvers. Each replacement must pass
independent epochs and preserve explicit conventions. The client-precision gate
currently remains red even though the ordinary model regression gates pass.

Swiss geometry/convention source: https://www.astro.com/swisseph/swisseph.htm,
particularly sections 2.2 and 6.4.
