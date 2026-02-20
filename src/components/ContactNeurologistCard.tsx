import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
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
import NeurologistEditForm from "./neurologist/NeurologistEditForm";
import NeurologistInfoDisplay from "./neurologist/NeurologistInfoDisplay";
import NeurologistActions from "./neurologist/NeurologistActions";
import { formatDrName } from "./neurologist/utils";

export default function ContactNeurologistCard() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

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
    setEditPhone(profile?.neurologist_phone || "");
    setIsEditing(true);
  };

  const saveEditing = async (skipConfirm = false) => {
    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();
    const trimmedPhone = editPhone.trim();

    if (!skipConfirm && !trimmedName && !trimmedEmail && !trimmedPhone && hasNeuro) {
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
    if (trimmedPhone.length > 30) {
      toast.error("Phone must be less than 30 characters");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        neurologist_name: trimmedName || null,
        neurologist_email: trimmedEmail || null,
        neurologist_phone: trimmedPhone || null,
      });
      toast.success("Neurologist info updated");
      setIsEditing(false);
    } catch {
      toast.error("Failed to save changes");
    }
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
        <NeurologistEditForm
          editName={editName}
          editEmail={editEmail}
          editPhone={editPhone}
          onNameChange={setEditName}
          onEmailChange={setEditEmail}
          onPhoneChange={setEditPhone}
          onSave={() => saveEditing()}
          onCancel={() => setIsEditing(false)}
          isSaving={updateProfile.isPending}
        />
      ) : (
        <>
          {hasNeuro && (
            <NeurologistInfoDisplay
              name={neuroName}
              email={profile.neurologist_email!}
              phone={profile.neurologist_phone}
              onEdit={startEditing}
            />
          )}
          <NeurologistActions
            hasNeuro={hasNeuro}
            mailtoHref={mailtoHref}
            onSetupEmail={startEditing}
          />
        </>
      )}

      <p className="mt-2.5 text-[9px] text-muted-foreground text-center">
        {isElevated ? "Quick actions based on your current risk assessment" : "Email your neurologist or generate a report anytime"}
      </p>

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove neurologist info?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear your neurologist's name, email, and phone number. You can always add them again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowClearConfirm(false); saveEditing(true); }}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
