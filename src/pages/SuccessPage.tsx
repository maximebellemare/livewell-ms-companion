import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, CheckCircle, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { usePremium } from "@/hooks/usePremium";
import SEOHead from "@/components/SEOHead";

const SuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSubscription, isPremium } = usePremium();
  const [verified, setVerified] = useState(false);
  const [retries, setRetries] = useState(0);

  // Verify subscription on mount
  const verify = useCallback(async () => {
    await checkSubscription();
  }, [checkSubscription]);

  useEffect(() => {
    verify();
  }, [verify]);

  // Poll until premium is confirmed or max retries
  useEffect(() => {
    if (isPremium) {
      setVerified(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ["#E8751A", "#F5A623", "#FFFFFF", "#FFD700"],
      });
      return;
    }

    if (retries >= 10) {
      // After 10 retries (~20s), show success anyway (webhook may be delayed)
      setVerified(true);
      return;
    }

    const timer = setTimeout(() => {
      setRetries((r) => r + 1);
      verify();
    }, 2000);

    return () => clearTimeout(timer);
  }, [isPremium, retries, verify]);

  // Auto-redirect after showing success
  useEffect(() => {
    if (!verified) return;
    const timer = setTimeout(() => navigate("/today", { replace: true }), 4000);
    return () => clearTimeout(timer);
  }, [verified, navigate]);

  return (
    <>
      <SEOHead title="Welcome to Premium — LiveWithMS" description="Your Premium subscription is now active." />
      <div className="flex min-h-[100dvh] items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          className="max-w-sm w-full text-center space-y-6"
        >
          {!verified ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <h1 className="font-display text-xl font-bold text-foreground">
                  Confirming your subscription…
                </h1>
                <p className="text-sm text-muted-foreground">
                  This will only take a moment.
                </p>
              </div>
            </>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--brand-green))]/15"
              >
                <CheckCircle className="h-8 w-8 text-[hsl(var(--brand-green))]" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <h1 className="font-display text-2xl font-bold text-foreground">
                  You're now on Premium
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  You now have full access to insights, guidance, and support.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
              >
                <Crown className="h-3.5 w-3.5 text-primary" />
                <span>Redirecting to your dashboard…</span>
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={() => navigate("/today", { replace: true })}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
              >
                <Crown className="h-4 w-4" />
                Go to Dashboard
              </motion.button>
            </>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default SuccessPage;
