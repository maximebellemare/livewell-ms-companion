/**
 * WebView / environment detection utilities.
 *
 * Used throughout the app to adapt behaviour when running inside
 * an Expo (or any React-Native) WebView wrapper on iOS / Android.
 */

/** True when the page is loaded inside a React-Native WebView. */
export const isReactNativeWebView: boolean = (() => {
  if (typeof window === "undefined") return false;
  // Expo / RN WebView injects this global
  if ((window as any).ReactNativeWebView) return true;
  // Some RN WebView versions set a custom user-agent fragment
  if (/ReactNative|Expo/i.test(navigator.userAgent)) return true;
  return false;
})();

/** True when the page is inside any iframe (Lovable preview, etc.). */
export const isInIframe: boolean = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true; // cross-origin blocks → assume iframe
  }
})();

/** True when running on a Lovable preview host. */
export const isPreviewHost: boolean =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com"));

const AUTO_RECOVERY_STORAGE_KEY = "lwms-webview-auto-recovery";

/**
 * Perform a real connectivity check by fetching a tiny resource.
 * Returns true if the device can actually reach the network.
 * Falls back to `navigator.onLine` if the probe fails ambiguously.
 */
export async function checkRealConnectivity(): Promise<boolean> {
  try {
    // Use a tiny, cache-busted request to the app's own origin
    const res = await fetch(`/robots.txt?_cb=${Date.now()}`, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok || res.status === 304;
  } catch {
    // If fetch itself throws, fall back to navigator.onLine
    return navigator.onLine;
  }
}

export function reserveAutoRecoveryAttempt(
  source: string,
  maxAttempts = 2,
  windowMs = 5 * 60 * 1000,
): { attempt: number; shouldReload: boolean } {
  if (typeof window === "undefined") {
    return { attempt: 0, shouldReload: false };
  }

  try {
    const raw = sessionStorage.getItem(AUTO_RECOVERY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as { count?: number; startedAt?: number } : null;
    const now = Date.now();

    const isExpired = !parsed?.startedAt || now - parsed.startedAt > windowMs;
    const count = isExpired ? 0 : parsed?.count ?? 0;
    const next = count + 1;

    sessionStorage.setItem(
      AUTO_RECOVERY_STORAGE_KEY,
      JSON.stringify({ count: next, lastSource: source, startedAt: isExpired ? now : parsed.startedAt }),
    );

    return { attempt: next, shouldReload: next <= maxAttempts };
  } catch {
    return { attempt: 1, shouldReload: true };
  }
}

export function markWebViewStable(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(AUTO_RECOVERY_STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}

/**
 * Post a message to the React-Native WebView wrapper.
 * Used to signal auth events so the native side can remount
 * the WebView or take other recovery actions.
 */
export function postToNativeWebView(payload: Record<string, unknown>): void {
  try {
    if (isReactNativeWebView && (window as any).ReactNativeWebView?.postMessage) {
      (window as any).ReactNativeWebView.postMessage(JSON.stringify(payload));
    }
  } catch {
    // Best-effort — ignore if the bridge isn't available
  }
}

/**
 * Force a full page reload. In WebView this is the closest equivalent
 * to remounting the WebView from the native side.
 */
export function forceFullReload(source = "manual"): void {
  try {
    const recoveryState = sessionStorage.getItem(AUTO_RECOVERY_STORAGE_KEY);
    sessionStorage.clear();
    if (recoveryState) {
      sessionStorage.setItem(AUTO_RECOVERY_STORAGE_KEY, recoveryState);
    }
    sessionStorage.setItem("lwms-last-reload-source", source);
  } catch {
    /* ignore */
  }

  try {
    navigator.serviceWorker?.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
  } catch {
    /* ignore */
  }

  try {
    if ("caches" in window) {
      caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
    }
  } catch { /* ignore */ }

  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set("wv-reload", Date.now().toString());
  nextUrl.searchParams.set("wv-source", source);
  window.location.replace(nextUrl.toString());
}