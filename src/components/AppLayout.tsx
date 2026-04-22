import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { Button } from "@/components/ui/button";
import { Menu, RefreshCw, Building2, ExternalLink, Store, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrgShop {
  id: string;
  name: string;
  slug: string;
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  const [orgName, setOrgName] = useState<string | null>(null);
  const [shops, setShops] = useState<OrgShop[]>([]);

  useEffect(() => {
    const fetchOrgInfo = async () => {
      if (!user) { 
        setOrgName(null); 
        setShops([]); 
        return; 
      }
      
      // Fetch all orgs user is a member of
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id);

      if (memberships && memberships.length > 0) {
        const orgIds = memberships.map(m => m.organization_id);
        
        // Get all orgs with storefront enabled
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name, slug, storefront_enabled')
          .in('id', orgIds);

        if (orgs) {
          // Set the first org name for display
          setOrgName(orgs[0]?.name || null);
          
          // Filter shops that have storefront enabled and a slug
          const enabledShops = orgs
            .filter(org => org.storefront_enabled && org.slug)
            .map(org => ({ id: org.id, name: org.name, slug: org.slug! }));
          
          setShops(enabledShops);
        }
      }
    };
    fetchOrgInfo();
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  const firstShopSlug = shops.length > 0 ? shops[0].slug : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar shopSlug={firstShopSlug} shops={shops} />
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
              {shops.length === 1 && (
                <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
                  <a href={`/shop/${shops[0].slug}`} target="_blank" rel="noopener noreferrer" title="View Public Shop">
                    <Store className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {shops.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Store className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {shops.map(shop => (
                      <DropdownMenuItem key={shop.id} asChild>
                        <a 
                          href={`/shop/${shop.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Store className="h-3.5 w-3.5" />
                          {shop.name}
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </a>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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

              {shops.length === 1 && (
                <a
                  href={`/shop/${shops[0].slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Store className="h-3.5 w-3.5" />
                  View Shop
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {shops.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-primary">
                      <Store className="h-3.5 w-3.5" />
                      View Shops
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {shops.map(shop => (
                      <DropdownMenuItem key={shop.id} asChild>
                        <a 
                          href={`/shop/${shop.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Store className="h-3.5 w-3.5" />
                          {shop.name}
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </a>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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

          <main className="flex-1 min-h-0 overflow-hidden text-center">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
