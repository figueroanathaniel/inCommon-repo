import { useMutation, useQuery } from "@tanstack/react-query";
import { getBillingStatus } from "../endpoints/billing/status_GET.schema";
import { postCheckout } from "../endpoints/billing/checkout_POST.schema";
import { postBillingPortal } from "../endpoints/billing/portal_POST.schema";
import { useAuth } from "./useAuth";

export const PREMIUM_KEY = ["billing", "status"] as const;

/** Opens an external Stripe page: same tab on the published app, a new tab inside the editor preview iframe. */
function openExternal(pending: Window | null, url: string) {
  if (pending) pending.location.href = url;
  else window.location.href = url;
}

const inIframe = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

export const usePremium = {
  useStatus: (sync = false) => {
    const { authState } = useAuth();
    return useQuery({
      queryKey: [...PREMIUM_KEY, sync],
      queryFn: async () => (await getBillingStatus({ sync })).status,
      enabled: authState.type === "authenticated",
      staleTime: 60 * 1000,
    });
  },

  useCheckout: () =>
    useMutation({
      mutationFn: async (plan: "monthly" | "annual") => {
        const pending = inIframe() ? window.open("", "_blank") : null;
        try {
          const { url } = await postCheckout({ plan });
          openExternal(pending, url);
        } catch (e) {
          pending?.close();
          throw e;
        }
      },
    }),

  usePortal: () =>
    useMutation({
      mutationFn: async () => {
        const pending = inIframe() ? window.open("", "_blank") : null;
        try {
          const { url } = await postBillingPortal();
          openExternal(pending, url);
        } catch (e) {
          pending?.close();
          throw e;
        }
      },
    }),
};
