import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface AssetImage {
  id: string;
  asset_id: string;
  user_id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export function useAssetImages(assetId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [images, setImages] = useState<AssetImage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchImages = useCallback(async () => {
    if (!user || !assetId) return;
    const { data, error } = await supabase
      .from('asset_images' as any)
      .select('*')
      .eq('asset_id', assetId)
      .order('display_order', { ascending: true });
    if (error) console.error(error);
    else {
      const rows = (data as unknown as AssetImage[]) || [];
      // Auto-heal: if multiple rows are flagged primary, keep only the first
      const primaries = rows.filter(r => r.is_primary);
      if (primaries.length > 1) {
        const keepId = primaries[0].id;
        const extraIds = primaries.slice(1).map(r => r.id);
        await supabase.from('asset_images' as any).update({ is_primary: false } as any).in('id', extraIds);
        rows.forEach(r => { if (r.is_primary && r.id !== keepId) r.is_primary = false; });
      }
      setImages(rows);
    }
    setLoading(false);
  }, [user, assetId]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  const addImage = async (file: File) => {
    if (!user || !assetId) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${assetId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('item-images').upload(path, file);
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      return null;
    }
    const { data: signed } = await supabase.storage.from('item-images').createSignedUrl(path, 60 * 60 * 24 * 365);
    if (!signed?.signedUrl) return null;

    const { count } = await supabase
      .from('asset_images' as any)
      .select('*', { count: 'exact', head: true })
      .eq('asset_id', assetId);
    const currentCount = count ?? 0;
    const { error } = await supabase.from('asset_images' as any).insert({
      asset_id: assetId,
      user_id: user.id,
      image_url: signed.signedUrl,
      display_order: currentCount,
      is_primary: currentCount === 0,
    } as any);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
    await fetchImages();
    return signed.signedUrl;
  };

  const deleteImage = async (imageId: string) => {
    const { error } = await supabase.from('asset_images' as any).delete().eq('id', imageId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchImages();
    return true;
  };

  const setPrimaryImage = async (imageId: string) => {
    if (!user || !assetId) return;
    // Unset all
    await supabase.from('asset_images' as any).update({ is_primary: false } as any).eq('asset_id', assetId);
    // Set selected
    const { error } = await supabase.from('asset_images' as any).update({ is_primary: true } as any).eq('id', imageId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchImages();
    toast({ title: 'Primary photo updated' });
  };

  const addImageByUrl = async (imageUrl: string, makePrimary: boolean = true) => {
    if (!user || !assetId) return null;
    const currentCount = images.length;
    if (makePrimary && currentCount > 0) {
      await supabase.from('asset_images' as any).update({ is_primary: false } as any).eq('asset_id', assetId);
    }
    const { data, error } = await supabase.from('asset_images' as any).insert({
      asset_id: assetId,
      user_id: user.id,
      image_url: imageUrl,
      display_order: currentCount,
      is_primary: makePrimary || currentCount === 0,
    } as any).select().single();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
    await fetchImages();
    return data;
  };

  const primaryImage = images.find(img => img.is_primary) || images[0];

  return { images, loading, primaryImage, addImage, addImageByUrl, deleteImage, setPrimaryImage, refetch: fetchImages };
}
