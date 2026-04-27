import { useRouter } from "expo-router";
import AppButton from "../components/ui/AppButton";
import AppScreen from "../components/ui/AppScreen";
import EmptyState from "../components/ui/EmptyState";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <AppScreen>
      <EmptyState
        title="Screen not found"
        message="This route does not exist in the native app yet."
        action={<AppButton label="Go home" onPress={() => router.replace("/")} />}
      />
    </AppScreen>
  );
}
