import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type InventoryPriceDisplay = 'selling' | 'cost';

export interface InventoryPreferences {
  priceDisplay: InventoryPriceDisplay;
  showTags: boolean;
  showImages: boolean;
  showSku: boolean;
  showQuantity: boolean;
  showPrice: boolean;
}

export function useInventoryPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-preferences'],
    queryFn: async (): Promise<InventoryPreferences> => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return { priceDisplay: 'selling', showTags: true, showImages: true, showSku: true };
      const { data, error } = await supabase
        .from('profiles')
        .select('inventory_price_display, inventory_show_tags, inventory_show_images, inventory_show_sku')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      const row = data as any;
      const val = row?.inventory_price_display as InventoryPriceDisplay | undefined;
      return {
        priceDisplay: val === 'cost' ? 'cost' : 'selling',
        showTags: row?.inventory_show_tags !== false,
        showImages: row?.inventory_show_images !== false,
        showSku: row?.inventory_show_sku !== false,
      };
    },
    staleTime: 5 * 60_000,
  });

  const priceMutation = useMutation({
    mutationFn: async (priceDisplay: InventoryPriceDisplay) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('profiles')
        .update({ inventory_price_display: priceDisplay } as any)
        .eq('user_id', userId);
      if (error) throw error;
      return { priceDisplay };
    },
    onSuccess: (vars) => {
      queryClient.setQueryData(['inventory-preferences'], (old: InventoryPreferences | undefined) => ({
        priceDisplay: vars.priceDisplay,
        showTags: old?.showTags ?? true,
        showImages: old?.showImages ?? true,
        showSku: old?.showSku ?? true,
      }));
      toast({ title: 'Inventory settings saved' });
    },
    onError: (e: any) => {
      toast({ title: 'Failed to save', description: e?.message, variant: 'destructive' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (input: { showTags?: boolean; showImages?: boolean; showSku?: boolean }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not signed in');
      const updateData: Record<string, unknown> = {};
      if (input.showTags !== undefined) updateData.inventory_show_tags = input.showTags;
      if (input.showImages !== undefined) updateData.inventory_show_images = input.showImages;
      if (input.showSku !== undefined) updateData.inventory_show_sku = input.showSku;
      const { error } = await supabase.from('profiles').update(updateData as any).eq('user_id', userId);
      if (error) throw error;
      return input;
    },
    onSuccess: (input) => {
      queryClient.setQueryData(['inventory-preferences'], (old: InventoryPreferences | undefined) => ({
        priceDisplay: old?.priceDisplay ?? 'selling',
        showTags: input.showTags !== undefined ? input.showTags : (old?.showTags ?? true),
        showImages: input.showImages !== undefined ? input.showImages : (old?.showImages ?? true),
        showSku: input.showSku !== undefined ? input.showSku : (old?.showSku ?? true),
      }));
      toast({ title: 'Inventory settings saved' });
    },
    onError: (e: any) => {
      toast({ title: 'Failed to save', description: e?.message, variant: 'destructive' });
    },
  });

  return {
    priceDisplay: data?.priceDisplay ?? 'selling',
    showTags: data?.showTags ?? true,
    showImages: data?.showImages ?? true,
    showSku: data?.showSku ?? true,
    loading: isLoading,
    setPriceDisplay: (v: InventoryPriceDisplay) => priceMutation.mutate(v),
    setShowTags: (v: boolean) => toggleMutation.mutate({ showTags: v }),
    setShowImages: (v: boolean) => toggleMutation.mutate({ showImages: v }),
    setShowSku: (v: boolean) => toggleMutation.mutate({ showSku: v }),
    saving: priceMutation.isPending || toggleMutation.isPending,
  };
}
