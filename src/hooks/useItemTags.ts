import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ItemTag {
  id: string;
  item_id: string;
  tag_id: string;
  user_id: string;
  created_at: string;
}

export function useItemTags(itemId?: string) {
  const [itemTags, setItemTags] = useState<ItemTag[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchItemTags = useCallback(async () => {
    if (!user || !itemId) {
      setItemTags([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('item_tags')
        .select('*')
        .eq('item_id', itemId);

      if (error) {
        console.error('Error loading item tags:', error);
        setLoading(false);
        return;
      }

      setItemTags(data || []);
    } finally {
      setLoading(false);
    }
  }, [user, itemId]);

  useEffect(() => {
    fetchItemTags();
  }, [fetchItemTags]);

  const setTagsForItem = async (tagIds: string[]) => {
    if (!user || !itemId) return;

    // Delete all existing tags for this item
    await supabase.from('item_tags').delete().eq('item_id', itemId);

    // Insert new tags
    if (tagIds.length > 0) {
      const toInsert = tagIds.map((tagId) => ({
        item_id: itemId,
        tag_id: tagId,
        user_id: user.id,
      }));

      const { error } = await supabase.from('item_tags').insert(toInsert);
      if (error) {
        console.error('Error setting item tags:', error);
        return;
      }
    }

    fetchItemTags();
  };

  const selectedTagIds = itemTags.map((it) => it.tag_id);

  return { itemTags, selectedTagIds, loading, setTagsForItem, refetch: fetchItemTags };
}

// Bulk fetch item tags for multiple items (for inventory table)
export function useBulkItemTags(itemIds: string[]) {
  const [itemTagsMap, setItemTagsMap] = useState<Map<string, string[]>>(new Map());
  const [tagsMap, setTagsMap] = useState<Map<string, { name: string; category_id: string }>>(new Map());
  const { user } = useAuth();

  const itemIdsKey = itemIds.join(',');

  useEffect(() => {
    if (!user || itemIds.length === 0) {
      setItemTagsMap(new Map());
      setTagsMap(new Map());
      return;
    }

    const fetchBulk = async () => {
      // Fetch all item_tags for these items
      const { data: itemTagsData, error: itError } = await supabase
        .from('item_tags')
        .select('item_id, tag_id')
        .in('item_id', itemIds);

      if (itError) {
        console.error('Error fetching bulk item tags:', itError);
        return;
      }

      // Build item -> tag_ids map
      const map = new Map<string, string[]>();
      const allTagIds = new Set<string>();
      for (const it of itemTagsData || []) {
        const existing = map.get(it.item_id) || [];
        existing.push(it.tag_id);
        map.set(it.item_id, existing);
        allTagIds.add(it.tag_id);
      }

      // Fetch tag details first, then update both maps atomically
      let tMap = new Map<string, { name: string; category_id: string }>();
      if (allTagIds.size > 0) {
        const { data: tagsData } = await supabase
          .from('tags')
          .select('id, name, tag_category_id')
          .in('id', Array.from(allTagIds));

        for (const t of tagsData || []) {
          tMap.set(t.id, { name: t.name, category_id: t.tag_category_id });
        }
      }

      // Set both maps together to avoid race condition where itemTagsMap is set
      // but tagsMap is still empty, causing getTagsForItem to return nothing
      setItemTagsMap(map);
      setTagsMap(tMap);
    };

    fetchBulk();
  }, [user, itemIdsKey]);

  const getTagsForItem = (itemId: string) => {
    const tagIds = itemTagsMap.get(itemId) || [];
    return tagIds.map((id) => tagsMap.get(id)).filter(Boolean) as { name: string; category_id: string }[];
  };

  return { getTagsForItem, itemTagsMap, tagsMap };
}
