import React from "react";
import { NatalChart, SIGN_GLYPHS } from "../helpers/astroEngine";
import { PLANET_COLORS, ASPECT_COLORS, type ChartSelection } from "./NatalSphere3D";
import styles from "./NatalWheel2D.module.css";

/** Flat SVG natal wheel: used where WebGL is unavailable. Same tap-to-select behavior as the 3D sphere. */
export const NatalWheel2D = ({
  chart,
  selected,
  onSelect,
  className,
}: {
  chart: NatalChart;
  selected?: ChartSelection;
  onSelect?: (s: ChartSelection) => void;
  className?: string;
}) => {
  const offset = chart.ascendant ?? 0;
  const pt = (lon: number, r: number) => {
    const a = ((lon - offset + 180) * Math.PI) / 180;
    return [200 + Math.cos(a) * r, 200 - Math.sin(a) * r] as const;
  };
  const sorted = [...chart.planets].sort((a, b) => a.longitude - b.longitude);
  const tiers: Record<string, number> = {};
  let prev = -99;
  let tier = 0;
  for (const p of sorted) {
    tier = p.longitude - prev < 7 ? (tier + 1) % 3 : 0;
    tiers[p.key] = tier;
    prev = p.longitude;
  }
  const selPlanet = selected?.kind === "planet" ? selected.key : null;

  return (
    <div className={`${styles.wrap} ${className ?? ""}`}>
      <svg viewBox="0 0 400 400" className={styles.svg} onClick={() => onSelect?.(null)}>
        <defs>
          <radialGradient id="wheelGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b2a86" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#05051a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="195" fill="url(#wheelGlow)" />
        <circle cx="200" cy="200" r="190" className={styles.ring} />
        <circle cx="200" cy="200" r="160" className={styles.ring} />
        <circle cx="200" cy="200" r="60" className={styles.ringFaint} />
        {Array.from({ length: 12 }, (_, i) => {
          const [x1, y1] = pt(i * 30, 160);
          const [x2, y2] = pt(i * 30, 190);
          const [gx, gy] = pt(i * 30 + 15, 175);
          const active = selected?.kind === "sign" && selected.index === i;
          return (
            <g key={i} onClick={(e) => { e.stopPropagation(); onSelect?.({ kind: "sign", index: i }); }} className={styles.clickable}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} className={styles.ring} />
              <text x={gx} y={gy} className={`${styles.signGlyph} ${active ? styles.active : ""}`} textAnchor="middle" dominantBaseline="central">
                {SIGN_GLYPHS[i]}
              </text>
            </g>
          );
        })}
        {chart.houseCusps?.map((c, i) => {
          const [x1, y1] = pt(c, 60);
          const [x2, y2] = pt(c, 160);
          const angular = i % 3 === 0;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={angular ? styles.angle : styles.cusp} />;
        })}
        {chart.aspects.map((a, i) => {
          const pa = chart.planets.find((p) => p.key === a.a)!;
          const pb = chart.planets.find((p) => p.key === a.b)!;
          const [x1, y1] = pt(pa.longitude, 60);
          const [x2, y2] = pt(pb.longitude, 60);
          const involved = !selPlanet || a.a === selPlanet || a.b === selPlanet;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ASPECT_COLORS[a.type]} strokeOpacity={involved ? 0.7 : 0.08} strokeWidth={involved && selPlanet ? 1.6 : 0.8} />;
        })}
        {chart.planets.map((p) => {
          const r = 138 - tiers[p.key] * 22;
          const [x, y] = pt(p.longitude, r);
          const [tx, ty] = pt(p.longitude, 160);
          const on = selPlanet === p.key;
          return (
            <g key={p.key} onClick={(e) => { e.stopPropagation(); onSelect?.({ kind: "planet", key: p.key }); }} className={styles.clickable} opacity={selPlanet && !on ? 0.4 : 1}>
              <line x1={x} y1={y} x2={tx} y2={ty} stroke={PLANET_COLORS[p.key]} strokeOpacity="0.35" strokeDasharray="2 2" />
              <circle cx={x} cy={y} r={on ? 13 : 11} fill="#0b0a26" stroke={PLANET_COLORS[p.key]} strokeWidth={on ? 1.6 : 0.8} />
              <text x={x} y={y} fill={PLANET_COLORS[p.key]} className={styles.planetGlyph} textAnchor="middle" dominantBaseline="central">
                {p.glyph}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
