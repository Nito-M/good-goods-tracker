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
      .order('due_date', { ascending: true, nullsFirst: false });
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

  const createJob = async (title: string, description?: string, status?: string, customer?: { name?: string; email?: string; phone?: string; address?: string }, dueDate?: string, jobNumber?: string) => {
    if (!user) return null;
    const insertData: Record<string, unknown> = {
      title,
      description: description || null,
      user_id: user.id,
      status: status || 'open',
      customer_name: customer?.name || null,
      customer_email: customer?.email || null,
      customer_phone: customer?.phone || null,
      customer_address: customer?.address || null,
      due_date: dueDate || null,
    };
    if (jobNumber && jobNumber.trim()) {
      insertData.job_number = jobNumber.trim();
    }
    const { data, error } = await supabase
      .from('jobs')
      .insert(insertData as any)
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
      .select('*, jobs!inner(title, job_number, status), inventory_items(category)')
      .neq('jobs.status', 'finished')
      .neq('jobs.status', 'on-hold');
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
        category: d.inventory_items?.category ?? null,
        reserved: d.reserved ?? false,
        consumed: d.consumed ?? false,
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
      .select('*, inventory_items(category)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error loading job items:', error);
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
        category: d.inventory_items?.category ?? null,
        reserved: d.reserved ?? false,
        createdAt: d.created_at,
      })));
    }
    setLoading(false);
  }, [jobId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Helper: proportionally deduct quantity from location quantities
  const deductFromLocations = async (inventoryItemId: string, qty: number) => {
    const { data: locations } = await supabase
      .from('item_location_quantities')
      .select('id, quantity')
      .eq('item_id', inventoryItemId)
      .gt('quantity', 0)
      .order('quantity', { ascending: false });
    if (!locations || locations.length === 0) return;

    let remaining = qty;
    for (const loc of locations) {
      if (remaining <= 0) break;
      const deduct = Math.min(loc.quantity, remaining);
      await supabase
        .from('item_location_quantities')
        .update({ quantity: loc.quantity - deduct })
        .eq('id', loc.id);
      remaining -= deduct;
    }
  };

  // Helper: return quantity to location quantities (adds to first location, or distributes)
  const returnToLocations = async (inventoryItemId: string, qty: number) => {
    const { data: locations } = await supabase
      .from('item_location_quantities')
      .select('id, quantity')
      .eq('item_id', inventoryItemId)
      .order('quantity', { ascending: false });
    if (!locations || locations.length === 0) return;

    // Return all to the first (largest) location
    const loc = locations[0];
    await supabase
      .from('item_location_quantities')
      .update({ quantity: loc.quantity + qty })
      .eq('id', loc.id);
  };



  const reserveItem = async (jobItemId: string) => {
    const item = items.find(i => i.id === jobItemId);
    if (!item || !item.inventoryItemId) {
      toast({ title: 'Cannot reserve', description: 'Item is not linked to inventory', variant: 'destructive' });
      return false;
    }
    if (item.reserved) return true;
    // Check stock
    const { data: inv, error: invErr } = await supabase
      .from('inventory_items')
      .select('quantity')
      .eq('id', item.inventoryItemId)
      .single();
    if (invErr || !inv) {
      toast({ title: 'Error checking stock', variant: 'destructive' });
      return false;
    }
    if (inv.quantity < item.quantity) {
      toast({ title: 'Not enough stock', description: `Available: ${inv.quantity}, Needed: ${item.quantity}`, variant: 'destructive' });
      return false;
    }
    // Deduct stock
    const { error: updErr } = await supabase
      .from('inventory_items')
      .update({ quantity: inv.quantity - item.quantity })
      .eq('id', item.inventoryItemId);
    if (updErr) {
      toast({ title: 'Error updating stock', variant: 'destructive' });
      return false;
    }

    // Also deduct from location quantities proportionally
    await deductFromLocations(item.inventoryItemId, item.quantity);

    // Mark reserved
    const { error: resErr } = await supabase
      .from('job_items')
      .update({ reserved: true } as any)
      .eq('id', jobItemId);
    if (resErr) {
      // Rollback stock
      await supabase.from('inventory_items').update({ quantity: inv.quantity }).eq('id', item.inventoryItemId);
      toast({ title: 'Error reserving item', variant: 'destructive' });
      return false;
    }
    await fetchItems();
    toast({ title: 'Item reserved from stock' });
    return true;
  };

  const unreserveItem = async (jobItemId: string) => {
    const item = items.find(i => i.id === jobItemId);
    if (!item || !item.inventoryItemId || !item.reserved) return false;
    // Get current stock
    const { data: inv, error: invErr } = await supabase
      .from('inventory_items')
      .select('quantity')
      .eq('id', item.inventoryItemId)
      .single();
    if (invErr || !inv) {
      toast({ title: 'Error checking stock', variant: 'destructive' });
      return false;
    }
    // Return stock
    const { error: updErr } = await supabase
      .from('inventory_items')
      .update({ quantity: inv.quantity + item.quantity })
      .eq('id', item.inventoryItemId);
    if (updErr) {
      toast({ title: 'Error returning stock', variant: 'destructive' });
      return false;
    }

    // Also return to location quantities
    await returnToLocations(item.inventoryItemId, item.quantity);

    // Unmark reserved
    const { error: resErr } = await supabase
      .from('job_items')
      .update({ reserved: false } as any)
      .eq('id', jobItemId);
    if (resErr) {
      await supabase.from('inventory_items').update({ quantity: inv.quantity }).eq('id', item.inventoryItemId);
      toast({ title: 'Error unreserving item', variant: 'destructive' });
      return false;
    }
    await fetchItems();
    toast({ title: 'Item returned to stock' });
    return true;
  };

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

  return { items, loading, addItem, updateItem, removeItem, reserveItem, unreserveItem, refetch: fetchItems };
}
