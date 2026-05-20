import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  ArrowLeft,
  ShoppingCart,
  Trash2,
  Minus,
  Receipt,
  Search,
  ShoppingBag,
  ChevronsUpDown,
  Check,
  GripVertical,
} from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/hooks/useSales';
import { useInventory } from '@/hooks/useInventory';
import { useVendors } from '@/hooks/useVendors';
import { useCustomers } from '@/hooks/useCustomers';
import { useProfile } from '@/hooks/useProfile';
import { useBank } from '@/hooks/useBank';
import { Link } from 'react-router-dom';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { SaleCard } from '@/components/SaleCard';
import { InvoicePreviewDialog } from '@/components/InvoicePreviewDialog';

import { InventoryItem } from '@/types/inventory';
import { InvoiceSettings, Sale } from '@/types/sale';
import { generateInvoicePDF } from '@/lib/invoiceGenerator';
import { useCompanies } from '@/hooks/useCompanies';
import { CompanySelector } from '@/components/CompanySelector';
import { FullScreenItemPicker, PickerCartItem } from '@/components/FullScreenItemPicker';
import { useAssemblies } from '@/hooks/useAssemblies';

interface CartItem {
  inventoryItem: InventoryItem;
  quantity: number;
  customPrice?: number; // Custom price after markup
  excludeMarkup?: boolean;
  isCustom?: boolean;
  discountRate?: number; // Per-item discount %
}

function SortableSaleRow({ item: c, formatCurrency, updateCartQuantity, removeFromCart, markupPercent, calculateMarkupPrice, setCart, getItemPrice }: {
  item: CartItem;
  formatCurrency: (v: number) => string;
  updateCartQuantity: (id: string, qty: number | null) => void;
  removeFromCart: (id: string) => void;
  markupPercent: number | '';
  calculateMarkupPrice: (cost: number, markup: number) => number;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  getItemPrice: (c: CartItem) => number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: c.inventoryItem.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-8">
        <button type="button" className="cursor-grab touch-none text-muted-foreground hover:text-foreground" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell className="font-medium">
        {c.isCustom ? (
          <Input
            type="text"
            placeholder="Custom item name"
            className="w-full min-w-[180px]"
            value={c.inventoryItem.name}
            onChange={(e) => {
              const newName = e.target.value;
              setCart(prev => prev.map(item =>
                item.inventoryItem.id === c.inventoryItem.id
                  ? { ...item, inventoryItem: { ...item.inventoryItem, name: newName } }
                  : item
              ));
            }}
          />
        ) : (
          c.inventoryItem.name
        )}
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.01"
          className="w-24"
          value={getItemPrice(c)}
          onChange={(e) => {
            const newPrice = parseFloat(e.target.value) || 0;
            setCart(prev => prev.map(item =>
              item.inventoryItem.id === c.inventoryItem.id
                ? { ...item, customPrice: newPrice }
                : item
            ));
          }}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => updateCartQuantity(c.inventoryItem.id, c.quantity - 1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            type="number"
            className="w-16 text-center"
            value={c.quantity}
            onChange={(e) => updateCartQuantity(c.inventoryItem.id, parseInt(e.target.value) || 0)}
            min={1}
          />
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            onClick={() => updateCartQuantity(c.inventoryItem.id, c.quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.1"
          min={0}
          max={100}
          className="w-20"
          value={c.discountRate ?? 0}
          onChange={(e) => {
            const rate = parseFloat(e.target.value) || 0;
            setCart(prev => prev.map(item =>
              item.inventoryItem.id === c.inventoryItem.id
                ? { ...item, discountRate: rate }
                : item
            ));
          }}
        />
      </TableCell>
      <TableCell className="text-right">
        {(() => {
          const gross = c.quantity * getItemPrice(c);
          const rate = c.discountRate || 0;
          return formatCurrency(gross - gross * (rate / 100));
        })()}
      </TableCell>
      {markupPercent !== '' && (
        <TableCell>
          <Button
            type="button"
            variant={c.excludeMarkup ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs whitespace-nowrap"
            onClick={() => {
              const newExclude = !c.excludeMarkup;
              setCart(prev => prev.map(item =>
                item.inventoryItem.id === c.inventoryItem.id
                  ? {
                      ...item,
                      excludeMarkup: newExclude,
                      customPrice: newExclude ? undefined : calculateMarkupPrice(item.inventoryItem.cost, markupPercent as number)
                    }
                  : item
              ));
            }}
          >
            {c.excludeMarkup ? 'Excluded' : 'Exclude'}
          </Button>
        </TableCell>
      )}
      <TableCell>
        <Button
          size="icon"
          variant="ghost"
          className="text-destructive"
          onClick={() => removeFromCart(c.inventoryItem.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function Sales() {
  const { sales, loading, createSale, updateSale, updateStatus, togglePickedUp, deleteSale, revertSale } = useSales();
  const { allItems: inventoryItems } = useInventory();
  const { vendors, addVendor } = useVendors();
  const { customers } = useCustomers();
  const { profile } = useProfile();
  const { addSaleRevenue } = useBank();
  const { companies } = useCompanies();
  const { assemblies } = useAssemblies();

  // Build invoice settings from profile (fallback)
  const invoiceSettings: InvoiceSettings = useMemo(() => ({
    businessName: profile?.businessName || null,
    businessAddress: profile?.businessAddress || null,
    businessPhone: profile?.businessPhone || null,
    businessEmail: profile?.businessEmail || null,
    businessNumber: profile?.businessNumber || null,
    thankYouNote: profile?.invoiceThankYouNote || null,
    logoUrl: profile?.logoUrl || null,
    layout: profile?.invoiceLayout || null,
  }), [profile]);

  const getSettingsForSale = (sale: Sale): InvoiceSettings => {
    const companyId = (sale as any).companyId;
    const company = companyId ? companies.find(c => c.id === companyId) : null;
    if (company) {
      return {
        businessName: company.name,
        businessAddress: company.address,
        businessPhone: company.phone,
        businessEmail: company.email,
        businessNumber: company.businessNumber,
        logoUrl: company.logoUrl,
        thankYouNote: company.invoiceThankYouNote || invoiceSettings.thankYouNote,
        layout: company.invoiceLayout || invoiceSettings.layout,
      };
    }
    return invoiceSettings;
  };

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [contactPersonName, setContactPersonName] = useState<string>('');
  const [taxRate, setTaxRate] = useState(5);
  const [discountRate, setDiscountRate] = useState(0);
  const [markupPercent, setMarkupPercent] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Due on receipt');
  const [searchQuery, setSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState('');
  const [previewSale, setPreviewSale] = useState<Sale | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [pendingCustomerName, setPendingCustomerName] = useState<string | null>(null);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('history');

  // Default to default company
  const { defaultCompany } = useCompanies();
  useEffect(() => {
    if (defaultCompany && !selectedCompanyId) {
      setSelectedCompanyId(defaultCompany.id);
    }
  }, [defaultCompany]);

  // Auto-select vendor created from customer
  useEffect(() => {
    if (pendingCustomerName) {
      const match = vendors.find(v => v.name === pendingCustomerName);
      if (match) {
        setSelectedVendorId(match.id);
        setPendingCustomerName(null);
      }
    }
  }, [vendors, pendingCustomerName]);

  // Calculate markup price with proper precision (avoid floating-point errors)
  const calculateMarkupPrice = (cost: number, markup: number): number => {
    const costInCents = Math.round(cost * 100);
    const markupAmountInCents = Math.round(costInCents * (markup / 100));
    return (costInCents + markupAmountInCents) / 100;
  };

  // Apply markup to all cart items when markup changes
  useEffect(() => {
    if (markupPercent === '') {
      // Clear custom prices when no markup set (skip excluded items)
      setCart(prev => {
        const needsUpdate = prev.some(c => c.customPrice !== undefined && !c.excludeMarkup);
        if (!needsUpdate) return prev;
        return prev.map(c => c.excludeMarkup ? c : { ...c, customPrice: undefined });
      });
    } else {
      // Apply markup to cost for each item (skip excluded items)
      setCart(prev => {
        if (prev.length === 0) return prev;
        return prev.map(c => c.excludeMarkup ? c : ({
          ...c,
          customPrice: calculateMarkupPrice(c.inventoryItem.cost, markupPercent as number)
        }));
      });
    }
  }, [markupPercent]);

  const handleAddVendor = async () => {
    if (!newVendorName.trim()) return;
    await addVendor({ name: newVendorName.trim(), contact_email: null, contact_phone: null, address: null, notes: null, link: null, color: null });
    setNewVendorName('');
    setShowAddVendor(false);
  };


  const resetForm = () => {
    setCart([]);
    setSelectedVendorId('');
    setCustomInvoiceNumber('');
    setTaxRate(0);
    setDiscountRate(0);
    setMarkupPercent('');
    setNotes('');
    setSelectedCompanyId(defaultCompany?.id || '');
    setContactPersonName('');
    setEditingSaleId(null);
  };

  const handleEditSale = (sale: Sale) => {
    // Build cart from sale items by finding matching inventory items
    const newCart: CartItem[] = sale.items.map((item) => {
      const invItem = inventoryItems.find(i => i.id === item.inventoryItemId);
      const fallbackItem: InventoryItem = {
        id: item.inventoryItemId || `custom-${item.id}`,
        name: item.itemName,
        sku: item.sku,
        price: item.unitPrice,
        cost: item.unitCost,
        quantity: 0,
        quantityUnit: 'pcs',
        category: '',
        minStock: 0,
        weight: 0,
        weightUnit: 'kg',
        dimensions: { length: 0, width: 0, height: 0, unit: 'in' },
        colors: [],
        description: '',
        boxAmount: 0,
        bundleAmount: 0,
        palletAmount: 0,
        pieceLength: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return {
        inventoryItem: invItem || fallbackItem,
        quantity: item.quantity,
        customPrice: item.unitPrice,
        isCustom: !item.inventoryItemId,
      };
    });

    setCart(newCart);
    setSelectedVendorId(sale.vendorId || '');
    setCustomInvoiceNumber(sale.invoiceNumber);
    setTaxRate(sale.taxRate);
    setDiscountRate(sale.discountRate);
    setNotes(sale.notes || '');
    setPaymentTerms(sale.paymentTerms || 'Due on receipt');
    setSelectedCompanyId((sale as any).companyId || defaultCompany?.id || '');
    setContactPersonName(sale.contactPersonName || '');
    setEditingSaleId(sale.id);
    setActiveTab('new-sale');
  };

  // Get the invoice prefix from profile
  const invoicePrefix = profile?.invoicePrefix || 'INV';

  // Calculate the next invoice number from profile settings
  const nextInvoiceNumber = useMemo(() => {
    const prefix = profile?.invoicePrefix || 'INV';
    const nextNum = profile?.invoiceNextNumber || 1;
    return `${prefix}-${String(nextNum).padStart(4, '0')}`;
  }, [profile?.invoicePrefix, profile?.invoiceNextNumber]);

  // Auto-populate invoice number when profile settings change
  useEffect(() => {
    const prefix = profile?.invoicePrefix || 'INV';
    const nextNum = profile?.invoiceNextNumber || 1;
    const newNumber = `${prefix}-${String(nextNum).padStart(4, '0')}`;
    setCustomInvoiceNumber(newNumber);
  }, [profile?.invoicePrefix, profile?.invoiceNextNumber]);

  const filteredItems = useMemo(() => {
    return inventoryItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inventoryItems, searchQuery]);

  const addToCart = (item: InventoryItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.inventoryItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.inventoryItem.id === item.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      // Apply markup if set (use 0% markup as valid)
      const customPrice = markupPercent !== ''
        ? calculateMarkupPrice(item.cost, markupPercent as number)
        : undefined;
      return [...prev, { inventoryItem: item, quantity: 1, customPrice }];
    });
  };

  const addCustomItem = () => {
    const customId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const customInventoryItem: InventoryItem = {
      id: customId,
      name: '',
      sku: '',
      price: 0,
      cost: 0,
      quantity: 0,
      quantityUnit: 'pcs',
      category: '',
      minStock: 0,
      weight: 0,
      weightUnit: 'kg',
      dimensions: { length: 0, width: 0, height: 0, unit: 'in' },
      colors: [],
      description: '',
      boxAmount: 0,
      bundleAmount: 0,
      palletAmount: 0,
      pieceLength: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCart((prev) => [
      ...prev,
      { inventoryItem: customInventoryItem, quantity: 1, customPrice: 0, isCustom: true, excludeMarkup: true },
    ]);
    setShowItemPicker(false);
  };

  const addAssemblyToCart = (assembly: { id: string; name: string; description: string | null; selling_price: number }) => {
    const cartId = `assembly-${assembly.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const assemblyInventoryItem: InventoryItem = {
      id: cartId,
      name: assembly.name,
      sku: 'ASSEMBLY',
      price: assembly.selling_price,
      cost: 0,
      quantity: 0,
      quantityUnit: 'pcs',
      category: '',
      minStock: 0,
      weight: 0,
      weightUnit: 'kg',
      dimensions: { length: 0, width: 0, height: 0, unit: 'in' },
      colors: [],
      description: assembly.description || '',
      boxAmount: 0,
      bundleAmount: 0,
      palletAmount: 0,
      pieceLength: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setCart((prev) => [
      ...prev,
      { inventoryItem: assemblyInventoryItem, quantity: 1, customPrice: assembly.selling_price, isCustom: true, excludeMarkup: true },
    ]);
    setShowItemPicker(false);
  };

  const updateCartQuantity = (itemId: string, quantity: number | null) => {
    setCart((prev) =>
      prev.map((c) =>
        c.inventoryItem.id === itemId
          ? { ...c, quantity }
          : c
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.inventoryItem.id !== itemId));
  };

  // Get price for cart item (custom or default)
  const getItemPrice = (c: CartItem) => c.customPrice ?? c.inventoryItem.price;

  // Bridge cart to PickerCartItem format for the full-screen picker
  const pickerCart: PickerCartItem[] = useMemo(() => cart.map((c) => ({
    id: c.inventoryItem.id,
    inventoryItemId: c.inventoryItem.id,
    itemName: c.inventoryItem.name,
    sku: c.inventoryItem.sku,
    quantity: c.quantity,
    quantityUnit: c.inventoryItem.quantityUnit,
    unitPrice: getItemPrice(c),
    unitCost: c.inventoryItem.cost,
    notes: '',
  })), [cart]);

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, c) => sum + c.quantity * getItemPrice(c), 0),
    [cart]
  );

  const discountAmount = subtotal * (discountRate / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);

    if (editingSaleId) {
      // Update existing sale
      await updateSale(editingSaleId, {
        vendorId: selectedVendorId || null,
        invoiceNumber: customInvoiceNumber.trim() || '',
        items: cart.map((c) => ({
          id: `updated-${c.inventoryItem.id}-${Date.now()}`,
        inventoryItemId: c.isCustom ? null : c.inventoryItem.id,
          itemName: c.inventoryItem.name,
          sku: c.inventoryItem.sku,
          quantity: c.quantity,
          unitPrice: getItemPrice(c),
          unitCost: c.inventoryItem.cost,
        })),
        taxRate,
        discountRate,
        notes: notes || null,
        paymentTerms,
        dueDate: null,
        companyId: selectedCompanyId || null,
        contactPersonName: contactPersonName.trim() || null,
      });
      resetForm();
    } else {
      // Create new sale
      const sale = await createSale({
        vendorId: selectedVendorId || null,
        invoiceNumber: customInvoiceNumber.trim() || null,
        items: cart.map((c) => ({
        inventoryItemId: c.isCustom ? null : c.inventoryItem.id,
          itemName: c.inventoryItem.name,
          sku: c.inventoryItem.sku,
          quantity: c.quantity,
          unitPrice: getItemPrice(c),
          unitCost: c.inventoryItem.cost,
        })),
        taxRate,
        discountRate,
        notes: notes || null,
        paymentTerms,
        dueDate: null,
        companyId: selectedCompanyId || null,
        contactPersonName: contactPersonName.trim() || null,
      });

      if (sale) {
        resetForm();
        setActiveTab('history');
        setPreviewSale(sale);
      }
    }

    setIsProcessing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getMonthKey = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-24 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight text-card-foreground font-sans">
                  Sales
                </h1>
                <p className="text-sm text-muted-foreground font-medium tracking-wide">
                  Create invoices and manage sales
                </p>
              </div>
              
              {/* Next Invoice Number Badge */}
              <div className="ml-4 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                <span className="text-sm font-medium text-primary">
                  Next: {nextInvoiceNumber}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  resetForm();
                  setActiveTab('new-sale');
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Sale
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="new-sale" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              {editingSaleId ? 'Edit Sale' : 'New Sale'}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Receipt className="h-4 w-4" />
              Sales History
              {sales.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-muted-foreground text-background">
                  {sales.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-sale" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Item Selection */}
              <div className="lg:col-span-2 space-y-4">
                {/* Open Full-Screen Item Picker */}
                <Button
                  size="lg"
                  className="w-full h-14 text-base gap-2"
                  onClick={() => setShowItemPicker(true)}
                >
                  <ShoppingBag className="h-5 w-5" />
                  Add Items from Inventory
                </Button>

                {/* Cart */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Cart ({cart.length} items)</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setShowItemPicker(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add More Items
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {cart.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No items in cart. Add items from above.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8"></TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            {markupPercent !== '' && <TableHead>Markup</TableHead>}
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <DndContext collisionDetection={closestCenter} onDragEnd={(event: DragEndEvent) => {
                          const { active, over } = event;
                          if (over && active.id !== over.id) {
                            setCart((items) => {
                              const oldIndex = items.findIndex((i) => i.inventoryItem.id === active.id);
                              const newIndex = items.findIndex((i) => i.inventoryItem.id === over.id);
                              return arrayMove(items, oldIndex, newIndex);
                            });
                          }
                        }}>
                          <SortableContext items={cart.map(c => c.inventoryItem.id)} strategy={verticalListSortingStrategy}>
                            <TableBody>
                              {cart.map((c) => (
                                <SortableSaleRow
                                  key={c.inventoryItem.id}
                                  item={c}
                                  formatCurrency={formatCurrency}
                                  updateCartQuantity={updateCartQuantity}
                                  removeFromCart={removeFromCart}
                                  markupPercent={markupPercent}
                                  calculateMarkupPrice={calculateMarkupPrice}
                                  setCart={setCart}
                                  getItemPrice={getItemPrice}
                                />
                              ))}
                            </TableBody>
                          </SortableContext>
                        </DndContext>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Invoice Number</Label>
                      <div className="flex gap-2">
                        <Input
                          value={customInvoiceNumber.split('-')[0] || invoicePrefix}
                          onChange={(e) => {
                            const prefix = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                            const number = customInvoiceNumber.split('-').slice(1).join('-') || '';
                            setCustomInvoiceNumber(number ? `${prefix}-${number}` : prefix);
                          }}
                          placeholder="Prefix"
                          className="w-24"
                        />
                        <span className="flex items-center text-muted-foreground">-</span>
                        <Input
                          value={customInvoiceNumber.split('-').slice(1).join('-') || ''}
                          onChange={(e) => {
                            const prefix = customInvoiceNumber.split('-')[0] || invoicePrefix;
                            const number = e.target.value.replace(/[^0-9]/g, '');
                            setCustomInvoiceNumber(`${prefix}-${number}`);
                          }}
                          placeholder="0001"
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Prefix can be changed in Settings → Invoice tab
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Vendor / Customer</Label>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="flex-1 justify-between font-normal">
                              {(() => {
                                if (!selectedVendorId) return 'Search vendor or customer...';
                                const v = vendors.find(v => v.id === selectedVendorId);
                                if (!v) return 'Select...';
                                const matchingCustomer = customers.find(c => c.name === v.name);
                                if (matchingCustomer?.company) {
                                  return `${matchingCustomer.company} — ${matchingCustomer.name}`;
                                }
                                return v.name;
                              })()}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search..." />
                              <CommandList>
                                <CommandEmpty>No results found.</CommandEmpty>
                                {vendors.length > 0 && (
                                  <CommandGroup heading="Vendors">
                                    {vendors.map((vendor) => (
                                      <CommandItem
                                        key={vendor.id}
                                        value={vendor.name}
                                        onSelect={() => setSelectedVendorId(vendor.id)}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", selectedVendorId === vendor.id ? "opacity-100" : "opacity-0")} />
                                        {vendor.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                )}
                                {customers.length > 0 && (
                                  <CommandGroup heading="Customers">
                                    {customers.map((customer) => (
                                      <CommandItem
                                        key={`customer:${customer.id}`}
                                        value={`${customer.name} ${customer.company || ''}`}
                                        onSelect={() => {
                                          const existingVendor = vendors.find(v => v.name === customer.name);
                                          if (existingVendor) {
                                            setSelectedVendorId(existingVendor.id);
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
                                        }}
                                      >
                                        <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                                        {customer.name}{customer.company ? ` (${customer.company})` : ''}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setShowAddVendor(true)}
                          title="Add new vendor"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {showAddVendor && (
                        <div className="border rounded-md p-3 space-y-3 bg-muted/30">
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                              value={newVendorName}
                              onChange={(e) => setNewVendorName(e.target.value)}
                              placeholder="Enter name"
                              autoFocus
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleAddVendor}
                              disabled={!newVendorName.trim()}
                            >
                              Add
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setShowAddVendor(false); setNewVendorName(''); }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Contact Person <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input
                        value={contactPersonName}
                        onChange={(e) => setContactPersonName(e.target.value)}
                        placeholder="Person name..."
                      />
                    </div>

                    <CompanySelector
                      companies={companies}
                      value={selectedCompanyId}
                      onChange={setSelectedCompanyId}
                    />

                    <div className="space-y-2">
                      <Label>Markup %</Label>
                      <Input
                        type="number"
                        value={markupPercent}
                        onChange={(e) =>
                          setMarkupPercent(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
                        }
                        placeholder="Leave blank for default pricing"
                        min={0}
                      />
                      <p className="text-xs text-muted-foreground">
                        Applied to item cost. Leave blank to use inventory price.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tax Rate (%)</Label>
                        <Input
                          type="number"
                          value={taxRate}
                          onChange={(e) =>
                            setTaxRate(parseFloat(e.target.value) || 0)
                          }
                          min={0}
                          max={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount (%)</Label>
                        <Input
                          type="number"
                          value={discountRate}
                          onChange={(e) =>
                            setDiscountRate(parseFloat(e.target.value) || 0)
                          }
                          min={0}
                          max={100}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Payment Terms</Label>
                      <Select
                        value={paymentTerms}
                        onValueChange={setPaymentTerms}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Due on receipt">
                            Due on receipt
                          </SelectItem>
                          <SelectItem value="Net 15">Net 15</SelectItem>
                          <SelectItem value="Net 30">Net 30</SelectItem>
                          <SelectItem value="Net 60">Net 60</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        placeholder="Additional notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
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
                        <span className="text-muted-foreground">
                          Tax ({taxRate}%)
                        </span>
                        <span>{formatCurrency(taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                    <Button
                      className="w-full mt-4"
                      size="lg"
                      disabled={cart.length === 0 || isProcessing}
                      onClick={handleCompleteSale}
                    >
                      {isProcessing ? 'Processing...' : editingSaleId ? 'Save Changes' : 'Complete Sale'}
                    </Button>
                    {editingSaleId && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={resetForm}
                      >
                        Cancel Edit
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {/* Search bar for sales history */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number, customer, or item..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Loading sales...</div>
              </div>
            ) : sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold">No sales yet</h2>
                <p className="text-muted-foreground">
                  Complete your first sale to see it here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sales List grouped by month */}
                <Accordion type="multiple" className="w-full space-y-2">
                    {(() => {
                      // Filter sales based on search query
                      const filteredSales = historySearchQuery
                        ? sales.filter((sale) => {
                            const query = historySearchQuery.toLowerCase();
                            const matchesInvoice = sale.invoiceNumber.toLowerCase().includes(query);
                            const matchesVendor = sale.vendorId && vendors.find(v => v.id === sale.vendorId)?.name.toLowerCase().includes(query);
                            const matchesItems = sale.items.some(
                              (item) =>
                                item.itemName.toLowerCase().includes(query) ||
                                item.sku.toLowerCase().includes(query)
                            );
                            return matchesInvoice || matchesVendor || matchesItems;
                          })
                        : sales;

                      // Group sales by month
                      const salesByMonth = filteredSales.reduce((acc, sale) => {
                        const monthKey = getMonthKey(sale.createdAt);
                        if (!acc[monthKey]) {
                          acc[monthKey] = [];
                        }
                        acc[monthKey].push(sale);
                        return acc;
                      }, {} as Record<string, typeof sales>);

                      // Sort months in descending order (most recent first)
                      const sortedMonths = Object.keys(salesByMonth).sort((a, b) => {
                        const [aMonth, aYear] = a.split(' ');
                        const [bMonth, bYear] = b.split(' ');
                        const aDate = new Date(`${aMonth} 1, ${aYear}`);
                        const bDate = new Date(`${bMonth} 1, ${bYear}`);
                        return bDate.getTime() - aDate.getTime();
                      });

                      return sortedMonths.map((monthKey) => {
                        const monthSales = salesByMonth[monthKey];
                        const monthTotal = monthSales.reduce((sum, s) => sum + s.total, 0);
                        const monthProfit = monthSales.reduce((sum, s) => {
                          const cost = s.items.reduce((itemSum, item) => itemSum + (item.unitCost * item.quantity), 0);
                          return sum + (s.total - cost);
                        }, 0);

                        return (
                          <AccordionItem key={monthKey} value={monthKey} className="border rounded-lg px-4">
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center justify-between w-full pr-4">
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold">{monthKey}</span>
                                  <Badge variant="secondary">{monthSales.length} {monthSales.length === 1 ? 'sale' : 'sales'}</Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground">
                                    Revenue: <span className="font-medium text-foreground">{formatCurrency(monthTotal)}</span>
                                  </span>
                                  <span className="text-muted-foreground">
                                    Profit: <span className="font-medium text-success">{formatCurrency(monthProfit)}</span>
                                  </span>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-3 pt-2">
                              {monthSales.map((sale) => (
                                <SaleCard
                                  key={sale.id}
                                  sale={sale}
                                  onDelete={deleteSale}
                                  onRevert={revertSale}
                                  onDownloadInvoice={() => generateInvoicePDF(sale, getSettingsForSale(sale))}
                                  onPreviewInvoice={() => setPreviewSale(sale)}
                                onEdit={handleEditSale}
                                  onStatusChange={(id, status) => updateStatus(id, status, addSaleRevenue)}
                                  onTogglePickedUp={togglePickedUp}
                                />
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      });
                    })()}
                  </Accordion>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {previewSale && (
        <InvoicePreviewDialog
          open={!!previewSale}
          onOpenChange={(open) => !open && setPreviewSale(null)}
          sale={previewSale}
          settings={getSettingsForSale(previewSale)}
          onDownload={() => {
            generateInvoicePDF(previewSale, getSettingsForSale(previewSale));
            setPreviewSale(null);
          }}
        />
      )}

      {/* Full-Screen Item Picker */}
      <FullScreenItemPicker
        open={showItemPicker}
        onClose={() => setShowItemPicker(false)}
        inventoryItems={inventoryItems}
        cart={pickerCart}
        onAddItem={addToCart}
        onAddCustomItem={addCustomItem}
        onAddAssembly={addAssemblyToCart}
        assemblies={assemblies}
        onUpdateQuantity={(itemId, qty) => updateCartQuantity(itemId, qty)}
        onRemoveItem={removeFromCart}
        documentType="Invoice"
        formatPrice={formatCurrency}
      />
    </div>
  );
}
