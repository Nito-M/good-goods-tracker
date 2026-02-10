import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useOrgRequesterNames() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requesterNames, setRequesterNames] = useState<string[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrgRequesterNames = useCallback(async () => {
    if (!user) return;

    try {
      // Get user's org
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(id, requester_names)')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (membership) {
        const org = membership.organizations as any;
        setOrgId(membership.organization_id);
        setRequesterNames(org?.requester_names || []);
      }
    } catch {
      // User may not belong to an org
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrgRequesterNames();
  }, [fetchOrgRequesterNames]);

  const updateRequesterNames = async (names: string[]): Promise<boolean> => {
    if (!orgId) return false;

    try {
      const { error } = await supabase
        .from('organizations')
        .update({ requester_names: names })
        .eq('id', orgId);

      if (error) throw error;

      setRequesterNames(names);
      toast({ title: 'Saved', description: 'Requester names updated' });
      return true;
    } catch (error: any) {
      console.error('Error updating requester names:', error);
      toast({ title: 'Error', description: 'Failed to update requester names', variant: 'destructive' });
      return false;
    }
  };

  return { requesterNames, orgId, loading, updateRequesterNames, refetch: fetchOrgRequesterNames };
}
