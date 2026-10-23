import React, { useMemo, useState } from "react";
import { NatalSphere3D, PLANET_COLORS, type ChartSelection } from "./NatalSphere3D";
import { CodexPanel } from "./CodexPanel";
import { formatDegree, NatalChart, SIGN_GLYPHS, SIGN_NAMES } from "../helpers/astroEngine";
import { astroLore } from "../helpers/astroLore";
import styles from "./CodexStars.module.css";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export const CodexStars = ({ chart, className, aspectLimit = 10, tableTitle = "Planetary placements" }: { chart: NatalChart; className?: string; aspectLimit?: number; tableTitle?: string }) => {
  const [sel, setSel] = useState<ChartSelection>(null);

  const elements = useMemo(() => {
    const counts: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
    chart.planets
      .filter((p) => (p.kind ? p.kind === "planet" : p.key !== "northNode"))
      .forEach((p) => (counts[astroLore.signs[p.signIndex].element] += p.key === "sun" || p.key === "moon" ? 2 : 1));
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts).map(([k, v]) => ({ k, v, pct: Math.round((v / total) * 100) }));
  }, [chart]);

  return (
    <div className={`${styles.wrap} ${className ?? ""}`}>
      <div className={styles.stageRow}>
        <NatalSphere3D chart={chart} selected={sel} onSelect={setSel} className={styles.sphere} />
        <CodexPanel glow className={styles.reading}>
          <Reading chart={chart} sel={sel} onSelect={setSel} />
        </CodexPanel>
      </div>

      <div className={styles.lowerGrid}>
        <CodexPanel eyebrow="The Wanderers" title={tableTitle}>
          <div className={styles.table}>
            {chart.planets.map((p) => (
              <button
                type="button"
                key={p.key}
                className={`${styles.row} ${sel?.kind === "planet" && sel.key === p.key ? styles.rowActive : ""}`}
                onClick={() => setSel({ kind: "planet", key: p.key })}
              >
                <span className={styles.glyph} style={{ color: PLANET_COLORS[p.key] }}>{p.glyph}</span>
                <span className={styles.pname}>{p.name}</span>
                <span className={styles.deg}>{formatDegree(p.longitude)}{p.retrograde && p.key !== "northNode" ? " ℞" : ""}</span>
                <span className={styles.house}>{p.house ? ROMAN[p.house - 1] : "—"}</span>
              </button>
            ))}
            {chart.ascendant !== null && (
              <>
                <div className={styles.row}><span className={styles.glyph}>AC</span><span className={styles.pname}>Ascendant</span><span className={styles.deg}>{formatDegree(chart.ascendant)}</span><span className={styles.house}>I</span></div>
                <div className={styles.row}><span className={styles.glyph}>MC</span><span className={styles.pname}>Midheaven</span><span className={styles.deg}>{formatDegree(chart.midheaven!)}</span><span className={styles.house}>X</span></div>
              </>
            )}
          </div>
        </CodexPanel>

        <div className={styles.sideStack}>
          <CodexPanel eyebrow="Elemental Temperament" title="The four humors of your sky">
            <div className={styles.elements}>
              {elements.map((e) => (
                <div key={e.k} className={styles.element}>
                  <div className={styles.elHead}><span>{e.k}</span><span className={styles.elPct}>{e.pct}%</span></div>
                  <div className={styles.elBar}><span className={`${styles.elFill} ${styles[`el${e.k}`]}`} style={{ width: `${e.pct}%` }} /></div>
                </div>
              ))}
            </div>
            <p className={styles.note}>{astroLore.elements[[...elements].sort((a, b) => b.v - a.v)[0].k]}</p>
          </CodexPanel>

          <CodexPanel eyebrow="Celestial Conversations" title="Major aspects">
            <ul className={styles.aspects}>
              {[...chart.aspects].sort((a, b) => a.orb - b.orb).slice(0, aspectLimit).map((a, i) => {
                const pa = chart.planets.find((p) => p.key === a.a)!;
                const pb = chart.planets.find((p) => p.key === a.b)!;
                return (
                  <li key={i}>
                    <span className={styles.aspGlyph}>{astroLore.aspects[a.type].glyph}</span>
                    <span>{pa.name} <em>{astroLore.aspects[a.type].verb}</em> {pb.name}</span>
                    <span className={styles.orb}>{a.orb.toFixed(1)}°</span>
                  </li>
                );
              })}
            </ul>
          </CodexPanel>
        </div>
      </div>
    </div>
  );
};

function Reading({ chart, sel, onSelect }: { chart: NatalChart; sel: ChartSelection; onSelect: (s: ChartSelection) => void }) {
  if (sel?.kind === "planet") {
    const p = chart.planets.find((x) => x.key === sel.key)!;
    const sign = astroLore.signs[p.signIndex];
    const lore = astroLore.planets[p.key];
    const asps = chart.aspects.filter((a) => a.a === p.key || a.b === p.key);
    return (
      <div className={styles.readingInner} key={p.key}>
        <div className={styles.readingGlyph} style={{ color: PLANET_COLORS[p.key] }}>{p.glyph}</div>
        <p className={styles.eyebrow}>{lore.domain}</p>
        <h3 className={styles.readingTitle}>
          {p.name} in <em>{SIGN_NAMES[p.signIndex]}</em>
        </h3>
        <p className={styles.mono}>
          {formatDegree(p.longitude)}{p.house ? ` · House ${ROMAN[p.house - 1]}` : ""}{p.retrograde && p.key !== "northNode" ? " · Retrograde" : ""}
        </p>
        <p className={styles.prose}>{lore.prose}</p>
        <p className={styles.prose}>
          Clothed in {SIGN_NAMES[p.signIndex]}, <em>{sign.epithet.toLowerCase()}</em>, this light expresses itself through {sign.keywords.join(", ")}.
          {p.house ? ` It works within the ${astroLore.houses[p.house - 1].title}: ${astroLore.houses[p.house - 1].prose}.` : ""}
          {p.retrograde && p.key !== "northNode" ? " Being retrograde, its power turns inward first, asking to be reflected upon before it is expressed." : ""}
        </p>
        {asps.length > 0 && (
          <div className={styles.chips}>
            {asps.map((a, i) => {
              const other = chart.planets.find((x) => x.key === (a.a === p.key ? a.b : a.a))!;
              return (
                <button key={i} type="button" className={styles.chip} onClick={() => onSelect({ kind: "planet", key: other.key })}>
                  {astroLore.aspects[a.type].glyph} {astroLore.aspects[a.type].verb} {other.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  if (sel?.kind === "sign") {
    const s = astroLore.signs[sel.index];
    const inSign = chart.planets.filter((p) => p.signIndex === sel.index);
    return (
      <div className={styles.readingInner} key={`s${sel.index}`}>
        <div className={styles.readingGlyph}>{SIGN_GLYPHS[sel.index]}</div>
        <p className={styles.eyebrow}>{s.modality} {s.element} · Ruled by {s.ruler}</p>
        <h3 className={styles.readingTitle}>{SIGN_NAMES[sel.index]}, <em>{s.epithet}</em></h3>
        <p className={styles.prose}>{s.prose}</p>
        <p className={styles.mono}>{inSign.length ? `Dwelling here: ${inSign.map((p) => p.name).join(", ")}` : "No planets dwell here in your chart; its themes arrive through the house it rules."}</p>
      </div>
    );
  }
  if (sel?.kind === "house") {
    const h = astroLore.houses[sel.index];
    const cusp = chart.houseCusps![sel.index];
    const inHouse = chart.planets.filter((p) => p.house === sel.index + 1);
    return (
      <div className={styles.readingInner} key={`h${sel.index}`}>
        <div className={styles.readingGlyph}>{ROMAN[sel.index]}</div>
        <p className={styles.eyebrow}>House {ROMAN[sel.index]} · cusp {formatDegree(cusp)}</p>
        <h3 className={styles.readingTitle}><em>{h.title}</em></h3>
        <p className={styles.prose}>This chamber of your chart governs {h.prose}. Its door opens in {SIGN_NAMES[Math.floor(cusp / 30)]}, so you enter these matters with the manner of {astroLore.signs[Math.floor(cusp / 30)].keywords[0]}.</p>
        <p className={styles.mono}>{inHouse.length ? `Occupants: ${inHouse.map((p) => p.name).join(", ")}` : "An empty chamber, quiet but never idle."}</p>
      </div>
    );
  }
  const sun = chart.planets.find((p) => p.key === "sun")!;
  const moon = chart.planets.find((p) => p.key === "moon")!;
  const asc = chart.ascendant;
  return (
    <div className={styles.readingInner}>
      <p className={styles.eyebrow}>The Luminous Triad</p>
      <h3 className={styles.readingTitle}>Your <em>Big Three</em></h3>
      {[
        { g: "☉", label: "Sun", idx: sun.signIndex, note: "the self you are becoming", k: "sun" as const },
        { g: "☽", label: "Moon", idx: moon.signIndex, note: "the self that feels", k: "moon" as const },
        ...(asc !== null ? [{ g: "AC", label: "Rising", idx: Math.floor(asc / 30), note: "the self the world meets first", k: null }] : []),
      ].map((b) => (
        <button
          type="button"
          key={b.label}
          className={styles.triad}
          onClick={() => (b.k ? onSelect({ kind: "planet", key: b.k }) : onSelect({ kind: "sign", index: b.idx }))}
        >
          <span className={styles.triadGlyph}>{b.g}</span>
          <span>
            <strong>{b.label} in {SIGN_NAMES[b.idx]}</strong>
            <small>{b.note} · {astroLore.signs[b.idx].epithet}</small>
          </span>
        </button>
      ))}
      <p className={styles.hint}>Tap any planet, sign, or house in the sphere to read its story.</p>
    </div>
  );
}
