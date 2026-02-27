import { useState } from "react";
import { Filter, X, Search } from "lucide-react";

export interface RelapseFilterState {
  severity: string | null;
  status: "all" | "recovered" | "ongoing";
  search: string;
}

const SEVERITY_OPTIONS = ["mild", "moderate", "severe", "critical"];

export default function RelapseFilters({
  filters,
  onChange,
}: {
  filters: RelapseFilterState;
  onChange: (f: RelapseFilterState) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeCount =
    (filters.severity ? 1 : 0) + (filters.status !== "all" ? 1 : 0) + (filters.search ? 1 : 0);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search symptoms, triggers, notes..."
            className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            activeCount > 0
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-secondary"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          {activeCount > 0 && <span>{activeCount}</span>}
        </button>
      </div>

      {expanded && (
        <div className="rounded-xl bg-card p-3 shadow-soft space-y-3 animate-fade-in">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">Severity</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => onChange({ ...filters, severity: null })}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  !filters.severity
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border"
                }`}
              >
                All
              </button>
              {SEVERITY_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onChange({ ...filters, severity: filters.severity === s ? null : s })}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
                    filters.severity === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">Status</p>
            <div className="flex gap-1.5">
              {(["all", "recovered", "ongoing"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => onChange({ ...filters, status: s })}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
                    filters.status === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {activeCount > 0 && (
            <button
              onClick={() => onChange({ severity: null, status: "all", search: "" })}
              className="flex items-center gap-1 text-[11px] text-destructive hover:underline"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
