# The ten study courses, their units, glossaries and chart words: sources

Asked for by the owner on 6 November 2026: "Begin the course curriculums for
the different studies. Jyotish, sidereal, Placidus, etc should all have a
tailored curriculum around them in the Astropedia. Definitions should be in
the Astropedia. Verbiage specific to the study should exist in the charts tab
once selected, much like the Rashi chart becomes available."

This extends `04-study-education-sources.md`, which holds the ranking method
and the sources for the six studies that are not plain Western. Read that
first; everything it says about bands and pace holds here.

## What was built

- **Four Western courses** in `STUDY_COURSES` (`app/astropedia.js`): Whole
  Sign Houses (13 lessons), Placidus Houses (14), Koch Houses (14) and Equal
  Houses (13). Placidus, Koch, Equal and Whole Sign are house systems inside
  the one Western chart, so each course is the same Western curriculum taught
  through its own house division, not four separate astrologies. Shared
  lessons are built once (`westernFoundations`, `westernReading`,
  `westernTiming`, `quadrantHouses`, `interceptedSigns`, `nearThePoles`) and
  each course swaps in the lines its system changes.
- **Units for every course.** The four Western courses carry a unit on each
  lesson; the six other studies are grouped by `STUDY_UNITS` (runs of lessons
  under a unit name), so the Astropedia shows "Unit 2, Timing, lesson 7".
- **A glossary per study** (`STUDY_WORDS`), shown as its own chapter, "Words
  of <study>", after "Your study". A lesson shows up to eight chips for the
  study words it uses, and a word's page links back to every lesson that uses
  it.
- **The study's words on the Charts tab** (`STUDY_TALK` in the app): the
  title (Your Janma Kundali, Your Four Pillars, Your Nativity, Your Sidereal
  Chart, Your Draconic Chart, Your Chart from the Sun), the houses heading
  (Bhavas, Places, or the house system's name for the Western family), the
  house rows (Bhava 1, Place 1; Vedic rows name the rashi), and the names of
  the seven grahas, Rahu, Ketu and the Lagna under Vedic, and the Hour Marker
  under Hellenistic. Display only: every key and reading still goes by the
  Western name.

## Sources read

| Page | Used for |
|---|---|
| [Walter Koch (astrologer), Wikipedia](https://en.wikipedia.org/wiki/Walter_Koch_(astrologer)) | Koch 1895 to 1970, Esslingen, the system of the early 1960s, tables 1965 |
| [Margaret Hone, Wikipedia](https://en.wikipedia.org/wiki/Margaret_Hone) | Equal houses in the Faculty of Astrological Studies' teaching |
| [Equal house system, astrologysoftware.com dictionary](https://astrologysoftware.com/community/learn/dictionary/equal_house_system.html) | Equal houses, Petosiris |
| [Placidus, astrologysoftware.com dictionary](https://astrologysoftware.com/community/learn/dictionary/placidus.html) | Placidus de Titis (1603 to 1668), the tables |
| [House division, Skyscript glossary](https://www.skyscript.co.uk/glossary/house-division) | Quadrant against sign based division; Raphael's tables carrying Placidus |
| [Episode 52 transcript, The Astrology Podcast](https://theastrologypodcast.com/transcripts/ep-52-whole-sign-houses-the-best-system-of-house-division/) | Whole Sign's return: Holden 1982, Project Hindsight, Hand from the mid 1990s, wide use by the late 2000s |
| [House systems, Kerykeion](https://kerykeion.net/content/learn-astrology/foundation-house-systems) | How each system divides the sky |
| [Placidus vs Whole Sign, Kerykeion](https://kerykeion.net/content/learn-astrology/guide-placidus-vs-whole-sign) | What changes for a reader between the two |
| [Intercepted signs, Kerykeion](https://kerykeion.net/content/learn-astrology/natal-intercepted-signs-introduction) | Interception, and why it exists only in quadrant systems |
| [How to read a chart wheel, Cafe Astrology](https://cafeastrology.com/articles/how-to-understand-read-chart-wheel.html) | The order a beginner meets the wheel |
| [Bruno and Louise Huber, Urania Trust](https://www.uraniatrust.org/celebrated-astrologers/bruno-louise-huber) | The Huber Method and Koch houses, Adliswil, from 1968 |
| [FAS course structure (PDF)](https://www.astrology.org.uk/wordpress/wp-content/uploads/FAS-Course-Structure-Working-through-the-Modules.pdf) | That a Western course runs foundations, then reading, then timing |

The Vedic, Chinese, Hellenistic, Sidereal, Draconic and Heliocentric lessons
and their sources are unchanged from `04-study-education-sources.md`; this
change only groups them into units and adds their glossaries, which use the
same sources.

## What the sources do not settle

- **The Western order is judgement.** The FAS PDF lists its modules, not their
  topics, so the order of lessons inside each Western course is mine, made
  from the Cafe Astrology and Kerykeion pages and the band method in 04.
- **Equal houses from which angle.** The two dictionary entries read for
  Equal houses disagree on whether the Faculty's Equal system counts from the
  Ascendant or the Midheaven, so the lesson says only that every house is
  thirty degrees and does not name a starting point beyond the app's own,
  which is the Ascendant.
- **Hearing the intercepted sign's ruler.** The lesson says many astrologers
  listen to the ruler of an intercepted sign as a quieter voice. That is a
  common teaching, not one any page above states in those words.
- **The chart words are standard terms**, not a source each: bhava, graha,
  lagna, rashi and the Sanskrit planet names are the field's ordinary
  vocabulary, as are topos (place) and the Hour Marker for the Hellenistic
  Ascendant. Janma Kundali is the common name for a Vedic birth chart. The
  outer planets are not grahas in the classical list, which is why the Vedic
  heading reads "Grahas & Outer Planets".
