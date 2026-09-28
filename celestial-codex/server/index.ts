import "dotenv/config";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerRoutes } from "./routes";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", true);

// Stripe webhooks need the raw body for signature verification; everything
// else arrives as raw text so handlers can superjson.parse(req.body) exactly
// like the Floot handlers parsed request.text().
app.use("/_api/billing/webhook", express.raw({ type: () => true, limit: "1mb" }));
app.use("/_api", express.text({ type: () => true, limit: "2mb" }));

registerRoutes(app);

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/_api\/).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
  console.log(`[codex] serving built app from ${dist}`);
} else {
  console.log("[codex] dist/ not found — API only. Run `npm run dev` for the Vite dev server, or `npm run build` to serve the app from this port.");
}

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  if (!process.env.JWT_SECRET) {
    console.warn("[codex] JWT_SECRET is unset; using the built-in dev secret. Set it in .env for anything but local development.");
  }
  console.log(`[codex] listening on http://localhost:${port}`);
});
