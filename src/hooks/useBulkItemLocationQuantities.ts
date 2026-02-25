import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Bulk-fetch item_location_quantities for a list of item IDs.
 * Returns:
 * - warehouseItemMap: Map<warehouseId, Set<itemId>> for filtering
 * - warehouseItemQtyMap: Map<`${warehouseId}:${itemId}`, quantity> for displaying location-specific quantities
 */
export function useBulkItemLocationQuantities(itemIds: string[]) {
  const [warehouseItemMap, setWarehouseItemMap] = useState<Map<string, Set<string>>>(new Map());
  const [warehouseItemQtyMap, setWarehouseItemQtyMap] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const prevKey = useRef('');

  const fetch = useCallback(async () => {
    if (!user || itemIds.length === 0) {
      setWarehouseItemMap(new Map());
      setWarehouseItemQtyMap(new Map());
      setLoading(false);
      return;
    }

    // Batch in chunks of 500 to avoid query limits
    const allRows: { item_id: string; warehouse_id: string; quantity: number }[] = [];
    for (let i = 0; i < itemIds.length; i += 500) {
      const chunk = itemIds.slice(i, i + 500);
      const { data } = await supabase
        .from('item_location_quantities')
        .select('item_id, warehouse_id, quantity')
        .in('item_id', chunk);
      if (data) allRows.push(...(data as any[]));
    }

    const map = new Map<string, Set<string>>();
    const qtyMap = new Map<string, number>();
    for (const row of allRows) {
      if (!map.has(row.warehouse_id)) map.set(row.warehouse_id, new Set());
      map.get(row.warehouse_id)!.add(row.item_id);
      qtyMap.set(`${row.warehouse_id}:${row.item_id}`, row.quantity);
    }
    setWarehouseItemMap(map);
    setWarehouseItemQtyMap(qtyMap);
    setLoading(false);
  }, [user, itemIds]);

  useEffect(() => {
    const key = itemIds.join(',');
    if (key === prevKey.current) return;
    prevKey.current = key;
    fetch();
  }, [fetch, itemIds]);

  return { warehouseItemMap, warehouseItemQtyMap, loading, refetch: fetch };
}
