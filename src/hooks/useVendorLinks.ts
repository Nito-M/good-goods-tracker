import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface VendorLink {
  id: string;
  vendor_id: string;
  user_id: string;
  label: string | null;
  url: string;
  created_at: string;
  updated_at: string;
}

export function useVendorLinks(vendorId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [links, setLinks] = useState<VendorLink[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLinks = useCallback(async () => {
    if (!vendorId) { setLinks([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('vendor_links')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: true });
    if (error) console.error('Error loading vendor links:', error);
    else setLinks((data as VendorLink[]) || []);
    setLoading(false);
  }, [vendorId]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const addLink = async (url: string, label?: string) => {
    if (!user || !vendorId || !url.trim()) return;
    const { error } = await supabase.from('vendor_links').insert([{
      vendor_id: vendorId,
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

  const updateLink = async (id: string, updates: Partial<Pick<VendorLink, 'url' | 'label'>>) => {
    const { error } = await supabase.from('vendor_links').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Error updating link', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchLinks();
  };

  const removeLink = async (id: string) => {
    const { error } = await supabase.from('vendor_links').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting link', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchLinks();
  };

  return { links, loading, addLink, updateLink, removeLink, refetch: fetchLinks };
}
