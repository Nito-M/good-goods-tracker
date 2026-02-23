import { useState, useEffect, useCallback } from 'react';
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
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchWarehouses = useCallback(async () => {
    if (!user) {
      setWarehouses([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching warehouses:', error);
    } else {
      setWarehouses((data as Warehouse[]) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

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

    setWarehouses((prev) => [...prev, data as Warehouse].sort((a, b) => a.name.localeCompare(b.name)));
    toast({ title: 'Location created' });
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

    setWarehouses((prev) =>
      prev.map((w) => (w.id === id ? { ...w, name, description: description || null } : w))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    toast({ title: 'Location updated' });
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

    setWarehouses((prev) => prev.filter((w) => w.id !== id));
    toast({ title: 'Location deleted' });
  };

  return { warehouses, loading, addWarehouse, updateWarehouse, deleteWarehouse, refetch: fetchWarehouses };
}
