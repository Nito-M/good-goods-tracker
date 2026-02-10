import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useIsOrgAdmin } from '@/hooks/useIsOrgAdmin';

interface LinkedRequesterInfo {
  /** The requester name linked to the current user, or null if not linked / admin */
  linkedName: string | null;
  /** All requester names from the user's org(s) */
  allOrgRequesterNames: string[];
  /** Whether the current user is an admin (org admin or super admin) */
  isAdminUser: boolean;
  loading: boolean;
}

export function useLinkedRequester(): LinkedRequesterInfo {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isOrgAdmin, orgIds } = useIsOrgAdmin();
  const [linkedName, setLinkedName] = useState<string | null>(null);
  const [allOrgRequesterNames, setAllOrgRequesterNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get org IDs the user belongs to
        const { data: memberships } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id);

        const userOrgIds = memberships?.map(m => m.organization_id) || [];

        if (userOrgIds.length === 0) {
          setLoading(false);
          return;
        }

        // Get all org requesters for those orgs
        const { data: requesters } = await supabase
          .from('org_requesters')
          .select('name, linked_user_id, organization_id')
          .in('organization_id', userOrgIds);

        const names = requesters?.map(r => r.name) || [];
        setAllOrgRequesterNames(names);

        // Find the one linked to this user
        const linked = requesters?.find(r => r.linked_user_id === user.id);
        setLinkedName(linked?.name || null);
      } catch (error) {
        console.error('Error fetching linked requester:', error);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user]);

  return {
    linkedName,
    allOrgRequesterNames,
    isAdminUser: isAdmin || isOrgAdmin,
    loading,
  };
}
