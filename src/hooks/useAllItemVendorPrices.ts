import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VendorPriceRow {
  id: string;
  itemId: string;
  vendorId: string;
  vendorName: string;
  price: number;
  vendorSku: string | null;
  leadTimeDays: number | null;
  link: string | null;
}

/**
 * Fetches every item_vendor_prices row visible to the current user
 * (RLS scopes to org). Used by item pickers to let the user choose
 * which vendor-price row to apply when an item has multiples.
 */
export function useAllItemVendorPrices() {
  const { user } = useAuth();
  const [rows, setRows] = useState<VendorPriceRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setRows([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('item_vendor_prices')
        .select('id, item_id, vendor_id, price, vendor_sku, lead_time_days, link, vendors:vendor_id(name)')
        .order('updated_at', { ascending: false });
      if (cancelled) return;
      if (error || !data) {
        setRows([]);
        setLoading(false);
        return;
      }
      setRows(
        (data as any[]).map((r) => ({
          id: r.id,
          itemId: r.item_id,
          vendorId: r.vendor_id,
          vendorName: r.vendors?.name || 'Unknown vendor',
          price: Number(r.price) || 0,
          vendorSku: r.vendor_sku,
          leadTimeDays: r.lead_time_days,
          link: r.link,
        }))
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { rows, loading };
}
