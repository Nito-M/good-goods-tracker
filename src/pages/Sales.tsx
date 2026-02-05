import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  LogOut,
  ArrowLeft,
  ShoppingCart,
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
import { useSales } from '@/hooks/useSales';
import { useInventory } from '@/hooks/useInventory';
import { useVendors } from '@/hooks/useVendors';
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
import { Badge } from '@/components/ui/badge';
import { SaleCard } from '@/components/SaleCard';
import { EditSaleDialog } from '@/components/EditSaleDialog';
import { InvoicePreviewDialog } from '@/components/InvoicePreviewDialog';

import { InventoryItem } from '@/types/inventory';
import { InvoiceSettings, Sale } from '@/types/sale';
import { generateInvoicePDF } from '@/lib/invoiceGenerator';

interface CartItem {
  inventoryItem: InventoryItem;
  quantity: number;
}

export function Sales() {
  const { signOut } = useAuth();
  const { sales, loading, createSale, updateSale, updateStatus, deleteSale, revertSale } = useSales();
  const { allItems: inventoryItems } = useInventory();
  const { vendors } = useVendors();
  const { profile } = useProfile();
  const { addSaleProfit } = useBank();

  // Build invoice settings from profile
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

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [taxRate, setTaxRate] = useState(5);
  const [discountRate, setDiscountRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Due on receipt');
  const [searchQuery, setSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState('');
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [previewSale, setPreviewSale] = useState<Sale | null>(null);

  const handleSaveSale = async (saleId: string, data: any) => {
    await updateSale(saleId, data);
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
        item.quantity > 0 &&
        (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [inventoryItems, searchQuery]);

  const addToCart = (item: InventoryItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.inventoryItem.id === item.id);
      if (existing) {
        if (existing.quantity >= item.quantity) return prev;
        return prev.map((c) =>
          c.inventoryItem.id === item.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { inventoryItem: item, quantity: 1 }];
    });
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((c) => c.inventoryItem.id !== itemId));
      return;
    }
    setCart((prev) =>
      prev.map((c) =>
        c.inventoryItem.id === itemId
          ? {
              ...c,
              quantity: Math.min(quantity, c.inventoryItem.quantity),
            }
          : c
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.inventoryItem.id !== itemId));
  };

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, c) => sum + c.quantity * c.inventoryItem.price, 0),
    [cart]
  );

  const discountAmount = subtotal * (discountRate / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);

    const sale = await createSale({
      vendorId: selectedVendorId || null,
      invoiceNumber: customInvoiceNumber.trim() || null,
      items: cart.map((c) => ({
        inventoryItemId: c.inventoryItem.id,
        itemName: c.inventoryItem.name,
        sku: c.inventoryItem.sku,
        quantity: c.quantity,
        unitPrice: c.inventoryItem.price,
        unitCost: c.inventoryItem.cost,
      })),
      taxRate,
      discountRate,
      notes: notes || null,
      paymentTerms,
      dueDate: null,
    });

    if (sale) {
      setCart([]);
      setSelectedVendorId('');
      setCustomInvoiceNumber('');
      setTaxRate(0);
      setDiscountRate(0);
      setNotes('');
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
        <Tabs defaultValue="new-sale" className="space-y-6">
          <TabsList>
            <TabsTrigger value="new-sale" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              New Sale
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
                                No items with available stock
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
                  <CardHeader>
                    <CardTitle>Cart ({cart.length} items)</CardTitle>
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
                            <TableHead>Item</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cart.map((c) => (
                            <TableRow key={c.inventoryItem.id}>
                              <TableCell className="font-medium">
                                {c.inventoryItem.name}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(c.inventoryItem.price)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      updateCartQuantity(
                                        c.inventoryItem.id,
                                        c.quantity - 1
                                      )
                                    }
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Input
                                    type="number"
                                    className="w-16 text-center"
                                    value={c.quantity}
                                    onChange={(e) =>
                                      updateCartQuantity(
                                        c.inventoryItem.id,
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    min={1}
                                    max={c.inventoryItem.quantity}
                                  />
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      updateCartQuantity(
                                        c.inventoryItem.id,
                                        c.quantity + 1
                                      )
                                    }
                                    disabled={
                                      c.quantity >= c.inventoryItem.quantity
                                    }
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(
                                  c.quantity * c.inventoryItem.price
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={() =>
                                    removeFromCart(c.inventoryItem.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
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
                      <Label>Vendor (Customer)</Label>
                      <Select
                        value={selectedVendorId}
                        onValueChange={setSelectedVendorId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vendor" />
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
                      {isProcessing ? 'Processing...' : 'Complete Sale'}
                    </Button>
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
                                  onDownloadInvoice={() => generateInvoicePDF(sale, invoiceSettings)}
                                  onPreviewInvoice={() => setPreviewSale(sale)}
                                  onEdit={setEditingSale}
                                  onStatusChange={(id, status) => updateStatus(id, status, addSaleProfit)}
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

      <EditSaleDialog
        sale={editingSale}
        open={!!editingSale}
        onOpenChange={(open) => !open && setEditingSale(null)}
        onSave={handleSaveSale}
        vendors={vendors}
      />

      {previewSale && (
        <InvoicePreviewDialog
          open={!!previewSale}
          onOpenChange={(open) => !open && setPreviewSale(null)}
          sale={previewSale}
          settings={invoiceSettings}
          onDownload={() => {
            generateInvoicePDF(previewSale, invoiceSettings);
            setPreviewSale(null);
          }}
        />
      )}
    </div>
  );
}
