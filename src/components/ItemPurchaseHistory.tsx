import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Package, CheckCircle } from 'lucide-react';

interface PurchaseHistoryItem {
  id: string;
  poNumber: string | null;
  unitCost: number;
  quantity: number;
  orderedAt: Date;
  receivedAt: Date | null;
  status: 'ordered' | 'received';
}

interface SoldItem {
  saleId: string;
  invoiceNumber: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  profit: number;
  createdAt: Date;
}

interface ItemPurchaseHistoryProps {
  sku: string;
  currentStock: number;
}

export function ItemPurchaseHistory({ sku, currentStock }: ItemPurchaseHistoryProps) {
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
        .order('ordered_at', { ascending: false });

      if (poData) {
        const purchaseItems: PurchaseHistoryItem[] = [];
        
        for (const po of poData) {
          const items = po.items as Array<{ sku: string; itemName: string; quantity: number; unitCost?: number }> | null;
          
          if (items && Array.isArray(items)) {
            const matchingItem = items.find(item => item.sku === sku);
            if (matchingItem) {
              purchaseItems.push({
                id: po.id,
                poNumber: po.po_number,
                unitCost: matchingItem.unitCost || 0,
                quantity: matchingItem.quantity,
                orderedAt: new Date(po.ordered_at),
                receivedAt: po.received_at ? new Date(po.received_at) : null,
                status: po.status as 'ordered' | 'received',
              });
            }
          }
        }
        
        setPurchases(purchaseItems);
      }

      // Fetch sale items for this SKU
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

      if (saleItemsData) {
        const sold: SoldItem[] = saleItemsData
          .filter((item: any) => item.sales?.status === 'completed')
          .map((item: any) => ({
            saleId: item.sale_id,
            invoiceNumber: item.sales.invoice_number,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            unitCost: item.unit_cost,
            profit: (item.unit_price - item.unit_cost) * item.quantity,
            createdAt: new Date(item.created_at),
          }));
        
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
    .filter(p => p.status === 'received')
    .reduce((sum, p) => sum + p.quantity, 0);
  const totalSold = soldItems.reduce((sum, s) => sum + s.quantity, 0);
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">Total Purchased</p>
            <p className="text-xl font-bold text-card-foreground">{totalPurchased}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">Total Sold</p>
            <p className="text-xl font-bold text-card-foreground">{totalSold}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">In Stock</p>
            <p className="text-xl font-bold text-card-foreground">{currentStock}</p>
          </div>
          <div className="bg-success/10 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">Total Profit</p>
            <p className="text-xl font-bold text-success">{formatCurrency(totalProfit)}</p>
          </div>
        </div>

        {/* Purchase Orders Table */}
        <div>
          <h4 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Purchase Orders ({purchases.length})
          </h4>
          {purchases.length === 0 ? (
            <p className="text-muted-foreground text-sm">No purchase orders found for this item.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">{purchase.poNumber || 'N/A'}</TableCell>
                    <TableCell>{formatDate(purchase.orderedAt)}</TableCell>
                    <TableCell className="text-right">{purchase.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(purchase.unitCost)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(purchase.unitCost * purchase.quantity)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          purchase.status === 'received'
                            ? 'bg-success/10 text-success hover:bg-success/20'
                            : 'bg-warning/10 text-warning hover:bg-warning/20'
                        }
                      >
                        {purchase.status === 'received' ? 'Received' : 'Ordered'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Sales Table */}
        <div>
          <h4 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Sales ({soldItems.length})
          </h4>
          {soldItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sales recorded for this item.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Sale Price</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {soldItems.map((sale, index) => (
                  <TableRow key={`${sale.saleId}-${index}`}>
                    <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
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
        </div>
      </CardContent>
    </Card>
  );
}
