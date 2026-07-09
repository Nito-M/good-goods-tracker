import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface SopType {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  sort_order: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface SopTypeStats {
  sopCount: number;
  categoryCount: number;
  lastUpdated: string | null;
}

export function useSopTypes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [types, setTypes] = useState<SopType[]>([]);
  const [stats, setStats] = useState<Record<string, SopTypeStats>>({});
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: t }, { data: sopsData }, { data: catsData }] = await Promise.all([
      supabase.from('sop_types' as any).select('*').order('sort_order').order('name'),
      supabase.from('sops' as any).select('id, type_id, updated_at'),
      supabase.from('sop_categories' as any).select('id, type_id'),
    ]);
    setTypes((t as any) || []);
    const s: Record<string, SopTypeStats> = {};
    ((sopsData as any[]) || []).forEach(row => {
      const k = row.type_id || '__none__';
      if (!s[k]) s[k] = { sopCount: 0, categoryCount: 0, lastUpdated: null };
      s[k].sopCount++;
      if (!s[k].lastUpdated || row.updated_at > s[k].lastUpdated) s[k].lastUpdated = row.updated_at;
    });
    ((catsData as any[]) || []).forEach(row => {
      const k = row.type_id || '__none__';
      if (!s[k]) s[k] = { sopCount: 0, categoryCount: 0, lastUpdated: null };
      s[k].categoryCount++;
    });
    setStats(s);
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  const createType = async (input: Partial<SopType>) => {
    if (!user) return null;
    const nextOrder = (types[types.length - 1]?.sort_order ?? 0) + 1;
    const { data, error } = await supabase.from('sop_types' as any).insert({
      user_id: user.id,
      name: input.name || 'Untitled',
      description: input.description ?? null,
      icon: input.icon || 'BookOpen',
      color: input.color || '#3b82f6',
      sort_order: input.sort_order ?? nextOrder,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return null; }
    await refetch();
    return data as any;
  };

  const updateType = async (id: string, patch: Partial<SopType>) => {
    const { error } = await supabase.from('sop_types' as any).update(patch).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else await refetch();
  };

  const deleteType = async (id: string) => {
    const { error } = await supabase.from('sop_types' as any).delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else await refetch();
  };

  const reorderTypes = async (orderedIds: string[]) => {
    await Promise.all(orderedIds.map((id, idx) =>
      supabase.from('sop_types' as any).update({ sort_order: idx }).eq('id', id)
    ));
    await refetch();
  };

  return { types, stats, loading, refetch, createType, updateType, deleteType, reorderTypes };
}
