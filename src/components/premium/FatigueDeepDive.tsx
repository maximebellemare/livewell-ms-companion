import { useMemo } from "react";
import { Zap, Crown, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useEntries } from "@/hooks/useEntries";
import { format, subDays } from "date-fns";
import PremiumGate from "@/components/PremiumGate";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

function avg(vals: (number | null)[]): number | null {
  const v = vals.filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0));
  return den === 0 ? null : num / den;
}

const TRIGGERS = [
  { key: "sleep_hours", label: "Poor Sleep", emoji: "🌙", inverse: true },
  { key: "stress", label: "High Stress", emoji: "😰", inverse: false },
  { key: "pain", label: "Pain Levels", emoji: "⚡", inverse: false },
  { key: "brain_fog", label: "Brain Fog", emoji: "🌫️", inverse: false },
] as const;

const FatigueDeepDive = () => {
  const { data: entries = [] } = useEntries();

  const thirtyDaysAgo = format(subDays(new Date(), 29), "yyyy-MM-dd");
  const recent = entries.filter((e) => e.date >= thirtyDaysAgo);
  const sixtyDaysAgo = format(subDays(new Date(), 59), "yyyy-MM-dd");
  const older = entries.filter((e) => e.date >= sixtyDaysAgo && e.date < thirtyDaysAgo);

  const triggers = useMemo(() => {
    return TRIGGERS.map(({ key, label, emoji, inverse }) => {
      const pairs = recent.filter((e) => e.fatigue !== null && e[key] !== null);
      const xs = pairs.map((e) => e[key] as number);
      const ys = pairs.map((e) => e.fatigue as number);
      const r = pearson(xs, ys);
      const impact = r !== null ? Math.abs(r) : 0;
      return { key, label, emoji, r, impact, inverse };
    }).sort((a, b) => b.impact - a.impact);
  }, [recent]);

  const fatigueAvgRecent = avg(recent.map((e) => e.fatigue));
  const fatigueAvgOlder = avg(older.map((e) => e.fatigue));
  const improving = fatigueAvgRecent !== null && fatigueAvgOlder !== null && fatigueAvgRecent < fatigueAvgOlder - 0.3;
  const worsening = fatigueAvgRecent !== null && fatigueAvgOlder !== null && fatigueAvgRecent > fatigueAvgOlder + 0.3;

  const chartData = recent
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ date: format(new Date(e.date), "MMM d"), fatigue: e.fatigue }));

  return (
    <PremiumGate feature="Fatigue Deep Dive">
      <div className="rounded-xl bg-card p-5 shadow-soft border border-primary/10 space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </span>
          <div>
            <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Fatigue Deep Dive
              <Crown className="h-3 w-3 text-primary" />
            </span>
            <p className="text-[10px] text-muted-foreground">Your top fatigue triggers ranked</p>
          </div>
        </div>

        {/* Trend banner */}
        {fatigueAvgRecent !== null && (
          <div className={`rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${improving ? "bg-[hsl(var(--brand-green))]/10 text-[hsl(var(--brand-green))]" : worsening ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"}`}>
            {improving ? <TrendingDown className="h-4 w-4" /> : worsening ? <TrendingUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            <span className="font-medium">
              {improving ? "Fatigue improving" : worsening ? "Fatigue trending up" : "Fatigue stable"} — avg {fatigueAvgRecent.toFixed(1)}/10
            </span>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 2 && (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fatigueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(25 85% 50%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(25 85% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 10]} hide />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                <Area type="monotone" dataKey="fatigue" stroke="hsl(25 85% 50%)" fill="url(#fatigueGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top triggers */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Fatigue Triggers</p>
          {triggers.slice(0, 3).map(({ label, emoji, r, impact }, i) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-sm font-bold text-muted-foreground w-4">#{i + 1}</span>
              <span className="text-lg">{emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(impact * 100, 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">
                {impact >= 0.6 ? "Strong" : impact >= 0.3 ? "Moderate" : "Weak"}
              </span>
            </div>
          ))}
        </div>

        {recent.length < 5 && (
          <p className="text-[10px] text-muted-foreground text-center">Log more days to improve accuracy.</p>
        )}
      </div>
    </PremiumGate>
  );
};

export default FatigueDeepDive;
