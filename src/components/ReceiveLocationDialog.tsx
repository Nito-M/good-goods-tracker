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
import { MapPin, Plus, Trash2 } from 'lucide-react';

interface Warehouse {
  id: string;
  name: string;
}

export interface ReceiveLocationEntry {
  warehouseId: string;
  quantity: number;
}

interface ReceiveLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (entries: ReceiveLocationEntry[]) => void;
  warehouses: Warehouse[];
  totalQuantity: number;
  loading?: boolean;
}

export function ReceiveLocationDialog({
  open,
  onOpenChange,
  onConfirm,
  warehouses,
  totalQuantity,
  loading,
}: ReceiveLocationDialogProps) {
  const [entries, setEntries] = useState<{ warehouseId: string; quantity: string }[]>([]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setEntries([]);
    }
  }, [open]);

  const usedWarehouseIds = entries.filter(e => e.warehouseId).map(e => e.warehouseId);
  const availableWarehouses = warehouses.filter(w => !usedWarehouseIds.includes(w.id));

  const assignedQty = entries.reduce((sum, e) => sum + (parseFloat(e.quantity) || 0), 0);
  const unassignedQty = totalQuantity - assignedQty;

  const addEntry = () => {
    if (availableWarehouses.length === 0) return;
    setEntries(prev => [...prev, { warehouseId: '', quantity: '' }]);
  };

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: 'warehouseId' | 'quantity', value: string) => {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const setAll = (index: number) => {
    const othersQty = entries.reduce((sum, e, i) => i !== index ? sum + (parseFloat(e.quantity) || 0) : sum, 0);
    const remaining = Math.max(0, totalQuantity - othersQty);
    updateEntry(index, 'quantity', String(remaining));
  };

  const handleConfirm = () => {
    const validEntries = entries
      .filter(e => e.warehouseId && (parseFloat(e.quantity) || 0) > 0)
      .map(e => ({ warehouseId: e.warehouseId, quantity: parseFloat(e.quantity) || 0 }));
    onConfirm(validEntries);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Receive to Locations
          </DialogTitle>
          <DialogDescription>
            Distribute {totalQuantity} received items across locations. Items not assigned to a location will still be added to inventory.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-3">
          {entries.length > 0 && (
            <div className="space-y-3">
              {entries.map((entry, index) => {
                const rowAvailable = warehouses.filter(
                  w => w.id === entry.warehouseId || !usedWarehouseIds.includes(w.id)
                );
                return (
                  <div key={index} className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      {index === 0 && <Label className="text-xs text-muted-foreground">Location</Label>}
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
                      {index === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}
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
              Total: {totalQuantity} | Assigned: {assignedQty}
              {unassignedQty > 0 && (
                <span className="text-warning ml-1">({unassignedQty} unassigned)</span>
              )}
              {unassignedQty < 0 && (
                <span className="text-destructive ml-1">(over-assigned by {Math.abs(unassignedQty)})</span>
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

          {entries.length === 0 && warehouses.length === 0 && (
            <p className="text-sm text-muted-foreground">No locations configured. Items will be received without a location.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Receiving…' : 'Confirm Receive'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
