import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  asset_type: string;
  brand: string;
  model: string;
  year: number | null;
  serial_number: string;
  vin: string | null;
  motor_type: string | null;
  image_url: string | null;
  external_link: string | null;
  current_location: string;
  assigned_shop: string;
  assigned_employee: string;
  status: string;
  odometer: number | null;
  engine_hours: number | null;
  last_service_date: string | null;
  service_interval_days: number | null;
  created_at: string;
  updated_at: string;
}

export interface AssetPart {
  id: string;
  asset_id: string;
  inventory_item_id: string | null;
  item_name: string;
  quantity: number;
  install_date: string | null;
  installed_by: string | null;
  remove_date: string | null;
  deducted_from_inventory: boolean;
  notes: string | null;
  user_id: string;
  created_at: string;
}

export interface AssetMaintenance {
  id: string;
  asset_id: string;
  service_date: string;
  description: string;
  parts_used: string | null;
  cost: number;
  technician: string;
  user_id: string;
  created_at: string;
}

export interface AssetDocument {
  id: string;
  asset_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  user_id: string;
  created_at: string;
}

export interface AssetNote {
  id: string;
  asset_id: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useAssets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching assets:', error);
      setLoading(false);
      return;
    }
    const assetRows = (data as unknown as Asset[]) || [];
    const assetIds = assetRows.map((a) => a.id);
    let primaryByAsset: Record<string, string> = {};
    if (assetIds.length > 0) {
      const { data: imgs } = await supabase
        .from('asset_images' as any)
        .select('asset_id, image_url, is_primary, display_order')
        .in('asset_id', assetIds)
        .order('is_primary', { ascending: false })
        .order('display_order', { ascending: true });
      const rows = (imgs as any as { asset_id: string; image_url: string; is_primary: boolean }[]) || [];
      for (const row of rows) {
        if (!primaryByAsset[row.asset_id]) primaryByAsset[row.asset_id] = row.image_url;
      }
    }
    const merged = assetRows.map((a) => ({
      ...a,
      image_url: primaryByAsset[a.id] || a.image_url,
    }));
    setAssets(merged);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const addAsset = async (asset: Partial<Asset>) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('assets')
      .insert({ ...asset, user_id: user.id } as any)
      .select()
      .single();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
    await fetchAssets();
    return data as unknown as Asset;
  };

  const updateAsset = async (id: string, updates: Partial<Asset>) => {
    const { error } = await supabase
      .from('assets')
      .update(updates as any)
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchAssets();
    return true;
  };

  const deleteAsset = async (id: string) => {
    const { error } = await supabase.from('assets').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchAssets();
    return true;
  };

  const uploadAssetImage = async (file: File) => {
    if (!user) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('item-images').upload(path, file);
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      return null;
    }
    const { data: signed } = await supabase.storage.from('item-images').createSignedUrl(path, 60 * 60 * 24 * 365);
    return signed?.signedUrl || null;
  };

  return { assets, loading, addAsset, updateAsset, deleteAsset, uploadAssetImage, refetch: fetchAssets };
}

export function useAssetParts(assetId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [parts, setParts] = useState<AssetPart[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParts = useCallback(async () => {
    if (!user || !assetId) return;
    const { data, error } = await supabase
      .from('asset_parts')
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setParts((data as unknown as AssetPart[]) || []);
    setLoading(false);
  }, [user, assetId]);

  useEffect(() => { fetchParts(); }, [fetchParts]);

  const addPart = async (part: Partial<AssetPart>, deductFromInventory?: boolean) => {
    if (!user || !assetId) return;
    const { error } = await supabase.from('asset_parts').insert({
      ...part,
      asset_id: assetId,
      user_id: user.id,
      deducted_from_inventory: deductFromInventory ?? false,
    } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }

    // Deduct from inventory if toggle enabled and linked to inventory item
    if (deductFromInventory && part.inventory_item_id && part.quantity) {
      const { data: item } = await supabase
        .from('inventory_items')
        .select('quantity')
        .eq('id', part.inventory_item_id)
        .single();
      if (item) {
        await supabase.from('inventory_items').update({
          quantity: Math.max(0, Number(item.quantity) - Number(part.quantity))
        }).eq('id', part.inventory_item_id);
      }
    }
    await fetchParts();
  };

  const removePart = async (partId: string) => {
    const { error } = await supabase.from('asset_parts').delete().eq('id', partId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    await fetchParts();
  };

  const updatePart = async (partId: string, updates: Partial<AssetPart>) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.item_name !== undefined) dbUpdates.item_name = updates.item_name;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.install_date !== undefined) dbUpdates.install_date = updates.install_date;
    if (updates.installed_by !== undefined) dbUpdates.installed_by = updates.installed_by;
    if (updates.remove_date !== undefined) dbUpdates.remove_date = updates.remove_date;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    const { error } = await supabase.from('asset_parts').update(dbUpdates).eq('id', partId);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    await fetchParts();
  };

  return { parts, loading, addPart, removePart, updatePart, refetch: fetchParts };
}

export function useAssetMaintenance(assetId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<AssetMaintenance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    if (!user || !assetId) return;
    const { data, error } = await supabase
      .from('asset_maintenance')
      .select('*')
      .eq('asset_id', assetId)
      .order('service_date', { ascending: false });
    if (error) console.error(error);
    else setRecords((data as unknown as AssetMaintenance[]) || []);
    setLoading(false);
  }, [user, assetId]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const addRecord = async (record: Partial<AssetMaintenance>) => {
    if (!user || !assetId) return;
    const { error } = await supabase.from('asset_maintenance').insert({
      ...record, asset_id: assetId, user_id: user.id,
    } as any);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    await fetchRecords();
  };

  const deleteRecord = async (id: string) => {
    const { error } = await supabase.from('asset_maintenance').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    await fetchRecords();
  };

  return { records, loading, addRecord, deleteRecord, refetch: fetchRecords };
}

export function useAssetDocuments(assetId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<AssetDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(async () => {
    if (!user || !assetId) return;
    const { data, error } = await supabase
      .from('asset_documents')
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setDocuments((data as unknown as AssetDocument[]) || []);
    setLoading(false);
  }, [user, assetId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const uploadDocument = async (file: File) => {
    if (!user || !assetId) return;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${assetId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('item-images').upload(path, file);
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      return;
    }
    const { data: signed } = await supabase.storage.from('item-images').createSignedUrl(path, 60 * 60 * 24 * 365);
    if (!signed?.signedUrl) return;

    const { error } = await supabase.from('asset_documents').insert({
      asset_id: assetId,
      file_name: file.name,
      file_url: signed.signedUrl,
      file_type: file.type,
      user_id: user.id,
    } as any);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    await fetchDocs();
  };

  const deleteDocument = async (id: string) => {
    const { error } = await supabase.from('asset_documents').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    await fetchDocs();
  };

  return { documents, loading, uploadDocument, deleteDocument, refetch: fetchDocs };
}

export function useAssetNotes(assetId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<AssetNote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!user || !assetId) return;
    const { data, error } = await supabase
      .from('asset_notes' as any)
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setNotes((data as unknown as AssetNote[]) || []);
    setLoading(false);
  }, [user, assetId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const addNote = async (content: string) => {
    if (!user || !assetId) return;
    const { error } = await supabase.from('asset_notes' as any).insert({
      asset_id: assetId, user_id: user.id, content,
    } as any);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    await fetchNotes();
  };

  const updateNote = async (id: string, content: string) => {
    const { error } = await supabase.from('asset_notes' as any).update({ content, updated_at: new Date().toISOString() } as any).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    await fetchNotes();
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('asset_notes' as any).delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    await fetchNotes();
  };

  return { notes, loading, addNote, updateNote, deleteNote, refetch: fetchNotes };
}
