import { useCallback, useEffect, useState } from "react";

export type ChartMode = "2d" | "3d";
const KEY = "codex.chartMode";
const EVENT = "codex-chart-mode";

function defaultMode(): ChartMode {
  if (typeof window === "undefined") return "3d";
  const phone = window.matchMedia?.("(pointer: coarse)").matches && window.innerWidth < 900;
  return phone ? "2d" : "3d";
}

function read(): ChartMode {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === "2d" || v === "3d") return v;
  } catch {
    /* storage unavailable */
  }
  return defaultMode();
}

/** Shared 2D/3D chart preference: 2D by default on phones, remembered per device, synced across charts. */
export function useChartMode(): [ChartMode, (m: ChartMode) => void] {
  const [mode, setModeState] = useState<ChartMode>(() => read());
  useEffect(() => {
    const on = () => setModeState(read());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  const setMode = useCallback((m: ChartMode) => {
    try {
      window.localStorage.setItem(KEY, m);
    } catch {
      /* ignore */
    }
    setModeState(m);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [mode, setMode];
}
