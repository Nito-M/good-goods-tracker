import { useMemo, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, List, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAllJobItems } from '@/hooks/useJobs';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';

export function AllJobItems() {
  const { items: allJobItems, loading, fetchAllItems } = useAllJobItems();
  const [inventoryQtys, setInventoryQtys] = useState<Record<string, number>>({});
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const toggleRow = (key: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

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
    const map = new Map<string, { itemName: string; sku: string; totalQty: number; unitPrice: number; jobs: string[]; inventoryItemId: string | null; category: string | null }>();
    for (const item of allJobItems) {
      const key = item.inventoryItemId || `${item.itemName}::${item.sku}`;
      const existing = map.get(key);
      const jobLabel = item.jobNumber || item.jobTitle;
      if (existing) {
        existing.totalQty += item.quantity;
        if (!existing.jobs.includes(jobLabel)) existing.jobs.push(jobLabel);
      } else {
        map.set(key, { itemName: item.itemName, sku: item.sku, totalQty: item.quantity, unitPrice: item.unitPrice, jobs: [jobLabel], inventoryItemId: item.inventoryItemId, category: item.category });
      }
    }
    return Array.from(map.values());
  }, [allJobItems]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof aggregatedItems> = {};
    aggregatedItems.forEach(item => {
      const cat = item.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [aggregatedItems]);

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
          <div className="space-y-4">
            {groupedItems.map(([category, items]) => {
              const isCollapsed = collapsedCategories.has(category);
              const subtotal = items.reduce((sum, i) => sum + i.totalQty * i.unitPrice, 0);
              return (
                <Card key={category}>
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                      <span className="font-semibold text-card-foreground">{category}</span>
                      <Badge variant="secondary">{items.length}</Badge>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{formatCurrency(subtotal)}</span>
                  </button>
                  {!isCollapsed && (
                    <CardContent className="p-0 border-t border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Name</TableHead>
                             <TableHead className="text-right">Total Qty</TableHead>
                             <TableHead className="text-right">In Stock</TableHead>
                             <TableHead className="text-right">Unit Price</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item, i) => {
                            const inStock = item.inventoryItemId ? inventoryQtys[item.inventoryItemId] ?? '—' : '—';
                            const rowKey = `${category}-${i}`;
                            return (
                              <>
                                <TableRow key={rowKey} className="cursor-pointer" onClick={() => toggleRow(rowKey)}>
                                   <TableCell className="font-medium">{item.itemName}</TableCell>
                                   <TableCell className="text-right">{item.totalQty}</TableCell>
                                   <TableCell className="text-right">{inStock}</TableCell>
                                   <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                 </TableRow>
                                 {expandedRows.has(rowKey) && (
                                   <TableRow key={`${rowKey}-detail`}>
                                     <TableCell colSpan={4} className="bg-muted/30 py-2 px-4">
                                       <div className="space-y-1">
                                         <div className="text-xs">
                                           <span className="font-medium text-muted-foreground mr-1">SKU:</span>
                                           <code className="font-mono">{item.sku}</code>
                                         </div>
                                         <div className="flex flex-wrap gap-1.5 items-center">
                                           <span className="text-xs font-medium text-muted-foreground mr-1">Jobs:</span>
                                           {item.jobs.map((job, j) => (
                                             <Badge key={j} variant="secondary" className="text-xs">{job}</Badge>
                                           ))}
                                         </div>
                                       </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
