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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useQuotes } from '@/hooks/useQuotes';
import { useInventory } from '@/hooks/useInventory';
import { useVendors } from '@/hooks/useVendors';
import { useProfile } from '@/hooks/useProfile';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { QuoteCard } from '@/components/QuoteCard';
import { EditQuoteDialog } from '@/components/EditQuoteDialog';

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
}

export function Quotes() {
  const { signOut } = useAuth();
  const { quotes, loading, createQuote, updateQuote, deleteQuote, updateQuoteStatus, uploadAttachment, removeAttachment, convertToInvoice, convertToPurchaseOrder } = useQuotes();
  const { allItems: inventoryItems } = useInventory();
  const { vendors } = useVendors();
  const { profile } = useProfile();

  // Build quote settings from profile
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

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [taxRate, setTaxRate] = useState<number | null>(null);
  const [discountRate, setDiscountRate] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Due on receipt');
  const [searchQuery, setSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customQuoteNumber, setCustomQuoteNumber] = useState('');
  const [validUntil, setValidUntil] = useState<string>('');
  const [validUntilInitialized, setValidUntilInitialized] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  const handleSaveQuote = async (quoteId: string, data: any) => {
    await updateQuote(quoteId, data);
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
    return inventoryItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
        unitPrice: item.price,
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

  const handleCreateQuote = async () => {
    if (cart.length === 0) return;

    // Validate custom items have names
    const invalidItems = cart.filter((c) => !c.itemName.trim());
    if (invalidItems.length > 0) {
      return;
    }

    setIsProcessing(true);

    const quote = await createQuote({
      vendorId: selectedVendorId || null,
      quoteNumber: customQuoteNumber.trim() || null,
      items: cart.map((c) => ({
        inventoryItemId: c.inventoryItemId,
        itemName: c.itemName,
        sku: c.sku || 'CUSTOM',
        quantity: c.quantity ?? 0,
        quantityUnit: c.quantityUnit,
        unitPrice: c.unitPrice,
        unitCost: c.unitCost,
        notes: c.notes || null,
      })),
      taxRate: effectiveTaxRate,
      discountRate: effectiveDiscountRate,
      notes: notes || null,
      paymentTerms,
      validUntil: validUntil ? new Date(validUntil).toISOString() : null,
    });

    if (quote) {
      setCart([]);
      setSelectedVendorId('');
      setCustomQuoteNumber('');
      setTaxRate(null);
      setDiscountRate(null);
      setNotes('');
      setValidUntilInitialized(false);
      if (quoteSettings.validityDays) {
        const defaultDate = addDays(new Date(), quoteSettings.validityDays);
        setValidUntil(format(defaultDate, 'yyyy-MM-dd'));
        setValidUntilInitialized(true);
      } else {
        setValidUntil('');
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
        <Tabs defaultValue="new-quote" className="space-y-6">
          <TabsList>
            <TabsTrigger value="new-quote" className="gap-2">
              <FileText className="h-4 w-4" />
              New Quote
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
                <Card>
                  <CardHeader>
                    <CardTitle>Select Items</CardTitle>
                    <CardDescription>
                      Search and add items from your inventory
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Search by name or SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="max-h-64 overflow-y-auto border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItems.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-muted-foreground"
                              >
                                No items found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                  {item.name}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{item.sku}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.quantity}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(item.price)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => addToCart(item)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Cart */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Quote Items ({cart.length} items)</CardTitle>
                      <CardDescription>Add items from inventory or create custom items</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={addCustomItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Custom Item
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {cart.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No items in quote. Add items from above or create custom items.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {cart.map((c) => (
                          <div key={c.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
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
                                        placeholder="SKU (optional)"
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
                                    <p className="font-bold h-8 flex items-center">{formatCurrency((c.quantity || 0) * c.unitPrice)}</p>
                                  </div>
                                </div>

                                {/* Per-Item Notes */}
                                <div className="space-y-1">
                                  <Label className="text-xs">Item Notes</Label>
                                  <Input
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
                        ))}
                      </div>
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
                      <Label>Quote Number (optional)</Label>
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
                      <Label>Customer</Label>
                      <Select
                        value={selectedVendorId}
                        onValueChange={setSelectedVendorId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.name}
                            </SelectItem>
                          ))}
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
                      onClick={handleCreateQuote}
                    >
                      {isProcessing ? 'Creating...' : 'Create Quote'}
                    </Button>
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
                                onEdit={setEditingQuote}
                                onConvertToInvoice={convertToInvoice}
                                onConvertToPurchaseOrder={convertToPurchaseOrder}
                                quoteSettings={quoteSettings}
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

      <EditQuoteDialog
        quote={editingQuote}
        open={!!editingQuote}
        onOpenChange={(open) => !open && setEditingQuote(null)}
        onSave={handleSaveQuote}
        vendors={vendors}
      />
    </div>
  );
}
