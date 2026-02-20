import { Mail, FileText, Pencil, Check, X } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useEntriesInRange } from "@/hooks/useEntries";
import { format, subDays } from "date-fns";
import { computeRisk } from "./relapse-risk/computeRisk";
import { RISK_CONFIG } from "./relapse-risk/types";
import { toast } from "sonner";
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

export default function ContactNeurologistCard() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const today = new Date();
  const start = format(subDays(today, 34), "yyyy-MM-dd");
  const end = format(today, "yyyy-MM-dd");
  const { data: entries = [] } = useEntriesInRange(start, end);

  const risk = useMemo(() => {
    if (entries.length < 4) return null;
    const midpoint = format(subDays(today, 6), "yyyy-MM-dd");
    const recent = entries.filter((e) => e.date > midpoint);
    const older = entries.filter((e) => e.date <= midpoint && e.date > format(subDays(today, 13), "yyyy-MM-dd"));
    return (recent.length >= 2 && older.length >= 2) ? computeRisk(recent, older) : null;
  }, [entries]);

  const isElevated = risk && (risk.level === "elevated" || risk.level === "high");
  const cfg = isElevated ? RISK_CONFIG[risk.level] : null;
  const hasNeuro = !!profile?.neurologist_email;
  const neuroName = profile?.neurologist_name;

  const formatDrName = (name: string | null | undefined) => {
    if (!name) return null;
    return name.match(/^dr\.?\s/i) ? name : `Dr. ${name}`;
  };

  const mailtoSubject = isElevated
    ? "Symptom update – elevated relapse risk"
    : "Symptom update from my MS tracker";

  const mailtoBody = isElevated
    ? `Hi${neuroName ? ` ${formatDrName(neuroName)}` : ""},\n\nMy symptom tracker is showing ${risk.level} relapse risk (score: ${risk.score}/100).\n\nKey factors:\n${risk.factors.map((f) => `• ${f}`).join("\n")}\n\nI'd like to discuss next steps.\n\nThank you`
    : `Hi${neuroName ? ` ${formatDrName(neuroName)}` : ""},\n\nI'd like to share an update from my MS symptom tracker.\n\nThank you`;

  const mailtoHref = hasNeuro
    ? `mailto:${profile.neurologist_email}?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`
    : undefined;

  const borderClass = cfg ? cfg.border : "border-border";
  const bgClass = cfg ? cfg.bg : "bg-card";
  const subtitle = isElevated
    ? `Your risk level is ${risk.level} — consider reaching out`
    : "Stay connected with your care team";

  const startEditing = () => {
    setEditName(profile?.neurologist_name || "");
    setEditEmail(profile?.neurologist_email || "");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEditing = async (skipConfirm = false) => {
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();

    // If both fields are empty and neurologist existed before, confirm clearing
    if (!skipConfirm && !trimmedName && !trimmedEmail && hasNeuro) {
      setShowClearConfirm(true);
      return;
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (trimmedName.length > 100) {
      toast.error("Name must be less than 100 characters");
      return;
    }
    if (trimmedEmail.length > 255) {
      toast.error("Email must be less than 255 characters");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        neurologist_name: trimmedName || null,
        neurologist_email: trimmedEmail || null,
      });
      toast.success("Neurologist info updated");
      setIsEditing(false);
    } catch {
      toast.error("Failed to save changes");
    }
  };

  const confirmClear = () => {
    setShowClearConfirm(false);
    saveEditing(true);
  };

  return (
    <div className={`rounded-xl border ${borderClass} ${bgClass} p-4 animate-fade-in`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🩺</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Contact Your Neurologist</p>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        {cfg && (
          <span className={`text-xs font-bold ${cfg.color}`}>{cfg.emoji} {cfg.label}</span>
        )}
      </div>

      {isEditing ? (
        <div className="mb-3 rounded-lg bg-card/60 border border-border px-3 py-2.5 space-y-2">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Smith"
              maxLength={100}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1">Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="doctor@example.com"
              maxLength={255}
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => saveEditing()}
              disabled={updateProfile.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {updateProfile.isPending ? "Saving…" : "Save"}
            </button>
            <button
              onClick={cancelEditing}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-secondary border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {hasNeuro && (
            <div className="mb-3 rounded-lg bg-card/60 border border-border px-3 py-2 flex items-center">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Neurologist on file</p>
                <p className="text-sm font-medium text-foreground">
                  {neuroName ? formatDrName(neuroName) : profile.neurologist_email}
                </p>
                {neuroName && (
                  <p className="text-[11px] text-muted-foreground">{profile.neurologist_email}</p>
                )}
              </div>
              <button
                onClick={startEditing}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Edit neurologist info"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      <div className="flex gap-2">
        {hasNeuro && !isEditing ? (
          <a
            href={mailtoHref}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            <Mail className="h-4 w-4" />
            Email Neurologist
          </a>
        ) : !isEditing ? (
          <button
            onClick={startEditing}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-secondary border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Mail className="h-4 w-4" />
            Set Up Email
          </button>
        ) : null}
        {!isEditing && (
          <button
            onClick={() => navigate("/reports")}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-secondary border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <FileText className="h-4 w-4" />
            Generate Report
          </button>
        )}
      </div>

      <p className="mt-2.5 text-[9px] text-muted-foreground text-center">
        {isElevated ? "Quick actions based on your current risk assessment" : "Email your neurologist or generate a report anytime"}
      </p>
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove neurologist info?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear your neurologist's name and email. You can always add them again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClear}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
