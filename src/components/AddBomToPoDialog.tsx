import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem } from '@/types/inventory';

export interface BomPrefillItem {
  inventory_item_id: string;
  name: string;
  sku: string | null;
  quantity: number;
  unit_cost: number;
  notes: string;
}

interface SopOption {
  id: string;
  title: string;
  sop_number: string | null;
}

interface AddBomToPoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryItems: InventoryItem[];
  onAdd: (items: BomPrefillItem[]) => void;
}

export function AddBomToPoDialog({ open, onOpenChange, inventoryItems, onAdd }: AddBomToPoDialogProps) {
  const { toast } = useToast();
  const [sops, setSops] = useState<SopOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSopId, setSelectedSopId] = useState<string>('');
  const [multiplier, setMultiplier] = useState('1');
  const [adding, setAdding] = useState(false);

  const itemsById = useMemo(
    () => new Map(inventoryItems.map((i) => [i.id, i])),
    [inventoryItems]
  );

  useEffect(() => {
    if (!open) return;
    setSelectedSopId('');
    setMultiplier('1');
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from('sops' as any)
        .select('id, title, sop_number')
        .order('updated_at', { ascending: false });
      setSops(((data as any[]) || []) as SopOption[]);
      setLoading(false);
    })();
  }, [open]);

  const handleAdd = async () => {
    if (!selectedSopId) return;
    setAdding(true);
    const mult = parseFloat(multiplier);
    const factor = Number.isFinite(mult) && mult > 0 ? mult : 1;

    const { data, error } = await supabase
      .from('sop_bom_items' as any)
      .select('inventory_item_id, quantity, notes')
      .eq('sop_id', selectedSopId);

    setAdding(false);

    if (error) {
      toast({ title: 'Could not load BOM', description: error.message, variant: 'destructive' });
      return;
    }

    const rows = ((data as any[]) || []).filter((r) => r.inventory_item_id);
    const prefill: BomPrefillItem[] = rows
      .map((r) => {
        const inv = itemsById.get(r.inventory_item_id);
        if (!inv) return null;
        return {
          inventory_item_id: inv.id,
          name: inv.name,
          sku: inv.sku || null,
          quantity: Math.round(Number(r.quantity || 0) * factor * 100000) / 100000,
          unit_cost: inv.cost || 0,
          notes: r.notes || '',
        };
      })
      .filter(Boolean) as BomPrefillItem[];

    if (prefill.length === 0) {
      toast({ title: 'Nothing to add', description: 'This SOP has no bill of materials items.' });
      return;
    }

    onAdd(prefill);
    toast({ title: 'BOM added', description: `${prefill.length} item(s) added to this purchase order.` });
    onOpenChange(false);
  };

  const selected = sops.find((s) => s.id === selectedSopId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add BOM to this PO</DialogTitle>
          <DialogDescription>
            Pick a procedure (SOP) and its bill of materials will be added as line items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Procedure / SOP</Label>
            <div className="border rounded-md">
              <Command>
                <CommandInput placeholder="Search procedures..." />
                <CommandList className="max-h-56">
                  {loading ? (
                    <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>No procedures found.</CommandEmpty>
                      <CommandGroup>
                        {sops.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={`${s.title} ${s.sop_number || ''}`}
                            onSelect={() => setSelectedSopId(s.id)}
                          >
                            <Check
                              className={cn('mr-2 h-4 w-4', selectedSopId === s.id ? 'opacity-100' : 'opacity-0')}
                            />
                            <span className="truncate">
                              {s.title}
                              {s.sop_number ? ` (${s.sop_number})` : ''}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bom-po-multiplier">Qty x</Label>
            <Input
              id="bom-po-multiplier"
              type="number"
              min="0"
              step="0.01"
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
              className="w-28"
            />
            <p className="text-xs text-muted-foreground">Every BOM quantity is multiplied by this amount.</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedSopId || adding}>
            {adding ? 'Adding...' : selected ? 'Add BOM items' : 'Select a procedure'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
