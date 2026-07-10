import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  link: string | null;
  color: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}


export function useCustomers() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['customers', user?.id] as const;

  const { data, isPending, refetch } = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async () => {
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
        throw error;
      }
      return (data || []) as Customer[];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

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
    invalidate();
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
    invalidate();
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
    invalidate();
  };

  return {
    customers: data ?? [],
    loading: !!user && isPending,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: () => refetch().then(() => undefined),
  };
}
