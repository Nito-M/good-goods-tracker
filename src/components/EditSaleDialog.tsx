import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CompanySelector } from '@/components/CompanySelector';
import { useCompanies } from '@/hooks/useCompanies';
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
import { Sale, SaleItem } from '@/types/sale';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

interface EditableSaleItem {
  id: string;
  inventoryItemId: string | null;
  itemName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

interface EditSaleDialogProps {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (saleId: string, data: {
    vendorId: string | null;
    invoiceNumber: string;
    items: EditableSaleItem[];
    taxRate: number;
    discountRate: number;
    notes: string | null;
    paymentTerms: string;
    dueDate: string | null;
    companyId: string | null;
    contactPersonName: string | null;
  }) => Promise<void>;
  vendors: Array<{ id: string; name: string }>;
}

export function EditSaleDialog({ sale, open, onOpenChange, onSave, vendors }: EditSaleDialogProps) {
  const [items, setItems] = useState<EditableSaleItem[]>([]);
  const [vendorId, setVendorId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [discountRate, setDiscountRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Due on receipt');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [companyId, setCompanyId] = useState<string>('');
  const [contactPersonName, setContactPersonName] = useState<string>('');
  const { companies, defaultCompany } = useCompanies();

  useEffect(() => {
    if (sale) {
      setItems(sale.items.map(item => ({
        id: item.id,
        inventoryItemId: item.inventoryItemId,
        itemName: item.itemName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost,
      })));
      setVendorId(sale.vendorId || '');
      setInvoiceNumber(sale.invoiceNumber);
      setTaxRate(sale.taxRate);
      setDiscountRate(sale.discountRate);
      setNotes(sale.notes || '');
      setPaymentTerms(sale.paymentTerms || 'Due on receipt');
      setDueDate(sale.dueDate ? format(new Date(sale.dueDate), 'yyyy-MM-dd') : '');
      setCompanyId((sale as any).companyId || defaultCompany?.id || '');
      setContactPersonName((sale as any).contactPersonName || '');
    }
  }, [sale, defaultCompany]);

  const updateItem = (itemId: string, updates: Partial<EditableSaleItem>) => {
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
      quantity: 1,
      unitPrice: 0,
      unitCost: 0,
    }]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discountAmount = subtotal * (discountRate / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;


  const handleSave = async () => {
    if (!sale) return;
    
    const invalidItems = items.filter(item => !item.itemName.trim());
    if (invalidItems.length > 0) return;

    setIsSaving(true);
    await onSave(sale.id, {
      vendorId: vendorId || null,
      invoiceNumber,
      items,
      taxRate,
      discountRate,
      notes: notes || null,
      paymentTerms,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      companyId: companyId || null,
      contactPersonName: contactPersonName.trim() || null,
    });
    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
          <DialogDescription>
            Modify invoice details and items
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company Selector */}
          <CompanySelector companies={companies} value={companyId} onChange={setCompanyId} />

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <div className="flex gap-2">
                <Input
                  value={invoiceNumber.split('-')[0] || ''}
                  onChange={(e) => {
                    const prefix = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    const number = invoiceNumber.split('-').slice(1).join('-') || '';
                    setInvoiceNumber(number ? `${prefix}-${number}` : prefix);
                  }}
                  placeholder="Prefix"
                  className="w-24"
                />
                <span className="flex items-center text-muted-foreground">-</span>
                <Input
                  value={invoiceNumber.split('-').slice(1).join('-') || ''}
                  onChange={(e) => {
                    const prefix = invoiceNumber.split('-')[0] || 'INV';
                    const number = e.target.value.replace(/[^0-9]/g, '');
                    setInvoiceNumber(`${prefix}-${number}`);
                  }}
                  placeholder="Number"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
            <Select value={vendorId || 'none'} onValueChange={(val) => setVendorId(val === 'none' ? '' : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No customer</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          min={0}
                          step="0.01"
                        />
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
                        <Label className="text-xs">Unit Cost</Label>
                        <Input
                          type="number"
                          step="0.00001"
                          value={item.unitCost}
                          onChange={(e) => updateItem(item.id, { unitCost: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Total</Label>
                        <Input
                          readOnly
                          value={formatCurrency(item.quantity * item.unitPrice)}
                          className="bg-muted"
                        />
                      </div>
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
                value={discountRate}
                onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Invoice notes..."
              rows={3}
            />
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountRate > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({discountRate}%)</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({taxRate}%)</span>
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
