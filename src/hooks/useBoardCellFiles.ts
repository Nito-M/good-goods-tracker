import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BoardCellFile {
  id: string;
  row_id: string;
  column_id: string;
  file_url: string;
  file_name: string;
  file_size: number | null;
  storage_path: string;
  user_id: string;
  created_at: string;
}

const BUCKET = 'board-files';

export function useBoardCellFiles(rowIds: string[]) {
  const [files, setFiles] = useState<BoardCellFile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (rowIds.length === 0) {
      setFiles([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('board_cell_files')
      .select('*')
      .in('row_id', rowIds)
      .order('created_at', { ascending: true });
    if (error) {
      toast.error('Failed to load files');
    } else {
      setFiles(data || []);
    }
    setLoading(false);
  }, [rowIds.join(',')]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getFiles = useCallback(
    (row_id: string, column_id: string) =>
      files.filter((f) => f.row_id === row_id && f.column_id === column_id),
    [files]
  );

  const uploadFile = async (row_id: string, column_id: string, file: File) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      toast.error('Not authenticated');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large (max 20MB)');
      return;
    }

    const path = `${userId}/${row_id}/${column_id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || 'application/pdf',
    });
    if (upErr) {
      toast.error('Upload failed');
      return;
    }

    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
    const file_url = signed?.signedUrl || '';

    const { data, error } = await supabase
      .from('board_cell_files')
      .insert({
        row_id,
        column_id,
        file_url,
        file_name: file.name,
        file_size: file.size,
        storage_path: path,
        user_id: userId,
      })
      .select()
      .single();

    if (error || !data) {
      toast.error('Failed to save file');
      await supabase.storage.from(BUCKET).remove([path]);
      return;
    }
    setFiles((fs) => [...fs, data]);
  };

  const deleteFile = async (id: string) => {
    const target = files.find((f) => f.id === id);
    if (!target) return;
    setFiles((fs) => fs.filter((f) => f.id !== id));
    await supabase.storage.from(BUCKET).remove([target.storage_path]);
    const { error } = await supabase.from('board_cell_files').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete file');
      await fetchAll();
    }
  };

  const refreshSignedUrl = async (id: string): Promise<string | null> => {
    const target = files.find((f) => f.id === id);
    if (!target) return null;
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(target.storage_path, 60 * 60);
    return data?.signedUrl || null;
  };

  return { files, loading, getFiles, uploadFile, deleteFile, refreshSignedUrl };
}
