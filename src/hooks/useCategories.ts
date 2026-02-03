import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORIES as DEFAULT_CATEGORIES } from '@/types/inventory';
import { categorySchema, validateInput } from '@/lib/validation';
export interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export function useCategories() {
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCategories = useCallback(async () => {
    if (!user) {
      setCustomCategories([]);
      setLoading(false);
      return;
    }

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

    setCustomCategories(data || []);
    setLoading(false);
  }, [toast, user]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Combine default categories with custom ones
  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCategories.map((c) => c.name).filter((name) => !DEFAULT_CATEGORIES.includes(name as any)),
  ];

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
    customCategories,
    allCategories,
    loading,
    addCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
