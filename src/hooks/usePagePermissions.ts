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
  'sales-orders': ['/sales-orders'],
  'purchase-orders': ['/purchase-orders', '/purchase-orders/new'],
  requests: ['/requests'],
  calendar: ['/calendar'],
  notes: ['/notes'],
  boards: ['/boards'],
  bank: ['/bank'],
  settings: ['/settings'],
  jobs: ['/jobs'],
  assemblies: ['/assemblies'],
  assets: ['/assets'],
  parts: ['/parts'],
  'tax-documents': ['/tax-documents'],
  'trailer-config': ['/trailer-configurator'],
};

export function usePagePermissions() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { isOrgAdmin, loading: orgAdminLoading } = useIsOrgAdmin();
  const [allowedPages, setAllowedPages] = useState<string[] | null>(null); // null = all access
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (adminLoading || orgAdminLoading) return;

      if (!user) {
        setLoading(false);
        return;
      }

      // Admins and org admins bypass permissions
      if (isAdmin || isOrgAdmin) {
        setAllowedPages(null);
        setLoading(false);
        return;
      }

      const [{ data }, { data: workerGrants }] = await Promise.all([
        supabase
          .from('user_page_permissions')
          .select('page_key')
          .eq('user_id', user.id),
        supabase
          .from('worker_access_grants')
          .select('worker_id')
          .eq('user_id', user.id)
          .limit(1),
      ]);

      if (!data || data.length === 0) {
        // No permission rows = all access
        setAllowedPages(null);
      } else {
        const keys = data.map(d => d.page_key);
        // If user has any per-worker access grants, also allow Business Info page
        if (workerGrants && workerGrants.length > 0 && !keys.includes('assets')) {
          keys.push('assets');
        }
        setAllowedPages(keys);
      }
      setLoading(false);
    };
    fetch();
  }, [user, isAdmin, isOrgAdmin, adminLoading, orgAdminLoading]);

  const isPageAllowed = (pageKey: string): boolean => {
    if (loading) return false; // Hide everything until permissions resolve
    if (allowedPages === null) return true;
    return allowedPages.includes(pageKey);
  };

  const isRouteAllowed = (path: string): boolean => {
    if (loading) return false; // Block route checks until permissions resolve
    if (allowedPages === null) return true;
    // Settings is always allowed
    if (path.startsWith('/settings')) return true;
    
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
    const orderedKeys = ['dashboard', 'items', 'sales', 'quotes', 'sales-orders', 'purchase-orders', 'requests', 'calendar', 'notes', 'boards', 'bank', 'jobs', 'assemblies', 'assets', 'parts', 'tax-documents', 'trailer-config', 'settings'];
    for (const key of orderedKeys) {
      if (allowedPages.includes(key)) {
        return PAGE_KEY_TO_ROUTES[key]?.[0] || '/';
      }
    }
    return '/settings';
  };

  return { allowedPages, loading, isPageAllowed, isRouteAllowed, getFirstAllowedRoute };
}
