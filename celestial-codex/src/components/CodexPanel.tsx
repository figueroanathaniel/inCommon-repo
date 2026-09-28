import React from "react";
import styles from "./CodexPanel.module.css";

interface CodexPanelProps {
  eyebrow?: string;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

/** Midnight-glass panel with gold hairline frame, used across the Codex. */
export const CodexPanel = ({ eyebrow, title, children, className, glow }: CodexPanelProps) => (
  <section className={`${styles.panel} ${glow ? styles.glow : ""} ${className ?? ""}`}>
    <span className={styles.cornerTL} aria-hidden />
    <span className={styles.cornerBR} aria-hidden />
    {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
    {title && <h3 className={styles.title}>{title}</h3>}
    {children}
  </section>
);
