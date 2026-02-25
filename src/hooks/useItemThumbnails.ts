import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Extract the storage path from a signed URL or return the value as-is */
function extractPathFromUrl(imageUrl: string): string {
  if (!imageUrl.startsWith('http')) return imageUrl;
  const match = imageUrl.match(/\/item-images\/(.+?)(?:\?|$)/);
  if (match) return decodeURIComponent(match[1]);
  return imageUrl;
}

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

      if (!data || data.length === 0) {
        setThumbnailMap(new Map());
        return;
      }

      // Generate fresh signed URLs for all paths
      const paths = data.map(row => extractPathFromUrl(row.image_url));
      const { data: signedData } = await supabase.storage
        .from('item-images')
        .createSignedUrls(paths, 3600);

      const map = new Map<string, string>();
      data.forEach((row, i) => {
        const url = signedData?.[i]?.signedUrl ?? row.image_url;
        map.set(row.item_id, url);
      });
      setThumbnailMap(map);
    };

    fetchThumbnails();
  }, [stableKey]);

  return thumbnailMap;
}
