# Derived astrology and the decans: what was read, and what was built

Asked for by the owner on 5 November 2026: "Research derivative astrology as
well", then "In every sense, where it applies. Also research decans." Every
rule the app now uses is listed with the page it was read on. Anything that
rests on a secondary page says so. Nothing here was filled from memory.

## Turned (derived) houses

Rule: any house is taken as the 1st of another and counted on, the starting
house counted as 1. The 8th is the 2nd from the 7th, a partner's money.

| Claim | Source | Kind |
|---|---|---|
| Counting rule, "largely employed in horary and known to have been used by Ptolemy" | https://www.skyscript.co.uk/glossary/derived-houses | secondary (Houlding) |
| Lilly, 9th house: "of the kindred of one's wife"; footnote: "Because it is the 3rd house from the 7th" | https://www.skyscript.co.uk/lilly_houses.html (Christian Astrology, 1647) | primary text, editor's footnote for the reasoning |
| Lilly, 5th: "of the wealth of the father"; 6th: "the father's brothers and sisters"; 8th: "dowry of the wife" | same | primary text; the derivation (2nd and 3rd from the 4th, 2nd from the 7th) is ours |
| Ptolemy III.4: "set up the paternal or maternal place of the sect as a horoscope" | https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Ptolemy/Tetrabiblos/3A*.html | primary (Robbins) |
| Ptolemy III.5: brethren "from the culminating sign, the place of the mother, that is, that which contains by day Venus and by night the moon" | same | primary; counted from a planet, not from a house |
| BPHS 50.94 uses bhavayojana, the application of houses, for children and spouses; no explicit Nth from Nth rule | https://enjoylearningsanskrit.com/scriptures/parashara/chapter-50/verse-94 | primary, with the site's translation |

Disputes: sources disagree on which parent is the 4th and which the 10th
(Lilly gives the 4th to the father). The app's frames avoid the question: the
4th is "your family", and the 10th is not used as a frame.

Built: `turnedHouse(n)` in the house pane, "Seen from the other houses", from
the 7th, 4th, 3rd, 5th and 11th, with Lilly's own meaning quoted where he
gives one.

## The decans

| Claim | Source | Kind |
|---|---|---|
| 36 Egyptian star groups, one rising every ten days, marking the hours of night; "by at least the Ninth or Tenth Dynasty ... 21st century BC"; first on coffin lids | https://en.wikipedia.org/wiki/Decan | secondary |
| "During the Ptolemaic period the 36 decans were assimilated into Hellenistic astrological doctrines" | https://grbs.library.duke.edu/index.php/grbs/article/download/15727/6977/18691 (Piperakis, GRBS 57, 2017) | scholarly |
| Firmicus, Mathesis II.4: "In Ariete primus decanus Martis et secundus Solis, tertius Veneris"; "Tauri primus decanus Mercurii et secundus Lunae, tertius Saturni"; the order runs on unbroken | https://penelope.uchicago.edu/thayer/l/roman/texts/Firmicus_Maternus/Mathesis/2*.html | primary (Latin) |
| BPHS 6.8: the drekkanas "belong to the respective sign itself, its fifth sign, and its ninth sign" | https://enjoylearningsanskrit.com/scriptures/parashara/chapter-6/verse-8 | primary, with the site's translation |
| Varahamihira follows the Parashari method (Brihat Jataka ch. XXVII); other Indian lordship rules exist (Somanatha, Jaimini) | https://en.wikipedia.org/wiki/Drekkana | secondary |

The app's Chaldean table in `placement-content.js` matches Firmicus for every
sign (checked against his list). Not verified, so not used: the Golden Dawn
attribution of the minor arcana 2 to 10 to the decans (the Book of Thoth text
was not reached verbatim), Manilius's system, and the Picatrix images.

Built: `decanPair()` names both decans on the placement detail and in the
packet's degree section; the Vedic study's Oracle dossier carries each
graha's drekkana sign (sidereal, Lahiri). The Astropedia's Decans entry
carries the history above.

## Antiscia

| Claim | Source | Kind |
|---|---|---|
| Firmicus II.29: "Geminorum pars I. in XXIX. Cancri partem mittit antiscium"; "in XXX. partem signi nulla pars mittat" | Thayer, Mathesis II | primary (Latin) |
| "mirrored across the solstice points of the Cancer-Capricorn axis (so a planet at 5 degrees Capricorn has its antiscion at 25 degrees Sagittarius)"; Lilly CA p. 90 | https://www.skyscript.co.uk/glossary/antiscia | secondary, quoting Lilly |

Firmicus counts in ordinal degrees (1st with 29th, sum 30) and Skyscript in
longitude (5 with 25). They are the same reflection, `180 - lon`, which is
what `antiscionOf()` computes. Built: "The Mirror" chapter in the packet of
each of the ten bodies and the North Node, naming any natal body within a
degree of the mirror.

## Annual profections

| Claim | Source | Kind |
|---|---|---|
| "the planet ruling the ascendant (ascendant-ruler) governs the first year of life, which ends on the first birthday" | https://www.skyscript.co.uk/glossary/profections | secondary |
| "Ptolemy used profections only as a secondary factor" | same | secondary |

Built: `profection()`, whole signs from the Ascendant, traditional rulers,
withheld without a birth time or on the sample. "The Year" chapter in the
Ascendant's packet and the year lord's; one line in the Hellenistic study's
dossier. The Astropedia's Profection entry said "at age one the first house",
which is off by one against the rule above, and is corrected.

## Derived charts

| Technique | In the app before this | Source read | Built now |
|---|---|---|---|
| Secondary progressions | Sun and Moon hand-off, held by `drive-progressions.js` | owner's earlier ask | no change |
| Draconic, heliocentric, sidereal | Chart Study | earlier work | no change |
| Navamsa and the vargas | none | https://en.wikipedia.org/wiki/Navamsa_(astrology), https://en.wikipedia.org/wiki/Varga_(astrology) | not yet |
| Composite (midpoints) | Astropedia entry | Townley, "The Composite Chart" (1973), per https://theastrologypodcast.com/2017/10/13/composite-charts-with-originator-john-townley/ | not yet |
| Relationship (Davison) | none | "cast for the midpoint in time and space between two births", https://astrologysoftware.com/community/learn/dictionary/relationship_chart.html; 1977 per the podcast | Astropedia entry |
| Harmonic charts | `ephemeris/harmonic.ts`, no screen | Addey, Harmonics in Astrology (1975 or 1976; Wikipedia gives both) | Astropedia entry |
| Solar arc, tertiary progressions, solar and lunar returns | Solar Return entry only | every page tried failed | not yet |

What is left needs a decision from the owner, because each is a new screen:
the navamsa chart, the two relationship charts in Synastry, a harmonic view of
the wheel, and solar arc directions.
