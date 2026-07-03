import { useMemo, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, List, ChevronDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllJobItems } from '@/hooks/useJobs';
import { useCustomers } from '@/hooks/useCustomers';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { useCanViewJobPricing } from '@/hooks/useCanViewJobPricing';

export function AllJobItems() {
  const { items: allJobItems, loading, fetchAllItems } = useAllJobItems();
  const { customers } = useCustomers();
  const { canViewJobPricing } = useCanViewJobPricing();
  const [inventoryQtys, setInventoryQtys] = useState<Record<string, number>>({});
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [customerFilter, setCustomerFilter] = useState<string>(() => localStorage.getItem('alljobitems-customer-filter') || 'all');
  const [groupByCustomer, setGroupByCustomer] = useState<boolean>(() => localStorage.getItem('alljobitems-group-by-customer') === '1');
  useEffect(() => { localStorage.setItem('alljobitems-customer-filter', customerFilter); }, [customerFilter]);
  useEffect(() => { localStorage.setItem('alljobitems-group-by-customer', groupByCustomer ? '1' : '0'); }, [groupByCustomer]);

  const filteredJobItems = useMemo(() => {
    if (customerFilter === 'all') return allJobItems;
    if (customerFilter === 'none') return allJobItems.filter(i => !i.customerId);
    return allJobItems.filter(i => i.customerId === customerFilter);
  }, [allJobItems, customerFilter]);

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
    for (const item of filteredJobItems) {
      const key = item.inventoryItemId || `${item.itemName}::${item.sku}`;
      const existing = map.get(key);
      const jobLabel = item.jobNumber || item.jobTitle;
      if (existing) {
        if (!item.reserved) {
          existing.totalQty += item.quantity;
        }
        if (!existing.jobs.includes(jobLabel)) existing.jobs.push(jobLabel);
      } else {
        map.set(key, { itemName: item.itemName, sku: item.sku, totalQty: item.reserved ? 0 : item.quantity, unitPrice: item.unitPrice, jobs: [jobLabel], inventoryItemId: item.inventoryItemId, category: item.category });
      }
    }
    return Array.from(map.values());
  }, [filteredJobItems]);

  // Per-customer groupings when Group by customer is on
  const customerGroups = useMemo(() => {
    const map = new Map<string, { key: string; label: string; items: typeof allJobItems }>();
    for (const item of filteredJobItems) {
      const key = item.customerId || '__none__';
      const label = item.customerId
        ? (customers.find(c => c.id === item.customerId)?.name || item.customerName || 'Unknown Customer')
        : (item.customerName || 'No Customer');
      if (!map.has(key)) map.set(key, { key, label, items: [] });
      map.get(key)!.items.push(item);
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredJobItems, customers, allJobItems]);

  const computeGroupedForItems = (jobItems: typeof allJobItems) => {
    const map = new Map<string, { itemName: string; sku: string; totalQty: number; unitPrice: number; jobs: string[]; inventoryItemId: string | null; category: string | null }>();
    for (const item of jobItems) {
      const key = item.inventoryItemId || `${item.itemName}::${item.sku}`;
      const existing = map.get(key);
      const jobLabel = item.jobNumber || item.jobTitle;
      if (existing) {
        if (!item.reserved) existing.totalQty += item.quantity;
        if (!existing.jobs.includes(jobLabel)) existing.jobs.push(jobLabel);
      } else {
        map.set(key, { itemName: item.itemName, sku: item.sku, totalQty: item.reserved ? 0 : item.quantity, unitPrice: item.unitPrice, jobs: [jobLabel], inventoryItemId: item.inventoryItemId, category: item.category });
      }
    }
    const aggregated = Array.from(map.values());
    const groups: Record<string, typeof aggregated> = {};
    aggregated.forEach(it => {
      const cat = it.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(it);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cat, its]) => [cat, [...its].sort((a, b) => a.itemName.localeCompare(b.itemName))] as const);
  };

  const groupedItems = useMemo(() => computeGroupedForItems(filteredJobItems), [filteredJobItems]);

  const needCostSummary = useMemo(() => {
    const categories: { name: string; cost: number }[] = [];
    let grandTotal = 0;
    for (const [category, items] of groupedItems) {
      let catCost = 0;
      for (const item of items) {
        if (item.inventoryItemId && inventoryQtys[item.inventoryItemId] !== undefined) {
          const need = Math.max(0, item.totalQty - inventoryQtys[item.inventoryItemId]);
          catCost += need * item.unitPrice;
        }
      }
      if (catCost > 0) {
        categories.push({ name: category, cost: catCost });
        grandTotal += catCost;
      }
    }
    return { categories, grandTotal };
  }, [groupedItems, inventoryQtys]);

  const renderCategoryGroups = (groups: ReturnType<typeof computeGroupedForItems>, keyPrefix: string) => (
    <div className="space-y-4">
      {groups.map(([category, items]) => {
        const isCollapsed = collapsedCategories.has(`${keyPrefix}::${category}`);
        const subtotal = items.reduce((sum, i) => sum + i.totalQty * i.unitPrice, 0);
        return (
          <Card key={`${keyPrefix}::${category}`}>
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
              onClick={() => toggleCategory(`${keyPrefix}::${category}`)}
            >
              <div className="flex items-center gap-3">
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                <span className="font-semibold text-card-foreground">{category}</span>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              {canViewJobPricing && <span className="text-sm font-medium text-muted-foreground">{formatCurrency(subtotal)}</span>}
            </button>
            {!isCollapsed && (
              <CardContent className="p-0 border-t border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead className="text-right">Total Qty</TableHead>
                      <TableHead className="text-right">In Stock</TableHead>
                      <TableHead className="text-right">Need</TableHead>
                      {canViewJobPricing && <TableHead className="text-right">Unit Price</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, i) => {
                      const inStockNum = item.inventoryItemId ? inventoryQtys[item.inventoryItemId] : undefined;
                      const inStock = inStockNum !== undefined ? inStockNum : '—';
                      const need = inStockNum !== undefined ? Math.max(0, item.totalQty - inStockNum) : undefined;
                      const rowKey = `${keyPrefix}::${category}-${i}`;
                      return (
                        <>
                          <TableRow key={rowKey} className="cursor-pointer" onClick={() => toggleRow(rowKey)}>
                            <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={checkedItems.has(rowKey)}
                                onCheckedChange={(checked) => {
                                  setCheckedItems(prev => {
                                    const next = new Set(prev);
                                    if (checked) next.add(rowKey); else next.delete(rowKey);
                                    return next;
                                  });
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{item.itemName}</TableCell>
                            <TableCell className="text-right">{item.totalQty}</TableCell>
                            <TableCell className="text-right">{inStock}</TableCell>
                            <TableCell className="text-right">
                              {need === undefined ? '—' : need > 0 ? (
                                <span className="text-destructive font-medium">{need}</span>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </TableCell>
                            {canViewJobPricing && <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>}
                          </TableRow>
                          {expandedRows.has(rowKey) && (
                            <TableRow key={`${rowKey}-detail`}>
                              <TableCell colSpan={canViewJobPricing ? 6 : 5} className="bg-muted/30 py-2 px-4">
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
  );

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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="w-[240px]"><SelectValue placeholder="Filter by customer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All customers</SelectItem>
              <SelectItem value="none">— No customer —</SelectItem>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={groupByCustomer ? 'default' : 'outline'}
            size="sm"
            onClick={() => setGroupByCustomer(v => !v)}
          >
            <User className="h-4 w-4 mr-2" />Group by customer
          </Button>
        </div>

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
          <>
          {canViewJobPricing && !groupByCustomer && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  {needCostSummary.categories.map(c => (
                    <div key={c.name} className="flex items-center gap-1.5">
                      <span className="text-sm text-muted-foreground">{c.name}:</span>
                      <span className="text-sm font-semibold text-card-foreground">{formatCurrency(c.cost)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-end">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Grand Total Needed:</span>
                    <span className="text-lg font-bold text-card-foreground">{formatCurrency(needCostSummary.grandTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {groupByCustomer ? (
            <div className="space-y-6">
              {customerGroups.map(g => (
                <div key={g.key} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-lg font-semibold text-card-foreground">{g.label}</h2>
                    <Badge variant="secondary">{g.items.length} items</Badge>
                  </div>
                  {renderCategoryGroups(computeGroupedForItems(g.items), g.key)}
                </div>
              ))}
            </div>
          ) : (
            renderCategoryGroups(groupedItems, 'all')
          )}
          </>
        )}
      </main>
    </div>
  );
}
