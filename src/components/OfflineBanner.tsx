import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Debounce offline detection to avoid false positives in WebView
    let offlineTimer: ReturnType<typeof setTimeout> | null = null;

    const goOffline = () => {
      // Wait 2s and re-check — WebView can fire spurious offline events
      offlineTimer = setTimeout(() => {
        if (!navigator.onLine) setIsOffline(true);
      }, 2000);
    };
    const goOnline = () => {
      if (offlineTimer) { clearTimeout(offlineTimer); offlineTimer = null; }
      setIsOffline(false);
    };

    // Initial check after a short delay (avoids false positive during WebView boot)
    const initTimer = setTimeout(() => {
      if (!navigator.onLine) setIsOffline(true);
    }, 3000);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      clearTimeout(initTimer);
      if (offlineTimer) clearTimeout(offlineTimer);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

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
          <div className="flex items-center justify-center gap-2 bg-destructive/90 px-4 py-2 text-xs font-medium text-destructive-foreground">
            <WifiOff className="h-3.5 w-3.5" />
            <span>You're offline — some features may be unavailable</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
