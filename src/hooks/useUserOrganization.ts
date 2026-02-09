import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserOrganization {
  id: string;
  name: string;
  role: string;
}

export function useUserOrganization() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<UserOrganization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrganization(null);
      setLoading(false);
      return;
    }

    const fetchOrg = async () => {
      try {
        const { data, error } = await supabase
          .from('organization_members')
          .select('role, organization_id, organizations(id, name)')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (!error && data) {
          const org = data.organizations as any;
          setOrganization({
            id: org.id,
            name: org.name,
            role: data.role,
          });
        }
      } catch {
        // User may not belong to an org
      } finally {
        setLoading(false);
      }
    };

    fetchOrg();
  }, [user]);

  return { organization, loading };
}
