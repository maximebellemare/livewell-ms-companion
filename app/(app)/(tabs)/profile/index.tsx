import AppButton from "../../../../components/ui/AppButton";
import AppScreen from "../../../../components/ui/AppScreen";
import AppText from "../../../../components/ui/AppText";
import { useAuth } from "../../../../features/auth/hooks";

export default function ProfileScreen() {
  const { signOut } = useAuth();

  return (
    <AppScreen title="Profile">
      <AppText>Authenticated tab shell only.</AppText>
      <AppButton label="Sign out" onPress={() => void signOut()} />
    </AppScreen>
  );
}
