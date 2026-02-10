import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useIsOrgAdmin() {
  const { user } = useAuth();
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const [orgIds, setOrgIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!user) {
        setIsOrgAdmin(false);
        setOrgIds([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin']);

      const isAdmin = (data && data.length > 0) || false;
      setIsOrgAdmin(isAdmin);
      setOrgIds(data?.map(d => d.organization_id) || []);
      setLoading(false);
    };
    check();
  }, [user]);

  return { isOrgAdmin, orgIds, loading };
}
