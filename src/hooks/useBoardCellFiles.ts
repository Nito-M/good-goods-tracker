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
  display_order: number;
  caption: string | null;
}

const BUCKET = 'board-files';

export function useBoardCellFiles(rowIds: string[]) {
  const [files, setFiles] = useState<BoardCellFile[]>([]);
  const [loading, setLoading] = useState(false);
  // Per-cell upload progress: key = `${row_id}::${column_id}`, value = list of in-flight uploads
  const [uploads, setUploads] = useState<Record<string, { id: string; name: string; progress: number }[]>>({});

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
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) {
      toast.error('Failed to load files');
    } else {
      setFiles((data || []) as BoardCellFile[]);
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

  const getUploads = useCallback(
    (row_id: string, column_id: string) => uploads[`${row_id}::${column_id}`] || [],
    [uploads]
  );

  const isImage = (file: File) => {
    const t = (file.type || '').toLowerCase();
    return t.startsWith('image/') || /\.(heic|heif)$/i.test(file.name);
  };

  const isHeic = (file: File) =>
    /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);

  /** Convert HEIC -> JPEG; compress large images to a reasonable max dimension. */
  const prepareImage = async (file: File): Promise<File> => {
    let working = file;
    if (isHeic(file)) {
      try {
        const heic2any = (await import('heic2any')).default as any;
        const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
        const single = Array.isArray(blob) ? blob[0] : blob;
        working = new File([single], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
          type: 'image/jpeg',
        });
      } catch (e) {
        console.warn('HEIC conversion failed, uploading original', e);
      }
    }
    // Only compress if reasonably large
    if (working.size > 600 * 1024) {
      try {
        const { default: imageCompression } = await import('browser-image-compression');
        const compressed = await imageCompression(working, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 2400,
          useWebWorker: true,
          initialQuality: 0.85,
        });
        if (compressed.size < working.size) {
          working = new File([compressed], working.name, { type: compressed.type || working.type });
        }
      } catch (e) {
        console.warn('Image compression failed, uploading original', e);
      }
    }
    return working;
  };

  const setUploadProgress = (cellKey: string, id: string, progress: number) => {
    setUploads((u) => {
      const list = u[cellKey] || [];
      return { ...u, [cellKey]: list.map((x) => (x.id === id ? { ...x, progress } : x)) };
    });
  };

  const addUpload = (cellKey: string, name: string) => {
    const id = crypto.randomUUID();
    setUploads((u) => ({ ...u, [cellKey]: [...(u[cellKey] || []), { id, name, progress: 5 }] }));
    return id;
  };

  const removeUpload = (cellKey: string, id: string) => {
    setUploads((u) => ({ ...u, [cellKey]: (u[cellKey] || []).filter((x) => x.id !== id) }));
  };

  const uploadFile = async (row_id: string, column_id: string, file: File) => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      toast.error('Not authenticated');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('File too large (max 25MB before compression)');
      return;
    }

    const cellKey = `${row_id}::${column_id}`;
    const uploadId = addUpload(cellKey, file.name);

    try {
      let prepared = file;
      if (isImage(file)) {
        setUploadProgress(cellKey, uploadId, 15);
        prepared = await prepareImage(file);
      }
      setUploadProgress(cellKey, uploadId, 45);

      const path = `${userId}/${row_id}/${column_id}/${Date.now()}-${prepared.name}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, prepared, {
        contentType: prepared.type || 'application/octet-stream',
      });
      if (upErr) throw upErr;

      setUploadProgress(cellKey, uploadId, 80);

      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      const file_url = signed?.signedUrl || '';

      const existing = files.filter((f) => f.row_id === row_id && f.column_id === column_id);
      const nextOrder = existing.length
        ? Math.max(...existing.map((f) => f.display_order ?? 0)) + 1
        : 0;

      const { data, error } = await supabase
        .from('board_cell_files')
        .insert({
          row_id,
          column_id,
          file_url,
          file_name: prepared.name,
          file_size: prepared.size,
          storage_path: path,
          user_id: userId,
          display_order: nextOrder,
        })
        .select()
        .single();

      if (error || !data) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw error || new Error('insert failed');
      }
      setFiles((fs) => [...fs, data as BoardCellFile]);
      setUploadProgress(cellKey, uploadId, 100);
    } catch (e: any) {
      console.error(e);
      toast.error('Upload failed');
    } finally {
      setTimeout(() => removeUpload(cellKey, uploadId), 400);
    }
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

  const updateCaption = async (id: string, caption: string) => {
    setFiles((fs) => fs.map((f) => (f.id === id ? { ...f, caption } : f)));
    const { error } = await supabase
      .from('board_cell_files')
      .update({ caption })
      .eq('id', id);
    if (error) {
      toast.error('Failed to save caption');
      await fetchAll();
    }
  };

  /** Persist a new ordering for one cell's files. `orderedIds` is the new id sequence. */
  const reorderFiles = async (row_id: string, column_id: string, orderedIds: string[]) => {
    setFiles((fs) => {
      const byId = new Map(fs.map((f) => [f.id, f]));
      const updated = orderedIds
        .map((id, idx) => {
          const f = byId.get(id);
          return f ? { ...f, display_order: idx } : null;
        })
        .filter(Boolean) as BoardCellFile[];
      const others = fs.filter(
        (f) => !(f.row_id === row_id && f.column_id === column_id)
      );
      return [...others, ...updated];
    });
    await Promise.all(
      orderedIds.map((id, idx) =>
        supabase.from('board_cell_files').update({ display_order: idx }).eq('id', id)
      )
    );
  };

  return {
    files,
    loading,
    getFiles,
    getUploads,
    uploadFile,
    deleteFile,
    refreshSignedUrl,
    updateCaption,
    reorderFiles,
  };
}
