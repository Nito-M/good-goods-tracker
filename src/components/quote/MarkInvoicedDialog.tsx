import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

interface MarkInvoicedDialogProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (updates: { itemId: string; quantity: number }[]) => Promise<void> | void;
}

export function MarkInvoicedDialog({ quote, open, onOpenChange, onConfirm }: MarkInvoicedDialogProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && quote) {
      setQuantities(
        Object.fromEntries(quote.items.map((i) => [i.id, i.invoicedQuantity || 0]))
      );
    }
  }, [open, quote]);

  if (!quote) return null;

  const netUnit = (unitPrice: number, discountRate?: number) =>
    unitPrice * (1 - (discountRate || 0) / 100);

  const handleConfirm = async () => {
    setSubmitting(true);
    const updates = quote.items.map((i) => ({
      itemId: i.id,
      quantity: Math.min(Math.max(0, quantities[i.id] ?? 0), i.quantity),
    }));
    await onConfirm(updates);
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark Items as Invoiced</DialogTitle>
          <DialogDescription>
            Set how much of each line of {quote.quoteNumber} was already invoiced. Use this to record
            invoices that were created before per-line tracking existed. This does not create a new
            invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setQuantities(Object.fromEntries(quote.items.map((i) => [i.id, i.quantity])))
              }
            >
              Mark all as invoiced
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantities(Object.fromEntries(quote.items.map((i) => [i.id, 0])))}
            >
              Clear all
            </Button>
          </div>

          <div className="space-y-2">
            {quote.items.map((item) => {
              const value = quantities[item.id] ?? 0;
              const fully = value >= item.quantity;
              return (
                <div key={item.id} className="border rounded-lg p-3 flex items-start gap-3 bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium break-words">{item.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.sku ? `${item.sku} · ` : ''}
                      {item.quantity} {item.quantityUnit || ''} ×{' '}
                      {formatCurrency(netUnit(item.unitPrice, item.discountRate))}
                    </p>
                    <div className="mt-1">
                      {fully ? (
                        <Badge className="bg-success text-success-foreground text-xs">Invoiced</Badge>
                      ) : value > 0 ? (
                        <Badge variant="secondary" className="text-xs">
                          Partially invoiced ({value} of {item.quantity})
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Not invoiced
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-xs">Invoiced qty</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      max={item.quantity}
                      value={value}
                      onChange={(e) =>
                        setQuantities((prev) => ({
                          ...prev,
                          [item.id]: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs w-full"
                      onClick={() =>
                        setQuantities((prev) => ({
                          ...prev,
                          [item.id]: fully ? 0 : item.quantity,
                        }))
                      }
                    >
                      {fully ? 'Unmark' : 'Full'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
