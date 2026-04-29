import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CustomerFile {
  id: string;
  customer_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export function useCustomerFiles(customerId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<CustomerFile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (!customerId) {
      setFiles([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('customer_files')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading customer files:', error);
    } else {
      setFiles((data as CustomerFile[]) || []);
    }
    setLoading(false);
  }, [customerId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const upload = async (file: File) => {
    if (!user || !customerId) return;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${customerId}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('customer-files')
      .upload(path, file, { upsert: false, contentType: file.type });
    if (upErr) {
      toast({ title: 'Upload failed', description: upErr.message, variant: 'destructive' });
      return;
    }
    const { error: insErr } = await supabase.from('customer_files').insert([{
      customer_id: customerId,
      user_id: user.id,
      file_name: file.name,
      file_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
    }]);
    if (insErr) {
      toast({ title: 'Error saving file record', description: insErr.message, variant: 'destructive' });
      return;
    }
    await fetchFiles();
  };

  const remove = async (id: string) => {
    const target = files.find((f) => f.id === id);
    if (!target) return;
    await supabase.storage.from('customer-files').remove([target.file_path]);
    const { error } = await supabase.from('customer_files').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting file', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchFiles();
  };

  const getSignedUrl = async (id: string): Promise<string | null> => {
    const target = files.find((f) => f.id === id);
    if (!target) return null;
    const { data, error } = await supabase.storage
      .from('customer-files')
      .createSignedUrl(target.file_path, 60 * 60);
    if (error) {
      toast({ title: 'Error opening file', description: error.message, variant: 'destructive' });
      return null;
    }
    return data?.signedUrl || null;
  };

  return { files, loading, upload, remove, getSignedUrl, refetch: fetchFiles };
}
