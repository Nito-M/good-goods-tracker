import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const BUCKET = 'sop-files';
const SIGNED_TTL = 60 * 60 * 6;

export interface SopStep {
  id: string;
  sop_id: string;
  sort_order: number;
  content: string | null;
  warnings: string | null;
  notes: string | null;
  tips: string | null;
  required_tools: string | null;
  estimated_minutes: number | null;
}

export interface SopStepFile {
  id: string; step_id: string; storage_path: string;
  file_name: string; mime_type: string | null; size_bytes: number | null;
}

export interface SopStepItem {
  id: string; step_id: string; inventory_item_id: string;
  quantity: number; notes: string | null; sort_order: number;
}

export interface SopBomItem {
  id: string; sop_id: string; inventory_item_id: string;
  quantity: number; is_optional: boolean; substitute_of_id: string | null;
  notes: string | null; sort_order: number;
}

export interface SopAttachment {
  id: string; sop_id: string; storage_path: string;
  file_name: string; mime_type: string | null; size_bytes: number | null;
}

export interface SopLocation {
  id: string; sop_id: string; name: string; url: string | null; sort_order: number;
}

export interface SopRecord {
  id: string; user_id: string; category_id: string | null;
  title: string; sop_number: string | null; department: string | null;
  revision_number: string | null; effective_date: string | null;
  last_updated_date: string | null; author: string | null; approved_by: string | null;
  status: 'draft' | 'active' | 'obsolete';
}

export function useSopDetail(sopId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sop, setSop] = useState<SopRecord | null>(null);
  const [steps, setSteps] = useState<SopStep[]>([]);
  const [stepFiles, setStepFiles] = useState<SopStepFile[]>([]);
  const [stepItems, setStepItems] = useState<SopStepItem[]>([]);
  const [bom, setBom] = useState<SopBomItem[]>([]);
  const [attachments, setAttachments] = useState<SopAttachment[]>([]);
  const [locations, setLocations] = useState<SopLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!sopId) { setLoading(false); return; }
    setLoading(true);
    const { data: sopRow } = await supabase.from('sops' as any).select('*').eq('id', sopId).maybeSingle();
    setSop((sopRow as any) || null);

    const { data: stepRows } = await supabase.from('sop_steps' as any).select('*').eq('sop_id', sopId).order('sort_order');
    const stepList = (stepRows as any as SopStep[]) || [];
    setSteps(stepList);
    const stepIds = stepList.map(s => s.id);

    if (stepIds.length) {
      const [{ data: files }, { data: items }] = await Promise.all([
        supabase.from('sop_step_files' as any).select('*').in('step_id', stepIds),
        supabase.from('sop_step_items' as any).select('*').in('step_id', stepIds).order('sort_order'),
      ]);
      setStepFiles((files as any) || []);
      setStepItems((items as any) || []);
    } else { setStepFiles([]); setStepItems([]); }

    const [{ data: bomRows }, { data: attachRows }, { data: locRows }] = await Promise.all([
      supabase.from('sop_bom_items' as any).select('*').eq('sop_id', sopId).order('sort_order'),
      supabase.from('sop_attachments' as any).select('*').eq('sop_id', sopId),
      supabase.from('sop_locations' as any).select('*').eq('sop_id', sopId).order('sort_order'),
    ]);
    setBom((bomRows as any) || []);
    setAttachments((attachRows as any) || []);
    setLocations((locRows as any) || []);
    setLoading(false);
  }, [sopId]);

  useEffect(() => { refetch(); }, [refetch]);

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pendingUpdates = useRef<Partial<SopRecord>>({});

  const updateSop = (updates: Partial<SopRecord>) => {
    if (!sopId) return;
    // Optimistic local update — no await, no round-trip lag while typing
    setSop(prev => prev ? { ...prev, ...updates } as SopRecord : prev);
    pendingUpdates.current = { ...pendingUpdates.current, ...updates };
    if (saveTimers.current.sop) clearTimeout(saveTimers.current.sop);
    saveTimers.current.sop = setTimeout(async () => {
      const patch = { ...pendingUpdates.current, last_updated_date: new Date().toISOString().slice(0, 10) };
      pendingUpdates.current = {};
      const { error } = await supabase.from('sops' as any).update(patch).eq('id', sopId);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
      else setSop(prev => prev ? { ...prev, last_updated_date: patch.last_updated_date } as SopRecord : prev);
    }, 500);
  };

  const addStep = async () => {
    if (!sopId) return;
    const nextOrder = steps.length ? Math.max(...steps.map(s => s.sort_order)) + 1 : 0;
    const { data, error } = await supabase.from('sop_steps' as any)
      .insert({ sop_id: sopId, sort_order: nextOrder, content: '' })
      .select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setSteps(prev => [...prev, data as any]);
  };

  const stepPending = useRef<Record<string, Partial<SopStep>>>({});
  const updateStep = (id: string, updates: Partial<SopStep>) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    stepPending.current[id] = { ...(stepPending.current[id] || {}), ...updates };
    const key = `step:${id}`;
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(async () => {
      const patch = stepPending.current[id];
      delete stepPending.current[id];
      const { error } = await supabase.from('sop_steps' as any).update(patch).eq('id', id);
      if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }, 500);
  };

  const deleteStep = async (id: string) => {
    const { error } = await supabase.from('sop_steps' as any).delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setSteps(prev => prev.filter(s => s.id !== id));
    setStepFiles(prev => prev.filter(f => f.step_id !== id));
    setStepItems(prev => prev.filter(i => i.step_id !== id));
  };

  const reorderSteps = async (orderedIds: string[]) => {
    const map = new Map(orderedIds.map((id, i) => [id, i]));
    setSteps(prev => [...prev].sort((a, b) => (map.get(a.id) ?? 0) - (map.get(b.id) ?? 0))
      .map((s, i) => ({ ...s, sort_order: i })));
    await Promise.all(orderedIds.map((id, i) =>
      supabase.from('sop_steps' as any).update({ sort_order: i }).eq('id', id)));
  };

  const uploadStepFile = async (stepId: string, file: File) => {
    if (!user) return;
    const path = `${user.id}/${sopId}/${stepId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, '_')}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (upErr) { toast({ title: 'Upload failed', description: upErr.message, variant: 'destructive' }); return; }
    const { data, error } = await supabase.from('sop_step_files' as any).insert({
      step_id: stepId, storage_path: path, file_name: file.name,
      mime_type: file.type, size_bytes: file.size,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setStepFiles(prev => [...prev, data as any]);
  };

  const deleteStepFile = async (id: string) => {
    const target = stepFiles.find(f => f.id === id); if (!target) return;
    await supabase.storage.from(BUCKET).remove([target.storage_path]);
    await supabase.from('sop_step_files' as any).delete().eq('id', id);
    setStepFiles(prev => prev.filter(f => f.id !== id));
  };

  const addStepItem = async (stepId: string, inventoryItemId: string, quantity = 1) => {
    if (stepItems.some(i => i.step_id === stepId && i.inventory_item_id === inventoryItemId)) return;
    const nextOrder = stepItems.filter(i => i.step_id === stepId).length;
    const { data, error } = await supabase.from('sop_step_items' as any).insert({
      step_id: stepId, inventory_item_id: inventoryItemId, quantity, sort_order: nextOrder,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setStepItems(prev => [...prev, data as any]);
  };

  const updateStepItem = async (id: string, updates: Partial<SopStepItem>) => {
    setStepItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    await supabase.from('sop_step_items' as any).update(updates).eq('id', id);
  };

  const removeStepItem = async (id: string) => {
    await supabase.from('sop_step_items' as any).delete().eq('id', id);
    setStepItems(prev => prev.filter(i => i.id !== id));
  };

  const addBomItem = async (inventoryItemId: string, quantity = 1, opts?: { isOptional?: boolean; substituteOfId?: string | null }) => {
    if (!sopId) return;
    const nextOrder = bom.length;
    const { data, error } = await supabase.from('sop_bom_items' as any).insert({
      sop_id: sopId, inventory_item_id: inventoryItemId, quantity,
      is_optional: opts?.isOptional || false,
      substitute_of_id: opts?.substituteOfId || null,
      sort_order: nextOrder,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setBom(prev => [...prev, data as any]);
  };

  const updateBomItem = async (id: string, updates: Partial<SopBomItem>) => {
    setBom(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    await supabase.from('sop_bom_items' as any).update(updates).eq('id', id);
  };

  const removeBomItem = async (id: string) => {
    await supabase.from('sop_bom_items' as any).delete().eq('id', id);
    setBom(prev => prev.filter(b => b.id !== id));
  };

  const uploadAttachment = async (file: File) => {
    if (!user || !sopId) return;
    const path = `${user.id}/${sopId}/attachments/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, '_')}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (upErr) { toast({ title: 'Upload failed', description: upErr.message, variant: 'destructive' }); return; }
    const { data, error } = await supabase.from('sop_attachments' as any).insert({
      sop_id: sopId, storage_path: path, file_name: file.name,
      mime_type: file.type, size_bytes: file.size,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setAttachments(prev => [...prev, data as any]);
  };

  const deleteAttachment = async (id: string) => {
    const target = attachments.find(a => a.id === id); if (!target) return;
    await supabase.storage.from(BUCKET).remove([target.storage_path]);
    await supabase.from('sop_attachments' as any).delete().eq('id', id);
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const getSignedUrl = async (storagePath: string) => {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, SIGNED_TTL);
    return data?.signedUrl || null;
  };

  return {
    sop, steps, stepFiles, stepItems, bom, attachments, loading,
    refetch, updateSop,
    addStep, updateStep, deleteStep, reorderSteps,
    uploadStepFile, deleteStepFile,
    addStepItem, updateStepItem, removeStepItem,
    addBomItem, updateBomItem, removeBomItem,
    uploadAttachment, deleteAttachment,
    getSignedUrl,
  };
}
