import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, UserPlus, Shield, Link2, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useIsOrgAdmin } from '@/hooks/useIsOrgAdmin';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PAGE_KEYS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'items', label: 'Items' },
  { key: 'sales', label: 'Sales' },
  { key: 'quotes', label: 'Quotes' },
  { key: 'sales-orders', label: 'Sales Orders' },
  { key: 'purchase-orders', label: 'Purchase Orders' },
  { key: 'requests', label: 'Requests' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'notes', label: 'Notes' },
  { key: 'boards', label: 'Boards' },
  { key: 'bank', label: 'Bank' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'assemblies', label: 'Assemblies' },
  { key: 'assets', label: 'Business Info' },
  { key: 'parts', label: 'Parts Library' },
  { key: 'tax-documents', label: 'Tax Documents' },
  { key: 'trailer-config', label: 'Trailer Configurator' },
  { key: 'settings', label: 'Settings' },
];

interface OrgRequester {
  id: string;
  name: string;
  linked_user_id: string | null;
  organization_id: string;
}

interface OrgUser {
  memberId: string;
  userId: string;
  displayName: string | null;
  email: string | null;
  role: string;
  orgId: string;
  orgName: string;
  permissions: string[]; // page_keys the user has access to
  featurePermissions: string[]; // feature keys like 'view_all_requests'
  linkedRequesterName: string | null;
}

export function UsersSettings() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isOrgAdmin, orgIds } = useIsOrgAdmin();
  const { toast } = useToast();

  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Add user dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addOrgId, setAddOrgId] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [selectedPages, setSelectedPages] = useState<string[]>([...PAGE_KEYS.map(p => p.key)]);
  const [adding, setAdding] = useState(false);

  // Edit permissions dialog
  const [editUser, setEditUser] = useState<OrgUser | null>(null);
  const [editPages, setEditPages] = useState<string[]>([]);
  const [editFeatures, setEditFeatures] = useState<string[]>([]);
  const [editWorkerIds, setEditWorkerIds] = useState<string[]>([]);
  const [orgWorkers, setOrgWorkers] = useState<{ id: string; name: string }[]>([]);
  const [workerSearch, setWorkerSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteUser, setDeleteUser] = useState<OrgUser | null>(null);

  // Edit user (display name)
  const [editNameUser, setEditNameUser] = useState<OrgUser | null>(null);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Orgs the current user can manage
  const [managedOrgs, setManagedOrgs] = useState<{ id: string; name: string }[]>([]);

  // Org requesters
  const [orgRequesters, setOrgRequesters] = useState<OrgRequester[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get orgs the current user can manage
      let orgs: { id: string; name: string }[] = [];
      if (isAdmin) {
        const { data } = await supabase.from('organizations').select('id, name');
        orgs = data || [];
      } else {
        const { data } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds);
        orgs = data || [];
      }
      setManagedOrgs(orgs);

      const orgIdList = orgs.map(o => o.id);

      // Fetch org requesters
      if (orgIdList.length > 0) {
        const { data: reqData } = await supabase
          .from('org_requesters')
          .select('id, name, linked_user_id, organization_id')
          .in('organization_id', orgIdList);
        setOrgRequesters(reqData || []);
      }

      // Get all members of those orgs
      const allUsers: OrgUser[] = [];
      for (const org of orgs) {
        const { data: members } = await supabase
          .from('organization_members')
          .select('id, user_id, role')
          .eq('organization_id', org.id);

        if (!members) continue;

        const userIds = members.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);

        const { data: permissions } = await supabase
          .from('user_page_permissions')
          .select('user_id, page_key')
          .in('user_id', userIds);

        // Fetch feature permissions
        const { data: featurePerms } = await supabase
          .from('user_feature_permissions' as any)
          .select('user_id, feature_key')
          .in('user_id', userIds);

        // Get requesters for this org
        const { data: reqData } = await supabase
          .from('org_requesters')
          .select('name, linked_user_id')
          .eq('organization_id', org.id);

        for (const member of members) {

          const profile = profiles?.find(p => p.user_id === member.user_id);
          const userPerms = permissions
            ?.filter(p => p.user_id === member.user_id)
            .map(p => p.page_key) || [];

          const userFeaturePerms = (featurePerms as any[] || [])
            .filter((p: any) => p.user_id === member.user_id)
            .map((p: any) => p.feature_key);

          const linkedReq = reqData?.find(r => r.linked_user_id === member.user_id);

          allUsers.push({
            memberId: member.id,
            userId: member.user_id,
            displayName: profile?.display_name || null,
            email: null,
            role: member.role,
            orgId: org.id,
            orgName: org.name,
            permissions: userPerms,
            featurePermissions: userFeaturePerms,
            linkedRequesterName: linkedReq?.name || null,
          });
        }
      }
      // Fetch emails for all users via edge function
      const allUserIds = allUsers.map(u => u.userId);
      if (allUserIds.length > 0) {
        try {
          const { data: emailData } = await supabase.functions.invoke('lookup-users-by-ids', {
            body: { user_ids: allUserIds },
          });
          if (emailData?.users) {
            for (const u of allUsers) {
              u.email = emailData.users[u.userId] || null;
            }
          }
        } catch (e) {
          console.error('Error fetching user emails:', e);
        }
      }
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin || isOrgAdmin) {
      fetchData();
    }
  }, [isAdmin, isOrgAdmin, orgIds]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addOrgId || !newUserName.trim() || !newUserEmail.trim()) return;
    setAdding(true);

    try {
      // Look up user by email
      const { data: lookupData, error: lookupError } = await supabase.functions.invoke('lookup-user-by-email', {
        body: { email: newUserEmail.trim() },
      });

      const targetUserId = lookupData?.user_id;
      if (lookupError || !targetUserId) {
        toast({
          title: 'User not found',
          description: `No user found with email "${newUserEmail}". They must have an account first.`,
          variant: 'destructive',
        });
        setAdding(false);
        return;
      }

      // Check if already a member
      const existing = users.find(u => u.userId === targetUserId && u.orgId === addOrgId);
      if (existing) {
        toast({ title: 'Already a member', description: 'This user is already in this organization.', variant: 'destructive' });
        setAdding(false);
        return;
      }

      // Update display name
      if (newUserName.trim()) {
        await supabase
          .from('profiles')
          .update({ display_name: newUserName.trim() })
          .eq('user_id', targetUserId);
      }

      // Add as member
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: addOrgId,
          user_id: targetUserId,
          role: 'member',
        });
      if (memberError) throw memberError;

      // Set page permissions
      if (selectedPages.length > 0) {
        const permRows = selectedPages.map(pageKey => ({
          user_id: targetUserId,
          page_key: pageKey,
        }));
        const { error: permError } = await supabase
          .from('user_page_permissions')
          .insert(permRows);
        if (permError) throw permError;
      }

      // Auto-create a Staff Directory (workers) entry for this user, if one doesn't already exist
      try {
        const { data: existingWorker } = await supabase
          .from('workers')
          .select('id')
          .eq('email', newUserEmail.trim())
          .maybeSingle();

        if (!existingWorker) {
          await supabase.from('workers').insert({
            user_id: user!.id,
            name: newUserName.trim(),
            email: newUserEmail.trim(),
            status: 'active',
          });
        }
      } catch (workerErr) {
        console.error('Error creating staff directory entry:', workerErr);
      }

      toast({ title: 'User added', description: `${newUserName.trim()} has been added.` });
      setAddDialogOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setSelectedPages([...PAGE_KEYS.map(p => p.key)]);
      await fetchData();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({ title: 'Error', description: 'Failed to add user.', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const openEditPermissions = async (u: OrgUser) => {
    setEditUser(u);
    setEditPages(u.permissions.length > 0 ? [...u.permissions] : [...PAGE_KEYS.map(p => p.key)]);
    setEditFeatures([...u.featurePermissions]);
    setWorkerSearch('');

    // Load workers owned by other members of the same org (workers this user could be granted access to)
    const { data: orgMembers } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', u.orgId);
    const otherUserIds = (orgMembers || [])
      .map((m: any) => m.user_id)
      .filter((uid: string) => uid !== u.userId);
    let workers: { id: string; name: string }[] = [];
    if (otherUserIds.length > 0) {
      const { data } = await supabase
        .from('workers')
        .select('id, name')
        .in('user_id', otherUserIds)
        .order('name');
      workers = (data || []) as any;
    }
    setOrgWorkers(workers);

    const { data: grants } = await supabase
      .from('worker_access_grants')
      .select('worker_id')
      .eq('user_id', u.userId);
    setEditWorkerIds((grants || []).map((g: any) => g.worker_id));
  };

  const handleSavePermissions = async () => {
    if (!editUser) return;
    setSaving(true);

    try {
      // Delete existing page permissions
      await supabase
        .from('user_page_permissions')
        .delete()
        .eq('user_id', editUser.userId);

      // Insert new page permissions
      if (editPages.length > 0) {
        const permRows = editPages.map(pageKey => ({
          user_id: editUser.userId,
          page_key: pageKey,
        }));
        await supabase.from('user_page_permissions').insert(permRows);
      }

      // Delete existing feature permissions
      await supabase
        .from('user_feature_permissions' as any)
        .delete()
        .eq('user_id', editUser.userId);

      // Insert new feature permissions
      if (editFeatures.length > 0) {
        const featureRows = editFeatures.map(featureKey => ({
          user_id: editUser.userId,
          feature_key: featureKey,
        }));
        await supabase.from('user_feature_permissions' as any).insert(featureRows as any);
      }

      // Sync worker access grants: diff against existing
      const { data: existingGrants } = await supabase
        .from('worker_access_grants')
        .select('worker_id')
        .eq('user_id', editUser.userId);
      const existingIds = new Set((existingGrants || []).map((g: any) => g.worker_id));
      const desiredIds = new Set(editWorkerIds);
      const toAdd = [...desiredIds].filter(id => !existingIds.has(id));
      const toRemove = [...existingIds].filter(id => !desiredIds.has(id));
      if (toAdd.length > 0) {
        await supabase.from('worker_access_grants').insert(
          toAdd.map(workerId => ({
            worker_id: workerId,
            user_id: editUser.userId,
            granted_by: user?.id,
          }))
        );
      }
      if (toRemove.length > 0) {
        await supabase
          .from('worker_access_grants')
          .delete()
          .eq('user_id', editUser.userId)
          .in('worker_id', toRemove);
      }

      toast({ title: 'Permissions updated' });
      setEditUser(null);
      await fetchData();
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast({ title: 'Error', description: 'Failed to save permissions.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!deleteUser) return;
    try {
      // Remove permissions
      await supabase
        .from('user_page_permissions')
        .delete()
        .eq('user_id', deleteUser.userId);

      // Remove from org
      await supabase
        .from('organization_members')
        .delete()
        .eq('id', deleteUser.memberId);

      toast({ title: 'User removed' });
      setDeleteUser(null);
      await fetchData();
    } catch (error: any) {
      console.error('Error removing user:', error);
      toast({ title: 'Error', description: 'Failed to remove user.', variant: 'destructive' });
    }
  };

  const handleSaveName = async () => {
    if (!editNameUser || !editName.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: editName.trim() })
        .eq('user_id', editNameUser.userId);
      if (error) throw error;
      toast({ title: 'User updated' });
      setEditNameUser(null);
      await fetchData();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({ title: 'Error', description: 'Failed to update user.', variant: 'destructive' });
    } finally {
      setSavingName(false);
    }
  };

  const togglePage = (pageKey: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(pageKey)) {
      setList(list.filter(p => p !== pageKey));
    } else {
      setList([...list, pageKey]);
    }
  };

  const handleLinkRequester = async (orgUser: OrgUser, requesterName: string | null) => {
    try {
      // Unlink any existing link for this user in this org
      const existingLinked = orgRequesters.filter(
        r => r.organization_id === orgUser.orgId && r.linked_user_id === orgUser.userId
      );
      for (const r of existingLinked) {
        await supabase
          .from('org_requesters')
          .update({ linked_user_id: null })
          .eq('id', r.id);
      }

      if (requesterName) {
        // Find the requester record to link
        const target = orgRequesters.find(
          r => r.organization_id === orgUser.orgId && r.name === requesterName
        );
        if (target) {
          await supabase
            .from('org_requesters')
            .update({ linked_user_id: orgUser.userId })
            .eq('id', target.id);
        }
      }

      toast({ title: 'Requester linked', description: requesterName ? `Linked to "${requesterName}"` : 'Unlinked' });
      await fetchData();
    } catch (error: any) {
      console.error('Error linking requester:', error);
      toast({ title: 'Error', description: 'Failed to link requester.', variant: 'destructive' });
    }
  };

  const getAvailableRequesters = (orgId: string, currentUserId: string) => {
    return orgRequesters.filter(
      r => r.organization_id === orgId && (r.linked_user_id === null || r.linked_user_id === currentUserId)
    );
  };

  if (loading) {
    return <div className="text-muted-foreground py-8 text-center">Loading users...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users
            </CardTitle>
            <CardDescription>Manage users and their page access permissions</CardDescription>
          </div>
          {managedOrgs.length === 1 ? (
            <Button onClick={() => { setAddOrgId(managedOrgs[0].id); setAddDialogOpen(true); }} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          ) : managedOrgs.length > 1 ? (
            <div className="flex gap-2">
              {managedOrgs.map(org => (
                <Button key={org.id} variant="outline" size="sm" onClick={() => { setAddOrgId(org.id); setAddDialogOpen(true); }} className="gap-1">
                  <UserPlus className="h-4 w-4" />
                  Add to {org.name}
                </Button>
              ))}
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {users.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              No users in your organization yet. Add users to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.memberId}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{u.displayName || 'Unknown'}</span>
                      {u.email && (
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                        {u.role}
                      </span>
                      {managedOrgs.length > 1 && (
                        <span className="text-xs text-muted-foreground">({u.orgName})</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {u.permissions.length === 0 ? (
                        <span className="text-xs text-muted-foreground">All pages (no restrictions)</span>
                      ) : (
                        u.permissions.map(p => (
                          <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {PAGE_KEYS.find(pk => pk.key === p)?.label || p}
                          </span>
                        ))
                      )}
                      {u.featurePermissions.includes('view_all_requests') && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          View All Requests
                        </span>
                      )}
                      {u.featurePermissions.includes('view_all_workers') && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          View All Workers
                        </span>
                      )}
                    </div>
                    {/* Requester linking */}
                    <div className="flex items-center gap-2 pt-1">
                      <Link2 className="h-3 w-3 text-muted-foreground" />
                      <Select
                        value={u.linkedRequesterName || "__none__"}
                        onValueChange={(val) => handleLinkRequester(u, val === "__none__" ? null : val)}
                      >
                        <SelectTrigger className="h-7 text-xs w-48">
                          <SelectValue placeholder="Link requester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No requester linked</SelectItem>
                          {getAvailableRequesters(u.orgId, u.userId).map(r => (
                            <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditNameUser(u); setEditName(u.displayName || ''); }}
                      className="gap-1"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditPermissions(u)} className="gap-1">
                      <Shield className="h-3 w-3" />
                      Permissions
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteUser(u)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-user-name">Name *</Label>
              <Input
                id="new-user-name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="User's display name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-user-email">Email *</Label>
              <Input
                id="new-user-email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Page Access</Label>
              <p className="text-sm text-muted-foreground">Select which pages this user can access</p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {PAGE_KEYS.map(page => (
                  <label key={page.key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedPages.includes(page.key)}
                      onCheckedChange={() => togglePage(page.key, selectedPages, setSelectedPages)}
                    />
                    <span className="text-sm">{page.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              The user must already have an account.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={adding || !newUserName.trim() || !newUserEmail.trim()}>
                {adding ? 'Adding...' : 'Add User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-none w-screen h-screen sm:rounded-none p-0 flex flex-col gap-0">
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
            <DialogTitle>Edit Permissions — {editUser?.displayName || 'User'}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-5xl space-y-4">
              <p className="text-sm text-muted-foreground">
                Toggle which pages this user can access. Some pages have additional permissions you can configure below the page name.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {PAGE_KEYS.map(page => {
                  const enabled = editPages.includes(page.key);
                  const pageExtras: { key: string; label: string; description?: string }[] = [];
                  if (page.key === 'requests') {
                    pageExtras.push({ key: 'view_all_requests', label: 'View All Requests', description: 'See requests created by other members.' });
                  }
                  if (page.key === 'assets') {
                    pageExtras.push({ key: 'view_all_workers', label: 'View All Workers & Vendor Accounts', description: 'See every worker in the organization, not just ones they created.' });
                  }
                  if (page.key === 'parts') {
                    pageExtras.push({ key: 'parts_prefer_dxf', label: 'Show DXF Drawing Instead of Image', description: 'Use the DXF preview as the default visual.' });
                  }

                  const showWorkerAccess = page.key === 'assets';

                  return (
                    <div
                      key={page.key}
                      className="rounded-lg border border-border bg-card p-4 space-y-3"
                    >
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={enabled}
                          onCheckedChange={() => togglePage(page.key, editPages, setEditPages)}
                        />
                        <span className="text-base font-semibold text-foreground">{page.label}</span>
                      </label>

                      {(pageExtras.length > 0 || showWorkerAccess) && (
                        <div className="pl-6 space-y-3 border-l-2 border-border">
                          {pageExtras.map(extra => (
                            <label key={extra.key} className="flex items-start gap-2 cursor-pointer">
                              <Checkbox
                                className="mt-0.5"
                                checked={editFeatures.includes(extra.key)}
                                onCheckedChange={() => {
                                  setEditFeatures(prev =>
                                    prev.includes(extra.key)
                                      ? prev.filter(f => f !== extra.key)
                                      : [...prev, extra.key]
                                  );
                                }}
                              />
                              <div className="space-y-0.5">
                                <span className="text-sm text-foreground">{extra.label}</span>
                                {extra.description && (
                                  <p className="text-xs text-muted-foreground">{extra.description}</p>
                                )}
                              </div>
                            </label>
                          ))}

                          {showWorkerAccess && (
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium text-foreground">Worker Access</p>
                                <p className="text-xs text-muted-foreground">
                                  Pick specific workers this user can view and edit (in addition to ones they create themselves).
                                </p>
                              </div>
                              {orgWorkers.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No other workers in this organization yet.</p>
                              ) : (
                                <>
                                  <Input
                                    placeholder="Search workers..."
                                    value={workerSearch}
                                    onChange={(e) => setWorkerSearch(e.target.value)}
                                    className="h-8"
                                  />
                                  <div className="max-h-56 overflow-y-auto border border-border rounded-md p-2 space-y-1 bg-muted/20">
                                    {orgWorkers
                                      .filter(w => !workerSearch.trim() || w.name.toLowerCase().includes(workerSearch.trim().toLowerCase()))
                                      .map(w => (
                                        <label key={w.id} className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-muted/50">
                                          <Checkbox
                                            checked={editWorkerIds.includes(w.id)}
                                            onCheckedChange={(c) => {
                                              setEditWorkerIds(prev =>
                                                c ? [...prev, w.id] : prev.filter(id => id !== w.id)
                                              );
                                            }}
                                          />
                                          <span className="text-sm">{w.name}</span>
                                        </label>
                                      ))}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSavePermissions} disabled={saving}>
              {saving ? 'Saving...' : 'Save Permissions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Name Dialog */}
      <Dialog open={!!editNameUser} onOpenChange={(open) => !open && setEditNameUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-user-name">Display Name</Label>
              <Input
                id="edit-user-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="User's display name"
              />
            </div>
            {editNameUser?.email && (
              <p className="text-sm text-muted-foreground">{editNameUser.email}</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditNameUser(null)}>Cancel</Button>
              <Button onClick={handleSaveName} disabled={savingName || !editName.trim()}>
                {savingName ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>


      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {deleteUser?.displayName || 'this user'} from the organization and clear their page permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
