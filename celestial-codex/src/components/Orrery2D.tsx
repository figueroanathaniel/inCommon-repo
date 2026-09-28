import React, { useEffect, useState } from "react";
import type { OrreryItem } from "./NumerologyOrrery3D";
import styles from "./Orrery2D.module.css";

const COLORS = ["#f2d58a", "#b69cf5", "#84dbe4", "#f2b6cb", "#9fd8a8", "#eab47c", "#8fa8e8", "#e8685a"];
const RADII = [78, 118, 158];

/** Flat animated orrery: the first item sits at the heart; the rest orbit slowly. */
export const Orrery2D = ({ items, selected, onSelect }: { items: OrreryItem[]; selected: string | null; onSelect: (k: string | null) => void }) => {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (selected) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      setT((v) => v + (now - last) / 1000);
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selected]);

  const [center, ...rest] = items;
  return (
    <svg viewBox="0 0 400 400" className={styles.svg} onClick={() => onSelect(null)}>
      <defs>
        <radialGradient id="orrCore" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fff3c8" />
          <stop offset="45%" stopColor="#d9b96a" />
          <stop offset="100%" stopColor="#3b2a86" />
        </radialGradient>
        <filter id="orrGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {RADII.map((r) => (
        <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#d9b96a" strokeOpacity="0.18" strokeDasharray="2 4" />
      ))}
      <g className={styles.body} onClick={(e) => { e.stopPropagation(); onSelect(center.key); }}>
        <circle cx="200" cy="200" r={selected === center.key ? 40 : 36} fill="url(#orrCore)" filter="url(#orrGlow)" />
        <text x="200" y="208" textAnchor="middle" className={styles.coreNum}>{center.value}</text>
        <text x="200" y="252" textAnchor="middle" className={styles.name}>{center.label}</text>
      </g>
      {rest.map((item, i) => {
        const r = RADII[i % 3];
        const speed = 0.12 - (i % 3) * 0.03;
        const a = (i / rest.length) * Math.PI * 2 + t * speed;
        const x = 200 + Math.cos(a) * r;
        const y = 200 + Math.sin(a) * r * 0.92;
        const color = COLORS[(i + 1) % COLORS.length];
        const sel = selected === item.key;
        return (
          <g key={item.key} className={styles.body} onClick={(e) => { e.stopPropagation(); onSelect(item.key); }}>
            <circle cx={x} cy={y} r={sel ? 20 : 16} fill="#0b0a26" stroke={color} strokeWidth={sel ? 2 : 1.2} filter={sel ? "url(#orrGlow)" : undefined} />
            <text x={x} y={y + 6} textAnchor="middle" className={styles.num} fill={color}>{item.value}</text>
            <text x={x} y={y + 32} textAnchor="middle" className={styles.name}>{item.label}</text>
          </g>
        );
      })}
    </svg>
  );
};
