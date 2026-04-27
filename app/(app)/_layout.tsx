import { Stack } from "expo-router";
import RouteGate from "../../components/ui/RouteGate";

export default function AppLayout() {
  return (
    <RouteGate mode="app">
      <Stack screenOptions={{ headerShown: false }} />
    </RouteGate>
  );
}
