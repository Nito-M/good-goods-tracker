import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface AssemblyPreviewItem {
  itemName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  notes: string | null;
}

interface AssemblyPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  description: string | null;
  sellingPrice: number;
  totalCost: number;
  hidePrices?: boolean;
  items: AssemblyPreviewItem[];
}

export function AssemblyPreviewDialog({ open, onOpenChange, name, description, sellingPrice, totalCost, hidePrices, items }: AssemblyPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Assembly Preview</DialogTitle>
        </DialogHeader>

        {/* A4-like preview */}
        <div className="bg-white text-black rounded-md border shadow-sm p-8 space-y-4" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
          {/* Title */}
          <h1 className="text-2xl font-bold">{name}</h1>

          {/* Description */}
          {description && (
            <p className="text-sm" style={{ color: '#646464' }}>{description}</p>
          )}

          {/* Pricing info */}
          {!hidePrices && (
            <div className="text-sm space-y-0.5">
              {sellingPrice > 0 && <p>Selling Price: {formatCurrency(sellingPrice)}</p>}
              {totalCost > 0 && <p>Total Cost: {formatCurrency(totalCost)}</p>}
            </div>
          )}

          <Separator />

          {/* Parts count */}
          <h2 className="text-base font-bold">Parts List ({items.length})</h2>

          {/* Table */}
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th className="text-left px-2 py-1.5 font-semibold border-r">Item Name</th>
                  <th className="text-left px-2 py-1.5 font-semibold border-r">SKU</th>
                  <th className="text-left px-2 py-1.5 font-semibold border-r w-12">Qty</th>
                  {!hidePrices && <th className="text-left px-2 py-1.5 font-semibold border-r w-20">Unit Cost</th>}
                  <th className="text-left px-2 py-1.5 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-2 py-1.5 border-r">{item.itemName}</td>
                    <td className="px-2 py-1.5 border-r font-mono text-xs" style={{ color: '#646464' }}>{item.sku || '—'}</td>
                    <td className="px-2 py-1.5 border-r">{item.quantity}</td>
                    {!hidePrices && <td className="px-2 py-1.5 border-r">{item.unitCost > 0 ? formatCurrency(item.unitCost) : '—'}</td>}
                    <td className="px-2 py-1.5 text-xs" style={{ color: '#646464' }}>{item.notes || ''}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={hidePrices ? 4 : 5} className="px-2 py-4 text-center" style={{ color: '#999' }}>No items</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <p className="text-xs text-center" style={{ color: '#808080' }}>
            Generated {new Date().toLocaleDateString()}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
