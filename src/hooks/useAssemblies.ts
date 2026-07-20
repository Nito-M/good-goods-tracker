import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Assembly {
  id: string;
  user_id: string;
  name: string;
  sku: string | null;
  description: string | null;
  selling_price: number;
  status: string;
  status_notes: string | null;
  type: string;
  model: string | null;
  selling_price_updated_at: string | null;
  created_at: string;
  updated_at: string;
}


export interface AssemblyItem {
  id: string;
  assembly_id: string;
  inventory_item_id: string | null;
  item_name: string;
  sku: string;
  quantity: number;
  unit_cost: number;
  notes: string | null;
  part_id: string | null;
  parts_assembly_id: string | null;
  nested_assembly_id: string | null;
  created_at: string;
}

export function useAssemblies() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssemblies = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('assemblies')
      .select('*')
      .order('name');
    if (error) {
      console.error('Error fetching assemblies:', error);
    } else {
      setAssemblies(
        (data || []).map((d: any) => ({
          ...d,
          status: d.status ?? 'not_finished',
          status_notes: d.status_notes ?? null,
          type: d.type ?? 'General',
          model: d.model ?? null,
        })) as Assembly[]
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssemblies();
  }, [user]);

  const createAssembly = async (name: string, description?: string, type?: string, model?: string | null, sku?: string | null): Promise<Assembly | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('assemblies')
      .insert({ user_id: user.id, name, description: description || null, type: type || 'General', model: model || null, sku: sku || null } as any)
      .select()
      .single();
    if (error) {
      toast({ title: 'Error', description: 'Failed to create assembly.', variant: 'destructive' });
      return null;
    }
    await fetchAssemblies();
    return data as Assembly;
  };

  const updateAssembly = async (id: string, updates: { name?: string; sku?: string | null; description?: string | null; selling_price?: number; status?: string; status_notes?: string | null; type?: string; model?: string | null }) => {
    const { error } = await supabase
      .from('assemblies')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update assembly.', variant: 'destructive' });
    } else {
      await fetchAssemblies();
    }
  };


  const deleteAssembly = async (id: string) => {
    const { error } = await supabase.from('assemblies').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete assembly.', variant: 'destructive' });
    } else {
      await fetchAssemblies();
    }
  };

  const duplicateAssembly = async (id: string): Promise<Assembly | null> => {
    if (!user) return null;
    // Fetch source assembly
    const source = assemblies.find(a => a.id === id);
    if (!source) return null;
    // Create copy
    const { data: newAssembly, error } = await supabase
      .from('assemblies')
      .insert({
        user_id: user.id,
        name: `${source.name} (Copy)`,
        description: source.description,
        selling_price: source.selling_price,
        status: source.status,
        status_notes: source.status_notes,
        type: source.type,
        model: source.model,
        sku: source.sku,

      } as any)
      .select()
      .single();
    if (error || !newAssembly) {
      toast({ title: 'Error', description: 'Failed to duplicate assembly.', variant: 'destructive' });
      return null;
    }
    // Copy items
    const { data: sourceItems } = await supabase
      .from('assembly_items')
      .select('*')
      .eq('assembly_id', id);
    if (sourceItems && sourceItems.length > 0) {
      const itemsToInsert = sourceItems.map((item: any) => ({
        assembly_id: newAssembly.id,
        inventory_item_id: item.inventory_item_id,
        item_name: item.item_name,
        sku: item.sku,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        notes: item.notes,
        part_id: item.part_id,
        parts_assembly_id: item.parts_assembly_id,
        nested_assembly_id: item.nested_assembly_id,
      }));
      await supabase.from('assembly_items').insert(itemsToInsert);
    }
    await fetchAssemblies();
    toast({ title: 'Duplicated', description: `"${newAssembly.name}" created.` });
    return newAssembly as Assembly;
  };

  return { assemblies, loading, createAssembly, updateAssembly, deleteAssembly, duplicateAssembly, refetch: fetchAssemblies };
}

export function useAssemblyItems(assemblyId: string | null) {
  const { toast } = useToast();
  const [items, setItems] = useState<AssemblyItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    if (!assemblyId) { setItems([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('assembly_items')
      .select('*')
      .eq('assembly_id', assemblyId)
      .order('created_at');
    if (error) {
      console.error('Error fetching assembly items:', error);
    } else {
      setItems((data as AssemblyItem[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [assemblyId]);

  const addItem = async (item: {
    inventory_item_id?: string | null;
    item_name: string;
    sku: string;
    quantity: number;
    unit_cost?: number;
    notes?: string;
    parts_assembly_id?: string | null;
    part_id?: string | null;
    nested_assembly_id?: string | null;
  }): Promise<boolean> => {
    if (!assemblyId) return false;
    const { error } = await supabase.from('assembly_items').insert({
      assembly_id: assemblyId,
      inventory_item_id: item.inventory_item_id || null,
      item_name: item.item_name,
      sku: item.sku,
      quantity: item.quantity,
      unit_cost: item.unit_cost ?? 0,
      notes: item.notes || null,
      parts_assembly_id: item.parts_assembly_id || null,
      part_id: item.part_id || null,
      nested_assembly_id: item.nested_assembly_id || null,
    } as any);
    if (error) {
      toast({ title: 'Error', description: 'Failed to add item.', variant: 'destructive' });
      return false;
    }
    await fetchItems();
    return true;
  };

  const updateItem = async (id: string, updates: { quantity?: number; notes?: string | null; unit_cost?: number }) => {
    // Optimistic local update — avoids full re-render/refetch flicker.
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } as AssemblyItem : i)));
    const { error } = await supabase.from('assembly_items').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update item.', variant: 'destructive' });
      await fetchItems();
    }
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from('assembly_items').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to remove item.', variant: 'destructive' });
    } else {
      await fetchItems();
    }
  };

  return { items, loading, addItem, updateItem, removeItem };
}

export interface AssemblySummary {
  totalCost: number;
  itemCount: number;
  hasCustomItems: boolean;
}

export function useAssemblySummaries(assemblyIds: string[]) {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<Map<string, AssemblySummary>>(new Map());
  const [loading, setLoading] = useState(false);

  const fetchSummaries = async () => {
    if (!user || assemblyIds.length === 0) { setSummaries(new Map()); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('assembly_items')
      .select(`
        assembly_id,
        quantity,
        unit_cost,
        inventory_item_id,
        inventory_items ( cost )
      `)
      .in('assembly_id', assemblyIds);

    if (!error && data) {
      const map = new Map<string, AssemblySummary>();
      for (const row of data as any[]) {
        const existing = map.get(row.assembly_id) || { totalCost: 0, itemCount: 0, hasCustomItems: false };
        const cost = row.inventory_items?.cost ?? row.unit_cost ?? 0;
        existing.totalCost += row.quantity * cost;
        existing.itemCount += 1;
        if (!row.inventory_item_id) existing.hasCustomItems = true;
        map.set(row.assembly_id, existing);
      }
      setSummaries(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSummaries(); }, [assemblyIds.join(','), user?.id]);

  return { summaries, loading, refetch: fetchSummaries };
}

