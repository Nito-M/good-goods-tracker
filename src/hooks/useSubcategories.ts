import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export function useSubcategories() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSubcategories = useCallback(async () => {
    if (!user) {
      setSubcategories([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading subcategories:', error);
        toast({
          title: 'Error loading subcategories',
          description: 'Unable to load subcategories. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      setSubcategories(data || []);
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    fetchSubcategories();
  }, [fetchSubcategories]);

  const getSubcategoriesForCategory = useCallback(
    (categoryId: string) => subcategories.filter((s) => s.category_id === categoryId),
    [subcategories]
  );

  const addSubcategory = async (categoryId: string, name: string) => {
    if (!user) return;

    const trimmed = name.trim();
    if (!trimmed) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    if (trimmed.length > 100) {
      toast({ title: 'Name must be less than 100 characters', variant: 'destructive' });
      return;
    }

    // Check duplicates within category
    const existing = subcategories.find(
      (s) => s.category_id === categoryId && s.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      toast({ title: 'Subcategory already exists in this category', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('subcategories').insert({
      category_id: categoryId,
      name: trimmed,
      user_id: user.id,
    });

    if (error) {
      console.error('Error adding subcategory:', error);
      toast({ title: 'Error adding subcategory', variant: 'destructive' });
      return;
    }

    toast({ title: 'Subcategory added successfully' });
    fetchSubcategories();
  };

  const updateSubcategory = async (id: string, newName: string) => {
    if (!user) return;

    const trimmed = newName.trim();
    if (!trimmed || trimmed.length > 100) {
      toast({ title: 'Invalid subcategory name', variant: 'destructive' });
      return;
    }

    const sub = subcategories.find((s) => s.id === id);
    if (!sub) return;

    // Check duplicate within same category
    const existing = subcategories.find(
      (s) => s.category_id === sub.category_id && s.id !== id && s.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) {
      toast({ title: 'Subcategory already exists in this category', variant: 'destructive' });
      return;
    }

    const oldName = sub.name;
    const { error } = await supabase.from('subcategories').update({ name: trimmed }).eq('id', id);
    if (error) {
      console.error('Error updating subcategory:', error);
      toast({ title: 'Error updating subcategory', variant: 'destructive' });
      return;
    }

    // Update inventory items with old subcategory name in this category
    if (oldName !== trimmed) {
      const parentCategory = subcategories.find((s) => s.id === id);
      if (parentCategory) {
        // We need the category name - find it from the category_id
        // For now update all items matching this subcategory name
        await supabase
          .from('inventory_items')
          .update({ subcategory: trimmed })
          .eq('subcategory', oldName);
      }
    }

    toast({ title: 'Subcategory updated successfully' });
    fetchSubcategories();
  };

  const deleteSubcategory = async (id: string) => {
    const { error } = await supabase.from('subcategories').delete().eq('id', id);

    if (error) {
      console.error('Error deleting subcategory:', error);
      toast({ title: 'Error deleting subcategory', variant: 'destructive' });
      return;
    }

    toast({ title: 'Subcategory deleted successfully' });
    fetchSubcategories();
  };

  return {
    subcategories,
    loading,
    getSubcategoriesForCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    refetch: fetchSubcategories,
  };
}
