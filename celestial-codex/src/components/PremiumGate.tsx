import React from "react";
import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { usePremium } from "../helpers/usePremium";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import styles from "./PremiumGate.module.css";

interface PremiumGateProps {
  feature: string;
  teaser: string;
  children: React.ReactNode;
  className?: string;
}

/** Renders children for Luminary subscribers; otherwise an invitation to upgrade. */
export const PremiumGate = ({ feature, teaser, children, className }: PremiumGateProps) => {
  const status = usePremium.useStatus();
  if (status.isFetching && !status.data) return <Skeleton className={styles.sk} />;
  if (status.data?.isPremium) return <>{children}</>;
  return (
    <div className={`${styles.gate} ${className ?? ""}`}>
      <div className={styles.seal} aria-hidden>
        <Lock size={22} />
      </div>
      <p className={styles.eyebrow}>Codex Luminary</p>
      <h3 className={styles.title}>{feature}</h3>
      <p className={styles.teaser}>{teaser}</p>
      <Button asChild size="lg">
        <Link to="/premium">
          <Sparkles size={18} /> Unlock Luminary · $12.99/mo or $119.99/yr
        </Link>
      </Button>
    </div>
  );
};
