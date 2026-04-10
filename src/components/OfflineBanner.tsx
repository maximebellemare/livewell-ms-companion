import { useState, useEffect, useRef } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { checkRealConnectivity, isReactNativeWebView, forceFullReload } from "@/lib/webview";

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const failCountRef = useRef(0);

  useEffect(() => {
    let offlineTimer: ReturnType<typeof setTimeout> | null = null;

    const goOffline = () => {
      // Longer debounce in WebView to ignore transient hiccups
      const delay = isReactNativeWebView ? 5000 : 3000;
      offlineTimer = setTimeout(() => {
        checkRealConnectivity().then((ok) => {
          if (!ok) {
            failCountRef.current++;
            setIsOffline(true);
          }
        });
      }, delay);
    };
    const goOnline = () => {
      if (offlineTimer) { clearTimeout(offlineTimer); offlineTimer = null; }
      failCountRef.current = 0;
      setIsOffline(false);
    };

    // Initial check — extra long delay for WebView cold start
    const initDelay = isReactNativeWebView ? 8000 : 5000;
    const initTimer = setTimeout(() => {
      checkRealConnectivity().then((ok) => {
        if (!ok) setIsOffline(true);
      });
    }, initDelay);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    // Re-check on visibility change (WebView resume from background)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        // Small delay to let the network stack wake up
        setTimeout(() => {
          checkRealConnectivity().then((ok) => {
            setIsOffline(!ok);
            if (ok) failCountRef.current = 0;
          });
        }, isReactNativeWebView ? 2000 : 500);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimeout(initTimer);
      if (offlineTimer) clearTimeout(offlineTimer);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    const ok = await checkRealConnectivity();
    if (ok) {
      failCountRef.current = 0;
      setIsOffline(false);
    } else {
      failCountRef.current++;
    }
    setRetrying(false);
  };

  const handleFullReload = () => {
    forceFullReload();
  };

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-destructive/90 px-4 py-2 text-xs font-medium text-destructive-foreground flex-wrap">
            <WifiOff className="h-3.5 w-3.5" />
            <span>Connection interrupted — tap to retry</span>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="ml-1 inline-flex items-center gap-1 rounded-full bg-destructive-foreground/20 px-2 py-0.5 text-[10px] font-semibold hover:bg-destructive-foreground/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${retrying ? "animate-spin" : ""}`} />
              Retry
            </button>
            {failCountRef.current >= 2 && (
              <button
                onClick={handleFullReload}
                className="ml-1 inline-flex items-center gap-1 rounded-full bg-destructive-foreground/30 px-2 py-0.5 text-[10px] font-semibold hover:bg-destructive-foreground/40 transition-colors"
              >
                Reload App
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
