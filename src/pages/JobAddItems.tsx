import { useState, useMemo } from 'react';
import { ArrowLeft, Search, Plus, Check, ImageIcon, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventory } from '@/hooks/useInventory';
import { useCategories } from '@/hooks/useCategories';
import { useJobs, useJobItems } from '@/hooks/useJobs';
import { useAssemblies, useAssemblySummaries } from '@/hooks/useAssemblies';
import { useNavigate, useParams } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { useItemThumbnails } from '@/hooks/useItemThumbnails';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCanViewJobPricing } from '@/hooks/useCanViewJobPricing';

export function JobAddItems() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canViewJobPricing } = useCanViewJobPricing();
  const { allItems: inventoryItems } = useInventory();
  const { jobs } = useJobs();
  const { items: jobItems, addItem, updateItem } = useJobItems(jobId || '');
  const { allCategories } = useCategories();
  const { assemblies, loading: assembliesLoading } = useAssemblies();
  const [itemSearch, setItemSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [assemblySearch, setAssemblySearch] = useState('');
  const [viewerImage, setViewerImage] = useState<{ url: string; alt: string } | null>(null);
  const [addingAssembly, setAddingAssembly] = useState<string | null>(null);

  const addedStorageKey = `job-added-assemblies-${jobId || ''}`;
  const [addedAssemblyIds, setAddedAssemblyIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`job-added-assemblies-${jobId || ''}`);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const addedAssemblySet = useMemo(() => new Set(addedAssemblyIds), [addedAssemblyIds]);

  const assemblyIds = useMemo(() => assemblies.map(a => a.id), [assemblies]);
  const { summaries } = useAssemblySummaries(assemblyIds);

  const inventoryItemIds = useMemo(() => inventoryItems.map(i => i.id), [inventoryItems]);
  const thumbnailMap = useItemThumbnails(inventoryItemIds);

  const job = jobs.find(j => j.id === jobId);

  const filteredInventory = useMemo(() => {
    let filtered = inventoryItems;
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(i => i.category === categoryFilter);
    }
    if (itemSearch) {
      const q = itemSearch.toLowerCase();
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [inventoryItems, itemSearch, categoryFilter]);

  const filteredAssemblies = useMemo(() => {
    if (!assemblySearch) return assemblies;
    const q = assemblySearch.toLowerCase();
    return assemblies.filter(a =>
      a.name.toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q)
    );
  }, [assemblies, assemblySearch]);

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

  const handleAddAssembly = async (assemblyId: string) => {
    if (addedAssemblySet.has(assemblyId)) return;
    setAddingAssembly(assemblyId);
    try {
      const { data: asmItems, error } = await supabase
        .from('assembly_items')
        .select('*, inventory_items(price)')
        .eq('assembly_id', assemblyId);

      if (error) throw error;

      for (const asmItem of (asmItems ?? []) as any[]) {
        const inventoryPrice: number = asmItem.inventory_items?.price ?? 0;
        const existing = jobItems.find(
          ji => ji.inventoryItemId && ji.inventoryItemId === asmItem.inventory_item_id
        );

        if (existing && asmItem.inventory_item_id) {
          await updateItem(existing.id, { quantity: existing.quantity + asmItem.quantity });
        } else {
          await addItem({
            inventoryItemId: asmItem.inventory_item_id ?? undefined,
            itemName: asmItem.item_name,
            sku: asmItem.sku || '',
            quantity: asmItem.quantity,
            unitPrice: inventoryPrice,
            notes: asmItem.notes ?? undefined,
          });
        }
      }

      setAddedAssemblyIds(prev => {
        const next = prev.includes(assemblyId) ? prev : [...prev, assemblyId];
        try { localStorage.setItem(addedStorageKey, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
      toast({ title: 'Assembly items added to job' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to add assembly items.', variant: 'destructive' });
    } finally {
      setAddingAssembly(null);
    }
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
        <Tabs defaultValue="inventory">
          <TabsList>
            <TabsTrigger value="inventory">Inventory Items</TabsTrigger>
            <TabsTrigger value="assemblies">
              <Layers className="h-4 w-4 mr-1.5" />
              Assemblies
            </TabsTrigger>
          </TabsList>

          {/* Inventory Items Tab */}
          <TabsContent value="inventory">
            <Card>
              <CardHeader>
                <CardTitle>Select Inventory Items</CardTitle>
                <CardDescription>Search and add existing inventory items to this job</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by name or SKU..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {allCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        {canViewJobPricing && <TableHead className="text-right">Price</TableHead>}
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.length === 0 ? (
                        <TableRow><TableCell colSpan={canViewJobPricing ? 6 : 5} className="text-center text-muted-foreground">No items found</TableCell></TableRow>
                      ) : (
                        filteredInventory.map(item => {
                          const isAdded = jobItemInventoryIds.has(item.id);
                          const thumbUrl = thumbnailMap.get(item.id);
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="w-14 py-1">
                                {thumbUrl ? (
                                  <img
                                    src={thumbUrl}
                                    alt={item.name}
                                    className="w-12 h-12 object-contain rounded-md border border-border cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); setViewerImage({ url: thumbUrl, alt: item.name }); }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-md border border-border bg-muted/50 flex items-center justify-center">
                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell><Badge variant="secondary">{item.sku}</Badge></TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              {canViewJobPricing && <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>}
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
          </TabsContent>

          {/* Assemblies Tab */}
          <TabsContent value="assemblies">
            <Card>
              <CardHeader>
                <CardTitle>Add from Assembly</CardTitle>
                <CardDescription>Select an assembly to add all its sub-items to this job at once</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assemblies..."
                    value={assemblySearch}
                    onChange={e => setAssemblySearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assembly</TableHead>
                        <TableHead className="text-right">Items</TableHead>
                        <TableHead className="text-right">Est. Cost</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assembliesLoading ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Loading assemblies...</TableCell></TableRow>
                      ) : filteredAssemblies.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No assemblies found</TableCell></TableRow>
                      ) : (
                        filteredAssemblies.map(assembly => {
                          const summary = summaries.get(assembly.id);
                          const isAdding = addingAssembly === assembly.id;
                          return (
                            <TableRow key={assembly.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{assembly.name}</p>
                                  {assembly.description && (
                                    <p className="text-sm text-muted-foreground">{assembly.description}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary">{summary?.itemCount ?? 0} items</Badge>
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {summary ? formatCurrency(summary.totalCost) : '—'}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isAdding || (summary?.itemCount ?? 0) === 0}
                                  onClick={() => handleAddAssembly(assembly.id)}
                                >
                                  {isAdding ? (
                                    'Adding...'
                                  ) : (
                                    <><Plus className="h-4 w-4 mr-1" />Add All Items</>
                                  )}
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
          </TabsContent>
        </Tabs>
      </main>

      <ImageViewerDialog
        imageUrl={viewerImage?.url ?? null}
        alt={viewerImage?.alt ?? ''}
        open={!!viewerImage}
        onOpenChange={(open) => { if (!open) setViewerImage(null); }}
      />
    </div>
  );
}
