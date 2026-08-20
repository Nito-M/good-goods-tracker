import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Sale } from '@/types/sale';
import { formatCurrency } from '@/lib/utils';

interface ManagePickupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale;
  onSave: (saleId: string, pickedItemIds: string[]) => Promise<boolean | void>;
}

export function ManagePickupDialog({ open, onOpenChange, sale, onSave }: ManagePickupDialogProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(sale.items.filter((i) => !!i.pickedUpAt).map((i) => i.id));
    }
  }, [open, sale.items]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const allSelected = selected.length === sale.items.length && sale.items.length > 0;

  const handleSave = async () => {
    setSaving(true);
    await onSave(sale.id, selected);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" /> Manage Pickup — {sale.invoiceNumber}
          </DialogTitle>
          <DialogDescription>
            Check the items that have been picked up. Checking an item reduces inventory; unchecking
            restores it.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(allSelected ? [] : sale.items.map((i) => i.id))}
          >
            {allSelected ? 'Clear all' : 'Select all'}
          </Button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto space-y-2">
          {sale.items.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50"
            >
              <Checkbox
                checked={selected.includes(item.id)}
                onCheckedChange={() => toggle(item.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium break-words">{item.itemName}</span>
                  {item.pickedUpAt && (
                    <Badge variant="secondary" className="text-xs">
                      Already picked up
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.sku ? `${item.sku} · ` : ''}Qty {item.quantity} ·{' '}
                  {formatCurrency(item.totalPrice)}
                </div>
              </div>
            </label>
          ))}
          {sale.items.length === 0 && (
            <p className="text-sm text-muted-foreground">No items on this invoice.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
