import { useMemo } from "react";
import { BarChart3, Crown } from "lucide-react";
import { useEntries } from "@/hooks/useEntries";
import { format, subDays } from "date-fns";
import PremiumGate from "@/components/PremiumGate";

function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0));
  return den === 0 ? null : num / den;
}

const METRICS = [
  { key: "fatigue", label: "Fatigue" },
  { key: "pain", label: "Pain" },
  { key: "brain_fog", label: "Brain Fog" },
  { key: "mood", label: "Mood" },
  { key: "stress", label: "Stress" },
  { key: "sleep_hours", label: "Sleep" },
  { key: "spasticity", label: "Spasticity" },
  { key: "mobility", label: "Mobility" },
] as const;

type MetricKey = typeof METRICS[number]["key"];

const AdvancedCorrelations = () => {
  const { data: entries = [] } = useEntries();

  const cutoff = format(subDays(new Date(), 29), "yyyy-MM-dd");
  const recent = entries.filter((e) => e.date >= cutoff);

  const insights = useMemo(() => {
    const results: { pair: string; r: number; strength: string; insight: string }[] = [];

    for (let i = 0; i < METRICS.length; i++) {
      for (let j = i + 1; j < METRICS.length; j++) {
        const a = METRICS[i];
        const b = METRICS[j];
        const pairs = recent.filter((e) => e[a.key] !== null && e[b.key] !== null);
        if (pairs.length < 5) continue;
        const r = pearson(
          pairs.map((e) => e[a.key] as number),
          pairs.map((e) => e[b.key] as number)
        );
        if (r === null || Math.abs(r) < 0.25) continue;

        const abs = Math.abs(r);
        const strength = abs >= 0.6 ? "Strong" : abs >= 0.4 ? "Moderate" : "Mild";
        const direction = r > 0 ? "increase together" : "move inversely";
        const insight = `${a.label} and ${b.label} ${direction} (${strength.toLowerCase()} link)`;

        results.push({ pair: `${a.label} ↔ ${b.label}`, r, strength, insight });
      }
    }

    return results.sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).slice(0, 8);
  }, [recent]);

  return (
    <PremiumGate feature="Advanced Correlation Engine">
      <div className="rounded-xl bg-card p-5 shadow-soft border border-primary/10 space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <BarChart3 className="h-4 w-4 text-primary" />
          </span>
          <div>
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Advanced Analysis
              <Crown className="h-3 w-3 text-primary" />
            </span>
            <p className="text-[10px] text-muted-foreground">Multi-variable correlations from your data</p>
          </div>
        </div>

        {insights.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Not enough data yet. Keep logging to unlock multi-variable insights.
          </p>
        ) : (
          <div className="space-y-3">
            {insights.map(({ pair, r, strength, insight }) => (
              <div key={pair} className="rounded-lg bg-secondary/50 px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">{pair}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    strength === "Strong" ? "bg-primary/15 text-primary" :
                    strength === "Moderate" ? "bg-[hsl(var(--brand-blue))]/10 text-[hsl(var(--brand-blue))]" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {strength}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
                <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${r > 0 ? "bg-primary" : "bg-[hsl(var(--brand-blue))]"}`}
                    style={{ width: `${Math.abs(r) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">Based on {recent.length} entries from last 30 days</p>
      </div>
    </PremiumGate>
  );
};

export default AdvancedCorrelations;
