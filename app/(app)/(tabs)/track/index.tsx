import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import CheckInDetailCard from "../../../../components/track/CheckInDetailCard";
import CheckInHistoryList from "../../../../components/track/CheckInHistoryList";
import EmptyState from "../../../../components/ui/EmptyState";
import ErrorState from "../../../../components/ui/ErrorState";
import LoadingState from "../../../../components/ui/LoadingState";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import { useAuth } from "../../../../features/auth/hooks";
import { useCheckInHistory } from "../../../../features/checkins/hooks";
import { getErrorMessage } from "../../../../lib/errors";

const QUERY_LIMIT = 30;
const VISIBLE_HISTORY_LIMIT = 12;

export default function TrackScreen() {
  const { user } = useAuth();
  const historyQuery = useCheckInHistory(user?.id, QUERY_LIMIT);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!historyQuery.data || historyQuery.data.length === 0) {
      setSelectedDate(null);
      return;
    }

    setSelectedDate((current) => current ?? historyQuery.data[0].checkin_date);
  }, [historyQuery.data]);

  const visibleItems = useMemo(
    () => historyQuery.data?.slice(0, VISIBLE_HISTORY_LIMIT) ?? [],
    [historyQuery.data],
  );

  const selectedItem = useMemo(() => {
    const selectedFromVisible =
      visibleItems.find((item) => item.checkin_date === selectedDate) ?? null;

    return selectedFromVisible ?? visibleItems[0] ?? null;
  }, [selectedDate, visibleItems]);

  if (!user?.id) {
    return <ErrorState message="You need to be signed in to view your check-in history." />;
  }

  if (historyQuery.isLoading) {
    return <LoadingState message="Loading history..." />;
  }

  if (historyQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(historyQuery.error)}
        onRetry={() => void historyQuery.refetch()}
      />
    );
  }

  if (!visibleItems.length) {
    return (
      <EmptyState
        title="No check-ins yet"
        message="Start with today's check-in to build your history."
      />
    );
  }

  return (
    <AppScreen title="Track" subtitle="Look back at your recent check-ins.">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Recent days</AppText>
          <CheckInHistoryList
            items={visibleItems}
            selectedDate={selectedItem?.checkin_date ?? null}
            onSelectDate={setSelectedDate}
          />
        </View>

        {selectedItem ? (
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Details</AppText>
            <CheckInDetailCard item={selectedItem} />
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
});
