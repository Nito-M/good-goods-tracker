import { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useVendorContacts } from '@/hooks/useVendorContacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useInventory } from '@/hooks/useInventory';
import { useVendors } from '@/hooks/useVendors';
import { useRequests } from '@/hooks/useRequests';
import { useJobs } from '@/hooks/useJobs';
import { useBankCards } from '@/hooks/useBankCards';
import { PurchaseOrderItem, PurchaseOrder } from '@/types/purchaseOrder';
import { Upload, FileText, Image as ImageIcon, X, Plus, Trash2, ArrowLeft, ClipboardList, Briefcase, Percent, DollarSign, CreditCard, ShoppingCart, ChevronsUpDown, Check } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, cn } from '@/lib/utils';
import { CompanySelector } from '@/components/CompanySelector';
import { useCompanies } from '@/hooks/useCompanies';
import { FullScreenItemPicker, PickerCartItem, PickerAddOverride } from '@/components/FullScreenItemPicker';
import { useAllItemVendorPrices } from '@/hooks/useAllItemVendorPrices';
import { useToast } from '@/hooks/use-toast';

interface VendorPrice {
  id: string;
  itemId: string;
  price: number;
  vendorSku: string | null;
}

// PO cart item extends PickerCartItem
type POCartItem = PickerCartItem;

export function AddPurchaseOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const editingOrder = (location.state as { editingOrder?: PurchaseOrder })?.editingOrder ?? null;
  const prefillItems = (location.state as { prefillItems?: Array<{ inventory_item_id: string; name: string; sku: string | null; quantity: number; unit_cost: number; notes?: string }> })?.prefillItems ?? null;
  const { createOrder, updateOrder } = usePurchaseOrders();
  const { allItems: inventoryItems } = useInventory();
  const { rows: allVendorPriceRows } = useAllItemVendorPrices();
  const { vendors } = useVendors();
  const { requests } = useRequests();
  const { jobs } = useJobs();
  const { cards: bankCards } = useBankCards();
  const { toast } = useToast();

  // Initialize cart from editing order
  const initCart = (): POCartItem[] => {
    if (editingOrder) {
      return editingOrder.items.map((item) => {
        const matchingItem = item.inventoryItemId
          ? inventoryItems.find(i => i.id === item.inventoryItemId)
          : inventoryItems.find(i => i.sku === item.sku);
        return {
          id: crypto.randomUUID(),
          inventoryItemId: item.inventoryItemId || matchingItem?.id || null,
          itemName: item.itemName,
          sku: item.sku,
          quantity: item.quantity,
          quantityUnit: 'pcs' as const,
          unitPrice: item.unitCost ?? 0,
          unitCost: item.unitCost ?? 0,
          notes: item.notes || '',
        };
      });
    }
    if (prefillItems && prefillItems.length) {
      return prefillItems.map(p => ({
        id: crypto.randomUUID(),
        inventoryItemId: p.inventory_item_id,
        itemName: p.name,
        sku: p.sku || '',
        quantity: p.quantity,
        quantityUnit: 'pcs' as const,
        unitPrice: p.unit_cost ?? 0,
        unitCost: p.unit_cost ?? 0,
        notes: p.notes || '',
      }));
    }
    return [];
  };

  const [cart, setCart] = useState<POCartItem[]>(initCart);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [poNumber, setPoNumber] = useState(editingOrder?.poNumber || '');
  const [orderedAt, setOrderedAt] = useState(
    editingOrder
      ? new Date(editingOrder.orderedAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(editingOrder?.notes || '');
  const [vendorId, setVendorId] = useState<string>(editingOrder?.vendorId || '');
  const [vendorOpen, setVendorOpen] = useState(false);
  const [requestId, setRequestId] = useState<string>(editingOrder?.requestId || '');
  const [showLinkRequest, setShowLinkRequest] = useState<boolean>(() => {
    if (editingOrder?.requestId) return true;
    try {
      return localStorage.getItem('po_show_link_request') === 'true';
    } catch {
      return false;
    }
  });
  const toggleShowLinkRequest = (val: boolean) => {
    setShowLinkRequest(val);
    try { localStorage.setItem('po_show_link_request', val ? 'true' : 'false'); } catch {}
    if (!val) setRequestId('');
  };
  const [jobIds, setJobIds] = useState<string[]>(editingOrder?.jobIds || []);
  const [showLinkJobs, setShowLinkJobs] = useState<boolean>(() => {
    if ((editingOrder?.jobIds || []).length > 0) return true;
    try {
      return localStorage.getItem('po_show_link_jobs') === 'true';
    } catch {
      return false;
    }
  });
  const toggleShowLinkJobs = (val: boolean) => {
    setShowLinkJobs(val);
    try { localStorage.setItem('po_show_link_jobs', val ? 'true' : 'false'); } catch {}
    if (!val) setJobIds([]);
  };

  const [bankCardId, setBankCardId] = useState<string>(editingOrder?.bankCardId || '');
  const [vendorPrices, setVendorPrices] = useState<VendorPrice[]>([]);
  const [vendorChangeChooser, setVendorChangeChooser] = useState<Array<{
    cartId: string;
    itemName: string;
    rows: Array<{ id: string; price: number; vendorSku: string | null; leadTimeDays: number | null }>;
  }>>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(editingOrder?.discountType || 'percentage');
  const [discountValue, setDiscountValue] = useState<string>(editingOrder?.discountValue ? String(editingOrder.discountValue) : '');
  const [pstPercent, setPstPercent] = useState<string>(editingOrder?.pstPercent ? String(editingOrder.pstPercent) : '');
  const [gstEnabled, setGstEnabled] = useState<boolean>(editingOrder?.gstEnabled ?? true);
  const [companyId, setCompanyId] = useState<string>(editingOrder?.companyId || '');
  const [contactPersonName, setContactPersonName] = useState<string>(editingOrder?.contactPersonName || '');
  const [vendorInvoiceNumber, setVendorInvoiceNumber] = useState<string>(editingOrder?.vendorInvoiceNumber || '');
  const { companies, defaultCompany } = useCompanies();
  const { contacts: vendorContacts } = useVendorContacts(vendorId && vendorId !== 'none' ? vendorId : undefined);

  // Set default company on load (only for new orders)
  useEffect(() => {
    if (!editingOrder && defaultCompany && !companyId) {
      setCompanyId(defaultCompany.id);
    }
  }, [defaultCompany]);

  // Calculate subtotal
  const subtotalCents = cart.reduce((sum, item) => {
    const qty = item.quantity || 0;
    const cost = item.unitPrice || 0;
    return sum + Math.round(qty * cost * 100);
  }, 0);
  const subtotal = subtotalCents / 100;

  const discountAmount = discountType === 'percentage'
    ? Math.round(subtotalCents * (parseFloat(discountValue) || 0) / 100) / 100
    : parseFloat(discountValue) || 0;
  
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = gstEnabled ? Math.round(afterDiscount * 5) / 100 : 0;
  const pstNum = parseFloat(pstPercent) || 0;
  const pstAmount = Math.round(afterDiscount * pstNum * 100) / 10000;
  const grandTotal = afterDiscount + taxAmount + pstAmount;

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
        .select('id, item_id, price, vendor_sku')
        .eq('vendor_id', vendorId);
      if (data) {
        setVendorPrices(data.map(d => ({
          id: d.id,
          itemId: d.item_id,
          price: Number(d.price),
          vendorSku: d.vendor_sku,
        })));
      }
    };
    fetchVendorPrices();
  }, [vendorId]);

  // When vendor changes, update unit costs AND skus on existing cart items
  const handleVendorChange = (newVendorId: string) => {
    setVendorId(newVendorId);
    setContactPersonName('');
    if (!newVendorId || newVendorId === 'none') {
      // Restore primary SKU on inventory-linked lines
      setCart(prev => prev.map(c => {
        if (c.inventoryItemId) {
          const inv = inventoryItems.find(i => i.id === c.inventoryItemId);
          if (inv) {
            return { ...c, sku: inv.sku };
          }
        }
        return c;
      }));
      return;
    }
    supabase
      .from('item_vendor_prices')
      .select('id, item_id, price, vendor_sku, lead_time_days')
      .eq('vendor_id', newVendorId)
      .then(({ data }) => {
        if (data) {
          // Group ALL rows per item (a vendor can have multiple price rows per item)
          const rowsByItem = new Map<string, Array<{ id: string; price: number; vendorSku: string | null; leadTimeDays: number | null }>>();
          data.forEach((d: any) => {
            const list = rowsByItem.get(d.item_id) || [];
            list.push({ id: d.id, price: Number(d.price), vendorSku: d.vendor_sku, leadTimeDays: d.lead_time_days ?? null });
            rowsByItem.set(d.item_id, list);
          });
          const newChooserQueue: Array<{ cartId: string; itemName: string; rows: any[] }> = [];
          setCart(prev => prev.map(c => {
            if (c.inventoryItemId) {
              const rows = rowsByItem.get(c.inventoryItemId) || [];
              const inv = inventoryItems.find(i => i.id === c.inventoryItemId);
              if (rows.length === 1) {
                const row = rows[0];
                return {
                  ...c,
                  unitPrice: row.price,
                  unitCost: row.price,
                  sku: row.vendorSku || inv?.sku || c.sku,
                };
              }
              if (rows.length > 1) {
                // Defer to chooser; tentatively apply first row so UI isn't blank
                const first = rows[0];
                newChooserQueue.push({ cartId: c.id, itemName: c.itemName, rows });
                return {
                  ...c,
                  unitPrice: first.price,
                  unitCost: first.price,
                  sku: first.vendorSku || inv?.sku || c.sku,
                };
              }
              // No vendor row → revert to primary SKU
              if (inv) {
                return { ...c, sku: inv.sku };
              }
            }
            return c;
          }));
          if (newChooserQueue.length > 0) {
            setVendorChangeChooser(newChooserQueue);
          }
        }
      });
  };

  // Select a vendor-price row for a queued cart item (after vendor change)
  const handleVendorChangeChooserPick = (cartId: string, row: { id: string; price: number; vendorSku: string | null }) => {
    setCart(prev => prev.map(c => {
      if (c.id !== cartId) return c;
      const inv = inventoryItems.find(i => i.id === c.inventoryItemId);
      return {
        ...c,
        unitPrice: row.price,
        unitCost: row.price,
        sku: row.vendorSku || inv?.sku || c.sku,
      };
    }));
    setVendorChangeChooser(prev => prev.filter(q => q.cartId !== cartId));
  };

  // Picker callbacks
  const handleAddItem = (item: any, override?: PickerAddOverride) => {
    const vendorPrice = vendorPrices.find(vp => vp.itemId === item.id);
    const cost = override?.price ?? vendorPrice?.price ?? item.cost ?? 0;
    const sku = override?.vendorSku
      ?? ((vendorId && vendorId !== 'none' && vendorPrice?.vendorSku) || item.sku);
    const normalizedSku = String(sku || '').trim().toLowerCase();

    setCart(prev => {
      const sameInventoryItem = prev.find(c => c.inventoryItemId === item.id);
      if (sameInventoryItem) {
        return prev.map(c => c.id === sameInventoryItem.id
          ? { ...c, quantity: (c.quantity || 0) + 1, unitPrice: cost, unitCost: cost, sku }
          : c);
      }

      const samePartNumber = normalizedSku
        ? prev.find(c => String(c.sku || '').trim().toLowerCase() === normalizedSku)
        : undefined;
      if (samePartNumber) {
        toast({
          title: 'Part # already on this PO',
          description: 'Adjust the quantity on the existing line instead of adding another matching inventory record.',
        });
        return prev;
      }

      const newItem: POCartItem = {
        id: crypto.randomUUID(),
        inventoryItemId: item.id,
        itemName: item.name,
        sku,
        quantity: 1,
        quantityUnit: item.quantityUnit || 'pcs',
        unitPrice: cost,
        unitCost: cost,
        notes: '',
      };
      return [...prev, newItem];
    });
  };

  const handleAddCustomItem = () => {
    const newItem: POCartItem = {
      id: crypto.randomUUID(),
      inventoryItemId: null,
      itemName: '',
      sku: '',
      quantity: 1,
      quantityUnit: 'pcs',
      unitPrice: 0,
      unitCost: 0,
      notes: '',
    };
    setCart(prev => [...prev, newItem]);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number | null) => {
    setCart(prev => prev.map(c => c.id === itemId ? { ...c, quantity } : c));
  };

  const handleRemoveItem = (itemId: string) => {
    setCart(prev => prev.filter(c => c.id !== itemId));
  };

  const handleUpdateItem = (itemId: string, updates: Partial<PickerCartItem>) => {
    setCart(prev => prev.map(c => c.id === itemId ? { ...c, ...updates } : c));
  };

  const isFormValid = () => {
    return vendorId && vendorId !== 'none' && cart.length > 0 && cart.every(c => c.itemName && (c.quantity || 0) >= 1);
  };

  const isDraftValid = () => {
    return cart.length > 0 && cart.some(c => c.itemName && (c.quantity || 0) >= 1);
  };

  const handleSave = async (status: 'draft' | 'ordered' = 'ordered') => {
    if (status === 'draft' ? !isDraftValid() : !isFormValid()) return;
    setSaving(true);

    const items: PurchaseOrderItem[] = cart.map((c) => ({
      sku: c.sku || c.itemName.toUpperCase().replace(/\s+/g, '-').slice(0, 20),
      itemName: c.itemName,
      quantity: c.quantity || 0,
      unitCost: c.unitPrice || undefined,
      notes: c.notes || undefined,
      inventoryItemId: c.inventoryItemId || null,
    }));


    const [year, month, day] = orderedAt.split('-').map(Number);
    const localOrderedAt = new Date(year, month - 1, day, 12, 0, 0);

    if (editingOrder) {
      await updateOrder(
        editingOrder.id,
        {
          items,
          orderedAt: localOrderedAt,
          notes: notes || undefined,
          vendorId: vendorId || null,
          jobIds,
          poNumber: poNumber || undefined,
          discountType,
          discountValue: parseFloat(discountValue) || 0,
          discountAmount,
          pstPercent: pstNum,
          gstEnabled,
          companyId: companyId || null,
          bankCardId: bankCardId && bankCardId !== 'none' ? bankCardId : null,
          contactPersonName: contactPersonName || null,
          vendorInvoiceNumber: vendorInvoiceNumber || null,
        },
        pdfFile,
        imageFile
      );
    } else {
      await createOrder(
        {
          items,
          orderedAt: localOrderedAt,
          notes: notes || undefined,
          vendorId: vendorId || null,
          poNumber: poNumber || undefined,
          requestId: requestId && requestId !== 'none' ? requestId : null,
          jobIds,
          status,
          discountType,
          discountValue: parseFloat(discountValue) || 0,
          discountAmount,
          pstPercent: pstNum,
          gstEnabled,
          companyId: companyId || null,
          bankCardId: bankCardId && bankCardId !== 'none' ? bankCardId : null,
          contactPersonName: contactPersonName || null,
          vendorInvoiceNumber: vendorInvoiceNumber || null,
        },
        pdfFile,
        imageFile
      );
    }
    setSaving(false);
    const returnToPo = poNumber || editingOrder?.poNumber || '';
    navigate(`/purchase-orders?po=${encodeURIComponent(returnToPo)}`);
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
            <Link to={editingOrder ? `/purchase-orders?po=${encodeURIComponent(poNumber || editingOrder.poNumber || '')}` : '/purchase-orders'}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
             <h1 className="text-xl font-bold tracking-tight text-card-foreground">
               {editingOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
             </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Company Selector */}
          {companies.length > 1 && (
            <Card>
              <CardContent className="pt-6">
                <CompanySelector companies={companies} value={companyId} onChange={setCompanyId} />
              </CardContent>
            </Card>
          )}

          {/* Vendor Selection Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="vendor">Select Vendor *</Label>
                <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={vendorOpen}
                      className="max-w-md w-full justify-between"
                    >
                      {vendorId && vendorId !== 'none'
                        ? vendors.find((v) => v.id === vendorId)?.name
                        : '-- No Vendor --'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command filter={(value, search) => value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
                      <CommandInput placeholder="Search vendors..." />
                      <CommandList>
                        <CommandEmpty>No vendor found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="none"
                            onSelect={() => {
                              handleVendorChange('none');
                              setVendorOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                !vendorId || vendorId === 'none' ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            -- No Vendor --
                          </CommandItem>
                          {vendors.map((vendor) => (
                            <CommandItem
                              key={vendor.id}
                              value={vendor.name}
                              onSelect={() => {
                                handleVendorChange(vendor.id);
                                setVendorOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  vendorId === vendor.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {vendor.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              {/* Contact Person */}
              {vendorId && vendorId !== 'none' && (
                <div className="space-y-2 mt-4">
                  <Label>Contact Person</Label>
                  <Select value={contactPersonName || 'none'} onValueChange={(val) => setContactPersonName(val === 'none' ? '' : val)}>
                    <SelectTrigger className="max-w-md">
                      <SelectValue placeholder="Select contact (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- No Contact --</SelectItem>
                      {vendorContacts.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}{c.job_position ? ` (${c.job_position})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items Card - Full Screen Picker Style */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Items</CardTitle>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                  className="gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add Items from Inventory
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/30">
                  <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No items added yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Click "Add Items from Inventory" to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((c) => (
                    <div key={c.id} className="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {!c.inventoryItemId ? (
                            <Input
                              value={c.itemName}
                              onChange={(e) => handleUpdateItem(c.id, { itemName: e.target.value })}
                              placeholder="Item name..."
                              className="h-7 text-sm font-medium"
                            />
                          ) : (
                            <p className="font-medium text-sm">{c.itemName}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{c.sku || 'No SKU'}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive shrink-0"
                          onClick={() => handleRemoveItem(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 items-end">
                        <div className="space-y-1">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            className="h-7 text-sm"
                            value={c.quantity ?? ''}
                            onChange={(e) => handleUpdateQuantity(c.id, e.target.value === '' ? null : parseFloat(e.target.value) || 0)}
                            step={0.01}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Unit Cost</Label>
                          <Input
                            type="number"
                            className="h-7 text-sm"
                            value={c.unitPrice || ''}
                            onChange={(e) => handleUpdateItem(c.id, { unitPrice: parseFloat(e.target.value) || 0, unitCost: parseFloat(e.target.value) || 0 })}
                            step={0.00001}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Total</Label>
                          <div className="h-7 flex items-center px-2 rounded-md border bg-muted text-sm font-medium">
                            ${((c.quantity || 0) * (c.unitPrice || 0)).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {!c.inventoryItemId && (
                        <div className="space-y-1">
                          <Label className="text-xs">SKU</Label>
                          <Input
                            value={c.sku}
                            onChange={(e) => handleUpdateItem(c.id, { sku: e.target.value })}
                            placeholder="SKU"
                            className="h-7 text-xs"
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <Label className="text-xs">Notes</Label>
                        <Input
                          value={c.notes}
                          onChange={(e) => handleUpdateItem(c.id, { notes: e.target.value })}
                          placeholder="Item notes..."
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Items Subtotal */}
                  <div className="flex justify-end pt-2 border-t">
                    <div className="text-sm text-muted-foreground">
                      Items Subtotal: <span className="font-semibold text-foreground">${subtotal.toFixed(2)}</span>
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

              <div className="space-y-2">
                <Label htmlFor="vendorInvoiceNumber">Vendor Invoice #</Label>
                <Input
                  id="vendorInvoiceNumber"
                  value={vendorInvoiceNumber}
                  onChange={(e) => setVendorInvoiceNumber(e.target.value)}
                  placeholder="Vendor's invoice or reference number (optional)"
                />
              </div>

              {/* Request Selection - toggleable */}
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 px-3 py-2">
                  <Label htmlFor="toggle-link-request" className="flex items-center gap-2 cursor-pointer mb-0">
                    <ClipboardList className="h-4 w-4" />
                    Link to Request
                  </Label>
                  <Switch
                    id="toggle-link-request"
                    checked={showLinkRequest}
                    onCheckedChange={toggleShowLinkRequest}
                  />
                </div>
                {showLinkRequest && (
                  <>
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
                  </>
                )}
              </div>


              {/* Job Selection - toggleable */}
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 px-3 py-2">
                  <Label htmlFor="toggle-link-jobs" className="flex items-center gap-2 cursor-pointer mb-0">
                    <Briefcase className="h-4 w-4" />
                    Link to Jobs
                  </Label>
                  <Switch
                    id="toggle-link-jobs"
                    checked={showLinkJobs}
                    onCheckedChange={toggleShowLinkJobs}
                  />
                </div>
                {showLinkJobs && (
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
                )}
                {showLinkJobs && (
                  <p className="text-xs text-muted-foreground">
                    Optionally link this PO to one or more jobs
                  </p>
                )}
              </div>


              {/* Bank Card Selection */}
              {bankCards.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Link to Bank Card
                  </Label>
                  <Select value={bankCardId} onValueChange={setBankCardId}>
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
                  <p className="text-xs text-muted-foreground">
                    Optionally link this PO to a bank card
                  </p>
                </div>
              )}

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
          {cart.some(c => (c.unitPrice || 0) > 0) && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({cart.length} item{cart.length !== 1 ? 's' : ''})</span>
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
                  
                  <div className="flex justify-between items-center text-sm gap-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={gstEnabled} onCheckedChange={setGstEnabled} id="gst-toggle" />
                      <label htmlFor="gst-toggle" className="text-muted-foreground cursor-pointer">
                        Tax / GST (5%) {!gstEnabled && <span className="text-xs">— off</span>}
                      </label>
                    </div>
                    <span className="font-medium">${taxAmount.toFixed(2)}</span>
                  </div>

                  {/* PST Input */}
                  <div className="flex items-center justify-between gap-3 py-1">
                    <span className="text-sm text-muted-foreground">PST <span className="text-sky-400">(optional)</span></span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        max={100}
                        value={pstPercent}
                        onChange={(e) => setPstPercent(e.target.value)}
                        placeholder="0"
                        className="h-8 w-24 text-right"
                      />
                      <span className="text-sm text-muted-foreground w-8">%</span>
                    </div>
                  </div>
                  {pstAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">PST ({pstNum}%)</span>
                      <span className="font-medium">${pstAmount.toFixed(2)}</span>
                    </div>
                  )}
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
            {editingOrder ? (
              <Button onClick={() => handleSave(editingOrder.status === 'draft' ? 'draft' : 'ordered')} disabled={saving || !isDraftValid()}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => handleSave('draft')} disabled={saving || !isDraftValid()}>
                  {saving ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button onClick={() => handleSave('ordered')} disabled={saving || !isFormValid()}>
                  {saving ? 'Creating...' : 'Create Order'}
                </Button>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Full Screen Item Picker */}
      <FullScreenItemPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        inventoryItems={inventoryItems}
        cart={cart}
        onAddItem={handleAddItem}
        onAddCustomItem={handleAddCustomItem}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onUpdateItem={handleUpdateItem}
        documentType="Purchase Order"
        formatPrice={formatCurrency}
        vendorItemIds={vendorId && vendorId !== 'none' ? vendorPrices.map(vp => vp.itemId) : null}
        vendorName={vendors.find(v => v.id === vendorId)?.name}
        vendorPriceRows={allVendorPriceRows}
        selectedVendorId={vendorId && vendorId !== 'none' ? vendorId : null}
      />

      {/* Vendor-change multi-row chooser */}
      <Dialog
        open={vendorChangeChooser.length > 0}
        onOpenChange={(o) => { if (!o) setVendorChangeChooser([]); }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose a vendor price</DialogTitle>
            <DialogDescription>
              {vendorChangeChooser[0]?.itemName} has multiple price entries for this vendor. Pick which one to use.
              {vendorChangeChooser.length > 1 ? ` (${vendorChangeChooser.length - 1} more after this)` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {vendorChangeChooser[0]?.rows.map((r) => (
              <button
                key={r.id}
                onClick={() => handleVendorChangeChooserPick(vendorChangeChooser[0].cartId, r)}
                className="w-full text-left border border-border rounded-lg p-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                      {r.vendorSku ? `Part #: ${r.vendorSku}` : 'No vendor part #'}
                      {r.leadTimeDays != null ? ` · Lead time: ${r.leadTimeDays}d` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-semibold">{formatCurrency(r.price)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
