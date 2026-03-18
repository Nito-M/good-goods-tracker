import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ManufacturingStep {
  id: string;
  partId: string;
  stepOrder: number;
  machine: string;
  operationType: string;
  length: string | null;
  angle: string | null;
  holeDiameter: string | null;
  quantity: number | null;
  positionOffset: string | null;
  notes: string | null;
  price: number;
}

export const MACHINES = ['Saw', 'Drill Press', 'Press Brake', 'Plasma Table', 'Laser', 'Mill', 'Lathe', 'Other'] as const;
export const OPERATION_TYPES = ['Cut', 'Drill', 'Bend', 'Slot', 'Notch', 'Mark', 'Custom'] as const;

export function useManufacturingSteps(partId: string | undefined) {
  const [steps, setSteps] = useState<ManufacturingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSteps = useCallback(async () => {
    if (!partId || !user) { setSteps([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('part_manufacturing_steps')
      .select('*')
      .eq('part_id', partId)
      .order('step_order', { ascending: true });

    if (error) {
      toast({ title: 'Error loading steps', description: error.message, variant: 'destructive' });
    } else {
      setSteps((data || []).map(d => ({
        id: d.id,
        partId: d.part_id,
        stepOrder: d.step_order,
        machine: d.machine,
        operationType: d.operation_type,
        length: d.length,
        angle: d.angle,
        holeDiameter: d.hole_diameter,
        quantity: d.quantity,
        positionOffset: d.position_offset,
        notes: d.notes,
        price: d.price ?? 0,
      })));
    }
    setLoading(false);
  }, [partId, user, toast]);

  useEffect(() => { fetchSteps(); }, [fetchSteps]);

  const addStep = async (step: Partial<Omit<ManufacturingStep, 'id' | 'partId' | 'stepOrder'>>) => {
    if (!user || !partId) return null;
    const nextOrder = steps.length;
    const { data, error } = await supabase.from('part_manufacturing_steps').insert({
      part_id: partId,
      user_id: user.id,
      step_order: nextOrder,
      machine: step.machine || 'Other',
      operation_type: step.operationType || 'Custom',
      length: step.length || null,
      angle: step.angle || null,
      hole_diameter: step.holeDiameter || null,
      quantity: step.quantity || null,
      position_offset: step.positionOffset || null,
      notes: step.notes || null,
      price: step.price ?? 0,
    }).select().single();

    if (error) {
      toast({ title: 'Error adding step', description: error.message, variant: 'destructive' });
      return null;
    }
    await fetchSteps();
    return data?.id || null;
  };

  const updateStep = async (id: string, updates: Partial<Omit<ManufacturingStep, 'id' | 'partId'>>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.stepOrder !== undefined) dbUpdates.step_order = updates.stepOrder;
    if (updates.machine !== undefined) dbUpdates.machine = updates.machine;
    if (updates.operationType !== undefined) dbUpdates.operation_type = updates.operationType;
    if (updates.length !== undefined) dbUpdates.length = updates.length;
    if (updates.angle !== undefined) dbUpdates.angle = updates.angle;
    if (updates.holeDiameter !== undefined) dbUpdates.hole_diameter = updates.holeDiameter;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.positionOffset !== undefined) dbUpdates.position_offset = updates.positionOffset;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.price !== undefined) dbUpdates.price = updates.price;

    const { error } = await supabase.from('part_manufacturing_steps').update(dbUpdates).eq('id', id);
    if (error) {
      toast({ title: 'Error updating step', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchSteps();
    return true;
  };

  const deleteStep = async (id: string) => {
    const { error } = await supabase.from('part_manufacturing_steps').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting step', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchSteps();
    return true;
  };

  const reorderSteps = async (reordered: ManufacturingStep[]) => {
    // Optimistically update local state
    setSteps(reordered);
    // Persist new order
    const promises = reordered.map((s, i) =>
      supabase.from('part_manufacturing_steps').update({ step_order: i }).eq('id', s.id)
    );
    const results = await Promise.all(promises);
    const hasError = results.some(r => r.error);
    if (hasError) {
      toast({ title: 'Error reordering steps', variant: 'destructive' });
      await fetchSteps();
    }
  };

  return { steps, loading, addStep, updateStep, deleteStep, reorderSteps, refetch: fetchSteps };
}
