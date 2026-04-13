import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PartsAssembly2 {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  selling_price: number;
  status: string;
  status_notes: string | null;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface PartsAssemblyItem2 {
  id: string;
  assembly_id: string;
  part_id: string | null;
  inventory_item_id: string | null;
  part_name: string;
  part_sku: string;
  quantity: number;
  notes: string | null;
  created_at: string;
}

export function usePartsAssemblies2() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assemblies, setAssemblies] = useState<PartsAssembly2[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssemblies = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('parts_assemblies_2')
      .select('*')
      .order('name');
    if (error) {
      console.error('Error fetching parts assemblies 2:', error);
    } else {
      setAssemblies((data || []) as PartsAssembly2[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAssemblies(); }, [user]);

  const createAssembly = async (name: string, description?: string, type?: string): Promise<PartsAssembly2 | null> => {
    if (!user) return null;
    const { data, error } = await (supabase as any)
      .from('parts_assemblies_2')
      .insert({ user_id: user.id, name, description: description || null, type: type || 'General' })
      .select()
      .single();
    if (error) {
      toast({ title: 'Error', description: 'Failed to create assembly.', variant: 'destructive' });
      return null;
    }
    await fetchAssemblies();
    return data as PartsAssembly2;
  };

  const updateAssembly = async (id: string, updates: { name?: string; description?: string | null; selling_price?: number; status?: string; status_notes?: string | null; type?: string }) => {
    const { error } = await (supabase as any)
      .from('parts_assemblies_2')
      .update(updates)
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update assembly.', variant: 'destructive' });
    } else {
      await fetchAssemblies();
    }
  };

  const deleteAssembly = async (id: string) => {
    const { error } = await (supabase as any).from('parts_assemblies_2').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete assembly.', variant: 'destructive' });
    } else {
      await fetchAssemblies();
    }
  };

  return { assemblies, loading, createAssembly, updateAssembly, deleteAssembly, refetch: fetchAssemblies };
}

export function usePartsAssemblyItems2(assemblyId: string | null) {
  const { toast } = useToast();
  const [items, setItems] = useState<PartsAssemblyItem2[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    if (!assemblyId) { setItems([]); return; }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('parts_assembly_items_2')
      .select('*')
      .eq('assembly_id', assemblyId)
      .order('created_at');
    if (error) {
      console.error('Error fetching parts assembly items 2:', error);
    } else {
      const fetched = (data as PartsAssemblyItem2[]) || [];

      // Auto-merge duplicates (same part_id)
      const partIdMap = new Map<string, PartsAssemblyItem2[]>();
      for (const item of fetched) {
        if (item.part_id) {
          const existing = partIdMap.get(item.part_id) || [];
          existing.push(item);
          partIdMap.set(item.part_id, existing);
        }
      }
      for (const [, dupes] of partIdMap) {
        if (dupes.length > 1) {
          const keep = dupes[0];
          const totalQty = dupes.reduce((sum, d) => sum + d.quantity, 0);
          const deleteIds = dupes.slice(1).map(d => d.id);
          await (supabase as any).from('parts_assembly_items_2').update({ quantity: totalQty }).eq('id', keep.id);
          await (supabase as any).from('parts_assembly_items_2').delete().in('id', deleteIds);
        }
      }

      const hadDupes = Array.from(partIdMap.values()).some(d => d.length > 1);
      if (hadDupes) {
        const { data: cleanData } = await (supabase as any)
          .from('parts_assembly_items_2')
          .select('*')
          .eq('assembly_id', assemblyId)
          .order('created_at');
        setItems((cleanData as PartsAssemblyItem2[]) || []);
      } else {
        setItems(fetched);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [assemblyId]);

  const addItem = async (item: {
    part_id?: string | null;
    inventory_item_id?: string | null;
    part_name: string;
    part_sku: string;
    quantity: number;
    notes?: string;
  }): Promise<boolean> => {
    if (!assemblyId) return false;

    if (item.part_id) {
      const existing = items.find(i => i.part_id && i.part_id === item.part_id);
      if (existing) {
        toast({ title: 'Part already in list', description: `"${item.part_name}" is already in this assembly. Update its quantity instead.`, variant: 'destructive' });
        return false;
      }
    }
    if (item.inventory_item_id) {
      const existing = items.find(i => i.inventory_item_id && i.inventory_item_id === item.inventory_item_id);
      if (existing) {
        toast({ title: 'Item already in list', description: `"${item.part_name}" is already in this assembly. Update its quantity instead.`, variant: 'destructive' });
        return false;
      }
    }

    const { error } = await (supabase as any).from('parts_assembly_items_2').insert({
      assembly_id: assemblyId,
      part_id: item.part_id || null,
      inventory_item_id: item.inventory_item_id || null,
      part_name: item.part_name,
      part_sku: item.part_sku,
      quantity: item.quantity,
      notes: item.notes || null,
    });
    if (error) {
      toast({ title: 'Error', description: 'Failed to add item.', variant: 'destructive' });
      return false;
    }
    await fetchItems();
    return true;
  };

  const updateItem = async (id: string, updates: { quantity?: number; notes?: string | null }) => {
    const { error } = await (supabase as any).from('parts_assembly_items_2').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update item.', variant: 'destructive' });
    } else {
      await fetchItems();
    }
  };

  const removeItem = async (id: string) => {
    const { error } = await (supabase as any).from('parts_assembly_items_2').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to remove item.', variant: 'destructive' });
    } else {
      await fetchItems();
    }
  };

  const addItems = async (newItems: {
    part_id?: string | null;
    inventory_item_id?: string | null;
    part_name: string;
    part_sku: string;
    quantity: number;
    notes?: string;
  }[]): Promise<number> => {
    if (!assemblyId || newItems.length === 0) return 0;

    const rows = newItems.map((item) => ({
      assembly_id: assemblyId,
      part_id: item.part_id || null,
      inventory_item_id: item.inventory_item_id || null,
      part_name: item.part_name,
      part_sku: item.part_sku,
      quantity: item.quantity,
      notes: item.notes || null,
    }));

    const { error } = await (supabase as any).from('parts_assembly_items_2').insert(rows);
    if (error) {
      toast({ title: 'Error', description: 'Failed to add items.', variant: 'destructive' });
      return 0;
    }
    await fetchItems();
    return rows.length;
  };

  return { items, loading, addItem, addItems, updateItem, removeItem };
}
