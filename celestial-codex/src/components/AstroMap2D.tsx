import React, { useRef } from "react";
import type { AcgLine } from "../helpers/astroCartography";
import { PLANET_COLORS } from "./NatalSphere3D";
import styles from "./AstroMap2D.module.css";

const W = 720;
const H = 360;
const px = (lng: number) => ((lng + 180) / 360) * W;
const py = (lat: number) => ((90 - lat) / 180) * H;

/** Flat equirectangular astrocartography map (phones / no-WebGL). */
export const AstroMap2D = ({
  lines,
  birthplace,
  selected,
  activeLineId,
  onLineClick,
  onMapClick,
}: {
  lines: AcgLine[];
  birthplace: { lat: number; lng: number } | null;
  selected: { lat: number; lng: number } | null;
  activeLineId: string | null;
  onLineClick: (l: AcgLine) => void;
  onMapClick: (lat: number, lng: number) => void;
}) => {
  const svg = useRef<SVGSVGElement>(null);
  const click = (e: React.MouseEvent) => {
    const el = svg.current;
    if (!el) return;
    const pt = el.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = el.getScreenCTM();
    if (!m) return;
    const p = pt.matrixTransform(m.inverse());
    const lng = (p.x / W) * 360 - 180;
    const lat = 90 - (p.y / H) * 180;
    if (Math.abs(lat) <= 85) onMapClick(lat, lng);
  };

  return (
    <div className={styles.wrap}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className={styles.svg} onClick={click}>
        <image href="/_cdn/static/earth-night.jpg" x="0" y="0" width={W} height={H} preserveAspectRatio="none" opacity="0.9" />
        <rect x="0" y="0" width={W} height={H} fill="#07071a" opacity="0.25" />
        {[-60, -30, 0, 30, 60].map((lat) => (
          <line key={lat} x1="0" x2={W} y1={py(lat)} y2={py(lat)} stroke="#d9b96a" strokeOpacity={lat === 0 ? 0.25 : 0.1} />
        ))}
        {lines.flatMap((l) =>
          l.segments.map((seg, i) => {
            const active = l.id === activeLineId;
            const dim = !!activeLineId && !active;
            const d = seg.map(([lat, lng], j) => `${j ? "L" : "M"}${px(lng).toFixed(1)},${py(lat).toFixed(1)}`).join(" ");
            return (
              <g key={`${l.id}-${i}`}>
                <path d={d} fill="none" stroke="transparent" strokeWidth={12} className={styles.hit} onClick={(e) => { e.stopPropagation(); onLineClick(l); }} />
                <path
                  d={d}
                  fill="none"
                  stroke={PLANET_COLORS[l.planet]}
                  strokeWidth={active ? 3 : 1.4}
                  strokeOpacity={dim ? 0.25 : 0.95}
                  strokeDasharray={l.angle === "DSC" || l.angle === "IC" ? "5 4" : undefined}
                  pointerEvents="none"
                />
              </g>
            );
          })
        )}
        {birthplace && (
          <g pointerEvents="none">
            <circle cx={px(birthplace.lng)} cy={py(birthplace.lat)} r="4" fill="#ece6d6" />
            <text x={px(birthplace.lng) + 7} y={py(birthplace.lat) + 3} className={styles.mark}>✶ Birth</text>
          </g>
        )}
        {selected && (
          <g pointerEvents="none">
            <circle cx={px(selected.lng)} cy={py(selected.lat)} r="9" fill="none" stroke="#d9b96a" strokeWidth="1.5" className={styles.pulse} />
            <circle cx={px(selected.lng)} cy={py(selected.lat)} r="3.5" fill="#d9b96a" />
          </g>
        )}
      </svg>
    </div>
  );
};
