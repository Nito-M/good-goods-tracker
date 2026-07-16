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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem, CommandGroup } from '@/components/ui/command';
import { InventoryItem } from '@/types/inventory';
import { PurchaseOrderItem } from '@/types/purchaseOrder';
import { Vendor } from '@/hooks/useVendors';
import { Upload, FileText, Image as ImageIcon, X, Plus, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface VendorPrice {
  itemId: string;
  price: number;
}

interface AddPurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    order: {
      items: PurchaseOrderItem[];
      orderedAt: Date;
      notes?: string;
      vendorId?: string | null;
      poNumber?: string;
      vendorInvoiceNumber?: string | null;
    },
    pdfFile?: File | null,
    imageFile?: File | null
  ) => Promise<void>;
  inventoryItems: InventoryItem[];
  vendors: Vendor[];
}

interface LineItem {
  id: string;
  selectedItemId: string;
  customSku: string;
  customName: string;
  quantity: number;
  unitCost: string;
  itemNotes: string;
}

function createEmptyLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    selectedItemId: '',
    customSku: '',
    customName: '',
    quantity: 1,
    unitCost: '',
    itemNotes: '',
  };
}

function ItemSearchCombobox({
  items,
  selectedItemId,
  onSelect,
  inventoryItems,
}: {
  items: { id: string; name: string; sku: string }[];
  selectedItemId: string;
  onSelect: (value: string) => void;
  inventoryItems: { id: string; name: string; sku: string }[];
}) {
  const [open, setOpen] = useState(false);
  const selectedItem = inventoryItems.find((i) => i.id === selectedItemId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selectedItemId === 'custom'
              ? '-- Custom Item --'
              : selectedItem
              ? `${selectedItem.name} (${selectedItem.sku})`
              : 'Select item...'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search items..." />
          <CommandList>
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="custom-item"
                onSelect={() => {
                  onSelect('custom');
                  setOpen(false);
                }}
              >
                <Check className={cn('mr-2 h-4 w-4', selectedItemId === 'custom' ? 'opacity-100' : 'opacity-0')} />
                -- Custom Item --
              </CommandItem>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.name} ${item.sku}`}
                  onSelect={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', selectedItemId === item.id ? 'opacity-100' : 'opacity-0')} />
                  {item.name} ({item.sku})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function AddPurchaseOrderDialog({
  open,
  onOpenChange,
  onSave,
  inventoryItems,
  vendors,
}: AddPurchaseOrderDialogProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([createEmptyLineItem()]);
  const [poNumber, setPoNumber] = useState('');
  const [orderedAt, setOrderedAt] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [vendorId, setVendorId] = useState<string>('');
  const [vendorPrices, setVendorPrices] = useState<VendorPrice[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Fetch vendor prices when vendor changes
  useEffect(() => {
    const fetchVendorPrices = async () => {
      if (!vendorId || vendorId === 'none') {
        setVendorPrices([]);
        return;
      }

      const { data } = await supabase
        .from('item_vendor_prices')
        .select('item_id, price')
        .eq('vendor_id', vendorId);

      if (data) {
        setVendorPrices(data.map(d => ({ itemId: d.item_id, price: Number(d.price) })));
      }
    };

    fetchVendorPrices();
  }, [vendorId]);

  const applyVendorPrices = (selectedVendorId: string) => {
    if (!selectedVendorId || selectedVendorId === 'none') return;

    supabase
      .from('item_vendor_prices')
      .select('item_id, price')
      .eq('vendor_id', selectedVendorId)
      .then(({ data }) => {
        if (data) {
          const priceMap = new Map(data.map(d => [d.item_id, Number(d.price)]));
          setLineItems(prev => prev.map(lineItem => {
            if (lineItem.selectedItemId && lineItem.selectedItemId !== 'custom') {
              const vendorPrice = priceMap.get(lineItem.selectedItemId);
              if (vendorPrice !== undefined) {
                return { ...lineItem, unitCost: vendorPrice.toFixed(2) };
              }
            }
            return lineItem;
          }));
        }
      });
  };

  const handleVendorChange = (newVendorId: string) => {
    setVendorId(newVendorId);
    setLineItems(prev => prev.map(item => {
      if (item.selectedItemId === 'custom') {
        return item;
      }
      return createEmptyLineItem();
    }));
    applyVendorPrices(newVendorId);
  };

  // All inventory items sorted A-Z (not restricted to vendor-priced ones)
  const filteredInventoryItems = vendorId && vendorId !== 'none'
    ? [...inventoryItems].sort((a, b) => a.name.localeCompare(b.name))
    : [...inventoryItems].sort((a, b) => a.name.localeCompare(b.name));

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        
        // If selecting an inventory item and we have a vendor selected, apply vendor price
        if (updates.selectedItemId && updates.selectedItemId !== 'custom' && vendorId && vendorId !== 'none') {
          const vendorPrice = vendorPrices.find(vp => vp.itemId === updates.selectedItemId);
          if (vendorPrice) {
            updated.unitCost = vendorPrice.price.toFixed(2);
          }
        }
        
        return updated;
      })
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
    return !!sku && !!itemName && lineItem.quantity !== 0 && !Number.isNaN(lineItem.quantity);
  };

  const isFormValid = () => {
    return lineItems.every(isLineItemValid);
  };

  const handleSave = async () => {
    if (!isFormValid()) return;

    setSaving(true);

    const items: PurchaseOrderItem[] = lineItems.map((lineItem) => {
      const { sku, itemName } = getItemDetails(lineItem);
      const unitCost = lineItem.unitCost ? parseFloat(lineItem.unitCost) : undefined;
      const inventoryItemId = lineItem.selectedItemId && lineItem.selectedItemId !== 'custom' ? lineItem.selectedItemId : null;
      return { sku, itemName, quantity: lineItem.quantity, unitCost, notes: lineItem.itemNotes || undefined, inventoryItemId };
    });


    const [year, month, day] = orderedAt.split('-').map(Number);
    const localOrderedAt = new Date(year, month - 1, day, 12, 0, 0);

    await onSave(
      {
        items,
        orderedAt: localOrderedAt,
        notes: notes || undefined,
        vendorId: vendorId || null,
        poNumber: poNumber || undefined,
      },
      pdfFile,
      imageFile
    );
    setSaving(false);
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setLineItems([createEmptyLineItem()]);
    setPoNumber('');
    setOrderedAt(new Date().toISOString().split('T')[0]);
    setNotes('');
    setVendorId('');
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Vendor Selection */}
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor</Label>
            <Select value={vendorId} onValueChange={handleVendorChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a vendor (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- No Vendor --</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                  <ItemSearchCombobox
                    items={filteredInventoryItems.filter(
                      (item) => !lineItems.some(
                        (li) => li.id !== lineItem.id && li.selectedItemId === item.id
                      )
                    )}
                    selectedItemId={lineItem.selectedItemId}
                    onSelect={(value) =>
                      updateLineItem(lineItem.id, {
                        selectedItemId: value,
                        customSku: '',
                        customName: '',
                      })
                    }
                    inventoryItems={inventoryItems}
                  />
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

                {lineItem.selectedItemId && lineItem.selectedItemId !== 'custom' && (
                  <div className="p-2 rounded bg-muted text-sm">
                    {inventoryItems.find((i) => i.id === lineItem.selectedItemId)?.name} (
                    {inventoryItems.find((i) => i.id === lineItem.selectedItemId)?.sku})
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={lineItem.quantity}
                      onChange={(e) =>
                        updateLineItem(lineItem.id, {
                          quantity: parseFloat(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Cost</Label>
                    <Input
                      type="number"
                      step="0.00001"
                      value={lineItem.unitCost}
                      onChange={(e) =>
                        updateLineItem(lineItem.id, {
                          unitCost: e.target.value,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Item Notes</Label>
                  <Textarea
                    value={lineItem.itemNotes}
                    onChange={(e) => updateLineItem(lineItem.id, { itemNotes: e.target.value })}
                    placeholder="Notes for this item (optional)"
                    className="min-h-[60px] resize-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* PO Number */}
          <div className="space-y-2">
            <Label htmlFor="poNumber">PO Number</Label>
            <Input
              id="poNumber"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="Auto-generated if left empty (e.g., PO-0001)"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate
            </p>
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
          <Button onClick={handleSave} disabled={saving || !isFormValid()}>
            {saving ? 'Creating...' : 'Create Order'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
