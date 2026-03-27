import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface VendorContact {
  id: string;
  vendor_id: string;
  name: string;
  job_position: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export function useVendorContacts(vendorId: string | undefined) {
  const [contacts, setContacts] = useState<VendorContact[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchContacts = useCallback(async () => {
    if (!user || !vendorId) {
      setContacts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('vendor_contacts')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('is_primary', { ascending: false })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading vendor contacts:', error);
      setLoading(false);
      return;
    }

    setContacts((data as VendorContact[]) || []);
    setLoading(false);
  }, [user, vendorId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const addContact = async (contact: Omit<VendorContact, 'id' | 'created_at' | 'updated_at' | 'vendor_id'>) => {
    if (!user || !vendorId) return;

    const { error } = await supabase.from('vendor_contacts').insert([{
      vendor_id: vendorId,
      user_id: user.id,
      name: contact.name,
      job_position: contact.job_position,
      email: contact.email,
      phone: contact.phone,
      notes: contact.notes,
      is_primary: contact.is_primary,
    }]);

    if (error) {
      console.error('Error adding contact:', error);
      toast({ title: 'Error adding contact', variant: 'destructive' });
      return;
    }

    toast({ title: 'Contact added' });
    fetchContacts();
  };

  const updateContact = async (id: string, updates: Partial<VendorContact>) => {
    if (!user) return;

    const { error } = await supabase
      .from('vendor_contacts')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating contact:', error);
      toast({ title: 'Error updating contact', variant: 'destructive' });
      return;
    }

    toast({ title: 'Contact updated' });
    fetchContacts();
  };

  const deleteContact = async (id: string) => {
    const { error } = await supabase
      .from('vendor_contacts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting contact:', error);
      toast({ title: 'Error deleting contact', variant: 'destructive' });
      return;
    }

    toast({ title: 'Contact deleted' });
    fetchContacts();
  };

  return { contacts, loading, addContact, updateContact, deleteContact, refetch: fetchContacts };
}
