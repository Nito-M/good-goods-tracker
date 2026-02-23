import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';

interface Warehouse {
  id: string;
  name: string;
}

interface ReceiveLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (warehouseId: string | null) => void;
  warehouses: Warehouse[];
  loading?: boolean;
}

export function ReceiveLocationDialog({
  open,
  onOpenChange,
  onConfirm,
  warehouses,
  loading,
}: ReceiveLocationDialogProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('none');

  const handleConfirm = () => {
    onConfirm(selectedWarehouse === 'none' ? null : selectedWarehouse);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Receive to Location
          </DialogTitle>
          <DialogDescription>
            Choose which location to receive these items into.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No location</SelectItem>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
