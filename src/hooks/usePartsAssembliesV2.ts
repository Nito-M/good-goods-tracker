import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PartsAssemblyV2 {
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

export interface PartsAssemblyV2Item {
  id: string;
  assembly_id: string;
  part_id: string | null;
  inventory_item_id: string | null;
  parts_assembly_id: string | null;
  part_name: string;
  part_sku: string;
  quantity: number;
  notes: string | null;
  created_at: string;
}

export function usePartsAssembliesV2() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assemblies, setAssemblies] = useState<PartsAssemblyV2[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssemblies = async () => {
    if (!user) {
      setAssemblies([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('parts_assemblies_v2')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching parts assemblies v2:', error);
    } else {
      setAssemblies((data || []) as PartsAssemblyV2[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssemblies();
  }, [user]);

  const createAssembly = async (name: string, description?: string, type?: string): Promise<PartsAssemblyV2 | null> => {
    if (!user) return null;

    const { data, error } = await (supabase as any)
      .from('parts_assemblies_v2')
      .insert({ user_id: user.id, name, description: description || null, type: type || 'General' })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to create assembly.', variant: 'destructive' });
      return null;
    }

    await fetchAssemblies();
    return data as PartsAssemblyV2;
  };

  const updateAssembly = async (
    id: string,
    updates: { name?: string; description?: string | null; selling_price?: number; status?: string; status_notes?: string | null; type?: string }
  ) => {
    const { error } = await (supabase as any)
      .from('parts_assemblies_v2')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update assembly.', variant: 'destructive' });
    } else {
      await fetchAssemblies();
    }
  };

  const deleteAssembly = async (id: string) => {
    const { error } = await (supabase as any)
      .from('parts_assemblies_v2')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete assembly.', variant: 'destructive' });
    } else {
      await fetchAssemblies();
    }
  };

  return { assemblies, loading, createAssembly, updateAssembly, deleteAssembly, refetch: fetchAssemblies };
}

export function usePartsAssemblyV2Items(assemblyId: string | null) {
  const { toast } = useToast();
  const [items, setItems] = useState<PartsAssemblyV2Item[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    if (!assemblyId) {
      setItems([]);
      return;
    }

    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('parts_assembly_v2_items')
      .select('*')
      .eq('assembly_id', assemblyId)
      .order('created_at');

    if (error) {
      console.error('Error fetching parts assembly v2 items:', error);
    } else {
      setItems((data as PartsAssemblyV2Item[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [assemblyId]);

  const addItem = async (item: {
    part_id?: string | null;
    inventory_item_id?: string | null;
    parts_assembly_id?: string | null;
    part_name: string;
    part_sku: string;
    quantity: number;
    notes?: string;
  }): Promise<boolean> => {
    if (!assemblyId) return false;

    if (item.part_id) {
      const existing = items.find((i) => i.part_id === item.part_id);
      if (existing) {
        toast({ title: 'Part already in list', description: 'Update its quantity instead.', variant: 'destructive' });
        return false;
      }
    }

    if (item.parts_assembly_id) {
      const existing = items.find((i) => i.parts_assembly_id === item.parts_assembly_id);
      if (existing) {
        toast({ title: 'Assembly already in list', description: 'Update its quantity instead.', variant: 'destructive' });
        return false;
      }
    }

    const { error } = await (supabase as any).from('parts_assembly_v2_items').insert({
      assembly_id: assemblyId,
      part_id: item.part_id || null,
      inventory_item_id: item.inventory_item_id || null,
      parts_assembly_id: item.parts_assembly_id || null,
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

  const addItems = async (newItems: {
    part_id?: string | null;
    inventory_item_id?: string | null;
    parts_assembly_id?: string | null;
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
      parts_assembly_id: item.parts_assembly_id || null,
      part_name: item.part_name,
      part_sku: item.part_sku,
      quantity: item.quantity,
      notes: item.notes || null,
    }));

    const { error } = await (supabase as any).from('parts_assembly_v2_items').insert(rows);
    if (error) {
      toast({ title: 'Error', description: 'Failed to add items.', variant: 'destructive' });
      return 0;
    }

    await fetchItems();
    return rows.length;
  };

  const updateItem = async (id: string, updates: { quantity?: number; notes?: string | null }) => {
    const { error } = await (supabase as any)
      .from('parts_assembly_v2_items')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update item.', variant: 'destructive' });
    } else {
      await fetchItems();
    }
  };

  const removeItem = async (id: string) => {
    const { error } = await (supabase as any)
      .from('parts_assembly_v2_items')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to remove item.', variant: 'destructive' });
    } else {
      await fetchItems();
    }
  };

  return { items, loading, addItem, addItems, updateItem, removeItem };
}
