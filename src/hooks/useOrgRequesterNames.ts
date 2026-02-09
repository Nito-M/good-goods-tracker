import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface OrgRequester {
  id: string;
  organizationId: string;
  name: string;
  linkedUserId: string | null;
}

export function useOrgRequesterNames() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requesters, setRequesters] = useState<OrgRequester[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived: just the names for dropdowns
  const requesterNames = requesters.map((r) => r.name);

  // The requester name linked to the current user
  const myRequesterName = requesters.find((r) => r.linkedUserId === user?.id)?.name || null;

  const fetchRequesters = useCallback(async () => {
    if (!user) return;

    try {
      // Get user's org
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!membership) return;

      setOrgId(membership.organization_id);

      const { data, error } = await supabase
        .from('org_requesters')
        .select('*')
        .eq('organization_id', membership.organization_id)
        .order('name');

      if (error) throw error;

      setRequesters(
        (data || []).map((r: any) => ({
          id: r.id,
          organizationId: r.organization_id,
          name: r.name,
          linkedUserId: r.linked_user_id,
        }))
      );
    } catch {
      // User may not belong to an org
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequesters();
  }, [fetchRequesters]);

  const addRequester = async (name: string, linkedUserId?: string | null): Promise<boolean> => {
    if (!orgId) return false;

    try {
      const { error } = await supabase
        .from('org_requesters')
        .insert({
          organization_id: orgId,
          name,
          linked_user_id: linkedUserId || null,
        });

      if (error) throw error;

      await fetchRequesters();
      toast({ title: 'Saved', description: 'Requester added' });
      return true;
    } catch (error: any) {
      console.error('Error adding requester:', error);
      toast({ title: 'Error', description: 'Failed to add requester', variant: 'destructive' });
      return false;
    }
  };

  const updateRequester = async (id: string, updates: { name?: string; linkedUserId?: string | null }): Promise<boolean> => {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.linkedUserId !== undefined) dbUpdates.linked_user_id = updates.linkedUserId;

      const { error } = await supabase
        .from('org_requesters')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      await fetchRequesters();
      toast({ title: 'Saved', description: 'Requester updated' });
      return true;
    } catch (error: any) {
      console.error('Error updating requester:', error);
      toast({ title: 'Error', description: 'Failed to update requester', variant: 'destructive' });
      return false;
    }
  };

  const deleteRequester = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('org_requesters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchRequesters();
      toast({ title: 'Deleted', description: 'Requester removed' });
      return true;
    } catch (error: any) {
      console.error('Error deleting requester:', error);
      toast({ title: 'Error', description: 'Failed to delete requester', variant: 'destructive' });
      return false;
    }
  };

  return {
    requesters,
    requesterNames,
    myRequesterName,
    orgId,
    loading,
    addRequester,
    updateRequester,
    deleteRequester,
    refetch: fetchRequesters,
  };
}
