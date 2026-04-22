import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RowNoteEntry {
  id: string;
  row_id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  image_path: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

const BUCKET = 'board-files';
const SIGNED_TTL = 60 * 60 * 24 * 365; // 1 year

export function useBoardRowNoteEntries(rowIds: string[]) {
  const [entries, setEntries] = useState<RowNoteEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (rowIds.length === 0) {
      setEntries([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('board_row_note_entries')
      .select('*')
      .in('row_id', rowIds)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) {
      toast.error('Failed to load notes');
    } else {
      setEntries((data as RowNoteEntry[]) || []);
    }
    setLoading(false);
  }, [rowIds.join(',')]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getEntries = useCallback(
    (row_id: string) => entries.filter((e) => e.row_id === row_id),
    [entries]
  );

  const getCount = useCallback(
    (row_id: string) => entries.filter((e) => e.row_id === row_id).length,
    [entries]
  );

  const addEntry = async (
    row_id: string,
    content: string,
    imageFile: File | null
  ): Promise<RowNoteEntry | null> => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      toast.error('Not authenticated');
      return null;
    }

    let image_url: string | null = null;
    let image_path: string | null = null;

    if (imageFile) {
      if (imageFile.size > 10 * 1024 * 1024) {
        toast.error('Image too large (max 10MB)');
        return null;
      }
      const safeName = imageFile.name.replace(/[^\w.\-]+/g, '_');
      const path = `${userId}/${row_id}/notes/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, imageFile, {
          contentType: imageFile.type || 'image/jpeg',
        });
      if (upErr) {
        toast.error('Image upload failed');
        return null;
      }
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_TTL);
      image_url = signed?.signedUrl || null;
      image_path = path;
    }

    const maxPos = entries
      .filter((e) => e.row_id === row_id)
      .reduce((m, e) => Math.max(m, e.position), -1);

    const { data, error } = await supabase
      .from('board_row_note_entries')
      .insert({
        row_id,
        user_id: userId,
        content,
        image_url,
        image_path,
        position: maxPos + 1,
      })
      .select()
      .single();

    if (error || !data) {
      toast.error('Failed to add note');
      if (image_path) await supabase.storage.from(BUCKET).remove([image_path]);
      return null;
    }
    setEntries((es) => [...es, data as RowNoteEntry]);
    return data as RowNoteEntry;
  };

  const updateEntry = async (id: string, content: string) => {
    setEntries((es) => es.map((e) => (e.id === id ? { ...e, content } : e)));
    const { error } = await supabase
      .from('board_row_note_entries')
      .update({ content })
      .eq('id', id);
    if (error) {
      toast.error('Failed to update note');
      await fetchAll();
    }
  };

  const deleteEntry = async (id: string) => {
    const target = entries.find((e) => e.id === id);
    if (!target) return;
    setEntries((es) => es.filter((e) => e.id !== id));
    if (target.image_path) {
      await supabase.storage.from(BUCKET).remove([target.image_path]);
    }
    const { error } = await supabase
      .from('board_row_note_entries')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error('Failed to delete note');
      await fetchAll();
    }
  };

  const refreshImageUrl = async (id: string): Promise<string | null> => {
    const target = entries.find((e) => e.id === id);
    if (!target?.image_path) return null;
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(target.image_path, 60 * 60);
    return data?.signedUrl || null;
  };

  return {
    entries,
    loading,
    getEntries,
    getCount,
    addEntry,
    updateEntry,
    deleteEntry,
    refreshImageUrl,
  };
}
