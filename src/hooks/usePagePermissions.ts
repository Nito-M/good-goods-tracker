import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const ALL_PAGES = [
  { key: 'dashboard', label: 'Dashboard', url: '/' },
  { key: 'items', label: 'Items', url: '/items' },
  { key: 'sales', label: 'Sales', url: '/sales' },
  { key: 'quotes', label: 'Quotes', url: '/quotes' },
  { key: 'purchase-orders', label: 'Purchase Orders', url: '/purchase-orders' },
  { key: 'requests', label: 'Requests', url: '/requests' },
  { key: 'calendar', label: 'Calendar', url: '/calendar' },
  { key: 'notes', label: 'Notes', url: '/notes' },
  { key: 'bank', label: 'Bank', url: '/bank' },
  { key: 'settings', label: 'Settings', url: '/settings' },
] as const;

export type PageKey = typeof ALL_PAGES[number]['key'];

export function usePagePermissions() {
  const { user } = useAuth();
  const [allowedPages, setAllowedPages] = useState<Set<string>>(new Set(ALL_PAGES.map(p => p.key)));
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchPermissions = useCallback(async () => {
    if (!user) return;
    
    try {
      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (roleData && roleData.length > 0) {
        // Admins see all pages
        setIsAdmin(true);
        setAllowedPages(new Set(ALL_PAGES.map(p => p.key)));
        setLoading(false);
        return;
      }

      // Fetch user's page permissions
      const { data: permissions } = await supabase
        .from('user_page_permissions')
        .select('page_key')
        .eq('user_id', user.id);

      if (permissions && permissions.length > 0) {
        setAllowedPages(new Set(permissions.map(p => p.page_key)));
      } else {
        // No permissions set = all pages allowed (default)
        setAllowedPages(new Set(ALL_PAGES.map(p => p.key)));
      }
    } catch (error) {
      console.error('Error fetching page permissions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const isPageAllowed = useCallback((pageKey: string) => {
    if (isAdmin) return true;
    return allowedPages.has(pageKey);
  }, [allowedPages, isAdmin]);

  const isUrlAllowed = useCallback((url: string) => {
    if (isAdmin) return true;
    const page = ALL_PAGES.find(p => {
      if (p.url === '/') return url === '/';
      return url === p.url || url.startsWith(p.url + '/');
    });
    if (!page) return true; // Unknown routes are allowed
    return allowedPages.has(page.key);
  }, [allowedPages, isAdmin]);

  return { allowedPages, loading, isAdmin, isPageAllowed, isUrlAllowed, refetch: fetchPermissions };
}
