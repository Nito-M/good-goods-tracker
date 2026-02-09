import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrgMembership {
  organizationId: string;
  organizationName: string;
  role: string;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  isActive: boolean;
  roles: string[];
  pagePermissions: string[];
  organizations: OrgMembership[];
  createdAt: string;
  lastSignIn: string | null;
  emailConfirmedAt: string | null;
}

export interface OrgMember {
  userId: string;
  email: string;
  displayName: string | null;
  role: string;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  members: OrgMember[];
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
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
      setIsOrgAdmin(true);
    } catch (error: any) {
      if (error?.message?.includes('Forbidden') || error?.context?.status === 403) {
        setIsAdmin(false);
        setIsOrgAdmin(false);
      } else {
        console.error('Error fetching users:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [callAdminFunction]);

  const fetchOrganizations = useCallback(async () => {
    try {
      const data = await callAdminFunction({ action: 'list_orgs' });
      setOrganizations(data.organizations);
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
    }
  }, [callAdminFunction]);

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
  }, [fetchUsers, fetchOrganizations]);

  const setRole = async (userId: string, role: 'admin' | 'user') => {
    try {
      await callAdminFunction({ action: 'set_role', userId, role });
      toast({ title: 'Role updated', description: `User role changed to ${role}` });
      await fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    }
  };

  const setPagePermissions = async (userId: string, pageKeys: string[]) => {
    try {
      await callAdminFunction({ action: 'set_page_permissions', userId, pageKeys });
      toast({ title: 'Permissions updated', description: 'Page access updated successfully' });
      await fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to update permissions', variant: 'destructive' });
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

  const createUser = async (email: string, password?: string, orgId?: string, orgRole?: string): Promise<{ userId?: string; tempPassword?: string }> => {
    try {
      const data = await callAdminFunction({ action: 'create_user', email, password, orgId, orgRole });
      toast({ title: 'User created', description: `User ${email} has been added` });
      await fetchUsers();
      await fetchOrganizations();
      return { userId: data.userId, tempPassword: data.tempPassword };
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to create user', variant: 'destructive' });
      return {};
    }
  };

  // Organization management
  const createOrg = async (name: string) => {
    try {
      await callAdminFunction({ action: 'create_org', orgName: name });
      toast({ title: 'Organization created', description: `${name} has been created` });
      await fetchOrganizations();
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to create organization', variant: 'destructive' });
    }
  };

  const deleteOrg = async (orgId: string) => {
    try {
      await callAdminFunction({ action: 'delete_org', orgId });
      toast({ title: 'Organization deleted' });
      await fetchOrganizations();
      await fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to delete organization', variant: 'destructive' });
    }
  };

  const addOrgMember = async (orgId: string, userId: string, orgRole: string = 'member') => {
    try {
      await callAdminFunction({ action: 'add_org_member', orgId, userId, orgRole });
      toast({ title: 'Member added' });
      await fetchOrganizations();
      await fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to add member', variant: 'destructive' });
    }
  };

  const removeOrgMember = async (orgId: string, userId: string) => {
    try {
      await callAdminFunction({ action: 'remove_org_member', orgId, userId });
      toast({ title: 'Member removed' });
      await fetchOrganizations();
      await fetchUsers();
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to remove member', variant: 'destructive' });
    }
  };

  const setOrgMemberRole = async (orgId: string, userId: string, orgRole: string) => {
    try {
      await callAdminFunction({ action: 'set_org_member_role', orgId, userId, orgRole });
      toast({ title: 'Member role updated' });
      await fetchOrganizations();
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to update member role', variant: 'destructive' });
    }
  };

  return {
    users, organizations, loading, isAdmin, isOrgAdmin,
    fetchUsers, fetchOrganizations,
    setRole, setPagePermissions, toggleActive, deleteUser, createUser,
    createOrg, deleteOrg, addOrgMember, removeOrgMember, setOrgMemberRole,
  };
}
