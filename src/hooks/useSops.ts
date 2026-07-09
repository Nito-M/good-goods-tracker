import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface SopCategory {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface SopListItem {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  sop_number: string | null;
  department: string | null;
  revision_number: string | null;
  effective_date: string | null;
  last_updated_date: string | null;
  author: string | null;
  approved_by: string | null;
  status: 'draft' | 'active' | 'obsolete';
  created_at: string;
  updated_at: string;
}

export function useSops() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<SopCategory[]>([]);
  const [sops, setSops] = useState<SopListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: cats }, { data: rows }] = await Promise.all([
      supabase.from('sop_categories' as any).select('*').order('sort_order').order('name'),
      supabase.from('sops' as any).select('*').order('updated_at', { ascending: false }),
    ]);
    setCategories((cats as any) || []);
    setSops((rows as any) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  const createCategory = async (name: string, parentId: string | null) => {
    if (!user) return null;
    const { data, error } = await supabase.from('sop_categories' as any)
      .insert({ user_id: user.id, name, parent_id: parentId })
      .select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return null; }
    await refetch();
    return data as any;
  };

  const renameCategory = async (id: string, name: string) => {
    const { error } = await supabase.from('sop_categories' as any).update({ name }).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else await refetch();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('sop_categories' as any).delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else await refetch();
  };

  const createSop = async (title: string, categoryId: string | null) => {
    if (!user) return null;
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase.from('sops' as any).insert({
      user_id: user.id, title, category_id: categoryId,
      status: 'draft', last_updated_date: today,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return null; }
    await refetch();
    return data as any;
  };

  const deleteSop = async (id: string) => {
    const { error } = await supabase.from('sops' as any).delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else await refetch();
  };

  return { categories, sops, loading, refetch,
    createCategory, renameCategory, deleteCategory, createSop, deleteSop };
}
