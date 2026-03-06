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
import { MapPin, Plus, Trash2, AlertCircle, Check, Package } from 'lucide-react';
import { PurchaseOrderItem } from '@/types/purchaseOrder';

interface Warehouse {
  id: string;
  name: string;
}

export interface LocationItemEntry {
  warehouseId: string;
  items: { sku: string; itemName: string; quantity: number }[];
}

interface ReceiveLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (locationItems: LocationItemEntry[], isPartial: boolean) => void;
  warehouses: Warehouse[];
  poItems: PurchaseOrderItem[];
  loading?: boolean;
}

interface LocationItemRow {
  poItemIndex: number;
  quantity: string;
}

interface LocationRow {
  warehouseId: string;
  items: LocationItemRow[];
  showItemPicker: boolean;
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
      setLocations([{ warehouseId: '', items: [], showItemPicker: false }]);
    } else if (open) {
      setLocations([]);
    }
  }, [open, poItems, warehouses.length]);

  const usedWarehouseIds = locations.map((l) => l.warehouseId).filter(Boolean);

  const addLocation = () => {
    const available = warehouses.filter((w) => !usedWarehouseIds.includes(w.id));
    if (available.length === 0) return;
    setLocations((prev) => [...prev, { warehouseId: '', items: [], showItemPicker: false }]);
  };

  const removeLocation = (index: number) => {
    setLocations((prev) => prev.filter((_, i) => i !== index));
  };

  const updateWarehouse = (locIndex: number, warehouseId: string) => {
    setLocations((prev) =>
      prev.map((l, i) => (i === locIndex ? { ...l, warehouseId } : l))
    );
  };

  const toggleItemPicker = (locIndex: number) => {
    setLocations((prev) =>
      prev.map((l, i) => (i === locIndex ? { ...l, showItemPicker: !l.showItemPicker } : l))
    );
  };

  const addItemToLocation = (locIndex: number, poItemIndex: number) => {
    const item = poItems[poItemIndex];
    // Calculate remaining for this item (accounting for previously received)
    const prevReceived = item.receivedQuantity || 0;
    const alreadyAssigned = locations.reduce((sum, loc, li) => {
      if (li === locIndex) return sum;
      const found = loc.items.find((it) => it.poItemIndex === poItemIndex);
      return sum + (found ? parseFloat(found.quantity) || 0 : 0);
    }, 0);
    const remaining = Math.max(0, item.quantity - prevReceived - alreadyAssigned);

    setLocations((prev) =>
      prev.map((l, i) => {
        if (i !== locIndex) return l;
        // Don't add duplicates
        if (l.items.some((it) => it.poItemIndex === poItemIndex)) return l;
        return {
          ...l,
          items: [...l.items, { poItemIndex, quantity: String(remaining) }],
          showItemPicker: false,
        };
      })
    );
  };

  const removeItemFromLocation = (locIndex: number, itemRowIndex: number) => {
    setLocations((prev) =>
      prev.map((l, i) => {
        if (i !== locIndex) return l;
        return { ...l, items: l.items.filter((_, j) => j !== itemRowIndex) };
      })
    );
  };

  const updateItemQty = (locIndex: number, itemRowIndex: number, value: string) => {
    setLocations((prev) =>
      prev.map((l, i) => {
        if (i !== locIndex) return l;
        const items = l.items.map((it, j) =>
          j === itemRowIndex ? { ...it, quantity: value } : it
        );
        return { ...l, items };
      })
    );
  };

  const addAllRemainingToLocation = (locIndex: number) => {
    setLocations((prev) =>
      prev.map((l, i) => {
        if (i !== locIndex) return l;
        const newItems: LocationItemRow[] = [];
        poItems.forEach((item, poIdx) => {
          const alreadyInThisLoc = l.items.find((it) => it.poItemIndex === poIdx);
          const othersSum = prev.reduce((sum, loc, li) => {
            if (li === locIndex) return sum;
            const found = loc.items.find((it) => it.poItemIndex === poIdx);
            return sum + (found ? parseFloat(found.quantity) || 0 : 0);
          }, 0);
          const remaining = Math.max(0, item.quantity - othersSum);
          if (alreadyInThisLoc) {
            newItems.push({ poItemIndex: poIdx, quantity: String(remaining) });
          } else if (remaining > 0) {
            newItems.push({ poItemIndex: poIdx, quantity: String(remaining) });
          }
        });
        return { ...l, items: newItems, showItemPicker: false };
      })
    );
  };

  // Per-item assignment summary
  const itemAssignments = poItems.map((item, itemIdx) => {
    const assigned = locations.reduce((sum, loc) => {
      if (!loc.items) return sum;
      const found = loc.items.find((it) => it.poItemIndex === itemIdx);
      return sum + (found ? parseFloat(found.quantity) || 0 : 0);
    }, 0);
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
  const allHaveItems = locations.every((l) => l.items.length > 0);
  const hasAnyAssigned = itemAssignments.some((a) => a.assigned > 0);
  const canConfirm = hasLocations && hasAnyAssigned && allWarehousesSelected && allHaveItems && !loading;

  const handleConfirm = () => {
    const entries: LocationItemEntry[] = locations
      .filter((l) => l.warehouseId && l.items.length > 0)
      .map((l) => ({
        warehouseId: l.warehouseId,
        items: l.items
          .filter((it) => poItems[it.poItemIndex])
          .map((it) => ({
            sku: poItems[it.poItemIndex].sku,
            itemName: poItems[it.poItemIndex].itemName,
            quantity: parseFloat(it.quantity) || 0,
          }))
          .filter((item) => item.quantity > 0),
      }))
      .filter((e) => e.items.length > 0);

    onConfirm(entries, !allComplete);
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
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    <span className="flex-1 truncate">
                      {a.itemName}
                      {a.sku && <span className="text-muted-foreground ml-1">({a.sku})</span>}
                    </span>
                    <span className={`tabular-nums ${a.isComplete ? 'text-primary' : a.isOver ? 'text-destructive' : 'text-muted-foreground'}`}>
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
              const assignedPoIndices = loc.items.map((it) => it.poItemIndex);
              const unassignedPoItems = poItems
                .map((item, idx) => ({ item, idx }))
                .filter(({ idx }) => !assignedPoIndices.includes(idx))
                .filter(({ idx }) => !itemAssignments[idx]?.isComplete);

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

                  {/* Show items and actions only when warehouse is selected */}
                  {loc.warehouseId && (
                    <>
                      {/* Assigned items */}
                      {loc.items.length > 0 && (
                        <div className="space-y-2 pl-1">
                          {loc.items.map((itemRow, itemRowIdx) => {
                            const poItem = poItems[itemRow.poItemIndex];
                            if (!poItem) return null;
                            return (
                              <div key={itemRowIdx} className="flex items-center gap-2">
                                <span className="flex-1 text-sm truncate">
                                  {poItem.itemName}
                                  {poItem.sku && (
                                    <span className="text-muted-foreground ml-1">({poItem.sku})</span>
                                  )}
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  max={poItem.quantity}
                                  step="0.01"
                                  value={itemRow.quantity}
                                  onChange={(e) => updateItemQty(locIndex, itemRowIdx, e.target.value)}
                                  className="w-20 h-8 text-sm"
                                />
                                <span className="text-xs text-muted-foreground w-12">
                                  / {poItem.quantity}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => removeItemFromLocation(locIndex, itemRowIdx)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add item button + picker */}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleItemPicker(locIndex)}
                            className="gap-1"
                            disabled={unassignedPoItems.length === 0}
                          >
                            <Package className="h-3.5 w-3.5" />
                            Add Item
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addAllRemainingToLocation(locIndex)}
                            className="gap-1 text-xs"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            All Remaining
                          </Button>
                        </div>

                        {loc.showItemPicker && unassignedPoItems.length > 0 && (
                          <div className="rounded-md border bg-muted/30 p-2 space-y-1">
                            {unassignedPoItems.map(({ item, idx }) => (
                              <button
                                key={idx}
                                type="button"
                                className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors"
                                onClick={() => addItemToLocation(locIndex, idx)}
                              >
                                {item.itemName}
                                {item.sku && (
                                  <span className="text-muted-foreground ml-1">({item.sku})</span>
                                )}
                                <span className="text-muted-foreground ml-2">×{item.quantity}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}

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
            {loading ? 'Receiving…' : allComplete ? 'Confirm Receive' : 'Partial Receive'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
