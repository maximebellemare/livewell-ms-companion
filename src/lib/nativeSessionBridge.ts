/**
 * Native Session Bridge
 *
 * Allows the Expo wrapper to inject Supabase auth tokens into the web app
 * so that login happens natively and the WebView opens already authenticated.
 *
 * Two injection methods are supported:
 *
 * 1. URL params: The Expo wrapper loads the WebView with
 *    ?native_access_token=xxx&native_refresh_token=yyy
 *
 * 2. postMessage: The Expo wrapper sends a JSON message
 *    { type: "NATIVE_SESSION", access_token, refresh_token }
 */

import { supabase } from "@/integrations/supabase/client";

const HANDLED_KEY = "lwms-native-session-handled";

/**
 * Check URL params for injected tokens and set the Supabase session.
 * Call this once at app startup (before React renders or in a top-level effect).
 * Returns true if a native session was successfully set.
 */
export async function hydrateSessionFromURL(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const url = new URL(window.location.href);
  const accessToken = url.searchParams.get("native_access_token");
  const refreshToken = url.searchParams.get("native_refresh_token");

  if (!accessToken || !refreshToken) return false;

  // Avoid re-processing the same tokens on navigation
  const fingerprint = accessToken.slice(-12);
  if (sessionStorage.getItem(HANDLED_KEY) === fingerprint) return false;

  try {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      console.warn("[NativeBridge] setSession error:", error.message);
      return false;
    }

    sessionStorage.setItem(HANDLED_KEY, fingerprint);

    // Clean the URL so tokens aren't visible / bookmarkable
    url.searchParams.delete("native_access_token");
    url.searchParams.delete("native_refresh_token");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);

    return true;
  } catch (e) {
    console.warn("[NativeBridge] hydrate failed:", e);
    return false;
  }
}

/**
 * Listen for postMessage-based token injection from the native wrapper.
 * Returns a cleanup function.
 */
export function listenForNativeSession(): () => void {
  const handler = async (event: MessageEvent) => {
    try {
      const data =
        typeof event.data === "string" ? JSON.parse(event.data) : event.data;

      if (data?.type !== "NATIVE_SESSION") return;
      if (!data.access_token || !data.refresh_token) return;

      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
    } catch {
      // Ignore non-JSON or unrelated messages
    }
  };

  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}
