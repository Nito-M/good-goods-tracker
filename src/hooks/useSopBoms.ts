import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SopBomOptionItem {
  inventoryItemId: string;
  name: string;
  sku: string | null;
  quantity: number;
  unitCost: number;
  notes: string | null;
}

export interface SopBomOption {
  id: string;
  title: string;
  sopNumber: string | null;
  status: 'draft' | 'active' | 'obsolete';
  itemCount: number;
  items: SopBomOptionItem[];
}

export function useSopBoms() {
  const { user } = useAuth();
  const [boms, setBoms] = useState<SopBomOption[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setBoms([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: sopRows, error: sopError } = await supabase
      .from('sops' as any)
      .select('id,title,sop_number,status')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (sopError || !sopRows || sopRows.length === 0) {
      setBoms([]);
      setLoading(false);
      return;
    }

    const sopIds = (sopRows as any[]).map((s) => s.id);

    const { data: bomRows, error: bomError } = await supabase
      .from('sop_bom_items' as any)
      .select('id,sop_id,inventory_item_id,quantity,notes')
      .in('sop_id', sopIds)
      .order('sort_order');

    if (bomError || !bomRows) {
      setBoms([]);
      setLoading(false);
      return;
    }

    const inventoryItemIds = (bomRows as any[])
      .map((b) => b.inventory_item_id)
      .filter(Boolean);

    const { data: itemRows } = await supabase
      .from('inventory_items' as any)
      .select('id,name,sku,cost')
      .in('id', inventoryItemIds.length ? inventoryItemIds : ['__none__']);

    const itemsById = new Map((itemRows as any[] || []).map((i) => [i.id, i]));

    const bomItemsBySop = new Map<string, SopBomOptionItem[]>();
    (bomRows as any[]).forEach((b) => {
      const inv = itemsById.get(b.inventory_item_id);
      if (!inv) return;
      const list = bomItemsBySop.get(b.sop_id) || [];
      list.push({
        inventoryItemId: b.inventory_item_id,
        name: inv.name || 'Unknown',
        sku: inv.sku || null,
        quantity: b.quantity || 0,
        unitCost: inv.cost || 0,
        notes: b.notes || null,
      });
      bomItemsBySop.set(b.sop_id, list);
    });

    const options: SopBomOption[] = (sopRows as any[])
      .map((s) => {
        const items = bomItemsBySop.get(s.id) || [];
        return {
          id: s.id,
          title: s.title || 'Untitled SOP',
          sopNumber: s.sop_number || null,
          status: s.status || 'draft',
          itemCount: items.length,
          items,
        };
      })
      .filter((o) => o.itemCount > 0);

    setBoms(options);
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  return { boms, loading, refetch };
}
