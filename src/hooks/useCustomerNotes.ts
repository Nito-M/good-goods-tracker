import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface CustomerNote {
  id: string;
  customerId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

function mapRow(r: any): CustomerNote {
  return {
    id: r.id,
    customerId: r.customer_id,
    userId: r.user_id,
    content: r.content || '',
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export function useCustomerNotes(customerId: string | undefined) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!customerId) { setNotes([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('customer_notes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (error) console.error('Error loading customer notes', error);
    else setNotes((data || []).map(mapRow));
    setLoading(false);
  }, [customerId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const addNote = async (content: string) => {
    if (!customerId || !user) return;
    const { data, error } = await supabase
      .from('customer_notes')
      .insert({ customer_id: customerId, user_id: user.id, content })
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
      .from('customer_notes')
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
    const { error } = await supabase.from('customer_notes').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return { notes, loading, addNote, updateNote, deleteNote };
}
