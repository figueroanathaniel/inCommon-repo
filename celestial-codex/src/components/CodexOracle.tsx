import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { CodexPanel } from "./CodexPanel";
import { Skeleton } from "./Skeleton";
import { Button } from "./Button";
import { PremiumGate } from "./PremiumGate";
import { localDateString, useCodexQueries } from "../helpers/useCodexQueries";
import { usePremium } from "../helpers/usePremium";
import type { HoroscopeDepthKind, HoroscopePeriodKind } from "../helpers/Horoscope";
import type { BirthProfile } from "../helpers/BirthProfile";
import styles from "./CodexOracle.module.css";

const PERIODS: { k: HoroscopePeriodKind; label: string; sub: string }[] = [
  { k: "daily", label: "Today", sub: "the day's omen" },
  { k: "weekly", label: "This Week", sub: "the seven-day tide" },
  { k: "monthly", label: "This Month", sub: "the lunar chapter" },
];

export const CodexOracle = ({ profile, className }: { profile: BirthProfile; className?: string }) => {
  const [period, setPeriod] = useState<HoroscopePeriodKind>("daily");
  const [depth, setDepth] = useState<HoroscopeDepthKind>("standard");
  const today = localDateString();
  const premium = usePremium.useStatus();
  const canDeep = !!premium.data?.isPremium;
  const locked = depth === "deep" && !canDeep;
  const q = useCodexQueries.useHoroscope(period, today, profile, depth, !locked);
  const err = q.error as (Error & { code?: string }) | null;
  const h = q.data;

  return (
    <div className={`${styles.wrap} ${className ?? ""}`}>
      <div className={styles.depths}>
        <button type="button" className={`${styles.depth} ${depth === "standard" ? styles.depthOn : ""}`} onClick={() => setDepth("standard")}>
          Standard
        </button>
        <button type="button" className={`${styles.depth} ${depth === "deep" ? styles.depthOn : ""}`} onClick={() => setDepth("deep")}>
          ✦ In-Depth {canDeep ? "" : "· Luminary"}
        </button>
      </div>
      <div className={styles.periods} role="tablist">
        {PERIODS.map((p) => (
          <button
            key={p.k}
            type="button"
            role="tab"
            aria-selected={period === p.k}
            className={`${styles.period} ${period === p.k ? styles.periodActive : ""}`}
            onClick={() => setPeriod(p.k)}
          >
            <span className={styles.periodLabel}>{p.label}</span>
            <span className={styles.periodSub}>{p.sub}</span>
          </button>
        ))}
      </div>

      {locked ? (
        <PremiumGate
          feature="In-Depth Readings"
          teaser="Long-form horoscopes that read your entire chart, including Chiron, Lilith, the asteroids, the Vertex, and minor aspects, with timing windows, shadow work, and journal prompts for each period."
        >
          {null}
        </PremiumGate>
      ) : q.isFetching && !h ? (
        <CodexPanel glow>
          <div className={styles.loading}>
            <div className={styles.orb} aria-hidden />
            <p className={styles.loadingText}>
              {depth === "deep" ? "The Oracle is reading every point of your chart. An in-depth reading takes up to a minute…" : "The Oracle is reading the heavens for you…"}
            </p>
            <Skeleton className={styles.sk1} />
            <Skeleton className={styles.sk2} />
            <Skeleton className={styles.sk2} />
            <Skeleton className={styles.sk3} />
          </div>
        </CodexPanel>
      ) : err ? (
        <CodexPanel>
          <p className={styles.errorText}>
            {err.code === "OUT_OF_CREDITS"
              ? "The Oracle is silent for now. Please return a little later."
              : err.message || "The stars clouded over. Please try again."}
          </p>
          {err.code !== "OUT_OF_CREDITS" && (
            <Button variant="outline" onClick={() => q.refetch()}>
              <RefreshCw size={16} /> Ask again
            </Button>
          )}
        </CodexPanel>
      ) : h ? (
        <article className={styles.scroll} key={`${h.period}-${h.periodKey}`}>
          <header className={styles.head}>
            <p className={styles.eyebrow}>{h.label}</p>
            <h2 className={styles.title}>{h.content.title}</h2>
            <p className={styles.epigraph}>{h.content.epigraph}</p>
            <div className={styles.rule} aria-hidden>✶</div>
          </header>

          <div className={styles.overview}>
            {h.content.overview.split(/\n\s*\n/).map((para, i) => (
              <p key={i} className={i === 0 ? styles.dropcap : undefined}>{para}</p>
            ))}
          </div>

          <div className={styles.triple}>
            <CodexPanel eyebrow="☉ The Stars" title="Astrological weather">
              <p className={styles.prose}>{h.content.stars}</p>
            </CodexPanel>
            <CodexPanel eyebrow="◈ The Design" title="Your energetic current">
              <p className={styles.prose}>{h.content.design}</p>
            </CodexPanel>
            <CodexPanel eyebrow="∞ The Numbers" title="The cycle's cadence">
              <p className={styles.prose}>{h.content.numbers}</p>
            </CodexPanel>
          </div>

          {h.content.chapters && h.content.chapters.length > 0 && (
            <div className={styles.chapters}>
              {h.content.chapters.map((c, i) => (
                <section key={i} className={styles.chapter}>
                  <span className={styles.chapterNum}>{["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][i] ?? i + 1}</span>
                  <h3 className={styles.chapterTitle}>{c.heading}</h3>
                  {c.body.split(/\n\s*\n/).map((p, j) => (
                    <p key={j} className={styles.prose}>{p}</p>
                  ))}
                </section>
              ))}
            </div>
          )}

          {h.content.timing && h.content.timing.length > 0 && (
            <CodexPanel eyebrow="Windows of Time" title="When to act, when to wait">
              <ol className={styles.timeline}>
                {h.content.timing.map((t, i) => (
                  <li key={i}>
                    <span className={styles.when}>{t.when}</span>
                    <span>{t.guidance}</span>
                  </li>
                ))}
              </ol>
            </CodexPanel>
          )}

          {h.content.shadowWork && (
            <div className={styles.deepPair}>
              <CodexPanel eyebrow="⚸ Shadow Work" title="What asks to be met">
                <p className={styles.prose}>{h.content.shadowWork}</p>
              </CodexPanel>
              {h.content.journalPrompts && (
                <CodexPanel eyebrow="For the Journal" title="Questions to sit with">
                  <ul className={styles.prompts}>
                    {h.content.journalPrompts.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </CodexPanel>
              )}
            </div>
          )}

          <div className={styles.realms}>
            {[
              { t: "Love & Kinship", v: h.content.love, g: "♀︎" },
              { t: "Work & Purpose", v: h.content.work, g: "♄" },
              { t: "Spirit & Body", v: h.content.spirit, g: "☽" },
            ].map((r) => (
              <div key={r.t} className={styles.realm}>
                <span className={styles.realmGlyph}>{r.g}</span>
                <h4>{r.t}</h4>
                <p>{r.v}</p>
              </div>
            ))}
          </div>

          {h.content.keyTransits.length > 0 && (
            <CodexPanel eyebrow="Celestial Currents" title="Key transits">
              <ul className={styles.transits}>
                {h.content.keyTransits.map((t, i) => (
                  <li key={i}>
                    <span className={styles.transitName}>{t.transit}</span>
                    <span>{t.meaning}</span>
                  </li>
                ))}
              </ul>
            </CodexPanel>
          )}

          <div className={styles.closing}>
            <CodexPanel eyebrow="A Small Ritual" className={styles.ritual}>
              <p className={styles.prose}>{h.content.ritual}</p>
              <p className={styles.color}>Auspicious hue · <em>{h.content.auspiciousColor}</em></p>
            </CodexPanel>
            <div className={styles.mantra}>
              <span className={styles.mantraLabel}>Mantra</span>
              <p>“{h.content.mantra}”</p>
            </div>
          </div>
        </article>
      ) : null}
    </div>
  );
};
