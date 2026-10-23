import React, { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, Html, Line, OrbitControls, Sparkles, Stars } from "@react-three/drei";
import * as THREE from "three";
import { CHANNELS, CenterKey, GATE_CENTER, HumanDesignChart } from "../helpers/humanDesignEngine";
import { useGlowTexture } from "../helpers/useGlowTexture";
import { SafeCanvas } from "./SafeCanvas";
import { Bodygraph2D } from "./Bodygraph2D";
import { ViewModeToggle } from "./ViewModeToggle";
import { useChartMode } from "../helpers/useChartMode";
import styles from "./Bodygraph3D.module.css";

type ShapeKind = "triUp" | "triDown" | "square" | "diamond" | "triRight" | "triLeft" | "triSmall";

const CENTERS: Record<CenterKey, { pos: [number, number]; shape: ShapeKind; size: number }> = {
  head: { pos: [0, 4.35], shape: "triUp", size: 0.62 },
  ajna: { pos: [0, 2.95], shape: "triDown", size: 0.62 },
  throat: { pos: [0, 1.45], shape: "square", size: 0.52 },
  g: { pos: [0, -0.2], shape: "diamond", size: 0.66 },
  heart: { pos: [1.2, -0.85], shape: "triSmall", size: 0.36 },
  spleen: { pos: [-2.55, -2.35], shape: "triRight", size: 0.6 },
  solarPlexus: { pos: [2.55, -2.35], shape: "triLeft", size: 0.6 },
  sacral: { pos: [0, -2.55], shape: "square", size: 0.55 },
  root: { pos: [0, -4.25], shape: "square", size: 0.55 },
};

function makeShape(kind: ShapeKind, s: number) {
  const sh = new THREE.Shape();
  const pts: [number, number][] =
    kind === "triUp"
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
  sh.moveTo(pts[0][0], pts[0][1]);
  pts.slice(1).forEach(([x, y]) => sh.lineTo(x, y));
  sh.closePath();
  return sh;
}

const GATE_COLORS = { personality: "#f1ead8", design: "#e0526a", both: "#f2d58a", off: "#2e2a58" };

function gateStatus(chart: HumanDesignChart, gate: number): keyof typeof GATE_COLORS {
  const p = chart.personalityGates.has(gate);
  const d = chart.designGates.has(gate);
  return p && d ? "both" : p ? "personality" : d ? "design" : "off";
}

function CenterMesh({
  centerKey,
  defined,
  selected,
  onSelect,
  glow,
}: {
  centerKey: CenterKey;
  defined: boolean;
  selected: boolean;
  onSelect: () => void;
  glow: THREE.Texture;
}) {
  const { pos, shape, size } = CENTERS[centerKey];
  const geom = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(makeShape(shape, size), {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3,
    });
    g.center();
    return g;
  }, [shape, size]);
  const [hover, setHover] = useState(false);
  const halo = useRef<THREE.Sprite>(null);
  const phase = useMemo(() => Math.random() * 6, []);
  useFrame(({ clock }) => {
    if (!halo.current) return;
    const t = clock.getElapsedTime();
    const base = size * (defined ? 4.2 : 2.6) * (selected ? 1.35 : hover ? 1.15 : 1);
    const s = base * (1 + Math.sin(t * 1.4 + phase) * 0.06);
    halo.current.scale.set(s, s, s);
  });

  return (
    <group position={[pos[0], pos[1], 0]}>
      <sprite ref={halo} position={[0, 0, -0.2]}>
        <spriteMaterial
          map={glow}
          color={defined ? "#d9b96a" : "#6f5fd0"}
          transparent
          opacity={defined ? 0.55 : 0.18}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <mesh
        geometry={geom}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <meshStandardMaterial
          color={defined ? "#d9b96a" : "#1a1840"}
          emissive={defined ? "#b8913e" : "#2a2466"}
          emissiveIntensity={defined ? (selected ? 1.1 : 0.55) : selected ? 0.8 : 0.25}
          metalness={defined ? 0.75 : 0.1}
          roughness={defined ? 0.28 : 0.15}
          transparent
          opacity={defined ? 1 : 0.55}
        />
        <Edges color={selected || hover ? "#fff3c8" : "#d9b96a"} threshold={15} />
      </mesh>
    </group>
  );
}

function Scene({
  chart,
  selected,
  onSelect,
  showGates,
}: {
  chart: HumanDesignChart;
  selected: CenterKey | null;
  onSelect: (c: CenterKey | null) => void;
  showGates: boolean;
}) {
  const glow = useGlowTexture();
  const group = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.rotation.y = Math.sin(t * 0.25) * 0.35;
    group.current.position.y = Math.sin(t * 0.6) * 0.08;
  });

  const channelGeo = useMemo(() => {
    // Offset parallel channels between the same pair of centers so they don't overlap
    const groups = new Map<string, [number, number][]>();
    for (const ch of CHANNELS) {
      const k = [GATE_CENTER[ch[0]], GATE_CENTER[ch[1]]].sort().join("|");
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(ch);
    }
    const out: { ch: [number, number]; a: THREE.Vector3; b: THREE.Vector3 }[] = [];
    for (const list of groups.values()) {
      list.forEach((ch, i) => {
        const ca = CENTERS[GATE_CENTER[ch[0]]].pos;
        const cb = CENTERS[GATE_CENTER[ch[1]]].pos;
        const dir = new THREE.Vector2(cb[0] - ca[0], cb[1] - ca[1]).normalize();
        const perp = new THREE.Vector2(-dir.y, dir.x);
        const off = (i - (list.length - 1) / 2) * 0.24;
        out.push({
          ch,
          a: new THREE.Vector3(ca[0] + perp.x * off, ca[1] + perp.y * off, -0.05),
          b: new THREE.Vector3(cb[0] + perp.x * off, cb[1] + perp.y * off, -0.05),
        });
      });
    }
    return out;
  }, []);

  const definedSet = useMemo(() => new Set(chart.definedChannels.map((c) => c.join("-"))), [chart]);

  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight position={[3, 5, 6]} intensity={60} color="#fff1cf" />
      <pointLight position={[-4, -3, 5]} intensity={35} color="#8b6fe0" />
      <Stars radius={60} depth={30} count={2500} factor={3} fade speed={0.5} />
      <Sparkles count={50} scale={[8, 11, 4]} size={2} speed={0.3} color="#d9b96a" opacity={0.5} />
      <group ref={group}>
        {channelGeo.map(({ ch, a, b }) => {
          const mid = a.clone().lerp(b, 0.5);
          const sa = gateStatus(chart, ch[0]);
          const sb = gateStatus(chart, ch[1]);
          const full = definedSet.has(ch.join("-"));
          const width = (s: string) => (s === "off" ? 1.5 : full ? 5 : 3.5);
          return (
            <group key={ch.join("-")}>
              <Line points={[a, mid]} color={GATE_COLORS[sa]} lineWidth={width(sa)} transparent opacity={sa === "off" ? 0.5 : 0.95} />
              <Line points={[mid, b]} color={GATE_COLORS[sb]} lineWidth={width(sb)} transparent opacity={sb === "off" ? 0.5 : 0.95} />
              {showGates && sa !== "off" && (
                <Html position={a.clone().lerp(b, 0.2).setZ(0.2)} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
                  <span className={`${styles.gate} ${styles[sa]}`}>{ch[0]}</span>
                </Html>
              )}
              {showGates && sb !== "off" && (
                <Html position={a.clone().lerp(b, 0.8).setZ(0.2)} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
                  <span className={`${styles.gate} ${styles[sb]}`}>{ch[1]}</span>
                </Html>
              )}
            </group>
          );
        })}
        {(Object.keys(CENTERS) as CenterKey[]).map((c) => (
          <CenterMesh
            key={c}
            centerKey={c}
            defined={chart.definedCenters.has(c)}
            selected={selected === c}
            onSelect={() => onSelect(c)}
            glow={glow}
          />
        ))}
      </group>
      <OrbitControls enablePan={false} enableDamping minDistance={7} maxDistance={20} />
    </>
  );
}

interface Bodygraph3DProps {
  chart: HumanDesignChart;
  selected: CenterKey | null;
  onSelect: (c: CenterKey | null) => void;
  className?: string;
}

export const Bodygraph3D = ({ chart, selected, onSelect, className }: Bodygraph3DProps) => {
  const [showGates, setShowGates] = useState(true);
  const [mode, setMode] = useChartMode();
  return (
    <div className={`${styles.stage} ${mode === "2d" ? styles.stage2d : ""} ${className ?? ""}`}>
      {mode === "2d" ? (
        <Bodygraph2D chart={chart} selected={selected} onSelect={onSelect} showGates={showGates} />
      ) : (
        <SafeCanvas
          fallback={<Bodygraph2D chart={chart} selected={selected} onSelect={onSelect} showGates={showGates} />}
          camera={{ position: [0, 0, 12.5], fov: 45 }}
          onPointerMissed={() => onSelect(null)}
        >
          <Scene chart={chart} selected={selected} onSelect={onSelect} showGates={showGates} />
        </SafeCanvas>
      )}
      <ViewModeToggle mode={mode} onChange={setMode} />
      <div className={styles.legend}>
        <span><i className={styles.swP} /> Personality</span>
        <span><i className={styles.swD} /> Design</span>
        <span><i className={styles.swB} /> Both</span>
      </div>
      <button type="button" className={`${styles.toggle} ${showGates ? styles.toggleOn : ""}`} onClick={() => setShowGates((v) => !v)}>
        Gates
      </button>
    </div>
  );
};
