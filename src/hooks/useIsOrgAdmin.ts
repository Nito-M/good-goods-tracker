import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useIsOrgAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [orgIds, setOrgIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish initializing before deciding anything
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setIsOrgAdmin(false);
      setOrgIds([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin']);
      if (cancelled) return;
      const isAdmin = (data && data.length > 0) || false;
      setIsOrgAdmin(isAdmin);
      setOrgIds(data?.map(d => d.organization_id) || []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { isOrgAdmin, orgIds, loading };
}
