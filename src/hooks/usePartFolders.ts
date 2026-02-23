import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PartFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: Date;
}

export function usePartFolders() {
  const [folders, setFolders] = useState<PartFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFolders = useCallback(async () => {
    if (!user) { setFolders([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('part_folders')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast({ title: 'Error loading folders', description: error.message, variant: 'destructive' });
    } else {
      setFolders((data || []).map(d => ({
        id: d.id,
        name: d.name,
        parentId: d.parent_id,
        createdAt: new Date(d.created_at),
      })));
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  const addFolder = async (name: string, parentId: string | null) => {
    if (!user) return null;
    const { data, error } = await supabase.from('part_folders').insert({
      user_id: user.id,
      name,
      parent_id: parentId,
    }).select().single();
    if (error) {
      toast({ title: 'Error creating folder', description: error.message, variant: 'destructive' });
      return null;
    }
    await fetchFolders();
    return data?.id || null;
  };

  const renameFolder = async (id: string, name: string) => {
    const { error } = await supabase.from('part_folders').update({ name }).eq('id', id);
    if (error) {
      toast({ title: 'Error renaming folder', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchFolders();
    return true;
  };

  const deleteFolder = async (id: string) => {
    const { error } = await supabase.from('part_folders').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting folder', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchFolders();
    return true;
  };

  const getFoldersInParent = (parentId: string | null) =>
    folders.filter(f => f.parentId === parentId);

  const getBreadcrumb = (folderId: string | null): PartFolder[] => {
    const trail: PartFolder[] = [];
    let current = folderId;
    while (current) {
      const folder = folders.find(f => f.id === current);
      if (!folder) break;
      trail.unshift(folder);
      current = folder.parentId;
    }
    return trail;
  };

  return { folders, loading, addFolder, renameFolder, deleteFolder, getFoldersInParent, getBreadcrumb, refetch: fetchFolders };
}
