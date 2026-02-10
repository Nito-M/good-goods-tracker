import { useState, useMemo } from 'react';
import { Plus, ArrowLeft, LogOut, Search, Briefcase, Trash2, Edit, ChevronRight, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useJobs, useJobItems } from '@/hooks/useJobs';
import { useInventory } from '@/hooks/useInventory';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Job } from '@/types/job';

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function Jobs() {
  const { signOut } = useAuth();
  const { jobs, loading, createJob, updateJob, deleteJob } = useJobs();
  const { allItems: inventoryItems } = useInventory();

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create/Edit form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState('open');

  const selectedJob = jobs.find(j => j.id === selectedJobId) || null;

  const filteredJobs = useMemo(() => {
    if (!searchQuery) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.jobNumber?.toLowerCase().includes(q) ||
      j.description?.toLowerCase().includes(q)
    );
  }, [jobs, searchQuery]);

  const openCreate = () => {
    setFormTitle('');
    setFormDescription('');
    setFormStatus('open');
    setShowCreateDialog(true);
  };

  const openEdit = (job: Job) => {
    setFormTitle(job.title);
    setFormDescription(job.description || '');
    setFormStatus(job.status);
    setEditingJob(job);
  };

  const handleCreate = async () => {
    if (!formTitle.trim()) return;
    const result = await createJob(formTitle.trim(), formDescription.trim() || undefined);
    if (result) setShowCreateDialog(false);
  };

  const handleUpdate = async () => {
    if (!editingJob || !formTitle.trim()) return;
    const ok = await updateJob(editingJob.id, {
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      status: formStatus,
    });
    if (ok) setEditingJob(null);
  };

  const handleDelete = async () => {
    if (!deletingJobId) return;
    await deleteJob(deletingJobId);
    if (selectedJobId === deletingJobId) setSelectedJobId(null);
    setDeletingJobId(null);
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

  if (selectedJob) {
    return (
      <JobDetail
        job={selectedJob}
        inventoryItems={inventoryItems}
        onBack={() => setSelectedJobId(null)}
        onEdit={() => openEdit(selectedJob)}
        formatCurrency={formatCurrency}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-24 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
              </Link>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Jobs</h1>
                <p className="text-sm text-muted-foreground font-medium tracking-wide">Manage jobs and assign inventory items</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Job</Button>
              <Button variant="outline" size="icon" onClick={signOut} title="Sign out"><LogOut className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        {loading ? (
          <p className="text-muted-foreground text-center py-12">Loading jobs...</p>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
              <p className="text-muted-foreground mb-4">Create your first job to get started</p>
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Create Job</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map(job => (
              <Card key={job.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedJobId(job.id)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardDescription className="text-xs font-mono">{job.jobNumber}</CardDescription>
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                    </div>
                    <Badge className={statusColors[job.status] || ''}>{job.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {job.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleDateString()}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => { e.stopPropagation(); openEdit(job); }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); setDeletingJobId(job.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Job</DialogTitle>
            <DialogDescription>Add a new job to track work and inventory usage.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Job title" /></div>
            <div><Label>Description</Label><Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Optional description" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!formTitle.trim()}>Create Job</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingJob} onOpenChange={open => { if (!open) setEditingJob(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={formTitle} onChange={e => setFormTitle(e.target.value)} /></div>
            <div><Label>Description</Label><Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} /></div>
            <div>
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingJob(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={!formTitle.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingJobId} onOpenChange={open => { if (!open) setDeletingJobId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this job and all its items. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Job Detail View ────────────────────────────────────────────────────────
interface JobDetailProps {
  job: Job;
  inventoryItems: import('@/types/inventory').InventoryItem[];
  onBack: () => void;
  onEdit: () => void;
  formatCurrency: (v: number) => string;
}

function JobDetail({ job, inventoryItems, onBack, onEdit, formatCurrency }: JobDetailProps) {
  const navigate = useNavigate();
  const { items, loading, addItem, updateItem, removeItem } = useJobItems(job.id);
  const [itemSearch, setItemSearch] = useState('');
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customSku, setCustomSku] = useState('');
  const [customQty, setCustomQty] = useState(1);
  const [customPrice, setCustomPrice] = useState(0);
  const [customNotes, setCustomNotes] = useState('');

  const filteredInventory = useMemo(() => {
    if (!itemSearch) return inventoryItems;
    const q = itemSearch.toLowerCase();
    return inventoryItems.filter(i =>
      i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
    );
  }, [inventoryItems, itemSearch]);

  const handleAddItem = async (inv: import('@/types/inventory').InventoryItem) => {
    const existing = items.find(i => i.inventoryItemId === inv.id);
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

  const handleAddCustom = async () => {
    if (!customName.trim()) return;
    const ok = await addItem({
      inventoryItemId: null,
      itemName: customName.trim(),
      sku: customSku.trim(),
      quantity: customQty,
      unitPrice: customPrice,
      notes: customNotes.trim() || undefined,
    });
    if (ok) {
      setShowCustomDialog(false);
      setCustomName('');
      setCustomSku('');
      setCustomQty(1);
      setCustomPrice(0);
      setCustomNotes('');
    }
  };

  const totalValue = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-24 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{job.jobNumber}</span>
                  <Badge className={statusColors[job.status] || ''}>{job.status}</Badge>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-card-foreground">{job.title}</h1>
                {job.description && <p className="text-sm text-muted-foreground">{job.description}</p>}
              </div>
            </div>
            <Button variant="outline" onClick={onEdit}><Edit className="h-4 w-4 mr-2" />Edit Job</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Inventory Selection */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Add Items</CardTitle>
                    <CardDescription>Add from inventory or create a custom item</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/items/new')}>
                      <Plus className="h-4 w-4 mr-2" />New Inventory Item
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowCustomDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />Custom Item
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search inventory by name or SKU..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} className="pl-10" />
                </div>
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
                      {filteredInventory.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No items found</TableCell></TableRow>
                      ) : (
                        filteredInventory.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell><Badge variant="secondary">{item.sku}</Badge></TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" onClick={() => handleAddItem(item)}>
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

            {/* Job Items */}
            <Card>
              <CardHeader>
                <CardTitle>Job Items ({items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-center py-4">Loading...</p>
                ) : items.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No items added yet. Select from inventory or add a custom item.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {item.itemName}
                              {!item.inventoryItemId && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Custom</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>{item.sku ? <Badge variant="secondary">{item.sku}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}><Minus className="h-3 w-3" /></Button>
                              <Input type="number" className="w-14 text-center h-7" value={item.quantity} onChange={e => updateItem(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })} min={1} />
                              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}><Plus className="h-3 w-3" /></Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}><X className="h-3.5 w-3.5" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Job Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Job Number</span>
                  <span className="font-mono">{job.jobNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={statusColors[job.status] || ''}>{job.status}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span>{items.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Qty</span>
                  <span>{items.reduce((s, i) => s + i.quantity, 0)}</span>
                </div>
                <div className="border-t pt-4 flex justify-between font-semibold">
                  <span>Total Value</span>
                  <span>{formatCurrency(totalValue)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Created {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Custom Item Dialog */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Item</DialogTitle>
            <DialogDescription>Add an item that isn't in your inventory.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Item Name *</Label>
              <Input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Labour, Shipping, etc." />
            </div>
            <div>
              <Label>SKU</Label>
              <Input value={customSku} onChange={e => setCustomSku(e.target.value)} placeholder="Optional" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={customQty} onChange={e => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))} min={1} />
              </div>
              <div>
                <Label>Unit Price ($)</Label>
                <Input type="number" value={customPrice} onChange={e => setCustomPrice(parseFloat(e.target.value) || 0)} min={0} step="0.01" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={customNotes} onChange={e => setCustomNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomDialog(false)}>Cancel</Button>
            <Button onClick={handleAddCustom} disabled={!customName.trim()}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
