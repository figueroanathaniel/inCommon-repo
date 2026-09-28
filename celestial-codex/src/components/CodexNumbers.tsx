import React, { useState } from "react";
import { NumerologyOrrery3D, type OrreryItem } from "./NumerologyOrrery3D";
import { CodexPanel } from "./CodexPanel";
import { NumerologyProfile } from "../helpers/numerologyEngine";
import { numberLore } from "../helpers/numberLore";
import styles from "./CodexNumbers.module.css";

const DESCRIPTIONS: Record<string, string> = {
  lifePath: "The road beneath your feet, drawn from the full date of your birth.",
  expression: "The instrument you were given, summed from every letter of your birth name.",
  soulUrge: "The hidden longing of the heart, heard in the vowels of your name.",
  personality: "The mask and the doorway, spoken by your name's consonants.",
  birthday: "A special gift carried on the day of the month you arrived.",
  maturity: "The fruit that ripens in the second half of life.",
  personalYear: "The season of the nine-year cycle you are walking through now.",
};

export const CodexNumbers = ({ numbers, className }: { numbers: NumerologyProfile; className?: string }) => {
  const items: OrreryItem[] = [
    { key: "lifePath", label: "Life Path", value: numbers.lifePath },
    { key: "expression", label: "Expression", value: numbers.expression },
    { key: "soulUrge", label: "Soul Urge", value: numbers.soulUrge },
    { key: "personality", label: "Personality", value: numbers.personality },
    { key: "birthday", label: "Birthday", value: numbers.birthday },
    { key: "maturity", label: "Maturity", value: numbers.maturity },
    { key: "personalYear", label: "Personal Year", value: numbers.personalYear },
  ];
  const [sel, setSel] = useState<string | null>("lifePath");
  const current = items.find((i) => i.key === sel) ?? items[0];
  const lore = numberLore[current.value];

  return (
    <div className={`${styles.wrap} ${className ?? ""}`}>
      <div className={styles.stageRow}>
        <NumerologyOrrery3D items={items} selected={sel} onSelect={setSel} className={styles.orrery} />
        <CodexPanel glow className={styles.reading}>
          <div key={current.key} className={styles.readingInner}>
            <div className={styles.bigNum}>{current.value}</div>
            <p className={styles.eyebrow}>{current.label} · {lore.archetype}</p>
            <h3 className={styles.title}><em>{lore.title}</em></h3>
            <p className={styles.desc}>{DESCRIPTIONS[current.key]}</p>
            <p className={styles.prose}>{lore.prose}</p>
            <p className={styles.shadow}><span>Shadow</span> {lore.shadow}</p>
            {current.key === "lifePath" && <p className={styles.mono}>{numbers.lifePathSteps}</p>}
          </div>
        </CodexPanel>
      </div>

      <div className={styles.cards}>
        {items.map((i) => (
          <button key={i.key} type="button" className={`${styles.card} ${sel === i.key ? styles.cardActive : ""}`} onClick={() => setSel(i.key)}>
            <span className={styles.cardNum}>{i.value}</span>
            <span className={styles.cardLabel}>{i.label}</span>
            <span className={styles.cardTitle}>{numberLore[i.value].title}</span>
          </button>
        ))}
      </div>

      <div className={styles.lower}>
        <CodexPanel eyebrow="Cycles in Motion" title="The rhythm of now">
          <div className={styles.cycles}>
            {[
              { l: "Personal Year", v: numbers.personalYear },
              { l: "Personal Month", v: numbers.personalMonth },
              { l: "Personal Day", v: numbers.personalDay },
            ].map((c) => (
              <div key={c.l} className={styles.cycle}>
                <span className={styles.cycleNum}>{c.v}</span>
                <span className={styles.cycleLabel}>{c.l}</span>
                <span className={styles.cycleTitle}>{numberLore[c.v].title}</span>
              </div>
            ))}
          </div>
        </CodexPanel>
        <CodexPanel eyebrow="Karmic Lessons" title={numbers.karmicLessons.length ? "Notes missing from your name" : "A complete chord"}>
          <p className={styles.prose}>
            {numbers.karmicLessons.length
              ? `Your name carries no ${numbers.karmicLessons.join(", ")}. These absent notes are lessons this lifetime invites you to learn: ${numbers.karmicLessons.map((n) => numberLore[n].title.replace("The ", "the ")).join(", ")}.`
              : "Every number from one to nine sounds within your name. You arrive with a full palette, and your task is harmony rather than acquisition."}
          </p>
        </CodexPanel>
      </div>
    </div>
  );
};
