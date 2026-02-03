import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_CATEGORY_NAMES } from '@/types/inventory';
import { categorySchema, validateInput } from '@/lib/validation';

export interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCategories = useCallback(async () => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        toast({
          title: 'Error loading categories',
          description: error.message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // If no categories exist, seed with defaults
      if (!data || data.length === 0) {
        const categoriesToInsert = DEFAULT_CATEGORY_NAMES.map((name) => ({
          name,
          user_id: user.id,
        }));

        const { error: seedError } = await supabase.from('categories').insert(categoriesToInsert);
        if (seedError) {
          console.error('Error seeding default categories:', seedError);
        }

        // Re-fetch after seeding
        const { data: seededData } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });
        setCategories(seededData || []);
      } else {
        setCategories(data);
      }
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // All categories come from the database now
  const allCategories = categories.map((c) => c.name);

  const addCategory = async (name: string) => {
    if (!user) return;

    // Validate input
    const validation = validateInput(categorySchema, { name });
    if (!validation.success) {
      toast({
        title: 'Validation error',
        description: validation.errors[0],
        variant: 'destructive',
      });
      return;
    }

    const trimmedName = validation.data.name.trim();

    if (allCategories.includes(trimmedName)) {
      toast({
        title: 'Category exists',
        description: 'This category already exists.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('categories').insert({
      name: trimmedName,
      user_id: user.id,
    });

    if (error) {
      console.error('Error adding category:', error);
      toast({
        title: 'Error adding category',
        description: 'Unable to add category. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Category added successfully' });
    fetchCategories();
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error deleting category',
        description: 'Unable to delete category. It may be in use.',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Category deleted successfully' });
    fetchCategories();
  };

  return {
    categories,
    allCategories,
    loading,
    addCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
