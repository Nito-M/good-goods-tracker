import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useIsOrgAdmin } from '@/hooks/useIsOrgAdmin';

const PAGE_KEY_TO_ROUTES: Record<string, string[]> = {
  dashboard: ['/'],
  items: ['/items', '/items/new', '/items/edit', '/item'],
  sales: ['/sales'],
  quotes: ['/quotes'],
  'purchase-orders': ['/purchase-orders', '/purchase-orders/new'],
  requests: ['/requests'],
  calendar: ['/calendar'],
  notes: ['/notes'],
  bank: ['/bank'],
  settings: ['/settings'],
  jobs: ['/jobs'],
};

export function usePagePermissions() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { isOrgAdmin, loading: orgAdminLoading } = useIsOrgAdmin();
  const [allowedPages, setAllowedPages] = useState<string[] | null>(null); // null = all access
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user || adminLoading || orgAdminLoading) return;

      // Admins and org admins bypass permissions
      if (isAdmin || isOrgAdmin) {
        setAllowedPages(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_page_permissions')
        .select('page_key')
        .eq('user_id', user.id);

      if (!data || data.length === 0) {
        // No permission rows = all access
        setAllowedPages(null);
      } else {
        setAllowedPages(data.map(d => d.page_key));
      }
      setLoading(false);
    };
    fetch();
  }, [user, isAdmin, isOrgAdmin, adminLoading, orgAdminLoading]);

  const isPageAllowed = (pageKey: string): boolean => {
    if (allowedPages === null) return true;
    return allowedPages.includes(pageKey);
  };

  const isRouteAllowed = (path: string): boolean => {
    if (allowedPages === null) return true;
    // Settings and jobs are always allowed
    if (path.startsWith('/settings') || path.startsWith('/jobs')) return true;
    
    for (const [pageKey, routes] of Object.entries(PAGE_KEY_TO_ROUTES)) {
      for (const route of routes) {
        if (path === route || path.startsWith(route + '/')) {
          return allowedPages.includes(pageKey);
        }
      }
    }
    return true; // Unknown routes allowed by default
  };

  const getFirstAllowedRoute = (): string => {
    if (allowedPages === null) return '/';
    const orderedKeys = ['dashboard', 'items', 'sales', 'quotes', 'purchase-orders', 'requests', 'calendar', 'notes', 'bank', 'settings'];
    for (const key of orderedKeys) {
      if (allowedPages.includes(key)) {
        return PAGE_KEY_TO_ROUTES[key]?.[0] || '/';
      }
    }
    return '/settings';
  };

  return { allowedPages, loading, isPageAllowed, isRouteAllowed, getFirstAllowedRoute };
}
