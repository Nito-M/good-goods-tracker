import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface CustomerContact {
  id: string;
  customer_id: string;
  name: string;
  job_position: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export function useCustomerContacts(customerId: string | undefined) {
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchContacts = useCallback(async () => {
    if (!user || !customerId) {
      setContacts([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('customer_contacts')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true });
    if (error) {
      console.error('Error loading customer contacts:', error);
      setLoading(false);
      return;
    }
    setContacts((data as CustomerContact[]) || []);
    setLoading(false);
  }, [user, customerId]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const addContact = async (contact: Omit<CustomerContact, 'id' | 'created_at' | 'updated_at' | 'customer_id'>) => {
    if (!user || !customerId) return;
    const { error } = await supabase.from('customer_contacts').insert([{
      customer_id: customerId,
      user_id: user.id,
      name: contact.name,
      job_position: contact.job_position,
      email: contact.email,
      phone: contact.phone,
      notes: contact.notes,
      is_primary: contact.is_primary,
    }]);
    if (error) {
      toast({ title: 'Error adding contact', variant: 'destructive' });
      return;
    }
    toast({ title: 'Contact added' });
    fetchContacts();
  };

  const updateContact = async (id: string, updates: Partial<CustomerContact>) => {
    if (!user) return;
    const { error } = await supabase.from('customer_contacts').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Error updating contact', variant: 'destructive' });
      return;
    }
    toast({ title: 'Contact updated' });
    fetchContacts();
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase.from('customer_contacts').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting contact', variant: 'destructive' });
      return;
    }
    toast({ title: 'Contact deleted' });
    fetchContacts();
  };

  return { contacts, loading, addContact, updateContact, deleteContact, refetch: fetchContacts };
}
