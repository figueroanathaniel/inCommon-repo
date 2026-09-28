import React, { type ComponentType, type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Link } from "react-router-dom";
import { GlobalContextProviders } from "./components/_globalContextProviders";
import HomePage from "./pages/_index";
import indexLayout from "./pages/_index.pageLayout";
import LoginPage from "./pages/login";
import loginLayout from "./pages/login.pageLayout";
import CodexPage from "./pages/codex";
import codexLayout from "./pages/codex.pageLayout";
import PremiumPage from "./pages/premium";
import premiumLayout from "./pages/premium.pageLayout";
import "./base.css";

type Layout = ComponentType<{ children: ReactNode }>;

// Floot pages declare layout chains via `<name>.pageLayout.tsx` (arrays of
// providers). Reproduce that here: first component is the outermost wrapper.
function wrap(layouts: Layout[], page: ReactNode): ReactNode {
  return layouts.reduceRight<ReactNode>((child, LayoutComponent) => {
    return <LayoutComponent>{child}</LayoutComponent>;
  }, page);
}

function NotFound() {
  return (
    <div style={{ padding: "4rem 2rem", textAlign: "center", fontFamily: "var(--font-family-display)" }}>
      <p style={{ letterSpacing: "0.35em", textTransform: "uppercase", color: "var(--muted-foreground)", fontSize: "0.8rem" }}>Lost in the dome</p>
      <h1 style={{ fontSize: "2.5rem", fontStyle: "italic" }}>This page drifted out of alignment.</h1>
      <p><Link to="/" style={{ color: "var(--primary)" }}>Return to the observatory</Link></p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalContextProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={wrap(indexLayout, <HomePage />)} />
          <Route path="/login" element={wrap(loginLayout, <LoginPage />)} />
          <Route path="/codex" element={wrap(codexLayout, <CodexPage />)} />
          <Route path="/premium" element={wrap(premiumLayout, <PremiumPage />)} />
          <Route path="*" element={wrap(indexLayout, <NotFound />)} />
        </Routes>
      </BrowserRouter>
    </GlobalContextProviders>
  </React.StrictMode>
);
