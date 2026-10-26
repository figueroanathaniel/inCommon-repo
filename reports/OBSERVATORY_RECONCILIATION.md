# Observatory placement reconciliation

Reference instant: **1994-02-17 05:37:00 UTC**. Edison angles use approximately
40.51872° N, 74.4121° W. The submitted snapshot has 97 rows, including
angles, a missing osculating Lilith, and derived points; it is not a list of
97 independently observed objects.

`observatory-1994-reconciled.tsv` is generated with
`node tools/export-observatory-reconciliation.js`. The submitted text stays
unchanged in `tools/fixtures/submitted-observatory-manifest.tsv`. Dated reference
degrees and their sources are in `tools/fixtures/observatory-1994-reference.json`.

The 66 JPL rows are ten primary bodies, 53 numbered minor bodies, and three
comets. They use Horizons apparent geocentric tropical ecliptic longitude of
date, observer 500@399, quantity 31, and the explicit UTC instant. The three
comets use 1P/Halley solution #75, C/1995 O1 solution #226, and C/1996 B2
solution #73 from the source audit. The eight Swiss rows are the defined
Hamburg hypothetical orbits, not physically observed JPL bodies. Four angles
are Swiss geometry. Six derived points are defined from those coordinates:
Aries Point = 0°, Sun/Moon midpoint on the shorter arc, Vertex from Swiss
`houses_ex` (index 3), Antivertex = Vertex + 180°, and the nocturnal lots
Fortune = Asc + Sun − Moon and Spirit = Asc + Moon − Sun (modulo 360°).
Swiss mean lunar apogee supplies Lilith (Mean); Selena follows the manifest's
opposite-apogee convention. The last eleven now have **explicit conventions**:

- The eight planetary nodes are *heliocentric osculating ascending nodes of
  date*, calculated with `swe.nod_aps_ut(jd, planet, swe.NODBIT_OSCU,
  swe.FLG_SWIEPH | swe.FLG_HELCTR)[0][0]`. These are mathematically defined
  orbital points. Other legitimate definitions, including the app's
  approximate J2000 elements and Swiss mean and geocentric nodes, yield
  different numbers. Pluto has no Swiss VSOP87 mean-node series, so using
  osculating nodes for all eight also avoids mixing methods.
- North Node is `swe.calc_ut(jd, swe.MEAN_NODE, swe.FLG_SWIEPH)[0][0]`;
  South Node is 180° opposite. The manifest and app's earlier North Node
  lie near this *mean* convention, rather than the considerably different
  true-node value.
- Lilith (Osculating) is `swe.calc_ut(jd, swe.OSCU_APOG,
  swe.FLG_SWIEPH)[0][0]`. It is distinct from both mean Lilith and Swiss's
  interpolated/natural apogee.

These choices produce **97 dated or explicitly defined reference coordinates
for 97 rows**. They do not extend the sub-arcsecond Swiss/Horizons body
comparison to constructed nodes, nor do they imply all schools of astrology
use the same node. Displaying a reference
to the nearest second is formatting, not a claim of one-second physical orbit
uncertainty.

Equal House uses the full precision Ascendant `a = 232.66274023598433°`:

`house(λ) = 1 + floor(mod(λ − a, 360°) / 30°)`.

The export keeps three separate facts: the submitted house label, the house
computed from the submitted longitude, and the house computed from the dated
reference. Karma's submitted 20° Capricorn is in house 2, although its old
label said house 3; the verified 28° Capricorn is in house 3. Tyche's verified
house is 6. Hyakutake moves from the submitted Pisces house 4 to Scorpio
house 12. The selected Swiss Mars Node is in house 6. The selected Swiss
Venus Node is in Gemini, house 7; the manifest's Cancer, house 8 reading
is a sign-level discrepancy and the app's older approximation also puts
it in Gemini. Osculating Lilith is in Aries, house 6; the original had no
number for it.

| Newly resolved point | Selected Swiss longitude | Equal House |
|---|---|---:|
| Mercury Node | 18°15′56″ Taurus | 6 |
| Mars Node | 19°31′03″ Taurus | 6 |
| Uranus Node | 14°01′28″ Gemini | 7 |
| Venus Node | 16°37′48″ Gemini | 7 |
| Jupiter Node | 10°25′27″ Cancer | 8 |
| Pluto Node | 20°15′38″ Cancer | 8 |
| Saturn Node | 23°36′05″ Cancer | 9 |
| Neptune Node | 11°41′49″ Leo | 9 |
| North Node (mean) | 28°35′45″ Scorpio | 1 |
| South Node (mean) | 28°35′45″ Taurus | 7 |
| Lilith (osculating apogee) | 27°43′42″ Aries | 6 |

The app's generic offline minor-body model is still an approximation for
dates other than this audit instant. Quaoar now includes a Horizons osculating
elements row at this epoch: it is within 0.08″ of the direct natal Horizons
longitude, while the full sampled 1900–2100 model still carries a 0.046°
worst-case bound. Dejanira, Karma, and Damocles were already within 3″ at
this instant. The app's primary astronomy-engine values differ by a few
arcseconds from the direct JPL observer output. Neither this report nor its
fixture silently substitutes personal birth coordinates into other charts.
The app still uses its older approximate planetary-node formula for live
charts and does not render osculating Lilith; this dated reconciliation is
the source of the eleven newly defined birth-snapshot values. A general
runtime replacement needs an ephemeris with the same selected conventions
over its supported date range.

## Client Lilith acceptance check

The broader ongoing audit, polar Ascendant repair and repeatable combined run
are documented in `reports/CLIENT_CALCULATOR_ACCURACY.md`.

`node tools/check-client-lilith.js` checks eight independent UTC instants from
1975 through 2026 against Swiss Ephemeris 2.10.03 reference values for mean
and osculating lunar apogee. It deliberately exits nonzero while the live
calculator cannot justify a seconds-precise Black Moon Lilith placement. On
the current code, mean Lilith misses the Swiss reference by 197.6–411.6
arcseconds (3.3–6.9 arcminutes); the live app labels it `ok`. Osculating
Lilith has no live longitude. At those same instants the two mathematically
distinct Lilith variants differ by 1.736–26.451 degrees. These are different
charts' UTC instants, not a general error bound over all dates or locations.
The checks must pass against the actual runtime calculator before calling
either variant verified for client readings. A natal Swiss value in this
report is not an implementation for arbitrary births.

Swiss definition reference: https://www.astro.com/swisseph/swisseph.htm,
sections 2.2.1–2.2.5. NASA's fitted planetary-element tables explicitly
are not a mean theory: https://ssd.jpl.nasa.gov/planets/approx_pos.html.

Run `node tools/check-observatory-reconciliation.js`,
`node tools/check-minor-body-elements.js`, and
`node tools/check-hyakutake-jpl.js` after changing the orbital rows or export.
