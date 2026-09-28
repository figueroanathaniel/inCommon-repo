import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AstroGlobe } from "./AstroGlobe";
import { CodexPanel } from "./CodexPanel";
import { Input } from "./Input";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import { PLANET_COLORS } from "./NatalSphere3D";
import { getAsteroids } from "../endpoints/points/asteroids_GET.schema";
import { postRelocation } from "../endpoints/relocation_POST.schema";
import { ACG_BODIES, AcgAngle, AcgLine, computeAcgLines, linesNear, relocatedAngles } from "../helpers/astroCartography";
import { acgLore } from "../helpers/acgLore";
import { formatDegree, PlanetKey } from "../helpers/astroEngine";
import { useCodexQueries } from "../helpers/useCodexQueries";
import { useDebounce } from "../helpers/useDebounce";
import type { BirthProfile } from "../helpers/BirthProfile";
import type { RelocationReading } from "../helpers/RelocationReading";
import styles from "./CodexAtlas.module.css";

const ANGLES: AcgAngle[] = ["ASC", "MC", "DSC", "IC"];
type Place = { lat: number; lng: number; label: string };

export const CodexAtlas = ({ profile, instant, className }: { profile: BirthProfile; instant: Date; className?: string }) => {
  const asteroids = useQuery({
    queryKey: ["asteroids", profile.birthDate, profile.birthTime, profile.timezone],
    queryFn: async () => (await getAsteroids()).asteroids,
    staleTime: Infinity,
    retry: 1,
  });
  const allLines = useMemo(() => computeAcgLines(instant, asteroids.data ?? null), [instant, asteroids.data]);
  const [planets, setPlanets] = useState<Set<PlanetKey>>(new Set(["sun", "moon", "venus", "mars", "jupiter", "saturn"]));
  const [angles, setAngles] = useState<Set<AcgAngle>>(new Set(ANGLES));
  const [selected, setSelected] = useState<Place | null>(null);
  const [activeLine, setActiveLine] = useState<AcgLine | null>(null);
  const [q, setQ] = useState("");
  const debounced = useDebounce(q, 350);
  const places = useCodexQueries.usePlaces(debounced);
  const [reading, setReading] = useState<{ label: string; data: RelocationReading } | null>(null);

  const lines = allLines.filter((l) => planets.has(l.planet) && angles.has(l.angle));
  const hits = selected ? linesNear(allLines, selected.lat, selected.lng, 800) : [];
  const reloc = selected && profile.birthTime ? relocatedAngles(instant, selected.lat, selected.lng) : null;
  const birthplace = profile.latitude !== null && profile.longitude !== null ? { lat: profile.latitude, lng: profile.longitude, label: profile.birthPlace ?? "Birthplace" } : null;

  const relocation = useMutation({
    mutationFn: async (place: Place) => {
      const dossier = [
        `LINES NEAR THIS PLACE: ${hits.length ? hits.map((h) => `${h.line.name} ${h.line.angle} line at ${h.distanceKm} km`).join("; ") : "none within 800 km"}`,
        reloc ? `RELOCATED ANGLES: Ascendant ${formatDegree(reloc.asc)}, Midheaven ${formatDegree(reloc.mc)}` : "Birth time unknown: relocated angles unavailable.",
        `BIRTHPLACE: ${profile.birthPlace ?? "unknown"}`,
      ].join("\n");
      return (await postRelocation({ placeLabel: place.label, latitude: place.lat, longitude: place.lng, dossier })).reading;
    },
    onSuccess: (data, place) => setReading({ label: place.label, data }),
    onError: (e: Error & { code?: string }) => {
      if (e.code === "OUT_OF_CREDITS") console.warn("AI unavailable");
      else toast.error(e.message);
    },
  });

  const choose = (p: Place) => {
    setSelected(p);
    setActiveLine(null);
    setReading(null);
    setQ("");
  };

  const toggle = <T,>(set: Set<T>, v: T, fn: (s: Set<T>) => void) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    fn(n);
  };

  return (
    <div className={`${styles.wrap} ${className ?? ""}`}>
      <div className={styles.filters}>
        <div className={styles.chips}>
          {ACG_BODIES.filter((b) => b.key !== "chiron" || asteroids.data).map((b) => (
            <button
              key={b.key}
              type="button"
              className={`${styles.chip} ${planets.has(b.key) ? styles.chipOn : ""}`}
              style={planets.has(b.key) ? { borderColor: PLANET_COLORS[b.key], color: PLANET_COLORS[b.key] } : undefined}
              onClick={() => toggle(planets, b.key, setPlanets)}
            >
              {b.glyph} {b.name}
            </button>
          ))}
        </div>
        <div className={styles.chips}>
          {ANGLES.map((a) => (
            <button key={a} type="button" className={`${styles.chip} ${angles.has(a) ? styles.chipOn : ""}`} onClick={() => toggle(angles, a, setAngles)}>
              {a} <span className={styles.lineKey}>{a === "ASC" || a === "MC" ? "━" : "┅"}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.stageRow}>
        <AstroGlobe
          lines={lines}
          birthplace={birthplace}
          selected={selected}
          activeLineId={activeLine?.id ?? null}
          onLineClick={(l) => setActiveLine(l)}
          onGlobeClick={(lat, lng) => choose({ lat, lng, label: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°` })}
          className={styles.globe}
        />

        <CodexPanel glow className={styles.side}>
          <div className={styles.search}>
            <MapPin size={16} className={styles.searchIcon} />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search any city on Earth…" className={styles.searchInput} />
            {places.isFetching && <Spinner size="sm" className={styles.searchSpin} />}
            {debounced.length >= 2 && q && (places.data?.length ?? 0) > 0 && (
              <ul className={styles.results}>
                {places.data!.map((p) => (
                  <li key={`${p.latitude},${p.longitude}`}>
                    <button type="button" onClick={() => choose({ lat: p.latitude, lng: p.longitude, label: p.label })}>
                      {p.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {activeLine ? (
            <LineReading line={activeLine} onClose={() => setActiveLine(null)} />
          ) : selected ? (
            <div className={styles.place}>
              <p className={styles.eyebrow}>Your stars over</p>
              <h3 className={styles.placeTitle}>{selected.label}</h3>
              {reloc && (
                <p className={styles.mono}>
                  Relocated Ascendant {formatDegree(reloc.asc)} · Midheaven {formatDegree(reloc.mc)}
                </p>
              )}
              {hits.length === 0 ? (
                <p className={styles.prose}>No planetary lines pass within 800 km. This is a quiet sky for you: a place where you write your own story without strong planetary weather.</p>
              ) : (
                <ul className={styles.hits}>
                  {hits.slice(0, 8).map((h) => (
                    <li key={h.line.id}>
                      <button type="button" className={styles.hit} onClick={() => setActiveLine(h.line)}>
                        <span className={styles.hitGlyph} style={{ color: PLANET_COLORS[h.line.planet] }}>{h.line.glyph}</span>
                        <span className={styles.hitName}>
                          {h.line.name} {acgLore.angles[h.line.angle].title}
                          <small>{acgLore.angles[h.line.angle].realm}</small>
                        </span>
                        <span className={`${styles.strength} ${h.distanceKm < 150 ? styles.strong : h.distanceKm < 500 ? styles.moderate : ""}`}>
                          {h.distanceKm} km
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <Button size="lg" className={styles.readBtn} disabled={relocation.isPending} onClick={() => relocation.mutate(selected)}>
                {relocation.isPending ? <><Spinner size="sm" /> The Oracle is traveling there…</> : <><Sparkles size={16} /> Full relocation reading</>}
              </Button>
            </div>
          ) : (
            <div className={styles.place}>
              <p className={styles.eyebrow}>Astrocartography</p>
              <h3 className={styles.placeTitle}>Where on Earth do your stars burn brightest?</h3>
              <p className={styles.prose}>
                At the instant you were born, every planet was rising somewhere, culminating somewhere, setting somewhere. These luminous lines trace those places across the globe. Solid lines mark where a planet rises (ASC) or crowns the sky (MC); dotted lines where it sets (DSC) or lies beneath your feet (IC).
              </p>
              <p className={styles.prose}>Search a city, tap anywhere on the globe, or tap a line to read it.</p>
            </div>
          )}
        </CodexPanel>
      </div>

      {reading && selected && reading.label === selected.label && (
        <article className={styles.reading}>
          <p className={styles.eyebrow}>Relocation Reading · {reading.label}</p>
          <h2 className={styles.readingTitle}>{reading.data.title}</h2>
          <p className={styles.epigraph}>{reading.data.epigraph}</p>
          {reading.data.overview.split(/\n\s*\n/).map((p, i) => (
            <p key={i} className={styles.prose}>{p}</p>
          ))}
          <div className={styles.grid}>
            {[
              ["♀︎ Love & Connection", reading.data.love],
              ["♄ Career & Calling", reading.data.career],
              ["☽ Home & Belonging", reading.data.home],
              ["☉ Body & Wellbeing", reading.data.wellbeing],
              ["☊ Growth", reading.data.growth],
              ["⚸ Cautions", reading.data.cautions],
            ].map(([t, v]) => (
              <CodexPanel key={t} eyebrow={t}>
                <p className={styles.prose}>{v}</p>
              </CodexPanel>
            ))}
          </div>
          <div className={styles.bestFor}>
            {reading.data.bestFor.map((b) => (
              <span key={b}>{b}</span>
            ))}
          </div>
          <p className={styles.verdict}>“{reading.data.verdict}”</p>
        </article>
      )}
    </div>
  );
};

function LineReading({ line, onClose }: { line: AcgLine; onClose: () => void }) {
  const a = acgLore.angles[line.angle];
  const p = acgLore.planets[line.planet];
  return (
    <div className={styles.place}>
      <button type="button" className={styles.back} onClick={onClose}>← Back</button>
      <div className={styles.lineGlyph} style={{ color: PLANET_COLORS[line.planet] }}>{line.glyph}</div>
      <p className={styles.eyebrow}>{a.realm} · {p.tone}</p>
      <h3 className={styles.placeTitle}>{line.name} {a.title}</h3>
      <p className={styles.prose}>{a.prose}</p>
      <p className={styles.prose}>
        Along this line, {line.name} brings <em>{p.gifts}</em> into the realm of {a.realm}. The shadow side to watch for is {p.cautions}. The effect is strongest within about 150 km of the line and fades by roughly 800 km.
      </p>
    </div>
  );
}
