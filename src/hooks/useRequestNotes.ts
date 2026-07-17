import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface RequestNote {
  id: string;
  requestNumber: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

function mapRow(r: any): RequestNote {
  return {
    id: r.id,
    requestNumber: r.request_number,
    userId: r.user_id,
    content: r.content || '',
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export function useRequestNotes(requestNumber: string | undefined) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<RequestNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!requestNumber) {
      setNotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('request_notes')
      .select('*')
      .eq('request_number', requestNumber)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error loading request notes', error);
    } else {
      setNotes((data || []).map(mapRow));
    }
    setLoading(false);
  }, [requestNumber]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (content: string) => {
    if (!requestNumber || !user) return;
    const { data, error } = await supabase
      .from('request_notes')
      .insert({ request_number: requestNumber, user_id: user.id, content })
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
      .from('request_notes')
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
    const { error } = await supabase.from('request_notes').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return { notes, loading, addNote, updateNote, deleteNote };
}
