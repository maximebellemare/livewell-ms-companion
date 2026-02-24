import type { PlotPoint } from "./types";

/**
 * Detect 7-day trend by comparing the average of the first half (x ≤ 3)
 * against the second half (x > 3).
 */
export function computeTrend(
  plotPoints: Pick<PlotPoint, "x" | "value">[],
  lowerIsBetter: boolean,
  trendThreshold: number,
): "↑" | "↓" | "→" {
  const firstHalf = plotPoints.filter((p) => p.x <= 3);
  const secondHalf = plotPoints.filter((p) => p.x > 3);
  const avg = (arr: typeof plotPoints) =>
    arr.length ? arr.reduce((s, p) => s + p.value, 0) / arr.length : null;
  const f = avg(firstHalf);
  const s = avg(secondHalf);

  let trend: "↑" | "↓" | "→" = "→";
  if (f !== null && s !== null) {
    if (lowerIsBetter) {
      if (f - s > trendThreshold) trend = "↓";
      else if (s - f > trendThreshold) trend = "↑";
    } else {
      if (s - f > trendThreshold) trend = "↑";
      else if (f - s > trendThreshold) trend = "↓";
    }
  }
  return trend;
}
