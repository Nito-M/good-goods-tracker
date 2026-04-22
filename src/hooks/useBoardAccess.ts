import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ColumnPermission = 'edit' | 'view' | 'hidden';

export interface OrgMemberLite {
  user_id: string;
  display_name: string;
  email: string;
  role: string;
}

interface ColumnPermRow {
  column_id: string;
  user_id: string;
  permission: ColumnPermission;
}

interface MemberAccessRow {
  user_id: string;
  board_id: string;
}

/**
 * Hook for managing access to a single board:
 *   - which org members can see the board
 *   - per-column permission overrides per user
 *
 * Also exposes a `currentUserColumnPerms` map that BoardDetail uses
 * to enforce hidden/view-only columns client-side.
 */
export function useBoardAccess(boardId: string | undefined, organizationId: string | null | undefined) {
  const { user } = useAuth();
  const [members, setMembers] = useState<OrgMemberLite[]>([]);
  const [accessUserIds, setAccessUserIds] = useState<Set<string>>(new Set());
  const [columnPerms, setColumnPerms] = useState<ColumnPermRow[]>([]);
  const [boardOwnerId, setBoardOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);

    const [boardRes, accessRes, permsRes] = await Promise.all([
      supabase.from('boards').select('user_id, organization_id').eq('id', boardId).maybeSingle(),
      supabase.from('board_member_access').select('user_id, board_id').eq('board_id', boardId),
      supabase.from('board_column_permissions').select('column_id, user_id, permission').eq('board_id', boardId),
    ]);

    setBoardOwnerId(boardRes.data?.user_id ?? null);

    const orgId = boardRes.data?.organization_id ?? organizationId ?? null;
    let memberRows: OrgMemberLite[] = [];
    if (orgId) {
      const { data: orgMembers } = await supabase
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', orgId);
      const userIds = (orgMembers || []).map((m) => m.user_id);

      if (userIds.length > 0) {
        // Resolve display_name + email via edge function (RLS-safe)
        const { data: lookup } = await supabase.functions.invoke('lookup-users-by-ids', {
          body: { user_ids: userIds },
        });
        const profiles: Record<string, { display_name?: string; email?: string }> =
          (lookup?.users || []).reduce((acc: any, u: any) => {
            acc[u.id] = { display_name: u.display_name, email: u.email };
            return acc;
          }, {});
        memberRows = (orgMembers || []).map((m) => ({
          user_id: m.user_id,
          role: m.role,
          display_name: profiles[m.user_id]?.display_name || '',
          email: profiles[m.user_id]?.email || '',
        }));
      }
    }

    setMembers(memberRows);
    setAccessUserIds(new Set((accessRes.data || []).map((r: MemberAccessRow) => r.user_id)));
    setColumnPerms((permsRes.data || []) as ColumnPermRow[]);
    setLoading(false);
  }, [boardId, organizationId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const isOwnerOrAdmin = useCallback(
    (userId: string) => {
      if (userId === boardOwnerId) return true;
      const m = members.find((x) => x.user_id === userId);
      return m?.role === 'owner' || m?.role === 'admin';
    },
    [boardOwnerId, members]
  );

  const setMemberAccess = async (userId: string, hasAccess: boolean) => {
    if (!boardId) return;
    if (hasAccess) {
      setAccessUserIds((s) => new Set(s).add(userId));
      const { error } = await supabase
        .from('board_member_access')
        .upsert({ board_id: boardId, user_id: userId }, { onConflict: 'board_id,user_id' });
      if (error) {
        toast.error('Failed to grant access');
        await fetchAll();
      }
    } else {
      setAccessUserIds((s) => {
        const next = new Set(s);
        next.delete(userId);
        return next;
      });
      const { error } = await supabase
        .from('board_member_access')
        .delete()
        .eq('board_id', boardId)
        .eq('user_id', userId);
      if (error) {
        toast.error('Failed to revoke access');
        await fetchAll();
      }
    }
  };

  const setColumnPermission = async (
    columnId: string,
    userId: string,
    permission: ColumnPermission
  ) => {
    if (!boardId) return;
    setColumnPerms((cps) => {
      const next = cps.filter((p) => !(p.column_id === columnId && p.user_id === userId));
      if (permission !== 'edit') {
        next.push({ column_id: columnId, user_id: userId, permission });
      }
      return next;
    });

    if (permission === 'edit') {
      const { error } = await supabase
        .from('board_column_permissions')
        .delete()
        .eq('column_id', columnId)
        .eq('user_id', userId);
      if (error) {
        toast.error('Failed to update permission');
        await fetchAll();
      }
    } else {
      const { error } = await supabase
        .from('board_column_permissions')
        .upsert(
          { board_id: boardId, column_id: columnId, user_id: userId, permission },
          { onConflict: 'column_id,user_id' }
        );
      if (error) {
        toast.error('Failed to update permission');
        await fetchAll();
      }
    }
  };

  const getColumnPermission = useCallback(
    (columnId: string, userId: string): ColumnPermission => {
      if (isOwnerOrAdmin(userId)) return 'edit';
      const found = columnPerms.find((p) => p.column_id === columnId && p.user_id === userId);
      return found?.permission ?? 'edit';
    },
    [columnPerms, isOwnerOrAdmin]
  );

  // Permissions for the *current* logged-in user — used to enforce UI restrictions
  const currentUserColumnPerms = useCallback(
    (columnId: string): ColumnPermission => {
      if (!user) return 'edit';
      return getColumnPermission(columnId, user.id);
    },
    [user, getColumnPermission]
  );

  return {
    members,
    accessUserIds,
    boardOwnerId,
    loading,
    isOwnerOrAdmin,
    setMemberAccess,
    setColumnPermission,
    getColumnPermission,
    currentUserColumnPerms,
    refetch: fetchAll,
  };
}
