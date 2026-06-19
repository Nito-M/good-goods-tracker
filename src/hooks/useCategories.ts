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
        console.error('Error loading categories:', error);
        toast({
          title: 'Error loading categories',
          description: 'Unable to load categories. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Only seed defaults once per user (first time ever). After that, respect deletions.
      const seedFlagKey = `categories-seeded-${user.id}`;
      const alreadySeeded = localStorage.getItem(seedFlagKey) === '1';

      if ((!data || data.length === 0) && !alreadySeeded) {
        const categoriesToInsert = DEFAULT_CATEGORY_NAMES.map((name) => ({
          name,
          user_id: user.id,
        }));

        const { error: seedError } = await supabase.from('categories').insert(categoriesToInsert);
        if (seedError) {
          console.error('Error seeding default categories:', seedError);
        }
        localStorage.setItem(seedFlagKey, '1');

        // Re-fetch after seeding
        const { data: seededData } = await supabase
          .from('categories')
          .select('*')
          .order('name', { ascending: true });
        setCategories(seededData || []);
      } else {
        if (data && data.length > 0) localStorage.setItem(seedFlagKey, '1');
        setCategories(data || []);
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

  const updateCategory = async (id: string, newName: string) => {
    if (!user) return;

    const trimmed = newName.trim();
    if (!trimmed || trimmed.length > 100) {
      toast({ title: 'Invalid category name', variant: 'destructive' });
      return;
    }

    if (allCategories.some((n) => n.toLowerCase() === trimmed.toLowerCase() && categories.find((c) => c.id === id)?.name.toLowerCase() !== trimmed.toLowerCase())) {
      toast({ title: 'Category already exists', variant: 'destructive' });
      return;
    }

    const oldCategory = categories.find((c) => c.id === id);

    const { error } = await supabase.from('categories').update({ name: trimmed }).eq('id', id);
    if (error) {
      console.error('Error updating category:', error);
      toast({ title: 'Error updating category', variant: 'destructive' });
      return;
    }

    // Update inventory items with the old category name
    if (oldCategory && oldCategory.name !== trimmed) {
      await supabase
        .from('inventory_items')
        .update({ category: trimmed })
        .eq('category', oldCategory.name);
    }

    toast({ title: 'Category updated successfully' });
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

  const moveCategoryToSubcategory = async (categoryId: string, targetParentCategoryId: string) => {
    if (!user) return;

    const sourceCategory = categories.find((c) => c.id === categoryId);
    const targetCategory = categories.find((c) => c.id === targetParentCategoryId);
    if (!sourceCategory || !targetCategory) {
      toast({ title: 'Category not found', variant: 'destructive' });
      return;
    }

    // 1. Create subcategory under the target parent
    const { error: subError } = await supabase.from('subcategories').insert({
      category_id: targetParentCategoryId,
      name: sourceCategory.name,
      user_id: user.id,
    });
    if (subError) {
      console.error('Error creating subcategory:', subError);
      toast({ title: 'Error moving category', description: subError.message, variant: 'destructive' });
      return;
    }

    // 2. Update all inventory items with the old category
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ category: targetCategory.name, subcategory: sourceCategory.name })
      .eq('category', sourceCategory.name);
    if (updateError) {
      console.error('Error updating items:', updateError);
      toast({ title: 'Error updating items', description: updateError.message, variant: 'destructive' });
      return;
    }

    // 3. Delete the old category
    const { error: deleteError } = await supabase.from('categories').delete().eq('id', categoryId);
    if (deleteError) {
      console.error('Error deleting old category:', deleteError);
      toast({ title: 'Error removing old category', description: deleteError.message, variant: 'destructive' });
      return;
    }

    toast({ title: `"${sourceCategory.name}" moved under "${targetCategory.name}"` });
    fetchCategories();
  };

  return {
    categories,
    allCategories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    moveCategoryToSubcategory,
    refetch: fetchCategories,
  };
}
