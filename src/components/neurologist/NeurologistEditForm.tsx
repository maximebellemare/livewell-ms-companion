import { Check, X } from "lucide-react";

interface NeurologistEditFormProps {
  editName: string;
  editEmail: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function NeurologistEditForm({
  editName,
  editEmail,
  onNameChange,
  onEmailChange,
  onSave,
  onCancel,
  isSaving,
}: NeurologistEditFormProps) {
  return (
    <div className="mb-3 rounded-lg bg-card/60 border border-border px-3 py-2.5 space-y-2">
      <div>
        <label className="text-[11px] text-muted-foreground block mb-1">Name</label>
        <input
          type="text"
          value={editName}
          onChange={(e) => onNameChange(e.target.value)}
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
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="doctor@example.com"
          maxLength={255}
          className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-secondary border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </button>
      </div>
    </div>
  );
}
