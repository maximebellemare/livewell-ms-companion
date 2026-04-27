import { StyleSheet, View } from "react-native";
import type { DailyCheckIn } from "../../features/checkins/types";
import AppText from "../ui/AppText";

function formatCheckInDate(date: string) {
  const parsedDate = new Date(`${date}T12:00:00`);

  return parsedDate.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatCheckInValue(value: number | null) {
  return value === null ? "Not logged" : String(value);
}

function getCheckInInsight(item: DailyCheckIn) {
  if ((item.mood ?? 0) >= 4) {
    return "You felt better on this day";
  }

  if ((item.fatigue ?? 0) >= 4) {
    return "You reported high fatigue";
  }

  if ((item.pain ?? 0) >= 4) {
    return "You reported higher pain on this day";
  }

  if ((item.energy ?? 0) >= 4) {
    return "You had higher energy on this day";
  }

  return "Here’s how you checked in that day";
}

type CheckInDetailCardProps = {
  item: DailyCheckIn;
};

export default function CheckInDetailCard({ item }: CheckInDetailCardProps) {
  const optionalMetrics = [
    { label: "Pain", value: item.pain },
    { label: "Fatigue", value: item.fatigue },
    { label: "Mobility", value: item.mobility },
  ].filter((metric) => metric.value !== null);

  const hasMissingOptionalMetrics = [item.pain, item.fatigue, item.mobility].some(
    (value) => value === null,
  );

  return (
    <View style={styles.card}>
      <AppText style={styles.date}>{formatCheckInDate(item.checkin_date)}</AppText>
      <AppText style={styles.insight}>{getCheckInInsight(item)}</AppText>

      <View style={styles.section}>
        <View style={styles.metricRow}>
          <AppText style={styles.metricLabel}>Mood</AppText>
          <AppText style={styles.metricValue}>{formatCheckInValue(item.mood)}</AppText>
        </View>
        <View style={styles.metricRow}>
          <AppText style={styles.metricLabel}>Energy</AppText>
          <AppText style={styles.metricValue}>{formatCheckInValue(item.energy)}</AppText>
        </View>

        {optionalMetrics.map((metric) => (
          <View key={metric.label} style={styles.metricRow}>
            <AppText style={styles.metricLabel}>{metric.label}</AppText>
            <AppText style={styles.metricValue}>{formatCheckInValue(metric.value)}</AppText>
          </View>
        ))}

        {hasMissingOptionalMetrics ? (
          <AppText style={styles.helper}>Some values were not logged</AppText>
        ) : null}
      </View>

      <View style={styles.notesSection}>
        <AppText style={styles.notesLabel}>Notes</AppText>
        <AppText style={styles.notesValue}>{item.notes || "No notes"}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1e1d4",
    padding: 18,
    gap: 14,
  },
  date: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  insight: {
    color: "#c25d10",
    fontWeight: "600",
  },
  section: {
    gap: 10,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  metricLabel: {
    color: "#6b7280",
  },
  metricValue: {
    color: "#1f2937",
    fontWeight: "600",
  },
  helper: {
    color: "#6b7280",
    fontSize: 13,
  },
  notesSection: {
    gap: 6,
  },
  notesLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  notesValue: {
    color: "#4b5563",
  },
});
