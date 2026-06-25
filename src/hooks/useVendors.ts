import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  category: string | null;
  created_at: string;
  updated_at: string;
}

export function useVendors() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['vendors', user?.id] as const;

  const { data, isPending, refetch } = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async () => {
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
        throw error;
      }
      return (data || []) as Vendor[];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const addVendor = async (vendor: Partial<Omit<Vendor, 'id' | 'created_at' | 'updated_at'>> & { name: string }) => {
    if (!user) return;

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
      color: (vendor as any).color ?? null,
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
    invalidate();
  };

  const updateVendor = async (id: string, updates: Partial<Vendor>) => {
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

    const updateData: Record<string, any> = { ...validation.data };
    if ('color' in updates) updateData.color = updates.color;

    const { error } = await supabase
      .from('vendors')
      .update(updateData)
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
    invalidate();
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
    invalidate();
  };

  return {
    vendors: data ?? [],
    loading: !!user && isPending,
    addVendor,
    updateVendor,
    deleteVendor,
    refetch: () => refetch().then(() => undefined),
  };
}
