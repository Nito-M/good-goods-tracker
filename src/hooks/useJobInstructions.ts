import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface JobInstruction {
  id: string;
  job_id: string;
  user_id: string;
  title: string;
  content: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface JobInstructionFile {
  id: string;
  instruction_id: string;
  user_id: string;
  file_name: string;
  file_url: string; // storage path
  file_type: string | null;
  display_order: number;
  created_at: string;
}

const BUCKET = 'job-instruction-files';

export function useJobInstructions(jobId: string | null) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [instructions, setInstructions] = useState<JobInstruction[]>([]);
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const fetchInstructions = useCallback(async () => {
    if (!jobId) { setInstructions([]); setFileCounts({}); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('job_instructions')
      .select('*')
      .eq('job_id', jobId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error loading job instructions:', error);
      setInstructions([]);
    } else {
      const list = (data as JobInstruction[]) || [];
      setInstructions(list);
      if (list.length > 0) {
        const { data: files } = await supabase
          .from('job_instruction_files')
          .select('instruction_id')
          .in('instruction_id', list.map(i => i.id));
        const counts: Record<string, number> = {};
        (files || []).forEach((f: any) => {
          counts[f.instruction_id] = (counts[f.instruction_id] || 0) + 1;
        });
        setFileCounts(counts);
      } else {
        setFileCounts({});
      }
    }
    setLoading(false);
  }, [jobId]);

  useEffect(() => { fetchInstructions(); }, [fetchInstructions]);

  const createInstruction = async (title: string, content: string | null): Promise<string | null> => {
    if (!user || !jobId) return null;
    const { data, error } = await supabase
      .from('job_instructions')
      .insert([{ job_id: jobId, user_id: user.id, title, content }])
      .select('id')
      .single();
    if (error) {
      toast({ title: 'Error creating instruction', description: error.message, variant: 'destructive' });
      return null;
    }
    await fetchInstructions();
    return data?.id ?? null;
  };

  const updateInstruction = async (id: string, patch: { title?: string; content?: string | null }) => {
    const { error } = await supabase.from('job_instructions').update(patch).eq('id', id);
    if (error) {
      toast({ title: 'Error saving instruction', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchInstructions();
    return true;
  };

  const deleteInstruction = async (id: string) => {
    // Best-effort: remove files from storage
    const { data: files } = await supabase
      .from('job_instruction_files')
      .select('file_url')
      .eq('instruction_id', id);
    const paths = (files || []).map((f: any) => f.file_url).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from(BUCKET).remove(paths);
    }
    const { error } = await supabase.from('job_instructions').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting instruction', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchInstructions();
  };

  return { instructions, fileCounts, loading, createInstruction, updateInstruction, deleteInstruction, refetch: fetchInstructions };
}

export interface JobInstructionPart {
  id: string;
  instruction_id: string;
  user_id: string;
  inventory_item_id: string | null;
  item_name: string;
  sku: string;
  quantity: number;
  notes: string | null;
  display_order: number;
  created_at: string;
}

export function useJobInstruction(instructionId: string | null) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [instruction, setInstruction] = useState<JobInstruction | null>(null);
  const [files, setFiles] = useState<JobInstructionFile[]>([]);
  const [parts, setParts] = useState<JobInstructionPart[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!instructionId) { setInstruction(null); setFiles([]); setParts([]); return; }
    setLoading(true);
    const [{ data: ins }, { data: fs }, { data: ps }] = await Promise.all([
      supabase.from('job_instructions').select('*').eq('id', instructionId).maybeSingle(),
      supabase.from('job_instruction_files').select('*').eq('instruction_id', instructionId).order('created_at', { ascending: true }),
      supabase.from('job_instruction_parts').select('*').eq('instruction_id', instructionId).order('created_at', { ascending: true }),
    ]);
    setInstruction((ins as JobInstruction) || null);
    setFiles((fs as JobInstructionFile[]) || []);
    setParts(((ps as any[]) || []).map(p => ({ ...p, quantity: Number(p.quantity) })) as JobInstructionPart[]);
    setLoading(false);
  }, [instructionId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const uploadFile = async (file: File): Promise<boolean> => {
    if (!user || !instructionId || !instruction) return false;
    const ext = file.name.includes('.') ? file.name.split('.').pop() : '';
    const path = `${instruction.job_id}/${instructionId}/${crypto.randomUUID()}${ext ? '.' + ext : ''}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type });
    if (upErr) {
      toast({ title: 'Upload failed', description: upErr.message, variant: 'destructive' });
      return false;
    }
    const { error: insErr } = await supabase.from('job_instruction_files').insert([{
      instruction_id: instructionId,
      user_id: user.id,
      file_name: file.name,
      file_url: path,
      file_type: file.type || null,
    }]);
    if (insErr) {
      toast({ title: 'Error saving file', description: insErr.message, variant: 'destructive' });
      return false;
    }
    await fetchAll();
    return true;
  };

  const deleteFile = async (id: string) => {
    const target = files.find(f => f.id === id);
    if (!target) return;
    await supabase.storage.from(BUCKET).remove([target.file_url]);
    const { error } = await supabase.from('job_instruction_files').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting file', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchAll();
  };

  const getSignedUrl = async (id: string): Promise<string | null> => {
    const target = files.find(f => f.id === id);
    if (!target) return null;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(target.file_url, 60 * 60);
    if (error) {
      toast({ title: 'Error opening file', description: error.message, variant: 'destructive' });
      return null;
    }
    return data?.signedUrl || null;
  };

  const addPart = async (input: { inventoryItemId: string | null; itemName: string; sku: string; quantity?: number; notes?: string | null }) => {
    if (!user || !instructionId) return;
    const { error } = await supabase.from('job_instruction_parts').insert([{
      instruction_id: instructionId,
      user_id: user.id,
      inventory_item_id: input.inventoryItemId,
      item_name: input.itemName,
      sku: input.sku || '',
      quantity: input.quantity ?? 1,
      notes: input.notes ?? null,
    }]);
    if (error) {
      toast({ title: 'Error adding part', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchAll();
  };

  const updatePart = async (id: string, patch: Partial<Pick<JobInstructionPart, 'quantity' | 'notes' | 'item_name' | 'sku'>>) => {
    const { error } = await supabase.from('job_instruction_parts').update(patch).eq('id', id);
    if (error) {
      toast({ title: 'Error updating part', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchAll();
  };

  const removePart = async (id: string) => {
    const { error } = await supabase.from('job_instruction_parts').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error removing part', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchAll();
  };

  return { instruction, files, parts, loading, uploadFile, deleteFile, getSignedUrl, addPart, updatePart, removePart, refetch: fetchAll };
}

