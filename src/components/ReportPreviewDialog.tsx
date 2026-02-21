import { useMemo } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { Download, Send, FileText, Check, X, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { DailyEntry } from "@/hooks/useEntries";
import type { Profile } from "@/hooks/useProfile";
import type { DbMedication, DbMedicationLog } from "@/hooks/useMedications";
import type { DbAppointment } from "@/hooks/useAppointments";
import type { Relapse } from "@/hooks/useRelapses";

interface ReportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  generating: boolean;
  startDate: string;
  endDate: string;
  entries: DailyEntry[];
  profile: Profile | null;
  medications: DbMedication[];
  medLogs: DbMedicationLog[];
  appointments: DbAppointment[];
  relapses: Relapse[];
  sections: {
    includeProfile: boolean;
    includeSymptoms: boolean;
    includeMedications: boolean;
    includeAppointments: boolean;
    includeNotes: boolean;
    includeRelapses: boolean;
    includeHydration: boolean;
    includeRiskScore: boolean;
    includeTrendCharts: boolean;
    includeMoodTags: boolean;
    includePeriodComparison: boolean;
    includeTriggerAnalysis: boolean;
    includeAiInsight: boolean;
  };
}

export default function ReportPreviewDialog({
  open, onOpenChange, onConfirm, generating,
  startDate, endDate, entries, profile, medications, medLogs, appointments, relapses, sections,
}: ReportPreviewDialogProps) {
  const preview = useMemo(() => {
    const days = differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
    const period = `${format(parseISO(startDate), "MMM d")} – ${format(parseISO(endDate), "MMM d, yyyy")}`;

    // Symptom averages
    const symptomKeys = ["fatigue", "pain", "brain_fog", "mood", "mobility", "spasticity", "stress"] as const;
    const symptomLabels = ["Fatigue", "Pain", "Brain Fog", "Mood", "Mobility", "Spasticity", "Stress"];
    const symptomAvgs = symptomKeys.map((key, i) => {
      const vals = entries.map((e) => e[key]).filter((v): v is number => v != null);
      return { label: symptomLabels[i], avg: vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null };
    });

    // Mood tags
    const allTags = entries.flatMap((e) => e.mood_tags || []);
    const tagCounts: Record<string, number> = {};
    allTags.forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
    const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Hydration
    const hydrationEntries = entries.filter((e) => e.water_glasses != null && e.water_glasses > 0);
    const avgHydration = hydrationEntries.length
      ? (hydrationEntries.reduce((s, e) => s + e.water_glasses!, 0) / hydrationEntries.length).toFixed(1)
      : null;

    // Medication adherence
    const activeMeds = medications.filter((m) => m.active);
    const adherenceRate = activeMeds.length > 0 && medLogs.length > 0
      ? Math.round((medLogs.filter((l) => l.status === "taken").length / medLogs.length) * 100)
      : null;

    // Med notes
    const medNames = medications.map((m) => m.name.toLowerCase());
    const medNotesCount = entries.filter((e) => {
      if (!e.notes?.trim()) return false;
      const lower = e.notes.toLowerCase();
      return medNames.some((name) => lower.includes(name)) ||
        /side.?effect|reaction|nausea|dizz|headache|injection|infusion|dose/i.test(e.notes);
    }).length;

    // Relapses in period
    const periodRelapses = relapses.filter((r) => r.start_date >= startDate && r.start_date <= endDate);

    // Triggers
    const allTriggers = periodRelapses.flatMap((r) => r.triggers || []);
    const triggerCounts: Record<string, number> = {};
    allTriggers.forEach((t) => { triggerCounts[t] = (triggerCounts[t] || 0) + 1; });
    const topTriggers = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

    // Appointments in period
    const periodAppts = appointments.filter((a) => a.date >= startDate && a.date <= endDate);

    // Notes count
    const notesCount = entries.filter((e) => e.notes?.trim()).length;

    return {
      days, period, symptomAvgs, topTags, avgHydration, adherenceRate, activeMeds,
      periodRelapses, topTriggers, periodAppts, notesCount, medNotesCount, hydrationEntries,
    };
  }, [startDate, endDate, entries, profile, medications, medLogs, appointments, relapses]);

  const enabledSections = Object.entries(sections).filter(([, v]) => v).length;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Report Preview
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              {/* Period & stats header */}
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-medium text-foreground">{preview.period}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Entries</span>
                  <span className="font-medium text-foreground">{entries.length} days logged</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sections</span>
                  <span className="font-medium text-foreground">{enabledSections} included</span>
                </div>
              </div>

              {/* Symptom snapshot */}
              {sections.includeSymptoms && entries.length > 0 && (
                <PreviewSection emoji="📊" title="Symptom Averages">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {preview.symptomAvgs.filter((s) => s.avg).map((s) => (
                      <div key={s.label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{s.label}</span>
                        <span className="font-medium text-foreground">{s.avg}/10</span>
                      </div>
                    ))}
                  </div>
                </PreviewSection>
              )}

              {/* Mood Tags */}
              {sections.includeMoodTags && preview.topTags.length > 0 && (
                <PreviewSection emoji="🏷️" title="Top Mood Tags">
                  <div className="flex flex-wrap gap-1.5">
                    {preview.topTags.map(([tag, count]) => (
                      <span key={tag} className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-foreground">
                        {tag} <span className="text-muted-foreground">×{count}</span>
                      </span>
                    ))}
                  </div>
                </PreviewSection>
              )}

              {/* Period Comparison */}
              {sections.includePeriodComparison && entries.length >= 2 && (
                <PreviewSection emoji="⚖️" title="Period Comparison">
                  <p className="text-xs text-muted-foreground">First half vs. second half comparison with trend indicators.</p>
                </PreviewSection>
              )}

              {/* Trend Charts */}
              {sections.includeTrendCharts && entries.length >= 3 && (
                <PreviewSection emoji="📈" title="Trend Charts">
                  <p className="text-xs text-muted-foreground">9 trend charts covering all symptoms + sleep & hydration.</p>
                </PreviewSection>
              )}

              {/* Medications */}
              {sections.includeMedications && (
                <PreviewSection emoji="💊" title="Medications">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Active medications</span>
                      <span className="font-medium text-foreground">{preview.activeMeds.length}</span>
                    </div>
                    {preview.adherenceRate !== null && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Adherence rate</span>
                        <span className="font-medium text-foreground">{preview.adherenceRate}%</span>
                      </div>
                    )}
                    {preview.medNotesCount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Side effect notes</span>
                        <span className="font-medium text-foreground">{preview.medNotesCount} entries</span>
                      </div>
                    )}
                  </div>
                </PreviewSection>
              )}

              {/* Hydration */}
              {sections.includeHydration && preview.avgHydration && (
                <PreviewSection emoji="💧" title="Hydration">
                  <p className="text-xs text-muted-foreground">
                    Avg {preview.avgHydration} glasses/day across {preview.hydrationEntries.length} days tracked.
                  </p>
                </PreviewSection>
              )}

              {/* Relapses */}
              {sections.includeRelapses && preview.periodRelapses.length > 0 && (
                <PreviewSection emoji="🔄" title="Relapse History">
                  <p className="text-xs text-muted-foreground">
                    {preview.periodRelapses.length} relapse{preview.periodRelapses.length !== 1 ? "s" : ""} in this period.
                  </p>
                </PreviewSection>
              )}

              {/* Trigger Analysis */}
              {sections.includeTriggerAnalysis && preview.topTriggers.length > 0 && (
                <PreviewSection emoji="🔍" title="Trigger Analysis">
                  <div className="flex flex-wrap gap-1.5">
                    {preview.topTriggers.map(([trigger, count]) => (
                      <span key={trigger} className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] text-foreground">
                        {trigger} <span className="text-muted-foreground">×{count}</span>
                      </span>
                    ))}
                  </div>
                </PreviewSection>
              )}

              {/* Risk Score */}
              {sections.includeRiskScore && entries.length >= 4 && (
                <PreviewSection emoji="⚠️" title="Relapse Risk Score">
                  <p className="text-xs text-muted-foreground">Calculated from recent symptom trends.</p>
                </PreviewSection>
              )}

              {/* Appointments */}
              {sections.includeAppointments && preview.periodAppts.length > 0 && (
                <PreviewSection emoji="📅" title="Appointments">
                  <p className="text-xs text-muted-foreground">
                    {preview.periodAppts.length} appointment{preview.periodAppts.length !== 1 ? "s" : ""} in this period.
                  </p>
                </PreviewSection>
              )}

              {/* Notes */}
              {sections.includeNotes && preview.notesCount > 0 && (
                <PreviewSection emoji="📝" title="Notes & Observations">
                  <p className="text-xs text-muted-foreground">{preview.notesCount} entries with notes.</p>
                </PreviewSection>
              )}

              {/* Profile */}
              {sections.includeProfile && profile && (
                <PreviewSection emoji="🧡" title="MS Profile">
                  <p className="text-xs text-muted-foreground">
                    {[profile.ms_type, profile.year_diagnosed ? `Diagnosed ${profile.year_diagnosed}` : null].filter(Boolean).join(" · ") || "Basic profile info"}
                  </p>
                </PreviewSection>
              )}

              {/* AI Insight */}
              {sections.includeAiInsight && (
                <PreviewSection emoji="✨" title="AI Weekly Insight">
                  <p className="text-xs text-muted-foreground">AI-generated summary will be added during generation.</p>
                </PreviewSection>
              )}

              {entries.length === 0 && (
                <div className="rounded-lg bg-destructive/10 p-3 text-center">
                  <p className="text-xs text-destructive font-medium">No entries found for this period. The report will be mostly empty.</p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={generating}
            className="bg-primary text-primary-foreground hover:opacity-90"
          >
            {generating ? (
              <><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />Generating…</>
            ) : (
              <><Download className="mr-2 h-4 w-4" />Generate & Download</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function PreviewSection({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/50 p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm">{emoji}</span>
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <Check className="ml-auto h-3.5 w-3.5 text-primary" />
      </div>
      {children}
    </div>
  );
}
