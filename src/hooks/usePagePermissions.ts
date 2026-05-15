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
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { isOrgAdmin, loading: orgAdminLoading } = useIsOrgAdmin();
  const [allowedPages, setAllowedPages] = useState<string[] | null>(null); // null = all access
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      // Always wait for auth + role checks to finish before resolving permissions.
      // Otherwise we can briefly resolve as "all pages allowed" and let the UI
      // render unrestricted before the real restrictions load.
      if (authLoading || adminLoading || orgAdminLoading) {
        setLoading(true);
        return;
      }

      if (!user) {
        setAllowedPages(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Super admins bypass all permissions
      if (isAdmin) {
        setAllowedPages(null);
        setLoading(false);
        return;
      }

      // Get the user's organizations to look up org-level page restrictions
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id);
      const orgIds = (memberships || []).map(m => m.organization_id);

      const [{ data: userPerms }, { data: workerGrants }, orgPermsRes] = await Promise.all([
        supabase
          .from('user_page_permissions')
          .select('page_key')
          .eq('user_id', user.id),
        supabase
          .from('worker_access_grants')
          .select('worker_id')
          .eq('user_id', user.id)
          .limit(1),
        orgIds.length > 0
          ? supabase
              .from('organization_page_permissions')
              .select('organization_id, page_key')
              .in('organization_id', orgIds)
          : Promise.resolve({ data: [] as { organization_id: string; page_key: string }[] }),
      ]);

      // Compute the org-allowed page set: union across all the user's orgs.
      // An org with NO rows = unrestricted (don't constrain via that org).
      const orgPerms = (orgPermsRes.data || []) as { organization_id: string; page_key: string }[];
      const orgsWithRestrictions = new Set(orgPerms.map(p => p.organization_id));
      const hasUnrestrictedOrg = orgIds.some(id => !orgsWithRestrictions.has(id));
      let orgAllowed: string[] | null = null; // null = unrestricted
      if (!hasUnrestrictedOrg && orgsWithRestrictions.size > 0) {
        orgAllowed = Array.from(new Set(orgPerms.map(p => p.page_key)));
        // Settings always accessible
        if (!orgAllowed.includes('settings')) orgAllowed.push('settings');
      }

      // Org admins bypass per-user permissions but still respect org-level restrictions
      let userAllowed: string[] | null;
      if (isOrgAdmin || !userPerms || userPerms.length === 0) {
        userAllowed = null;
      } else {
        userAllowed = userPerms.map(d => d.page_key);
        if (workerGrants && workerGrants.length > 0 && !userAllowed.includes('assets')) {
          userAllowed.push('assets');
        }
      }

      // Intersect user-level and org-level restrictions
      let finalAllowed: string[] | null;
      if (userAllowed === null && orgAllowed === null) {
        finalAllowed = null;
      } else if (userAllowed === null) {
        finalAllowed = orgAllowed;
      } else if (orgAllowed === null) {
        finalAllowed = userAllowed;
      } else {
        finalAllowed = userAllowed.filter(k => orgAllowed!.includes(k));
        if (!finalAllowed.includes('settings')) finalAllowed.push('settings');
      }

      if (cancelled) return;
      setAllowedPages(finalAllowed);
      setLoading(false);
    };
    fetch();
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, isOrgAdmin, adminLoading, orgAdminLoading, authLoading]);

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
