import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LastPurchaseInfo {
  poNumber: string | null;
  vendorName: string | null;
  unitCost: number;
  receivedAt: Date;
}

export function useLastPurchase(sku: string | undefined) {
  const [lastPurchase, setLastPurchase] = useState<LastPurchaseInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchLastPurchase() {
      if (!sku) {
        setLastPurchase(null);
        return;
      }

      setLoading(true);

      // Fetch received purchase orders containing this SKU, ordered by received_at descending
      const { data: poData } = await supabase
        .from('purchase_orders')
        .select('id, po_number, items, received_at, vendor_id')
        .eq('status', 'received')
        .not('received_at', 'is', null)
        .order('received_at', { ascending: false });

      if (!poData || poData.length === 0) {
        setLastPurchase(null);
        setLoading(false);
        return;
      }

      // Find the most recent PO that contains this SKU
      let foundPO: typeof poData[0] | null = null;
      let foundItem: { sku: string; unitCost?: number } | null = null;

      for (const po of poData) {
        const items = po.items as Array<{ sku: string; itemName: string; quantity: number; unitCost?: number }> | null;
        if (items && Array.isArray(items)) {
          const matchingItem = items.find(item => item.sku === sku);
          if (matchingItem) {
            foundPO = po;
            foundItem = matchingItem;
            break; // First match is the most recent due to ordering
          }
        }
      }

      if (!foundPO || !foundItem) {
        setLastPurchase(null);
        setLoading(false);
        return;
      }

      // Fetch vendor name if vendor_id exists
      let vendorName: string | null = null;
      if (foundPO.vendor_id) {
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('name')
          .eq('id', foundPO.vendor_id)
          .single();
        
        vendorName = vendorData?.name || null;
      }

      setLastPurchase({
        poNumber: foundPO.po_number,
        vendorName,
        unitCost: foundItem.unitCost || 0,
        receivedAt: new Date(foundPO.received_at!),
      });

      setLoading(false);
    }

    fetchLastPurchase();
  }, [sku]);

  return { lastPurchase, loading };
}
