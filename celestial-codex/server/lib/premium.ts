import { PremiumRequiredError } from "./errors";
import { stripeServer } from "./stripeServer";

export { PremiumRequiredError };

/** Backend-only: throws PremiumRequiredError unless the user has an active subscription (admins always pass). */
export async function requirePremium(user: { id: number; role: string }) {
  if (user.role === "admin") return;
  const status = await stripeServer.getStatus(user.id);
  if (!status.isPremium) throw new PremiumRequiredError();
}
