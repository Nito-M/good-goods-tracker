import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PartInventoryItem {
  id: string;
  partId: string;
  inventoryItemId: string;
  quantity: number;
  notes: string | null;
  // joined fields
  itemName: string;
  itemSku: string;
  itemCost: number;
  itemPrice: number;
}

export function usePartInventoryItems(partId: string | undefined) {
  const [items, setItems] = useState<PartInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (!user || !partId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('part_inventory_items' as any)
      .select('*, inventory_items!inner(name, sku, cost, price)')
      .eq('part_id', partId)
      .order('created_at', { ascending: true });

    if (error) {
      toast({ title: 'Error loading part items', description: error.message, variant: 'destructive' });
    } else {
      setItems((data || []).map((d: any) => ({
        id: d.id,
        partId: d.part_id,
        inventoryItemId: d.inventory_item_id,
        quantity: d.quantity ?? 1,
        notes: d.notes,
        itemName: d.inventory_items?.name || '',
        itemSku: d.inventory_items?.sku || '',
        itemCost: d.inventory_items?.cost ?? 0,
        itemPrice: d.inventory_items?.price ?? 0,
      })));
    }
    setLoading(false);
  }, [user, partId, toast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = async (inventoryItemId: string, quantity: number = 1) => {
    if (!user || !partId) return false;
    const { error } = await supabase.from('part_inventory_items' as any).insert({
      part_id: partId,
      inventory_item_id: inventoryItemId,
      quantity,
      user_id: user.id,
    } as any);
    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Item already added', variant: 'destructive' });
      } else {
        toast({ title: 'Error adding item', description: error.message, variant: 'destructive' });
      }
      return false;
    }
    await fetchItems();
    return true;
  };

  const updateItem = async (id: string, updates: { quantity?: number; notes?: string }) => {
    const { error } = await supabase.from('part_inventory_items' as any).update(updates as any).eq('id', id);
    if (error) {
      toast({ title: 'Error updating item', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchItems();
    return true;
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from('part_inventory_items' as any).delete().eq('id', id);
    if (error) {
      toast({ title: 'Error removing item', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchItems();
    return true;
  };

  const totalCost = items.reduce((sum, i) => sum + (i.itemCost * i.quantity), 0);

  return { items, loading, addItem, updateItem, removeItem, totalCost, refetch: fetchItems };
}
