import { Pencil } from "lucide-react";
import { formatDrName } from "./utils";

interface NeurologistInfoDisplayProps {
  name: string | null | undefined;
  email: string;
  onEdit: () => void;
}

export default function NeurologistInfoDisplay({ name, email, onEdit }: NeurologistInfoDisplayProps) {
  return (
    <div className="mb-3 rounded-lg bg-card/60 border border-border px-3 py-2 flex items-center">
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">Neurologist on file</p>
        <p className="text-sm font-medium text-foreground">
          {name ? formatDrName(name) : email}
        </p>
        {name && (
          <p className="text-[11px] text-muted-foreground">{email}</p>
        )}
      </div>
      <button
        onClick={onEdit}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        aria-label="Edit neurologist info"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
