import React, { Suspense, lazy, useState } from "react";
import { Helmet } from "react-helmet";
import { PenLine } from "lucide-react";
import { useAuth } from "../helpers/useAuth";
import { useCodexQueries } from "../helpers/useCodexQueries";
import { formatDegree, SIGN_NAMES } from "../helpers/astroEngine";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/Tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/Dialog";
import { Button } from "../components/Button";
import { Skeleton } from "../components/Skeleton";
import { BirthProfileForm } from "../components/BirthProfileForm";
import { CodexPanel } from "../components/CodexPanel";
import { CodexSynthesis } from "../components/CodexSynthesis";
import { CodexStars } from "../components/CodexStars";
import { CodexDesign } from "../components/CodexDesign";
import { CodexNumbers } from "../components/CodexNumbers";
import { CodexOracle } from "../components/CodexOracle";
import { CodexAdvanced } from "../components/CodexAdvanced";
import { PremiumGate } from "../components/PremiumGate";
import { Spinner } from "../components/Spinner";
import styles from "./codex.module.css";

const CodexAtlas = lazy(() => import("../components/CodexAtlas").then((m) => ({ default: m.CodexAtlas })));

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CodexPage() {
  const { authState } = useAuth();
  const profileQ = useCodexQueries.useProfile();
  const profile = profileQ.data;
  const blueprint = useCodexQueries.useBlueprint(profile);
  const [tab, setTab] = useState("synthesis");
  const [editing, setEditing] = useState(false);
  const displayName = authState.type === "authenticated" ? authState.user.displayName : "";

  if (profileQ.isFetching && profile === undefined) {
    return (
      <div className={styles.page}>
        <Skeleton className={styles.skTitle} />
        <Skeleton className={styles.skBody} />
      </div>
    );
  }

  if (profileQ.error) {
    return (
      <div className={styles.page}>
        <CodexPanel title="The heavens are veiled">
          <p>{(profileQ.error as Error).message}</p>
          <Button onClick={() => profileQ.refetch()}>Try again</Button>
        </CodexPanel>
      </div>
    );
  }

  if (!profile || !blueprint) {
    return (
      <div className={styles.page}>
        <Helmet><title>Begin your Codex · Celestial Codex</title></Helmet>
        <div className={styles.onboard}>
          <p className={styles.eyebrow}>The First Inscription</p>
          <h1 className={styles.onboardTitle}>
            Tell the Codex <em>when you arrived.</em>
          </h1>
          <p className={styles.onboardLede}>
            Three coordinates unlock everything: the name you were given, the moment of your first breath, and the place where the sky first saw you.
          </p>
          <CodexPanel glow className={styles.onboardCard}>
            <BirthProfileForm defaultName={displayName} />
          </CodexPanel>
        </div>
      </div>
    );
  }

  const firstName = profile.fullName.split(" ")[0];
  const [y, m, d] = profile.birthDate.split("-").map(Number);
  const sun = blueprint.natal.planets.find((p) => p.key === "sun")!;
  const moon = blueprint.natal.planets.find((p) => p.key === "moon")!;

  return (
    <div className={styles.page}>
      <Helmet><title>{`The Codex of ${firstName} · Celestial Codex`}</title></Helmet>

      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            {MONTHS[m - 1]} {d}, {y}
            {profile.birthTime ? ` · ${profile.birthTime}` : " · time unknown"}
            {profile.birthPlace ? ` · ${profile.birthPlace}` : ""}
          </p>
          <h1 className={styles.title}>
            The Codex of <em>{firstName}</em>
          </h1>
          <p className={styles.signature}>
            ☉ {SIGN_NAMES[sun.signIndex]} &nbsp;·&nbsp; ☽ {SIGN_NAMES[moon.signIndex]}
            {blueprint.natal.ascendant !== null && <> &nbsp;·&nbsp; AC {formatDegree(blueprint.natal.ascendant).split(" ").slice(1).join(" ")}</>}
            &nbsp;·&nbsp; ◈ {blueprint.hd.type} &nbsp;·&nbsp; ∞ Life Path {blueprint.numbers.lifePath}
          </p>
        </div>
        <Button variant="outline" onClick={() => setEditing(true)}>
          <PenLine size={16} /> Edit birth data
        </Button>
      </header>

      <Tabs value={tab} onValueChange={setTab} className={styles.tabs}>
        <TabsList className={styles.tabsList}>
          <TabsTrigger value="synthesis">✶ Synthesis</TabsTrigger>
          <TabsTrigger value="stars">☉ The Stars</TabsTrigger>
          <TabsTrigger value="design">◈ The Design</TabsTrigger>
          <TabsTrigger value="numbers">∞ The Numbers</TabsTrigger>
          <TabsTrigger value="oracle">☽ The Oracle</TabsTrigger>
          <TabsTrigger value="advanced">✦ Advanced</TabsTrigger>
          <TabsTrigger value="atlas">◎ Atlas</TabsTrigger>
        </TabsList>
        <TabsContent value="synthesis" className={styles.tabBody}>
          <CodexSynthesis firstName={firstName} natal={blueprint.natal} hd={blueprint.hd} numbers={blueprint.numbers} onNavigate={setTab} />
        </TabsContent>
        <TabsContent value="stars" className={styles.tabBody}>
          <CodexStars chart={blueprint.natal} />
        </TabsContent>
        <TabsContent value="design" className={styles.tabBody}>
          <CodexDesign chart={blueprint.hd} />
        </TabsContent>
        <TabsContent value="numbers" className={styles.tabBody}>
          <CodexNumbers numbers={blueprint.numbers} />
        </TabsContent>
        <TabsContent value="oracle" className={styles.tabBody}>
          <CodexOracle profile={profile} />
        </TabsContent>
        <TabsContent value="advanced" className={styles.tabBody}>
          <PremiumGate
            feature="The Advanced Chart"
            teaser="Every point in your sky, rendered in 3D: Chiron, Ceres, Pallas, Juno, Vesta, Eris, Black Moon Lilith, both Nodes, the Vertex, the Part of Fortune, and the East Point, with minor aspects and a reading for each."
          >
            <CodexAdvanced natal={blueprint.natal} profile={profile} />
          </PremiumGate>
        </TabsContent>
        <TabsContent value="atlas" className={styles.tabBody}>
          <PremiumGate
            feature="Astrocartography"
            teaser="A living 3D globe traced with the lines where each of your planets rose, crowned, and set at the moment of your birth. Find where love, career, and belonging come easiest, then ask the Oracle for a full relocation reading of any city."
          >
            <Suspense fallback={<div className={styles.lazy}><Spinner /> Unrolling the celestial atlas…</div>}>
              <CodexAtlas profile={profile} instant={blueprint.instant} />
            </Suspense>
          </PremiumGate>
        </TabsContent>
      </Tabs>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className={styles.dialog}>
          <DialogHeader>
            <DialogTitle>Re-inscribe your birth data</DialogTitle>
            <DialogDescription>Changing these details recasts every chart and clears previous horoscopes.</DialogDescription>
          </DialogHeader>
          <BirthProfileForm initial={profile} submitLabel="Recast my Codex" onSaved={() => setEditing(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
