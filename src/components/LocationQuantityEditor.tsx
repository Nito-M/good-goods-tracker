import { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Warehouse {
  id: string;
  name: string;
}

export interface LocationEntry {
  warehouseId: string;
  quantity: string;
}

interface LocationQuantityEditorProps {
  warehouses: Warehouse[];
  entries: LocationEntry[];
  onChange: (entries: LocationEntry[]) => void;
  totalQuantity: number;
}

export function LocationQuantityEditor({
  warehouses,
  entries,
  onChange,
  totalQuantity,
}: LocationQuantityEditorProps) {
  const assignedQty = entries.reduce((sum, e) => sum + (parseFloat(e.quantity) || 0), 0);
  const unassignedQty = totalQuantity - assignedQty;

  const usedWarehouseIds = entries.map(e => e.warehouseId);
  const availableWarehouses = warehouses.filter(w => !usedWarehouseIds.includes(w.id));

  const addEntry = () => {
    if (availableWarehouses.length === 0) return;
    onChange([...entries, { warehouseId: availableWarehouses[0].id, quantity: '' }]);
  };

  const removeEntry = (index: number) => {
    onChange(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof LocationEntry, value: string) => {
    onChange(entries.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const setAll = (index: number) => {
    const othersQty = entries.reduce((sum, e, i) => i !== index ? sum + (parseFloat(e.quantity) || 0) : sum, 0);
    const remaining = Math.max(0, totalQuantity - othersQty);
    updateEntry(index, 'quantity', String(remaining));
  };

  if (warehouses.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5" />
          Location Quantities
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Assign stock to different locations. Total: {totalQuantity} | Assigned: {assignedQty.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          {unassignedQty > 0 && (
            <span className="text-warning ml-1">
              ({unassignedQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} unassigned)
            </span>
          )}
          {unassignedQty < 0 && (
            <span className="text-destructive ml-1">
              (over-assigned by {Math.abs(unassignedQty).toLocaleString(undefined, { maximumFractionDigits: 2 })})
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map((entry, index) => {
          // Available warehouses for this row = unused ones + the currently selected one
          const rowAvailable = warehouses.filter(
            w => w.id === entry.warehouseId || !usedWarehouseIds.includes(w.id)
          );

          return (
            <div key={index} className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                {index === 0 && <Label className="text-xs text-muted-foreground">Location</Label>}
                <Select
                  value={entry.warehouseId}
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
              <div className="w-32 space-y-1">
                {index === 0 && <Label className="text-xs text-muted-foreground">Quantity</Label>}
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
      </CardContent>
    </Card>
  );
}
