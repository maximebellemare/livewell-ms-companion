import { Mail, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NeurologistActionsProps {
  hasNeuro: boolean;
  mailtoHref: string | undefined;
  onSetupEmail: () => void;
}

export default function NeurologistActions({ hasNeuro, mailtoHref, onSetupEmail }: NeurologistActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="flex gap-2">
      {hasNeuro ? (
        <a
          href={mailtoHref}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
        >
          <Mail className="h-4 w-4" />
          Email Neurologist
        </a>
      ) : (
        <button
          onClick={onSetupEmail}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-secondary border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Mail className="h-4 w-4" />
          Set Up Email
        </button>
      )}
      <button
        onClick={() => navigate("/reports")}
        className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-secondary border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        <FileText className="h-4 w-4" />
        Generate Report
      </button>
    </div>
  );
}
