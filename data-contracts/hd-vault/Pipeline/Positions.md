---
kind: pipeline
layer: mechanics
source:
  - "app/inCommonApp v2.dc.html:16010 at 1c02c7c (lonOf)"
  - "app/inCommonApp v2.dc.html:16028 at 1c02c7c (lonRaw)"
  - "app/inCommonApp v2.dc.html:16417 at 1c02c7c (meanLunarNodeOf)"
  - "app/lunar-mean-points.js:23 at 1c02c7c (elements, meanNode)"
  - "app/ephemeris-cache.js at 1c02c7c"
  - "app/inCommonApp v2.dc.html:15404 at 1c02c7c (PLNS)"
verified: "tools/check-astral-bodies.js against 19,750 JPL Horizons positions (ok, worst 0.0234 deg on the Moon); reconcile.js section g against Horizons osculating lunar elements"
status: checked
---
# Positions

Where each body stands at an instant `t` from [[Birth instant]] or
[[Design moment]]. Next: [[Gate and line]].

## The chain

`lonOf(name, t)` is the one entry point. When `ephemeris-cache.js` is loaded it
memoises by body and instant and asks `lonRaw()` on a miss; when it is not,
`lonOf` is `lonRaw`. Nothing is rounded on the way in.

| Body | Source in `lonRaw()` | Frame |
|---|---|---|
| Sun | `Astronomy.SunPosition(time).elon` | geocentric, apparent, ecliptic and true equinox of date, tropical |
| Moon | `Astronomy.EclipticGeoMoon(time).lon` | geocentric, apparent (no light time for the Moon), ecliptic of date, tropical |
| Mercury, Venus | `Astronomy.Ecliptic(Astronomy.GeoVector(name, time, true)).elon` | geocentric, aberration corrected, ecliptic of date |
| Mars to Pluto | the same call, read off a four day grid with cubic interpolation | as above; grid error under 0.0003 deg |
| North Node | `LunarMeanPoints.meanNode(t)`: Meeus mean node plus nutation in longitude | **mean** node, ecliptic and true equinox of date |
| South Node | North Node plus 180 | as above |

Earth is not asked for: it is the Sun plus 180, derived in [[Activations]].

With `window.Astronomy` missing (the boot gives up waiting after 50 tries),
`lonRaw()` answers from the old hand written series, which the gate measures at
up to 6.45 deg on Mars. A non finite `t` also takes the series and answers NaN.

## Measured

`node tools/check-astral-bodies.js` at 1c02c7c, against
`tools/fixtures/astral-bodies-horizons.json` (Horizons quantity 31, observer
500@399, UT, 1900 to 2100 every 37 days):

| Body | worst deg | rms deg |
|---|---|---|
| Sun | 0.0019 | 0.0005 |
| Moon | 0.0234 | 0.0065 |
| Mercury | 0.0045 | 0.0010 |
| Venus | 0.0053 | 0.0009 |
| Mars | 0.0035 | 0.0007 |
| Jupiter | 0.0028 | 0.0009 |
| Saturn | 0.0036 | 0.0012 |
| Uranus | 0.0033 | 0.0010 |
| Neptune | 0.0052 | 0.0030 |
| Pluto | 0.0024 | 0.0010 |

The gate also reports that 23 of 19,750 positions land in a different line from
Horizons, 2 of them in a different gate. That is a precision limit, not a failure:
see [[Astral body cross check]] and [[D-07 Positions on the wrong side of an edge]].

The lunar nodes are not in that fixture. The mean node is checked against the
Swiss Ephemeris mean node in `tools/fixtures/client-chart-swiss-reference.json`.
Whether the tradition uses the mean or the true node is open:
[[D-06 Mean lunar node where the tradition may use the true node]].

## Fields for the inspection panel (3.2 Task 3)

| Field | Type | Unit or form |
|---|---|---|
| ephemeris used | string | `astronomy-engine 2.1.19` or `fallback series` (whether `window.Astronomy` is present) |
| node convention | string | `mean` (LunarMeanPoints, Meeus) |
| each body's longitude, personality and design | number | degrees, 0 to 360, geocentric apparent ecliptic of date, tropical |
| frame | string | as above, one string for the chart |
