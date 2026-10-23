import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ArrowRight } from "lucide-react";
import { Button } from "../components/Button";
import { NatalSphere3D } from "../components/NatalSphere3D";
import { astroEngine, formatDegree, SIGN_NAMES } from "../helpers/astroEngine";
import { useAuth } from "../helpers/useAuth";
import { useScrollReveal } from "../helpers/useScrollReveal";
import styles from "./_index.module.css";

const PILLARS = [
  {
    glyph: "☉",
    eyebrow: "The Language of Light",
    title: "Astrology",
    prose: "At the instant of your first breath, the planets froze into a single constellation that belongs to no one else. We compute it from true ephemerides and render it as a living armillary you can orbit, touch, and read.",
  },
  {
    glyph: "◈",
    eyebrow: "The Language of Energy",
    title: "Human Design",
    prose: "Two moments, eighty-eight solar degrees apart, weave your conscious and unconscious threads into a bodygraph of nine luminous centers. Discover your Type, your Authority, and the strategy your body already knows.",
  },
  {
    glyph: "∞",
    eyebrow: "The Language of Number",
    title: "Numerology",
    prose: "Your name is a chord and your birthdate a rhythm. Reduced to their essence, they reveal a Life Path, a Soul Urge, and the cycles of the year you are walking through right now.",
  },
];

export default function HomePage() {
  const { authState } = useAuth();
  const skyNow = useMemo(() => astroEngine(new Date(), null), []);
  const sun = skyNow.planets.find((p) => p.key === "sun")!;
  const moon = skyNow.planets.find((p) => p.key === "moon")!;
  const ctaTo = authState.type === "authenticated" ? "/codex" : "/login";
  const pillarsRef = useScrollReveal();
  const ephRef = useScrollReveal();
  const finaleRef = useScrollReveal();

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Celestial Codex · Astrology, Human Design & Numerology</title>
        <meta name="description" content="Your soul written in three celestial languages: interactive 3D natal charts, Human Design bodygraphs, numerology, and lyrical personalized horoscopes." />
      </Helmet>

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.eyebrow}>Astrology · Human Design · Numerology</p>
          <h1 className={styles.title}>
            Your soul, written in <em>three celestial languages.</em>
          </h1>
          <p className={styles.lede}>
            The Codex reads the sky of your birth, the circuitry of your design, and the hidden arithmetic of your name, then braids them into one luminous portrait and a horoscope composed for you alone.
          </p>
          <div className={styles.ctas}>
            <Button asChild size="lg">
              <Link to={ctaTo}>
                Open your Codex <ArrowRight size={18} />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className={styles.ghostCta}>
              <a href="#pillars">The three languages</a>
            </Button>
          </div>
        </div>
        <div className={styles.heroSphere}>
          <NatalSphere3D chart={skyNow} compact />
          <div className={styles.skyCaption}>
            <span className={styles.skyLabel}>The heavens, this very moment</span>
            <span className={styles.skyData}>
              ☉ {formatDegree(sun.longitude)} &nbsp;·&nbsp; ☽ {formatDegree(moon.longitude)}
            </span>
          </div>
        </div>
      </section>

      <section id="pillars" className={styles.pillars} ref={pillarsRef}>
        {PILLARS.map((p, i) => (
          <article key={p.title} className={`${styles.pillar} ${styles.reveal}`} style={{ transitionDelay: `${i * 140}ms` }}>
            <div className={styles.pillarGlyph}>{p.glyph}</div>
            <p className={styles.pillarEyebrow}>{p.eyebrow}</p>
            <h2 className={styles.pillarTitle}>{p.title}</h2>
            <p className={styles.pillarProse}>{p.prose}</p>
          </article>
        ))}
      </section>

      <section className={`${styles.ephemeris} ${styles.reveal}`} ref={ephRef}>
        <div className={styles.ephemerisHead}>
          <p className={styles.eyebrow}>Tonight's Ephemeris</p>
          <h2 className={styles.sectionTitle}>
            The wanderers, <em>as they stand</em>
          </h2>
        </div>
        <div className={styles.ephemerisGrid}>
          {skyNow.planets.map((p) => (
            <div key={p.key} className={styles.ephemerisRow}>
              <span className={styles.ephGlyph}>{p.glyph}</span>
              <span className={styles.ephName}>{p.name}</span>
              <span className={styles.ephDeg}>
                {Math.floor(p.degreeInSign)}° {SIGN_NAMES[p.signIndex]}
                {p.retrograde && p.key !== "northNode" && <span className={styles.ephRx}> ℞</span>}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.finale} ${styles.reveal}`} ref={finaleRef}>
        <h2 className={styles.finaleTitle}>
          The stars have kept your secret <em>long enough.</em>
        </h2>
        <Button asChild size="lg">
          <Link to={ctaTo}>
            Begin your reading <ArrowRight size={18} />
          </Link>
        </Button>
      </section>
    </div>
  );
}
