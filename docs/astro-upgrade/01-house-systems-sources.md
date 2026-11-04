# House systems: sources and checks

Written 4 November 2026 for the Astropedia's House Systems chapter and the
house system switch (`app/house-systems.js`).

## The arithmetic

Every system in `app/house-systems.js` is held to the Swiss Ephemeris 2.10.03
(pyswisseph, `swe_houses_armc_ex2`) over 384 sky frames, 16 latitudes from
75 S to 78.2 N by 24 sidereal times, by rows HS1 to HS9 in
`tools/run-module-tests.js`. The fixture is
`tools/fixtures/house-systems-swiss.json`, made by
`tools/generate-house-systems-reference.py`. Swiss Ephemeris is a test
reference only and is not loaded by the app.

| System | Worst difference from Swiss |
|---|---|
| Whole Sign, Equal, Porphyry, Koch, Regiomontanus, Campanus, Alcabitius, Topocentric | about 1e-10 degrees |
| Morinus, Meridian | about 1e-13 degrees |
| Placidus | 8e-7 degrees (both sides iterate) |

Three conventions were taken from Swiss rather than invented, and each was
measured before it was adopted:

- Inside the polar circle (latitude at or beyond 90 less the obliquity)
  Placidus and Koch are not computed and Porphyry is drawn. `cusps()` returns
  `fallback: true` and `asked` names the system that was asked for.
- Regiomontanus, Campanus and Topocentric take the lower meridian crossing as
  the tenth cusp when the Midheaven degree stands below the horizon, which only
  happens inside the polar circle; Regiomontanus and Topocentric turn their
  intermediate cusps with it.
- An Ascendant exactly on a sign boundary starts Whole Sign at that sign.

## The writing

Origins in `app/astropedia.js` HOUSE_SYSTEMS were read from two pages on
4 November 2026:

- Astrodienst, Overview house systems:
  https://www.astro.com/cgi/xa.cgi/faq/fq_fh_owhouse_e.htm
- Skyscript glossary, House division:
  https://www.skyscript.co.uk/glossary/house-division

Where they disagree the entry says so: Porphyry (Porphyry of the third century
on Astrodienst, Vettius Valens on Skyscript), Alcabitius (Skyscript: popularised
rather than invented by al Qabisi, a chart of 428), Koch (time oriented on
Astrodienst, space based on Skyscript). "Most used in Western astrology today"
for Placidus is Skyscript's claim alone. Morinus and Meridian rest on
Astrodienst alone. Sentences about how each system cuts the sky were checked
against the arithmetic above (for example, the Midheaven is the tenth cusp in
Meridian and not in Morinus).

Not yet researched: which systems each tradition mode should lead with
(Vedic, Hellenistic, medieval, modern), for the tradition modes Nate approved.
