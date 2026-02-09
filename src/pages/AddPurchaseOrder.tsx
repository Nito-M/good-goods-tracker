import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useInventory } from '@/hooks/useInventory';
import { useVendors } from '@/hooks/useVendors';
import { useRequests } from '@/hooks/useRequests';
import { PurchaseOrderItem } from '@/types/purchaseOrder';
import { Upload, FileText, Image as ImageIcon, X, Plus, Trash2, ArrowLeft, ClipboardList, Percent, DollarSign } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { supabase } from '@/integrations/supabase/client';

interface VendorPrice {
  itemId: string;
  price: number;
}

interface LineItem {
  id: string;
  selectedItemId: string;
  customSku: string;
  customName: string;
  quantity: number;
  unitCost: string;
}

function createEmptyLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    selectedItemId: '',
    customSku: '',
    customName: '',
    quantity: '' as unknown as number,
    unitCost: '',
  };
}

export function AddPurchaseOrder() {
  const navigate = useNavigate();
  const { createOrder } = usePurchaseOrders();
  const { allItems: inventoryItems } = useInventory();
  const { vendors } = useVendors();
  const { requests } = useRequests();

  const [lineItems, setLineItems] = useState<LineItem[]>([createEmptyLineItem()]);
  const [poNumber, setPoNumber] = useState('');
  const [orderedAt, setOrderedAt] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [vendorId, setVendorId] = useState<string>('');
  const [requestId, setRequestId] = useState<string>('');
  const [vendorPrices, setVendorPrices] = useState<VendorPrice[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('');

  // Calculate subtotal in cents for precision
  const subtotalCents = lineItems.reduce((sum, item) => {
    const qty = typeof item.quantity === 'number' ? item.quantity : 0;
    const cost = parseFloat(item.unitCost) || 0;
    return sum + Math.round(qty * cost * 100);
  }, 0);
  const subtotal = subtotalCents / 100;

  // Calculate discount amount
  const discountAmount = discountType === 'percentage'
    ? Math.round(subtotalCents * (parseFloat(discountValue) || 0) / 100) / 100
    : parseFloat(discountValue) || 0;
  
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(afterDiscount * 5) / 100; // 5% tax
  const grandTotal = afterDiscount + taxAmount;

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

  const filteredInventoryItems = vendorId && vendorId !== 'none'
    ? inventoryItems.filter(item => vendorPrices.some(vp => vp.itemId === item.id))
    : [];

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        
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
    // For custom items, generate SKU from item name if not provided
    const generatedSku = lineItem.customName ? lineItem.customName.toUpperCase().replace(/\s+/g, '-').slice(0, 20) : '';
    return { sku: lineItem.customSku || generatedSku, itemName: lineItem.customName };
  };

  const isLineItemValid = (lineItem: LineItem) => {
    const { itemName } = getItemDetails(lineItem);
    const qty = typeof lineItem.quantity === 'number' ? lineItem.quantity : 0;
    return itemName && qty >= 1;
  };

  const isFormValid = () => {
    return vendorId && vendorId !== 'none' && lineItems.every(isLineItemValid);
  };

  const handleSave = async (status: 'draft' | 'ordered' = 'ordered') => {
    if (!isFormValid()) return;

    setSaving(true);

    const items: PurchaseOrderItem[] = lineItems.map((lineItem) => {
      const { sku, itemName } = getItemDetails(lineItem);
      const unitCost = lineItem.unitCost ? parseFloat(lineItem.unitCost) : undefined;
      return { sku, itemName, quantity: lineItem.quantity, unitCost };
    });

    const [year, month, day] = orderedAt.split('-').map(Number);
    const localOrderedAt = new Date(year, month - 1, day, 12, 0, 0);

    await createOrder(
      {
        items,
        orderedAt: localOrderedAt,
        notes: notes || undefined,
        vendorId: vendorId || null,
        poNumber: poNumber || undefined,
        requestId: requestId && requestId !== 'none' ? requestId : null,
        status,
      },
      pdfFile,
      imageFile
    );
    setSaving(false);
    navigate('/purchase-orders');
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            <Link to="/purchase-orders">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-card-foreground">
              Create Purchase Order
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Vendor Selection Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="vendor">Select Vendor *</Label>
                <Select value={vendorId} onValueChange={handleVendorChange}>
                  <SelectTrigger className="max-w-md">
                    <SelectValue placeholder="Select a vendor first" />
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
                <p className="text-xs text-muted-foreground">
                  Select a vendor to see available items with pricing
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Line Items Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Items</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                  className="gap-2"
                  disabled={!vendorId || vendorId === 'none'}
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(!vendorId || vendorId === 'none') && (
                <p className="text-sm text-muted-foreground text-center py-8 border rounded-lg bg-muted/30">
                  Please select a vendor first to add items
                </p>
              )}

              {vendorId && vendorId !== 'none' && lineItems.map((lineItem, index) => (
                <div
                  key={lineItem.id}
                  className="p-3 rounded-lg border bg-muted/30"
                >
                  {/* Custom item fields - only when explicitly custom */}
                  {lineItem.selectedItemId === 'custom' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Custom Item</p>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => updateLineItem(lineItem.id, { selectedItemId: '', customSku: '', customName: '' })}
                        >
                          Switch to inventory
                        </Button>
                      </div>
                      <div className="grid grid-cols-[1fr_100px_120px_100px_40px] gap-3 items-end">
                        <div className="space-y-1">
                          <Label className="text-xs">Item Name *</Label>
                          <Input
                            value={lineItem.customName}
                            onChange={(e) =>
                              updateLineItem(lineItem.id, { customName: e.target.value })
                            }
                            placeholder="Item name"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Qty *</Label>
                          <Input
                            type="number"
                            min={1}
                            value={lineItem.quantity === ('' as unknown as number) ? '' : lineItem.quantity}
                            onChange={(e) =>
                              updateLineItem(lineItem.id, {
                                quantity: e.target.value === '' ? ('' as unknown as number) : parseInt(e.target.value) || 0,
                              })
                            }
                            placeholder=""
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Unit Cost</Label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={lineItem.unitCost}
                            onChange={(e) =>
                              updateLineItem(lineItem.id, {
                                unitCost: e.target.value,
                              })
                            }
                            placeholder="0.00"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Total</Label>
                          <div className="h-9 flex items-center px-2 rounded-md border bg-muted text-sm font-medium">
                            ${(lineItem.quantity * (parseFloat(lineItem.unitCost) || 0)).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          {lineItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:text-destructive"
                            onClick={() => removeLineItem(lineItem.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inventory item selection */}
                  {lineItem.selectedItemId !== 'custom' && (
                    <div className="grid grid-cols-[1fr_100px_120px_100px_40px] gap-3 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">Item</Label>
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
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select item..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">-- Custom Item --</SelectItem>
                            {filteredInventoryItems.length > 0 ? (
                              filteredInventoryItems
                                .filter((item) => {
                                  const alreadySelected = lineItems.some(
                                    (li) => li.id !== lineItem.id && li.selectedItemId === item.id
                                  );
                                  return !alreadySelected;
                                })
                                .map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.name} ({item.sku})
                                  </SelectItem>
                                ))
                            ) : (
                              <SelectItem value="no-items" disabled>
                                No items with pricing
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Qty *</Label>
                        <Input
                          type="number"
                          min={1}
                          value={lineItem.quantity === ('' as unknown as number) ? '' : lineItem.quantity}
                          onChange={(e) =>
                            updateLineItem(lineItem.id, {
                              quantity: e.target.value === '' ? ('' as unknown as number) : parseInt(e.target.value) || 0,
                            })
                          }
                          placeholder=""
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Unit Cost</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={lineItem.unitCost}
                          onChange={(e) =>
                            updateLineItem(lineItem.id, {
                              unitCost: e.target.value,
                            })
                          }
                          placeholder="0.00"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Total</Label>
                        <div className="h-9 flex items-center px-2 rounded-md border bg-muted text-sm font-medium">
                          ${(lineItem.quantity * (parseFloat(lineItem.unitCost) || 0)).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        {lineItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-destructive hover:text-destructive"
                            onClick={() => removeLineItem(lineItem.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Items Subtotal */}
              {vendorId && vendorId !== 'none' && lineItems.length > 0 && (
                <div className="flex justify-end pt-2 border-t">
                  <div className="text-right space-y-1">
                    <div className="text-sm text-muted-foreground">
                      Items Subtotal: <span className="font-semibold text-foreground">
                        ${lineItems.reduce((sum, item) => sum + (item.quantity * (parseFloat(item.unitCost) || 0)), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="poNumber">PO Number</Label>
                  <Input
                    id="poNumber"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="Auto-generated if left empty"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to auto-generate (e.g., PO-0001)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderedAt">Order Date *</Label>
                  <Input
                    id="orderedAt"
                    type="date"
                    value={orderedAt}
                    onChange={(e) => setOrderedAt(e.target.value)}
                  />
                </div>
              </div>

              {/* Request Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Link to Request
                </Label>
                <Select value={requestId} onValueChange={setRequestId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a request" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- No Request --</SelectItem>
                    {requests
                      .filter(r => r.status === 'approved' || r.status === 'pending')
                      .map((request) => (
                        <SelectItem key={request.id} value={request.id}>
                          {request.requestNumber} - {request.itemName} ({request.quantity} {request.quantityUnit})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Optionally link this PO to an existing request
                </p>
              </div>

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
            </CardContent>
          </Card>

          {/* Attachments Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
              </div>
            </CardContent>
          </Card>

          {/* Order Summary Card */}
          {vendorId && vendorId !== 'none' && lineItems.some(li => parseFloat(li.unitCost) > 0) && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({lineItems.length} item{lineItems.length !== 1 ? 's' : ''})</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  
                  {/* Discount Input */}
                  <div className="flex items-center justify-between gap-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Discount</span>
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
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        step={discountType === 'percentage' ? '1' : '0.01'}
                        max={discountType === 'percentage' ? 100 : undefined}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder={discountType === 'percentage' ? '0' : '0.00'}
                        className="h-8 w-24 text-right"
                      />
                      <span className="text-sm text-muted-foreground w-8">
                        {discountType === 'percentage' ? '%' : '$'}
                      </span>
                    </div>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                      <span>Discount</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (5%)</span>
                    <span className="font-medium">${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base pt-2 border-t font-semibold">
                    <span>Total</span>
                    <span className="text-primary">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Link to="/purchase-orders">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button variant="secondary" onClick={() => handleSave('draft')} disabled={saving || !isFormValid()}>
              {saving ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button onClick={() => handleSave('ordered')} disabled={saving || !isFormValid()}>
              {saving ? 'Creating...' : 'Create Order'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
