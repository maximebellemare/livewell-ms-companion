import { useEffect, useCallback, useState } from "react";
import { useProfile } from "./useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useQueryClient } from "@tanstack/react-query";

export const STRIPE_PRICES = {
  monthly: "price_1T3gt7FS8l3FziwrnnmxTt3S",
  annual: "price_1T3gxSFS8l3Fziwrr3ctpsqg",
} as const;

type BillingState = {
  checked: boolean;
  hasStripeCustomer: boolean;
  hasActiveSubscription: boolean;
};

const INITIAL_BILLING_STATE: BillingState = {
  checked: false,
  hasStripeCustomer: false,
  hasActiveSubscription: false,
};

const hasValidFutureDate = (value: string | null | undefined) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date > new Date();
};

export const usePremium = () => {
  const { data: profile, isLoading } = useProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [billingState, setBillingState] = useState<BillingState>(INITIAL_BILLING_STATE);

  const isPremium = !!profile?.is_premium;
  const premiumUntil = profile?.premium_until ?? null;
  const hasFuturePremiumUntil = hasValidFutureDate(premiumUntil);

  // Check if premium has expired (local fallback)
  const isActive = isPremium && (!premiumUntil || hasFuturePremiumUntil);

  // Whether the user has a real Stripe-backed subscription (not just a manual DB flag)
  const hasRealSubscription =
    billingState.checked &&
    billingState.hasStripeCustomer &&
    billingState.hasActiveSubscription &&
    hasFuturePremiumUntil;

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setBillingState(INITIAL_BILLING_STATE);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      setBillingState({
        checked: true,
        hasStripeCustomer: Boolean(data?.customer_exists),
        hasActiveSubscription: Boolean(data?.subscribed) && Boolean(data?.billing_portal_eligible),
      });

      // Invalidate profile to pick up synced is_premium
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    } catch (e) {
      console.error("Failed to check subscription:", e);
      setBillingState({
        checked: true,
        hasStripeCustomer: false,
        hasActiveSubscription: false,
      });
    }
  }, [user, queryClient]);

  useEffect(() => {
    setBillingState(INITIAL_BILLING_STATE);
  }, [user?.id]);

  // Check on mount and periodically
  useEffect(() => {
    if (!user) return;
    checkSubscription();
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return {
    isPremium: isActive,
    isLoading,
    premiumUntil,
    hasRealSubscription,
    hasBillingCustomer: billingState.hasStripeCustomer,
    isBillingStatusLoading: !!user && !billingState.checked,
    checkSubscription,
  };
};
