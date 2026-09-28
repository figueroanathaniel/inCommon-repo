export class PremiumRequiredError extends Error {
  constructor() {
    super("This feature is part of Codex Luminary.");
    this.name = "PremiumRequiredError";
  }
}
