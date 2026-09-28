import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Check, Globe2, Orbit, ScrollText, HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { usePremium, PREMIUM_KEY } from "../helpers/usePremium";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import styles from "./premium.module.css";

const FEATURES = [
  { icon: Globe2, title: "Astrocartography", body: "A spinning 3D globe traced with every planetary line of your birth. Tap any city to learn which planets rise, culminate, or set there, then ask the Oracle for a full relocation reading." },
  { icon: Orbit, title: "The Advanced Chart", body: "Every point the old astrologers used: Chiron, Ceres, Pallas, Juno, Vesta, Eris, Black Moon Lilith, both Nodes, the Vertex, the Part of Fortune, the East Point, and minor aspects, all in a 3D sphere you can explore." },
  { icon: ScrollText, title: "In-Depth Horoscopes", body: "Long-form daily, weekly, and monthly readings that use your whole chart, including asteroids and sensitive points, with timing windows, shadow work, and practical guidance." },
  { icon: HeartHandshake, title: "Synastry (coming next)", body: "Overlay two charts and read the conversation between two souls. Included in Luminary when it arrives." },
];

export default function PremiumPage() {
  const [params, setParams] = useSearchParams();
  const justPaid = params.get("checkout") === "success";
  const status = usePremium.useStatus(justPaid);
  const checkout = usePremium.useCheckout();
  const portal = usePremium.usePortal();
  const qc = useQueryClient();
  const [plan, setPlan] = useState<"monthly" | "annual">("annual");

  useEffect(() => {
    if (justPaid && status.data?.isPremium) {
      toast.success("Welcome to Codex Luminary. The whole sky is yours.");
      qc.invalidateQueries({ queryKey: PREMIUM_KEY });
      setParams({}, { replace: true });
    }
    if (params.get("checkout") === "cancelled") {
      toast("Checkout was closed. Nothing was charged.");
      setParams({}, { replace: true });
    }
  }, [justPaid, status.data?.isPremium, params, setParams, qc]);

  const s = status.data;

  return (
    <div className={styles.page}>
      <Helmet><title>Codex Luminary · Celestial Codex</title></Helmet>
      <header className={styles.head}>
        <p className={styles.eyebrow}>Codex Luminary</p>
        <h1 className={styles.title}>
          Open <em>the whole sky.</em>
        </h1>
        <p className={styles.lede}>Where on Earth your stars burn brightest, every hidden point in your chart, and readings written with an astrologer's full attention.</p>
      </header>

      {s?.isPremium ? (
        <div className={styles.member}>
          <p className={styles.memberTitle}>✶ You are a Luminary</p>
          <p className={styles.memberSub}>
            {s.plan === "annual" ? "Annual" : "Monthly"} plan
            {s.currentPeriodEnd ? ` · ${s.cancelAtPeriodEnd ? "ends" : "renews"} ${new Date(s.currentPeriodEnd).toLocaleDateString()}` : ""}
          </p>
          <div className={styles.memberActions}>
            <Button asChild size="lg"><Link to="/codex">Return to your Codex</Link></Button>
            {s.status && s.plan && (
              <Button variant="outline" size="lg" disabled={portal.isPending} onClick={() => portal.mutate(undefined, { onError: (e) => toast.error(e.message) })}>
                {portal.isPending ? <Spinner size="sm" /> : null} Manage billing
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.plans}>
          {(["monthly", "annual"] as const).map((p) => (
            <button key={p} type="button" className={`${styles.plan} ${plan === p ? styles.planActive : ""}`} onClick={() => setPlan(p)}>
              {p === "annual" && <span className={styles.badge}>Save 23%</span>}
              <span className={styles.planName}>{p === "annual" ? "Yearly" : "Monthly"}</span>
              <span className={styles.price}>{p === "annual" ? "$119.99" : "$12.99"}</span>
              <span className={styles.per}>{p === "annual" ? "per year · $10.00/mo" : "per month"}</span>
            </button>
          ))}
          <Button
            size="lg"
            className={styles.cta}
            disabled={checkout.isPending || status.isFetching || s?.billingConfigured === false}
            onClick={() => checkout.mutate(plan, { onError: (e) => toast.error(e.message) })}
          >
            {checkout.isPending ? <><Spinner size="sm" /> Opening secure checkout…</> : `Become a Luminary · ${plan === "annual" ? "$119.99/yr" : "$12.99/mo"}`}
          </Button>
          {s?.billingConfigured === false && <p className={styles.note}>Payments are being set up. Check back soon.</p>}
          {justPaid && !s?.isPremium && <p className={styles.note}>Confirming your payment with Stripe…</p>}
          <p className={styles.fine}>Secure payment by Stripe. Cancel anytime from the billing portal.</p>
        </div>
      )}

      <div className={styles.features}>
        {FEATURES.map((f) => (
          <div key={f.title} className={styles.feature}>
            <f.icon className={styles.fIcon} size={26} />
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </div>

      <ul className={styles.free}>
        <li><Check size={14} /> Free forever: natal sphere, bodygraph, numerology orrery, and standard horoscopes</li>
      </ul>
    </div>
  );
}
