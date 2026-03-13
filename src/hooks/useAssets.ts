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
    } else {
      setAssets((data as unknown as Asset[]) || []);
    }
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

  const addPart = async (part: Partial<AssetPart>) => {
    if (!user || !assetId) return;
    const { error } = await supabase.from('asset_parts').insert({
      ...part, asset_id: assetId, user_id: user.id,
    } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }

    // Deduct from inventory if linked
    if (part.inventory_item_id && part.quantity) {
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

  return { parts, loading, addPart, removePart, refetch: fetchParts };
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
