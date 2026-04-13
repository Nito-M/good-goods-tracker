import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PartInventoryItem2 {
  id: string;
  partId: string;
  inventoryItemId: string | null;
  quantity: number;
  notes: string | null;
  itemName: string;
  itemSku: string;
  unitCost: number;
  itemPrice: number;
  isCustom: boolean;
}

export function usePartInventoryItems2(partId: string | undefined) {
  const [items, setItems] = useState<PartInventoryItem2[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const fetchItems = useCallback(async () => {
    if (!partId) { setItems([]); setLoading(false); return; }
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('part_inventory_items_2' as any)
      .select('*, inventory_items(name, sku, cost, price)')
      .eq('part_id', partId)
      .order('created_at', { ascending: true });

    if (error) {
      toastRef.current({ title: 'Error loading part items', description: error.message, variant: 'destructive' });
    } else {
      setItems((data || []).map((d: any) => {
        const isCustom = !d.inventory_item_id;
        return {
          id: d.id,
          partId: d.part_id,
          inventoryItemId: d.inventory_item_id,
          quantity: d.quantity ?? 1,
          notes: d.notes,
          itemName: isCustom ? (d.item_name || 'Custom Item') : (d.inventory_items?.name || ''),
          itemSku: isCustom ? '' : (d.inventory_items?.sku || ''),
          unitCost: isCustom ? (d.unit_cost ?? 0) : (d.inventory_items?.cost ?? 0),
          itemPrice: isCustom ? 0 : (d.inventory_items?.price ?? 0),
          isCustom,
        };
      }));
    }
    setLoading(false);
  }, [user, partId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const addItem = async (inventoryItemId: string, quantity: number = 1) => {
    if (!user || !partId) return false;
    const { error } = await supabase.from('part_inventory_items_2' as any).insert({
      part_id: partId,
      inventory_item_id: inventoryItemId,
      quantity,
      user_id: user.id,
    } as any);
    if (error) {
      toastRef.current({ title: 'Error adding item', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchItems();
    return true;
  };

  const addCustomItem = async (name: string, unitCost: number, quantity: number = 1) => {
    if (!user || !partId) return false;
    const { error } = await supabase.from('part_inventory_items_2' as any).insert({
      part_id: partId,
      inventory_item_id: null,
      item_name: name,
      unit_cost: unitCost,
      quantity,
      user_id: user.id,
    } as any);
    if (error) {
      toastRef.current({ title: 'Error adding item', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchItems();
    return true;
  };

  const updateItem = async (id: string, updates: { quantity?: number; notes?: string; item_name?: string; unit_cost?: number }) => {
    const { error } = await supabase.from('part_inventory_items_2' as any).update(updates as any).eq('id', id);
    if (error) {
      toastRef.current({ title: 'Error updating item', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchItems();
    return true;
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from('part_inventory_items_2' as any).delete().eq('id', id);
    if (error) {
      toastRef.current({ title: 'Error removing item', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchItems();
    return true;
  };

  const totalCost = items.reduce((sum, i) => sum + (i.unitCost * i.quantity), 0);

  return { items, loading, addItem, addCustomItem, updateItem, removeItem, totalCost, refetch: fetchItems };
}
