import type { Session, User } from "@supabase/supabase-js";
import type { DevMockAuthState } from "../features/auth/types";
import type { Profile } from "../features/profile/types";

type Listener = (state: DevMockAuthState) => void;

let currentState: DevMockAuthState = "signed-out";
const listeners = new Set<Listener>();

function buildMockUser(): User {
  return {
    id: "dev-mock-user",
    app_metadata: {},
    user_metadata: { source: "dev-mock" },
    aud: "authenticated",
    created_at: new Date(0).toISOString(),
  } as User;
}

function buildMockSession(user: User): Session {
  return {
    access_token: "dev-mock-access-token",
    refresh_token: "dev-mock-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
  } as Session;
}

export function getDevMockAuthState() {
  return currentState;
}

export function setDevMockAuthState(state: DevMockAuthState) {
  currentState = state;
  listeners.forEach((listener) => listener(state));
}

export function subscribeToDevMockAuth(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getMockSessionData() {
  if (currentState === "signed-out") {
    return { session: null, user: null };
  }

  const user = buildMockUser();
  return {
    session: buildMockSession(user),
    user,
  };
}

export function getMockProfile(): Profile {
  return {
    user_id: "dev-mock-user",
    onboarding_completed: currentState === "signed-in-onboarded",
  };
}
