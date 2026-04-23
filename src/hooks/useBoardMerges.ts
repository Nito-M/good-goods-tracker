import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BoardMerge {
  id: string;
  board_id: string;
  start_row_id: string;
  end_row_id: string;
  start_column_id: string;
  end_column_id: string;
}

export function useBoardMerges(boardId: string | undefined) {
  const [merges, setMerges] = useState<BoardMerge[]>([]);

  const fetchMerges = useCallback(async () => {
    if (!boardId) return;
    const { data, error } = await supabase
      .from('board_merges')
      .select('id, board_id, start_row_id, end_row_id, start_column_id, end_column_id')
      .eq('board_id', boardId);
    if (error) {
      console.error('Failed to load merges', error);
      return;
    }
    setMerges(data || []);
  }, [boardId]);

  useEffect(() => {
    fetchMerges();
  }, [fetchMerges]);

  const createMerge = useCallback(
    async (m: Omit<BoardMerge, 'id'>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error('Not signed in');
        return;
      }

      // Remove any existing merges that overlap the new rectangle (by id list — caller filters first if needed).
      // Here we just insert; overlap removal happens in caller.

      const { data, error } = await supabase
        .from('board_merges')
        .insert({ ...m, user_id: userData.user.id })
        .select()
        .single();
      if (error || !data) {
        toast.error('Failed to merge cells');
        return;
      }
      setMerges((prev) => [...prev, data]);
    },
    []
  );

  const deleteMerge = useCallback(async (id: string) => {
    setMerges((prev) => prev.filter((m) => m.id !== id));
    const { error } = await supabase.from('board_merges').delete().eq('id', id);
    if (error) {
      toast.error('Failed to unmerge');
      await fetchMerges();
    }
  }, [fetchMerges]);

  const deleteMerges = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    setMerges((prev) => prev.filter((m) => !ids.includes(m.id)));
    const { error } = await supabase.from('board_merges').delete().in('id', ids);
    if (error) {
      toast.error('Failed to unmerge');
      await fetchMerges();
    }
  }, [fetchMerges]);

  return { merges, createMerge, deleteMerge, deleteMerges, refetch: fetchMerges };
}
