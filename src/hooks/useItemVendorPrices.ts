import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface ItemVendorPrice {
  id: string;
  item_id: string;
  vendor_id: string;
  price: number;
  link: string | null;
  vendor_sku: string | null;
  lead_time_days: number | null;
  notes: string | null;
  updated_at: string;
  created_at: string;
}

export function useItemVendorPrices(itemId?: string) {
  const [prices, setPrices] = useState<ItemVendorPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchPrices = useCallback(async () => {
    if (!user || !itemId) {
      setPrices([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('item_vendor_prices')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading item vendor prices:', error);
      setLoading(false);
      return;
    }

    setPrices(data || []);
    setLoading(false);
  }, [user, itemId]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Update an existing row by its id
  const updatePriceById = async (
    rowId: string,
    vendorId: string,
    price: number,
    link?: string,
    vendorSku?: string,
    leadTimeDays?: number | null,
    notes?: string | null
  ) => {
    if (!user || !itemId) return false;

    const { error } = await supabase
      .from('item_vendor_prices')
      .update({
        vendor_id: vendorId,
        price,
        link: link || null,
        vendor_sku: vendorSku || null,
        lead_time_days: leadTimeDays ?? null,
        notes: notes ?? null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', rowId);

    if (error) {
      console.error('Error updating vendor price:', error);
      toast({
        title: 'Error updating vendor price',
        description: 'Unable to update vendor price. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  // Insert a new vendor price row (duplicates allowed)
  const insertPrice = async (
    vendorId: string,
    price: number,
    link?: string,
    vendorSku?: string,
    leadTimeDays?: number | null,
    notes?: string | null
  ) => {
    if (!user || !itemId) return false;

    const { error } = await supabase
      .from('item_vendor_prices')
      .insert({
        item_id: itemId,
        vendor_id: vendorId,
        price,
        link: link || null,
        vendor_sku: vendorSku || null,
        lead_time_days: leadTimeDays ?? null,
        notes: notes ?? null,
        user_id: user.id,
      } as any);

    if (error) {
      console.error('Error adding vendor price:', error);
      toast({
        title: 'Error adding vendor price',
        description: 'Unable to add vendor price. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  // Delete a row by its id
  const deletePriceById = async (rowId: string) => {
    if (!user || !itemId) return;

    const { error } = await supabase
      .from('item_vendor_prices')
      .delete()
      .eq('id', rowId);

    if (error) {
      console.error('Error deleting vendor price:', error);
      toast({
        title: 'Error removing vendor',
        description: 'Unable to remove vendor. Please try again.',
        variant: 'destructive',
      });
      return;
    }
  };

  const getVendorPrice = (vendorId: string): number | null => {
    const found = prices.find(p => p.vendor_id === vendorId);
    return found ? found.price : null;
  };

  return {
    prices,
    loading,
    insertPrice,
    updatePriceById,
    deletePriceById,
    getVendorPrice,
    refetch: fetchPrices,
  };
}

// Static function to update vendor price from PO (can be called without hook context)
// Updates the most recent matching row, or inserts if none exists.
export async function updateVendorPriceFromPO(
  userId: string,
  itemId: string,
  vendorId: string,
  price: number,
  vendorSku?: string | null
): Promise<boolean> {
  const sku = vendorSku?.trim() || null;

  const { data: existing } = await supabase
    .from('item_vendor_prices')
    .select('id, vendor_sku')
    .eq('item_id', itemId)
    .eq('vendor_id', vendorId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const updates: Record<string, unknown> = { price, updated_at: new Date().toISOString() };
    // Only fill in the vendor part number when it's currently empty — never overwrite a manual value
    if (sku && !((existing as any).vendor_sku || '').trim()) {
      updates.vendor_sku = sku;
    }

    const { error } = await supabase
      .from('item_vendor_prices')
      .update(updates)
      .eq('id', existing.id);

    return !error;
  } else {
    const { error } = await supabase
      .from('item_vendor_prices')
      .insert({
        item_id: itemId,
        vendor_id: vendorId,
        price,
        vendor_sku: sku,
        user_id: userId,
      });

    return !error;
  }
}

