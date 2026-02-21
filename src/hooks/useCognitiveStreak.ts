import { useMemo } from "react";
import { useCognitiveSessions } from "./useCognitiveSessions";
import { format, subDays } from "date-fns";

/**
 * Computes the current consecutive-day streak of playing at least one cognitive game,
 * and the total number of unique days with sessions (lifetime).
 */
export function useCognitiveStreak() {
  const { data: sessions } = useCognitiveSessions(90);

  return useMemo(() => {
    if (!sessions || sessions.length === 0) return { streak: 0, totalDays: 0 };

    // Unique days with at least one session
    const daySet = new Set<string>();
    for (const s of sessions) {
      daySet.add(format(new Date(s.played_at), "yyyy-MM-dd"));
    }

    const totalDays = daySet.size;

    // Compute consecutive-day streak ending today or yesterday
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

    let streak = 0;
    const startFromToday = daySet.has(today);
    const startFromYesterday = !startFromToday && daySet.has(yesterday);

    if (startFromToday || startFromYesterday) {
      const start = startFromToday ? new Date() : subDays(new Date(), 1);
      for (let i = 0; i < 90; i++) {
        const d = format(subDays(start, i), "yyyy-MM-dd");
        if (daySet.has(d)) {
          streak++;
        } else {
          break;
        }
      }
    }

    return { streak, totalDays };
  }, [sessions]);
}
