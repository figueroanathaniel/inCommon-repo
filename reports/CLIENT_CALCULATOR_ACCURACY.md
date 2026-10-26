# Client calculator accuracy watchlist

Updated October 26, 2026. The ten configured acceptance/regression groups pass
locally after the lunar-point, node and comet replacements. Run:

```sh
node tools/check-client-accuracy.js --json reports/client-accuracy-results.json
```

The six-group runner `check-calculator-regressions.js` remains available. The full
runner adds the Lilith, constructed-point and comet checks. Neither treats a
failure as an expected pass. See `PRECISION_POINT_MATH.md` for equations, source
settings and measured limits.

## Repaired calculations

| Calculation | Current implementation and evidence |
|---|---|
| Mean Lilith and opposite-apogee Selena | Inclined-orbit projection, TT and nutation; 2,050 independent dates; maximum 0.700″. Selena's chosen definition is explicit in its UI name. |
| Mean lunar North and South Nodes | TT-based secular elements plus nutation; maximum 0.298″ against independent references. |
| Osculating Lilith | JPL lunar position/velocity geometry, dated interpolation; available within 1900–2100; maximum 0.554″ against Swiss direct-JPL references. |
| Eight planetary ascending nodes | Geometric heliocentric osculating nodes in the declared Swiss constructed-point frame; maximum 0.107″ over independent full-kernel references. |
| Halley and Hale-Bopp | Integrated Horizons observer tables replace the static solvers; 61,670 independent off-grid comparisons, maxima 0.850″ and 0.487″. Formal orbit uncertainty remains separate. |
| Polar Ascendant and day/night sect | Earlier merged repair retained; 72 charts, 1,764 house-edge checks and 144 lot-formula checks pass. |
| Canvas/astronomy frame collision | Separate chartSkyFrame helper retained. |

The new node comparison explicitly uses TRUEPOS: a geometric orbital-plane
intersection, without apparent-light corrections. Swiss is run on original JPL
DE441 coefficients for that independent reference. The previous compressed/apparent
results remain in `precision-point-swiss-compressed.json` and diagnostic output.
They still show differences up to 4.38″ for nodes and 1.56″ for osculating Lilith;
they are not counted as matching geometric references. This distinction resolves
the definition/source mismatch without widening the one-arcsecond acceptance test.

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

## Repeatable checks

The full suite retains primary-body and minor-body reference checks, the independent
angle suite, original natal anchors, timezone/shared-module tests and the 97-row
snapshot reconciliation. New tests exercise the actual live dispatcher over
2,050 independent point dates and 61,670 off-grid comet samples. Missing data and
out-of-span inputs return unavailable.

The existing primary-body tolerance is 0.03° and minor-body regression ceiling
0.2°; passing them does not imply one-arcsecond precision. Minor-body errors and
partition disagreements above remain real. Runtime uncertainty propagation for
all interpretive boundaries remains pending.

The Calculator accuracy workflow runs the complete suite on relevant PRs,
manually and daily after merge; Calculator regressions retains the six earlier
checks. Both preserve outputs. Source verification does not verify a deployed
bundle or live service.
