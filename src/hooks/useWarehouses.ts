import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Warehouse {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useWarehouses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ['warehouses', user?.id] as const;

  const { data, isPending, refetch } = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('name');
      if (error) {
        console.error('Error fetching warehouses:', error);
        throw error;
      }
      return (data || []) as Warehouse[];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const addWarehouse = async (name: string, description?: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('warehouses')
      .insert({ name, description: description || null, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error creating location', variant: 'destructive' });
      return null;
    }

    toast({ title: 'Location created' });
    invalidate();
    return data as Warehouse;
  };

  const updateWarehouse = async (id: string, name: string, description?: string) => {
    const { error } = await supabase
      .from('warehouses')
      .update({ name, description: description || null })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error updating location', variant: 'destructive' });
      return;
    }

    toast({ title: 'Location updated' });
    invalidate();
  };

  const deleteWarehouse = async (id: string) => {
    const { error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Error deleting location', variant: 'destructive' });
      return;
    }

    toast({ title: 'Location deleted' });
    invalidate();
  };

  return {
    warehouses: data ?? [],
    loading: !!user && isPending,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
    refetch: () => refetch().then(() => undefined),
  };
}
