import React, { useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import type { AcgLine } from "../helpers/astroCartography";
import { PLANET_COLORS } from "./NatalSphere3D";
import { AstroMap2D } from "./AstroMap2D";
import { ViewModeToggle } from "./ViewModeToggle";
import { useChartMode } from "../helpers/useChartMode";
import styles from "./AstroGlobe.module.css";

type PathDatum = { key: string; line: AcgLine; points: [number, number][] };

interface AstroGlobeProps {
  lines: AcgLine[];
  birthplace: { lat: number; lng: number; label: string } | null;
  selected: { lat: number; lng: number; label: string } | null;
  activeLineId: string | null;
  onLineClick: (line: AcgLine) => void;
  onGlobeClick: (lat: number, lng: number) => void;
  className?: string;
}

function webglOk() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export const AstroGlobe = ({ lines, birthplace, selected, activeLineId, onLineClick, onGlobeClick, className }: AstroGlobeProps) => {
  const wrap = useRef<HTMLDivElement>(null);
  const globe = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<string | null>(null);
  const [ok] = useState(() => webglOk());
  const [mode, setMode] = useChartMode();
  const [ready, setReady] = useState(false);
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    if (mode !== "3d" || !ok) return;
    setStalled(false);
    const t = window.setTimeout(() => {
      if (!readyRef.current) {
        console.warn("[Codex3D] globe not ready after 8s; switching to flat map");
        setStalled(true);
      }
    }, 8000);
    return () => window.clearTimeout(t);
  }, [mode, ok]);
  const readyRef = useRef(false);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    if (!wrap.current) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(wrap.current);
    return () => ro.disconnect();
    // re-attach when switching between flat map and globe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, stalled]);

  useEffect(() => {
    const g = globe.current;
    if (!g) return;
    const controls = g.controls() as { autoRotate: boolean; autoRotateSpeed: number };
    controls.autoRotate = !selected;
    controls.autoRotateSpeed = 0.35;
    const target = selected ?? birthplace;
    if (target) g.pointOfView({ lat: target.lat, lng: target.lng, altitude: selected ? 1.4 : 2.2 }, 1600);
  }, [selected, birthplace, size.w]);

  const paths = useMemo<PathDatum[]>(
    () => lines.flatMap((line) => line.segments.map((points, i) => ({ key: `${line.id}-${i}`, line, points }))),
    [lines]
  );

  const markers = useMemo(() => {
    const m: { lat: number; lng: number; label: string; kind: "birth" | "sel" }[] = [];
    if (birthplace) m.push({ ...birthplace, kind: "birth" });
    if (selected) m.push({ ...selected, kind: "sel" });
    return m;
  }, [birthplace, selected]);

  if (mode === "2d" || !ok || stalled) {
    return (
      <div className={`${styles.stage} ${styles.flat} ${className ?? ""}`}>
        <AstroMap2D
          lines={lines}
          birthplace={birthplace}
          selected={selected}
          activeLineId={activeLineId}
          onLineClick={onLineClick}
          onMapClick={onGlobeClick}
        />
        <ViewModeToggle mode={mode === "3d" && (stalled || !ok) ? "2d" : mode} onChange={(m) => { setStalled(false); setMode(m); }} />
      </div>
    );
  }

  const emphasis = (d: PathDatum) => d.line.id === activeLineId || d.line.id === hover;

  return (
    <div ref={wrap} className={`${styles.stage} ${className ?? ""}`}>
      {size.w > 0 && (
        <Globe
          ref={globe}
          onGlobeReady={() => {
            console.info("[Codex3D] globe ready");
            setReady(true);
          }}
          width={size.w}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="/_cdn/static/earth-night.jpg"
          bumpImageUrl="/_cdn/static/earth-topology.png"
          showAtmosphere
          atmosphereColor="#8b6fe0"
          atmosphereAltitude={0.2}
          pathsData={paths}
          pathPoints="points"
          pathPointLat={(p: [number, number]) => p[0]}
          pathPointLng={(p: [number, number]) => p[1]}
          pathPointAlt={0.004}
          pathColor={(d: object) => {
            const p = d as PathDatum;
            const c = PLANET_COLORS[p.line.planet];
            const dim = activeLineId && !emphasis(p);
            return dim ? `${c}55` : c;
          }}
          pathStroke={(d: object) => (emphasis(d as PathDatum) ? 3.2 : 1.4)}
          pathDashLength={(d: object) => ((d as PathDatum).line.angle === "ASC" || (d as PathDatum).line.angle === "MC" ? 1 : 0.02)}
          pathDashGap={(d: object) => ((d as PathDatum).line.angle === "ASC" || (d as PathDatum).line.angle === "MC" ? 0 : 0.012)}
          pathTransitionDuration={0}
          pathLabel={(d: object) => {
            const p = d as PathDatum;
            return `<div style="font-family:Cormorant Garamond,serif;font-size:16px;color:#ece6d6;background:rgba(7,7,26,.85);border:1px solid rgba(217,185,106,.4);padding:4px 10px;border-radius:8px">${p.line.glyph} ${p.line.name} · ${p.line.angle}</div>`;
          }}
          onPathHover={(d: object | null) => setHover(d ? (d as PathDatum).line.id : null)}
          onPathClick={(d: object) => onLineClick((d as PathDatum).line)}
          onGlobeClick={({ lat, lng }: { lat: number; lng: number }) => onGlobeClick(lat, lng)}
          ringsData={markers}
          ringLat="lat"
          ringLng="lng"
          ringColor={(d: object) => ((d as { kind: string }).kind === "sel" ? () => "rgba(217,185,106,0.9)" : () => "rgba(236,230,214,0.6)")}
          ringMaxRadius={3}
          ringPropagationSpeed={1.5}
          ringRepeatPeriod={1400}
          labelsData={markers}
          labelLat="lat"
          labelLng="lng"
          labelText={(d: object) => ((d as { kind: string; label: string }).kind === "birth" ? "✶ Birthplace" : (d as { label: string }).label.split(",")[0])}
          labelSize={0.9}
          labelDotRadius={0.35}
          labelColor={() => "#f2d58a"}
          labelResolution={3}
        />
      )}
      <ViewModeToggle mode={mode} onChange={setMode} />
    </div>
  );
};
