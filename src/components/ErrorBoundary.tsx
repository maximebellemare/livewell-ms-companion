import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { checkRealConnectivity, forceFullReload } from "@/lib/webview";
import { WebViewLoadingScreen, WebViewRecoveryActions } from "@/components/WebViewRecovery";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isOffline: boolean;
  autoRetryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, isOffline: false, autoRetryCount: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch() {
    checkRealConnectivity().then((ok) => {
      if (!ok) {
        this.setState({ isOffline: true });
      }
      // Auto-retry up to 2 times for transient errors
      if (this.state.autoRetryCount < 2) {
        setTimeout(() => {
          this.setState((prev) => ({
            hasError: false,
            error: null,
            isOffline: false,
            autoRetryCount: prev.autoRetryCount + 1,
          }));
        }, 1500 * (this.state.autoRetryCount + 1));
      }
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, isOffline: false });
  };

  handleFullReload = () => {
    forceFullReload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.state.autoRetryCount < 2) {
      return (
        <WebViewLoadingScreen
          title={this.state.isOffline ? "Checking your connection" : "Recovering the app"}
          description={
            this.state.isOffline
              ? "We confirmed the app is offline, so reconnect and we’ll help you recover."
              : "We’re retrying automatically so the WebView doesn’t get stuck on a dead screen."
          }
          recoveryKey={`error-boundary-${this.state.autoRetryCount}`}
          timeoutMs={8000}
        />
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm text-center space-y-5 animate-fade-in">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-9 w-9 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-xl font-bold text-foreground">
              {this.state.isOffline
                ? "You seem to be offline"
                : "The app hit a temporary loading issue"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {this.state.isOffline
                ? "Check your internet connection and try again — your data is safe."
                : "Your session is safe. Try again, force a clean reload, or open the app in Safari."}
            </p>
          </div>

          {this.state.error && (
            <details className="rounded-xl bg-secondary/60 border border-border px-4 py-3 text-left">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                Error details
              </summary>
              <p className="mt-2 text-xs text-muted-foreground font-mono break-all">
                {this.state.error.message}
              </p>
            </details>
          )}

          <div className="flex justify-center">
            <WebViewRecoveryActions onRetry={this.handleRetry} />
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
