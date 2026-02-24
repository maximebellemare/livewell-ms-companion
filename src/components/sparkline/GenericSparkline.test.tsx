import { describe, it, expect, vi } from "vitest";
// @ts-ignore - types resolve at runtime
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { format, subDays } from "date-fns";
import GenericSparkline from "../GenericSparkline";
import type { SparklineConfig } from "./types";

// Helper: generate entries for the last 7 days
function makeWeekEntries(values: (number | null)[], dataKey = "mood") {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(today, 6 - i), "yyyy-MM-dd");
    const val = values[i] ?? null;
    return { date, [dataKey]: val };
  });
}

const moodConfig: SparklineConfig = {
  label: "Mood",
  emoji: "😊",
  dataKey: "mood",
  unit: "/10",
  heatmapMetric: "mood",
  lowerIsBetter: false,
  colorFn: () => "hsl(145 50% 42%)",
  lineColor: "hsl(145 45% 45%)",
  fillColor: "hsl(145 45% 45% / 0.10)",
};

const fatigueConfig: SparklineConfig = {
  label: "Fatigue",
  emoji: "🔋",
  dataKey: "fatigue",
  unit: "/10",
  heatmapMetric: "fatigue",
  lowerIsBetter: true,
  colorFn: () => "hsl(25 85% 50%)",
  lineColor: "hsl(25 85% 50%)",
  fillColor: "hsl(0 72% 51% / 0.08)",
};

const wrap = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe("GenericSparkline", () => {
  // ── Row variant ──
  describe("row variant", () => {
    it("renders label, average, and unit with data", () => {
      const entries = makeWeekEntries([5, 6, 7, 5, 6, 7, 6]);
      wrap(<GenericSparkline entries={entries} config={moodConfig} />);

      expect(screen.getByText(/Mood/)).toBeInTheDocument();
      expect(screen.getByText("6.0")).toBeInTheDocument();
      expect(screen.getByText("/10")).toBeInTheDocument();
    });

    it("renders nothing when no data", () => {
      const entries = makeWeekEntries([null, null, null, null, null, null, null]);
      const { container } = wrap(
        <GenericSparkline entries={entries} config={moodConfig} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders an SVG sparkline chart", () => {
      const entries = makeWeekEntries([3, 5, 7, 4, 6, 8, 5]);
      const { container } = wrap(
        <GenericSparkline entries={entries} config={moodConfig} />
      );
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("shows improving trend arrow for higher-is-better metric", () => {
      // First half avg ~2, second half avg ~9 → clear ↑
      const entries = makeWeekEntries([1, 2, 2, 3, 9, 9, 9]);
      wrap(<GenericSparkline entries={entries} config={moodConfig} />);
      expect(screen.getByText("↑")).toBeInTheDocument();
    });

    it("shows worsening trend arrow for lower-is-better metric", () => {
      // First half avg ~2, second half avg ~9 → fatigue worsening ↑
      const entries = makeWeekEntries([1, 2, 2, 3, 9, 9, 9], "fatigue");
      wrap(<GenericSparkline entries={entries} config={fatigueConfig} />);
      expect(screen.getByText("↑")).toBeInTheDocument();
    });

    it("handles partial data gracefully", () => {
      const entries = makeWeekEntries([null, null, 5, null, null, 7, null]);
      wrap(<GenericSparkline entries={entries} config={moodConfig} />);
      expect(screen.getByText("6.0")).toBeInTheDocument();
    });
  });

  // ── Card variant ──
  describe("card variant", () => {
    it("renders as a button when onClick is provided", () => {
      const entries = makeWeekEntries([5, 5, 5, 5, 5, 5, 5]);
      const { container } = wrap(
        <GenericSparkline entries={entries} config={moodConfig} variant="card" onClick={() => {}} />
      );
      expect(container.querySelector("button")).toBeInTheDocument();
    });

    it("renders as a div when no handlers provided", () => {
      const entries = makeWeekEntries([5, 5, 5, 5, 5, 5, 5]);
      const { container } = wrap(
        <GenericSparkline entries={entries} config={moodConfig} variant="card" />
      );
      expect(container.querySelector("button")).toBeNull();
      expect(container.querySelector("div")).toBeInTheDocument();
    });

    it("calls onClick when tapped", () => {
      const onClick = vi.fn();
      const entries = makeWeekEntries([5, 5, 5, 5, 5, 5, 5]);
      const { container } = wrap(
        <GenericSparkline entries={entries} config={moodConfig} variant="card" onClick={onClick} />
      );
      fireEvent.click(container.querySelector("button")!);
      expect(onClick).toHaveBeenCalledOnce();
    });

    it("shows 'No data yet' empty state", () => {
      const entries = makeWeekEntries([null, null, null, null, null, null, null]);
      wrap(
        <GenericSparkline entries={entries} config={moodConfig} variant="card" />
      );
      expect(screen.getByText("No data yet")).toBeInTheDocument();
    });

    it("shows emoji and label in card header", () => {
      const entries = makeWeekEntries([4, 4, 4, 4, 4, 4, 4]);
      wrap(
        <GenericSparkline entries={entries} config={moodConfig} variant="card" />
      );
      expect(screen.getByText(/😊/)).toBeInTheDocument();
      expect(screen.getByText(/Mood/)).toBeInTheDocument();
    });

    it("shows saved overlay when saved=true", () => {
      const entries = makeWeekEntries([5, 5, 5, 5, 5, 5, 5]);
      const { container } = wrap(
        <GenericSparkline entries={entries} config={moodConfig} variant="card" saved={true} />
      );
      // SavedOverlay renders a CheckCircle2 icon
      expect(container.querySelector("svg.lucide-check-circle-2")).toBeInTheDocument();
    });
  });

  // ── Average calculation ──
  describe("average calculation", () => {
    it("computes correct average with all values", () => {
      // avg = (2+4+6+8+10+8+4) / 7 = 42/7 = 6.0
      const entries = makeWeekEntries([2, 4, 6, 8, 10, 8, 4]);
      wrap(<GenericSparkline entries={entries} config={moodConfig} />);
      expect(screen.getByText("6.0")).toBeInTheDocument();
    });

    it("computes average excluding null values", () => {
      // only 3 and 7 → avg = 5.0
      const entries = makeWeekEntries([null, null, 3, null, null, 7, null]);
      wrap(<GenericSparkline entries={entries} config={moodConfig} />);
      expect(screen.getByText("5.0")).toBeInTheDocument();
    });
  });
});
