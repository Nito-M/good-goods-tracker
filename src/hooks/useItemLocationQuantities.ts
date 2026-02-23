import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ItemLocationQuantity {
  id: string;
  item_id: string;
  warehouse_id: string;
  quantity: number;
  user_id: string;
}

export function useItemLocationQuantities(itemId?: string) {
  const [locations, setLocations] = useState<ItemLocationQuantity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchLocations = useCallback(async () => {
    if (!itemId || !user) {
      setLocations([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('item_location_quantities' as any)
      .select('*')
      .eq('item_id', itemId)
      .order('created_at');

    if (error) {
      console.error('Error fetching item locations:', error);
    } else {
      setLocations((data as any[] || []).map((d: any) => ({
        id: d.id,
        item_id: d.item_id,
        warehouse_id: d.warehouse_id,
        quantity: d.quantity,
        user_id: d.user_id,
      })));
    }
    setLoading(false);
  }, [itemId, user]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const saveLocations = useCallback(async (
    targetItemId: string,
    entries: { warehouseId: string; quantity: number }[]
  ) => {
    if (!user) return;

    // Delete all existing entries for this item
    await supabase
      .from('item_location_quantities' as any)
      .delete()
      .eq('item_id', targetItemId);

    // Insert non-zero entries
    const toInsert = entries
      .filter(e => e.quantity > 0)
      .map(e => ({
        item_id: targetItemId,
        warehouse_id: e.warehouseId,
        quantity: e.quantity,
        user_id: user.id,
      }));

    if (toInsert.length > 0) {
      const { error } = await supabase
        .from('item_location_quantities' as any)
        .insert(toInsert);

      if (error) {
        console.error('Error saving item locations:', error);
      }
    }

    await fetchLocations();
  }, [user, fetchLocations]);

  return { locations, loading, saveLocations, refetch: fetchLocations };
}
