import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface WorkerVendor {
  id: string;
  worker_id: string;
  user_id: string;
  vendor_name: string | null;
  vendor_username: string | null;
  vendor_email: string | null;
  vendor_password: string | null;
  vendor_link: string | null;
  vendor_notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useWorkerVendors(workerId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vendors, setVendors] = useState<WorkerVendor[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVendors = useCallback(async () => {
    if (!workerId) { setVendors([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('worker_vendors')
      .select('*')
      .eq('worker_id', workerId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (!error && data) setVendors(data as WorkerVendor[]);
    setLoading(false);
  }, [workerId]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const addVendor = async (data: Partial<WorkerVendor>) => {
    if (!workerId || !user) return null;
    const { data: row, error } = await supabase
      .from('worker_vendors')
      .insert({
        worker_id: workerId,
        user_id: user.id,
        vendor_name: data.vendor_name || null,
        vendor_username: data.vendor_username || null,
        vendor_email: data.vendor_email || null,
        vendor_password: data.vendor_password || null,
        vendor_link: data.vendor_link || null,
        vendor_notes: data.vendor_notes || null,
        sort_order: vendors.length,
      })
      .select()
      .single();
    if (error) { toast({ title: 'Error adding vendor', description: error.message, variant: 'destructive' }); return null; }
    setVendors((v) => [...v, row as WorkerVendor]);
    return row as WorkerVendor;
  };

  const updateVendor = async (id: string, data: Partial<WorkerVendor>) => {
    const { error } = await supabase.from('worker_vendors').update(data).eq('id', id);
    if (error) { toast({ title: 'Error updating vendor', description: error.message, variant: 'destructive' }); return; }
    setVendors((v) => v.map((x) => x.id === id ? { ...x, ...data } as WorkerVendor : x));
  };

  const deleteVendor = async (id: string) => {
    const { error } = await supabase.from('worker_vendors').delete().eq('id', id);
    if (error) { toast({ title: 'Error deleting vendor', description: error.message, variant: 'destructive' }); return; }
    setVendors((v) => v.filter((x) => x.id !== id));
  };

  return { vendors, loading, addVendor, updateVendor, deleteVendor, refetch: fetchVendors };
}
