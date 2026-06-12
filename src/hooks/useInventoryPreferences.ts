import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type InventoryPriceDisplay = 'selling' | 'cost';

export function useInventoryPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-preferences'],
    queryFn: async (): Promise<{ priceDisplay: InventoryPriceDisplay }> => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return { priceDisplay: 'selling' };
      const { data, error } = await supabase
        .from('profiles')
        .select('inventory_price_display')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      const val = (data as any)?.inventory_price_display as InventoryPriceDisplay | undefined;
      return { priceDisplay: val === 'cost' ? 'cost' : 'selling' };
    },
    staleTime: 5 * 60_000,
  });

  const mutation = useMutation({
    mutationFn: async (priceDisplay: InventoryPriceDisplay) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase
        .from('profiles')
        .update({ inventory_price_display: priceDisplay } as any)
        .eq('user_id', userId);
      if (error) throw error;
      return priceDisplay;
    },
    onSuccess: (priceDisplay) => {
      queryClient.setQueryData(['inventory-preferences'], { priceDisplay });
      toast({ title: 'Inventory settings saved' });
    },
    onError: (e: any) => {
      toast({ title: 'Failed to save', description: e?.message, variant: 'destructive' });
    },
  });

  return {
    priceDisplay: data?.priceDisplay ?? 'selling',
    loading: isLoading,
    setPriceDisplay: (v: InventoryPriceDisplay) => mutation.mutate(v),
    saving: mutation.isPending,
  };
}
