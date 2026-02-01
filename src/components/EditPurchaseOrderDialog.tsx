import { useState, useRef, useEffect } from 'react';
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
import { PurchaseOrder, PurchaseOrderItem } from '@/types/purchaseOrder';
import { Upload, FileText, Image as ImageIcon, X, Plus, Trash2 } from 'lucide-react';

interface EditPurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder;
  onSave: (
    orderId: string,
    updates: {
      items: PurchaseOrderItem[];
      orderedAt: Date;
      notes?: string;
    },
    pdfFile?: File | null,
    imageFile?: File | null
  ) => Promise<void>;
  inventoryItems: InventoryItem[];
}

interface LineItem {
  id: string;
  selectedItemId: string;
  customSku: string;
  customName: string;
  quantity: number;
}

function createLineItemFromOrder(item: PurchaseOrderItem, inventoryItems: InventoryItem[]): LineItem {
  const matchingItem = inventoryItems.find(i => i.sku === item.sku);
  return {
    id: crypto.randomUUID(),
    selectedItemId: matchingItem?.id || 'custom',
    customSku: matchingItem ? '' : item.sku,
    customName: matchingItem ? '' : item.itemName,
    quantity: item.quantity,
  };
}

function createEmptyLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    selectedItemId: '',
    customSku: '',
    customName: '',
    quantity: 1,
  };
}

export function EditPurchaseOrderDialog({
  open,
  onOpenChange,
  order,
  onSave,
  inventoryItems,
}: EditPurchaseOrderDialogProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [orderedAt, setOrderedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when order changes
  useEffect(() => {
    if (order && open) {
      setLineItems(order.items.map(item => createLineItemFromOrder(item, inventoryItems)));
      setOrderedAt(order.orderedAt.toISOString().split('T')[0]);
      setNotes(order.notes || '');
      setPdfFile(null);
      setImageFile(null);
    }
  }, [order, open, inventoryItems]);

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, createEmptyLineItem()]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const getItemDetails = (lineItem: LineItem) => {
    const inventoryItem = inventoryItems.find((i) => i.id === lineItem.selectedItemId);
    if (inventoryItem) {
      return { sku: inventoryItem.sku, itemName: inventoryItem.name };
    }
    return { sku: lineItem.customSku, itemName: lineItem.customName };
  };

  const isLineItemValid = (lineItem: LineItem) => {
    const { sku, itemName } = getItemDetails(lineItem);
    return sku && itemName && lineItem.quantity >= 1;
  };

  const isFormValid = () => {
    return lineItems.length > 0 && lineItems.every(isLineItemValid);
  };

  const handleSave = async () => {
    if (!isFormValid()) return;

    setSaving(true);

    const items: PurchaseOrderItem[] = lineItems.map((lineItem) => {
      const { sku, itemName } = getItemDetails(lineItem);
      return { sku, itemName, quantity: lineItem.quantity };
    });

    await onSave(
      order.id,
      {
        items,
        orderedAt: new Date(orderedAt),
        notes: notes || undefined,
      },
      pdfFile,
      imageFile
    );
    setSaving(false);
    onOpenChange(false);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Purchase Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>

            {lineItems.map((lineItem, index) => (
              <div
                key={lineItem.id}
                className="p-4 rounded-lg border bg-muted/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Item {index + 1}
                  </span>
                  {lineItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeLineItem(lineItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Select from Inventory</Label>
                  <Select
                    value={lineItem.selectedItemId}
                    onValueChange={(value) =>
                      updateLineItem(lineItem.id, {
                        selectedItemId: value,
                        customSku: '',
                        customName: '',
                      })
                    }
                  >
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

                {(!lineItem.selectedItemId || lineItem.selectedItemId === 'custom') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>SKU *</Label>
                      <Input
                        value={lineItem.customSku}
                        onChange={(e) =>
                          updateLineItem(lineItem.id, { customSku: e.target.value })
                        }
                        placeholder="Enter SKU"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Item Name *</Label>
                      <Input
                        value={lineItem.customName}
                        onChange={(e) =>
                          updateLineItem(lineItem.id, { customName: e.target.value })
                        }
                        placeholder="Enter item name"
                      />
                    </div>
                  </div>
                )}

                {lineItem.selectedItemId &&
                  lineItem.selectedItemId !== 'custom' && (
                    <div className="p-2 rounded bg-muted text-sm">
                      {inventoryItems.find((i) => i.id === lineItem.selectedItemId)?.name} (
                      {inventoryItems.find((i) => i.id === lineItem.selectedItemId)?.sku})
                    </div>
                  )}

                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={lineItem.quantity}
                    onChange={(e) =>
                      updateLineItem(lineItem.id, {
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-32"
                  />
                </div>
              </div>
            ))}
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

          {/* Current attachments */}
          {(order.pdfUrl || order.imageUrl) && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Current Attachments</Label>
              <div className="flex gap-2 flex-wrap">
                {order.pdfUrl && (
                  <a
                    href={order.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline p-2 rounded border"
                  >
                    <FileText className="h-4 w-4" />
                    View PDF
                  </a>
                )}
                {order.imageUrl && (
                  <a
                    href={order.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline p-2 rounded border"
                  >
                    <ImageIcon className="h-4 w-4" />
                    View Image
                  </a>
                )}
              </div>
            </div>
          )}

          {/* PDF Upload */}
          <div className="space-y-2">
            <Label>Replace PDF Document</Label>
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
                Upload New PDF
              </Button>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Replace Item Picture</Label>
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
                Upload New Image
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
          <Button onClick={handleSave} disabled={saving || !isFormValid()}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
