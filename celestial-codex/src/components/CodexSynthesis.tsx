import React from "react";
import { CodexPanel } from "./CodexPanel";
import { NatalChart, SIGN_GLYPHS, SIGN_NAMES } from "../helpers/astroEngine";
import { HumanDesignChart } from "../helpers/humanDesignEngine";
import { NumerologyProfile } from "../helpers/numerologyEngine";
import { astroLore } from "../helpers/astroLore";
import { hdLore } from "../helpers/hdLore";
import { numberLore } from "../helpers/numberLore";
import styles from "./CodexSynthesis.module.css";

interface Props {
  firstName: string;
  natal: NatalChart;
  hd: HumanDesignChart;
  numbers: NumerologyProfile;
  onNavigate: (tab: string) => void;
  className?: string;
}

export const CodexSynthesis = ({ firstName, natal, hd, numbers, onNavigate, className }: Props) => {
  const sun = natal.planets.find((p) => p.key === "sun")!;
  const moon = natal.planets.find((p) => p.key === "moon")!;
  const sunSign = astroLore.signs[sun.signIndex];
  const moonSign = astroLore.signs[moon.signIndex];
  const rising = natal.ascendant !== null ? Math.floor(natal.ascendant / 30) : null;
  const lp = numberLore[numbers.lifePath];
  const type = hdLore.types[hd.type];

  return (
    <div className={`${styles.wrap} ${className ?? ""}`}>
      <div className={styles.medallions}>
        <button type="button" className={styles.medallion} onClick={() => onNavigate("stars")}>
          <span className={styles.ring} aria-hidden />
          <span className={styles.medGlyph}>{SIGN_GLYPHS[sun.signIndex]}</span>
          <span className={styles.medLabel}>Sun in {SIGN_NAMES[sun.signIndex]}</span>
          <span className={styles.medSub}>{sunSign.epithet}</span>
        </button>
        <button type="button" className={`${styles.medallion} ${styles.medCenter}`} onClick={() => onNavigate("design")}>
          <span className={styles.ring} aria-hidden />
          <span className={styles.medGlyph}>◈</span>
          <span className={styles.medLabel}>{hd.type}</span>
          <span className={styles.medSub}>{hd.profile.split(" ")[0]} · {hd.authority.split(" ")[0]} authority</span>
        </button>
        <button type="button" className={styles.medallion} onClick={() => onNavigate("numbers")}>
          <span className={styles.ring} aria-hidden />
          <span className={styles.medGlyph}>{numbers.lifePath}</span>
          <span className={styles.medLabel}>Life Path {numbers.lifePath}</span>
          <span className={styles.medSub}>{lp.title}</span>
        </button>
      </div>

      <CodexPanel glow eyebrow="The Triune Signature" title={<>The soul of {firstName}, <em className={styles.em}>in one breath</em></>} className={styles.signature}>
        <p className={styles.prose}>
          You came in under a {sunSign.element.toLowerCase()} Sun in {SIGN_NAMES[sun.signIndex]}, {sunSign.epithet.toLowerCase()}, with the Moon keeping its tides in {SIGN_NAMES[moon.signIndex]}
          {rising !== null ? <> and {SIGN_NAMES[rising]} rising on the eastern horizon like a banner unfurled</> : null}. {sunSign.prose.split(". ")[0]}.
        </p>
        <p className={styles.prose}>
          Your body was built as a <b>{hd.type}</b>, and it asks you to <b>{type.strategy.toLowerCase()}</b>. {type.prose.split(". ").slice(0, 2).join(". ")}. When you trust your {hd.authority.toLowerCase()} authority, you taste {type.signature.toLowerCase()}; when you override it, {type.notSelf.toLowerCase()} is the bell that tells you to return.
        </p>
        <p className={styles.prose}>
          And beneath it all runs the number <b>{numbers.lifePath}</b>, the path of <b>{lp.title}</b>. {lp.prose} Your name sounds an Expression of {numbers.expression} ({numberLore[numbers.expression].title.toLowerCase()}) while your heart hums a Soul Urge of {numbers.soulUrge} ({numberLore[numbers.soulUrge].title.toLowerCase()}).
        </p>
        <p className={styles.coda}>
          Where these three voices agree, you are unstoppable. Where they argue, you are being invited to grow.
        </p>
      </CodexPanel>

      <div className={styles.grid}>
        <CodexPanel eyebrow="The Emotional Tide" title={<>Moon in <em className={styles.em}>{SIGN_NAMES[moon.signIndex]}</em></>}>
          <p className={styles.prose}>{moonSign.prose}</p>
        </CodexPanel>
        <CodexPanel eyebrow="This Year's Chapter" title={<>Personal Year <em className={styles.em}>{numbers.personalYear}</em></>}>
          <p className={styles.prose}>
            You are walking a year of <b>{numberLore[numbers.personalYear].title}</b>. {numberLore[numbers.personalYear].prose}
          </p>
        </CodexPanel>
        <CodexPanel eyebrow="The Soul's North" title={<>North Node in <em className={styles.em}>{SIGN_NAMES[natal.planets.find((p) => p.key === "northNode")!.signIndex]}</em></>}>
          <p className={styles.prose}>
            {astroLore.planets.northNode.prose} Here, that growth wears the colors of {astroLore.signs[natal.planets.find((p) => p.key === "northNode")!.signIndex].keywords.join(", ")}.
          </p>
        </CodexPanel>
      </div>

      <button type="button" className={styles.oracleCta} onClick={() => onNavigate("oracle")}>
        <span>Consult the Oracle</span>
        <small>A horoscope woven from all three languages, written for you alone →</small>
      </button>
    </div>
  );
};
