import React, { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Sparkles, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useGlowTexture } from "../helpers/useGlowTexture";
import { SafeCanvas } from "./SafeCanvas";
import { Orrery2D } from "./Orrery2D";
import { ViewModeToggle } from "./ViewModeToggle";
import { useChartMode } from "../helpers/useChartMode";
import styles from "./NumerologyOrrery3D.module.css";

export type OrreryItem = { key: string; label: string; value: number };

const COLORS = ["#f2d58a", "#b69cf5", "#84dbe4", "#f2b6cb", "#9fd8a8", "#eab47c", "#8fa8e8", "#e8685a"];

function Geometry({ n }: { n: number }) {
  switch (n) {
    case 1: return <sphereGeometry args={[1, 24, 16]} />;
    case 2: return <torusGeometry args={[0.8, 0.28, 16, 48]} />;
    case 3: return <tetrahedronGeometry args={[1.1, 0]} />;
    case 4: return <boxGeometry args={[1.3, 1.3, 1.3]} />;
    case 5: return <dodecahedronGeometry args={[1, 0]} />;
    case 6: return <octahedronGeometry args={[1.15, 0]} />;
    case 7: return <icosahedronGeometry args={[1, 0]} />;
    case 8: return <torusKnotGeometry args={[0.65, 0.2, 96, 12, 2, 3]} />;
    case 9: return <icosahedronGeometry args={[1, 1]} />;
    case 11: return <torusKnotGeometry args={[0.6, 0.18, 96, 12, 1, 1]} />;
    case 22: return <torusKnotGeometry args={[0.65, 0.16, 128, 12, 2, 5]} />;
    default: return <dodecahedronGeometry args={[1, 1]} />;
  }
}

function NumberBody({
  item,
  index,
  total,
  center,
  selected,
  onSelect,
  glow,
}: {
  item: OrreryItem;
  index: number;
  total: number;
  center: boolean;
  selected: boolean;
  onSelect: () => void;
  glow: THREE.Texture;
}) {
  const orbit = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const color = COLORS[index % COLORS.length];
  const radius = center ? 0 : 2.6 + (index % 3) * 1.25;
  const speed = center ? 0 : 0.12 + (total - index) * 0.02;
  const tilt = center ? 0 : ((index % 4) - 1.5) * 0.22;
  const start = (index / Math.max(1, total)) * Math.PI * 2;
  const scale = center ? 1.05 : 0.42;

  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime();
    if (orbit.current && !center) orbit.current.rotation.y = start + t * speed;
    if (body.current) {
      body.current.rotation.x += dt * 0.3;
      body.current.rotation.y += dt * 0.45;
      const s = scale * (selected ? 1.3 : hover ? 1.15 : 1);
      body.current.scale.lerp(new THREE.Vector3(s, s, s), 0.12);
    }
  });

  const ringPts = useMemo(() => {
    if (center) return null;
    const pts: number[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    }
    return new Float32Array(pts);
  }, [center, radius]);

  return (
    <group rotation={[tilt, 0, tilt * 0.5]}>
      {ringPts && (
        <line>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[ringPts, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={color} transparent opacity={selected ? 0.6 : 0.18} />
        </line>
      )}
      <group ref={orbit}>
        <group position={[radius, 0, 0]}>
          <group
            ref={body}
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
            <mesh>
              <Geometry n={item.value} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 0.9 : 0.35} metalness={0.6} roughness={0.25} transparent opacity={0.55} />
            </mesh>
            <mesh scale={1.04}>
              <Geometry n={item.value} />
              <meshBasicMaterial color={color} wireframe transparent opacity={0.9} />
            </mesh>
          </group>
          <sprite scale={center ? [5, 5, 5] : [2, 2, 2]}>
            <spriteMaterial map={glow} color={color} transparent opacity={selected ? 0.8 : 0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
          <Html position={[0, center ? 1.7 : 0.85, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
            <div className={`${styles.label} ${center ? styles.labelCenter : ""} ${selected ? styles.labelSel : ""}`} style={{ color }}>
              <span className={styles.num}>{item.value}</span>
              <span className={styles.name}>{item.label}</span>
            </div>
          </Html>
        </group>
      </group>
    </group>
  );
}

interface NumerologyOrrery3DProps {
  items: OrreryItem[]; // first item is placed at the heart of the orrery
  selected: string | null;
  onSelect: (key: string | null) => void;
  className?: string;
}

export const NumerologyOrrery3D = ({ items, selected, onSelect, className }: NumerologyOrrery3DProps) => {
  const [mode, setMode] = useChartMode();
  return (
    <div className={`${styles.stage} ${mode === "2d" ? styles.stage2d : ""} ${className ?? ""}`}>
      {mode === "2d" ? (
        <Orrery2D items={items} selected={selected} onSelect={onSelect} />
      ) : (
        <SafeCanvas
          fallback={<Orrery2D items={items} selected={selected} onSelect={onSelect} />}
          camera={{ position: [0, 6, 11], fov: 48 }}
          onPointerMissed={() => onSelect(null)}
        >
          <OrreryScene items={items} selected={selected} onSelect={onSelect} />
        </SafeCanvas>
      )}
      <ViewModeToggle mode={mode} onChange={setMode} />
    </div>
  );
};

function OrreryScene({ items, selected, onSelect }: Omit<NumerologyOrrery3DProps, "className">) {
  const glow = useGlowTexture();
  return (
    <>
        <ambientLight intensity={0.4} />
        <pointLight position={[0, 0, 0]} intensity={40} color="#f2d58a" distance={12} />
        <pointLight position={[5, 6, 5]} intensity={40} color="#b8a8ff" />
        <Stars radius={70} depth={30} count={3000} factor={3} fade speed={0.5} />
        <Sparkles count={60} scale={[12, 5, 12]} size={2} speed={0.3} color="#d9b96a" opacity={0.5} />
        {items.map((item, i) => (
          <NumberBody
            key={item.key}
            item={item}
            index={i}
            total={items.length}
            center={i === 0}
            selected={selected === item.key}
            onSelect={() => onSelect(item.key)}
            glow={glow}
          />
        ))}
        <OrbitControls enablePan={false} enableDamping minDistance={6} maxDistance={22} autoRotate={!selected} autoRotateSpeed={0.3} />
    </>
  );
}
