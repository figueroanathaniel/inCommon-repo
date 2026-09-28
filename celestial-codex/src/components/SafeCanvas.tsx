import React, { Component, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import styles from "./SafeCanvas.module.css";

type CanvasProps = React.ComponentProps<typeof Canvas>;

function detectWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

class GLBoundary extends Component<{ fallback: React.ReactNode; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("3D scene failed, showing fallback:", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const isSmallTouch = () =>
  typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches && window.innerWidth < 900;

/** Reports the first rendered frame so the watchdog knows the scene is alive. */
function FrameProbe({ onFrame }: { onFrame: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (!done.current) {
      done.current = true;
      onFrame();
    }
  });
  return null;
}

/**
 * A react-three-fiber Canvas that degrades gracefully: detects WebGL, catches render errors
 * and lost GPU contexts, falls back if no frame renders within a few seconds, and uses lighter settings on phones.
 */
export const SafeCanvas = ({ fallback, children, className, ...props }: CanvasProps & { fallback: React.ReactNode; className?: string }) => {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [lost, setLost] = useState(false);
  const rendered = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const mobile = isSmallTouch();

  useEffect(() => {
    setSupported(detectWebGL());
  }, []);

  useEffect(() => {
    if (!supported) return;
    const t = window.setTimeout(() => {
      if (!rendered.current) {
        const r = wrap.current?.getBoundingClientRect();
        console.warn(`[Codex3D] no frame rendered after 4s (container ${Math.round(r?.width ?? 0)}x${Math.round(r?.height ?? 0)}); switching to 2D`);
        setLost(true);
      }
    }, 4000);
    return () => window.clearTimeout(t);
  }, [supported]);

  if (supported === null) return <div className={`${styles.fill} ${className ?? ""}`} />;
  if (!supported || lost) {
    if (!supported) console.warn("WebGL unavailable; rendering 2D fallback");
    return <>{fallback}</>;
  }

  return (
    <GLBoundary fallback={fallback}>
      <div ref={wrap} className={`${styles.fill} ${className ?? ""}`}>
      <Canvas
        className={styles.fill}
        dpr={mobile ? [1, 1.5] : [1, 2]}
        gl={{ antialias: !mobile, alpha: true, powerPreference: "default", failIfMajorPerformanceCaveat: false }}
        onCreated={({ gl, size }) => {
          console.info(`[Codex3D] WebGL ready ${Math.round(size.width)}x${Math.round(size.height)}`);
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            console.error("WebGL context lost");
            setLost(true);
          });
        }}
        {...props}
      >
        <FrameProbe onFrame={() => (rendered.current = true)} />
        {children}
      </Canvas>
      </div>
    </GLBoundary>
  );
};
