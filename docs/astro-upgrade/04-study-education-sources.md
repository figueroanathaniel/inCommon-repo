# The lessons of each chart study: ranking and sources

Asked for by the owner on 5 November 2026: each Chart Study that is not plain
Western (Vedic, Chinese, Hellenistic, Western Sidereal, Draconic and
Heliocentric) teaches its own field in the Astropedia, in the order its own
schools teach it, ranked by how important a topic is against how hard it is.
The Western chapters are unchanged. The lessons live in `STUDY_LESSONS` in
`app/astropedia.js`, and the app shows them as a chapter, "Your study: ...",
at the head of the Astropedia while that study is chosen in Settings.

## How the order was decided

Two marks per topic, and both are judgement rather than measurement.

- **How widely it is taught** (the band printed on each lesson): read from the
  published outlines of the courses listed below. "Taught almost everywhere"
  means every outline read for that study covers it, "in most courses" more
  than half, "in some courses" fewer, and "taught later" means it appears only
  in second level or advanced modules. The outlines were read for their topic
  lists only; no count per topic was recorded, so the bands are a reading of
  those lists, not a tally.
- **Pace** (gentle, steady, demanding): how much the topic asks of a beginner,
  mostly by how many earlier lessons it rests on. This is my judgement.

Lessons are ordered by band first, then by pace inside a band, then by the
order the outlines themselves use. Where a topic rests on another (the ten
gods on the Day Master, the dasha on the nakshatras) it never comes before it,
whatever its band.

Sidereal, Draconic and Heliocentric have no curriculum of their own that could
be found: they are taught as single techniques inside wider courses. Their
order follows how the sources introduce them (what it is, the first thing
students compare, how it is used, where it came from), and the bands there are
weaker evidence than for the other three.

## The order

| Study | Lessons, in order |
|---|---|
| Vedic | the nine grahas; the rashis; the lagna and the bhavas; the sidereal zodiac and the ayanamsa; the nakshatras and padas; the Vimshottari dasha; the panchanga; gochara; yogas; drishti; the vargas and the navamsa |
| Chinese | the ten stems; the twelve branches; the four pillars and the sixty cycle; the Day Master; yin, yang and the five phases; the ten gods; the luck pillars; the solar terms; the symbolic stars; clashes and combinations; the strength of the Day Master; the useful god; structures |
| Hellenistic | sect; the seven planets; the signs and the Thema Mundi; whole sign places and the joys; annual profections; the Lots of Fortune and Spirit; zodiacal releasing; aspects by sign; the ruler of the hour marker; bonification and maltreatment; the triplicity lords of the sect light; the revolution of the year |
| Western Sidereal | why the stars; the ayanamsa and its anchor; Fagan and Bradley; learning one ayanamsa first |
| Draconic | the chart; the Sun, Moon and rising sign compared; the overlay; history |
| Heliocentric | the chart seen from the Sun; what drops away; the aspects; beside the birth chart; history |

## Sources

Curriculum outlines (for the order):

- Vedic: Bastyr University AY9506 and AY9507, Ayurvedic Jyotish I and II
  (bastyr.smartcatalogiq.com, 2015 to 2017 catalogues); Barefoot Consulting,
  Vedic Astrology Beginners Course (barefootconsulting.blogspot.com, 2023);
  DDU Gorakhpur University, P.G. Diploma in Jyotish syllabus (ddugu.ac.in, 2024).
- Chinese: Bazi Practitioners Course (fengshuibazi.yolasite.com and
  bazidestiny.yolasite.com); Joseph Yu, Basic Bazi (myfengstyle.thinkific.com);
  Fengshui Superstar, Ba Zi Program, Fundamentals for Novice
  (fengshui-superstar.teachable.com); Skillon BaZi study course (skillon.com);
  FSInMotion, Bazi Basic Training (fsinmotion.com).
- Hellenistic: Chris Brennan, Hellenistic Astrology course outline
  (chrisbrennanastrologer.com/hellenisticastrologyclass.html); Kepler College
  courses E206 (zodiacal releasing), RN103 and RP201 (profections) and HL201 to
  HL207 (keplercollege.org course catalogue 2024); Nightlight Astrology, second
  year (nightlightastrology.com/second-year/).

Facts in the lessons:

- Vedic: Wikipedia, Hindu astrology; Nakshatra; Dasha (astrology); Bhava;
  Navamsa; Varga (astrology). Lahiri and the Calendar Reform Committee:
  kerykeion.net, Ayanamsas, and Wikipedia, Ayanamsa. Drishti and the nine
  grahas as Wikipedia, Hindu astrology states them.
- Chinese: Wikipedia, Four Pillars of Destiny; Heavenly Stems; Earthly
  Branches. Lichun at 315 degrees is the convention `chart-traditions.js`
  already computes the year pillar by. No source was read for the hidden stems,
  so no lesson names them.
- Hellenistic: Wikipedia, Hellenistic astrology; Universal Translations,
  Traditional Hellenistic Astrology (universal-translations.squarespace.com),
  for the seven planets, the Thema Mundi, the joys and aspects by sign; Kepler
  College library, The Planetary Joys (library.keplercollege.org); Skyscript
  glossary, Profections.
- Sidereal: Wikipedia, Cyril Fagan; encyclopedia.com, Fagan, Cyril
  (1896 to 1970); Wikipedia, Sidereal and tropical astrology; kerykeion.net,
  The sidereal zodiac, for the Aldebaran and Spica anchors, the J2000 value and
  the advice to learn one ayanamsa first.
- Draconic: kerykeion.net, Draconic chart introduction; synthesisastrology.com,
  Draconic astrology explained and Draconic astrology history (Froger, Elwell
  1977, Crane 1987 and 1999, Olliver 2022). "Deeper patterns" and "purpose" are
  the sources' own readings, given in the lesson as Crane's.
- Heliocentric: Wikipedia, Heliocentric astrology (Aurifaber, Childrey 1652 and
  1653, Merton 1899, Sedgwick 1990; no houses or angles; aspects first; read
  beside the geocentric chart). The lack of retrograde motion carries a
  citation needed mark there; it is also plain geometry, since every planet
  moves forward round the Sun.

## Not done

- No lesson is tied to the reader's own chart yet (for example opening the
  reader's nakshatra from the nakshatra lesson).
- The navamsa is computed for the Vedic study (6 November 2026): each
  graha's D9 sign and vargottama, in the dossier and the study card, by the
  rule HinduTone (hindutone.com/astrology/navamsa-chart-d9-explained/) and
  DekhoPanchang (dekhopanchang.com/en/learn/navamsa-boundaries) teach. The
  translation of BPHS 6.31 at enjoylearningsanskrit.com reads movable from
  Aries, fixed from Leo and dual from Sagittarius, which disagrees, and was
  not followed. No D9 wheel is drawn.
- Zodiacal releasing is computed for the Hellenistic study (6 November
  2026), levels 1 and 2 from the Lots of Spirit and Fortune, in the dossier
  and the study card. Periods: Aries and Scorpio 15, Taurus and Libra 8,
  Gemini and Virgo 20, Cancer 25, Leo 19, Sagittarius and Pisces 12,
  Capricorn 27, Aquarius 30 (theastrologypodcast.com, 11 February 2019);
  Capricorn 27 is the standard and 30 is rejected by Valens, years are 360
  days, level 2 is a twelfth of its parent and its last subperiod is cut at
  the parent's end, and the loosing of the bond jumps to the opposite sign
  after twelve subperiods (stellium.readthedocs.io, methodology, zodiacal
  releasing, whose Riley quotes are secondary). Lots by day: Fortune is
  Ascendant plus Moon less Sun, Spirit the reverse; both reversed by night.
  Not checked against another program's output for a real chart. Levels 3
  and 4, peak periods and the lesson text are unchanged.
