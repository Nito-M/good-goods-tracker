import { useState, useMemo } from 'react';
import {
  Plus,
  LogOut,
  ArrowLeft,
  ShoppingCart,
  Trash2,
  Minus,
  Receipt,
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
import { Link } from 'react-router-dom';
import { LogoUpload } from '@/components/LogoUpload';
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
import { SalesAnalyticsChart } from '@/components/SalesAnalyticsChart';
import { InventoryItem } from '@/types/inventory';
import { InvoiceSettings } from '@/types/sale';
import { generateInvoicePDF } from '@/lib/invoiceGenerator';

interface CartItem {
  inventoryItem: InventoryItem;
  quantity: number;
}

export function Sales() {
  const { signOut } = useAuth();
  const { sales, loading, createSale, deleteSale, revertSale } = useSales();
  const { allItems: inventoryItems } = useInventory();
  const { vendors } = useVendors();
  const { profile } = useProfile();

  // Build invoice settings from profile
  const invoiceSettings: InvoiceSettings = useMemo(() => ({
    logoUrl: profile?.logoUrl || null,
    businessName: profile?.businessName || null,
    businessAddress: profile?.businessAddress || null,
    businessPhone: profile?.businessPhone || null,
    businessEmail: profile?.businessEmail || null,
    businessNumber: profile?.businessNumber || null,
    thankYouNote: profile?.invoiceThankYouNote || null,
  }), [profile]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [discountRate, setDiscountRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Due on receipt');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
              <LogoUpload />
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight text-card-foreground font-sans">
                  Sales
                </h1>
                <p className="text-sm text-muted-foreground font-medium tracking-wide">
                  Create invoices and manage sales
                </p>
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
                      <Label>Invoice Number (optional)</Label>
                      <Input
                        placeholder="Auto-generated if left empty"
                        value={customInvoiceNumber}
                        onChange={(e) => setCustomInvoiceNumber(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank for auto-generated number (INV-0001, INV-0002, etc.)
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
              <div className="space-y-6">
                {/* Analytics Charts */}
                <SalesAnalyticsChart sales={sales} />
                
                {/* Sales List grouped by month */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sales History</h3>
                  <Accordion type="multiple" defaultValue={[getMonthKey(new Date())]} className="w-full space-y-2">
                    {(() => {
                      // Group sales by month
                      const salesByMonth = sales.reduce((acc, sale) => {
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
                                />
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      });
                    })()}
                  </Accordion>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
