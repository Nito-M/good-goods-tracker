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
    else setImages((data as unknown as AssetImage[]) || []);
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

    const currentCount = images.length;
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

  return { images, loading, addImage, deleteImage, refetch: fetchImages };
}
