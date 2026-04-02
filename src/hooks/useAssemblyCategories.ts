import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface AssemblyCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export function useAssemblyCategories() {
  const [categories, setCategories] = useState<AssemblyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCategories = useCallback(async () => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('assembly_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading assembly categories:', error);
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (name: string) => {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: 'Category already exists', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('assembly_categories').insert({
      name: trimmed,
      user_id: user.id,
    });

    if (error) {
      console.error('Error adding assembly category:', error);
      toast({ title: 'Error adding category', variant: 'destructive' });
      return;
    }

    toast({ title: 'Assembly category added' });
    fetchCategories();
  };

  const updateCategory = async (id: string, newName: string) => {
    if (!user) return;
    const trimmed = newName.trim();
    if (!trimmed) return;

    const oldCategory = categories.find(c => c.id === id);
    if (!oldCategory) return;

    if (trimmed === oldCategory.name) return;

    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== id)) {
      toast({ title: 'Category already exists', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('assembly_categories').update({ name: trimmed }).eq('id', id);
    if (error) {
      toast({ title: 'Error updating category', variant: 'destructive' });
      return;
    }

    // Update all assemblies with the old type name
    await supabase
      .from('assemblies')
      .update({ type: trimmed })
      .eq('type', oldCategory.name);

    toast({ title: 'Assembly category renamed' });
    fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    // Move assemblies to "General"
    await supabase
      .from('assemblies')
      .update({ type: 'General' })
      .eq('type', cat.name);

    const { error } = await supabase.from('assembly_categories').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting category', variant: 'destructive' });
      return;
    }

    toast({ title: 'Category deleted', description: 'Assemblies moved to General' });
    fetchCategories();
  };

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
