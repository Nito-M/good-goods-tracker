import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Part {
  id: string;
  name: string;
  sku: string;
  price: number;
  hours: number;
  hourlyRate: number;
  paintingHours: number;
  paintingHourlyRate: number;
  imageUrl: string | null;
  dxfUrl1: string | null;
  dxfUrl2: string | null;
  dxfLabel1: string;
  dxfLabel2: string;
  description: string | null;
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function useParts() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchParts = useCallback(async () => {
    if (!user) { setParts([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error loading parts', description: error.message, variant: 'destructive' });
    } else {
      setParts((data || []).map(d => ({
        id: d.id,
        name: d.name,
        sku: d.sku,
        price: d.price ?? 0,
        hours: (d as any).hours ?? 0,
        hourlyRate: (d as any).hourly_rate ?? 0,
        paintingHours: (d as any).painting_hours ?? 0,
        paintingHourlyRate: (d as any).painting_hourly_rate ?? 0,
        imageUrl: d.image_url,
        dxfUrl1: d.dxf_url_1,
        dxfUrl2: d.dxf_url_2,
        dxfLabel1: d.dxf_label_1 || 'Plasma DXF',
        dxfLabel2: d.dxf_label_2 || 'Laser DXF',
        description: d.description,
        folderId: d.folder_id ?? null,
        createdAt: new Date(d.created_at),
        updatedAt: new Date(d.updated_at),
      })));
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { fetchParts(); }, [fetchParts]);

  const addPart = async (part: { name: string; sku: string; description?: string; imageUrl?: string; dxfUrl1?: string; dxfUrl2?: string; folderId?: string | null }) => {
    if (!user) return null;
    const { data, error } = await supabase.from('parts').insert({
      user_id: user.id,
      name: part.name,
      sku: part.sku,
      description: part.description || null,
      image_url: part.imageUrl || null,
      dxf_url_1: part.dxfUrl1 || null,
      dxf_url_2: part.dxfUrl2 || null,
      folder_id: part.folderId || null,
    }).select().single();

    if (error) {
      toast({ title: 'Error adding part', description: error.message, variant: 'destructive' });
      return null;
    }
    await fetchParts();
    return data?.id || null;
  };

  const updatePart = async (id: string, updates: Partial<{ name: string; sku: string; description: string; price: number; hours: number; hourlyRate: number; paintingHours: number; paintingHourlyRate: number; imageUrl: string; dxfUrl1: string; dxfUrl2: string; dxfLabel1: string; dxfLabel2: string; folderId: string | null }>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.hours !== undefined) dbUpdates.hours = updates.hours;
    if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate;
    if (updates.paintingHours !== undefined) dbUpdates.painting_hours = updates.paintingHours;
    if (updates.paintingHourlyRate !== undefined) dbUpdates.painting_hourly_rate = updates.paintingHourlyRate;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.dxfUrl1 !== undefined) dbUpdates.dxf_url_1 = updates.dxfUrl1;
    if (updates.dxfUrl2 !== undefined) dbUpdates.dxf_url_2 = updates.dxfUrl2;
    if (updates.dxfLabel1 !== undefined) dbUpdates.dxf_label_1 = updates.dxfLabel1;
    if (updates.dxfLabel2 !== undefined) dbUpdates.dxf_label_2 = updates.dxfLabel2;
    if (updates.folderId !== undefined) dbUpdates.folder_id = updates.folderId;

    const { error } = await supabase.from('parts').update(dbUpdates).eq('id', id);
    if (error) {
      toast({ title: 'Error updating part', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchParts();
    return true;
  };

  const deletePart = async (id: string) => {
    const { error } = await supabase.from('parts').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting part', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchParts();
    return true;
  };

  const deleteParts = async (ids: string[]) => {
    if (ids.length === 0) return 0;
    const { error, count } = await supabase.from('parts').delete().in('id', ids);
    if (error) {
      toast({ title: 'Error deleting parts', description: error.message, variant: 'destructive' });
      return 0;
    }
    await fetchParts();
    return count ?? ids.length;
  };

  const uploadPartImage = async (file: File) => {
    if (!user) return null;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('part-images').upload(path, file);
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      return null;
    }
    return path;
  };

  const uploadPartDxf = async (file: File) => {
    if (!user) return null;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('dxf-files').upload(path, file);
    if (error) {
      toast({ title: 'DXF upload failed', description: error.message, variant: 'destructive' });
      return null;
    }
    return path;
  };

  const getSignedUrl = async (bucket: string, path: string) => {
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    return data?.signedUrl || null;
  };

  return { parts, loading, addPart, updatePart, deletePart, deleteParts, uploadPartImage, uploadPartDxf, getSignedUrl, refetch: fetchParts };
}
