import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface VendorNote {
  id: string;
  vendorId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

function mapRow(r: any): VendorNote {
  return {
    id: r.id,
    vendorId: r.vendor_id,
    userId: r.user_id,
    content: r.content || '',
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export function useVendorNotes(vendorId: string | undefined) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<VendorNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!vendorId) {
      setNotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('vendor_notes')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading vendor notes', error);
    } else {
      setNotes((data || []).map(mapRow));
    }
    setLoading(false);
  }, [vendorId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (content: string) => {
    if (!vendorId || !user) return;
    const { data, error } = await supabase
      .from('vendor_notes')
      .insert({ vendor_id: vendorId, user_id: user.id, content })
      .select()
      .single();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setNotes((prev) => [mapRow(data), ...prev]);
  };

  const updateNote = async (id: string, content: string) => {
    const { data, error } = await supabase
      .from('vendor_notes')
      .update({ content })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setNotes((prev) => prev.map((n) => (n.id === id ? mapRow(data) : n)));
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('vendor_notes').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return { notes, loading, addNote, updateNote, deleteNote };
}
