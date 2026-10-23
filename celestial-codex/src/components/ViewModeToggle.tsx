import React from "react";
import { Box, Circle } from "lucide-react";
import type { ChartMode } from "../helpers/useChartMode";
import styles from "./ViewModeToggle.module.css";

export const ViewModeToggle = ({ mode, onChange, className }: { mode: ChartMode; onChange: (m: ChartMode) => void; className?: string }) => (
  <div className={`${styles.wrap} ${className ?? ""}`} role="group" aria-label="Chart view">
    <button type="button" className={`${styles.btn} ${mode === "2d" ? styles.on : ""}`} onClick={() => onChange("2d")}>
      <Circle size={13} /> 2D
    </button>
    <button type="button" className={`${styles.btn} ${mode === "3d" ? styles.on : ""}`} onClick={() => onChange("3d")}>
      <Box size={13} /> 3D
    </button>
  </div>
);
