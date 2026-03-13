import { useState, useRef, useEffect } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Percent, DollarSign, Briefcase, CreditCard } from 'lucide-react';
import { CompanySelector } from '@/components/CompanySelector';
import { useCompanies } from '@/hooks/useCompanies';
import { useBankCards } from '@/hooks/useBankCards';
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
import { Vendor } from '@/hooks/useVendors';
import { Job } from '@/types/job';
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
      vendorId?: string | null;
      jobIds?: string[];
      poNumber?: string;
      discountType?: 'percentage' | 'fixed';
      discountValue?: number;
      discountAmount?: number;
      companyId?: string | null;
      bankCardId?: string | null;
    },
    pdfFile?: File | null,
    imageFile?: File | null
  ) => Promise<void>;
  inventoryItems: InventoryItem[];
  vendors: Vendor[];
  jobs: Job[];
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

function createLineItemFromOrder(item: PurchaseOrderItem, inventoryItems: InventoryItem[]): LineItem {
  const matchingItem = inventoryItems.find(i => i.sku === item.sku);
  return {
    id: crypto.randomUUID(),
    selectedItemId: matchingItem?.id || 'custom',
    customSku: matchingItem ? '' : item.sku,
    customName: matchingItem ? '' : item.itemName,
    quantity: item.quantity,
    unitCost: item.unitCost !== undefined ? item.unitCost.toString() : '',
    itemNotes: item.notes || '',
  };
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

export function EditPurchaseOrderDialog({
  open,
  onOpenChange,
  order,
  onSave,
  inventoryItems,
  vendors,
  jobs,
}: EditPurchaseOrderDialogProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [poNumber, setPoNumber] = useState('');
  const [orderedAt, setOrderedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [vendorId, setVendorId] = useState<string>('');
  const [jobIds, setJobIds] = useState<string[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [companyId, setCompanyId] = useState<string>('');
  const [bankCardId, setBankCardId] = useState<string>('');
  const { companies, defaultCompany } = useCompanies();
  const { cards: bankCards } = useBankCards();

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when order changes
  useEffect(() => {
    if (order && open) {
      setLineItems(order.items.map(item => createLineItemFromOrder(item, inventoryItems)));
      setPoNumber(order.poNumber || '');
      setOrderedAt(order.orderedAt.toISOString().split('T')[0]);
      setNotes(order.notes || '');
      setVendorId(order.vendorId || '');
      setJobIds(order.jobIds || []);
      setDiscountType(order.discountType || 'percentage');
      setDiscountValue(order.discountValue ? order.discountValue.toString() : '');
      setPdfFile(null);
      setImageFile(null);
      setCompanyId((order as any).companyId || defaultCompany?.id || '');
      setBankCardId(order.bankCardId || '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, open]);

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
      const unitCost = lineItem.unitCost ? parseFloat(lineItem.unitCost) : undefined;
      return { sku, itemName, quantity: lineItem.quantity, unitCost, notes: lineItem.itemNotes || undefined };
    });

    // Parse date as local time to avoid timezone offset issues
    const [year, month, day] = orderedAt.split('-').map(Number);
    const localOrderedAt = new Date(year, month - 1, day, 12, 0, 0);

    // Calculate discount amount
    const subtotalCents = items.reduce((sum, item) => sum + Math.round((item.unitCost || 0) * item.quantity * 100), 0);
    const subtotal = subtotalCents / 100;
    const parsedDiscountValue = parseFloat(discountValue) || 0;
    const computedDiscountAmount = discountType === 'percentage'
      ? Math.round(subtotalCents * parsedDiscountValue / 100) / 100
      : parsedDiscountValue;

    await onSave(
      order.id,
      {
        items,
        orderedAt: localOrderedAt,
        notes: notes || undefined,
        vendorId: vendorId || null,
        jobIds: jobIds,
        poNumber: poNumber || undefined,
        discountType,
        discountValue: parsedDiscountValue,
        discountAmount: computedDiscountAmount,
        companyId: companyId || null,
        bankCardId: bankCardId && bankCardId !== 'none' ? bankCardId : null,
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
          {/* Company Selector */}
          <CompanySelector companies={companies} value={companyId} onChange={setCompanyId} />

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
                      {[...inventoryItems].sort((a, b) => a.name.localeCompare(b.name)).map((item) => (
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

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min={0.01}
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
                      min={0}
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
              placeholder="e.g., PO-0001"
            />
          </div>

          {/* Vendor Selection */}
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a vendor" />
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

          {/* Job Selection - Multi-select */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Link to Jobs
            </Label>
            <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
              {jobs
                .filter(j => j.status !== 'completed' && j.status !== 'cancelled')
                .map((job) => (
                  <label key={job.id} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-muted/50 rounded p-1">
                    <input
                      type="checkbox"
                      checked={jobIds.includes(job.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setJobIds(prev => [...prev, job.id]);
                        } else {
                          setJobIds(prev => prev.filter(id => id !== job.id));
                        }
                      }}
                      className="rounded"
                    />
                    <span>{job.jobNumber} - {job.title}</span>
                  </label>
                ))}
              {jobs.filter(j => j.status !== 'completed' && j.status !== 'cancelled').length === 0 && (
                <p className="text-sm text-muted-foreground">No active jobs</p>
              )}
            </div>
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

          {/* Discount */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Discount</Label>
              <ToggleGroup
                type="single"
                value={discountType}
                onValueChange={(val) => val && setDiscountType(val as 'percentage' | 'fixed')}
                className="h-7"
              >
                <ToggleGroupItem value="percentage" className="h-7 w-7 p-0">
                  <Percent className="h-3 w-3" />
                </ToggleGroupItem>
                <ToggleGroupItem value="fixed" className="h-7 w-7 p-0">
                  <DollarSign className="h-3 w-3" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <Input
              type="number"
              min={0}
              step={discountType === 'percentage' ? '1' : '0.01'}
              max={discountType === 'percentage' ? 100 : undefined}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === 'percentage' ? '0%' : '$0.00'}
              className="w-32"
            />
          </div>

          {/* Bank Card */}
          {bankCards.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Link to Bank Card
              </Label>
              <Select value={bankCardId || 'none'} onValueChange={setBankCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="No card linked" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- No Card --</SelectItem>
                  {bankCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
