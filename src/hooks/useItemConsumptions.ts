import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ItemConsumption {
  id: string;
  item_id: string;
  user_id: string;
  quantity: number;
  description: string | null;
  warehouse_id: string | null;
  created_at: string;
}

export function useItemConsumptions(itemId?: string) {
  const [consumptions, setConsumptions] = useState<ItemConsumption[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchConsumptions = useCallback(async () => {
    if (!itemId || !user) {
      setConsumptions([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('item_consumptions')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching consumptions:', error);
    } else {
      setConsumptions((data as ItemConsumption[]) || []);
    }
    setLoading(false);
  }, [itemId, user]);

  useEffect(() => {
    fetchConsumptions();
  }, [fetchConsumptions]);

  const addConsumption = useCallback(async (params: {
    itemId: string;
    quantity: number;
    description?: string;
    warehouseId?: string;
  }) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('item_consumptions')
      .insert({
        item_id: params.itemId,
        user_id: user.id,
        quantity: params.quantity,
        description: params.description || null,
        warehouse_id: params.warehouseId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding consumption:', error);
      return null;
    }

    await fetchConsumptions();
    return data as ItemConsumption;
  }, [user, fetchConsumptions]);

  return { consumptions, loading, addConsumption, refetch: fetchConsumptions };
}
