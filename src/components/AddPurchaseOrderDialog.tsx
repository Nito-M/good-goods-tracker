import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InventoryItem } from '@/types/inventory';
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react';

interface AddPurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    order: {
      sku: string;
      itemName: string;
      quantity: number;
      orderedAt: Date;
      notes?: string;
    },
    pdfFile?: File | null,
    imageFile?: File | null
  ) => Promise<void>;
  inventoryItems: InventoryItem[];
}

export function AddPurchaseOrderDialog({
  open,
  onOpenChange,
  onSave,
  inventoryItems,
}: AddPurchaseOrderDialogProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [customSku, setCustomSku] = useState('');
  const [customName, setCustomName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [orderedAt, setOrderedAt] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const selectedItem = inventoryItems.find((i) => i.id === selectedItemId);

  const handleSave = async () => {
    const sku = selectedItem ? selectedItem.sku : customSku;
    const itemName = selectedItem ? selectedItem.name : customName;

    if (!sku || !itemName || quantity < 1) return;

    setSaving(true);
    await onSave(
      {
        sku,
        itemName,
        quantity,
        orderedAt: new Date(orderedAt),
        notes: notes || undefined,
      },
      pdfFile,
      imageFile
    );
    setSaving(false);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setSelectedItemId('');
    setCustomSku('');
    setCustomName('');
    setQuantity(1);
    setOrderedAt(new Date().toISOString().split('T')[0]);
    setNotes('');
    setPdfFile(null);
    setImageFile(null);
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Select from inventory or enter custom */}
          <div className="space-y-2">
            <Label>Select from Inventory (optional)</Label>
            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an item or enter custom below" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">-- Enter Custom Item --</SelectItem>
                {inventoryItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({item.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom item fields if no selection */}
          {(!selectedItemId || selectedItemId === 'custom') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="customSku">SKU Number *</Label>
                <Input
                  id="customSku"
                  value={customSku}
                  onChange={(e) => setCustomSku(e.target.value)}
                  placeholder="Enter SKU"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customName">Item Name *</Label>
                <Input
                  id="customName"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter item name"
                />
              </div>
            </>
          )}

          {/* Selected item display */}
          {selectedItem && (
            <div className="p-3 rounded-lg bg-muted">
              <p className="font-medium">{selectedItem.name}</p>
              <p className="text-sm text-muted-foreground">
                SKU: {selectedItem.sku}
              </p>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Order Date */}
          <div className="space-y-2">
            <Label htmlFor="orderedAt">Order Date *</Label>
            <Input
              id="orderedAt"
              type="date"
              value={orderedAt}
              onChange={(e) => setOrderedAt(e.target.value)}
            />
          </div>

          {/* PDF Upload */}
          <div className="space-y-2">
            <Label>PDF Document</Label>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handlePdfChange}
            />
            {pdfFile ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted">
                <FileText className="h-5 w-5 text-primary" />
                <span className="flex-1 truncate text-sm">{pdfFile.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setPdfFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => pdfInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload PDF
              </Button>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Item Picture</Label>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            {imageFile ? (
              <div className="relative">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 bg-background/80"
                  onClick={() => setImageFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => imageInputRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4" />
                Upload Image
              </Button>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              saving ||
              ((!selectedItemId || selectedItemId === 'custom') &&
                (!customSku || !customName))
            }
          >
            {saving ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
