import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { vendorSchema, validateInput } from '@/lib/validation';

export interface Vendor {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  notes: string | null;
  link: string | null;
  color: string | null;
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
      console.error('Error loading vendors:', error);
      toast({
        title: 'Error loading vendors',
        description: 'Unable to load vendors. Please try again.',
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

    // Validate input
    const validation = validateInput(vendorSchema, vendor);
    if (!validation.success) {
      toast({
        title: 'Validation error',
        description: validation.errors[0],
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('vendors').insert([{
      name: validation.data.name,
      contact_email: validation.data.contact_email ?? null,
      contact_phone: validation.data.contact_phone ?? null,
      address: validation.data.address ?? null,
      notes: validation.data.notes ?? null,
      link: validation.data.link ?? null,
      user_id: user.id,
    }]);

    if (error) {
      console.error('Error adding vendor:', error);
      toast({
        title: 'Error adding vendor',
        description: 'Unable to add vendor. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Vendor added successfully' });
    fetchVendors();
  };

  const updateVendor = async (id: string, updates: Partial<Vendor>) => {
    // Validate partial update - only validate provided fields
    const partialSchema = vendorSchema.partial();
    const validation = validateInput(partialSchema, updates);
    if (!validation.success) {
      toast({
        title: 'Validation error',
        description: validation.errors[0],
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('vendors')
      .update(validation.data)
      .eq('id', id);

    if (error) {
      console.error('Error updating vendor:', error);
      toast({
        title: 'Error updating vendor',
        description: 'Unable to update vendor. Please try again.',
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
      console.error('Error deleting vendor:', error);
      toast({
        title: 'Error deleting vendor',
        description: 'Unable to delete vendor. It may be in use by other records.',
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
