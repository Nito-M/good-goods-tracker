import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserOrganization {
  id: string;
  name: string;
  role: string;
}

const STORAGE_KEY = 'inventory.activeOrgId';

export function useUserOrganizations() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<UserOrganization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrganizations([]);
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('organization_members')
        .select('role, organization_id, organizations:organization_id(id, name)')
        .eq('user_id', user.id);

      if (error || !data) {
        setOrganizations([]);
        setLoading(false);
        return;
      }

      const orgs: UserOrganization[] = (data as any[])
        .map((row) => ({
          id: row.organizations?.id,
          name: row.organizations?.name,
          role: row.role,
        }))
        .filter((o) => o.id && o.name)
        .sort((a, b) => a.name.localeCompare(b.name));

      setOrganizations(orgs);
      setLoading(false);
    })();
  }, [user]);

  return { organizations, loading };
}

export function getStoredActiveOrgId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredActiveOrgId(orgId: string | null) {
  try {
    if (orgId) localStorage.setItem(STORAGE_KEY, orgId);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
