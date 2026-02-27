import { useMemo } from "react";
import { useRelapses } from "@/hooks/useRelapses";
import { differenceInDays, parseISO } from "date-fns";
import { Clock, TrendingDown, Heart, Activity } from "lucide-react";

export default function RelapseStatsDashboard() {
  const { data: relapses = [] } = useRelapses();

  const stats = useMemo(() => {
    if (relapses.length === 0) return null;

    const severityCounts: Record<string, number> = {};
    let totalDuration = 0;
    let recoveredCount = 0;
    let totalRecoveryDays = 0;

    relapses.forEach((r) => {
      severityCounts[r.severity] = (severityCounts[r.severity] ?? 0) + 1;

      const start = parseISO(r.start_date);
      const end = r.end_date ? parseISO(r.end_date) : new Date();
      const dur = differenceInDays(end, start) + 1;
      totalDuration += dur;

      if (r.is_recovered && r.end_date) {
        recoveredCount++;
        totalRecoveryDays += dur;
      }
    });

    const mostCommonSeverity = Object.entries(severityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "moderate";
    const avgDuration = Math.round(totalDuration / relapses.length);
    const recoveryRate = Math.round((recoveredCount / relapses.length) * 100);
    const avgRecovery = recoveredCount > 0 ? Math.round(totalRecoveryDays / recoveredCount) : null;

    return { avgDuration, mostCommonSeverity, recoveryRate, avgRecovery };
  }, [relapses]);

  if (!stats) return null;

  const cards = [
    { icon: Clock, label: "Avg Duration", value: `${stats.avgDuration}d`, sub: "per relapse" },
    { icon: Activity, label: "Most Common", value: stats.mostCommonSeverity, sub: "severity", capitalize: true },
    { icon: Heart, label: "Recovery Rate", value: `${stats.recoveryRate}%`, sub: "fully recovered" },
    ...(stats.avgRecovery !== null
      ? [{ icon: TrendingDown, label: "Avg Recovery", value: `${stats.avgRecovery}d`, sub: "to recover" }]
      : []),
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl bg-card p-3 shadow-soft">
          <div className="flex items-center gap-1.5 mb-1">
            <c.icon className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] text-muted-foreground">{c.label}</span>
          </div>
          <p className={`text-lg font-bold text-foreground ${c.capitalize ? "capitalize" : ""}`}>{c.value}</p>
          <p className="text-[10px] text-muted-foreground">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
