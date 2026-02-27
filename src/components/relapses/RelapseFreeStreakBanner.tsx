import { useRelapseFreeStreak } from "@/hooks/useRelapseFreeStreak";
import { useRelapses } from "@/hooks/useRelapses";
import { Shield, Star, Trophy, Crown } from "lucide-react";
import { useMemo, useEffect, useState } from "react";
import confetti from "canvas-confetti";

const MILESTONES = [
  { days: 365, label: "1 Year", icon: Crown, emoji: "👑" },
  { days: 180, label: "6 Months", icon: Trophy, emoji: "🏆" },
  { days: 90,  label: "90 Days", icon: Star, emoji: "⭐" },
  { days: 30,  label: "30 Days", icon: Star, emoji: "🌟" },
];

export default function RelapseFreeStreakBanner() {
  const streak = useRelapseFreeStreak();
  const { data: relapses = [] } = useRelapses();
  const [celebrated, setCelebrated] = useState(false);

  const milestone = useMemo(() => {
    return MILESTONES.find((m) => streak >= m.days) ?? null;
  }, [streak]);

  const nextMilestone = useMemo(() => {
    const upcoming = [...MILESTONES].reverse().find((m) => streak < m.days);
    return upcoming ?? null;
  }, [streak]);

  useEffect(() => {
    if (milestone && !celebrated) {
      const key = `relapse-streak-celebrated-${milestone.days}`;
      if (!sessionStorage.getItem(key)) {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        sessionStorage.setItem(key, "true");
      }
      setCelebrated(true);
    }
  }, [milestone, celebrated]);

  if (relapses.length === 0) return null;

  const Icon = milestone?.icon ?? Shield;

  return (
    <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{streak}</span>
            <span className="text-sm text-muted-foreground">day{streak !== 1 ? "s" : ""} relapse-free</span>
            {milestone && <span className="text-sm">{milestone.emoji}</span>}
          </div>
          {nextMilestone && streak < nextMilestone.days && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">
                  {nextMilestone.days - streak} day{nextMilestone.days - streak !== 1 ? "s" : ""} to {nextMilestone.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {Math.round((streak / nextMilestone.days) * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min((streak / nextMilestone.days) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
