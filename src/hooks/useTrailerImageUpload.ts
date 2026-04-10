import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useTrailerImageUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File): Promise<string | null> => {
    if (!user) return null;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from('trailer-images')
        .upload(path, file, { upsert: false });
      if (error) throw error;

      const { data: signed } = await supabase.storage
        .from('trailer-images')
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

      return signed?.signedUrl || path;
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading };
}
