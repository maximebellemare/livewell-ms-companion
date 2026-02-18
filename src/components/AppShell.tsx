import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import InstallPrompt from "./InstallPrompt";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const location = useLocation();
  const showNav = !location.pathname.startsWith("/onboarding") && location.pathname !== "/" && location.pathname !== "/auth";

  return (
    <div className="min-h-screen bg-background">
      <main className={showNav ? "pb-20" : ""}>{children}</main>
      <BottomNav />
      <InstallPrompt />
    </div>
  );
};

export default AppShell;

