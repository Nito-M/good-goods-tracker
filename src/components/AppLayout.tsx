import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { Button } from "@/components/ui/button";
import { Menu, RefreshCw, Building2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrgName = async () => {
      if (!user) { setOrgName(null); return; }
      const { data } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1);
      if (data && data.length > 0) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', data[0].organization_id)
          .single();
        setOrgName(org?.name || null);
      }
    };
    fetchOrgName();
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Mobile header with menu trigger */}
          <header className="md:hidden flex items-center justify-between h-14 border-b border-border px-4 bg-background sticky top-0 z-40">
            <div className="flex items-center">
              <SidebarTrigger className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              <span className="ml-3 font-semibold text-foreground">Zumy</span>
              {orgName && (
                <span className="ml-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {orgName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-9 w-9"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <OfflineIndicator />
            </div>
          </header>
          {/* Desktop header with offline indicator */}
          <header className="hidden md:flex items-center justify-between h-12 border-b border-border px-4 bg-background sticky top-0 z-40 gap-2">
            {orgName ? (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                {orgName}
              </span>
            ) : <span />}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-8 w-8"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <OfflineIndicator />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
