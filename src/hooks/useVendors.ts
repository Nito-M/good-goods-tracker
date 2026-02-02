import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Vendor {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchVendors = useCallback(async () => {
    if (!user) {
      setVendors([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast({
        title: 'Error loading vendors',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    setVendors(data || []);
    setLoading(false);
  }, [toast, user]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const addVendor = async (vendor: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    const { error } = await supabase.from('vendors').insert({
      ...vendor,
      user_id: user.id,
    });

    if (error) {
      toast({
        title: 'Error adding vendor',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Vendor added successfully' });
    fetchVendors();
  };

  const updateVendor = async (id: string, updates: Partial<Vendor>) => {
    const { error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error updating vendor',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Vendor updated successfully' });
    fetchVendors();
  };

  const deleteVendor = async (id: string) => {
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error deleting vendor',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Vendor deleted successfully' });
    fetchVendors();
  };

  return {
    vendors,
    loading,
    addVendor,
    updateVendor,
    deleteVendor,
    refetch: fetchVendors,
  };
}
