import { useMemo, useState } from "react";
import type { DailyEntry } from "@/hooks/useEntries";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const METRICS = [
  { key: "fatigue",     label: "Fatigue",   short: "Fat" },
  { key: "pain",        label: "Pain",      short: "Pain" },
  { key: "brain_fog",   label: "Brain Fog", short: "Fog" },
  { key: "mood",        label: "Mood",      short: "Mood" },
  { key: "mobility",    label: "Mobility",  short: "Mob" },
  { key: "spasticity",  label: "Spasticity",short: "Spas" },
  { key: "stress",      label: "Stress",    short: "Str" },
  { key: "sleep_hours",   label: "Sleep",     short: "Slp" },
  { key: "water_glasses", label: "Hydration", short: "Hyd" },
] as const;

type MetricKey = typeof METRICS[number]["key"];

function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length < 5) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const den = Math.sqrt(
    xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
    ys.reduce((s, y) => s + (y - my) ** 2, 0),
  );
  return den === 0 ? null : num / den;
}

function cellColor(r: number | null): string {
  if (r === null) return "hsl(var(--muted) / 0.3)";
  // Strong positive = warm orange, strong negative = cool blue, zero = neutral
  const abs = Math.abs(r);
  const opacity = Math.min(abs * 1.4, 1);
  if (r > 0) return `hsl(25 85% 50% / ${(opacity * 0.6).toFixed(2)})`;
  return `hsl(210 70% 50% / ${(opacity * 0.6).toFixed(2)})`;
}

function cellText(r: number | null): string {
  if (r === null) return "—";
  return r.toFixed(2);
}

function strengthLabel(r: number | null): string {
  if (r === null) return "Not enough data";
  const abs = Math.abs(r);
  const dir = r > 0 ? "positive" : "negative";
  if (abs >= 0.6) return `Strong ${dir}`;
  if (abs >= 0.3) return `Moderate ${dir}`;
  return `Weak ${dir}`;
}

interface Props {
  entries: DailyEntry[];
}

export default function SymptomCorrelationMatrix({ entries }: Props) {
  const [selected, setSelected] = useState<{ row: string; col: string; r: number } | null>(null);

  const matrix = useMemo(() => {
    const result: Record<string, Record<string, number | null>> = {};
    for (const a of METRICS) {
      result[a.key] = {};
      for (const b of METRICS) {
        if (a.key === b.key) {
          result[a.key][b.key] = 1;
          continue;
        }
        // Build paired arrays where both values exist
        const xs: number[] = [];
        const ys: number[] = [];
        for (const e of entries) {
          const vx = e[a.key as keyof DailyEntry] as number | null;
          const vy = e[b.key as keyof DailyEntry] as number | null;
          if (vx !== null && vx !== undefined && vy !== null && vy !== undefined) {
            xs.push(vx);
            ys.push(vy);
          }
        }
        result[a.key][b.key] = pearson(xs, ys);
      }
    }
    return result;
  }, [entries]);

  // Find strongest correlations for the summary
  const topCorrelations = useMemo(() => {
    const pairs: { a: string; b: string; r: number; aLabel: string; bLabel: string }[] = [];
    for (let i = 0; i < METRICS.length; i++) {
      for (let j = i + 1; j < METRICS.length; j++) {
        const r = matrix[METRICS[i].key][METRICS[j].key];
        if (r !== null && Math.abs(r) >= 0.3) {
          pairs.push({
            a: METRICS[i].key,
            b: METRICS[j].key,
            r,
            aLabel: METRICS[i].label,
            bLabel: METRICS[j].label,
          });
        }
      }
    }
    return pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).slice(0, 4);
  }, [matrix]);

  if (entries.length < 5) return null;

  return (
    <div className="card-base space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔗</span>
        <span className="text-sm font-semibold text-foreground">Symptom Correlation Matrix</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Shows how strongly your symptoms move together. Orange = rise together, blue = opposite patterns.
      </p>

      {/* Matrix grid */}
      <TooltipProvider delayDuration={200}>
        <div className="overflow-x-auto -mx-1">
          <div className="inline-grid gap-[2px]" style={{
            gridTemplateColumns: `40px repeat(${METRICS.length}, 1fr)`,
            minWidth: "340px",
          }}>
            {/* Header row */}
            <div />
            {METRICS.map((m) => (
              <div key={m.key} className="text-center text-[9px] font-semibold text-muted-foreground py-1 px-0.5 leading-tight">
                {m.short}
              </div>
            ))}

            {/* Data rows */}
            {METRICS.map((row) => (
              <>
                <div key={`label-${row.key}`} className="flex items-center text-[9px] font-semibold text-muted-foreground pr-1 leading-tight">
                  {row.short}
                </div>
                {METRICS.map((col) => {
                  const r = matrix[row.key]?.[col.key] ?? null;
                  const isDiag = row.key === col.key;
                  const isSelected = selected?.row === row.key && selected?.col === col.key;
                  return (
                    <UITooltip key={`${row.key}-${col.key}`}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            if (!isDiag && r !== null) {
                              setSelected(isSelected ? null : { row: row.key, col: col.key, r });
                            }
                          }}
                          className={`aspect-square flex items-center justify-center rounded-md text-[9px] font-mono font-bold transition-all ${
                            isDiag ? "opacity-30" : "cursor-pointer hover:ring-1 hover:ring-primary/50"
                          } ${isSelected ? "ring-2 ring-primary" : ""}`}
                          style={{ backgroundColor: cellColor(isDiag ? null : r) }}
                        >
                          <span className={`${r !== null && Math.abs(r) > 0.3 ? "text-foreground" : "text-muted-foreground"}`}>
                            {isDiag ? "•" : cellText(r)}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs max-w-[220px]">
                        {isDiag ? (
                          `${row.label} compared with itself — always 1.0`
                        ) : r === null ? (
                          `${row.label} × ${col.label}: Not enough paired data yet.`
                        ) : (
                          <>
                            <span className="font-semibold">{row.label} × {col.label}</span>
                            <br />
                            r = {r.toFixed(2)} · {strengthLabel(r)}
                            <br />
                            {r > 0.3
                              ? "These tend to rise and fall together."
                              : r < -0.3
                              ? "When one rises, the other tends to fall."
                              : "No strong pattern between these."}
                          </>
                        )}
                      </TooltipContent>
                    </UITooltip>
                  );
                })}
              </>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
          <UITooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 cursor-help">
                <span className="h-2.5 w-6 rounded-sm" style={{ backgroundColor: "hsl(210 70% 50% / 0.5)" }} />
                Opposite
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-[200px]">
              Blue cells mean these symptoms move in opposite directions — when one goes up, the other tends to go down.
            </TooltipContent>
          </UITooltip>
          <UITooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 cursor-help">
                <span className="h-2.5 w-6 rounded-sm bg-muted" />
                No link
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-[200px]">
              Grey cells mean no meaningful pattern was found between these symptoms.
            </TooltipContent>
          </UITooltip>
          <UITooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 cursor-help">
                <span className="h-2.5 w-6 rounded-sm" style={{ backgroundColor: "hsl(25 85% 50% / 0.5)" }} />
                Together
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-[200px]">
              Orange cells mean these symptoms rise and fall together — when one is high, the other tends to be high too.
            </TooltipContent>
          </UITooltip>
        </div>
      </TooltipProvider>

      {/* Selected cell detail */}
      {selected && (
        <div className="rounded-lg bg-muted px-3 py-2.5 text-xs space-y-1 animate-fade-in">
          <p className="font-semibold text-foreground">
            {METRICS.find((m) => m.key === selected.row)?.label} ×{" "}
            {METRICS.find((m) => m.key === selected.col)?.label}
          </p>
          <p className="text-muted-foreground">
            Correlation: <strong className="text-foreground font-mono">{selected.r.toFixed(3)}</strong>
            {" · "}
            {Math.abs(selected.r) >= 0.6
              ? "Strong"
              : Math.abs(selected.r) >= 0.3
              ? "Moderate"
              : "Weak"}{" "}
            {selected.r > 0 ? "positive" : "negative"} relationship
          </p>
          <p className="text-muted-foreground">
            {selected.r > 0.3
              ? `When ${METRICS.find((m) => m.key === selected.row)?.label.toLowerCase()} is high, ${METRICS.find((m) => m.key === selected.col)?.label.toLowerCase()} tends to be high too.`
              : selected.r < -0.3
              ? `When ${METRICS.find((m) => m.key === selected.row)?.label.toLowerCase()} is high, ${METRICS.find((m) => m.key === selected.col)?.label.toLowerCase()} tends to be low.`
              : "These symptoms don't show a strong pattern together."}
          </p>
        </div>
      )}

      {/* Top correlations summary */}
      {topCorrelations.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Strongest Patterns</p>
          {topCorrelations.map(({ aLabel, bLabel, r }) => (
            <div
              key={`${aLabel}-${bLabel}`}
              className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs"
            >
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: r > 0 ? "hsl(25 85% 50%)" : "hsl(210 70% 50%)" }}
              />
              <span className="text-foreground font-medium">{aLabel} & {bLabel}</span>
              <span className="ml-auto font-mono text-muted-foreground">
                r = {r.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center">
        Based on {entries.length} daily entries · Tap any cell for details
      </p>
    </div>
  );
}
