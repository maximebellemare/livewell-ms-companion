import { useMemo } from "react";
import { format, startOfWeek, addDays, isToday, isFuture } from "date-fns";
import { getPromptForDate } from "@/lib/dailyPrompts";
import { DailyEntry } from "@/hooks/useEntries";
import { PenLine } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  entries: DailyEntry[];
}

const ThisWeekInReflection = ({ entries }: Props) => {
  const navigate = useNavigate();
  const today = new Date();

  // Mon → today (or Sun if not yet Mon)
  const weekDays = useMemo(() => {
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter(
      (d) => !isFuture(d) || isToday(d)
    );
  }, []);

  const entriesByDate = useMemo(
    () => Object.fromEntries(entries.map((e) => [e.date, e])),
    [entries]
  );

  // Only show if at least one day has a note
  const anyNotes = weekDays.some((d) => {
    const key = format(d, "yyyy-MM-dd");
    return !!entriesByDate[key]?.notes?.trim();
  });

  if (!anyNotes) return null;

  return (
    <section className="space-y-2 animate-fade-in">
      <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        This week in reflection
      </p>

      <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden divide-y divide-border">
        {weekDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const entry = entriesByDate[key];
          const prompt = getPromptForDate(day);
          const note = entry?.notes?.trim() ?? null;
          const dayIsToday = isToday(day);

          return (
            <div key={key} className="px-4 py-3 space-y-1">
              {/* Day label */}
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {dayIsToday ? "Today" : format(day, "EEE, MMM d")}
                </p>
                {dayIsToday && !note && (
                  <button
                    onClick={() => navigate("/journal")}
                    className="flex items-center gap-1 text-[10px] font-medium text-primary hover:opacity-80 transition-opacity"
                  >
                    <PenLine className="h-2.5 w-2.5" />
                    Write now
                  </button>
                )}
              </div>

              {/* Prompt */}
              <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                💭 {prompt}
              </p>

              {/* Note or empty state */}
              {note ? (
                <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                  {note}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground/60">
                  No reflection written yet.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ThisWeekInReflection;
