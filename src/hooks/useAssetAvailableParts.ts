import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface AssetAvailablePart {
  id: string;
  asset_id: string;
  user_id: string;
  name: string;
  sku: string | null;
  price: number | null;
  link: string | null;
  image_url: string | null;
  vendor: string | null;
  vendor_location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useAssetAvailableParts(assetId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [parts, setParts] = useState<AssetAvailablePart[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParts = useCallback(async () => {
    if (!user || !assetId) return;
    const { data, error } = await supabase
      .from('asset_available_parts' as any)
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setParts((data as unknown as AssetAvailablePart[]) || []);
    setLoading(false);
  }, [user, assetId]);

  useEffect(() => { fetchParts(); }, [fetchParts]);

  const addPart = async (part: Partial<AssetAvailablePart>) => {
    if (!user || !assetId) return;
    const { error } = await supabase.from('asset_available_parts' as any).insert({
      ...part,
      asset_id: assetId,
      user_id: user.id,
    } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    await fetchParts();
  };

  const updatePart = async (id: string, updates: Partial<AssetAvailablePart>) => {
    const { error } = await supabase.from('asset_available_parts' as any).update(updates as any).eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    await fetchParts();
  };

  const removePart = async (id: string) => {
    const { error } = await supabase.from('asset_available_parts' as any).delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    await fetchParts();
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('item-images').upload(path, file);
    if (error) { toast({ title: 'Upload failed', description: error.message, variant: 'destructive' }); return null; }
    const { data: signed } = await supabase.storage.from('item-images').createSignedUrl(path, 60 * 60 * 24 * 365);
    return signed?.signedUrl || null;
  };

  return { parts, loading, addPart, updatePart, removePart, uploadImage, refetch: fetchParts };
}
