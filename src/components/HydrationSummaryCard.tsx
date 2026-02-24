import { useMemo } from "react";
import { Droplets, Target } from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, ReferenceLine,
  ResponsiveContainer, Tooltip, Cell,
} from "recharts";
import { useProfile } from "@/hooks/useProfile";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  entries: readonly { date: string; water_glasses?: number | null }[];
  range: 7 | 30;
}

const HydrationSummaryCard = ({ entries, range }: Props) => {
  const { data: profile } = useProfile();
  const goal = profile?.hydration_goal ?? 8;

  const chartData = useMemo(() => {
    const today = new Date();
    const days = eachDayOfInterval({ start: subDays(today, range - 1), end: today });
    const byDate = Object.fromEntries(entries.map((e) => [e.date, e]));

    return days.map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const entry = byDate[key];
      const glasses = entry?.water_glasses ?? null;
      return {
        date: format(d, range === 7 ? "EEE" : "d"),
        fullDate: format(d, "MMM d"),
        glasses,
      };
    });
  }, [entries, range, goal]);

  const validDays = chartData.filter((d) => d.glasses !== null);
  if (validDays.length === 0) return null;

  const avg = validDays.reduce((s, d) => s + d.glasses!, 0) / validDays.length;
  const goalMetDays = validDays.filter((d) => d.glasses! >= goal).length;
  const goalPct = Math.round((goalMetDays / validDays.length) * 100);
  const maxGlasses = Math.max(...validDays.map((d) => d.glasses!), goal + 2);

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Hydration</span>
        </div>
        <TooltipProvider delayDuration={200}>
          <UITooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                <Target className="h-3 w-3" />
                <span>Goal: {goal}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs max-w-[200px]">
              Your daily hydration goal. Change it from the Hydration card on Today.
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mt-2 mb-3">
        <div className="text-center flex-1 rounded-lg bg-secondary/50 py-2">
          <p className="text-lg font-bold text-foreground">{avg.toFixed(1)}</p>
          <p className="text-[10px] text-muted-foreground">Avg / day</p>
        </div>
        <div className="text-center flex-1 rounded-lg bg-secondary/50 py-2">
          <p className="text-lg font-bold text-foreground">{goalMetDays}</p>
          <p className="text-[10px] text-muted-foreground">Days at goal</p>
        </div>
        <div className="text-center flex-1 rounded-lg bg-secondary/50 py-2">
          <p className="text-lg font-bold text-foreground">{goalPct}%</p>
          <p className="text-[10px] text-muted-foreground">Goal rate</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval={range === 30 ? 4 : 0}
            />
            <YAxis
              domain={[0, maxGlasses]}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <ReferenceLine
              y={goal}
              stroke="hsl(145 50% 42%)"
              strokeDasharray="6 3"
              strokeOpacity={0.6}
              strokeWidth={1.2}
              label={{ value: `Goal`, position: "right", fontSize: 9, fill: "hsl(145 50% 42%)" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-card text-xs">
                    <p className="font-semibold text-foreground">{d.fullDate}</p>
                    <p className="text-foreground">
                      💧 <strong>{d.glasses ?? "—"}</strong> glasses
                      {d.glasses !== null && d.glasses >= goal && " ✅"}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="glasses" radius={[3, 3, 0, 0]} maxBarSize={range === 7 ? 28 : 12}>
              {chartData.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    d.glasses === null
                      ? "transparent"
                      : d.glasses >= goal
                      ? "hsl(195 80% 42%)"
                      : d.glasses >= goal * 0.7
                      ? "hsl(195 60% 55%)"
                      : "hsl(45 90% 52%)"
                  }
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-[9px] text-muted-foreground text-center">
        {goalPct >= 80
          ? "🎉 Great hydration consistency!"
          : goalPct >= 50
          ? "💧 Decent — try to hit your goal more often"
          : "⚠️ Consider drinking more water throughout the day"}
      </p>
    </div>
  );
};

export default HydrationSummaryCard;
