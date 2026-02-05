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
      .order('updated_at', { ascending: false });

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

  const upsertPrice = async (vendorId: string, price: number, link?: string) => {
    if (!user || !itemId) return false;

    // Check if record exists
    const existing = prices.find(p => p.vendor_id === vendorId);

    if (existing) {
      const { error } = await supabase
        .from('item_vendor_prices')
        .update({ price, link: link || null, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating vendor price:', error);
        toast({
          title: 'Error updating vendor price',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }
    } else {
      const { error } = await supabase
        .from('item_vendor_prices')
        .insert({
          item_id: itemId,
          vendor_id: vendorId,
          price,
          link: link || null,
          user_id: user.id,
        });

      if (error) {
        console.error('Error adding vendor price:', error);
        toast({
          title: 'Error adding vendor price',
          description: error.message,
          variant: 'destructive',
        });
        return false;
      }
    }

    await fetchPrices();
    return true;
  };

  const deletePrice = async (vendorId: string) => {
    if (!user || !itemId) return;

    const { error } = await supabase
      .from('item_vendor_prices')
      .delete()
      .eq('item_id', itemId)
      .eq('vendor_id', vendorId);

    if (error) {
      console.error('Error deleting vendor price:', error);
      toast({
        title: 'Error removing vendor',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    await fetchPrices();
    toast({ title: 'Vendor removed from item' });
  };

  const getVendorPrice = (vendorId: string): number | null => {
    const found = prices.find(p => p.vendor_id === vendorId);
    return found ? found.price : null;
  };

  return {
    prices,
    loading,
    upsertPrice,
    deletePrice,
    getVendorPrice,
    refetch: fetchPrices,
  };
}

// Static function to update vendor price from PO (can be called without hook context)
export async function updateVendorPriceFromPO(
  userId: string,
  itemId: string,
  vendorId: string,
  price: number
): Promise<boolean> {
  // Check if record exists
  const { data: existing } = await supabase
    .from('item_vendor_prices')
    .select('id')
    .eq('item_id', itemId)
    .eq('vendor_id', vendorId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('item_vendor_prices')
      .update({ price, updated_at: new Date().toISOString() })
      .eq('id', existing.id);

    return !error;
  } else {
    const { error } = await supabase
      .from('item_vendor_prices')
      .insert({
        item_id: itemId,
        vendor_id: vendorId,
        price,
        user_id: userId,
      });

    return !error;
  }
}
