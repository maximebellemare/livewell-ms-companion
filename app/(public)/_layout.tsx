import { Stack } from "expo-router";
import RouteGate from "../../components/ui/RouteGate";

export default function PublicLayout() {
  return (
    <RouteGate mode="public">
      <Stack screenOptions={{ headerShown: false }} />
    </RouteGate>
  );
}
