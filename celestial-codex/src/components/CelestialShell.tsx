import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Crown, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "../helpers/useAuth";
import { Button } from "./Button";
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import styles from "./CelestialShell.module.css";

export const CelestialShell = ({ children }: { children: React.ReactNode }) => {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Stop sideways drift and rubber-band stretch on phones.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = [html.style.overflowX, body.style.overflowX, html.style.overscrollBehavior, body.style.overscrollBehavior];
    html.style.overflowX = "hidden";
    body.style.overflowX = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";
    return () => {
      [html.style.overflowX, body.style.overflowX, html.style.overscrollBehavior, body.style.overscrollBehavior] = prev;
    };
  }, []);

  return (
    <div className={styles.shell}>
      <div className={styles.backdrop} aria-hidden>
        <div className={styles.nebula} />
        <div className={styles.starsFar} />
        <div className={styles.starsNear} />
      </div>

      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandMark}>✶</span>
          <span className={styles.brandName}>
            Celestial <em>Codex</em>
          </span>
        </Link>
        <nav className={styles.nav}>
          {authState.type === "authenticated" ? (
            <>
              {location.pathname !== "/codex" && (
                <Button asChild variant="ghost" size="md" className={styles.navLink}>
                  <Link to="/codex">
                    <Sparkles size={16} /> My Codex
                  </Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={styles.avatarBtn} aria-label="Account menu">
                    <Avatar className={styles.avatar}>
                      {authState.user.avatarUrl && <AvatarImage src={authState.user.avatarUrl} alt="" />}
                      <AvatarFallback>{authState.user.displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{authState.user.displayName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate("/codex")}>
                    <Sparkles size={14} /> My Codex
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => navigate("/premium")}>
                    <Crown size={14} /> Codex Luminary
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={async () => {
                      await logout();
                      navigate("/");
                    }}
                  >
                    <LogOut size={14} /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : authState.type === "unauthenticated" && location.pathname !== "/login" ? (
            <Button asChild variant="outline" size="md">
              <Link to="/login">Sign in</Link>
            </Button>
          ) : null}
        </nav>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <span className={styles.footerRule} />
        <p>
          <em>As above, so below.</em> Planetary positions computed from true ephemerides. For reflection and wonder, never prescription.
        </p>
      </footer>
    </div>
  );
};
