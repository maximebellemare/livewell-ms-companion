import { useProfile } from "./useProfile";

export const usePremium = () => {
  const { data: profile, isLoading } = useProfile();

  const isPremium = !!profile?.is_premium;
  const premiumUntil = (profile as any)?.premium_until ?? null;

  // Check if premium has expired
  const isActive = isPremium && (!premiumUntil || new Date(premiumUntil) > new Date());

  return {
    isPremium: isActive,
    isLoading,
    premiumUntil,
  };
};
