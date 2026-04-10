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

    const confirmOffline = async () => {
      const ok = navigator.onLine !== false ? await checkRealConnectivity() : false;

      if (!ok) {
        failCountRef.current += 1;
        setIsOffline(true);
        return;
      }

      failCountRef.current = 0;
      setIsOffline(false);
    };

    const goOffline = () => {
      const delay = isReactNativeWebView ? 7000 : 3000;
      if (offlineTimer) clearTimeout(offlineTimer);
      offlineTimer = setTimeout(() => {
        void confirmOffline();
      }, delay);
    };

    const goOnline = () => {
      if (offlineTimer) { clearTimeout(offlineTimer); offlineTimer = null; }
      failCountRef.current = 0;
      setIsOffline(false);
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && (isOffline || navigator.onLine === false)) {
        setTimeout(() => {
          void confirmOffline();
        }, isReactNativeWebView ? 2500 : 750);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
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
            <span>No internet connection detected — reconnect, then retry</span>
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
