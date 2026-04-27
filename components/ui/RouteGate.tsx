import { PropsWithChildren, useEffect } from "react";
import { usePathname, useRouter, useSegments } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../features/auth/hooks";
import { useMyProfile } from "../../features/profile/hooks";
import { getErrorMessage, normalizeError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import ErrorState from "./ErrorState";
import LoadingState from "./LoadingState";

type RouteGateMode = "public" | "auth" | "onboarding" | "app";

type RouteGateProps = PropsWithChildren<{
  mode: RouteGateMode;
}>;

function getAllowedPath(mode: RouteGateMode, onboardingCompleted: boolean | null) {
  if (mode === "public") {
    return onboardingCompleted === false ? "/welcome" : "/today";
  }

  if (mode === "auth") {
    return onboardingCompleted === false ? "/welcome" : "/today";
  }

  if (mode === "onboarding") {
    return onboardingCompleted === false ? null : "/today";
  }

  return onboardingCompleted === false ? "/welcome" : null;
}

export default function RouteGate({ children, mode }: RouteGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const queryClient = useQueryClient();
  const { isReady, isAuthenticated, user } = useAuth();
  const shouldLoadProfile = isReady && isAuthenticated && !!user?.id;
  const profileQuery = useMyProfile(user?.id, shouldLoadProfile);

  const activeGroup = segments[0] ?? null;
  const expectedGroup =
    mode === "public"
      ? "(public)"
      : mode === "auth"
        ? "(auth)"
        : mode === "onboarding"
          ? "(onboarding)"
          : "(app)";

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      if (mode === "app" || mode === "onboarding") {
        logger.info("Redirecting signed-out user", { from: pathname, to: "/sign-in" });
        router.replace("/sign-in");
      }
      return;
    }

    if (profileQuery.isLoading) {
      return;
    }

    if (profileQuery.isError) {
      const normalizedError = normalizeError(profileQuery.error);
      logger.error("Profile query failed during route gate", {
        mode,
        pathname,
        userId: user?.id ?? null,
        message: normalizedError.message,
        code: normalizedError.code,
        details: normalizedError.details,
        hint: normalizedError.hint,
      });
      return;
    }

    const nextPath = getAllowedPath(mode, profileQuery.data?.onboarding_completed ?? null);
    if (nextPath) {
      logger.info("Redirecting authenticated user", { from: pathname, to: nextPath });
      router.replace(nextPath);
    }
  }, [
    isAuthenticated,
    isReady,
    mode,
    pathname,
    profileQuery.data?.onboarding_completed,
    profileQuery.error,
    profileQuery.isError,
    profileQuery.isLoading,
    router,
  ]);

  if (!isReady) {
    return <LoadingState message="Restoring session..." />;
  }

  if (!isAuthenticated) {
    if (mode === "app" || mode === "onboarding") {
      return <LoadingState message="Redirecting..." />;
    }

    return activeGroup === expectedGroup ? <>{children}</> : <LoadingState message="Loading..." />;
  }

  if (profileQuery.isLoading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (profileQuery.isError) {
    const normalizedError = normalizeError(profileQuery.error);
    return (
      <ErrorState
        message={normalizedError.message}
        onRetry={() => void queryClient.invalidateQueries({ queryKey: ["profile", user?.id] })}
      />
    );
  }

  const onboardingCompleted = profileQuery.data?.onboarding_completed ?? false;
  const nextPath = getAllowedPath(mode, onboardingCompleted);

  if (nextPath) {
    return <LoadingState message="Redirecting..." />;
  }

  if (activeGroup !== expectedGroup) {
    return <LoadingState message="Loading..." />;
  }

  return <>{children}</>;
}
