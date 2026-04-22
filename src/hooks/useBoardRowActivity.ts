import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RowActivityEntry {
  id: string;
  row_id: string;
  column_id: string | null;
  user_id: string;
  action: string; // 'cell_changed' | 'note_added' | 'note_updated' | 'note_deleted'
  column_name: string | null;
  column_type: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export function useBoardRowActivity(rowIds: string[]) {
  const [activity, setActivity] = useState<RowActivityEntry[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  const fetchAll = useCallback(async () => {
    if (rowIds.length === 0) {
      setActivity([]);
      return;
    }
    const { data } = await supabase
      .from('board_row_activity')
      .select('*')
      .in('row_id', rowIds)
      .order('created_at', { ascending: false })
      .limit(500);
    const list = (data as RowActivityEntry[]) || [];
    setActivity(list);

    // Resolve display names for unique user_ids
    const uniqueIds = Array.from(new Set(list.map((e) => e.user_id)));
    const missing = uniqueIds.filter((id) => !userNames[id]);
    if (missing.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', missing);
      if (profs) {
        setUserNames((prev) => {
          const next = { ...prev };
          profs.forEach((p: any) => {
            next[p.user_id] = p.display_name || 'User';
          });
          return next;
        });
      }
    }
  }, [rowIds.join(',')]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getActivity = useCallback(
    (row_id: string) => activity.filter((e) => e.row_id === row_id),
    [activity]
  );

  const logActivity = async (entry: {
    row_id: string;
    column_id?: string | null;
    action: string;
    column_name?: string | null;
    column_type?: string | null;
    old_value?: string | null;
    new_value?: string | null;
  }) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    const { data } = await supabase
      .from('board_row_activity')
      .insert({
        row_id: entry.row_id,
        column_id: entry.column_id ?? null,
        user_id: userId,
        action: entry.action,
        column_name: entry.column_name ?? null,
        column_type: entry.column_type ?? null,
        old_value: entry.old_value ?? null,
        new_value: entry.new_value ?? null,
      })
      .select()
      .single();
    if (data) setActivity((a) => [data as RowActivityEntry, ...a]);
  };

  return { activity, getActivity, logActivity, userNames, refetch: fetchAll };
}
