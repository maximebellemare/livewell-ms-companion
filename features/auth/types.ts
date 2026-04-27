import type { AuthError, Session, User } from "@supabase/supabase-js";

export type DevMockAuthState = "signed-out" | "signed-in-onboarded" | "signed-in-not-onboarded";

export type AuthResult = {
  error: AuthError | Error | null;
};

export type SignUpResult = {
  error: AuthError | Error | null;
  session: Session | null;
};

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isReady: boolean;
  isAuthenticated: boolean;
  isMockMode: boolean;
  devMockState: DevMockAuthState;
  setDevMockState: (state: DevMockAuthState) => void;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};
