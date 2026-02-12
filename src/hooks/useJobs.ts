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
      .order('display_order', { ascending: true });
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
        displayOrder: d.display_order,
        customerName: d.customer_name,
        customerEmail: d.customer_email,
        customerPhone: d.customer_phone,
        customerAddress: d.customer_address,
        dueDate: d.due_date,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      })));
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const createJob = async (title: string, description?: string, status?: string, customer?: { name?: string; email?: string; phone?: string; address?: string }, dueDate?: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        title,
        description: description || null,
        user_id: user.id,
        status: status || 'open',
        customer_name: customer?.name || null,
        customer_email: customer?.email || null,
        customer_phone: customer?.phone || null,
        customer_address: customer?.address || null,
        due_date: dueDate || null,
      })
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

  const updateJob = async (id: string, updates: { title?: string; description?: string; status?: string; job_number?: string; customer_name?: string | null; customer_email?: string | null; customer_phone?: string | null; customer_address?: string | null; due_date?: string | null }) => {
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

  const duplicateJob = async (job: Job) => {
    if (!user) return null;
    const newJob = await createJob(`${job.title} (Copy)`, job.description || undefined, job.status, {
      name: job.customerName || undefined,
      email: job.customerEmail || undefined,
      phone: job.customerPhone || undefined,
      address: job.customerAddress || undefined,
    });
    if (!newJob) return null;
    // Copy job items
    const { data: sourceItems } = await supabase
      .from('job_items')
      .select('*')
      .eq('job_id', job.id);
    if (sourceItems && sourceItems.length > 0) {
      const copies = sourceItems.map(i => ({
        job_id: newJob.id,
        inventory_item_id: i.inventory_item_id,
        item_name: i.item_name,
        sku: i.sku,
        quantity: i.quantity,
        unit_price: i.unit_price,
        notes: i.notes,
      }));
      await supabase.from('job_items').insert(copies);
    }
    await fetchJobs();
    toast({ title: 'Job duplicated successfully' });
    return newJob;
  };

  const reorderJobs = async (reorderedJobs: Job[]) => {
    // Optimistic update
    setJobs(reorderedJobs);
    // Persist new order
    const updates = reorderedJobs.map((j, i) => 
      supabase.from('jobs').update({ display_order: i }).eq('id', j.id)
    );
    await Promise.all(updates);
  };

  return { jobs, loading, createJob, updateJob, deleteJob, duplicateJob, reorderJobs, refetch: fetchJobs };
}

export function useAllJobItems() {
  const [items, setItems] = useState<(JobItem & { jobTitle: string; jobNumber: string | null })[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchAllItems = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('job_items')
      .select('*, jobs!inner(title, job_number, status)')
      .neq('jobs.status', 'finished');
    if (error) {
      console.error('Error loading all job items:', error);
    } else {
      setItems((data || []).map((d: any) => ({
        id: d.id,
        jobId: d.job_id,
        inventoryItemId: d.inventory_item_id,
        itemName: d.item_name,
        sku: d.sku,
        quantity: d.quantity,
        unitPrice: Number(d.unit_price),
        notes: d.notes,
        createdAt: d.created_at,
        jobTitle: d.jobs.title,
        jobNumber: d.jobs.job_number,
      })));
    }
    setLoading(false);
  }, [user]);

  return { items, loading, fetchAllItems };
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

  const addItem = async (item: { inventoryItemId: string; itemName: string; sku: string; quantity: number; unitPrice: number; notes?: string }) => {
    if (!jobId) return false;
    const { error } = await supabase.from('job_items').insert({
      job_id: jobId,
      inventory_item_id: item.inventoryItemId,
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
