import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { customerSchema, validateInput } from '@/lib/validation';

export interface Customer {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCustomers = useCallback(async () => {
    if (!user) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading customers:', error);
      toast({
        title: 'Error loading customers',
        description: 'Unable to load customers. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    setCustomers((data as Customer[]) || []);
    setLoading(false);
  }, [toast, user]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const addCustomer = async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    const validation = validateInput(customerSchema, customer);
    if (!validation.success) {
      toast({
        title: 'Validation error',
        description: validation.errors[0],
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('customers').insert([{
      name: validation.data.name,
      company: validation.data.company ?? null,
      phone: validation.data.phone ?? null,
      email: validation.data.email ?? null,
      address: validation.data.address ?? null,
      notes: validation.data.notes ?? null,
      user_id: user.id,
    }]);

    if (error) {
      console.error('Error adding customer:', error);
      toast({
        title: 'Error adding customer',
        description: 'Unable to add customer. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Customer added successfully' });
    fetchCustomers();
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    const partialSchema = customerSchema.partial();
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
      .from('customers')
      .update(validation.data)
      .eq('id', id);

    if (error) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error updating customer',
        description: 'Unable to update customer. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Customer updated successfully' });
    fetchCustomers();
  };

  const deleteCustomer = async (id: string) => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error deleting customer',
        description: 'Unable to delete customer. It may be in use by other records.',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Customer deleted successfully' });
    fetchCustomers();
  };

  return {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers,
  };
}
