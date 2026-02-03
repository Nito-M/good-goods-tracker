import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Mobile header with menu trigger */}
          <header className="md:hidden flex items-center h-14 border-b border-border px-4 bg-background sticky top-0 z-40">
            <SidebarTrigger className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <span className="ml-3 font-semibold text-foreground">Inventory</span>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
