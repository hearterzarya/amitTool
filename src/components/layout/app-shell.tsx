import { AppHeader } from "./app-header";
import { AppFooter } from "./app-footer";
import { WhatsAppButton } from "./whatsapp-button";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className = "" }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="fixed inset-0 gradient-surface-light -z-20"></div>
      <AppHeader />
      <main className="flex-1 pt-20 md:pt-24 relative z-10">
        {children}
      </main>
      <AppFooter />
      <WhatsAppButton />
    </div>
  );
}
