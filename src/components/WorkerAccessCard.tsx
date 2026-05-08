import { useEffect, useState } from 'react';
import { Shield, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface Member {
  user_id: string;
  display_name: string | null;
  role: string;
}

interface Props {
  workerId: string;
  workerOwnerId: string;
}

export function WorkerAccessCard({ workerId, workerOwnerId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [canManage, setCanManage] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [grantedIds, setGrantedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      // Find orgs that the worker owner belongs to where current user is admin/owner
      const { data: ownerOrgs } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', workerOwnerId);
      const ownerOrgIds = (ownerOrgs || []).map((r: any) => r.organization_id);
      if (ownerOrgIds.length === 0) { setCanManage(false); setLoading(false); return; }

      const { data: myAdminOrgs } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin'])
        .in('organization_id', ownerOrgIds);
      const sharedOrgIds = (myAdminOrgs || []).map((r: any) => r.organization_id);
      if (sharedOrgIds.length === 0) { setCanManage(false); setLoading(false); return; }

      setCanManage(true);

      // Load all members in those orgs (excluding the current admin and worker owner)
      const { data: allMembers } = await supabase
        .from('organization_members')
        .select('user_id, role')
        .in('organization_id', sharedOrgIds);
      const uniqueIds = Array.from(new Set((allMembers || [])
        .map((m: any) => m.user_id)
        .filter((uid: string) => uid !== user.id && uid !== workerOwnerId)));

      let profiles: any[] = [];
      if (uniqueIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', uniqueIds);
        profiles = data || [];
      }
      const memberList: Member[] = uniqueIds.map((uid) => {
        const m = (allMembers || []).find((x: any) => x.user_id === uid);
        const p = profiles.find((x: any) => x.user_id === uid);
        return {
          user_id: uid,
          display_name: p?.display_name || null,
          role: m?.role || 'member',
        };
      }).filter(m => m.role === 'member')
        .sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));
      setMembers(memberList);

      const { data: grants } = await supabase
        .from('worker_access_grants')
        .select('user_id')
        .eq('worker_id', workerId);
      setGrantedIds(new Set((grants || []).map((g: any) => g.user_id)));
      setLoading(false);
    };
    load();
  }, [user, workerId, workerOwnerId]);

  const toggleGrant = async (userId: string, checked: boolean) => {
    const prev = new Set(grantedIds);
    const next = new Set(grantedIds);
    if (checked) next.add(userId); else next.delete(userId);
    setGrantedIds(next);

    if (checked) {
      const { error } = await supabase.from('worker_access_grants').insert({
        worker_id: workerId,
        user_id: userId,
        granted_by: user?.id,
      });
      if (error) {
        setGrantedIds(prev);
        toast({ title: 'Failed to grant access', description: error.message, variant: 'destructive' });
      }
    } else {
      const { error } = await supabase
        .from('worker_access_grants')
        .delete()
        .eq('worker_id', workerId)
        .eq('user_id', userId);
      if (error) {
        setGrantedIds(prev);
        toast({ title: 'Failed to revoke access', description: error.message, variant: 'destructive' });
      }
    }
  };

  if (loading || !canManage) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Member Access</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Pick which non-admin members can view and edit this worker's info, vendor accounts, and files.
        </p>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members to grant access to.</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <label
                key={m.user_id}
                className="flex items-center gap-3 rounded-md border border-border bg-muted/20 px-3 py-2 cursor-pointer hover:bg-muted/40"
              >
                <Checkbox
                  checked={grantedIds.has(m.user_id)}
                  onCheckedChange={(c) => toggleGrant(m.user_id, !!c)}
                />
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{m.display_name || 'Unknown'}</span>
              </label>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
