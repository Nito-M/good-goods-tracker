import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useModelNumberTemplate } from '@/hooks/useModelNumberTemplate';
import {
  useTrailerTypes,
  useTrailerSubtypes,
  useTrailerLengths,
  useAssemblyComponents,
  usePrebuiltAssemblies,
} from '@/hooks/useTrailerConfig';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ALL_SLOT_KINDS, SLOT_KIND_LABELS, buildModelNumber, type ModelNumberSlot, type SlotKind } from '@/lib/modelNumber';
import { Loader2, Pencil } from 'lucide-react';

export function ModelNumberTab() {
  const { template, slots, loading, updateSeparator, updateSlot, refetch } = useModelNumberTemplate();
  const { types } = useTrailerTypes();
  const { subtypes, refetch: refetchSubtypes } = useTrailerSubtypes();
  const { lengths, refetch: refetchLengths } = useTrailerLengths();
  const { components, refetch: refetchComponents } = useAssemblyComponents();
  const { assemblies: prebuilt } = usePrebuiltAssemblies();

  const [sep, setSep] = useState<string>('');
  const [editing, setEditing] = useState<ModelNumberSlot | null>(null);

  // Live preview from latest prebuilt assembly
  const preview = useMemo(() => {
    if (!template) return '';
    const latest = prebuilt[0];
    if (!latest) return '(no prebuilt to preview)';
    const findComp = (id: string | null) => id ? components.find(c => c.id === id) : null;
    return buildModelNumber({ separator: template.separator, slots }, {
      trailerType: types.find(t => t.id === latest.trailer_type_id),
      length: lengths.find(l => l.id === latest.trailer_length_id),
      axleCount: latest.under_carriage_axle_count,
      frontEnd: findComp(latest.front_end_id),
      frontEndTier2: findComp(latest.front_end_tier2_id),
      backEnd: findComp(latest.back_end_id),
      deckType: findComp(latest.deck_type_id),
      underCarriage: findComp(latest.under_carriage_id),
      underCarriageTier2: findComp(latest.under_carriage_tier2_id),
      underCarriageTier3: findComp(latest.under_carriage_tier3_id),
    });
  }, [template, slots, prebuilt, types, lengths, components]);

  if (loading || !template) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Model Number Builder</CardTitle>
          <p className="text-sm text-muted-foreground">
            Define 8 ordered positions. Each slot can map to a configurator step or fixed text.
            The model number is built by joining each slot's code in order.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="space-y-1">
              <Label>Separator</Label>
              <Input
                className="w-24"
                value={sep || template.separator}
                onChange={(e) => setSep(e.target.value)}
                onBlur={() => { if (sep && sep !== template.separator) updateSeparator(sep); }}
                placeholder="-"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label>Live preview (latest prebuilt)</Label>
              <div className="px-3 py-2 rounded-md border bg-muted font-mono text-lg">
                {preview || <span className="text-muted-foreground text-sm">—</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Slots</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {slots.map((slot) => (
            <div key={slot.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-md border bg-card">
              <div className="col-span-1">
                <Badge variant="outline">#{slot.position}</Badge>
              </div>
              <div className="col-span-4">
                <Select
                  value={slot.slot_kind}
                  onValueChange={(v) => updateSlot(slot.id, { slot_kind: v as SlotKind })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALL_SLOT_KINDS.map(k => (
                      <SelectItem key={k} value={k}>{SLOT_KIND_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-5">
                {slot.slot_kind === 'fixed' ? (
                  <Input
                    placeholder="Fixed text (e.g. X)"
                    defaultValue={slot.fixed_text || ''}
                    onBlur={(e) => {
                      if (e.target.value !== (slot.fixed_text || '')) {
                        updateSlot(slot.id, { fixed_text: e.target.value });
                      }
                    }}
                  />
                ) : slot.slot_kind === 'empty' ? (
                  <span className="text-xs text-muted-foreground">Skipped</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Uses each option's Model Code (override per slot if needed).
                  </span>
                )}
              </div>
              <div className="col-span-2 text-right">
                {slot.slot_kind !== 'empty' && slot.slot_kind !== 'fixed' && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(slot)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit codes
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {editing && (
        <CodesDialog
          slot={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await Promise.all([refetch(), refetchSubtypes(), refetchLengths(), refetchComponents()]);
          }}
        />
      )}
    </div>
  );
}

function CodesDialog({
  slot,
  onClose,
  onSaved,
}: {
  slot: ModelNumberSlot;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { types } = useTrailerTypes();
  const { subtypes } = useTrailerSubtypes();
  const { lengths } = useTrailerLengths();
  const { components } = useAssemblyComponents();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>(slot.override_codes || {});
  const [axleNumbers] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8]);

  const items = useMemo(() => {
    switch (slot.slot_kind) {
      case 'trailer_type':
        return types.map(t => ({ id: t.id, name: t.name, defaultCode: (t as any).model_code, table: 'trailer_types' as const }));
      case 'trailer_subtype':
        return subtypes.map(s => ({ id: s.id, name: s.name, defaultCode: (s as any).model_code, table: 'trailer_subtypes' as const }));
      case 'trailer_length':
        return lengths.map(l => ({ id: l.id, name: l.label, defaultCode: (l as any).model_code, table: 'trailer_lengths' as const }));
      case 'front_end':
        return components.filter(c => c.category === 'front_end' && !c.parent_component_id).map(c => ({ id: c.id, name: c.name, defaultCode: (c as any).model_code, table: 'assembly_components' as const }));
      case 'front_end_tier2':
        return components.filter(c => c.category === 'front_end' && c.parent_component_id).map(c => ({ id: c.id, name: c.name, defaultCode: (c as any).model_code, table: 'assembly_components' as const }));
      case 'back_end':
        return components.filter(c => c.category === 'back_end').map(c => ({ id: c.id, name: c.name, defaultCode: (c as any).model_code, table: 'assembly_components' as const }));
      case 'deck_type':
        return components.filter(c => c.category === 'deck_type').map(c => ({ id: c.id, name: c.name, defaultCode: (c as any).model_code, table: 'assembly_components' as const }));
      case 'under_carriage':
        return components.filter(c => c.category === 'under_carriage' && !c.parent_component_id).map(c => ({ id: c.id, name: c.name, defaultCode: (c as any).model_code, table: 'assembly_components' as const }));
      case 'under_carriage_tier2':
        return components.filter(c => c.category === 'under_carriage' && c.parent_component_id).map(c => ({ id: c.id, name: c.name, defaultCode: (c as any).model_code, table: 'assembly_components' as const }));
      case 'under_carriage_tier3': {
        const tier2Ids = new Set(components.filter(c => c.category === 'under_carriage' && c.parent_component_id).map(c => c.id));
        return components.filter(c => c.category === 'under_carriage' && c.parent_component_id && tier2Ids.has(c.parent_component_id)).map(c => ({ id: c.id, name: c.name, defaultCode: (c as any).model_code, table: 'assembly_components' as const }));
      }
      default:
        return [];
    }
  }, [slot.slot_kind, types, subtypes, lengths, components]);

  const [defaultEdits, setDefaultEdits] = useState<Record<string, string>>({});

  const handleSave = async () => {
    setSaving(true);
    try {
      const groups: Record<string, { id: string; code: string }[]> = {};
      for (const it of items) {
        const v = defaultEdits[it.id];
        if (v !== undefined && v !== (it.defaultCode || '')) {
          if (!groups[it.table]) groups[it.table] = [];
          groups[it.table].push({ id: it.id, code: v });
        }
      }
      for (const [table, rows] of Object.entries(groups)) {
        for (const r of rows) {
          await (supabase as any).from(table).update({ model_code: r.code || null }).eq('id', r.id);
        }
      }
      await supabase
        .from('model_number_slots')
        .update({ override_codes: overrides } as any)
        .eq('id', slot.id);

      await onSaved();
      toast({ title: 'Saved' });
      onClose();
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to save codes.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const isAxle = slot.slot_kind === 'axle_count';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit codes — Slot #{slot.position} · {SLOT_KIND_LABELS[slot.slot_kind]}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {isAxle ? (
            <>
              <p className="text-sm text-muted-foreground">Set a code per axle count. Leave blank to use the number itself.</p>
              {axleNumbers.map(n => (
                <div key={n} className="grid grid-cols-2 gap-2 items-center">
                  <Label>{n} Axle{n === 1 ? '' : 's'}</Label>
                  <Input
                    value={overrides[String(n)] ?? ''}
                    onChange={(e) => setOverrides({ ...overrides, [String(n)]: e.target.value })}
                    placeholder={String(n)}
                  />
                </div>
              ))}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                "Default code" is saved on the item itself (used by every slot). "Override" only applies to this slot.
              </p>
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                <div className="col-span-6">Item</div>
                <div className="col-span-3">Default code</div>
                <div className="col-span-3">Override (this slot)</div>
              </div>
              {items.length === 0 && (
                <div className="text-sm text-muted-foreground py-4 text-center">No items in this category yet.</div>
              )}
              {items.map(it => (
                <div key={it.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6 text-sm">{it.name}</div>
                  <div className="col-span-3">
                    <Input
                      value={defaultEdits[it.id] ?? (it.defaultCode || '')}
                      onChange={(e) => setDefaultEdits({ ...defaultEdits, [it.id]: e.target.value })}
                      placeholder="—"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      value={overrides[it.id] ?? ''}
                      onChange={(e) => setOverrides({ ...overrides, [it.id]: e.target.value })}
                      placeholder="—"
                    />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
