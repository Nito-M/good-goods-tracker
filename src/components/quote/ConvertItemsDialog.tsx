import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Quote } from '@/types/quote';
import { formatCurrency } from '@/lib/utils';

interface ConvertItemsDialogProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selections: { itemId: string; quantity: number }[]) => Promise<void> | void;
}

export function ConvertItemsDialog({ quote, open, onOpenChange, onConfirm }: ConvertItemsDialogProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const remainingOf = (item: { quantity: number; invoicedQuantity?: number }) =>
    Math.max(0, item.quantity - (item.invoicedQuantity || 0));

  useEffect(() => {
    if (open && quote) {
      setSelected({});
      setQuantities(Object.fromEntries(quote.items.map((i) => [i.id, remainingOf(i)])));
    }
  }, [open, quote]);

  const netUnit = (unitPrice: number, discountRate?: number) =>
    unitPrice * (1 - (discountRate || 0) / 100);

  const selectedTotal = useMemo(() => {
    if (!quote) return 0;
    const subtotal = quote.items.reduce((sum, item) => {
      if (!selected[item.id]) return sum;
      const qty = Math.min(quantities[item.id] || 0, remainingOf(item));
      return sum + qty * netUnit(item.unitPrice, item.discountRate);
    }, 0);
    const afterDiscount = subtotal - subtotal * (quote.discountRate / 100);
    return afterDiscount + afterDiscount * (quote.taxRate / 100);
  }, [quote, selected, quantities]);

  const selectedCount = Object.values(selected).filter(Boolean).length;

  if (!quote) return null;

  const availableItems = quote.items.filter((i) => remainingOf(i) > 0);
  const allSelected = selectedCount === availableItems.length && availableItems.length > 0;

  const handleConfirm = async () => {
    setSubmitting(true);
    const selections = quote.items
      .filter((i) => selected[i.id] && (quantities[i.id] || 0) > 0 && remainingOf(i) > 0)
      .map((i) => ({ itemId: i.id, quantity: Math.min(quantities[i.id], remainingOf(i)) }));
    await onConfirm(selections);
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Selected Items</DialogTitle>
          <DialogDescription>
            Pick which line items of {quote.quoteNumber} to convert into an invoice. You can also
            invoice part of a line's quantity. Already invoiced quantities can't be invoiced again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all-items"
              checked={allSelected}
              onCheckedChange={(checked) =>
                setSelected(
                  checked
                    ? Object.fromEntries(availableItems.map((i) => [i.id, true]))
                    : {}
                )
              }
            />
            <Label htmlFor="select-all-items" className="text-sm font-normal cursor-pointer">
              Select all remaining items
            </Label>
          </div>

          <div className="space-y-2">
            {quote.items.map((item) => {
              const remaining = remainingOf(item);
              const fullyInvoiced = remaining <= 0;
              const isSelected = !fullyInvoiced && !!selected[item.id];
              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-3 flex items-start gap-3 bg-card ${fullyInvoiced ? 'opacity-60' : ''}`}
                >
                  <Checkbox
                    className="mt-1"
                    checked={isSelected}
                    disabled={fullyInvoiced}
                    onCheckedChange={(checked) =>
                      setSelected((prev) => ({ ...prev, [item.id]: !!checked }))
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium break-words">{item.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.sku ? `${item.sku} · ` : ''}
                      {item.quantity} {item.quantityUnit || ''} ×{' '}
                      {formatCurrency(netUnit(item.unitPrice, item.discountRate))}
                    </p>
                    {(item.invoicedQuantity || 0) > 0 && (
                      <p className="text-xs mt-1 text-muted-foreground">
                        {fullyInvoiced
                          ? 'Fully invoiced'
                          : `${item.invoicedQuantity} already invoiced · ${remaining} remaining`}
                      </p>
                    )}
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-xs">Qty to invoice</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      max={remaining}
                      disabled={!isSelected}
                      value={fullyInvoiced ? 0 : quantities[item.id] ?? remaining}
                      onChange={(e) =>
                        setQuantities((prev) => ({
                          ...prev,
                          [item.id]: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-3 flex justify-between text-sm">
            <span className="text-muted-foreground">
              {selectedCount} item{selectedCount === 1 ? '' : 's'} selected
            </span>
            <span className="font-semibold">Invoice total: {formatCurrency(selectedTotal)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={submitting || selectedCount === 0}>
            {submitting ? 'Creating...' : 'Create Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
