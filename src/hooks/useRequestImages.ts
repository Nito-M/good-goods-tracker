import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RequestImage {
  id: string;
  requestId: string;
  userId: string;
  imageUrl: string;
  createdAt: string;
}

export function useRequestImages(requestIds: string[]) {
  const [images, setImages] = useState<RequestImage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchImages = useCallback(async () => {
    if (!user || requestIds.length === 0) {
      setImages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("request_images")
        .select("*")
        .in("request_id", requestIds)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const mapped: RequestImage[] = (data || []).map((r: any) => ({
        id: r.id,
        requestId: r.request_id,
        userId: r.user_id,
        imageUrl: r.image_url,
        createdAt: r.created_at,
      }));

      // Re-sign URLs
      const resigned = await Promise.all(
        mapped.map(async (img) => {
          if (img.imageUrl && !img.imageUrl.startsWith("http")) return img;
          try {
            const bucketPath = img.imageUrl.split("/request-images/")[1]?.split("?")[0];
            if (bucketPath) {
              const { data: signed } = await supabase.storage.from("request-images").createSignedUrl(bucketPath, 3600);
              if (signed?.signedUrl) return { ...img, imageUrl: signed.signedUrl };
            }
          } catch {}
          return img;
        })
      );

      setImages(resigned);
    } catch (error: any) {
      console.error("Error fetching request images:", error);
    } finally {
      setLoading(false);
    }
  }, [user, requestIds.join(",")]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const addImage = async (requestId: string, imageUrl: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from("request_images")
        .insert({
          request_id: requestId,
          user_id: user.id,
          image_url: imageUrl,
        } as any);

      if (error) throw error;
      await fetchImages();
      return true;
    } catch (error: any) {
      console.error("Error adding request image:", error);
      return false;
    }
  };

  const deleteImage = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("request_images").delete().eq("id", id);
      if (error) throw error;
      setImages((prev) => prev.filter((img) => img.id !== id));
      return true;
    } catch (error: any) {
      console.error("Error deleting request image:", error);
      return false;
    }
  };

  return { images, loading: loading, addImage, deleteImage, refetch: fetchImages };
}
