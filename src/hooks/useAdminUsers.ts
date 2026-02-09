import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  isActive: boolean;
  roles: string[];
  createdAt: string;
  lastSignIn: string | null;
  emailConfirmedAt: string | null;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const callAdminFunction = useCallback(async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await supabase.functions.invoke('admin-users', {
      body,
    });

    if (response.error) throw response.error;
    return response.data;
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await callAdminFunction({ action: 'list_users' });
      setUsers(data.users);
      setIsAdmin(true);
    } catch (error: any) {
      if (error?.message?.includes('Forbidden') || error?.context?.status === 403) {
        setIsAdmin(false);
      } else {
        console.error('Error fetching users:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [callAdminFunction]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const setRole = async (userId: string, role: 'admin' | 'user') => {
    try {
      await callAdminFunction({ action: 'set_role', userId, role });
      toast({ title: 'Role updated', description: `User role changed to ${role}` });
      await fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    }
  };

  const toggleActive = async (userId: string) => {
    try {
      await callAdminFunction({ action: 'toggle_active', userId });
      toast({ title: 'Status updated' });
      await fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await callAdminFunction({ action: 'delete_user', userId });
      toast({ title: 'User deleted' });
      await fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to delete user', variant: 'destructive' });
    }
  };

  return { users, loading, isAdmin, fetchUsers, setRole, toggleActive, deleteUser };
}
