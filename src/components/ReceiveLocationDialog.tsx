import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Plus, Trash2, Package } from 'lucide-react';
import { PurchaseOrderItem } from '@/types/purchaseOrder';

interface Warehouse {
  id: string;
  name: string;
}

export interface ReceiveLocationEntry {
  warehouseId: string;
  quantity: number;
}

export interface ReceiveItemSelection {
  sku: string;
  itemName: string;
  quantity: number;
}

interface ReceiveLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (entries: ReceiveLocationEntry[], selectedItems: ReceiveItemSelection[]) => void;
  warehouses: Warehouse[];
  poItems: PurchaseOrderItem[];
  loading?: boolean;
}

export function ReceiveLocationDialog({
  open,
  onOpenChange,
  onConfirm,
  warehouses,
  poItems,
  loading,
}: ReceiveLocationDialogProps) {
  const [entries, setEntries] = useState<{ warehouseId: string; quantity: string }[]>([]);
  const [itemSelections, setItemSelections] = useState<{ checked: boolean; quantity: string }[]>([]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setEntries([]);
      setItemSelections(
        poItems.map((item) => ({ checked: true, quantity: String(item.quantity) }))
      );
    }
  }, [open, poItems]);

  const toggleItem = (index: number, checked: boolean) => {
    setItemSelections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, checked } : s))
    );
  };

  const updateItemQty = (index: number, quantity: string) => {
    setItemSelections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, quantity } : s))
    );
  };

  const selectedItems = itemSelections
    .map((s, i) => ({
      ...poItems[i],
      quantity: parseFloat(s.quantity) || 0,
      checked: s.checked,
    }))
    .filter((s) => s.checked && s.quantity > 0);

  const totalSelectedQty = selectedItems.reduce((sum, s) => sum + s.quantity, 0);

  // Location entries logic
  const usedWarehouseIds = entries.filter((e) => e.warehouseId).map((e) => e.warehouseId);
  const availableWarehouses = warehouses.filter((w) => !usedWarehouseIds.includes(w.id));

  const assignedQty = entries.reduce((sum, e) => sum + (parseFloat(e.quantity) || 0), 0);
  const unassignedQty = totalSelectedQty - assignedQty;

  const addEntry = () => {
    if (availableWarehouses.length === 0) return;
    setEntries((prev) => [...prev, { warehouseId: '', quantity: '' }]);
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: 'warehouseId' | 'quantity', value: string) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  };

  const setAll = (index: number) => {
    const othersQty = entries.reduce(
      (sum, e, i) => (i !== index ? sum + (parseFloat(e.quantity) || 0) : sum),
      0
    );
    const remaining = Math.max(0, totalSelectedQty - othersQty);
    updateEntry(index, 'quantity', String(remaining));
  };

  const handleConfirm = () => {
    const validEntries = entries
      .filter((e) => e.warehouseId && (parseFloat(e.quantity) || 0) > 0)
      .map((e) => ({ warehouseId: e.warehouseId, quantity: parseFloat(e.quantity) || 0 }));

    const selected: ReceiveItemSelection[] = selectedItems.map((s) => ({
      sku: s.sku,
      itemName: s.itemName,
      quantity: s.quantity,
    }));

    onConfirm(validEntries, selected);
  };

  const hasSelectedItems = selectedItems.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Receive Items
          </DialogTitle>
          <DialogDescription>
            Select which items to receive and optionally distribute across locations.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Item selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Package className="h-4 w-4" />
              Items to Receive
            </Label>
            <div className="space-y-2 rounded-md border p-3">
              {poItems.map((item, index) => {
                const sel = itemSelections[index];
                if (!sel) return null;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <Checkbox
                      checked={sel.checked}
                      onCheckedChange={(checked) => toggleItem(index, !!checked)}
                    />
                    <span className="flex-1 text-sm truncate">
                      {item.itemName}
                      {item.sku && (
                        <span className="text-muted-foreground ml-1">({item.sku})</span>
                      )}
                    </span>
                    <Input
                      type="number"
                      min="0"
                      max={item.quantity}
                      step="0.01"
                      value={sel.quantity}
                      onChange={(e) => updateItemQty(index, e.target.value)}
                      disabled={!sel.checked}
                      className="w-20 h-8 text-sm"
                    />
                    <span className="text-xs text-muted-foreground w-12">
                      / {item.quantity}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location distribution */}
          {hasSelectedItems && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Distribute to Locations (optional)</Label>

              {entries.length > 0 && (
                <div className="space-y-3">
                  {entries.map((entry, index) => {
                    const rowAvailable = warehouses.filter(
                      (w) => w.id === entry.warehouseId || !usedWarehouseIds.includes(w.id)
                    );
                    return (
                      <div key={index} className="flex items-end gap-2">
                        <div className="flex-1 space-y-1">
                          {index === 0 && (
                            <Label className="text-xs text-muted-foreground">Location</Label>
                          )}
                          <Select
                            value={entry.warehouseId || undefined}
                            onValueChange={(v) => updateEntry(index, 'warehouseId', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              {rowAvailable.map((w) => (
                                <SelectItem key={w.id} value={w.id}>
                                  {w.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-28 space-y-1">
                          {index === 0 && (
                            <Label className="text-xs text-muted-foreground">Qty</Label>
                          )}
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={entry.quantity}
                            onChange={(e) => updateEntry(index, 'quantity', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAll(index)}
                          className="text-xs whitespace-nowrap"
                        >
                          All
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEntry(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {entries.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Total: {totalSelectedQty} | Assigned: {assignedQty}
                  {unassignedQty > 0 && (
                    <span className="text-warning ml-1">({unassignedQty} unassigned)</span>
                  )}
                  {unassignedQty < 0 && (
                    <span className="text-destructive ml-1">
                      (over-assigned by {Math.abs(unassignedQty)})
                    </span>
                  )}
                </p>
              )}

              {availableWarehouses.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEntry}
                  className="gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Location
                </Button>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !hasSelectedItems}>
            {loading ? 'Receiving…' : 'Confirm Receive'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
