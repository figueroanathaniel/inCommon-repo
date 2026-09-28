import { astroEngine, findAspect, formatDegree, SIGN_NAMES } from "./astroEngine";
import { birthInstant } from "./birthInstant";
import { humanDesignEngine } from "./humanDesignEngine";
import { numerologyEngine } from "./numerologyEngine";
import { hdLore } from "./hdLore";
import type { BirthProfile } from "./BirthProfile";
import { buildAdvancedChart, type AsteroidPosition } from "./advancedChart";

/** Builds a plain-text dossier of natal + transit + HD + numerology data for AI prompts. */
export function buildCosmicContext(profile: BirthProfile, at: Date, deep?: { asteroids: AsteroidPosition[] | null }) {
  const instant = birthInstant(profile.birthDate, profile.birthTime, profile.timezone);
  const loc =
    profile.birthTime && profile.latitude !== null && profile.longitude !== null
      ? { latitude: profile.latitude, longitude: profile.longitude }
      : null;
  const natal = astroEngine(instant, loc);
  const sky = astroEngine(at, null);
  const hd = humanDesignEngine(instant);
  const num = numerologyEngine(profile.fullName, profile.birthDate, at);

  const transits: string[] = [];
  for (const t of sky.planets) {
    if (t.key === "northNode") continue;
    for (const n of natal.planets) {
      const a = findAspect(t.longitude, n.longitude, 0.35);
      if (a) transits.push(`Transiting ${t.name} ${a.type} natal ${n.name} (orb ${a.orb.toFixed(1)}°)`);
    }
  }

  const lines = [
    `NAME: ${profile.fullName.split(" ")[0]}`,
    `NATAL PLACEMENTS: ${natal.planets
      .map((p) => `${p.name} ${formatDegree(p.longitude)}${p.house ? ` (house ${p.house})` : ""}${p.retrograde && p.key !== "northNode" ? " Rx" : ""}`)
      .join("; ")}`,
    natal.ascendant !== null ? `ASCENDANT: ${formatDegree(natal.ascendant)}; MIDHEAVEN: ${formatDegree(natal.midheaven!)}` : "Birth time unknown: no ascendant or houses.",
    `KEY NATAL ASPECTS: ${natal.aspects.slice(0, 12).map((a) => `${a.a} ${a.type} ${a.b}`).join(", ")}`,
    `CURRENT SKY: ${sky.planets.map((p) => `${p.name} in ${SIGN_NAMES[p.signIndex]}${p.retrograde && p.key !== "northNode" ? " Rx" : ""}`).join(", ")}`,
    `ACTIVE TRANSITS TO NATAL: ${transits.length ? transits.join("; ") : "none exact"}`,
    `HUMAN DESIGN: ${hd.type}; Strategy: ${hdLore.types[hd.type].strategy}; Authority: ${hd.authority}; Profile ${hd.profile}; ${hd.definition}; Defined centers: ${[...hd.definedCenters].join(", ") || "none"}; Channels: ${hd.definedChannels.map((c) => c.join("-")).join(", ") || "none"}; Personality Sun gate ${hd.cross.personalitySun} (${hdLore.gateNames[hd.cross.personalitySun]}), Design Sun gate ${hd.cross.designSun} (${hdLore.gateNames[hd.cross.designSun]})`,
    `CURRENT TRANSITING SUN GATE: ${(() => {
      const s = humanDesignEngine(at).activations.find((a) => a.body === "sun" && a.side === "personality")!;
      return `${s.gate}.${s.line} (${hdLore.gateNames[s.gate]})`;
    })()}`,
    `NUMEROLOGY: Life Path ${num.lifePath}; Expression ${num.expression}; Soul Urge ${num.soulUrge}; Personality ${num.personality}; Birthday ${num.birthday}; Personal Year ${num.personalYear}; Personal Month ${num.personalMonth}; Personal Day ${num.personalDay}`,
  ];

  if (deep) {
    const adv = buildAdvancedChart(natal, loc, deep.asteroids, { minorAspects: true });
    const extras = adv.planets.filter((p) => p.kind && p.kind !== "planet" && p.key !== "northNode");
    lines.push(
      `ADVANCED NATAL POINTS: ${extras
        .map((p) => `${p.name} ${formatDegree(p.longitude)}${p.house ? ` (house ${p.house})` : ""}${p.retrograde && p.kind === "asteroid" ? " Rx" : ""}`)
        .join("; ")}`
    );
    lines.push(`ALL NATAL ASPECTS INCL. MINOR: ${adv.aspects.map((a) => `${a.a} ${a.type} ${a.b} (${a.orb.toFixed(1)}°)`).join(", ")}`);
    const deepTransits: string[] = [];
    for (const t of sky.planets) {
      if (t.key === "northNode") continue;
      for (const n of extras) {
        const a = findAspect(t.longitude, n.longitude, 0.3);
        if (a) deepTransits.push(`Transiting ${t.name} ${a.type} natal ${n.name} (orb ${a.orb.toFixed(1)}°)`);
      }
    }
    lines.push(`TRANSITS TO ADVANCED POINTS: ${deepTransits.join("; ") || "none exact"}`);
    lines.push(`HD ACTIVATIONS: ${hd.activations.map((a) => `${a.side === "design" ? "D" : "P"}-${a.body} ${a.gate}.${a.line}`).join(", ")}`);
    lines.push(`NUMEROLOGY EXTRA: Maturity ${num.maturity}; Karmic lessons ${num.karmicLessons.join(", ") || "none"}`);
    transits.push(...deepTransits);
  }

  return { text: lines.join("\n"), transits };
}
