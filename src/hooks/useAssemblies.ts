import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Assembly {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
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
  notes: string | null;
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
      setAssemblies((data as Assembly[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssemblies();
  }, [user]);

  const createAssembly = async (name: string, description?: string): Promise<Assembly | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('assemblies')
      .insert({ user_id: user.id, name, description: description || null })
      .select()
      .single();
    if (error) {
      toast({ title: 'Error', description: 'Failed to create assembly.', variant: 'destructive' });
      return null;
    }
    await fetchAssemblies();
    return data as Assembly;
  };

  const updateAssembly = async (id: string, updates: { name?: string; description?: string | null }) => {
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

  return { assemblies, loading, createAssembly, updateAssembly, deleteAssembly, refetch: fetchAssemblies };
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
    notes?: string;
  }): Promise<boolean> => {
    if (!assemblyId) return false;
    const { error } = await supabase.from('assembly_items').insert({
      assembly_id: assemblyId,
      inventory_item_id: item.inventory_item_id || null,
      item_name: item.item_name,
      sku: item.sku,
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
    const { error } = await supabase.from('assembly_items').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update item.', variant: 'destructive' });
    } else {
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
