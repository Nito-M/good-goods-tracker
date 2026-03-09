import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { Button } from "@/components/ui/button";
import { Menu, RefreshCw, Building2, ExternalLink, Store } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  const [orgName, setOrgName] = useState<string | null>(null);
  const [shopSlug, setShopSlug] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrgInfo = async () => {
      if (!user) { setOrgName(null); setShopSlug(null); return; }
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1);

      if (memberships && memberships.length > 0) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name, slug, storefront_enabled')
          .eq('id', memberships[0].organization_id)
          .single();
        setOrgName(org?.name || null);
        setShopSlug((org as any)?.storefront_enabled && (org as any)?.slug ? (org as any).slug : null);
      }
    };
    fetchOrgInfo();
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar shopSlug={shopSlug} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile header */}
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
              {shopSlug && (
                <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                  <a href={`/shop/${shopSlug}`} target="_blank" rel="noopener noreferrer" title="View Public Shop">
                    <Store className="h-4 w-4" />
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-9 w-9">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <OfflineIndicator />
            </div>
          </header>

          {/* Desktop header */}
          <header className="hidden md:flex items-center justify-between h-12 border-b border-border px-4 bg-card sticky top-0 z-40 gap-2">
            <div className="flex items-center gap-3">
              {orgName ? (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  {orgName}
                </span>
              ) : <span />}

              {shopSlug && (
                <a
                  href={`/shop/${shopSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Store className="h-3.5 w-3.5" />
                  View Shop
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-8 w-8">
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <OfflineIndicator />
            </div>
          </header>

          <main className="flex-1 min-h-0 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
