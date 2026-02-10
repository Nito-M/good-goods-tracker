import { useState, useEffect } from 'react';
import { Plus, Trash2, Building2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface Organization {
  id: string;
  name: string;
  created_at: string;
}

interface OrgMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'member';
  display_name?: string | null;
  email?: string | null;
}

export function OrganizationsSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Create org dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [creating, setCreating] = useState(false);

  // Add admin dialog
  const [addAdminDialogOpen, setAddAdminDialogOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  // Delete confirmation
  const [deleteOrgId, setDeleteOrgId] = useState<string | null>(null);

  // Members per org
  const [orgMembers, setOrgMembers] = useState<Record<string, OrgMember[]>>({});

  const fetchOrganizations = async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching organizations:', error);
      return;
    }
    setOrganizations(data || []);

    // Fetch members for each org
    if (data && data.length > 0) {
      const membersMap: Record<string, OrgMember[]> = {};
      for (const org of data) {
        const { data: members } = await supabase
          .from('organization_members')
          .select('*')
          .eq('organization_id', org.id);

        if (members && members.length > 0) {
          // Get profile info for each member
          const userIds = members.map(m => m.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, display_name')
            .in('user_id', userIds);

          membersMap[org.id] = members.map(m => ({
            ...m,
            role: m.role as 'owner' | 'admin' | 'member',
            display_name: profiles?.find(p => p.user_id === m.user_id)?.display_name,
          }));
        } else {
          membersMap[org.id] = [];
        }
      }
      setOrgMembers(membersMap);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setCreating(true);

    try {
      const { error } = await supabase
        .from('organizations')
        .insert({ name: newOrgName.trim() });

      if (error) throw error;

      toast({ title: 'Organization created', description: `"${newOrgName.trim()}" has been created.` });
      setNewOrgName('');
      setCreateDialogOpen(false);
      await fetchOrganizations();
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast({ title: 'Error', description: 'Failed to create organization.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!deleteOrgId) return;
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', deleteOrgId);

      if (error) throw error;

      toast({ title: 'Organization deleted' });
      setDeleteOrgId(null);
      await fetchOrganizations();
    } catch (error: any) {
      console.error('Error deleting organization:', error);
      toast({ title: 'Error', description: 'Failed to delete organization.', variant: 'destructive' });
    }
  };

  const openAddAdminDialog = (orgId: string) => {
    setSelectedOrgId(orgId);
    setAdminName('');
    setAdminEmail('');
    setAddAdminDialogOpen(true);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId || !adminEmail.trim() || !adminName.trim()) return;
    setAddingAdmin(true);

    try {
      // Look up user by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .limit(100);

      if (profileError) throw profileError;

      // We need to find the user by email via auth - but we can't query auth.users directly
      // Instead, look up via the admin's ability to list users
      // For now, we'll check if there's already a user with this email by attempting to find them
      // through their profile display name or by checking auth metadata

      // Look up user by email via edge function
      const { data: lookupData, error: lookupError } = await supabase.functions.invoke('lookup-user-by-email', {
        body: { email: adminEmail.trim() },
      });

      let targetUserId: string | null = lookupData?.user_id || null;

      if (lookupError || !targetUserId) {
        toast({
          title: 'User not found',
          description: `No user found with email "${adminEmail}". They must have an account first.`,
          variant: 'destructive',
        });
        setAddingAdmin(false);
        return;
      }

      // Check if already a member
      const existingMembers = orgMembers[selectedOrgId] || [];
      if (existingMembers.some(m => m.user_id === targetUserId)) {
        toast({
          title: 'Already a member',
          description: 'This user is already a member of this organization.',
          variant: 'destructive',
        });
        setAddingAdmin(false);
        return;
      }

      // Update display name if provided
      if (adminName.trim()) {
        await supabase
          .from('profiles')
          .update({ display_name: adminName.trim() })
          .eq('user_id', targetUserId);
      }

      // Add as org admin
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: selectedOrgId,
          user_id: targetUserId,
          role: 'admin',
        });

      if (memberError) throw memberError;

      toast({
        title: 'Admin added',
        description: `${adminName.trim()} has been added as an organization admin.`,
      });
      setAddAdminDialogOpen(false);
      await fetchOrganizations();
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast({
        title: 'Error',
        description: 'Failed to add admin. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveMember = async (orgId: string, memberId: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({ title: 'Member removed' });
      await fetchOrganizations();
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({ title: 'Error', description: 'Failed to remove member.', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="text-muted-foreground py-8 text-center">Loading organizations...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organizations
            </CardTitle>
            <CardDescription>Create and manage organizations and their admins</CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Organization
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {organizations.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              No organizations yet. Create your first organization to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {organizations.map((org) => (
                <Card key={org.id} className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAddAdminDialog(org.id)}
                          className="gap-1"
                        >
                          <UserPlus className="h-4 w-4" />
                          Add Admin
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => setDeleteOrgId(org.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(orgMembers[org.id] || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No members yet.</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Members</p>
                        {(orgMembers[org.id] || []).map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                          >
                            <div>
                              <span className="font-medium">
                                {member.display_name || 'Unknown'}
                              </span>
                              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                                {member.role}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMember(org.id, member.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Organization Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name *</Label>
              <Input
                id="org-name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Enter organization name"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !newOrgName.trim()}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={addAdminDialogOpen} onOpenChange={setAddAdminDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Organization Admin</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Name *</Label>
              <Input
                id="admin-name"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Admin's display name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email *</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <p className="text-sm text-muted-foreground">
              The user must already have an account. They will be granted admin access to this organization.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddAdminDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addingAdmin || !adminName.trim() || !adminEmail.trim()}>
                {addingAdmin ? 'Adding...' : 'Add Admin'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Organization Confirmation */}
      <AlertDialog open={!!deleteOrgId} onOpenChange={() => setDeleteOrgId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the organization and remove all its members.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrg}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
