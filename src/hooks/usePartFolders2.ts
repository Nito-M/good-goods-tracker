import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PartFolder2 {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  createdAt: Date;
}

export function usePartFolders2() {
  const [folders, setFolders] = useState<PartFolder2[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFolders = useCallback(async () => {
    if (!user) { setFolders([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('part_folders_2' as any)
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast({ title: 'Error loading folders', description: error.message, variant: 'destructive' });
    } else {
      setFolders((data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        parentId: d.parent_id,
        createdAt: new Date(d.created_at),
      })));
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  const addFolder = async (name: string, parentId: string | null, description?: string | null) => {
    if (!user) return null;
    const { data, error } = await supabase.from('part_folders_2' as any).insert({
      user_id: user.id,
      name,
      description,
      parent_id: parentId,
    } as any).select().single();
    if (error) {
      toast({ title: 'Error creating folder', description: error.message, variant: 'destructive' });
      return null;
    }
    await fetchFolders();
    return (data as any)?.id || null;
  };

  const renameFolder = async (id: string, name: string, description?: string | null) => {
    const updateData: Record<string, any> = { name };
    if (description !== undefined) updateData.description = description;
    const { error } = await supabase.from('part_folders_2' as any).update(updateData as any).eq('id', id);
    if (error) {
      toast({ title: 'Error updating folder', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchFolders();
    return true;
  };

  const deleteFolder = async (id: string) => {
    const { error } = await supabase.from('part_folders_2' as any).delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting folder', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchFolders();
    return true;
  };

  const moveFolder = async (id: string, newParentId: string | null) => {
    if (id === newParentId) return false;
    let check = newParentId;
    while (check) {
      if (check === id) {
        toast({ title: 'Cannot move folder', description: 'A folder cannot be moved into its own subfolder.', variant: 'destructive' });
        return false;
      }
      const parent = folders.find(f => f.id === check);
      check = parent?.parentId ?? null;
    }
    const { error } = await supabase.from('part_folders_2' as any).update({ parent_id: newParentId } as any).eq('id', id);
    if (error) {
      toast({ title: 'Error moving folder', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchFolders();
    return true;
  };

  const getFoldersInParent = (parentId: string | null) =>
    folders.filter(f => f.parentId === parentId);

  const getBreadcrumb = (folderId: string | null): PartFolder2[] => {
    const trail: PartFolder2[] = [];
    let current = folderId;
    while (current) {
      const folder = folders.find(f => f.id === current);
      if (!folder) break;
      trail.unshift(folder);
      current = folder.parentId;
    }
    return trail;
  };

  return { folders, loading, addFolder, renameFolder, deleteFolder, moveFolder, getFoldersInParent, getBreadcrumb, refetch: fetchFolders };
}
