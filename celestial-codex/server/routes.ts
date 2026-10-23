import type { Express, Request, Response } from "express";
import superjson from "superjson";
import { handle as sessionGet } from "./handlers/auth/session_GET";
import { handle as logoutPost } from "./handlers/auth/logout_POST";
import { handle as loginPost } from "./handlers/auth/login_with_password_POST";
import { handle as registerPost } from "./handlers/auth/register_with_password_POST";
import { handle as profileGet } from "./handlers/profile_GET";
import { handle as profilePost } from "./handlers/profile_POST";
import { handle as geocodeGet } from "./handlers/geocode_GET";
import { handle as horoscopePost } from "./handlers/horoscope_POST";
import { handle as relocationPost } from "./handlers/relocation_POST";
import { handle as asteroidsGet } from "./handlers/points/asteroids_GET";
import { handle as billingStatusGet } from "./handlers/billing/status_GET";
import { handle as billingCheckoutPost } from "./handlers/billing/checkout_POST";
import { handle as billingPortalPost } from "./handlers/billing/portal_POST";
import { handle as billingWebhookPost } from "./handlers/billing/webhook_POST";

type Handler = (req: Request, res: Response) => Promise<void>;

function wrap(handler: Handler) {
  return async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (error) {
      if (res.headersSent) return;
      res
        .status(500)
        .set("Content-Type", "application/json")
        .send(
          superjson.stringify({
            error: error instanceof Error ? error.message : "Failed",
          })
        );
    }
  };
}

// The Floot-brokered Google OAuth flow has no equivalent outside Floot.
async function notAvailable(req: Request, res: Response) {
  res
    .status(501)
    .set("Content-Type", "application/json")
    .send(
      superjson.stringify({
        error: "Not available in the standalone build. Use email sign-in.",
      })
    );
}

export function registerRoutes(app: Express) {
  // auth
  app.get("/_api/auth/session", wrap(sessionGet));
  app.post("/_api/auth/logout", wrap(logoutPost));
  app.post("/_api/auth/login_with_password", wrap(loginPost));
  app.post("/_api/auth/register_with_password", wrap(registerPost));
  app.get("/_api/auth/oauth_authorize", wrap(notAvailable));
  app.get("/_api/auth/oauth_callback", wrap(notAvailable));
  app.post("/_api/auth/establish_session", wrap(notAvailable));

  // birth profile + geocoding
  app.get("/_api/profile", wrap(profileGet));
  app.post("/_api/profile", wrap(profilePost));
  app.get("/_api/geocode", wrap(geocodeGet));

  // oracles
  app.post("/_api/horoscope", wrap(horoscopePost));
  app.post("/_api/relocation", wrap(relocationPost));
  app.get("/_api/points/asteroids", wrap(asteroidsGet));

  // billing
  app.get("/_api/billing/status", wrap(billingStatusGet));
  app.post("/_api/billing/checkout", wrap(billingCheckoutPost));
  app.post("/_api/billing/portal", wrap(billingPortalPost));
  app.post("/_api/billing/webhook", wrap(billingWebhookPost));
}
