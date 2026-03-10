import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface TagCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

const DEFAULT_TAG_CATEGORY_NAMES = ['Parts', 'Tags'];

export function useTagCategories() {
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTagCategories = useCallback(async () => {
    if (!user) {
      setTagCategories([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tag_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading tag categories:', error);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        const toInsert = DEFAULT_TAG_CATEGORY_NAMES.map((name) => ({
          name,
          user_id: user.id,
        }));

        const { error: seedError } = await supabase.from('tag_categories').insert(toInsert);
        if (seedError) {
          console.error('Error seeding tag categories:', seedError);
        }

        const { data: seededData } = await supabase
          .from('tag_categories')
          .select('*')
          .order('name', { ascending: true });
        setTagCategories(seededData || []);
      } else {
        setTagCategories(data);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTagCategories();
  }, [fetchTagCategories]);

  const addTagCategory = async (name: string) => {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    if (tagCategories.some((tc) => tc.name.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: 'Tag category already exists', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('tag_categories').insert({
      name: trimmed,
      user_id: user.id,
    });

    if (error) {
      console.error('Error adding tag category:', error);
      toast({ title: 'Error adding tag category', variant: 'destructive' });
      return;
    }

    toast({ title: 'Tag category added' });
    fetchTagCategories();
  };

  const deleteTagCategory = async (id: string) => {
    const { error } = await supabase.from('tag_categories').delete().eq('id', id);

    if (error) {
      console.error('Error deleting tag category:', error);
      toast({ title: 'Error deleting tag category', variant: 'destructive' });
      return;
    }

    toast({ title: 'Tag category deleted' });
    fetchTagCategories();
  };

  const renameTagCategory = async (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    if (tagCategories.some((tc) => tc.id !== id && tc.name.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: 'Tag category name already exists', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('tag_categories').update({ name: trimmed }).eq('id', id);
    if (error) {
      console.error('Error renaming tag category:', error);
      toast({ title: 'Error renaming tag category', variant: 'destructive' });
      return;
    }

    toast({ title: 'Tag category renamed' });
    fetchTagCategories();
  };

  return { tagCategories, loading, addTagCategory, deleteTagCategory, renameTagCategory, refetch: fetchTagCategories };
}
