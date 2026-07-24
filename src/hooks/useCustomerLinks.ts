import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface CustomerLink {
  id: string;
  customer_id: string;
  user_id: string;
  label: string | null;
  url: string;
  created_at: string;
  updated_at: string;
}

export function useCustomerLinks(customerId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [links, setLinks] = useState<CustomerLink[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLinks = useCallback(async () => {
    if (!customerId) { setLinks([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('customer_links')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true });
    if (error) console.error('Error loading customer links:', error);
    else setLinks((data as CustomerLink[]) || []);
    setLoading(false);
  }, [customerId]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const addLink = async (url: string, label?: string) => {
    if (!user || !customerId || !url.trim()) return;
    const { error } = await supabase.from('customer_links').insert([{
      customer_id: customerId,
      user_id: user.id,
      url: url.trim(),
      label: label?.trim() || null,
    }]);
    if (error) {
      toast({ title: 'Error adding link', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchLinks();
  };

  const updateLink = async (id: string, updates: Partial<Pick<CustomerLink, 'url' | 'label'>>) => {
    const { error } = await supabase.from('customer_links').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Error updating link', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchLinks();
  };

  const removeLink = async (id: string) => {
    const { error } = await supabase.from('customer_links').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting link', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchLinks();
  };

  return { links, loading, addLink, updateLink, removeLink, refetch: fetchLinks };
}
