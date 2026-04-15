import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  LogOut,
  ArrowLeft,
  FileText,
  Trash2,
  Minus,
  Receipt,
  Search,
  Layers,
  EyeOff,
  ShoppingBag,
  ChevronsUpDown,
  Check,
  GripVertical,
  CalendarIcon,
} from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useQuotes } from '@/hooks/useQuotes';
import { useInventory } from '@/hooks/useInventory';
import { useVendors } from '@/hooks/useVendors';
import { useCustomers } from '@/hooks/useCustomers';
import { useProfile } from '@/hooks/useProfile';
import { useSales } from '@/hooks/useSales';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { Link } from 'react-router-dom';
import { addDays, format } from 'date-fns';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { QuoteCard } from '@/components/QuoteCard';

import { QuotePreviewDialog } from '@/components/QuotePreviewDialog';
import { generateQuotePDF } from '@/lib/quoteGenerator';

import { InventoryItem, QuantityUnit, QUANTITY_UNIT_LABELS } from '@/types/inventory';
import { QuoteSettings, Quote } from '@/types/quote';

interface CartItem {
  id: string; // unique ID for cart item (inventory item ID or generated for custom)
  inventoryItemId: string | null;
  itemName: string;
  sku: string;
  quantity: number | null;
  quantityUnit: QuantityUnit;
  unitPrice: number;
  unitCost: number;
  notes: string;
  excludeMarkup?: boolean;
}

import { useCompanies } from '@/hooks/useCompanies';

function SortableQuoteItem({ item: c, formatCurrency, updateCartItem, updateCartQuantity, removeFromCart, inventoryItems, markupPercent, calculateMarkupPrice, discountRate }: {
  item: CartItem;
  formatCurrency: (v: number) => string;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  updateCartQuantity: (id: string, qty: number | null) => void;
  removeFromCart: (id: string) => void;
  inventoryItems: InventoryItem[];
  markupPercent: number | '';
  calculateMarkupPrice: (cost: number, markup: number) => number;
  discountRate: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: c.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const lineTotal = (c.quantity || 0) * c.unitPrice;
  const itemDiscount = lineTotal * (discountRate / 100);
  const afterDiscount = lineTotal - itemDiscount;

  return (
    <div ref={setNodeRef} style={style} className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <button type="button" className="mt-1 cursor-grab touch-none text-muted-foreground hover:text-foreground" {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="flex-1 space-y-3">
          {/* Item Name and SKU */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Item Name</Label>
              {c.inventoryItemId ? (
                <p className="font-medium">{c.itemName}</p>
              ) : (
                <Input
                  placeholder="Enter item name"
                  value={c.itemName}
                  onChange={(e) => updateCartItem(c.id, { itemName: e.target.value })}
                />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">SKU</Label>
              {c.inventoryItemId ? (
                <Badge variant="secondary">{c.sku}</Badge>
              ) : (
                <Input
                  placeholder="SKU"
                  value={c.sku}
                  onChange={(e) => updateCartItem(c.id, { sku: e.target.value })}
                />
              )}
            </div>
          </div>

          {/* Quantity, Unit, and Price */}
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Quantity</Label>
              <Input
                type="number"
                className="h-8"
                placeholder="Qty"
                value={c.quantity ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  updateCartQuantity(c.id, val === '' ? null : parseFloat(val));
                }}
                min={0}
                step={0.01}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Unit</Label>
              <Select
                value={c.quantityUnit}
                onValueChange={(v) => updateCartItem(c.id, { quantityUnit: v as QuantityUnit })}
              >
                <SelectTrigger className="h-8">
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
              {c.inventoryItemId ? (
                <p className="font-medium h-8 flex items-center">{formatCurrency(c.unitPrice)}</p>
              ) : (
                <Input
                  type="number"
                  className="h-8"
                  value={c.unitPrice}
                  onChange={(e) => updateCartItem(c.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                  min={0}
                  step={0.01}
                />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Total</Label>
              <div className="h-8 flex items-center gap-2">
                {discountRate > 0 ? (
                  <>
                    <p className="font-bold">{formatCurrency(afterDiscount)}</p>
                    <p className="text-sm text-muted-foreground line-through">{formatCurrency(lineTotal)}</p>
                  </>
                ) : (
                  <p className="font-bold">{formatCurrency(lineTotal)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Exclude from Markup toggle */}
          {c.inventoryItemId && markupPercent !== '' && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={c.excludeMarkup ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  const newExclude = !c.excludeMarkup;
                  const item = inventoryItems.find(i => i.id === c.inventoryItemId);
                  if (!item) return;
                  const newPrice = newExclude ? item.price : calculateMarkupPrice(item.cost, markupPercent as number);
                  updateCartItem(c.id, { excludeMarkup: newExclude, unitPrice: newPrice });
                }}
              >
                {c.excludeMarkup ? 'Markup Excluded' : 'Exclude from Markup'}
              </Button>
            </div>
          )}

          {/* Per-Item Notes */}
          <div className="space-y-1">
            <Label className="text-xs">Item Notes</Label>
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[60px] resize-y"
              placeholder="Add notes for this item..."
              value={c.notes}
              onChange={(e) => updateCartItem(c.id, { notes: e.target.value })}
            />
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="text-destructive shrink-0"
          onClick={() => removeFromCart(c.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
import { CompanySelector } from '@/components/CompanySelector';
import { useAssemblies } from '@/hooks/useAssemblies';
import { FullScreenItemPicker } from '@/components/FullScreenItemPicker';

export function Quotes() {
  const { signOut } = useAuth();
  const { quotes, loading, createQuote, updateQuote, deleteQuote, updateQuoteStatus, uploadAttachment, removeAttachment, convertToInvoice, convertToPurchaseOrder, revertInvoiceLink } = useQuotes();
  const { allItems: inventoryItems } = useInventory();
  const { vendors, addVendor } = useVendors();
  const { customers } = useCustomers();
  const { profile } = useProfile();
  const { sales } = useSales();
  const { orders: purchaseOrders } = usePurchaseOrders();
  const { companies } = useCompanies();
  const { assemblies } = useAssemblies();

  // Build lookup maps for linked documents
  const invoiceNumberMap = useMemo(() => {
    const map = new Map<string, string>();
    sales.forEach((sale) => {
      map.set(sale.id, sale.invoiceNumber);
    });
    return map;
  }, [sales]);

  const poNumberMap = useMemo(() => {
    const map = new Map<string, string>();
    purchaseOrders.forEach((po) => {
      if (po.poNumber) {
        map.set(po.id, po.poNumber);
      }
    });
    return map;
  }, [purchaseOrders]);

  // Build quote settings from profile (fallback)
  const quoteSettings: QuoteSettings = useMemo(() => ({
    businessName: profile?.businessName || null,
    businessAddress: profile?.businessAddress || null,
    businessPhone: profile?.businessPhone || null,
    businessEmail: profile?.businessEmail || null,
    businessNumber: profile?.businessNumber || null,
    thankYouNote: profile?.quoteThankYouNote || 'Thank you for considering our services!',
    logoUrl: profile?.logoUrl || null,
    layout: profile?.quoteLayout || profile?.invoiceLayout || null,
    validityDays: profile?.quoteValidityDays || null,
  }), [profile]);

  const getQuoteSettingsForQuote = (quote: Quote): QuoteSettings => {
    const companyId = (quote as any).companyId;
    const company = companyId ? companies.find(c => c.id === companyId) : null;
    if (company) {
      return {
        businessName: company.name,
        businessAddress: company.address,
        businessPhone: company.phone,
        businessEmail: company.email,
        businessNumber: company.businessNumber,
        logoUrl: company.logoUrl,
        thankYouNote: company.quoteThankYouNote || quoteSettings.thankYouNote,
        layout: company.quoteLayout || quoteSettings.layout,
        validityDays: company.quoteValidityDays || quoteSettings.validityDays,
      };
    }
    return quoteSettings;
  };

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [contactPersonName, setContactPersonName] = useState<string>('');
  const [pendingCustomerName, setPendingCustomerName] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState<number | null>(5);
  const [discountRate, setDiscountRate] = useState<number | null>(null);
  const [markupPercent, setMarkupPercent] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Due on receipt');
  const [showPaymentTerms, setShowPaymentTerms] = useState(true);
  const [quoteDate, setQuoteDate] = useState<Date | undefined>(undefined);

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

  const calculateMarkupPrice = (cost: number, markup: number): number => {
    const costInCents = Math.round(cost * 100);
    const markupAmountInCents = Math.round(costInCents * (markup / 100));
    return (costInCents + markupAmountInCents) / 100;
  };

  // Apply markup to all cart items when markup changes
  useEffect(() => {
    if (markupPercent === '') {
      // Revert to original prices (skip excluded items)
      setCart(prev => {
        return prev.map(c => {
          if (!c.inventoryItemId || c.excludeMarkup) return c;
          const item = inventoryItems.find(i => i.id === c.inventoryItemId);
          return item ? { ...c, unitPrice: item.price } : c;
        });
      });
    } else {
      setCart(prev => {
        if (prev.length === 0) return prev;
        return prev.map(c => {
          if (!c.inventoryItemId || c.excludeMarkup) return c;
          const item = inventoryItems.find(i => i.id === c.inventoryItemId);
          return item ? { ...c, unitPrice: calculateMarkupPrice(item.cost, markupPercent as number) } : c;
        });
      });
    }
  }, [markupPercent]);
  const [searchQuery, setSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customQuoteNumber, setCustomQuoteNumber] = useState('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [validUntilInitialized, setValidUntilInitialized] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
   const [showAssemblyPicker, setShowAssemblyPicker] = useState(false);
  const [hidePrices, setHidePrices] = useState(false);
  const [showSku, setShowSku] = useState(true);
  const [activeTab, setActiveTab] = useState('new-quote');
  const [showItemPicker, setShowItemPicker] = useState(false);

  const { defaultCompany } = useCompanies();
  useEffect(() => {
    if (defaultCompany && !selectedCompanyId) {
      setSelectedCompanyId(defaultCompany.id);
    }
  }, [defaultCompany]);

  const handleEditQuote = (quote: Quote) => {
    setCart(quote.items.map(item => ({
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
    setSelectedVendorId(quote.vendorId || '');
    setContactPersonName(quote.contactPersonName || '');
    setCustomQuoteNumber(quote.quoteNumber);
    setTaxRate(quote.taxRate || null);
    setDiscountRate(quote.discountRate || null);
    setMarkupPercent('');
    setNotes(quote.notes || '');
    setPaymentTerms(quote.paymentTerms || 'Due on receipt');
    setShowPaymentTerms(quote.showPaymentTerms !== false);
    setQuoteDate(new Date(quote.createdAt));
    setValidUntil(quote.validUntil ? format(new Date(quote.validUntil), 'yyyy-MM-dd') : '');
    setSelectedCompanyId((quote as any).companyId || defaultCompany?.id || '');
    setHidePrices(quote.hidePrices || false);
    setShowSku(quote.showSku !== false);
    setEditingQuoteId(quote.id);
    setActiveTab('new-quote');
  };

  const resetForm = () => {
    setCart([]);
    setSelectedVendorId('');
    setContactPersonName('');
    setCustomQuoteNumber('');
    setTaxRate(null);
    setDiscountRate(null);
    setMarkupPercent('');
    setNotes('');
    setHidePrices(false);
    setShowSku(true);
    setQuoteDate(undefined);
    setSelectedCompanyId(defaultCompany?.id || '');
    setEditingQuoteId(null);
    setValidUntilInitialized(false);
    if (quoteSettings.validityDays) {
      const defaultDate = addDays(new Date(), quoteSettings.validityDays);
      setValidUntil(format(defaultDate, 'yyyy-MM-dd'));
      setValidUntilInitialized(true);
    } else {
      setValidUntil('');
    }
  };

  // Calculate the next quote number
  const nextQuoteNumber = useMemo(() => {
    const maxNum = quotes.reduce((max, quote) => {
      const match = quote.quoteNumber.match(/^QUO-(\d+)$/);
      if (match) {
        return Math.max(max, parseInt(match[1], 10));
      }
      return max;
    }, 0);
    return `QUO-${String(maxNum + 1).padStart(4, '0')}`;
  }, [quotes]);

  // Auto-populate quote number when quotes load
  useEffect(() => {
    if (!customQuoteNumber || customQuoteNumber.match(/^QUO-\d+$/)) {
      setCustomQuoteNumber(nextQuoteNumber);
    }
  }, [nextQuoteNumber]);

  // Set default validity date only on initial load
  useEffect(() => {
    if (!validUntilInitialized && quoteSettings.validityDays) {
      const defaultDate = addDays(new Date(), quoteSettings.validityDays);
      setValidUntil(format(defaultDate, 'yyyy-MM-dd'));
      setValidUntilInitialized(true);
    }
  }, [quoteSettings.validityDays, validUntilInitialized]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return inventoryItems;
    const tokens = searchQuery.toLowerCase().split(/\s+/).filter(Boolean);
    return inventoryItems.filter((item) => {
      const haystack = `${item.name} ${item.sku}`.toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [inventoryItems, searchQuery]);

  const addToCart = (item: InventoryItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.inventoryItemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.inventoryItemId === item.id
            ? { ...c, quantity: (c.quantity || 0) + 1 }
            : c
        );
      }
      return [...prev, {
        id: item.id,
        inventoryItemId: item.id,
        itemName: item.name,
        sku: item.sku,
        quantity: null,
        quantityUnit: item.quantityUnit,
        unitPrice: markupPercent !== '' ? calculateMarkupPrice(item.cost, markupPercent as number) : item.price,
        unitCost: item.cost,
        notes: '',
      }];
    });
  };

  const addCustomItem = () => {
    const customId = `custom-${Date.now()}`;
    setCart((prev) => [...prev, {
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

  const addAssemblyToCart = (assembly: { id: string; name: string; description: string | null; selling_price: number }) => {
    const cartId = `assembly-${assembly.id}-${Date.now()}`;
    setCart((prev) => [...prev, {
      id: cartId,
      inventoryItemId: null,
      itemName: assembly.name,
      sku: 'ASSEMBLY',
      quantity: 1,
      quantityUnit: 'pcs' as QuantityUnit,
      unitPrice: assembly.selling_price,
      unitCost: 0,
      notes: assembly.description || '',
    }]);
    setShowAssemblyPicker(false);
  };

  const updateCartItem = (itemId: string, updates: Partial<CartItem>) => {
    setCart((prev) =>
      prev.map((c) =>
        c.id === itemId
          ? { ...c, ...updates }
          : c
      )
    );
  };

  const updateCartQuantity = (itemId: string, quantity: number | null) => {
    updateCartItem(itemId, { quantity });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.id !== itemId));
  };

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, c) => sum + (c.quantity || 0) * c.unitPrice, 0),
    [cart]
  );

  const effectiveDiscountRate = discountRate ?? 0;
  const effectiveTaxRate = taxRate ?? 0;
  const discountAmount = subtotal * (effectiveDiscountRate / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (effectiveTaxRate / 100);
  const total = afterDiscount + taxAmount;

  const handleSubmitQuote = async () => {
    if (cart.length === 0) return;

    const invalidItems = cart.filter((c) => !c.itemName.trim());
    if (invalidItems.length > 0) return;

    setIsProcessing(true);

    const itemsData = cart.map((c) => ({
        id: c.id,
        inventoryItemId: c.inventoryItemId,
        itemName: c.itemName,
        sku: c.sku || 'CUSTOM',
        quantity: c.quantity ?? 0,
        quantityUnit: c.quantityUnit,
        unitPrice: c.unitPrice,
        unitCost: c.unitCost,
        notes: c.notes || null,
      }));

    const quoteData = {
      vendorId: selectedVendorId || null,
      contactPersonName: contactPersonName.trim() || null,
      quoteNumber: customQuoteNumber.trim() || null,
      items: itemsData,
      taxRate: effectiveTaxRate,
      discountRate: effectiveDiscountRate,
      notes: notes || null,
      paymentTerms,
      validUntil: validUntil ? new Date(validUntil).toISOString() : null,
      companyId: selectedCompanyId || null,
      hidePrices,
      showPaymentTerms,
      showSku,
      createdAt: quoteDate ? quoteDate.toISOString() : null,
    };

    let success = false;
    if (editingQuoteId) {
      await updateQuote(editingQuoteId, quoteData);
      success = true;
    } else {
      const quote = await createQuote(quoteData);
      success = !!quote;
    }

    if (success) {
      resetForm();
      setActiveTab('history');
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

  // Filter and group quotes by month
  const filteredQuotes = useMemo(() => {
    if (!historySearchQuery) return quotes;
    const query = historySearchQuery.toLowerCase();
    return quotes.filter(
      (quote) =>
        quote.quoteNumber.toLowerCase().includes(query) ||
        quote.vendorName?.toLowerCase().includes(query) ||
        quote.items.some((item) =>
          item.itemName.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query)
        )
    );
  }, [quotes, historySearchQuery]);

  const groupedQuotes = useMemo(() => {
    const groups: Record<string, typeof quotes> = {};
    filteredQuotes.forEach((quote) => {
      const key = getMonthKey(quote.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(quote);
    });
    return groups;
  }, [filteredQuotes]);

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
                  Quotes
                </h1>
                <p className="text-sm text-muted-foreground font-medium tracking-wide">
                  Create and manage quotes
                </p>
              </div>
              
              {/* Next Quote Number Badge */}
              <div className="ml-4 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                <span className="text-sm font-medium text-primary">
                  Next: {nextQuoteNumber}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={signOut}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="new-quote" className="gap-2">
              <FileText className="h-4 w-4" />
              {editingQuoteId ? 'Edit Quote' : 'New Quote'}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Receipt className="h-4 w-4" />
              Quote History
              {quotes.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-muted-foreground text-background">
                  {quotes.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-quote" className="space-y-6">
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
                    <div>
                      <CardTitle>Quote Items ({cart.length} items)</CardTitle>
                      <CardDescription>Items added to this quote</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowItemPicker(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add More Items
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {cart.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No items in quote. Add items from above or create custom items.
                      </p>
                    ) : (
                      <DndContext collisionDetection={closestCenter} onDragEnd={(event: DragEndEvent) => {
                        const { active, over } = event;
                        if (over && active.id !== over.id) {
                          setCart((items) => {
                            const oldIndex = items.findIndex((i) => i.id === active.id);
                            const newIndex = items.findIndex((i) => i.id === over.id);
                            return arrayMove(items, oldIndex, newIndex);
                          });
                        }
                      }}>
                        <SortableContext items={cart.map(c => c.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-4">
                            {cart.map((c) => (
                              <SortableQuoteItem
                                key={c.id}
                                item={c}
                                formatCurrency={formatCurrency}
                                updateCartItem={updateCartItem}
                                updateCartQuantity={updateCartQuantity}
                                removeFromCart={removeFromCart}
                                inventoryItems={inventoryItems}
                                markupPercent={markupPercent}
                                calculateMarkupPrice={calculateMarkupPrice}
                                discountRate={effectiveDiscountRate}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quote Summary */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Quote Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Quote Number <span className="text-primary/70 font-normal">(optional)</span></Label>
                      <Input
                        placeholder="Auto-generated if left empty"
                        value={customQuoteNumber}
                        onChange={(e) => setCustomQuoteNumber(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank for auto-generated number (QUO-0001, QUO-0002, etc.)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Vendor / Customer</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                            {selectedVendorId
                              ? vendors.find(v => v.id === selectedVendorId)?.name || 'Select...'
                              : 'Search vendor or customer...'}
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
                    </div>

                    <div className="space-y-2">
                      <Label>Contact Person <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input
                        value={contactPersonName}
                        onChange={(e) => setContactPersonName(e.target.value)}
                        placeholder="Person name..."
                      />
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
                      <Label>Markup %</Label>
                      <Input
                        type="number"
                        value={markupPercent}
                        onChange={(e) =>
                          setMarkupPercent(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
                        }
                        placeholder="Leave blank for default pricing"
                        min={0}
                        step={0.1}
                      />
                      <p className="text-xs text-muted-foreground">
                        Applies markup on item cost to calculate unit price
                      </p>
                    </div>

                    <CompanySelector
                      companies={companies}
                      value={selectedCompanyId}
                      onChange={setSelectedCompanyId}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tax Rate (%)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={taxRate ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTaxRate(val === '' ? null : parseFloat(val));
                          }}
                          min={0}
                          step={0.1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount (%)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={discountRate ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDiscountRate(val === '' ? null : parseFloat(val));
                          }}
                          min={0}
                          step={0.1}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Payment Terms</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="showPaymentTerms"
                            checked={showPaymentTerms}
                            onCheckedChange={(checked) => setShowPaymentTerms(checked === true)}
                          />
                          <Label htmlFor="showPaymentTerms" className="text-sm font-normal cursor-pointer">
                            Show on quote
                          </Label>
                        </div>
                      </div>
                      <Select
                        value={paymentTerms}
                        onValueChange={setPaymentTerms}
                        disabled={!showPaymentTerms}
                      >
                        <SelectTrigger className={!showPaymentTerms ? 'opacity-50' : ''}>
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
                      <Label>Quote Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !quoteDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {quoteDate ? format(quoteDate, 'PPP') : <span>Today (default)</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={quoteDate}
                            onSelect={setQuoteDate}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hidePrices"
                        checked={hidePrices}
                        onCheckedChange={(checked) => setHidePrices(checked === true)}
                      />
                      <Label htmlFor="hidePrices" className="text-sm font-normal cursor-pointer">
                        Hide prices on quote
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showSku"
                        checked={showSku}
                        onCheckedChange={(checked) => setShowSku(checked === true)}
                      />
                      <Label htmlFor="showSku" className="text-sm font-normal cursor-pointer">
                        Show SKU on quote
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        placeholder="Add any notes..."
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
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {effectiveDiscountRate > 0 && (
                      <div className="flex justify-between text-sm text-destructive">
                        <span>Discount ({effectiveDiscountRate}%)</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    {effectiveTaxRate > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Tax ({effectiveTaxRate}%)
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
                      onClick={handleSubmitQuote}
                    >
                      {isProcessing ? (editingQuoteId ? 'Saving...' : 'Creating...') : (editingQuoteId ? 'Save Changes' : 'Create Quote')}
                    </Button>
                    {editingQuoteId && (
                      <Button
                        className="w-full"
                        variant="outline"
                        size="lg"
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

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quote History</CardTitle>
                    <CardDescription>
                      View and manage your quotes
                    </CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search quotes..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">
                    Loading quotes...
                  </p>
                ) : filteredQuotes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No quotes found
                  </p>
                ) : (
                  <Accordion type="multiple" className="space-y-4">
                    {Object.entries(groupedQuotes).map(([month, monthQuotes]) => (
                      <AccordionItem key={month} value={month} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{month}</span>
                            <Badge variant="secondary">{monthQuotes.length}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pt-2">
                            {monthQuotes.map((quote) => (
                              <QuoteCard
                                key={quote.id}
                                quote={quote}
                                onDelete={deleteQuote}
                                onUpdateStatus={updateQuoteStatus}
                                onUploadAttachment={uploadAttachment}
                                onRemoveAttachment={removeAttachment}
                                onEdit={handleEditQuote}
                                onConvertToInvoice={(quote, percentage) => convertToInvoice(quote, percentage)}
                                onConvertToPurchaseOrder={convertToPurchaseOrder}
                                onRevertInvoiceLink={revertInvoiceLink}
                                onPreview={setPreviewQuote}
                                quoteSettings={getQuoteSettingsForQuote(quote)}
                                linkedInvoiceNumber={quote.convertedToInvoiceId ? invoiceNumberMap.get(quote.convertedToInvoiceId) : null}
                                linkedPoNumber={quote.convertedToPoId ? poNumberMap.get(quote.convertedToPoId) : null}
                              />
                            ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>


      {previewQuote && (
        <QuotePreviewDialog
          open={!!previewQuote}
          onOpenChange={(open) => !open && setPreviewQuote(null)}
          quote={previewQuote}
          settings={getQuoteSettingsForQuote(previewQuote)}
          onDownload={() => {
            generateQuotePDF(previewQuote, getQuoteSettingsForQuote(previewQuote));
          }}
        />
      )}

      {/* Full-Screen Item Picker */}
      <FullScreenItemPicker
        open={showItemPicker}
        onClose={() => setShowItemPicker(false)}
        inventoryItems={inventoryItems}
        cart={cart}
        onAddItem={addToCart}
        onAddCustomItem={addCustomItem}
        onAddAssembly={addAssemblyToCart}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onUpdateItem={updateCartItem}
        assemblies={assemblies}
        documentType="Quote"
        formatPrice={formatCurrency}
      />
    </div>
  );
}
