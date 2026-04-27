import { PropsWithChildren, createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { authApi } from "../features/auth/api";
import type { AuthContextValue } from "../features/auth/types";
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
      signOut: async () => {
        if (!env.isSupabaseConfigured) {
          setDevMockState("signed-out");
          return;
        }

        await authApi.signOut();
      },
    }),
    [devMockState, isReady, session, setDevMockState, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
