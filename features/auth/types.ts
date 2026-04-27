import type { Session, User } from "@supabase/supabase-js";

export type DevMockAuthState = "signed-out" | "signed-in-onboarded" | "signed-in-not-onboarded";

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isReady: boolean;
  isAuthenticated: boolean;
  isMockMode: boolean;
  devMockState: DevMockAuthState;
  setDevMockState: (state: DevMockAuthState) => void;
  signOut: () => Promise<void>;
};
