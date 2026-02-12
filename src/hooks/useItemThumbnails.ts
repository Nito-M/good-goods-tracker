import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useItemThumbnails(itemIds: string[]) {
  const [thumbnailMap, setThumbnailMap] = useState<Map<string, string>>(new Map());

  const stableKey = useMemo(() => [...itemIds].sort().join(','), [itemIds]);

  useEffect(() => {
    if (itemIds.length === 0) {
      setThumbnailMap(new Map());
      return;
    }

    const fetchThumbnails = async () => {
      const { data, error } = await supabase
        .from('item_images')
        .select('item_id, image_url')
        .in('item_id', itemIds)
        .eq('is_primary', true);

      if (error) {
        console.error('Error fetching item thumbnails:', error);
        return;
      }

      const map = new Map<string, string>();
      data?.forEach((row) => {
        map.set(row.item_id, row.image_url);
      });
      setThumbnailMap(map);
    };

    fetchThumbnails();
  }, [stableKey]);

  return thumbnailMap;
}
