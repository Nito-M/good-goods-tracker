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
import { MapPin, Plus, Trash2, AlertCircle, Check } from 'lucide-react';
import { PurchaseOrderItem } from '@/types/purchaseOrder';

interface Warehouse {
  id: string;
  name: string;
}

/** Per-location, per-item quantity assignment */
export interface LocationItemEntry {
  warehouseId: string;
  items: { sku: string; itemName: string; quantity: number }[];
}

interface ReceiveLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (locationItems: LocationItemEntry[]) => void;
  warehouses: Warehouse[];
  poItems: PurchaseOrderItem[];
  loading?: boolean;
}

interface LocationRow {
  warehouseId: string;
  /** quantities indexed same as poItems */
  quantities: string[];
}

export function ReceiveLocationDialog({
  open,
  onOpenChange,
  onConfirm,
  warehouses,
  poItems,
  loading,
}: ReceiveLocationDialogProps) {
  const [locations, setLocations] = useState<LocationRow[]>([]);

  useEffect(() => {
    if (open && warehouses.length > 0) {
      // Start with one empty location row
      setLocations([{
        warehouseId: '',
        quantities: poItems.map((item) => String(item.quantity)),
      }]);
    } else if (open) {
      setLocations([]);
    }
  }, [open, poItems, warehouses.length]);

  const usedWarehouseIds = locations.map((l) => l.warehouseId).filter(Boolean);

  const addLocation = () => {
    const available = warehouses.filter((w) => !usedWarehouseIds.includes(w.id));
    if (available.length === 0) return;
    setLocations((prev) => [
      ...prev,
      { warehouseId: '', quantities: poItems.map(() => '0') },
    ]);
  };

  const removeLocation = (index: number) => {
    setLocations((prev) => prev.filter((_, i) => i !== index));
  };

  const updateWarehouse = (locIndex: number, warehouseId: string) => {
    setLocations((prev) =>
      prev.map((l, i) => (i === locIndex ? { ...l, warehouseId } : l))
    );
  };

  const updateItemQty = (locIndex: number, itemIndex: number, value: string) => {
    setLocations((prev) =>
      prev.map((l, i) => {
        if (i !== locIndex) return l;
        const quantities = [...l.quantities];
        quantities[itemIndex] = value;
        return { ...l, quantities };
      })
    );
  };

  const setAllForLocation = (locIndex: number) => {
    setLocations((prev) =>
      prev.map((l, i) => {
        if (i !== locIndex) return l;
        // For each item, set remaining = total - sum of other locations
        const quantities = poItems.map((item, itemIdx) => {
          const othersSum = prev.reduce(
            (sum, loc, li) => li !== locIndex ? sum + (parseFloat(loc.quantities[itemIdx]) || 0) : sum,
            0
          );
          return String(Math.max(0, item.quantity - othersSum));
        });
        return { ...l, quantities };
      })
    );
  };

  // Calculate per-item totals across all locations
  const itemAssignments = poItems.map((item, itemIdx) => {
    const assigned = locations.reduce(
      (sum, loc) => sum + (parseFloat(loc.quantities[itemIdx]) || 0),
      0
    );
    return {
      sku: item.sku,
      itemName: item.itemName,
      needed: item.quantity,
      assigned,
      isComplete: Math.abs(assigned - item.quantity) < 0.001,
      isOver: assigned > item.quantity + 0.001,
    };
  });

  const allComplete = itemAssignments.every((a) => a.isComplete);
  const hasLocations = locations.length > 0;
  const allWarehousesSelected = locations.every((l) => l.warehouseId);
  const canConfirm = hasLocations && allComplete && allWarehousesSelected && !loading;

  const handleConfirm = () => {
    const entries: LocationItemEntry[] = locations
      .filter((l) => l.warehouseId)
      .map((l) => ({
        warehouseId: l.warehouseId,
        items: poItems
          .map((item, idx) => ({
            sku: item.sku,
            itemName: item.itemName,
            quantity: parseFloat(l.quantities[idx]) || 0,
          }))
          .filter((item) => item.quantity > 0),
      }))
      .filter((e) => e.items.length > 0);

    onConfirm(entries);
  };

  const noWarehouses = warehouses.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-screen m-0 p-6 rounded-none flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Receive Items
          </DialogTitle>
          <DialogDescription>
            Assign each item's quantity to a location. All items must be fully distributed.
          </DialogDescription>
        </DialogHeader>

        {noWarehouses ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">No locations configured. Add locations in Settings first.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-4 space-y-6 min-h-0">
            {/* Per-item assignment summary */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Item Distribution Summary</Label>
              <div className="rounded-md border p-3 space-y-1.5">
                {itemAssignments.map((a, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    {a.isComplete ? (
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    <span className="flex-1 truncate">
                      {a.itemName}
                      {a.sku && <span className="text-muted-foreground ml-1">({a.sku})</span>}
                    </span>
                    <span className={`tabular-nums ${a.isComplete ? 'text-green-600' : a.isOver ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {a.assigned} / {a.needed}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location rows */}
            {locations.map((loc, locIndex) => {
              const rowAvailable = warehouses.filter(
                (w) => w.id === loc.warehouseId || !usedWarehouseIds.includes(w.id)
              );
              return (
                <div key={locIndex} className="rounded-md border p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        value={loc.warehouseId || undefined}
                        onValueChange={(v) => updateWarehouse(locIndex, v)}
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAllForLocation(locIndex)}
                      className="text-xs whitespace-nowrap"
                    >
                      All Remaining
                    </Button>
                    {locations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLocation(locIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Items for this location */}
                  <div className="space-y-2">
                    {poItems.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center gap-3">
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
                          value={loc.quantities[itemIdx] || '0'}
                          onChange={(e) => updateItemQty(locIndex, itemIdx, e.target.value)}
                          className="w-20 h-8 text-sm"
                        />
                        <span className="text-xs text-muted-foreground w-12">
                          / {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Add location button */}
            {warehouses.filter((w) => !usedWarehouseIds.includes(w.id)).length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLocation}
                className="gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Location
              </Button>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            {loading ? 'Receiving…' : 'Confirm Receive'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
