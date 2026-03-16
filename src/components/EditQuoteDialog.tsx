import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { CompanySelector } from '@/components/CompanySelector';
import { useCompanies } from '@/hooks/useCompanies';
import { useCustomers } from '@/hooks/useCustomers';
import { useVendors } from '@/hooks/useVendors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Quote, QuoteItem } from '@/types/quote';
import { QuantityUnit, QUANTITY_UNIT_LABELS } from '@/types/inventory';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

interface EditableQuoteItem {
  id: string;
  inventoryItemId: string | null;
  itemName: string;
  sku: string;
  quantity: number | null;
  quantityUnit: QuantityUnit;
  unitPrice: number;
  unitCost: number;
  notes: string;
}

interface EditQuoteDialogProps {
  quote: Quote | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (quoteId: string, data: {
    vendorId: string | null;
    quoteNumber: string;
    items: EditableQuoteItem[];
    taxRate: number;
    discountRate: number;
    notes: string | null;
    paymentTerms: string;
    validUntil: string | null;
    companyId: string | null;
    hidePrices: boolean;
  }) => Promise<void>;
  vendors: Array<{ id: string; name: string }>;
}

export function EditQuoteDialog({ quote, open, onOpenChange, onSave, vendors }: EditQuoteDialogProps) {
  const { customers } = useCustomers();
  const { addVendor } = useVendors();
  const [pendingCustomerName, setPendingCustomerName] = useState<string | null>(null);
  const [items, setItems] = useState<EditableQuoteItem[]>([]);
  const [vendorId, setVendorId] = useState<string>('');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [taxRate, setTaxRate] = useState<number | null>(null);
  const [discountRate, setDiscountRate] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Due on receipt');
  const [validUntil, setValidUntil] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [companyId, setCompanyId] = useState<string>('');
  const [hidePrices, setHidePrices] = useState(false);
  const { companies, defaultCompany } = useCompanies();

  useEffect(() => {
    if (quote) {
      setItems(quote.items.map(item => ({
        id: item.id,
        inventoryItemId: item.inventoryItemId,
        itemName: item.itemName,
        sku: item.sku,
        quantity: item.quantity || null,
        quantityUnit: (item.quantityUnit as QuantityUnit) || 'pcs',
        unitPrice: item.unitPrice,
        unitCost: item.unitCost,
        notes: item.notes || '',
      })));
      setVendorId(quote.vendorId || '');
      setQuoteNumber(quote.quoteNumber);
      setTaxRate(quote.taxRate || null);
      setDiscountRate(quote.discountRate || null);
      setNotes(quote.notes || '');
      setPaymentTerms(quote.paymentTerms || 'Due on receipt');
      setValidUntil(quote.validUntil ? format(new Date(quote.validUntil), 'yyyy-MM-dd') : '');
      setCompanyId((quote as any).companyId || defaultCompany?.id || '');
      setHidePrices(quote.hidePrices || false);
    }
  }, [quote, defaultCompany]);

  const updateItem = (itemId: string, updates: Partial<EditableQuoteItem>) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const addCustomItem = () => {
    const customId = `new-${Date.now()}`;
    setItems(prev => [...prev, {
      id: customId,
      inventoryItemId: null,
      itemName: '',
      sku: '',
      quantity: null,
      quantityUnit: 'pcs' as QuantityUnit,
      unitPrice: 0,
      unitCost: 0,
      notes: '',
    }]);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * item.unitPrice, 0);
  const effectiveDiscountRate = discountRate ?? 0;
  const effectiveTaxRate = taxRate ?? 0;
  const discountAmount = subtotal * (effectiveDiscountRate / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (effectiveTaxRate / 100);
  const total = afterDiscount + taxAmount;

  // Auto-select vendor created from customer
  useEffect(() => {
    if (pendingCustomerName) {
      const match = vendors.find(v => v.name === pendingCustomerName);
      if (match) {
        setVendorId(match.id);
        setPendingCustomerName(null);
      }
    }
  }, [vendors, pendingCustomerName]);

  const handleSave = async () => {
    if (!quote) return;
    
    const invalidItems = items.filter(item => !item.itemName.trim());
    if (invalidItems.length > 0) return;

    setIsSaving(true);
    await onSave(quote.id, {
      vendorId: vendorId || null,
      quoteNumber,
      items,
      taxRate: effectiveTaxRate,
      discountRate: effectiveDiscountRate,
      notes: notes || null,
      paymentTerms,
      validUntil: validUntil ? new Date(validUntil).toISOString() : null,
      companyId: companyId || null,
      hidePrices,
    });
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Quote</DialogTitle>
          <DialogDescription>
            Modify quote details and items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company Selector */}
          <CompanySelector companies={companies} value={companyId} onChange={setCompanyId} />

          {/* Quote Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quote Number</Label>
              <Input
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Vendor / Customer</Label>
              <Select value={vendorId || 'none'} onValueChange={(val) => {
                if (val === 'none') {
                  setVendorId('');
                } else if (val.startsWith('customer:')) {
                  const customerId = val.replace('customer:', '');
                  const customer = customers.find(c => c.id === customerId);
                  if (customer) {
                    const existingVendor = vendors.find(v => v.name === customer.name);
                    if (existingVendor) {
                      setVendorId(existingVendor.id);
                    } else {
                      addVendor({
                        name: customer.name,
                        contact_email: customer.email,
                        contact_phone: customer.phone,
                        address: customer.address,
                        notes: null,
                        link: null,
                        color: null,
                      });
                      setPendingCustomerName(customer.name);
                    }
                  }
                } else {
                  setVendorId(val);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor or customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No customer</SelectItem>
                  {vendors.length > 0 && (
                    <>
                      <SelectItem value="__vendor_header" disabled className="text-xs font-semibold text-muted-foreground">
                        Vendors
                      </SelectItem>
                      {vendors.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  {customers.length > 0 && (
                    <>
                      <SelectItem value="__customer_header" disabled className="text-xs font-semibold text-muted-foreground">
                        Customers
                      </SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={`customer:${customer.id}`} value={`customer:${customer.id}`}>
                          {customer.name}{customer.company ? ` (${customer.company})` : ''}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Items</Label>
              <Button variant="outline" size="sm" onClick={addCustomItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No items</p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Item Name</Label>
                          <Input
                            value={item.itemName}
                            onChange={(e) => updateItem(item.id, { itemName: e.target.value })}
                            placeholder="Item name"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">SKU</Label>
                          <Input
                            value={item.sku}
                            onChange={(e) => updateItem(item.id, { sku: e.target.value })}
                            placeholder="SKU"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive mt-5"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateItem(item.id, { quantity: val === '' ? null : parseFloat(val) });
                          }}
                          placeholder="Qty"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Unit</Label>
                        <Select
                          value={item.quantityUnit}
                          onValueChange={(val) => updateItem(item.id, { quantityUnit: val as QuantityUnit })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(QUANTITY_UNIT_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Unit Price</Label>
                        <Input
                          type="number"
                          step="0.00001"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Total</Label>
                        <Input
                          readOnly
                          value={formatCurrency((item.quantity || 0) * item.unitPrice)}
                          className="bg-muted"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Notes</Label>
                      <Input
                        value={item.notes}
                        onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                        placeholder="Item notes..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discount Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={discountRate ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setDiscountRate(val === '' ? null : parseFloat(val));
                }}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={taxRate ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setTaxRate(val === '' ? null : parseFloat(val));
                }}
                placeholder="0"
              />
            </div>
          </div>

          {/* Hide Prices */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="editHidePrices"
              checked={hidePrices}
              onCheckedChange={(checked) => setHidePrices(checked === true)}
            />
            <Label htmlFor="editHidePrices" className="text-sm font-normal cursor-pointer">
              Hide prices on quote
            </Label>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Quote notes..."
              rows={3}
            />
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {effectiveDiscountRate > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({effectiveDiscountRate}%)</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {effectiveTaxRate > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({effectiveTaxRate}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || items.length === 0}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
