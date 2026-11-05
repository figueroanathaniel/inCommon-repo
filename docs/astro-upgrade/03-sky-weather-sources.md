# Sky weather and the star clusters: what was read, and what was built

Asked for by the owner on 5 November 2026: "create a weather forecast that
reflects events like cazimis, moon phases, retrogrades, meteor showers, unique
planetary alignments (alignments with clusters too. Add clusters to the bodies
and Astropedia too.). Must be forecasted one day minimum in advance. Place the
Weather in a weather icon in the top right corner of the horoscope on the Today
tab for now." The layout half of that message ("look nothing like" newer AI
websites) belongs to the four themes work and is not in this change.

Every rule is listed with the page it was read on. Nothing here was filled from
memory. "Clusters" was read as star clusters, because the same sentence asks
for them to sit among the bodies and in the Astropedia.

## What the forecast holds

`app/sky-weather.js` (mechanics, global `SkyWeather`) reads astronomy-engine
2.1.19 and returns dated events. It reads no clock: the app hands it the window.
The window starts at the start of tomorrow, local, and runs thirty days, so
nothing is ever forecast for less than a day ahead.

| Kind | Rule | Source |
|---|---|---|
| Moon phase | the four quarters, `SearchMoonQuarter` | astronomy-engine |
| Eclipse | solar and lunar, `SearchGlobalSolarEclipse`, `SearchLunarEclipse` | astronomy-engine |
| Station | Mercury to Pluto, the instant the geocentric longitude turns | astronomy-engine |
| Cazimi | within 17' of the Sun in longitude; the sheet says when the latitude is also inside 16' | below |
| Conjunction | two of Mercury to Pluto meet in longitude; the Moon with any of them within 4 degrees | astronomy-engine |
| Gathering | three or more of the planets inside 10 degrees | astronomy-engine |
| Cluster | the Moon or a planet within 6 degrees of a cluster, at the closest | below |
| Meteor shower | the instant the Sun reaches the shower's solar longitude of maximum (J2000) | below |

### Cazimi, combust, under the beams

| Claim | Source | Kind |
|---|---|---|
| "if the planet is within 17 minutes of the Sun, it is termed Cazimi" | https://www.skyscript.co.uk/glossary/under-the-suns-beams | secondary |
| Lilly, horary volume p. 300: "when a Planet is within 16 minutes of the Sun, he is said to be in Cazimi" | same page, quoting Lilly | primary, quoted |
| Lilly's Introduction: combust within 8 degrees 30', under the beams from there to 17 degrees | same page | primary, quoted |
| Bonatti: "16' or less between them, both by latitude and longitude (which rarely happens)" (Dykes) | https://www.goodreads.com/author_blog_posts/21489114-when-is-a-planet-really-cazimi (Anthony Louis) | primary, quoted by a secondary |

The sources disagree on 16 or 17 minutes and on whether latitude counts. The
forecast uses Lilly's 17 in longitude, which is the figure most readers will
meet, and says in the sheet when the body is inside Bonatti's 16' in latitude
as well.

### The star clusters

Positions, J2000, from each page's infobox: the Pleiades (3h 46m 38.0s,
+24 10' 41"), https://en.wikipedia.org/wiki/Pleiades; the Hyades (4h 27m,
+15 52'), https://en.wikipedia.org/wiki/Hyades_(star_cluster); Praesepe
(8h 40.4m, +19 59'), https://en.wikipedia.org/wiki/Beehive_Cluster; the Coma
Star Cluster (12h 22.5m, +25 51'), https://en.wikipedia.org/wiki/Coma_Star_Cluster;
the Double Cluster (2h 20m, +57 08'), https://en.wikipedia.org/wiki/Double_Cluster.
Each is carried to the ecliptic of the date by astronomy-engine, so precession
is applied rather than assumed.

Natures, from Ptolemy, Tetrabiblos I.9, Robbins (Loeb, 1940):
https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Ptolemy/Tetrabiblos/1B*.html

| Cluster | Ptolemy's words |
|---|---|
| Pleiades | "those in the Pleiades, like those of the moon and Jupiter" |
| Hyades | "the one of the Hyades that is bright and somewhat reddish, called the Torch, has a temperature like that of Mars; the others, like that of Saturn and moderately like that of Mercury" |
| Praesepe | "the cloud-like cluster in the breast, called the Manger, the same as Mars and the moon" |
| Coma | "the cluster of the Coma Berenices beneath the Bear's tail, to that of the moon and Venus" |
| Double Cluster | "the cluster in the hilt of the sword, of Mars and Mercury" |

Ptolemy does not name the Double Cluster. Wikipedia says it "represents the
jeweled handle of his sword", so the identification is the page's and ours,
not Ptolemy's. Lore on the placement pages is held to sentences the pages
carry: the Pleiades as seven sisters of whom six are seen, the season of
navigation, and "Around 2330 BC the Pleiades marked the vernal point"; the
Manger and the two donkeys and the Ghost, the 23rd lunar mansion, for
Praesepe; Hipparchus's "patch of light in Perseus" in 130 BCE for the Double
Cluster.

### Meteor showers

The solar longitude of maximum is read from the International Meteor
Organization's calendars. `src` in the module says which: `c24`, `c25` and
`c26` are the shower sections of the 2024, 2025 and 2026 calendars
(https://www.imo.net/files/meteor-shower/cal2024.pdf, cal2025.pdf,
cal2026.pdf). `t` is Table 5 of the 2025 calendar, which was only ever read
through a summary of the PDF, because the verbatim text stopped before the
table: the Southern and Northern Taurids, the Leonids and the Ursids. Those
four are held to the dates IMO's 2026 calendar gives for their maxima (row
SW3), so a wrong figure goes red. The ZHR on the sheet is IMO's, and the Moon's
lit fraction at the maximum is computed.

## How it is held

`tools/check-sky-weather.js`, rows SW1 to SW5:

- SW1: every event the Swiss Ephemeris (2.10.03, Moshier, through a small C
  program against the pyswisseph source) finds in 2026 and 2027, 352 of them
  in `tools/fixtures/sky-weather-swiss.json`, is found by the module, and the
  other way round. Measured: phases 0.7 minutes at worst, stations 39.8
  minutes, cazimi 4.9, planet meetings 6.3 (the slowest pair within 19.6" of
  each other at the reference instant), Moon meetings 0.8, showers 0.7.
- SW2: the moon phases from November 2026 to January 2027 against the US Naval
  Observatory,
  https://aa.usno.navy.mil/calculated/moon/phases?date=2026-11-01&nump=16&format=t,
  worst 1.25 minutes.
- SW3: the 2026 maxima on IMO's dates.
- SW4: the Pleiades at 59.8 degrees at J2000, and every cluster moving about
  50" a year.
- SW5: cazimi windows are well formed, and the module computes with the clock
  broken.
- SW6: planet parades seen from Kielder match the observatory's list (above).

Sabotaged once: moving the Perseids to 141 degrees and biasing the station
speed turned SW1 and SW3 red.

Retrograde stations have no outside reference but the Swiss Ephemeris:
timeanddate.com and in-the-sky.org refused the fetch.

## Planet parades

Asked for by the owner on 5 November 2026 ("build the planet parade").

**It is not a term of astronomy, so there is no rule to read, and the numbers
are ours.** What the sources say, read 5 November 2026:

| Claim | Source |
|---|---|
| "A planetary parade refers to a rare event when several planets appear in the same region of the sky." "it's not a scientific term in astronomy." Uranus and Neptune visible "only to those with a telescope". A dated list of parades (below). | Kielder Observatory, "AAA: What's a Planetary Parade?", https://kielderobservatory.org/news/latest-news/434-aaa-what-s-a-planetary-parade |
| NASA, quoted: "these two distant planets will not be visible to the unaided eye." Multiple planets "visible at the same time from our vantage point on earth." | WTTW, 25 February 2025, https://news.wttw.com/2025/02/25/upcoming-rare-7-planet-parade-mostly-hype-here-s-what-s-actually-happening-sky |
| "As per NASA, when you can see four, five, or more planets in the night sky, it is often referred to as a planetary parade" | SlashGear, 15 June 2025, https://www.slashgear.com/1886555/planet-parade-explained-how-often/ (the NASA page it links was not read; two NASA skywatching pages refused the fetch) |
| 28 February 2026: "Mercury, Venus, Jupiter, Saturn, Uranus, and Neptune will trace an arc along the ecliptic" after sunset; Mercury, Venus and Saturn "too low on the horizon and too close to the Sun's glare to be practical observing targets". | Celestron, https://www.celestron.com/blogs/news/planetary-parade |

**The rule built** (`SkyWeather.parades()`): at the moment the Sun is 3 degrees
below the horizon (`PARADE_SUN`), after sunset and before sunrise, count the
five planets seen without a telescope (Mercury to Saturn, `NAKED`) whose
apparent altitude, refraction included, is 3 degrees or more (`PARADE_ALT`).
Four or more (`PARADE_MIN`, the NASA figure as SlashGear quotes it) is a
parade, and consecutive twilights make one run, one event on the sheet. The
Moon is not counted, as none of the sources count it.

**The two degree figures were chosen by measurement, not read.** Run from
Kielder Observatory (Wikipedia infobox: 55.23194 N, 2.616250 W, 370 m), they
reproduce the observatory's own list; the end of civil twilight (Sun at 6
degrees down) with planets at 5 degrees or more does not, because it loses
Mercury and Saturn low in the glow and finds only one of the four five planet
stretches the list names (October 2028). Held by SW6:

| Kielder's list | The scan from Kielder |
|---|---|
| Late April to Late August 2022, four before sunrise | 20 April to 13 August |
| Mid-June to Early July 2022, five before sunrise | five from 20 June to 7 July |
| January to mid-February 2025, four after sunset | 12 January to 21 March (Mercury takes Saturn's place in March) |
| all five, 22nd to 25th February 2025 | five from 19 February to 2 March |
| Late August 2025, four before sunrise | 9 August to 7 September |
| Late October 2028, five before sunrise | five from 9 to 28 October |
| five "won't happen again until 2028" | no five between March 2025 and October 2028 |

The two places they part: the 2022 morning parade ends on 13 August in the
scan, not in late August, and the 2025 evening one runs past mid-February.
Celestron's four planets for 28 February 2026 are the scan's four, though
Celestron calls three of them impractical; the sheet names any planet under
10 degrees as low in the twilight.

**It needs a place.** It is read from the place on the profile, the one place
the app holds, and a profile with none (the sample) has no parade. Whether that
should be the device's location or a place typed into the sheet is the
owner's decision, asked on 5 November 2026.

