import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Board {
  id: string;
  name: string;
  user_id: string;
  organization_id: string | null;
  company_id: string | null;
  group_by_column_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useBoards() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBoards = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) {
      toast.error('Failed to load boards');
      console.error(error);
    } else {
      setBoards(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const createBoard = async (
    name: string = 'Untitled Board',
    company_id: string | null = null,
  ): Promise<Board | null> => {
    if (!user) return null;

    // Find user's primary org
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    const { data: board, error } = await supabase
      .from('boards')
      .insert({
        user_id: user.id,
        organization_id: orgMember?.organization_id ?? null,
        company_id,
        name,
      })
      .select()
      .single();

    if (error || !board) {
      toast.error('Failed to create board');
      console.error(error);
      return null;
    }

    // Create 3 default columns
    const defaultColumns = [
      { board_id: board.id, name: 'Item', position: 0 },
      { board_id: board.id, name: 'Status', position: 1 },
      { board_id: board.id, name: 'Notes', position: 2 },
    ];
    await supabase.from('board_columns').insert(defaultColumns);

    // Grant access to the creator (so they can see their own board)
    await supabase
      .from('board_member_access')
      .upsert(
        { board_id: board.id, user_id: user.id },
        { onConflict: 'board_id,user_id' }
      );

    await fetchBoards();
    toast.success('Board created');
    return board;
  };

  const renameBoard = async (id: string, name: string) => {
    const { error } = await supabase.from('boards').update({ name }).eq('id', id);
    if (error) {
      toast.error('Failed to rename board');
      return;
    }
    await fetchBoards();
  };

  const deleteBoard = async (id: string) => {
    const { error } = await supabase.from('boards').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete board');
      return;
    }
    toast.success('Board deleted');
    await fetchBoards();
  };

  return { boards, loading, createBoard, renameBoard, deleteBoard, refetch: fetchBoards };
}
