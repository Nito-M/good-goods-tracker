import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Worker {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  address: string | null;
  start_date: string | null;
  hourly_rate: number | null;
  status: string;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkerFile {
  id: string;
  worker_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
  signed_url?: string;
}

export function useWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchWorkers = useCallback(async () => {
    if (!user) {
      setWorkers([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .order('name');
    if (error) {
      console.error('fetch workers', error);
    } else {
      setWorkers((data || []) as Worker[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const addWorker = async (data: Partial<Worker>) => {
    if (!user) return null;
    const { data: row, error } = await supabase
      .from('workers')
      .insert({
        user_id: user.id,
        name: data.name || 'Untitled',
        email: data.email || null,
        phone: data.phone || null,
        job_title: data.job_title || null,
        address: data.address || null,
        start_date: data.start_date || null,
        hourly_rate: data.hourly_rate ?? null,
        status: data.status || 'active',
        notes: data.notes || null,
        photo_url: data.photo_url || null,
      })
      .select()
      .single();
    if (error) {
      toast({ title: 'Error adding worker', description: error.message, variant: 'destructive' });
      return null;
    }
    toast({ title: 'Worker added' });
    await fetchWorkers();
    return row as Worker;
  };

  const updateWorker = async (id: string, data: Partial<Worker>) => {
    const update: Record<string, unknown> = {};
    for (const k of ['name','email','phone','job_title','address','start_date','hourly_rate','status','notes','photo_url'] as const) {
      if (data[k] !== undefined) update[k] = data[k];
    }
    const { error } = await supabase.from('workers').update(update).eq('id', id);
    if (error) {
      toast({ title: 'Error updating worker', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Worker updated' });
    await fetchWorkers();
  };

  const deleteWorker = async (id: string) => {
    const { error } = await supabase.from('workers').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting worker', variant: 'destructive' });
      return;
    }
    toast({ title: 'Worker deleted' });
    await fetchWorkers();
  };

  const uploadWorkerPhoto = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/photos/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('worker-files').upload(path, file);
    if (error) {
      toast({ title: 'Photo upload failed', description: error.message, variant: 'destructive' });
      return null;
    }
    const { data } = await supabase.storage.from('worker-files').createSignedUrl(path, 60 * 60 * 24 * 365);
    return data?.signedUrl || null;
  };

  return { workers, loading, addWorker, updateWorker, deleteWorker, uploadWorkerPhoto, refetch: fetchWorkers };
}

export function useWorkerFiles(workerId: string | null) {
  const [files, setFiles] = useState<WorkerFile[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFiles = useCallback(async () => {
    if (!workerId) { setFiles([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('worker_files')
      .select('*')
      .eq('worker_id', workerId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('fetch worker files', error);
      setLoading(false);
      return;
    }
    const withUrls = await Promise.all(
      (data || []).map(async (f: any) => {
        const { data: signed } = await supabase.storage
          .from('worker-files')
          .createSignedUrl(f.file_path, 60 * 60);
        return { ...f, signed_url: signed?.signedUrl } as WorkerFile;
      })
    );
    setFiles(withUrls);
    setLoading(false);
  }, [workerId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = async (file: File) => {
    if (!user || !workerId) return;
    const path = `${user.id}/${workerId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('worker-files').upload(path, file);
    if (upErr) {
      toast({ title: 'Upload failed', description: upErr.message, variant: 'destructive' });
      return;
    }
    const { error: insErr } = await supabase.from('worker_files').insert({
      worker_id: workerId,
      user_id: user.id,
      file_name: file.name,
      file_path: path,
      file_type: file.type,
      file_size: file.size,
    });
    if (insErr) {
      toast({ title: 'Failed to save file', variant: 'destructive' });
      return;
    }
    await fetchFiles();
  };

  const deleteFile = async (file: WorkerFile) => {
    await supabase.storage.from('worker-files').remove([file.file_path]);
    await supabase.from('worker_files').delete().eq('id', file.id);
    await fetchFiles();
  };

  return { files, loading, uploadFile, deleteFile, refetch: fetchFiles };
}
