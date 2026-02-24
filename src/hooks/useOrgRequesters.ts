import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useIsOrgAdmin } from '@/hooks/useIsOrgAdmin';
import { useToast } from '@/hooks/use-toast';

interface OrgRequester {
  id: string;
  name: string;
  linked_user_id: string | null;
  organization_id: string;
}

interface OrgMember {
  userId: string;
  displayName: string | null;
}

export function useOrgRequesters() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isOrgAdmin, orgIds } = useIsOrgAdmin();
  const { toast } = useToast();

  const [requesters, setRequesters] = useState<OrgRequester[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [resolvedOrgIds, setResolvedOrgIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Resolve org IDs
      let ids: string[] = [];
      if (isAdmin) {
        const { data } = await supabase.from('organizations').select('id');
        ids = data?.map(o => o.id) || [];
      } else {
        ids = orgIds;
      }
      setResolvedOrgIds(ids);

      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch requesters and members in parallel
      const [reqRes, memRes] = await Promise.all([
        supabase.from('org_requesters').select('id, name, linked_user_id, organization_id').in('organization_id', ids),
        supabase.from('organization_members').select('user_id, organization_id').in('organization_id', ids),
      ]);

      setRequesters(reqRes.data || []);

      // Fetch display names for members
      const userIds = [...new Set((memRes.data || []).map(m => m.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);

        setMembers(
          userIds.map(uid => ({
            userId: uid,
            displayName: profiles?.find(p => p.user_id === uid)?.display_name || null,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching org requesters:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, orgIds]);

  useEffect(() => {
    if (isAdmin || isOrgAdmin) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAdmin, isOrgAdmin, fetchData]);

  const addRequester = async (name: string) => {
    if (resolvedOrgIds.length === 0) return;
    try {
      const { error } = await supabase.from('org_requesters').insert({
        name: name.trim(),
        organization_id: resolvedOrgIds[0],
      });
      if (error) throw error;
      toast({ title: 'Requester added' });
      await fetchData();
    } catch (error: any) {
      console.error('Error adding requester:', error);
      toast({ title: 'Error', description: 'Failed to add requester.', variant: 'destructive' });
    }
  };

  const deleteRequester = async (id: string) => {
    try {
      const { error } = await supabase.from('org_requesters').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Requester removed' });
      await fetchData();
    } catch (error: any) {
      console.error('Error deleting requester:', error);
      toast({ title: 'Error', description: 'Failed to remove requester.', variant: 'destructive' });
    }
  };

  const linkRequester = async (requesterId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('org_requesters')
        .update({ linked_user_id: userId })
        .eq('id', requesterId);
      if (error) throw error;
      toast({ title: 'Requester linked' });
      await fetchData();
    } catch (error: any) {
      console.error('Error linking requester:', error);
      toast({ title: 'Error', description: 'Failed to link requester.', variant: 'destructive' });
    }
  };

  const unlinkRequester = async (requesterId: string) => {
    try {
      const { error } = await supabase
        .from('org_requesters')
        .update({ linked_user_id: null })
        .eq('id', requesterId);
      if (error) throw error;
      toast({ title: 'Requester unlinked' });
      await fetchData();
    } catch (error: any) {
      console.error('Error unlinking requester:', error);
      toast({ title: 'Error', description: 'Failed to unlink requester.', variant: 'destructive' });
    }
  };

  return {
    requesters,
    members,
    loading,
    addRequester,
    deleteRequester,
    linkRequester,
    unlinkRequester,
    refetch: fetchData,
    requesterNames: requesters.map(r => r.name),
  };
}
