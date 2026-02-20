import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import InstallPrompt from "./InstallPrompt";
import OfflineBanner from "./OfflineBanner";
import OnboardingTooltips from "./OnboardingTooltips";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  const location = useLocation();
  const showNav = !location.pathname.startsWith("/onboarding") && location.pathname !== "/" && location.pathname !== "/auth";

  return (
    <div className="min-h-screen bg-background">
      <OfflineBanner />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to main content
      </a>
      <main id="main-content" className={showNav ? "pb-20" : ""} role="main">
        {children}
      </main>
      <BottomNav />
      <InstallPrompt />
      {showNav && location.pathname === "/today" && (
        <OnboardingTooltips
          storageKey="onboarding_tour_v1"
          steps={[
            { target: "sparklines", title: "Your week at a glance", description: "These sparklines show your symptom trends over the past 7 days. Tap any card to log quickly, or hold to dive into detailed insights.", position: "bottom" },
            { target: "quick-log", title: "Log your symptoms", description: "Slide each symptom to rate how you're feeling today. Your weekly average is shown for comparison.", position: "top" },
            { target: "mood-tags", title: "Tag your mood", description: "Add tags to capture the nuances of how you're feeling — they'll help spot patterns over time.", position: "top" },
            { target: "reminders", title: "Medications & appointments", description: "Quick access to manage your medication schedule and upcoming visits — all in one place.", position: "top" },
          ]}
        />
      )}
    </div>
  );
};

export default AppShell;

