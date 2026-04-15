import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { isReactNativeWebView, isInIframe, isPreviewHost } from "./lib/webview";
import { hydrateSessionFromURL, listenForNativeSession } from "./lib/nativeSessionBridge";

// --- Service Worker: DISABLE inside WebView / iframe / preview ---
const shouldRegisterSW =
  !isReactNativeWebView && !isInIframe && !isPreviewHost;

if (shouldRegisterSW) {
  registerSW({ immediate: true });
} else if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

// Restore saved font size preference before first render
const savedFontSize = localStorage.getItem("ms-font-size");
if (savedFontSize === "large") document.documentElement.classList.add("font-large");
else if (savedFontSize === "xl") document.documentElement.classList.add("font-xl");

// Initialize RevenueCat inside Capacitor only
const initRevenueCat = async () => {
  if (!(window as any).Capacitor) return;
  try {
    const { Purchases, LOG_LEVEL } = await import("@revenuecat/purchases-capacitor");
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    await Purchases.configure({
      apiKey: "appl_bAeBbFsqCmBixUsbQDaQKfIiIMS",
    });
  } catch (e) {
    console.warn("RevenueCat init failed:", e);
  }
};

// Hydrate native session (from Expo wrapper) before rendering
const boot = async () => {
  if (isReactNativeWebView) {
    await hydrateSessionFromURL();
    listenForNativeSession();
  }
  await initRevenueCat();
  createRoot(document.getElementById("root")!).render(<App />);
};

boot();
