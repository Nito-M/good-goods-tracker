import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Extract the storage path from a signed URL or return the value as-is */
function extractPathFromUrl(imageUrl: string): string {
  if (!imageUrl.startsWith('http')) return imageUrl;
  const match = imageUrl.match(/\/item-images\/(.+?)(?:\?|$)/);
  if (match) return decodeURIComponent(match[1]);
  return imageUrl;
}

const BATCH_SIZE = 50;

export function useItemThumbnails(itemIds: string[]) {
  const [thumbnailMap, setThumbnailMap] = useState<Map<string, string>>(new Map());

  const stableKey = useMemo(() => [...itemIds].sort().join(','), [itemIds]);

  useEffect(() => {
    if (itemIds.length === 0) {
      setThumbnailMap(new Map());
      return;
    }

    const fetchThumbnails = async () => {
      const map = new Map<string, string>();

      // Batch item IDs to avoid URL length limits
      for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
        const batch = itemIds.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase
          .from('item_images')
          .select('item_id, image_url, is_primary, display_order, created_at')
          .in('item_id', batch)
          .order('is_primary', { ascending: false })
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching item thumbnails:', error);
          continue;
        }

        if (!data || data.length === 0) continue;

        // Keep only the best image per item (primary first, then earliest)
        const seen = new Set<string>();
        const bestPerItem = data.filter((row: any) => {
          if (seen.has(row.item_id)) return false;
          seen.add(row.item_id);
          return true;
        });

        // Generate fresh signed URLs for all paths
        const paths = bestPerItem.map(row => extractPathFromUrl(row.image_url));
        const { data: signedData } = await supabase.storage
          .from('item-images')
          .createSignedUrls(paths, 3600);

        bestPerItem.forEach((row, idx) => {
          const url = signedData?.[idx]?.signedUrl ?? row.image_url;
          map.set(row.item_id, url);
        });

      }

      setThumbnailMap(map);
    };

    fetchThumbnails();
  }, [stableKey]);

  return thumbnailMap;
}
