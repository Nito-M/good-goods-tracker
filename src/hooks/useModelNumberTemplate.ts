import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { ModelNumberSlot, ModelNumberTemplate, SlotKind } from '@/lib/modelNumber';

export function useModelNumberTemplate() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [template, setTemplate] = useState<ModelNumberTemplate | null>(null);
  const [slots, setSlots] = useState<ModelNumberSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    // Try to find existing template (own or shared org)
    const { data: tplRows } = await (supabase as any)
      .from('model_number_template')
      .select('*')
      .limit(1);

    let tpl = (tplRows || [])[0] as ModelNumberTemplate | undefined;

    // None exists — create one with 8 empty slots
    if (!tpl) {
      const { data: created, error } = await (supabase as any)
        .from('model_number_template')
        .insert({ user_id: user.id, separator: '-' })
        .select()
        .single();
      if (error) {
        console.error('create template', error);
        setLoading(false);
        return;
      }
      tpl = created as ModelNumberTemplate;
      const seedSlots = Array.from({ length: 8 }).map((_, i) => ({
        template_id: tpl!.id,
        user_id: user.id,
        position: i + 1,
        slot_kind: 'empty' as SlotKind,
      }));
      await (supabase as any).from('model_number_slots').insert(seedSlots);
    }

    setTemplate(tpl as ModelNumberTemplate);

    const { data: slotRows } = await (supabase as any)
      .from('model_number_slots')
      .select('*')
      .eq('template_id', tpl!.id)
      .order('position');

    setSlots(((slotRows || []) as any[]).map(r => ({
      ...r,
      override_codes: r.override_codes || {},
      conditional_rules: r.conditional_rules || [],
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateSeparator = async (separator: string) => {
    if (!template) return;
    const { error } = await (supabase as any)
      .from('model_number_template')
      .update({ separator })
      .eq('id', template.id);
    if (error) toast({ title: 'Error', description: 'Failed to update separator.', variant: 'destructive' });
    else setTemplate({ ...template, separator });
  };

  const updateSlot = async (id: string, updates: Partial<Pick<ModelNumberSlot, 'slot_kind' | 'fixed_text' | 'override_codes' | 'separator_after' | 'conditional_rules' | 'secondary_slot_kind' | 'secondary_fixed_text'>>) => {
    const { error } = await (supabase as any)
      .from('model_number_slots')
      .update(updates as any)
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update slot.', variant: 'destructive' });
      return;
    }
    setSlots(prev => prev.map(s => s.id === id ? {
      ...s,
      ...updates,
      override_codes: (updates.override_codes as any) ?? s.override_codes,
      conditional_rules: (updates.conditional_rules as any) ?? s.conditional_rules,
    } as ModelNumberSlot : s));
  };

  return { template, slots, loading, updateSeparator, updateSlot, refetch: fetchAll };
}
