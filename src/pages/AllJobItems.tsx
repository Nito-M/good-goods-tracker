import { useMemo, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAllJobItems } from '@/hooks/useJobs';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';

export function AllJobItems() {
  const { items: allJobItems, loading, fetchAllItems } = useAllJobItems();
  const [inventoryQtys, setInventoryQtys] = useState<Record<string, number>>({});

  const fetchInventoryQtys = useCallback(async () => {
    const inventoryIds = [...new Set(allJobItems.map(i => i.inventoryItemId).filter(Boolean))] as string[];
    if (inventoryIds.length === 0) { setInventoryQtys({}); return; }
    const { data } = await supabase
      .from('inventory_items')
      .select('id, quantity')
      .in('id', inventoryIds);
    if (data) {
      const map: Record<string, number> = {};
      data.forEach(d => { map[d.id] = d.quantity; });
      setInventoryQtys(map);
    }
  }, [allJobItems]);

  useEffect(() => {
    fetchAllItems();
  }, [fetchAllItems]);

  useEffect(() => {
    if (allJobItems.length > 0) fetchInventoryQtys();
  }, [allJobItems, fetchInventoryQtys]);

  const aggregatedItems = useMemo(() => {
    const map = new Map<string, { itemName: string; sku: string; totalQty: number; unitPrice: number; jobs: string[]; inventoryItemId: string | null }>();
    for (const item of allJobItems) {
      const key = item.inventoryItemId || `${item.itemName}::${item.sku}`;
      const existing = map.get(key);
      const jobLabel = item.jobNumber || item.jobTitle;
      if (existing) {
        existing.totalQty += item.quantity;
        if (!existing.jobs.includes(jobLabel)) existing.jobs.push(jobLabel);
      } else {
        map.set(key, { itemName: item.itemName, sku: item.sku, totalQty: item.quantity, unitPrice: item.unitPrice, jobs: [jobLabel], inventoryItemId: item.inventoryItemId });
      }
    }
    return Array.from(map.values());
  }, [allJobItems]);


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-24 items-center gap-4">
            <Link to="/jobs">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight text-card-foreground flex items-center gap-2">
                <List className="h-6 w-6" />All Job Items
              </h1>
              <p className="text-sm text-muted-foreground font-medium tracking-wide">Combined list of items across all active jobs (excluding finished)</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading items...</p>
        ) : aggregatedItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <List className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No items found</h3>
              <p className="text-muted-foreground">No items are assigned to any active jobs yet.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Total Qty</TableHead>
                    <TableHead className="text-right">In Stock</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead>Jobs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aggregatedItems.map((item, i) => {
                    const inStock = item.inventoryItemId ? inventoryQtys[item.inventoryItemId] ?? '—' : '—';
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                        <TableCell className="text-right">{item.totalQty}</TableCell>
                        <TableCell className="text-right">{inStock}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.jobs.join(', ')}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}