import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { isReactNativeWebView, postToNativeWebView } from "@/lib/webview";
import { SignInWithApple } from "@capacitor-community/apple-sign-in";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  signInWithApple: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      if (event === "SIGNED_OUT") {
        queryClient.clear();
        postToNativeWebView({ type: "AUTH_SIGNED_OUT" });
      }
    });

    const restoreSession = async (attempt = 0) => {
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
      } catch {
        if (attempt < 2) {
          setTimeout(() => restoreSession(attempt + 1), 1500);
        } else {
          setLoading(false);
        }
      }
    };
    restoreSession();

    return () => subscription.unsubscribe();
  }, [queryClient]);

  useEffect(() => {
    if (!isReactNativeWebView) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && session) {
        supabase.auth.getSession().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [session]);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      return { error };
    } catch (e: any) {
      return { error: { message: e?.message || "Signup failed. Please try again." } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (e: any) {
      return { error: { message: e?.message || "Login failed. Please try again." } };
    }
  };

  const signOut = useCallback(async () => {
    try {
      queryClient.clear();
      await supabase.auth.signOut();
    } catch {
      setSession(null);
      setUser(null);
      queryClient.clear();
    }
    postToNativeWebView({ type: "AUTH_SIGNED_OUT" });
  }, [queryClient]);

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  const signInWithApple = async () => {
    try {
      const result = await SignInWithApple.authorize({
        clientId: "com.livewithms.app",
        redirectURI: "https://app.livewithms.com",
        scopes: "email name",
        state: Math.random().toString(36).substring(2),
        nonce: Math.random().toString(36).substring(2),
      });

      const { identityToken } = result.response;

      if (!identityToken) {
        return { error: { message: "Apple Sign In failed — no identity token returned." } };
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: identityToken,
      });

      return { error };
    } catch (e: any) {
      if (e?.message?.includes("cancelled") || e?.message?.includes("canceled")) {
        return { error: null }; // User cancelled — not an error
      }
      return { error: { message: e?.message || "Apple Sign In failed. Please try again." } };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, sendPasswordReset, updatePassword, signInWithApple }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};