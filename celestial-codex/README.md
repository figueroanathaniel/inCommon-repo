# Celestial Codex (standalone)

A standalone recreation of the **Celestial Codex** Floot project, living outside
the Floot runtime. Same pages, components, helpers, and endpoint logic; the
Floot-specific services are replaced with local equivalents so the app runs
anywhere Node runs.

Motivation: inside the Floot editor the WebGL scenes repeatedly failed to
render (`[Codex3D] no frame rendered after 4s; switching to 2D`, plus multiple
instances of Three.js). Running the app on a normal origin gives the 3D scenes
a real canvas.

## Run it

```bash
npm install
cp .env.example .env      # then fill in what you have
npm run dev               # vite on :5173, api on :8787 (/_api proxied)
```

Production shape:

```bash
npm run build
npm start                 # serves dist/ + /_api on :8787
```

## What was replaced (and where)

| Floot service            | Standalone equivalent                                             |
|--------------------------|-------------------------------------------------------------------|
| Floot AI (`@floot/ai`, model `gpt-6-luna`) | `server/ai.ts` — OpenAI **Responses API** via `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL`. Same strict-JSON-schema prompts. Without a key the oracle endpoints return the app's existing "temporarily unavailable" 503, exactly like Floot's out-of-credits path. |
| Floot Postgres (`FLOOT_DATABASE_URL`, kysely) | `server/db.ts` — JSON file store in `server/data/db.json` with the same table shapes. Handler queries were ported from kysely chains to array operations. |
| Floot OAuth (brokered Google sign-in) | Not portable. `OAuthButtonGroup` renders nothing unless `VITE_ENABLE_OAUTH=true` is set after wiring your own provider. Email/password auth works fully. |
| Session cookie `floot_built_app_session` | `codex_session` (`server/session.ts`, jose JWT, 1-week rolling). `Secure` flag only on https origins so plain-http dev works. |
| Stripe billing           | Ported as-is (`STRIPE_SECRET_KEY`, optional `STRIPE_WEBHOOK_SECRET`). Without a key, billing status reports `billingConfigured: false` and the premium page shows "Payments are being set up." |

Admin role: register with an email listed in `CODEX_ADMIN_EMAILS` to bypass
the Luminary paywall (same rule as the Floot app).

## Layout

```
src/
  components/   pages/   helpers/   endpoints/   # mirrors the Floot item tree;
                                                   # endpoints/ holds only the
                                                   # typed fetch wrappers (.schema.ts)
server/
  index.ts       express entry (api + static + SPA fallback)
  routes.ts      route table (all /_api/* handlers)
  handlers/      one file per endpoint, ported from endpoints/*_METHOD.ts
  db.ts          JSON store   ·   ai.ts  OpenAI adapter   ·   session.ts  auth cookies
```

Kept deliberately out of the recreation (dev-harness or Floot-runtime-only):
component `.example.tsx` showcases, helper `.spec.tsx` files, and the OAuth
chain (`FlootOAuthProvider`, `OAuthLoginButton`, `oauth_*` endpoints,
`establish_session`, `oauthPopupMessage`).

## Notes

- Ephemeris math runs client-side only, exactly as before
  (`astronomy-engine` cannot load in the server runtime; the ported handlers
  never import it).
- Asteroid lookups (NASA JPL Horizons) still run **sequentially** on the
  server and cache into `birth_profiles.extended_points`.
- This folder is self-contained: the repo's main site (a buildless bundle in
  `deploy/`) is untouched, and no repo-root build config changes are needed.
