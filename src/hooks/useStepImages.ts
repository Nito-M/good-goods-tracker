import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface StepImage {
  id: string;
  stepId: string;
  imageUrl: string;
  signedUrl: string | null;
  displayOrder: number;
}

export function useStepImages(stepIds: string[]) {
  const [images, setImages] = useState<Record<string, StepImage[]>>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchImages = useCallback(async () => {
    if (!user || stepIds.length === 0) { setImages({}); return; }
    setLoading(true);
    const { data, error } = await (supabase.from('part_step_images') as any)
      .select('*')
      .in('step_id', stepIds)
      .order('display_order', { ascending: true });

    if (error) {
      toast({ title: 'Error loading step images', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Sign URLs
    const rows = data || [];
    const paths = rows.map((r: any) => r.image_url).filter(Boolean);
    const signedMap: Record<string, string> = {};
    if (paths.length > 0) {
      const { data: signed } = await supabase.storage.from('step-images').createSignedUrls(paths, 3600);
      if (signed) {
        signed.forEach((s: any) => {
          if (s.signedUrl) signedMap[s.path] = s.signedUrl;
        });
      }
    }

    const grouped: Record<string, StepImage[]> = {};
    for (const r of rows) {
      const img: StepImage = {
        id: r.id,
        stepId: r.step_id,
        imageUrl: r.image_url,
        signedUrl: signedMap[r.image_url] || null,
        displayOrder: r.display_order,
      };
      if (!grouped[r.step_id]) grouped[r.step_id] = [];
      grouped[r.step_id].push(img);
    }
    setImages(grouped);
    setLoading(false);
  }, [user, stepIds.join(','), toast]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  const uploadImage = async (stepId: string, file: File) => {
    if (!user) return null;
    const path = `${user.id}/${stepId}/${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from('step-images').upload(path, file);
    if (uploadErr) {
      toast({ title: 'Upload failed', description: uploadErr.message, variant: 'destructive' });
      return null;
    }

    const currentImages = images[stepId] || [];
    const { error } = await (supabase.from('part_step_images') as any).insert({
      step_id: stepId,
      user_id: user.id,
      image_url: path,
      display_order: currentImages.length,
    });
    if (error) {
      toast({ title: 'Error saving image', description: error.message, variant: 'destructive' });
      return null;
    }
    await fetchImages();
    return path;
  };

  const deleteImage = async (imageId: string, imagePath: string) => {
    await supabase.storage.from('step-images').remove([imagePath]);
    await (supabase.from('part_step_images') as any).delete().eq('id', imageId);
    await fetchImages();
  };

  return { images, loading, uploadImage, deleteImage, refetch: fetchImages };
}
