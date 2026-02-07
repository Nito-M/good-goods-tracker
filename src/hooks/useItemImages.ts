import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ItemImage {
  id: string;
  item_id: string;
  user_id: string;
  image_url: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export function useItemImages(itemId: string | undefined) {
  const [images, setImages] = useState<ItemImage[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchImages = async () => {
    if (!itemId || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('item_images')
        .select('*')
        .eq('item_id', itemId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching item images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [itemId, user]);

  const uploadImage = async (file: File, isPrimary: boolean = false): Promise<string | null> => {
    if (!itemId || !user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${itemId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get signed URL for the uploaded image
      const { data: signedData } = await supabase.storage
        .from('item-images')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

      if (!signedData?.signedUrl) throw new Error('Failed to get signed URL');

      // Get the current max display order
      const maxOrder = images.length > 0 
        ? Math.max(...images.map(img => img.display_order)) 
        : -1;

      // If this is the first image or marked as primary, make it primary
      const shouldBePrimary = isPrimary || images.length === 0;

      // If making this primary, unset other primary images
      if (shouldBePrimary && images.length > 0) {
        await supabase
          .from('item_images')
          .update({ is_primary: false })
          .eq('item_id', itemId);
      }

      const { data, error } = await supabase
        .from('item_images')
        .insert({
          item_id: itemId,
          user_id: user.id,
          image_url: signedData.signedUrl,
          display_order: maxOrder + 1,
          is_primary: shouldBePrimary,
        })
        .select()
        .single();

      if (error) throw error;

      setImages(prev => [...prev, data]);
      return signedData.signedUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('item_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setImages(prev => prev.filter(img => img.id !== imageId));
      toast({ title: 'Image deleted' });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete image.',
        variant: 'destructive',
      });
    }
  };

  const setPrimaryImage = async (imageId: string) => {
    if (!user || !itemId) return;

    try {
      // First, unset all primary flags for this item
      await supabase
        .from('item_images')
        .update({ is_primary: false })
        .eq('item_id', itemId);

      // Then set the selected image as primary
      const { error } = await supabase
        .from('item_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      if (error) throw error;

      setImages(prev => 
        prev.map(img => ({
          ...img,
          is_primary: img.id === imageId,
        }))
      );
      
      toast({ title: 'Primary image updated' });
    } catch (error) {
      console.error('Error setting primary image:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to set primary image.',
        variant: 'destructive',
      });
    }
  };

  const reorderImages = async (reorderedImages: ItemImage[]) => {
    if (!user) return;

    try {
      // Update display_order for each image
      for (let i = 0; i < reorderedImages.length; i++) {
        await supabase
          .from('item_images')
          .update({ display_order: i })
          .eq('id', reorderedImages[i].id);
      }

      setImages(reorderedImages.map((img, idx) => ({ ...img, display_order: idx })));
    } catch (error) {
      console.error('Error reordering images:', error);
    }
  };

  const primaryImage = images.find(img => img.is_primary) || images[0];

  return {
    images,
    loading,
    primaryImage,
    uploadImage,
    deleteImage,
    setPrimaryImage,
    reorderImages,
    refetch: fetchImages,
  };
}
