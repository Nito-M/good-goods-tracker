import { useState, useMemo, useEffect } from 'react';
import { Plus, ArrowLeft, LogOut, Search, Briefcase, Trash2, Edit, ChevronRight, Minus, X, PackagePlus, Copy, AlertTriangle, GripVertical, User, Mail, Phone, MapPin, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useJobs, useJobItems, useAllJobItems } from '@/hooks/useJobs';
import { useJobSidebarLinks } from '@/hooks/useJobSidebarLinks';
import { useCustomers } from '@/hooks/useCustomers';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
  'in-production': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'welding-done': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'painting-done': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  finished: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'in-production', label: 'In Production' },
  { value: 'welding-done', label: 'Welding Done' },
  { value: 'painting-done', label: 'Painting Done' },
  { value: 'finished', label: 'Finished' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function Jobs() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { jobId: urlJobId, linkId } = useParams<{ jobId?: string; linkId?: string }>();
  const { jobs, loading, createJob, updateJob, deleteJob, duplicateJob, reorderJobs } = useJobs();
  const { links, removeLink } = useJobSidebarLinks();
  const { customers } = useCustomers();
  const { items: allJobItems, loading: allItemsLoading, fetchAllItems } = useAllJobItems();
  const [showAllItemsDialog, setShowAllItemsDialog] = useState(false);

  const aggregatedItems = useMemo(() => {
    const map = new Map<string, { itemName: string; sku: string; totalQty: number; unitPrice: number; jobs: string[] }>();
    for (const item of allJobItems) {
      const key = item.inventoryItemId || `${item.itemName}::${item.sku}`;
      const existing = map.get(key);
      const jobLabel = item.jobNumber || item.jobTitle;
      if (existing) {
        existing.totalQty += item.quantity;
        if (!existing.jobs.includes(jobLabel)) existing.jobs.push(jobLabel);
      } else {
        map.set(key, { itemName: item.itemName, sku: item.sku, totalQty: item.quantity, unitPrice: item.unitPrice, jobs: [jobLabel] });
      }
    }
    return Array.from(map.values());
  }, [allJobItems]);

  const handleOpenAllItems = () => {
    setShowAllItemsDialog(true);
    fetchAllItems();
  };

  // Resolve page title from sidebar link
  const sidebarLink = linkId ? links.find(l => l.id === linkId) : null;
  const pageTitle = sidebarLink?.label || 'Jobs';

  const [deletingLinkId, setDeletingLinkId] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(urlJobId || null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dragOverJobId, setDragOverJobId] = useState<string | null>(null);

  // Create/Edit form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState('open');
  const [formJobNumber, setFormJobNumber] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerEmail, setFormCustomerEmail] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formCustomerAddress, setFormCustomerAddress] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (customerId === 'none' || !customerId) {
      return;
    }
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormCustomerName(customer.name || '');
      setFormCustomerEmail(customer.email || '');
      setFormCustomerPhone(customer.phone || '');
      setFormCustomerAddress(customer.address || '');
    }
  };

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
    setFormCustomerName('');
    setFormCustomerEmail('');
    setFormCustomerPhone('');
    setFormCustomerAddress('');
    setSelectedCustomerId('');
    setShowCreateDialog(true);
  };

  const openEdit = (job: Job) => {
    setFormTitle(job.title);
    setFormDescription(job.description || '');
    setFormStatus(job.status);
    setFormJobNumber(job.jobNumber || '');
    setFormCustomerName(job.customerName || '');
    setFormCustomerEmail(job.customerEmail || '');
    setFormCustomerPhone(job.customerPhone || '');
    setFormCustomerAddress(job.customerAddress || '');
    setEditingJob(job);
  };

  const handleCreate = async () => {
    if (!formTitle.trim()) return;
    const result = await createJob(formTitle.trim(), formDescription.trim() || undefined, formStatus, {
      name: formCustomerName.trim() || undefined,
      email: formCustomerEmail.trim() || undefined,
      phone: formCustomerPhone.trim() || undefined,
      address: formCustomerAddress.trim() || undefined,
    });
    if (result) setShowCreateDialog(false);
  };

  const handleUpdate = async () => {
    if (!editingJob || !formTitle.trim()) return;
    const updates: Record<string, string | null | undefined> = {
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      status: formStatus,
      customer_name: formCustomerName.trim() || null,
      customer_email: formCustomerEmail.trim() || null,
      customer_phone: formCustomerPhone.trim() || null,
      customer_address: formCustomerAddress.trim() || null,
    };
    if (formJobNumber.trim() !== (editingJob.jobNumber || '')) {
      updates.job_number = formJobNumber.trim() || undefined;
    }
    const ok = await updateJob(editingJob.id, updates);
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

  const handleDragStart = (jobId: string) => {
    setDraggedJobId(jobId);
  };

  const handleDragOver = (e: React.DragEvent, jobId: string) => {
    e.preventDefault();
    if (jobId !== draggedJobId) setDragOverJobId(jobId);
  };

  const handleDrop = (targetJobId: string) => {
    if (!draggedJobId || draggedJobId === targetJobId) {
      setDraggedJobId(null);
      setDragOverJobId(null);
      return;
    }
    const currentJobs = searchQuery ? jobs : [...jobs];
    const fromIndex = currentJobs.findIndex(j => j.id === draggedJobId);
    const toIndex = currentJobs.findIndex(j => j.id === targetJobId);
    if (fromIndex === -1 || toIndex === -1) return;
    const reordered = [...currentJobs];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    reorderJobs(reordered);
    setDraggedJobId(null);
    setDragOverJobId(null);
  };

  const handleDragEnd = () => {
    setDraggedJobId(null);
    setDragOverJobId(null);
  };

  const handleDuplicate = async (job: Job) => {
    const newJob = await duplicateJob(job);
    if (newJob) setSelectedJobId(newJob.id);
  };

  if (selectedJob) {
    return (
      <JobDetail
        job={selectedJob}
        onBack={() => setSelectedJobId(null)}
        onEdit={() => openEdit(selectedJob)}
        onDuplicate={() => handleDuplicate(selectedJob)}
        onUpdateStatus={async (status: string) => { await updateJob(selectedJob.id, { status }); }}
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
                <h1 className="text-2xl font-bold tracking-tight text-card-foreground">{pageTitle}</h1>
                <p className="text-sm text-muted-foreground font-medium tracking-wide">Manage jobs and assign inventory items</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleOpenAllItems}><List className="h-4 w-4 mr-2" />All Items</Button>
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Job</Button>
              {linkId && sidebarLink && (
                <Button variant="destructive" onClick={() => setDeletingLinkId(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />Delete Subitem
                </Button>
              )}
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
              <Card
                key={job.id}
                className={`cursor-pointer hover:shadow-md transition-all ${draggedJobId === job.id ? 'opacity-50 scale-95' : ''} ${dragOverJobId === job.id ? 'ring-2 ring-primary' : ''}`}
                draggable={!searchQuery}
                onDragStart={() => handleDragStart(job.id)}
                onDragOver={e => handleDragOver(e, job.id)}
                onDragLeave={() => setDragOverJobId(null)}
                onDrop={() => handleDrop(job.id)}
                onDragEnd={handleDragEnd}
                onClick={() => setSelectedJobId(job.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {!searchQuery && (
                        <GripVertical className="h-5 w-5 text-muted-foreground mt-0.5 cursor-grab shrink-0" />
                      )}
                      <div>
                        <CardDescription className="text-xs font-mono">{job.jobNumber}</CardDescription>
                        <CardTitle className="text-lg">{job.title}</CardTitle>
                      </div>
                    </div>
                    <Badge className={statusColors[job.status] || ''}>{job.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {job.customerName && (
                    <p className="text-sm text-foreground flex items-center gap-1.5 mb-1">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {job.customerName}
                    </p>
                  )}
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
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div><Label>Title *</Label><Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Job title" /></div>
            <div><Label>Description</Label><Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Optional description" /></div>
            <div>
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Customer Details</p>
              <div className="space-y-3">
                {customers.length > 0 && (
                  <div>
                    <Label>Select Customer</Label>
                    <Select value={selectedCustomerId} onValueChange={handleCustomerSelect}>
                      <SelectTrigger><SelectValue placeholder="Choose a saved customer..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None —</SelectItem>
                        {customers.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}{c.company ? ` (${c.company})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div><Label>Customer Name</Label><Input value={formCustomerName} onChange={e => setFormCustomerName(e.target.value)} placeholder="Customer name" /></div>
                <div><Label>Email</Label><Input type="email" value={formCustomerEmail} onChange={e => setFormCustomerEmail(e.target.value)} placeholder="customer@example.com" /></div>
                <div><Label>Phone</Label><Input value={formCustomerPhone} onChange={e => setFormCustomerPhone(e.target.value)} placeholder="Phone number" /></div>
                <div><Label>Address</Label><Textarea value={formCustomerAddress} onChange={e => setFormCustomerAddress(e.target.value)} placeholder="Customer address" rows={2} /></div>
              </div>
            </div>
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
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div><Label>Title *</Label><Input value={formTitle} onChange={e => setFormTitle(e.target.value)} /></div>
            <div><Label>Job Number</Label><Input value={formJobNumber} onChange={e => setFormJobNumber(e.target.value)} placeholder="e.g. JOB-0001" /></div>
            <div><Label>Description</Label><Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} /></div>
            <div>
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Customer Details</p>
              <div className="space-y-3">
                {customers.length > 0 && (
                  <div>
                    <Label>Select Customer</Label>
                    <Select value={selectedCustomerId} onValueChange={handleCustomerSelect}>
                      <SelectTrigger><SelectValue placeholder="Choose a saved customer..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None —</SelectItem>
                        {customers.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}{c.company ? ` (${c.company})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div><Label>Customer Name</Label><Input value={formCustomerName} onChange={e => setFormCustomerName(e.target.value)} placeholder="Customer name" /></div>
                <div><Label>Email</Label><Input type="email" value={formCustomerEmail} onChange={e => setFormCustomerEmail(e.target.value)} placeholder="customer@example.com" /></div>
                <div><Label>Phone</Label><Input value={formCustomerPhone} onChange={e => setFormCustomerPhone(e.target.value)} placeholder="Phone number" /></div>
                <div><Label>Address</Label><Textarea value={formCustomerAddress} onChange={e => setFormCustomerAddress(e.target.value)} placeholder="Customer address" rows={2} /></div>
              </div>
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

      {/* Delete Subitem Confirmation */}
      <AlertDialog open={deletingLinkId} onOpenChange={open => { if (!open) setDeletingLinkId(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete &quot;{sidebarLink?.label}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Deleting this subitem will:</p>
                <ul className="list-disc ml-4 space-y-1 text-sm">
                  <li>Permanently remove &quot;{sidebarLink?.label}&quot; from the sidebar navigation</li>
                  <li>Remove the custom page associated with this subitem</li>
                  <li>This action <strong className="text-foreground">cannot be undone</strong></li>
                </ul>
                <p className="text-sm text-muted-foreground">Note: Your jobs and their assigned inventory items will not be affected.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (linkId) {
                  await removeLink(linkId);
                  navigate('/jobs');
                }
                setDeletingLinkId(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* All Items Dialog */}
      <Dialog open={showAllItemsDialog} onOpenChange={setShowAllItemsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>All Job Items</DialogTitle>
            <DialogDescription>Combined list of items across all active jobs (excluding finished).</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {allItemsLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading items...</p>
            ) : aggregatedItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No items found across jobs.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Total Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead>Jobs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aggregatedItems.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.itemName}</TableCell>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell className="text-right">{item.totalQty}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.jobs.join(', ')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Job Detail View ────────────────────────────────────────────────────────
interface JobDetailProps {
  job: Job;
  onBack: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onUpdateStatus: (status: string) => Promise<void>;
  formatCurrency: (v: number) => string;
}

function JobDetail({ job, onBack, onEdit, onDuplicate, onUpdateStatus, formatCurrency }: JobDetailProps) {
  const navigate = useNavigate();
  const { items, loading, updateItem, removeItem } = useJobItems(job.id);

  const totalValue = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-24 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Job Details</h1>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{job.jobNumber}</span>
                  <Badge className={statusColors[job.status] || ''}>{job.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{job.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate(`/jobs/${job.id}/add-items`)}>
                <PackagePlus className="h-4 w-4 mr-2" />Add Items
              </Button>
              <Button variant="outline" onClick={onDuplicate}><Copy className="h-4 w-4 mr-2" />Duplicate</Button>
              <Button variant="outline" onClick={onEdit}><Edit className="h-4 w-4 mr-2" />Edit Job</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Job Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Job Items ({items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground text-center py-4">Loading...</p>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <PackagePlus className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No items assigned</h3>
                    <p className="text-muted-foreground mb-4">Add inventory items to this job</p>
                    <Button onClick={() => navigate(`/jobs/${job.id}/add-items`)}>
                      <PackagePlus className="h-4 w-4 mr-2" />Add Items
                    </Button>
                  </div>
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
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell><Badge variant="secondary">{item.sku}</Badge></TableCell>
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
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Select value={job.status} onValueChange={onUpdateStatus}>
                    <SelectTrigger className="w-[160px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${statusColors[s.value]?.split(' ')[0] || 'bg-muted'}`} />
                            {s.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

            {/* Customer Info Card */}
            {(job.customerName || job.customerEmail || job.customerPhone || job.customerAddress) && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-base">Customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {job.customerName && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{job.customerName}</span>
                    </div>
                  )}
                  {job.customerEmail && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a href={`mailto:${job.customerEmail}`} className="text-primary hover:underline">{job.customerEmail}</a>
                    </div>
                  )}
                  {job.customerPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a href={`tel:${job.customerPhone}`} className="text-primary hover:underline">{job.customerPhone}</a>
                    </div>
                  )}
                  {job.customerAddress && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="whitespace-pre-line">{job.customerAddress}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
