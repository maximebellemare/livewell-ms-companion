import { PropsWithChildren, createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { authApi } from "../features/auth/api";
import type { AuthContextValue, AuthResult, SignUpResult } from "../features/auth/types";
import type { DevMockAuthState } from "../features/auth/types";
import {
  getDevMockAuthState,
  getMockSessionData,
  setDevMockAuthState as setGlobalDevMockAuthState,
  subscribeToDevMockAuth,
} from "../lib/dev-auth";
import env from "../lib/env";
import { logger } from "../lib/logger";

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export default function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [devMockState, setLocalDevMockState] = useState<DevMockAuthState>(getDevMockAuthState());
  const initializedRef = useRef(false);
  const readyRef = useRef(false);

  const setDevMockState = useCallback((state: DevMockAuthState) => {
    setGlobalDevMockAuthState(state);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!env.isSupabaseConfigured) {
        return { error: new Error("Supabase is not configured. Dev-only mock mode is active.") };
      }

      const result = await authApi.signIn(email, password);
      if (result.error) {
        logger.warn("Sign in failed", { error: result.error.message });
      }
      return result;
    },
    [],
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<SignUpResult> => {
      if (!env.isSupabaseConfigured) {
        return {
          error: new Error("Supabase is not configured. Dev-only mock mode is active."),
          session: null,
        };
      }

      const result = await authApi.signUp(email, password);
      if (result.error) {
        logger.warn("Sign up failed", { error: result.error.message });
      }
      return result;
    },
    [],
  );

  const sendPasswordReset = useCallback(
    async (email: string): Promise<AuthResult> => {
      if (!env.isSupabaseConfigured) {
        return { error: new Error("Supabase is not configured. Dev-only mock mode is active.") };
      }

      const result = await authApi.sendPasswordReset(email);
      if (result.error) {
        logger.warn("Password reset email failed", { error: result.error.message });
      }
      return result;
    },
    [],
  );

  const updatePassword = useCallback(
    async (password: string): Promise<AuthResult> => {
      if (!env.isSupabaseConfigured) {
        return { error: new Error("Supabase is not configured. Dev-only mock mode is active.") };
      }

      const result = await authApi.updatePassword(password);
      if (result.error) {
        logger.warn("Password update failed", { error: result.error.message });
      }
      return result;
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    if (!env.isSupabaseConfigured) {
      setDevMockState("signed-out");
      return;
    }

    await authApi.signOut();
  }, [setDevMockState]);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    if (!env.isSupabaseConfigured) {
      logger.warn("AuthProvider using dev-only mock auth mode");
      const initial = getMockSessionData();
      setSession(initial.session);
      setUser(initial.user);

      const unsubscribe = subscribeToDevMockAuth((state) => {
        const next = getMockSessionData();
        setLocalDevMockState(state);
        setSession(next.session);
        setUser(next.user);
      });

      if (!readyRef.current) {
        readyRef.current = true;
        setIsReady(true);
      }

      return unsubscribe;
    }

    const { data } = authApi.onAuthStateChange((nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    void authApi
      .getSession()
      .then((nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
      })
      .catch((error) => {
        logger.error("Initial session restore failed", { error: String(error) });
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        if (!readyRef.current) {
          readyRef.current = true;
          setIsReady(true);
        }
      });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      isReady,
      isAuthenticated: !!user,
      isMockMode: !env.isSupabaseConfigured,
      devMockState,
      setDevMockState,
      signIn,
      signUp,
      sendPasswordReset,
      updatePassword,
      signOut,
    }),
    [devMockState, isReady, sendPasswordReset, session, setDevMockState, signIn, signOut, signUp, updatePassword, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
