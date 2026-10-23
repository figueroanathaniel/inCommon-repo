import React, { useMemo } from "react";
import { CHANNELS, CenterKey, GATE_CENTER, HumanDesignChart } from "../helpers/humanDesignEngine";
import styles from "./Bodygraph2D.module.css";

type Shape = "triUp" | "triDown" | "square" | "diamond" | "triRight" | "triLeft" | "triSmall";
const CENTERS: Record<CenterKey, { pos: [number, number]; shape: Shape; size: number; label: string }> = {
  head: { pos: [0, 4.35], shape: "triUp", size: 0.62, label: "Head" },
  ajna: { pos: [0, 2.95], shape: "triDown", size: 0.62, label: "Ajna" },
  throat: { pos: [0, 1.45], shape: "square", size: 0.52, label: "Throat" },
  g: { pos: [0, -0.2], shape: "diamond", size: 0.66, label: "G" },
  heart: { pos: [1.2, -0.85], shape: "triSmall", size: 0.36, label: "Heart" },
  spleen: { pos: [-2.55, -2.35], shape: "triRight", size: 0.6, label: "Spleen" },
  solarPlexus: { pos: [2.55, -2.35], shape: "triLeft", size: 0.6, label: "Solar Plexus" },
  sacral: { pos: [0, -2.55], shape: "square", size: 0.55, label: "Sacral" },
  root: { pos: [0, -4.25], shape: "square", size: 0.55, label: "Root" },
};

const S = 46;
const X = (x: number) => 200 + x * S;
const Y = (y: number) => 235 - y * S;

function shapePts(kind: Shape, s: number): [number, number][] {
  return kind === "triUp"
    ? [[0, s], [-s, -s * 0.65], [s, -s * 0.65]]
    : kind === "triDown"
      ? [[0, -s], [s, s * 0.65], [-s, s * 0.65]]
      : kind === "triRight"
        ? [[s, 0], [-s * 0.65, s], [-s * 0.65, -s]]
        : kind === "triLeft"
          ? [[-s, 0], [s * 0.65, -s], [s * 0.65, s]]
          : kind === "triSmall"
            ? [[s, s * 0.2], [-s, s * 0.9], [-s * 0.3, -s]]
            : kind === "diamond"
              ? [[0, s], [s, 0], [0, -s], [-s, 0]]
              : [[-s, -s], [s, -s], [s, s], [-s, s]];
}

const COLORS = { personality: "#f1ead8", design: "#e0526a", both: "#f2d58a", off: "#2e2a58" };

export const Bodygraph2D = ({
  chart,
  selected,
  onSelect,
  showGates = true,
}: {
  chart: HumanDesignChart;
  selected: CenterKey | null;
  onSelect: (c: CenterKey | null) => void;
  showGates?: boolean;
}) => {
  const status = (g: number): keyof typeof COLORS => {
    const p = chart.personalityGates.has(g);
    const d = chart.designGates.has(g);
    return p && d ? "both" : p ? "personality" : d ? "design" : "off";
  };
  const channels = useMemo(() => {
    const groups = new Map<string, [number, number][]>();
    for (const ch of CHANNELS) {
      const k = [GATE_CENTER[ch[0]], GATE_CENTER[ch[1]]].sort().join("|");
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(ch);
    }
    const out: { ch: [number, number]; a: [number, number]; b: [number, number] }[] = [];
    for (const list of groups.values()) {
      list.forEach((ch, i) => {
        const ca = CENTERS[GATE_CENTER[ch[0]]].pos;
        const cb = CENTERS[GATE_CENTER[ch[1]]].pos;
        const dx = cb[0] - ca[0];
        const dy = cb[1] - ca[1];
        const len = Math.hypot(dx, dy) || 1;
        const off = (i - (list.length - 1) / 2) * 0.24;
        const px = (-dy / len) * off;
        const py = (dx / len) * off;
        out.push({ ch, a: [ca[0] + px, ca[1] + py], b: [cb[0] + px, cb[1] + py] });
      });
    }
    return out;
  }, []);
  const defined = new Set(chart.definedChannels.map((c) => c.join("-")));

  return (
    <svg viewBox="0 0 400 470" className={styles.svg} onClick={() => onSelect(null)}>
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8b6fe0" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#05051a" stopOpacity="0" />
        </radialGradient>
        <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="200" cy="235" rx="190" ry="225" fill="url(#bgGlow)" />
      {channels.map(({ ch, a, b }) => {
        const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const sa = status(ch[0]);
        const sb = status(ch[1]);
        const full = defined.has(ch.join("-"));
        const w = (s: string) => (s === "off" ? 2 : full ? 5 : 3.5);
        const la: [number, number] = [a[0] + (b[0] - a[0]) * 0.22, a[1] + (b[1] - a[1]) * 0.22];
        const lb: [number, number] = [a[0] + (b[0] - a[0]) * 0.78, a[1] + (b[1] - a[1]) * 0.78];
        return (
          <g key={ch.join("-")}>
            <line x1={X(a[0])} y1={Y(a[1])} x2={X(mid[0])} y2={Y(mid[1])} stroke={COLORS[sa]} strokeWidth={w(sa)} strokeLinecap="round" opacity={sa === "off" ? 0.6 : 1} />
            <line x1={X(mid[0])} y1={Y(mid[1])} x2={X(b[0])} y2={Y(b[1])} stroke={COLORS[sb]} strokeWidth={w(sb)} strokeLinecap="round" opacity={sb === "off" ? 0.6 : 1} />
            {showGates && sa !== "off" && <GateTag x={X(la[0])} y={Y(la[1])} n={ch[0]} color={COLORS[sa]} />}
            {showGates && sb !== "off" && <GateTag x={X(lb[0])} y={Y(lb[1])} n={ch[1]} color={COLORS[sb]} />}
          </g>
        );
      })}
      {(Object.keys(CENTERS) as CenterKey[]).map((c) => {
        const { pos, shape, size, label } = CENTERS[c];
        const def = chart.definedCenters.has(c);
        const sel = selected === c;
        const pts = shapePts(shape, size * 1.12)
          .map(([x, y]) => `${X(pos[0] + x)},${Y(pos[1] + y)}`)
          .join(" ");
        return (
          <g
            key={c}
            className={styles.center}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(c);
            }}
          >
            <polygon
              points={pts}
              fill={def ? "#d9b96a" : "rgba(26,24,64,0.85)"}
              stroke={sel ? "#fff3c8" : "#d9b96a"}
              strokeWidth={sel ? 2.4 : 1.2}
              strokeLinejoin="round"
              filter={def || sel ? "url(#goldGlow)" : undefined}
            />
            <text x={X(pos[0])} y={Y(pos[1]) + (shape === "triUp" ? 8 : shape === "triDown" ? -6 : 3)} className={`${styles.label} ${def ? styles.labelDef : ""}`} textAnchor="middle">
              {label === "Solar Plexus" ? "SP" : label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

function GateTag({ x, y, n, color }: { x: number; y: number; n: number; color: string }) {
  return (
    <g pointerEvents="none">
      <rect x={x - 9} y={y - 7} width={18} height={14} rx={3} fill="#07071a" stroke={color} strokeWidth={0.8} />
      <text x={x} y={y + 3.5} fill={color} className={styles.gate} textAnchor="middle">
        {n}
      </text>
    </g>
  );
}
