# Constructed points and integrated comets: mathematical specification

Validated October 26, 2026. Runtime span: January 1, 1900 through January 1,
2100, inclusive. The ten configured acceptance/regression groups pass. These
are sampled numerical checks with explicit conventions, not a guarantee of
correctness at every unsampled instant or interpretive boundary.

## Inputs and time

The app supplies `t = JD_UT − 2451545`. Civil birth time must first resolve to
UTC with its historical zone and daylight-saving rule. As with the existing
Swiss `calc_ut` comparison, the UTC Julian date is used as the UT argument;
no additional measured DUT1 correction is introduced by this change.

For orbital dynamics, `JD_TT = JD_UT + ΔT/86400`. Annual TT−UT compatibility
samples from Swiss 2.10.03 are stored separately in
`tools/fixtures/ut1-tt-reference.json`; linear interpolation supplies the same
explicit time convention to the independent models. This is time-scale metadata,
not a table of Swiss lunar or planetary positions. Future ΔT is modelled rather
than an already observed Earth-rotation measurement.

Production position/velocity vectors come from NASA's DE440s kernel. The
independent Swiss reference uses its JPLEPH backend with original NASA DE441
coefficients, downloaded by `tools/fetch-jpl-reference-kernel.py`. The numerical
comparison therefore also measures the small difference between those releases.
The original compressed Swiss references remain in the repository as a separate
diagnostic; they were not overwritten by a more favourable result.

## Mean lunar node and mean Black Moon Lilith

Let `T = (JD_TT − 2451545)/36525`, in Julian centuries. Angles below are degrees.
The secular mean node and mean perigee series are:

```
Ω = 125.0445479 − 1934.1362891 T + 0.0020754 T²
    + T³/467441 − T⁴/60616000
ϖ = 83.3532465 + 4069.0137287 T − 0.01032 T²
    − T³/80053 + T⁴/189990000
```

These are mathematical mean-element series, not a fit to the user's chart.
With mean inclination `i = 5.1453964°` and `u = ϖ + 180° − Ω`, project the
apogee from the inclined lunar orbital plane onto the ecliptic:

```
λmean_apogee = mod360(Ω + atan2(cos(i) sin(u), cos(u)) + Δψ)
λmean_north_node = mod360(Ω + Δψ)
λmean_south_node = mod360(λmean_north_node + 180°)
```

`atan2` is evaluated with radians and converted back to degrees. `Δψ` is the
nutation in longitude from the already vendored Astronomy Engine. Using `ϖ+180°`
as an ecliptic longitude directly was the missing projection in the former app.
Using UT directly in the secular series and omitting nutation were additional
sources of error.

The app's Selena convention is explicitly **opposite mean apogee**, so
`λSelena = mod360(λmean_apogee + 180°)`. It is labelled “Selena (Opposite Apogee)”
in the registry. This does not implement the separate seven-year hypothetical
Selena orbit supported by Swiss and some astrological traditions.

## Osculating Black Moon Lilith

Obtain the Moon's geocentric inertial state by subtracting Earth's barycentric
state from the Moon's. With position `r`, velocity `v`, and compatible units:

```
h = r × v
e = (v × h)/μ − r/|r|
a_apogee = −e/|e|
```

The adopted `μ = 398600.435436 + 4902.800066 km³/s²` is the combined Earth/Moon
gravity parameter. The builder converts this to AU³/day² because its state
vectors are AU and AU/day. An explicit ecliptic-of-date rotation maps the apogee
direction to `(x,y,z)`; longitude is `mod360(atan2(y,x) + Δψ)`. This point is
an osculating two-body construct of the integrated lunar state, not the mean
apogee and not a second physical Moon.

The application evaluates a dated angular interpolation of these vector-derived
positions. It no longer substitutes a mean point or reports osculating Lilith as
permanently unavailable.

## Geometric planetary ascending nodes

For each planet, use its heliocentric state at the requested epoch:
`r = rplanet − rSun` and `v = vplanet − vSun`. Rotate both vectors by the
same fixed-at-that-instant orientation; do not add the coordinate frame's daily
precession rate to the physical velocity. In the adopted ecliptic frame:

```
h = r × v
n = k × h = (−hy, hx, 0), where k = (0,0,1)
λascending_node = mod360(atan2(ny,nx) + Δψ)
```

The constructed-point orientation is recorded explicitly in the builder as
`Q = ecm06(JD_TT) B06`, using ERFA's IAU 2006 ecliptic matrix and dynamical-J2000
frame-bias matrix. This reproduces the declared Swiss constructed-point frame;
it is not a degree correction fitted separately for each planet or birth.

The canonical independent comparison is:

```
swe.nod_aps_ut(JD_UT, planet, swe.NODBIT_OSCU,
               swe.FLG_JPLEPH | swe.FLG_HELCTR | swe.FLG_TRUEPOS)[0][0]
```

**Why TRUEPOS matters:** a node is a constructed orbital-plane intersection.
The previous query omitted this flag and applied apparent-light corrections to
that constructed point. Its largest differences clustered around solar
conjunctions of the node. The geometric definition makes the intended calculation
explicit. The old apparent-node convention remains a different reproducible
choice; it is not silently relabelled as geometric.

Two changes in the reference configuration are therefore explicit: geometric
rather than apparent constructed nodes, and original JPL coefficients rather
than compressed Swiss files. Original compressed/apparent comparisons still
show sampled differences up to 4.38″ for nodes and 1.56″ for osculating Lilith.
Those results remain diagnostic output in `check-client-derived-points.js`.

## Halley and Hale-Bopp

Both now use dated integrated Horizons observer longitudes. Counts below exclude
duplicate epochs and exclude holdouts that coincide with a finer patch’s support
point; every retained comet test is off the selected composite grid. The settings are
Earth geocenter `500@399`, observer quantity 31, UT, apparent tropical ecliptic
of date. The target commands and complete source headers are stored with the
independent references. The old static two-body constants no longer supply live
positions.

A seven-day broad grid is supplemented by daily grids and hourly grids near
fast passages. Hale-Bopp requires an hourly patch around the ecliptic-pole
longitude swing in 1998, plus daily coverage into 2006. Halley's hourly patches
cover its 1910, 1986 and predicted 2061 passages. Requests are sequential and
cached by the fetcher.

For a uniform angular grid, unwrap neighbouring values around the central
sample. For fractional interval `u` and samples at `−1,0,1,2`, interpolate:

```
L(u) = −u(u−1)(u−2)L−1/6
       +(u+1)(u−1)(u−2)L0/2
       −(u+1)u(u−2)L1/2
       +(u+1)u(u−1)L2/6
```

Normalize only the final longitude. Select the finest available grid that has
all four supporting samples. Reject nonfinite inputs, missing modules, unknown
bodies and out-of-span dates; do not extrapolate or reinstate a coarse fallback.

## Measured results

| Calculation | Independent verification | Largest measured longitude difference |
|---|---|---:|
| Mean Lilith | 2,050 Swiss dates, 1900–2100 | 0.700″ |
| Mean lunar node | Same independent dates | 0.298″ |
| Osculating Lilith | Same dates, Swiss direct-JPL mode | 0.554″ |
| Eight geometric planetary nodes | Same dates, explicit TRUEPOS convention | 0.107″ |
| Halley | 39,387 off-grid Horizons samples | 0.850″ |
| Hale-Bopp | 22,283 off-grid Horizons samples | 0.487″ |

Separately, every grid midpoint was compared with directly evaluated JPL vectors:
292,196 lunar-apogee midpoints (maximum interpolation difference 0.287″) and
146,096 planetary-node midpoints (maximum 0.095″). These interpolation measurements
are separate from the independent Swiss agreement figures above.

Formal orbital covariance is also separate. Horizons did not report a formal
uncertainty for the stored Halley reference samples. This does not mean zero
uncertainty. The UI retains its conservative comet degree-symbol restriction.
Nominal ephemeris agreement cannot establish an absolute physical error bound.

## House rule and boundary implications

For longitude `λ` and Ascendant `a`:

```
d = ((λ − a) mod 360 + 360) mod 360
house = 1 + floor(d/30)
```

A cusp belongs to the house beginning there. This is Ascendant-anchored Equal
House, not Whole Sign. With justified longitude and Ascendant error bounds
`eλ` and `ea`, a house assignment is secure only when its distance to the nearest
cusp is greater than `eλ + ea`. Similar interval logic applies to signs, gates
and lines. Sampled error maxima alone do not prove a universal bound.

## Verification and scope

Run `node tools/check-client-accuracy.js --json reports/client-accuracy-results.json`.
All ten configured gates pass locally. Tests exercise the live class dispatcher,
including missing modules and rejected dates. A daily GitHub workflow is included;
its scheduled execution starts only when merged into the default branch.

The canonical app now uses these replacements. The older optional router and
TypeScript scaffolding are not the source of its live positions and are not
certified by this change. Existing primary/minor-body approximation limits and
minor-body partition disagreements remain on the accuracy watchlist. No production
bundle or live-site deployment is certified by source-level acceptance.

Sources: NASA/JPL DE440s and DE441 kernels; Horizons observer quantity definitions
at https://ssd.jpl.nasa.gov/horizons/manual.html; Swiss conventions at
https://www.astro.com/swisseph/swisseph.htm sections 2.2 and 6.4; ERFA/SOFA
IAU frame transformations; Meeus secular lunar-element series.
