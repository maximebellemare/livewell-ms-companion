import { useState } from "react";
import { BookOpen, Crown, CheckCircle2, Play, ChevronRight, Wind, Brain, Flame } from "lucide-react";
import PremiumGate from "@/components/PremiumGate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ProgramMeta {
  id: string;
  title: string;
  duration: string;
  icon: typeof Brain;
  color: string;
  description: string;
  totalDays: number;
  days: { title: string; exercise: string }[];
}

const PROGRAMS: ProgramMeta[] = [
  {
    id: "anxiety-reset",
    title: "14-Day Anxiety Reset",
    duration: "14 days",
    icon: Wind,
    color: "text-[hsl(var(--brand-blue))]",
    description: "Gentle daily exercises to calm your nervous system and reduce anxiety.",
    totalDays: 14,
    days: Array.from({ length: 14 }, (_, i) => ({
      title: `Day ${i + 1}`,
      exercise: [
        "4-7-8 breathing (3 min) + body scan",
        "Box breathing (4 min) + gratitude journal",
        "Progressive muscle relaxation",
        "5-4-3-2-1 grounding exercise",
        "Diaphragmatic breathing + self-compassion note",
        "Butterfly hug technique",
        "Gentle stretching + breath focus",
        "Cold water face technique + journaling",
        "Bilateral tapping (2 min)",
        "Extended exhale breathing",
        "Safe place visualisation",
        "Body awareness meditation",
        "Vagal tone humming exercise",
        "Integration reflection + celebration",
      ][i],
    })),
  },
  {
    id: "nervous-system",
    title: "30-Day Nervous System Stabilization",
    duration: "30 days",
    icon: Brain,
    color: "text-[hsl(var(--brand-green))]",
    description: "Build resilience through structured daily nervous system exercises.",
    totalDays: 30,
    days: Array.from({ length: 30 }, (_, i) => ({
      title: `Day ${i + 1}`,
      exercise: `Daily nervous system regulation exercise ${i + 1}`,
    })),
  },
  {
    id: "flare-calm",
    title: "7-Day Flare Calm Protocol",
    duration: "7 days",
    icon: Flame,
    color: "text-destructive",
    description: "Immediate support protocol when experiencing a flare-up.",
    totalDays: 7,
    days: Array.from({ length: 7 }, (_, i) => ({
      title: `Day ${i + 1}`,
      exercise: [
        "Ice diving breath + rest permission",
        "Gentle self-massage + gratitude list",
        "Guided body scan + acceptance journaling",
        "Slow breathing + micro-movement",
        "Comfort sensory kit + breathing",
        "Emotional release journaling",
        "Reflection + next-steps planning",
      ][i],
    })),
  },
];

const ProgramsSection = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  const { data: enrollments = [] } = useQuery({
    queryKey: ["premium_programs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("premium_programs")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: dayLogs = [] } = useQuery({
    queryKey: ["program_day_logs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_day_logs")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const enrollMutation = useMutation({
    mutationFn: async (programId: string) => {
      const { error } = await supabase.from("premium_programs").insert({
        user_id: user!.id,
        program_id: programId,
        day_number: 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["premium_programs"] });
      toast.success("Program started! 🎉");
    },
  });

  const completeDayMutation = useMutation({
    mutationFn: async ({ programId, dayNumber }: { programId: string; dayNumber: number }) => {
      await supabase.from("program_day_logs").insert({
        user_id: user!.id,
        program_id: programId,
        day_number: dayNumber,
      });
      // Update current day
      const program = PROGRAMS.find((p) => p.id === programId)!;
      const nextDay = Math.min(dayNumber + 1, program.totalDays);
      await supabase
        .from("premium_programs")
        .update({
          day_number: nextDay,
          last_activity_at: new Date().toISOString(),
          ...(nextDay >= program.totalDays ? { completed_at: new Date().toISOString() } : {}),
        })
        .eq("user_id", user!.id)
        .eq("program_id", programId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["premium_programs"] });
      queryClient.invalidateQueries({ queryKey: ["program_day_logs"] });
      toast.success("Day completed! 🌟");
    },
  });

  return (
    <PremiumGate feature="Structured Programs">
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            Programs
            <Crown className="h-3 w-3 text-primary" />
          </span>
        </div>

        {PROGRAMS.map((program) => {
          const enrollment = enrollments.find((e: any) => e.program_id === program.id);
          const completed = dayLogs.filter((d: any) => d.program_id === program.id);
          const isExpanded = expandedProgram === program.id;
          const progress = enrollment ? (completed.length / program.totalDays) * 100 : 0;
          const currentDay = enrollment ? (enrollment as any).day_number : 0;
          const isCompleted = !!(enrollment as any)?.completed_at;

          return (
            <div key={program.id} className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
              <button
                onClick={() => setExpandedProgram(isExpanded ? null : program.id)}
                className="flex items-center gap-4 p-4 w-full text-left hover:bg-secondary/30 transition-colors"
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary ${program.color}`}>
                  <program.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{program.title}</p>
                  <p className="text-[11px] text-muted-foreground">{program.duration}</p>
                  {enrollment && (
                    <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
                  <p className="text-xs text-muted-foreground">{program.description}</p>

                  {!enrollment ? (
                    <button
                      onClick={() => enrollMutation.mutate(program.id)}
                      disabled={enrollMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                    >
                      <Play className="h-4 w-4" /> Start Program
                    </button>
                  ) : isCompleted ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-[hsl(var(--brand-green))]">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="text-sm font-semibold">Program Completed! 🎉</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {program.days.slice(0, Math.min(currentDay + 2, program.totalDays)).map((day, i) => {
                        const isDone = completed.some((d: any) => d.day_number === i + 1);
                        const isCurrent = i + 1 === currentDay;
                        return (
                          <div
                            key={i}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${isCurrent ? "bg-accent border border-primary/20" : "bg-secondary/30"}`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--brand-green))] shrink-0" />
                            ) : (
                              <div className={`h-4 w-4 rounded-full border-2 shrink-0 ${isCurrent ? "border-primary" : "border-muted-foreground/30"}`} />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>{day.title}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{day.exercise}</p>
                            </div>
                            {isCurrent && !isDone && (
                              <button
                                onClick={() => completeDayMutation.mutate({ programId: program.id, dayNumber: i + 1 })}
                                disabled={completeDayMutation.isPending}
                                className="text-[10px] font-semibold text-primary hover:underline shrink-0"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PremiumGate>
  );
};

export default ProgramsSection;
