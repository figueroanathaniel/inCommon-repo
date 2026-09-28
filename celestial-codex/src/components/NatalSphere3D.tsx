import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls, Sparkles, Stars } from "@react-three/drei";
import * as THREE from "three";
import { Eye, Orbit, RotateCw, Spline, Home } from "lucide-react";
import {
  NatalChart,
  PlanetKey,
  SIGN_GLYPHS,
  SIGN_NAMES,
} from "../helpers/astroEngine";
import { useGlowTexture } from "../helpers/useGlowTexture";
import { SafeCanvas } from "./SafeCanvas";
import { NatalWheel2D } from "./NatalWheel2D";
import { ViewModeToggle } from "./ViewModeToggle";
import { useChartMode } from "../helpers/useChartMode";
import styles from "./NatalSphere3D.module.css";

export type ChartSelection =
  | { kind: "planet"; key: PlanetKey }
  | { kind: "sign"; index: number }
  | { kind: "house"; index: number }
  | null;

export const PLANET_COLORS: Record<PlanetKey, string> = {
  sun: "#f7cf6d",
  moon: "#e4e9f7",
  mercury: "#b9cad9",
  venus: "#f2b6cb",
  mars: "#e8685a",
  jupiter: "#eab47c",
  saturn: "#d6c08e",
  uranus: "#84dbe4",
  neptune: "#7392f2",
  pluto: "#a877dc",
  northNode: "#d9b96a",
  southNode: "#a8925a",
  lilith: "#c4506e",
  chiron: "#7fc8a9",
  ceres: "#c9d98a",
  pallas: "#9fb8e0",
  juno: "#e0a0d0",
  vesta: "#f0a860",
  eris: "#b0b0c8",
  vertex: "#e8e0c0",
  fortune: "#f2d58a",
  eastPoint: "#d0c8a0",
};

const ELEMENT_TINTS = ["#e8785a", "#8fbf7a", "#a6c8ec", "#7c7fe6"];
export const ASPECT_COLORS: Record<string, string> = {
  conjunction: "#f2d58a",
  sextile: "#7fd0c0",
  trine: "#8f7df0",
  square: "#e67a86",
  opposition: "#e89a6a",
  semisextile: "#9fd8c8",
  semisquare: "#d08aa0",
  quintile: "#c8b0f0",
  sesquiquadrate: "#d0907a",
  quincunx: "#b8c070",
};

const R_IN = 4.2;
const R_OUT = 5.05;
const R_PLANET = 3.45;

const polar = (angleDeg: number, r: number, y = 0): [number, number, number] => {
  const a = (angleDeg * Math.PI) / 180;
  return [Math.cos(a) * r, y, -Math.sin(a) * r];
};

const circlePoints = (r: number, seg = 160) =>
  Array.from({ length: seg + 1 }, (_, i) => polar((i / seg) * 360, r));

type SceneProps = {
  chart: NatalChart;
  selected: ChartSelection;
  onSelect: (s: ChartSelection) => void;
  showAspects: boolean;
  showHouses: boolean;
  autoRotate: boolean;
  view: "orbit" | "top";
  compact: boolean;
};

function CameraRig({ view, resetKey }: { view: "orbit" | "top"; resetKey: number }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 7.2, 9.8));
  const animating = useRef(true);
  useEffect(() => {
    if (view === "top") target.current.set(0, 14, 0.001);
    else target.current.set(0, 7.2, 9.8);
    animating.current = true;
  }, [view, resetKey]);
  useFrame(() => {
    if (!animating.current) return;
    camera.position.lerp(target.current, 0.07);
    camera.lookAt(0, 0, 0);
    if (camera.position.distanceTo(target.current) < 0.03) animating.current = false;
  });
  return null;
}

function Armillary() {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (a.current) a.current.rotation.z += dt * 0.05;
    if (b.current) b.current.rotation.x += dt * 0.035;
    if (core.current) {
      core.current.rotation.y += dt * 0.2;
      core.current.rotation.x += dt * 0.07;
    }
  });
  return (
    <group>
      <mesh ref={a} rotation={[Math.PI / 2.6, 0, 0]}>
        <torusGeometry args={[5.75, 0.008, 8, 200]} />
        <meshBasicMaterial color="#d9b96a" transparent opacity={0.35} />
      </mesh>
      <mesh ref={b} rotation={[0, Math.PI / 3, Math.PI / 2.2]}>
        <torusGeometry args={[5.95, 0.006, 8, 200]} />
        <meshBasicMaterial color="#8b6fe0" transparent opacity={0.3} />
      </mesh>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshBasicMaterial color="#d9b96a" wireframe transparent opacity={0.45} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#2a3f8f" emissive="#3b5bd6" emissiveIntensity={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

function ZodiacRing({
  offset,
  selected,
  onSelect,
  compact,
}: {
  offset: number;
  selected: ChartSelection;
  onSelect: (s: ChartSelection) => void;
  compact: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const ticks = useMemo(() => {
    const arr: number[] = [];
    for (let d = 0; d < 360; d += 1) {
      const a = d - offset + 180;
      const len = d % 10 === 0 ? 0.22 : d % 5 === 0 ? 0.14 : 0.06;
      arr.push(...polar(a, R_IN, 0.001), ...polar(a, R_IN + len, 0.001));
    }
    return new Float32Array(arr);
  }, [offset]);

  return (
    <group>
      {Array.from({ length: 12 }, (_, i) => {
        const start = i * 30 - offset + 180;
        const isSel = selected?.kind === "sign" && selected.index === i;
        const active = isSel || hover === i;
        return (
          <group key={i}>
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHover(i);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                setHover(null);
                document.body.style.cursor = "";
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect({ kind: "sign", index: i });
              }}
            >
              <ringGeometry args={[R_IN + 0.24, R_OUT, 48, 1, (start * Math.PI) / 180, Math.PI / 6]} />
              <meshBasicMaterial
                color={ELEMENT_TINTS[i % 4]}
                transparent
                opacity={active ? 0.32 : 0.1}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            <Line
              points={[polar(start, R_IN), polar(start, R_OUT + 0.25)]}
              color="#d9b96a"
              lineWidth={1}
              transparent
              opacity={0.55}
            />
            <Html
              position={polar(start + 15, (R_IN + 0.24 + R_OUT) / 2, 0.02)}
              center
              zIndexRange={[20, 0]}
              style={{ pointerEvents: "none" }}
            >
              <div className={`${styles.signGlyph} ${active ? styles.signGlyphActive : ""} ${compact ? styles.signGlyphCompact : ""}`}>
                {SIGN_GLYPHS[i]}
              </div>
            </Html>
          </group>
        );
      })}
      <Line points={circlePoints(R_IN)} color="#d9b96a" lineWidth={1} transparent opacity={0.7} />
      <Line points={circlePoints(R_IN + 0.24)} color="#d9b96a" lineWidth={0.6} transparent opacity={0.35} />
      <Line points={circlePoints(R_OUT)} color="#d9b96a" lineWidth={1.2} transparent opacity={0.75} />
      <Line points={circlePoints(R_OUT + 0.25)} color="#d9b96a" lineWidth={0.5} transparent opacity={0.3} />
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ticks, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#d9b96a" transparent opacity={0.55} />
      </lineSegments>
    </group>
  );
}

function PlanetBody({
  planetKey,
  glyph,
  position,
  ringAngle,
  selected,
  dimmed,
  onSelect,
  glow,
  size,
  compact,
  retrograde,
}: {
  planetKey: PlanetKey;
  glyph: string;
  position: [number, number, number];
  ringAngle: number;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
  glow: THREE.Texture;
  size: number;
  compact: boolean;
  retrograde: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Sprite>(null);
  const [hover, setHover] = useState(false);
  const color = PLANET_COLORS[planetKey];
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (group.current) group.current.position.y = position[1] + Math.sin(t * 0.8 + phase) * 0.06;
    if (halo.current) {
      const base = size * (selected ? 7 : hover ? 5.5 : 4.2);
      const s = base * (1 + Math.sin(t * 2 + phase) * (selected ? 0.12 : 0.04));
      halo.current.scale.set(s, s, s);
    }
  });

  return (
    <group>
      <Line
        points={[
          [position[0], position[1], position[2]],
          polar(ringAngle, R_IN, 0),
        ]}
        color={color}
        lineWidth={0.6}
        transparent
        opacity={dimmed ? 0.1 : 0.35}
        dashed
        dashSize={0.06}
        gapSize={0.06}
      />
      <group ref={group} position={position}>
        <mesh
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
          <sphereGeometry args={[size, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={selected ? 2.2 : hover ? 1.6 : dimmed ? 0.35 : 1}
            roughness={0.35}
            metalness={0.2}
            transparent
            opacity={dimmed ? 0.45 : 1}
          />
        </mesh>
        <sprite ref={halo}>
          <spriteMaterial
            map={glow}
            color={color}
            transparent
            opacity={dimmed ? 0.18 : 0.75}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
        {!compact && (
          <Html position={[0, size + 0.32, 0]} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
            <div
              className={`${styles.planetGlyph} ${selected ? styles.planetGlyphSelected : ""} ${dimmed ? styles.planetGlyphDim : ""}`}
              style={{ color }}
            >
              {glyph}
              {retrograde && <sup className={styles.rx}>R</sup>}
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

function Scene({ chart, selected, onSelect, showAspects, showHouses, autoRotate, view, compact }: SceneProps & { resetKey: number }) {
  const glow = useGlowTexture();
  const offset = chart.ascendant ?? 0;
  const angleOf = (lon: number) => lon - offset + 180;

  const placed = useMemo(() => {
    const sorted = [...chart.planets].sort((a, b) => a.longitude - b.longitude);
    const tiers: Record<string, number> = {};
    let prevLon = -999;
    let prevTier = 0;
    for (const p of sorted) {
      const close = Math.abs(p.longitude - prevLon) < 7;
      const tier = close ? (prevTier + 1) % 4 : 0;
      tiers[p.key] = tier;
      prevLon = p.longitude;
      prevTier = tier;
    }
    return chart.planets.map((p) => {
      const r = R_PLANET - tiers[p.key] * 0.55;
      const y = tiers[p.key] * 0.18;
      return { ...p, pos: polar(angleOf(p.longitude), r, y), angle: angleOf(p.longitude) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart]);

  const posOf = (k: PlanetKey) => placed.find((p) => p.key === k)!.pos;
  const selectedPlanet = selected?.kind === "planet" ? selected.key : null;

  const sizes: Partial<Record<PlanetKey, number>> = { sun: 0.26, moon: 0.2, jupiter: 0.2, saturn: 0.19 };

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 0, 0]} intensity={30} color="#f7cf6d" distance={14} />
      <pointLight position={[6, 8, 6]} intensity={40} color="#b8a8ff" />
      <Stars radius={80} depth={40} count={compact ? 2500 : 4000} factor={3.2} saturation={0.2} fade speed={0.6} />
      <Sparkles count={compact ? 40 : 70} scale={[13, 4, 13]} size={2.2} speed={0.25} color="#d9b96a" opacity={0.6} />
      <Armillary />
      <ZodiacRing offset={offset} selected={selected} onSelect={onSelect} compact={compact} />

      {showHouses && chart.houseCusps && (
        <group>
          {chart.houseCusps.map((cusp, i) => {
            const a = angleOf(cusp);
            const angular = i === 0 || i === 3 || i === 6 || i === 9;
            const isSel = selected?.kind === "house" && selected.index === i;
            return (
              <group key={i}>
                <Line
                  points={[polar(a, 0.9), polar(a, R_IN)]}
                  color={angular ? "#f2d58a" : "#d9b96a"}
                  lineWidth={angular ? 1.4 : 0.6}
                  transparent
                  opacity={angular ? 0.7 : 0.25}
                />
                <Html position={polar(a + 15, 1.55, 0.02)} center zIndexRange={[20, 0]}>
                  <button
                    type="button"
                    className={`${styles.houseNum} ${isSel ? styles.houseNumActive : ""}`}
                    onClick={() => onSelect({ kind: "house", index: i })}
                  >
                    {["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][i]}
                  </button>
                </Html>
              </group>
            );
          })}
          <Html position={polar(angleOf(chart.ascendant!), R_OUT + 0.7, 0)} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
            <div className={styles.angleLabel}>ASC</div>
          </Html>
          {chart.midheaven !== null && (
            <>
              <Line
                points={[polar(angleOf(chart.midheaven), 0.9), polar(angleOf(chart.midheaven), R_OUT + 0.25)]}
                color="#f2d58a"
                lineWidth={1.2}
                transparent
                opacity={0.6}
                dashed
                dashSize={0.12}
                gapSize={0.08}
              />
              <Html position={polar(angleOf(chart.midheaven), R_OUT + 0.7, 0)} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
                <div className={styles.angleLabel}>MC</div>
              </Html>
            </>
          )}
        </group>
      )}

      {showAspects &&
        chart.aspects.map((asp, i) => {
          const involved = selectedPlanet ? asp.a === selectedPlanet || asp.b === selectedPlanet : true;
          const pa = posOf(asp.a);
          const pb = posOf(asp.b);
          const tight = Math.max(0.25, 1 - asp.orb / 8);
          return (
            <Line
              key={i}
              points={[pa, pb]}
              color={ASPECT_COLORS[asp.type]}
              lineWidth={involved && selectedPlanet ? 2.2 : 1.1}
              transparent
              opacity={involved ? 0.35 + tight * 0.45 : 0.06}
              dashed={asp.type === "sextile" || asp.type === "square"}
              dashSize={0.18}
              gapSize={0.1}
            />
          );
        })}

      {placed.map((p) => (
        <PlanetBody
          key={p.key}
          planetKey={p.key}
          glyph={p.glyph}
          position={p.pos}
          ringAngle={p.angle}
          selected={selectedPlanet === p.key}
          dimmed={!!selectedPlanet && selectedPlanet !== p.key}
          onSelect={() => onSelect({ kind: "planet", key: p.key })}
          glow={glow}
          size={sizes[p.key] ?? (p.kind === "point" ? 0.1 : p.kind === "asteroid" ? 0.12 : 0.15)}
          compact={compact}
          retrograde={p.retrograde && p.key !== "northNode"}
        />
      ))}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        autoRotate={autoRotate}
        autoRotateSpeed={compact ? 0.5 : 0.35}
        enablePan={false}
        enableZoom={!compact}
        minDistance={6}
        maxDistance={22}
        maxPolarAngle={Math.PI * 0.62}
      />
    </>
  );
}

interface NatalSphere3DProps {
  chart: NatalChart;
  className?: string;
  compact?: boolean;
  selected?: ChartSelection;
  onSelect?: (s: ChartSelection) => void;
}

export const NatalSphere3D = ({ chart, className, compact = false, selected, onSelect }: NatalSphere3DProps) => {
  const [internalSel, setInternalSel] = useState<ChartSelection>(null);
  const sel = selected !== undefined ? selected : internalSel;
  const setSel = (s: ChartSelection) => {
    setInternalSel(s);
    onSelect?.(s);
  };
  const [showAspects, setShowAspects] = useState(true);
  const [showHouses, setShowHouses] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [view, setView] = useState<"orbit" | "top">("orbit");
  const [resetKey, setResetKey] = useState(0);
  const [mode, setMode] = useChartMode();

  if (mode === "2d") {
    return (
      <div className={`${styles.stage} ${styles.stage2d} ${compact ? styles.compact : ""} ${className ?? ""}`}>
        <NatalWheel2D chart={chart} selected={sel} onSelect={setSel} />
        {!compact && <ViewModeToggle mode={mode} onChange={setMode} />}
      </div>
    );
  }

  return (
    <div className={`${styles.stage} ${compact ? styles.compact : ""} ${className ?? ""}`}>
      <SafeCanvas
        fallback={<NatalWheel2D chart={chart} selected={sel} onSelect={setSel} />}
        camera={{ position: [0, 12, 16], fov: 45 }}
        onPointerMissed={() => setSel(null)}
      >
        <CameraRig view={view} resetKey={resetKey} />
        <Scene
          chart={chart}
          selected={sel}
          onSelect={setSel}
          showAspects={showAspects}
          showHouses={showHouses}
          autoRotate={autoRotate && !sel}
          view={view}
          compact={compact}
          resetKey={resetKey}
        />
      </SafeCanvas>
      {!compact && (
        <ViewModeToggle mode={mode} onChange={setMode} />
      )}
      {!compact && (
        <div className={styles.toolbar}>
          <ToolButton active={showAspects} onClick={() => setShowAspects((v) => !v)} label="Aspects">
            <Spline size={16} />
          </ToolButton>
          {chart.houseCusps && (
            <ToolButton active={showHouses} onClick={() => setShowHouses((v) => !v)} label="Houses">
              <Home size={16} />
            </ToolButton>
          )}
          <ToolButton active={autoRotate} onClick={() => setAutoRotate((v) => !v)} label="Drift">
            <RotateCw size={16} />
          </ToolButton>
          <ToolButton active={view === "top"} onClick={() => setView((v) => (v === "top" ? "orbit" : "top"))} label={view === "top" ? "Sphere" : "Wheel"}>
            {view === "top" ? <Orbit size={16} /> : <Eye size={16} />}
          </ToolButton>
          <ToolButton active={false} onClick={() => { setSel(null); setResetKey((k) => k + 1); }} label="Reset">
            <Orbit size={16} />
          </ToolButton>
        </div>
      )}
      {!compact && <div className={styles.hint}>Drag to orbit · Pinch or scroll to zoom · Tap a planet, sign, or house</div>}
    </div>
  );
};

function ToolButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button type="button" className={`${styles.toolBtn} ${active ? styles.toolBtnActive : ""}`} onClick={onClick} aria-pressed={active}>
      {children}
      <span>{label}</span>
    </button>
  );
}
