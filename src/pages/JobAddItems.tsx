import { useState, useMemo } from 'react';
import { ArrowLeft, Search, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInventory } from '@/hooks/useInventory';
import { useJobs, useJobItems } from '@/hooks/useJobs';
import { useNavigate, useParams } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';

export function JobAddItems() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { allItems: inventoryItems } = useInventory();
  const { jobs } = useJobs();
  const { items: jobItems, addItem, updateItem } = useJobItems(jobId || '');
  const [itemSearch, setItemSearch] = useState('');

  const job = jobs.find(j => j.id === jobId);

  const filteredInventory = useMemo(() => {
    if (!itemSearch) return inventoryItems;
    const q = itemSearch.toLowerCase();
    return inventoryItems.filter(i =>
      i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
    );
  }, [inventoryItems, itemSearch]);

  const jobItemInventoryIds = useMemo(
    () => new Set(jobItems.map(i => i.inventoryItemId)),
    [jobItems]
  );

  const handleAddItem = async (inv: typeof inventoryItems[0]) => {
    const existing = jobItems.find(i => i.inventoryItemId === inv.id);
    if (existing) {
      await updateItem(existing.id, { quantity: existing.quantity + 1 });
      return;
    }
    await addItem({
      inventoryItemId: inv.id,
      itemName: inv.name,
      sku: inv.sku,
      quantity: 1,
      unitPrice: inv.price,
    });
  };


  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-24 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(`/jobs/${jobId}`)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex flex-col">
                <p className="text-xs font-mono text-muted-foreground">{job?.jobNumber}</p>
                <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Add Items to Job</h1>
                {job && <p className="text-sm text-muted-foreground">{job.title}</p>}
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate(`/jobs/${jobId}`)}>
              Done
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Inventory Items</CardTitle>
            <CardDescription>Search and add existing inventory items to this job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or SKU..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="border rounded-md">
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
                  {filteredInventory.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No items found</TableCell></TableRow>
                  ) : (
                    filteredInventory.map(item => {
                      const isAdded = jobItemInventoryIds.has(item.id);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell><Badge variant="secondary">{item.sku}</Badge></TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                          <TableCell>
                            <Button size="sm" variant={isAdded ? 'secondary' : 'ghost'} onClick={() => handleAddItem(item)}>
                              {isAdded ? <><Check className="h-4 w-4 mr-1" />Added</> : <><Plus className="h-4 w-4 mr-1" />Add</>}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
