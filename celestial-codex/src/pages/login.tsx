import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { OAuthButtonGroup } from "../components/OAuthButtonGroup";
import { PasswordLoginForm } from "../components/PasswordLoginForm";
import { PasswordRegisterForm } from "../components/PasswordRegisterForm";
import { useAuth } from "../helpers/useAuth";
import styles from "./login.module.css";

export default function LoginPage() {
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");

  useEffect(() => {
    if (authState.type === "authenticated") navigate("/codex", { replace: true });
  }, [authState.type, navigate]);

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Enter the Codex · Celestial Codex</title>
      </Helmet>
      <div className={styles.card}>
        <div className={styles.sigil} aria-hidden>
          <span>✶</span>
        </div>
        <p className={styles.eyebrow}>The Threshold</p>
        <h1 className={styles.title}>
          Step beneath <em>the dome</em>
        </h1>
        <p className={styles.lede}>Sign in so the Codex can remember your stars and keep your horoscopes waiting for you.</p>

        <OAuthButtonGroup className={styles.oauth} />

        <div className={styles.divider}>
          <span>or by quill and ink</span>
        </div>

        {mode === "login" ? <PasswordLoginForm /> : <PasswordRegisterForm />}

        <button type="button" className={styles.switch} onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}>
          {mode === "login" ? "New here? Create an account with email" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
