import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, RotateCcw } from "lucide-react";
import {
  checkRealConnectivity,
  forceFullReload,
  isReactNativeWebView,
  reserveAutoRecoveryAttempt,
} from "@/lib/webview";

interface WebViewRecoveryActionsProps {
  compact?: boolean;
  onRetry?: () => void;
  retryLabel?: string;
  showRetry?: boolean;
  showSafari?: boolean;
}

interface WebViewLoadingScreenProps {
  description: string;
  recoveryKey: string;
  timeoutMs?: number;
  title: string;
}

const actionButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-soft transition-all hover:bg-secondary active:scale-[0.98]";

export const WebViewRecoveryActions = ({
  compact = false,
  onRetry,
  retryLabel = "Try again",
  showRetry = true,
  showSafari = true,
}: WebViewRecoveryActionsProps) => {
  const currentUrl = typeof window !== "undefined" ? window.location.href : "/";
  const directionClass = compact ? "flex-row items-center" : "flex-col sm:flex-row sm:flex-wrap";

  return (
    <div className={`flex ${directionClass} gap-2`}>
      {showRetry && onRetry && (
        <button type="button" onClick={onRetry} className={actionButtonClass}>
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </button>
      )}

      <button type="button" onClick={() => forceFullReload("manual-recovery")} className={actionButtonClass}>
        <RotateCcw className="h-4 w-4" />
        Reload App
      </button>

      {showSafari && (
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={actionButtonClass}
        >
          <ExternalLink className="h-4 w-4" />
          Open in Safari
        </a>
      )}
    </div>
  );
};

export const WebViewLoadingScreen = ({
  description,
  recoveryKey,
  timeoutMs = 10000,
  title,
}: WebViewLoadingScreenProps) => {
  const [status, setStatus] = useState<"loading" | "recovering" | "manual">("loading");
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (!isReactNativeWebView) return;

    const timer = window.setTimeout(async () => {
      const online = await checkRealConnectivity();

      if (!online) {
        setIsOffline(true);
        setStatus("manual");
        return;
      }

      const attempt = reserveAutoRecoveryAttempt(recoveryKey);
      if (attempt.shouldReload) {
        setStatus("recovering");
        forceFullReload(recoveryKey);
        return;
      }

      setStatus("manual");
    }, timeoutMs);

    return () => window.clearTimeout(timer);
  }, [recoveryKey, timeoutMs]);

  const resolvedTitle = isOffline
    ? "No internet connection detected"
    : status === "recovering"
      ? "Refreshing the app"
      : status === "manual"
        ? "We hit a temporary loading issue"
        : title;

  const resolvedDescription = isOffline
    ? "Reconnect to the internet, then retry or reload the app."
    : status === "recovering"
      ? "We’re forcing a clean reload to recover the WebView."
      : status === "manual"
        ? "The app did not finish loading cleanly, but you can recover immediately below."
        : description;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/95 p-6 text-center shadow-soft backdrop-blur">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <RefreshCw className={`h-6 w-6 text-foreground ${status === "manual" ? "" : "animate-spin"}`} />
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-xl font-bold text-foreground">{resolvedTitle}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{resolvedDescription}</p>
        </div>

        <div className="mt-5">
          {status === "manual" ? (
            <WebViewRecoveryActions onRetry={() => window.location.reload()} retryLabel="Try again" />
          ) : (
            <p className="text-xs text-muted-foreground">
              If this takes too long, the app will refresh itself automatically.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const WebViewRecoveryDock = () => {
  if (!isReactNativeWebView) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[80]">
      <button
        type="button"
        onClick={() => forceFullReload("recovery-dock")}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2 text-xs font-semibold text-foreground shadow-soft backdrop-blur transition-all hover:bg-secondary active:scale-[0.98]"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reload App
      </button>
    </div>
  );
};