import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Part2 {
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

export function useParts2() {
  const [parts, setParts] = useState<Part2[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchParts = useCallback(async () => {
    if (!user) { setParts([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('parts_2' as any)
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast({ title: 'Error loading parts', description: error.message, variant: 'destructive' });
    } else {
      setParts((data || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        sku: d.sku,
        price: d.price ?? 0,
        hours: d.hours ?? 0,
        hourlyRate: d.hourly_rate ?? 0,
        paintingHours: d.painting_hours ?? 0,
        paintingHourlyRate: d.painting_hourly_rate ?? 0,
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

  const addPart = async (part: { name: string; sku: string; description?: string; price?: number; imageUrl?: string; dxfUrl1?: string; dxfUrl2?: string; folderId?: string | null }) => {
    if (!user) return null;
    const { data, error } = await supabase.from('parts_2' as any).insert({
      user_id: user.id,
      name: part.name,
      sku: part.sku,
      description: part.description || null,
      price: part.price ?? 0,
      image_url: part.imageUrl || null,
      dxf_url_1: part.dxfUrl1 || null,
      dxf_url_2: part.dxfUrl2 || null,
      folder_id: part.folderId || null,
    } as any).select().single();

    if (error) {
      toast({ title: 'Error adding part', description: error.message, variant: 'destructive' });
      return null;
    }
    await fetchParts();
    return (data as any)?.id || null;
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

    const { error, data } = await supabase.from('parts_2' as any).update(dbUpdates as any).eq('id', id).select();
    if (error) {
      toast({ title: 'Error updating part', description: error.message, variant: 'destructive' });
      return false;
    }
    if (!data || (data as any[]).length === 0) {
      toast({ title: 'Update failed', description: 'You may not have permission to edit this part.', variant: 'destructive' });
      return false;
    }
    await fetchParts();
    return true;
  };

  const deletePart = async (id: string) => {
    const { error } = await supabase.from('parts_2' as any).delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting part', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchParts();
    return true;
  };

  const deleteParts = async (ids: string[]) => {
    if (ids.length === 0) return 0;
    const { error, count } = await supabase.from('parts_2' as any).delete().in('id', ids);
    if (error) {
      toast({ title: 'Error deleting parts', description: error.message, variant: 'destructive' });
      return 0;
    }
    await fetchParts();
    return count ?? ids.length;
  };

  const duplicatePart = async (id: string) => {
    if (!user) return null;
    const source = parts.find(p => p.id === id);
    if (!source) return null;

    const { data: newPart, error } = await supabase.from('parts_2' as any).insert({
      user_id: user.id,
      name: `${source.name} (Copy)`,
      sku: `${source.sku}-copy`,
      description: source.description || null,
      image_url: source.imageUrl || null,
      dxf_url_1: source.dxfUrl1 || null,
      dxf_url_2: source.dxfUrl2 || null,
      dxf_label_1: source.dxfLabel1,
      dxf_label_2: source.dxfLabel2,
      folder_id: source.folderId || null,
      price: source.price,
      hours: source.hours,
      hourly_rate: source.hourlyRate,
      painting_hours: source.paintingHours,
      painting_hourly_rate: source.paintingHourlyRate,
    } as any).select().single();

    if (error || !newPart) {
      toast({ title: 'Error duplicating part', description: error?.message, variant: 'destructive' });
      return null;
    }

    const newPartId = (newPart as any).id;

    // Duplicate materials/inventory items
    const { data: materials } = await supabase
      .from('part_inventory_items_2' as any)
      .select('*')
      .eq('part_id', id);

    if (materials && (materials as any[]).length > 0) {
      const newMaterials = (materials as any[]).map((m: any) => ({
        part_id: newPartId,
        user_id: user.id,
        inventory_item_id: m.inventory_item_id,
        quantity: m.quantity,
        unit_cost: m.unit_cost,
        notes: m.notes,
        item_name: m.item_name,
      }));
      await supabase.from('part_inventory_items_2' as any).insert(newMaterials as any);
    }

    // Duplicate manufacturing steps
    const { data: steps } = await supabase
      .from('part_manufacturing_steps_2' as any)
      .select('*')
      .eq('part_id', id)
      .order('step_order', { ascending: true });

    if (steps && (steps as any[]).length > 0) {
      for (const step of steps as any[]) {
        const { data: newStep } = await supabase.from('part_manufacturing_steps_2' as any).insert({
          part_id: newPartId,
          user_id: user.id,
          step_order: step.step_order,
          operation_type: step.operation_type,
          machine: step.machine,
          notes: step.notes,
          price: step.price,
          length: step.length,
          angle: step.angle,
          hole_diameter: step.hole_diameter,
          position_offset: step.position_offset,
          quantity: step.quantity,
        } as any).select().single();

        if (newStep) {
          const newStepId = (newStep as any).id;
          const { data: stepImages } = await supabase
            .from('part_step_images_2' as any)
            .select('*')
            .eq('step_id', step.id);
          if (stepImages && (stepImages as any[]).length > 0) {
            await supabase.from('part_step_images_2' as any).insert(
              (stepImages as any[]).map((si: any) => ({
                step_id: newStepId,
                user_id: user.id,
                image_url: si.image_url,
                display_order: si.display_order,
              }))
            );
          }
        }
      }
    }

    await fetchParts();
    toast({ title: 'Part duplicated' });
    return newPartId;
  };

  const uploadPartImage = async (file: File) => {
    if (!user) return null;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('part-images-2').upload(path, file);
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

  return { parts, loading, addPart, updatePart, deletePart, deleteParts, duplicatePart, uploadPartImage, uploadPartDxf, getSignedUrl, refetch: fetchParts };
}
