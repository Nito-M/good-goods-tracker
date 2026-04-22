import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useBoardRowNotes(rowIds: string[]) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (rowIds.length === 0) {
      setNotes({});
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('board_row_notes')
      .select('row_id, content')
      .in('row_id', rowIds);
    if (error) {
      toast.error('Failed to load notes');
    } else {
      const map: Record<string, string> = {};
      (data || []).forEach((n) => {
        map[n.row_id] = n.content;
      });
      setNotes(map);
    }
    setLoading(false);
  }, [rowIds.join(',')]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getNote = useCallback((row_id: string) => notes[row_id] || '', [notes]);

  const saveNote = async (row_id: string, content: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      toast.error('Not authenticated');
      return;
    }

    setNotes((n) => ({ ...n, [row_id]: content }));

    const { error } = await supabase
      .from('board_row_notes')
      .upsert(
        { row_id, content, user_id: userId },
        { onConflict: 'row_id' }
      );
    if (error) {
      toast.error('Failed to save note');
      await fetchAll();
    }
  };

  return { notes, loading, getNote, saveNote };
}
