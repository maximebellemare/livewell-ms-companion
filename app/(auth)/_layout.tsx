import { Stack } from "expo-router";
import RouteGate from "../../components/ui/RouteGate";

export default function AuthLayout() {
  return (
    <RouteGate mode="auth">
      <Stack screenOptions={{ headerShown: false }} />
    </RouteGate>
  );
}
