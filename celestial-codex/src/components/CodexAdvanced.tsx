import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAsteroids } from "../endpoints/points/asteroids_GET.schema";
import { buildAdvancedChart } from "../helpers/advancedChart";
import type { NatalChart, PointKind } from "../helpers/astroEngine";
import type { BirthProfile } from "../helpers/BirthProfile";
import { CodexStars } from "./CodexStars";
import { Switch } from "./Switch";
import styles from "./CodexAdvanced.module.css";

const KINDS: { k: PointKind; label: string }[] = [
  { k: "planet", label: "Planets" },
  { k: "node", label: "Nodes" },
  { k: "asteroid", label: "Asteroids & Chiron" },
  { k: "point", label: "Sensitive points" },
];

export const CodexAdvanced = ({ natal, profile, className }: { natal: NatalChart; profile: BirthProfile; className?: string }) => {
  const asteroids = useQuery({
    queryKey: ["asteroids", profile.birthDate, profile.birthTime, profile.timezone],
    queryFn: async () => (await getAsteroids()).asteroids,
    staleTime: Infinity,
    retry: 1,
  });
  const [shown, setShown] = useState<Set<PointKind>>(new Set(["planet", "node", "asteroid", "point"]));
  const [minor, setMinor] = useState(true);

  const loc =
    profile.birthTime && profile.latitude !== null && profile.longitude !== null
      ? { latitude: profile.latitude, longitude: profile.longitude }
      : null;

  const chart = useMemo(() => {
    const full = buildAdvancedChart(natal, loc, asteroids.data ?? null, { minorAspects: minor });
    const planets = full.planets.filter((p) => shown.has(p.kind ?? "planet"));
    const keys = new Set(planets.map((p) => p.key));
    return { ...full, planets, aspects: full.aspects.filter((a) => keys.has(a.a) && keys.has(a.b)) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [natal, asteroids.data, shown, minor, profile]);

  const toggle = (k: PointKind) =>
    setShown((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      if (n.size === 0) n.add("planet");
      return n;
    });

  return (
    <div className={`${styles.wrap} ${className ?? ""}`}>
      <div className={styles.bar}>
        <div className={styles.chips}>
          {KINDS.map((k) => (
            <button key={k.k} type="button" className={`${styles.chip} ${shown.has(k.k) ? styles.chipOn : ""}`} onClick={() => toggle(k.k)}>
              {k.label}
            </button>
          ))}
        </div>
        <label className={styles.minor}>
          <Switch checked={minor} onCheckedChange={setMinor} />
          Minor aspects
        </label>
      </div>
      {asteroids.isFetching && !asteroids.data && <p className={styles.status}>Consulting NASA's JPL ephemeris for your asteroids…</p>}
      {asteroids.error && <p className={styles.statusErr}>{(asteroids.error as Error).message} Asteroids are hidden for now; everything else is shown.</p>}
      {!loc && <p className={styles.status}>Add your birth time and place to reveal the Vertex, East Point, and Part of Fortune.</p>}
      <CodexStars chart={chart} aspectLimit={30} tableTitle="Every point, node, and asteroid" />
    </div>
  );
};
