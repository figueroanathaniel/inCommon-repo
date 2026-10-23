import React, { useState } from "react";
import { Bodygraph3D } from "./Bodygraph3D";
import { CodexPanel } from "./CodexPanel";
import { CENTER_GATES, CenterKey, HDBodyKey, HumanDesignChart } from "../helpers/humanDesignEngine";
import { hdLore } from "../helpers/hdLore";
import styles from "./CodexDesign.module.css";

const BODY_GLYPHS: Partial<Record<HDBodyKey, string>> = {
  sun: "☉", earth: "⊕", moon: "☽", northNode: "☊", southNode: "☋", mercury: "☿", venus: "♀︎",
  mars: "♂︎", jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
};
const BODY_ORDER: HDBodyKey[] = ["sun", "earth", "northNode", "southNode", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

export const CodexDesign = ({ chart, className }: { chart: HumanDesignChart; className?: string }) => {
  const [sel, setSel] = useState<CenterKey | null>(null);
  const t = hdLore.types[chart.type];
  const [pLine, dLine] = chart.profile.split(" ")[0].split("/").map(Number);

  return (
    <div className={`${styles.wrap} ${className ?? ""}`}>
      <div className={styles.stageRow}>
        <Column side="design" chart={chart} />
        <Bodygraph3D chart={chart} selected={sel} onSelect={setSel} className={styles.graph} />
        <Column side="personality" chart={chart} />
      </div>

      {sel && (
        <CodexPanel glow eyebrow={hdLore.centers[sel].theme} title={<>The {hdLore.centers[sel].name} Center · <em className={styles.em}>{chart.definedCenters.has(sel) ? "Defined" : "Open"}</em></>}>
          <p className={styles.prose}>{chart.definedCenters.has(sel) ? hdLore.centers[sel].defined : hdLore.centers[sel].open}</p>
          <div className={styles.gates}>
            {CENTER_GATES[sel].map((g) => {
              const on = chart.activeGates.has(g);
              return (
                <span key={g} className={`${styles.gateChip} ${on ? styles.gateOn : ""}`}>
                  <b>{g}</b> {hdLore.gateNames[g]}
                </span>
              );
            })}
          </div>
        </CodexPanel>
      )}

      <div className={styles.grid}>
        <CodexPanel glow eyebrow="Energy Type" title={<em className={styles.em}>{chart.type}</em>} className={styles.typeCard}>
          <p className={styles.prose}>{t.prose}</p>
          <dl className={styles.facts}>
            <div><dt>Strategy</dt><dd>{t.strategy}</dd></div>
            <div><dt>Signature</dt><dd>{t.signature}</dd></div>
            <div><dt>Not-Self Theme</dt><dd>{t.notSelf}</dd></div>
            <div><dt>Aura</dt><dd>{t.aura}</dd></div>
          </dl>
        </CodexPanel>
        <CodexPanel eyebrow="Inner Authority" title={chart.authority}>
          <p className={styles.prose}>{hdLore.authorities[chart.authority]}</p>
        </CodexPanel>
        <CodexPanel eyebrow="Profile" title={chart.profile}>
          <p className={styles.prose}>
            <span className={styles.label}>Conscious ({pLine}):</span> {hdLore.profiles[pLine]}
          </p>
          <p className={styles.prose}>
            <span className={styles.label}>Unconscious ({dLine}):</span> {hdLore.profiles[dLine]}
          </p>
        </CodexPanel>
        <CodexPanel eyebrow="Incarnation Cross & Definition" title={chart.definition}>
          <p className={styles.prose}>
            Your life theme is carried by four gates: the conscious Sun in <b>{chart.cross.personalitySun}</b> ({hdLore.gateNames[chart.cross.personalitySun]}) and Earth in <b>{chart.cross.personalityEarth}</b> ({hdLore.gateNames[chart.cross.personalityEarth]}), balanced by the unconscious Sun in <b>{chart.cross.designSun}</b> ({hdLore.gateNames[chart.cross.designSun]}) and Earth in <b>{chart.cross.designEarth}</b> ({hdLore.gateNames[chart.cross.designEarth]}).
          </p>
          <p className={styles.mono}>
            Channels: {chart.definedChannels.length ? chart.definedChannels.map((c) => `${c[0]}–${c[1]}`).join(" · ") : "none, an open and reflective design"}
          </p>
        </CodexPanel>
      </div>
    </div>
  );
};

function Column({ side, chart }: { side: "design" | "personality"; chart: HumanDesignChart }) {
  const acts = chart.activations.filter((a) => a.side === side);
  return (
    <div className={`${styles.column} ${side === "design" ? styles.colDesign : styles.colPers}`}>
      <p className={styles.colTitle}>{side === "design" ? "Design" : "Personality"}</p>
      <p className={styles.colSub}>{side === "design" ? "unconscious · body" : "conscious · mind"}</p>
      {BODY_ORDER.map((b) => {
        const a = acts.find((x) => x.body === b)!;
        return (
          <div key={b} className={styles.act} title={hdLore.gateNames[a.gate]}>
            <span className={styles.actGlyph}>{BODY_GLYPHS[b]}</span>
            <span className={styles.actGate}>{a.gate}.{a.line}</span>
          </div>
        );
      })}
    </div>
  );
}
