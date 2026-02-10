import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Job, JobItem } from '@/types/job';

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchJobs = useCallback(async () => {
    if (!user) { setJobs([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading jobs:', error);
      toast({ title: 'Error loading jobs', variant: 'destructive' });
    } else {
      setJobs((data || []).map(d => ({
        id: d.id,
        jobNumber: d.job_number,
        title: d.title,
        description: d.description,
        status: d.status,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      })));
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const createJob = async (title: string, description?: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('jobs')
      .insert({ title, description: description || null, user_id: user.id })
      .select()
      .single();
    if (error) {
      toast({ title: 'Error creating job', description: error.message, variant: 'destructive' });
      return null;
    }
    await fetchJobs();
    toast({ title: 'Job created successfully' });
    return data;
  };

  const updateJob = async (id: string, updates: { title?: string; description?: string; status?: string }) => {
    const { error } = await supabase.from('jobs').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Error updating job', variant: 'destructive' });
      return false;
    }
    await fetchJobs();
    toast({ title: 'Job updated' });
    return true;
  };

  const deleteJob = async (id: string) => {
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting job', variant: 'destructive' });
      return false;
    }
    await fetchJobs();
    toast({ title: 'Job deleted' });
    return true;
  };

  return { jobs, loading, createJob, updateJob, deleteJob, refetch: fetchJobs };
}

export function useJobItems(jobId: string | null) {
  const [items, setItems] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (!jobId) { setItems([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('job_items')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error loading job items:', error);
    } else {
      setItems((data || []).map(d => ({
        id: d.id,
        jobId: d.job_id,
        inventoryItemId: d.inventory_item_id,
        itemName: d.item_name,
        sku: d.sku,
        quantity: d.quantity,
        unitPrice: Number(d.unit_price),
        notes: d.notes,
        createdAt: d.created_at,
      })));
    }
    setLoading(false);
  }, [jobId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = async (item: { inventoryItemId?: string | null; itemName: string; sku: string; quantity: number; unitPrice: number; notes?: string }) => {
    if (!jobId) return false;
    const { error } = await supabase.from('job_items').insert({
      job_id: jobId,
      inventory_item_id: item.inventoryItemId || null,
      item_name: item.itemName,
      sku: item.sku,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      notes: item.notes || null,
    });
    if (error) {
      toast({ title: 'Error adding item', variant: 'destructive' });
      return false;
    }
    await fetchItems();
    return true;
  };

  const updateItem = async (id: string, updates: { quantity?: number; unitPrice?: number; notes?: string }) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.unitPrice !== undefined) dbUpdates.unit_price = updates.unitPrice;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    const { error } = await supabase.from('job_items').update(dbUpdates).eq('id', id);
    if (error) {
      toast({ title: 'Error updating item', variant: 'destructive' });
      return false;
    }
    await fetchItems();
    return true;
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from('job_items').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error removing item', variant: 'destructive' });
      return false;
    }
    await fetchItems();
    return true;
  };

  return { items, loading, addItem, updateItem, removeItem, refetch: fetchItems };
}
