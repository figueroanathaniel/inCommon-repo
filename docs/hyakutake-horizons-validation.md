# Hyakutake longitude source and limits

The live expanded chart uses `app/comet-hyakutake-jpl.js` for C/1996 B2.
`tools/build-hyakutake-jpl.py` regenerates its four nested grids from the
NASA/JPL Horizons API. The target command is `DES=1996 B2;CAP <1997;NOFRAG`,
solution JPL#73 (977 observations over 306 days), observer Earth geocenter
`500@399`, observer quantity 31, apparent IAU76/80 ecliptic of date, UTC.
The module uses cubic interpolation over four neighboring samples and returns
null outside its measured span. The old single-epoch Kepler model is not a
fallback for this comet.

| Grid | Dates | Cadence | Samples |
| --- | --- | --- | ---: |
| Long | 1900-01-01 to 2100-01-01 | 7 days | 10,436 |
| Near | 1993-01-01 to 1999-01-01 | 1 day | 2,192 |
| Close spring passage | 1996-03-01 to 1996-05-01 | 1 hour | 1,465 |
| Rapid summer movement | 1996-06-01 to 1996-08-01 | 1 hour | 1,465 |

Independent Horizons positions at the midpoint of each grid interval were
compared with the composed runtime lookup: maxima were 0.7662 arcsecond for
the seven-day midpoints, 0.8649 arcsecond for daily midpoints, 0.0448
arcsecond for spring half-hour points, and 0.0039 arcsecond for summer
half-hour points. This is an empirical check at sampled instants, not a proof
of a global bound between them. A separate fixture checks four non-grid
dates across 1994, 1995, 1996, and 1997.

At 1994-02-17 05:37 UTC, Horizons reports 213.6183769 degrees (Scorpio
3 degrees 37 minutes 06.157 seconds), ecliptic latitude -26.8218947 degrees,
and a formal 3-sigma plane-of-sky radius of 0.665 arcsecond. The table's
interpolation at that instant differs from Horizons by 0.00022 arcsecond.
With Ascendant 232.66274023598433 degrees the equal house is 12. Formal
orbit covariance and interpolation error are different quantities; the
reported digits of the nominal JPL position are not an absolute physical
certainty. The 3-sigma radius is not a guarantee against model systematics.

The retired live constants implied a perihelion distance of 0.064225 AU and
argument of perihelion 20.5 degrees. Horizons #73 gives 0.230223531 AU and
130.175121 degrees. `app/ephemeris/cometElements.ts` now carries the JPL
values for its approximate TypeScript solver, while the browser runtime uses
the dated table.

Regenerate from a machine with Horizons access:

```sh
python3 tools/build-hyakutake-jpl.py
node tools/check-hyakutake-jpl.js
```

Horizons manual: https://ssd.jpl.nasa.gov/horizons/manual.html
