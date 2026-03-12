import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ShoppingCart, Package, CheckCircle } from 'lucide-react';

interface PurchaseHistoryItem {
  id: string;
  poNumber: string | null;
  unitCost: number;
  quantity: number;
  soldQuantity: number;
  consumedQuantity: number;
  reservedQuantity: number;
  remainingQuantity: number;
  orderedAt: Date;
  receivedAt: Date | null;
  status: 'ordered' | 'received' | 'partially_received';
}

const isReceived = (status: string) => status === 'received' || status === 'partially_received';

interface SoldItem {
  saleId: string;
  invoiceNumber: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  profit: number;
  createdAt: Date;
  poNumber: string | null;
}

interface ItemPurchaseHistoryProps {
  sku: string;
  itemId: string;
  currentStock: number;
}

export function ItemPurchaseHistory({ sku, itemId, currentStock }: ItemPurchaseHistoryProps) {
  const [purchases, setPurchases] = useState<PurchaseHistoryItem[]>([]);
  const [soldItems, setSoldItems] = useState<SoldItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);

      // Fetch purchase orders containing this SKU
      const { data: poData } = await supabase
        .from('purchase_orders')
        .select('id, po_number, items, ordered_at, received_at, status')
        .order('received_at', { ascending: true, nullsFirst: false });

      // Fetch allocations for this SKU to determine sold quantities per PO
      const { data: allocations } = await supabase
        .from('po_item_allocations')
        .select('purchase_order_id, quantity_allocated, unit_cost')
        .eq('sku', sku);

      // Fetch total reserved quantity from job_items
      const { data: reservedData } = await supabase
        .from('job_items')
        .select('quantity')
        .eq('sku', sku)
        .eq('reserved', true);

      // Fetch total consumed quantity from item_consumptions
      const { data: consumptionData } = await supabase
        .from('item_consumptions')
        .select('quantity')
        .eq('item_id', itemId);

      const totalReserved = reservedData
        ? reservedData.reduce((sum, ji) => sum + ji.quantity, 0)
        : 0;

      const totalConsumed = consumptionData
        ? consumptionData.reduce((sum, c) => sum + c.quantity, 0)
        : 0;

      // Build allocation map: poId -> total sold quantity
      const soldByPO = new Map<string, number>();
      if (allocations) {
        for (const alloc of allocations) {
          const current = soldByPO.get(alloc.purchase_order_id) || 0;
          soldByPO.set(alloc.purchase_order_id, current + alloc.quantity_allocated);
        }
      }

      if (poData) {
        const purchaseItems: PurchaseHistoryItem[] = [];
        
        for (const po of poData) {
          const items = po.items as Array<{ sku: string; itemName: string; quantity: number; unitCost?: number }> | null;
          
          if (items && Array.isArray(items)) {
            const matchingItem = items.find(item => item.sku === sku);
            if (matchingItem) {
              const soldQty = soldByPO.get(po.id) || 0;

              purchaseItems.push({
                id: po.id,
                poNumber: po.po_number,
                unitCost: matchingItem.unitCost || 0,
                quantity: matchingItem.quantity,
                soldQuantity: isReceived(po.status) ? soldQty : 0,
                consumedQuantity: 0, // will be computed below via FIFO
                reservedQuantity: 0, // will be computed below via FIFO
                remainingQuantity: 0, // will be computed below
                orderedAt: new Date(po.ordered_at),
                receivedAt: po.received_at ? new Date(po.received_at) : null,
                status: po.status as 'ordered' | 'received' | 'partially_received',
              });
            }
          }
        }

        // Distribute consumed quantity FIFO across received POs (oldest first)
        let consumedLeft = totalConsumed;
        for (const p of purchaseItems) {
          if (!isReceived(p.status) || consumedLeft <= 0) continue;
          const availableAfterSold = Math.max(0, p.quantity - p.soldQuantity);
          const consumedFromThis = Math.min(availableAfterSold, consumedLeft);
          p.consumedQuantity = consumedFromThis;
          consumedLeft -= consumedFromThis;
        }

        // Distribute reserved quantity FIFO across received POs (oldest first, after sold+consumed)
        let reservedLeft = totalReserved;
        for (const p of purchaseItems) {
          if (!isReceived(p.status) || reservedLeft <= 0) {
            p.remainingQuantity = isReceived(p.status)
              ? Math.max(0, p.quantity - p.soldQuantity - p.consumedQuantity)
              : p.quantity;
            continue;
          }
          const availableAfterSoldAndConsumed = Math.max(0, p.quantity - p.soldQuantity - p.consumedQuantity);
          const reservedFromThis = Math.min(availableAfterSoldAndConsumed, reservedLeft);
          p.reservedQuantity = reservedFromThis;
          p.remainingQuantity = Math.max(0, availableAfterSoldAndConsumed - reservedFromThis);
          reservedLeft -= reservedFromThis;
        }
        
        setPurchases(purchaseItems);
      }

      // Fetch sale items with their PO allocations
      const { data: saleItemsData } = await supabase
        .from('sale_items')
        .select(`
          id,
          sale_id,
          quantity,
          unit_price,
          unit_cost,
          created_at,
          sales!inner (
            id,
            invoice_number,
            status
          )
        `)
        .eq('sku', sku);

      // Get allocations with PO info for each sale item
      const { data: saleAllocations } = await supabase
        .from('po_item_allocations')
        .select(`
          sale_item_id,
          quantity_allocated,
          unit_cost,
          purchase_orders (po_number)
        `)
        .eq('sku', sku);

      const allocationsBySaleItem = new Map<string, Array<{ poNumber: string | null; quantity: number; unitCost: number }>>();
      if (saleAllocations) {
        for (const alloc of saleAllocations as any[]) {
          const current = allocationsBySaleItem.get(alloc.sale_item_id) || [];
          current.push({
            poNumber: alloc.purchase_orders?.po_number || null,
            quantity: alloc.quantity_allocated,
            unitCost: alloc.unit_cost,
          });
          allocationsBySaleItem.set(alloc.sale_item_id, current);
        }
      }

      if (saleItemsData) {
        const sold: SoldItem[] = [];
        
        for (const item of saleItemsData as any[]) {
          if (item.sales?.status !== 'picked_up' && item.sales?.status !== 'paid') continue;

          const itemAllocations = allocationsBySaleItem.get(item.id) || [];
          
          if (itemAllocations.length > 0) {
            // Create separate entries for each PO allocation
            for (const alloc of itemAllocations) {
              sold.push({
                saleId: item.sale_id,
                invoiceNumber: item.sales.invoice_number,
                quantity: alloc.quantity,
                unitPrice: item.unit_price,
                unitCost: alloc.unitCost,
                profit: (item.unit_price - alloc.unitCost) * alloc.quantity,
                createdAt: new Date(item.created_at),
                poNumber: alloc.poNumber,
              });
            }
          } else {
            // No PO allocation (item not from a PO)
            sold.push({
              saleId: item.sale_id,
              invoiceNumber: item.sales.invoice_number,
              quantity: item.quantity,
              unitPrice: item.unit_price,
              unitCost: item.unit_cost,
              profit: (item.unit_price - item.unit_cost) * item.quantity,
              createdAt: new Date(item.created_at),
              poNumber: null,
            });
          }
        }
        
        // Sort by date descending
        sold.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setSoldItems(sold);
      }

      setLoading(false);
    }

    fetchHistory();
  }, [sku]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalPurchased = purchases
    .filter(p => isReceived(p.status))
    .reduce((sum, p) => sum + p.quantity, 0);
  const totalSold = soldItems.reduce((sum, s) => sum + s.quantity, 0);
  const totalReserved = purchases.reduce((sum, p) => sum + p.reservedQuantity, 0);
  const totalProfit = soldItems.reduce((sum, s) => sum + s.profit, 0);

  if (loading) {
    return (
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Purchase & Sales History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Purchase & Sales History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">Total Purchased</p>
            <p className="text-xl font-bold text-card-foreground">{totalPurchased}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">Total Sold</p>
            <p className="text-xl font-bold text-card-foreground">{totalSold}</p>
          </div>
          {totalReserved > 0 && (
            <div className="bg-warning/10 rounded-lg p-3 text-center">
              <p className="text-sm text-muted-foreground">Reserved</p>
              <p className="text-xl font-bold text-warning">{totalReserved}</p>
            </div>
          )}
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">In Stock</p>
            <p className="text-xl font-bold text-card-foreground">{currentStock}</p>
          </div>
          <div className="bg-success/10 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">Total Profit</p>
            <p className="text-xl font-bold text-success">{formatCurrency(totalProfit)}</p>
          </div>
        </div>

        {/* Collapsible Purchase Orders & Sales */}
        <Accordion type="multiple" className="w-full space-y-2">
          {/* Purchase Orders Accordion */}
          <AccordionItem value="purchases" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                <span className="font-semibold">Purchase Orders</span>
                <Badge variant="secondary" className="ml-2">{purchases.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {purchases.length === 0 ? (
                <p className="text-muted-foreground text-sm py-2">No purchase orders found for this item.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Qty Ordered</TableHead>
                      <TableHead className="text-right">Qty Sold</TableHead>
                      <TableHead className="text-right">Reserved</TableHead>
                      <TableHead className="text-right">Remaining</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium">{purchase.poNumber || 'N/A'}</TableCell>
                        <TableCell>{formatDate(purchase.orderedAt)}</TableCell>
                        <TableCell className="text-right">{purchase.quantity}</TableCell>
                        <TableCell className="text-right">{purchase.soldQuantity}</TableCell>
                        <TableCell className="text-right">
                          {isReceived(purchase.status) && purchase.reservedQuantity > 0
                            ? <span className="text-warning font-medium">{purchase.reservedQuantity}</span>
                            : isReceived(purchase.status) ? '0' : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {isReceived(purchase.status) ? purchase.remainingQuantity : '-'}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(purchase.unitCost)}</TableCell>
                        <TableCell>
                          {isReceived(purchase.status) ? (
                            purchase.remainingQuantity === 0 && purchase.reservedQuantity === 0 ? (
                              <Badge className="bg-muted text-muted-foreground hover:bg-muted">
                                All Sold
                              </Badge>
                            ) : purchase.remainingQuantity === 0 && purchase.reservedQuantity > 0 ? (
                              <Badge className="bg-warning/10 text-warning hover:bg-warning/20">
                                Reserved
                              </Badge>
                            ) : purchase.soldQuantity > 0 || purchase.reservedQuantity > 0 ? (
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                Partial
                              </Badge>
                            ) : (
                              <Badge className="bg-success/10 text-success hover:bg-success/20">
                                In Stock
                              </Badge>
                            )
                          ) : (
                            <Badge className="bg-warning/10 text-warning hover:bg-warning/20">
                              Ordered
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Sales Accordion */}
          <AccordionItem value="sales" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span className="font-semibold">Sales</span>
                <Badge variant="secondary" className="ml-2">{soldItems.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {soldItems.length === 0 ? (
                <p className="text-muted-foreground text-sm py-2">No sales recorded for this item.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>From PO</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Sale Price</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {soldItems.map((sale, index) => (
                      <TableRow key={`${sale.saleId}-${index}`}>
                        <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                        <TableCell>
                          {sale.poNumber ? (
                            <Badge variant="outline">{sale.poNumber}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(sale.createdAt)}</TableCell>
                        <TableCell className="text-right">{sale.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sale.unitPrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sale.unitCost)}</TableCell>
                        <TableCell className="text-right text-success font-medium">
                          {formatCurrency(sale.profit)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
