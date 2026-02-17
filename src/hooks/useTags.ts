import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Tag {
  id: string;
  name: string;
  tag_category_id: string;
  user_id: string;
  created_at: string;
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTags = useCallback(async () => {
    if (!user) {
      setTags([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading tags:', error);
        setLoading(false);
        return;
      }

      setTags(data || []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const addTag = async (name: string, tagCategoryId: string) => {
    if (!user) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    if (tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase() && t.tag_category_id === tagCategoryId)) {
      toast({ title: 'Tag already exists in this category', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('tags').insert({
      name: trimmed,
      tag_category_id: tagCategoryId,
      user_id: user.id,
    });

    if (error) {
      console.error('Error adding tag:', error);
      toast({ title: 'Error adding tag', variant: 'destructive' });
      return;
    }

    toast({ title: 'Tag added' });
    fetchTags();
  };

  const deleteTag = async (id: string) => {
    const { error } = await supabase.from('tags').delete().eq('id', id);

    if (error) {
      console.error('Error deleting tag:', error);
      toast({ title: 'Error deleting tag', variant: 'destructive' });
      return;
    }

    toast({ title: 'Tag deleted' });
    fetchTags();
  };

  const getTagsByCategory = (categoryId: string) => tags.filter((t) => t.tag_category_id === categoryId);

  return { tags, loading, addTag, deleteTag, getTagsByCategory, refetch: fetchTags };
}
