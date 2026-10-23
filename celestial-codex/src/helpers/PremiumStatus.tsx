export type PremiumStatus = {
  isPremium: boolean;
  plan: "monthly" | "annual" | null;
  status: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  billingConfigured: boolean;
};

export const PREMIUM_PRICES = {
  monthly: { amount: 1299, label: "$12.99", interval: "month" as const },
  annual: { amount: 11999, label: "$119.99", interval: "year" as const },
};
