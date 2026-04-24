import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface AssemblyModel {
  id: string;
  user_id: string;
  type: string;
  name: string;
  created_at: string;
}

export function useAssemblyModels(type: string | null) {
  const [models, setModels] = useState<AssemblyModel[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchModels = useCallback(async () => {
    if (!user || !type) {
      setModels([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('assembly_models')
      .select('*')
      .eq('type', type)
      .order('name', { ascending: true });
    if (error) {
      console.error('Error loading assembly models:', error);
    } else {
      setModels((data || []) as AssemblyModel[]);
    }
    setLoading(false);
  }, [user, type]);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const addModel = async (name: string): Promise<AssemblyModel | null> => {
    if (!user || !type) return null;
    const trimmed = name.trim();
    if (!trimmed) return null;
    if (models.some(m => m.name.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: 'Model already exists', variant: 'destructive' });
      return null;
    }
    const { data, error } = await (supabase as any)
      .from('assembly_models')
      .insert({ name: trimmed, type, user_id: user.id })
      .select()
      .single();
    if (error) {
      toast({ title: 'Error adding model', variant: 'destructive' });
      return null;
    }
    toast({ title: 'Model added' });
    await fetchModels();
    return data as AssemblyModel;
  };

  const renameModel = async (id: string, newName: string) => {
    const trimmed = newName.trim();
    const old = models.find(m => m.id === id);
    if (!trimmed || !old || trimmed === old.name) return;
    if (models.some(m => m.id !== id && m.name.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: 'Model already exists', variant: 'destructive' });
      return;
    }
    const { error } = await (supabase as any)
      .from('assembly_models')
      .update({ name: trimmed })
      .eq('id', id);
    if (error) {
      toast({ title: 'Error renaming model', variant: 'destructive' });
      return;
    }
    // Update assemblies referencing the old model name within this type
    if (type) {
      await (supabase as any)
        .from('assemblies')
        .update({ model: trimmed })
        .eq('type', type)
        .eq('model', old.name);
    }
    toast({ title: 'Model renamed' });
    await fetchModels();
  };

  const deleteModel = async (id: string) => {
    const m = models.find(x => x.id === id);
    if (!m || !type) return;
    // Clear model on assemblies that used it
    await (supabase as any)
      .from('assemblies')
      .update({ model: null })
      .eq('type', type)
      .eq('model', m.name);
    const { error } = await (supabase as any).from('assembly_models').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting model', variant: 'destructive' });
      return;
    }
    toast({ title: 'Model deleted' });
    await fetchModels();
  };

  return { models, loading, addModel, renameModel, deleteModel, refetch: fetchModels };
}
