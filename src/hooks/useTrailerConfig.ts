import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface TrailerType {
  id: string;
  user_id: string;
  name: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssemblyComponent {
  id: string;
  user_id: string;
  name: string;
  category: 'front_end' | 'back_end' | 'deck_type';
  image_url: string | null;
  price: number;
  compatible_trailer_type_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface PrebuiltAssembly {
  id: string;
  user_id: string;
  trailer_type_id: string;
  front_end_id: string | null;
  back_end_id: string | null;
  deck_type_id: string | null;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export function useTrailerTypes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [types, setTypes] = useState<TrailerType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('trailer_types')
      .select('*')
      .order('name');
    if (error) console.error(error);
    else setTypes((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [user]);

  const create = async (name: string, image_url?: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('trailer_types')
      .insert({ user_id: user.id, name, image_url: image_url || null } as any)
      .select()
      .single();
    if (error) { toast({ title: 'Error', description: 'Failed to create trailer type.', variant: 'destructive' }); return null; }
    await fetch();
    return data as TrailerType;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('trailer_types').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
    else await fetch();
  };

  return { types, loading, create, remove, refetch: fetch };
}

export function useAssemblyComponents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [components, setComponents] = useState<AssemblyComponent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('assembly_components')
      .select('*')
      .order('name');
    if (error) console.error(error);
    else setComponents((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [user]);

  const create = async (comp: { name: string; category: string; image_url?: string; price?: number; compatible_trailer_type_ids?: string[] }) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('assembly_components')
      .insert({
        user_id: user.id,
        name: comp.name,
        category: comp.category,
        image_url: comp.image_url || null,
        price: comp.price ?? 0,
        compatible_trailer_type_ids: comp.compatible_trailer_type_ids || [],
      } as any)
      .select()
      .single();
    if (error) { toast({ title: 'Error', description: 'Failed to create component.', variant: 'destructive' }); return null; }
    await fetch();
    return data as AssemblyComponent;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('assembly_components').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
    else await fetch();
  };

  const getByCategory = (category: string, trailerTypeId?: string) => {
    return components.filter(c => {
      if (c.category !== category) return false;
      if (trailerTypeId && c.compatible_trailer_type_ids.length > 0) {
        return c.compatible_trailer_type_ids.includes(trailerTypeId);
      }
      return true;
    });
  };

  return { components, loading, create, remove, getByCategory, refetch: fetch };
}

export function usePrebuiltAssemblies() {
  const { user } = useAuth();
  const { toast } = useToast();

  const save = async (config: { trailer_type_id: string; front_end_id?: string | null; back_end_id?: string | null; deck_type_id?: string | null; total_price: number }) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('prebuilt_assemblies')
      .insert({
        user_id: user.id,
        ...config,
      } as any)
      .select()
      .single();
    if (error) { toast({ title: 'Error', description: 'Failed to save configuration.', variant: 'destructive' }); return null; }
    toast({ title: 'Saved', description: 'Trailer configuration saved.' });
    return data as PrebuiltAssembly;
  };

  const lookup = async (config: {
    trailer_type_id: string;
    front_end_id: string | null;
    back_end_id: string | null;
    deck_type_id: string | null;
  }): Promise<PrebuiltAssembly | null> => {
    if (!user) return null;
    let query = supabase
      .from('prebuilt_assemblies')
      .select('*')
      .eq('trailer_type_id', config.trailer_type_id);

    if (config.front_end_id) query = query.eq('front_end_id', config.front_end_id);
    else query = query.is('front_end_id', null);

    if (config.back_end_id) query = query.eq('back_end_id', config.back_end_id);
    else query = query.is('back_end_id', null);

    if (config.deck_type_id) query = query.eq('deck_type_id', config.deck_type_id);
    else query = query.is('deck_type_id', null);

    const { data } = await query.limit(1).maybeSingle();
    return (data as PrebuiltAssembly) || null;
  };

  return { save, lookup };
}
