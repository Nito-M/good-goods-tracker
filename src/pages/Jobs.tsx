import { useState, useMemo, useEffect, useCallback, Fragment } from 'react';
import { Plus, ArrowLeft, LogOut, Search, Briefcase, Trash2, Edit, ChevronRight, Minus, X, PackagePlus, Copy, AlertTriangle, GripVertical, User, Mail, Phone, MapPin, List, ImageIcon, ChevronDown, Package, Undo2, Check, ExternalLink } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useJobs, useJobItems } from '@/hooks/useJobs';
import { useJobInstructions } from '@/hooks/useJobInstructions';
import { useJobSidebarLinks } from '@/hooks/useJobSidebarLinks';

import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useCustomers } from '@/hooks/useCustomers';

import { Job } from '@/types/job';
import { formatCurrency } from '@/lib/utils';
import { useItemThumbnails } from '@/hooks/useItemThumbnails';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';
import { supabase } from '@/integrations/supabase/client';
import { PurchaseOrderItem } from '@/types/purchaseOrder';
import { useCanViewJobPricing } from '@/hooks/useCanViewJobPricing';

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'in-production': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'welding-done': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'painting-done': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  finished: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'on-hold': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const STATUS_OPTIONS = [
  { value: 'in-progress', label: 'In Progress' },
  { value: 'open', label: 'Open' },
  { value: 'welding-done', label: 'Welding Done' },
  { value: 'painting-done', label: 'Painting Done' },
  { value: 'finished', label: 'Finished' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface QtyInputProps {
  value: number;
  onCommit: (value: number) => void;
}
function QtyInput({ value, onCommit }: QtyInputProps) {
  const [draft, setDraft] = useState<string>(String(value));
  useEffect(() => { setDraft(String(value)); }, [value]);
  const dirty = draft !== String(value) && draft.trim() !== '';
  const commit = () => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed > 0) {
      onCommit(parsed);
    } else {
      setDraft(String(value));
    }
  };
  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        className="w-20 text-center h-7"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); (e.target as HTMLInputElement).blur(); }
          else if (e.key === 'Escape') { setDraft(String(value)); (e.target as HTMLInputElement).blur(); }
        }}
        min={0.01}
        step="0.01"
      />
      {dirty && (
        <Button
          size="icon"
          variant="default"
          className="h-7 w-7"
          onClick={commit}
          title="Confirm quantity"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export function Jobs() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { jobId: urlJobId, linkId } = useParams<{ jobId?: string; linkId?: string }>();
  const { jobs, loading, createJob, updateJob, deleteJob, duplicateJob, reorderJobs } = useJobs();
  const { customers } = useCustomers();
  const { links, removeLink } = useJobSidebarLinks();
  

  // Resolve page title from sidebar link
  const sidebarLink = linkId ? links.find(l => l.id === linkId) : null;
  const pageTitle = sidebarLink?.label || 'Jobs';

  const [deletingLinkId, setDeletingLinkId] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(urlJobId || null);

  // Keep selectedJobId in sync with the URL so the browser/mouse Back button works.
  useEffect(() => {
    setSelectedJobId(urlJobId || null);
  }, [urlJobId]);

  const openJob = useCallback((id: string) => {
    navigate(`/jobs/${id}`);
  }, [navigate]);

  const closeJob = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/jobs');
  }, [navigate]);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dragOverJobId, setDragOverJobId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState('in-progress');
  const [customerFilter, setCustomerFilter] = useState<string>(() => localStorage.getItem('jobs-customer-filter') || 'all');
  const [groupByCustomer, setGroupByCustomer] = useState<boolean>(() => localStorage.getItem('jobs-group-by-customer') === '1');
  useEffect(() => { localStorage.setItem('jobs-customer-filter', customerFilter); }, [customerFilter]);
  useEffect(() => { localStorage.setItem('jobs-group-by-customer', groupByCustomer ? '1' : '0'); }, [groupByCustomer]);

  const selectedJob = jobs.find(j => j.id === selectedJobId) || null;

  const filteredJobs = useMemo(() => {
    let result = jobs;
    if (statusTab !== 'all') {
      result = result.filter(j => j.status === statusTab);
    }
    if (customerFilter !== 'all') {
      if (customerFilter === 'none') {
        result = result.filter(j => !j.customerId);
      } else {
        result = result.filter(j => j.customerId === customerFilter);
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.jobNumber?.toLowerCase().includes(q) ||
        j.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [jobs, searchQuery, statusTab, customerFilter]);

  const jobsByCustomer = useMemo(() => {
    const groups = new Map<string, { label: string; jobs: typeof filteredJobs }>();
    for (const j of filteredJobs) {
      const key = j.customerId || '__none__';
      const label = j.customerId
        ? (customers.find(c => c.id === j.customerId)?.name || j.customerName || 'Unknown Customer')
        : (j.customerName || 'No Customer');
      if (!groups.has(key)) groups.set(key, { label, jobs: [] });
      groups.get(key)!.jobs.push(j);
    }
    return Array.from(groups.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredJobs, customers]);

  const openCreate = () => {
    navigate('/jobs/new');
  };


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
    if (newJob) openJob(newJob.id);
  };

  if (selectedJob) {
    return (
      <JobDetail
        job={selectedJob}
        onBack={closeJob}
        onDuplicate={() => handleDuplicate(selectedJob)}
        onUpdateStatus={async (status: string) => { await updateJob(selectedJob.id, { status }); }}
        onDelete={async () => { await deleteJob(selectedJob.id); closeJob(); }}
        updateJob={updateJob}
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
              <Button variant="outline" onClick={() => navigate('/jobs/all-items')}><List className="h-4 w-4 mr-2" />All Items</Button>
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
        <Tabs value={statusTab} onValueChange={setStatusTab}>
          <div className="overflow-x-auto">
            <TabsList className="mb-4">
              {STATUS_OPTIONS.map(s => {
                const count = jobs.filter(j => j.status === s.value).length;
                if (count === 0) return null;
                const trigger = <TabsTrigger key={s.value} value={s.value}>{s.label} ({count})</TabsTrigger>;
                if (s.value === 'delivered') {
                  return <Fragment key={s.value}>{trigger}<TabsTrigger value="all">All ({jobs.length})</TabsTrigger></Fragment>;
                }
                return trigger;
              })}
              {!jobs.some(j => j.status === 'delivered') && (
                <TabsTrigger value="all">All ({jobs.length})</TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative max-w-md flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search jobs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-[220px]"><SelectValue placeholder="Filter by customer" /></SelectTrigger>
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
          <p className="text-muted-foreground text-center py-12">Loading jobs...</p>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs {statusTab !== 'all' ? `with status "${STATUS_OPTIONS.find(s => s.value === statusTab)?.label}"` : 'yet'}</h3>
              <p className="text-muted-foreground mb-4">Create your first job to get started</p>
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Create Job</Button>
            </CardContent>
          </Card>
        ) : groupByCustomer ? (
          <div className="space-y-4">
            {jobsByCustomer.map(group => (
              <Card key={group.key}>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {group.label}
                    <Badge variant="secondary" className="ml-1">{group.jobs.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 border-t divide-y">
                  {group.jobs.map(job => (
                    <div
                      key={job.id}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => openJob(job.id)}
                    >
                      {job.jobNumber && <span className="text-xs font-mono text-muted-foreground shrink-0">{job.jobNumber}</span>}
                      <span className="font-medium flex-1 truncate">{job.title}</span>
                      <Badge className={statusColors[job.status] || ''}>{STATUS_OPTIONS.find(s => s.value === job.status)?.label || job.status}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-md border divide-y">
            {filteredJobs.map(job => (
              <div
                key={job.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${draggedJobId === job.id ? 'opacity-50' : ''} ${dragOverJobId === job.id ? 'ring-2 ring-primary' : ''}`}
                draggable={!searchQuery}
                onDragStart={() => handleDragStart(job.id)}
                onDragOver={e => handleDragOver(e, job.id)}
                onDragLeave={() => setDragOverJobId(null)}
                onDrop={() => handleDrop(job.id)}
                onDragEnd={handleDragEnd}
                onClick={() => openJob(job.id)}
              >
                {!searchQuery && <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />}
                {job.jobNumber && <span className="text-xs font-mono text-muted-foreground shrink-0">{job.jobNumber}</span>}
                <span className="font-medium flex-1 truncate">{job.title}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        )}
        </Tabs>
      </main>

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
    </div>
  );
}

// ─── Job Detail View ────────────────────────────────────────────────────────
interface JobDetailProps {
  job: Job;
  onBack: () => void;
  onDuplicate: () => void;
  onUpdateStatus: (status: string) => Promise<void>;
  onDelete: () => Promise<void>;
  updateJob: ReturnType<typeof useJobs>['updateJob'];
  formatCurrency: (v: number) => string;
}

function JobDetail({ job, onBack, onDuplicate, onUpdateStatus, onDelete, updateJob, formatCurrency }: JobDetailProps) {
  const navigate = useNavigate();
  const { items, loading, updateItem, removeItem, reserveItem, unreserveItem } = useJobItems(job.id);
  const { customers } = useCustomers();
  const { canViewJobPricing } = useCanViewJobPricing();

  // Settings tab form state
  const initialTab = (() => {
    if (typeof window === 'undefined') return 'information';
    const p = new URLSearchParams(window.location.search).get('tab');
    return (p === 'parts' || p === 'settings' || p === 'instructions') ? p : 'information';
  })();
  const [tab, setTab] = useState<'information' | 'parts' | 'settings' | 'instructions'>(initialTab as any);
  const { instructions, fileCounts: instructionFileCounts, deleteInstruction } = useJobInstructions(job.id);
  const [descriptionCollapsed, setDescriptionCollapsed] = useState(false);
  const [fTitle, setFTitle] = useState(job.title);
  const [fDescription, setFDescription] = useState(job.description || '');
  const [fJobNumber, setFJobNumber] = useState(job.jobNumber || '');
  const [fCustomerName, setFCustomerName] = useState(job.customerName || '');
  const [fCustomerEmail, setFCustomerEmail] = useState(job.customerEmail || '');
  const [fCustomerPhone, setFCustomerPhone] = useState(job.customerPhone || '');
  const [fCustomerAddress, setFCustomerAddress] = useState(job.customerAddress || '');
  const [fDueDate, setFDueDate] = useState(job.dueDate ? job.dueDate.split('T')[0] : '');
  const [fVin, setFVin] = useState(job.vin || '');
  const [fStockNumber, setFStockNumber] = useState(job.stockNumber || '');
  const [fQuoteNumber, setFQuoteNumber] = useState(job.quoteNumber || '');
  const [fSalesOrderNumber, setFSalesOrderNumber] = useState(job.salesOrderNumber || '');
  const [fInvoiceNumber, setFInvoiceNumber] = useState(job.invoiceNumber || '');
  const [fWeight, setFWeight] = useState(job.weight != null ? String(job.weight) : '');
  const [fNvisLink, setFNvisLink] = useState(job.nvisLink || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState(job.customerId || '');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    setFTitle(job.title);
    setFDescription(job.description || '');
    setFJobNumber(job.jobNumber || '');
    setFCustomerName(job.customerName || '');
    setFCustomerEmail(job.customerEmail || '');
    setFCustomerPhone(job.customerPhone || '');
    setFCustomerAddress(job.customerAddress || '');
    setFDueDate(job.dueDate ? job.dueDate.split('T')[0] : '');
    setFVin(job.vin || '');
    setFStockNumber(job.stockNumber || '');
    setFQuoteNumber(job.quoteNumber || '');
    setFSalesOrderNumber(job.salesOrderNumber || '');
    setFInvoiceNumber(job.invoiceNumber || '');
    setFWeight(job.weight != null ? String(job.weight) : '');
    setFNvisLink(job.nvisLink || '');
    setSelectedCustomerId(job.customerId || '');
  }, [job.id]);

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (customerId === 'none' || !customerId) return;
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFCustomerName(customer.name || '');
      setFCustomerEmail(customer.email || '');
      setFCustomerPhone(customer.phone || '');
      setFCustomerAddress(customer.address || '');
    }
  };

  const handleSaveSettings = async () => {
    if (!fTitle.trim()) return;
    setSavingSettings(true);
    const updates: Record<string, string | number | null | undefined> = {
      title: fTitle.trim(),
      description: fDescription.trim() || undefined,
      customer_id: selectedCustomerId && selectedCustomerId !== 'none' ? selectedCustomerId : null,
      customer_name: fCustomerName.trim() || null,
      customer_email: fCustomerEmail.trim() || null,
      customer_phone: fCustomerPhone.trim() || null,
      customer_address: fCustomerAddress.trim() || null,
      due_date: fDueDate ? (() => { const [y, m, d] = fDueDate.split('-').map(Number); return new Date(y, m - 1, d, 12, 0, 0).toISOString(); })() : null,
      vin: fVin.trim() || null,
      stock_number: fStockNumber.trim() || null,
      quote_number: fQuoteNumber.trim() || null,
      sales_order_number: fSalesOrderNumber.trim() || null,
      invoice_number: fInvoiceNumber.trim() || null,
      weight: fWeight.trim() === '' ? null : Number(fWeight),
      nvis_link: fNvisLink.trim() || null,
    };
    if (fJobNumber.trim() !== (job.jobNumber || '')) {
      updates.job_number = fJobNumber.trim() || undefined;
    }
    await updateJob(job.id, updates as any);
    setSavingSettings(false);
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState<{ url: string; alt: string } | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [orderedSkus, setOrderedSkus] = useState<Set<string>>(new Set());
  const [inventoryQtys, setInventoryQtys] = useState<Record<string, number>>({});

  const inventoryItemIds = useMemo(
    () => items.map(i => i.inventoryItemId).filter((id): id is string => !!id),
    [items]
  );
  const thumbnailMap = useItemThumbnails(inventoryItemIds);

  // Fetch ordered SKUs from POs linked to this job
  const fetchOrderedAndStock = useCallback(async () => {
    if (!job.id || items.length === 0) return;
    // Fetch PO IDs linked to this job via junction table
    const { data: jobLinks } = await supabase
      .from('po_job_links')
      .select('purchase_order_id')
      .eq('job_id', job.id);
    const poIds = jobLinks?.map((l: { purchase_order_id: string }) => l.purchase_order_id) || [];
    const skus = new Set<string>();
    if (poIds.length > 0) {
      const { data: pos } = await supabase
        .from('purchase_orders')
        .select('items, sku')
        .in('id', poIds)
        .in('status', ['draft', 'ordered']);
      if (pos) for (const po of pos) {
        const poItems = po.items as unknown as PurchaseOrderItem[] | null;
        if (poItems && Array.isArray(poItems) && poItems.length > 0) {
          poItems.forEach(pi => { if (pi.sku) skus.add(pi.sku); });
        } else if (po.sku) {
          skus.add(po.sku);
        }
      }
    }
    setOrderedSkus(skus);

    // Fetch inventory quantities for linked items
    if (inventoryItemIds.length > 0) {
      const { data: invData } = await supabase
        .from('inventory_items')
        .select('id, quantity')
        .in('id', inventoryItemIds);
      const qtyMap: Record<string, number> = {};
      if (invData) invData.forEach(inv => { qtyMap[inv.id] = inv.quantity; });
      setInventoryQtys(qtyMap);
    }
  }, [job.id, items, inventoryItemIds]);

  useEffect(() => { fetchOrderedAndStock(); }, [fetchOrderedAndStock]);

  const NO_SUB = '— No subcategory —';
  const groupedItems = useMemo(() => {
    const groups: Record<string, Record<string, typeof items>> = {};
    items.forEach(item => {
      const cat = item.category || 'Uncategorized';
      const sub = item.subcategory || NO_SUB;
      if (!groups[cat]) groups[cat] = {};
      if (!groups[cat][sub]) groups[cat][sub] = [];
      groups[cat][sub].push(item);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cat, subs]) => {
        const subEntries = Object.entries(subs).sort(([a], [b]) => {
          if (a === NO_SUB) return 1;
          if (b === NO_SUB) return -1;
          return a.localeCompare(b);
        });
        return [cat, subEntries] as const;
      });
  }, [items]);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };


  const handleDelete = async () => {
    await onDelete();
    setDeleteOpen(false);
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
                <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Job Details</h1>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/jobs/${job.id}/description`)} className="text-xs font-mono text-muted-foreground hover:underline cursor-pointer">{job.jobNumber}</button>
                  <Select value={job.status} onValueChange={(val) => onUpdateStatus(val)}>
                    <SelectTrigger className="h-7 w-auto gap-1 px-2 text-xs font-semibold border-0 shadow-none">
                      <Badge className={statusColors[job.status] || ''}>{STATUS_OPTIONS.find(s => s.value === job.status)?.label || job.status}</Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s.value} value={s.value}>
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${statusColors[s.value]?.split(' ')[0] || ''}`} />
                            {s.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">{job.title}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="mb-6">
            <TabsTrigger value="information">Information</TabsTrigger>
            <TabsTrigger value="parts">Parts ({items.length})</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* INFORMATION TAB */}
          <TabsContent value="information" className="space-y-6">
            <Card>
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => setDescriptionCollapsed(v => !v)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle>Description</CardTitle>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${descriptionCollapsed ? '-rotate-90' : ''}`} />
                </div>
              </CardHeader>
              {!descriptionCollapsed && (
                <CardContent>
                  {job.description ? (
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No description provided.</p>
                  )}
                </CardContent>
              )}
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>Job Summary</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Job Number</span>
                    <span className="font-mono">{job.jobNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VIN</span>
                    <span className="font-mono">{job.vin || <span className="text-muted-foreground italic font-sans">—</span>}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Stock #</span>
                    <span className="font-mono">{job.stockNumber || <span className="text-muted-foreground italic font-sans">—</span>}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Qty</span>
                    <span>{items.reduce((s, i) => s + i.quantity, 0)}</span>
                  </div>
                  {canViewJobPricing && (
                    <div className="border-t pt-4 flex justify-between font-semibold">
                      <span>Total Value</span>
                      <span>{formatCurrency(totalValue)}</span>
                    </div>
                  )}
                  {job.dueDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Due Date</span>
                      <span>{(() => { const dt = new Date(job.dueDate); return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 12).toLocaleDateString(); })()}</span>
                    </div>
                  )}
                  {job.weight != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Weight</span>
                      <span>{job.weight} lbs</span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>

              {(job.customerName || job.customerEmail || job.customerPhone || job.customerAddress || job.nvisLink || job.quoteNumber || job.salesOrderNumber || job.invoiceNumber) ? (
                <Card>
                  <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
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
                    {job.nvisLink && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">NVIS:</span>
                        <Button asChild variant="outline" size="sm" className="h-7">
                          <a
                            href={/^https?:\/\//i.test(job.nvisLink) ? job.nvisLink : `https://${job.nvisLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            Open Link
                          </a>
                        </Button>
                      </div>
                    )}
                    {(job.quoteNumber || job.salesOrderNumber || job.invoiceNumber) && (
                      <div className="border-t pt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Quote #</span>
                          <span className="font-mono">{job.quoteNumber || <span className="text-muted-foreground italic font-sans">—</span>}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Sales Order #</span>
                          <span className="font-mono">{job.salesOrderNumber || <span className="text-muted-foreground italic font-sans">—</span>}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Invoice #</span>
                          <span className="font-mono">{job.invoiceNumber || <span className="text-muted-foreground italic font-sans">—</span>}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground italic">No customer details. Add them in Settings.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* PARTS TAB */}
          <TabsContent value="parts">
            <div className="flex justify-end mb-4">
              <Button onClick={() => navigate(`/jobs/${job.id}/add-items`)}>
                <PackagePlus className="h-4 w-4 mr-2" />Add Items
              </Button>
            </div>
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
                  <>
                  {groupedItems.map(([category, subGroups]) => {
                    const isCollapsed = collapsedCategories.has(category);
                    const allCatItems = subGroups.flatMap(([, its]) => its);
                    const catTotal = allCatItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
                    return (
                      <div key={category} className="border border-border rounded-lg mb-3 overflow-hidden">
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center justify-between px-4 py-3 bg-muted hover:bg-muted transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                            <span className="font-semibold text-sm">{category}</span>
                            <Badge variant="secondary" className="text-xs">{allCatItems.length}</Badge>
                          </div>
                          {canViewJobPricing && <span className="text-sm font-medium text-muted-foreground">{formatCurrency(catTotal)}</span>}
                        </button>
                        {!isCollapsed && subGroups.map(([subcategory, catItems]) => {
                          const subKey = `${category}::${subcategory}`;
                          const subCollapsed = collapsedCategories.has(subKey);
                          const subTotal = catItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
                          return (
                            <div key={subKey} className="border-t border-border">
                              <button
                                onClick={() => toggleCategory(subKey)}
                                className="w-full flex items-center justify-between px-6 py-2 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${subCollapsed ? '-rotate-90' : ''}`} />
                                  <span className="text-xs font-medium text-muted-foreground">{subcategory}</span>
                                  <Badge variant="outline" className="text-xs">{catItems.length}</Badge>
                                </div>
                                {canViewJobPricing && <span className="text-xs text-muted-foreground">{formatCurrency(subTotal)}</span>}
                              </button>
                              {!subCollapsed && (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-18"></TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {catItems.map(item => {
                                const thumbUrl = item.inventoryItemId ? thumbnailMap.get(item.inventoryItemId) : undefined;
                                return (
                                  <TableRow key={item.id}>
                                    <TableCell className="w-18 py-1">
                                      {thumbUrl ? (
                                        <img
                                          src={thumbUrl}
                                          alt={item.itemName}
                                          className="w-16 h-16 object-contain rounded-md border border-border cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={(e) => { e.stopPropagation(); setViewerImage({ url: thumbUrl, alt: item.itemName }); }}
                                        />
                                      ) : (
                                        <div className="w-16 h-16 rounded-md border border-border bg-muted flex items-center justify-center">
                                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {item.inventoryItemId ? (
                                        <Link to={`/item/${item.inventoryItemId}`} className="hover:underline text-primary">
                                          {item.itemName}
                                        </Link>
                                      ) : (
                                        <span>{item.itemName}</span>
                                      )}
                                    </TableCell>
                                    <TableCell><Badge variant="secondary">{item.sku}</Badge></TableCell>

                                    <TableCell>
                                      <QtyInput
                                        value={item.quantity}
                                        onCommit={(q) => updateItem(item.id, { quantity: q })}
                                      />
                                    </TableCell>

                                    <TableCell>
                                      <div className="flex items-center gap-1 flex-wrap">
                                        {item.consumed ? (
                                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Consumed</Badge>
                                        ) : item.reserved ? (
                                          <>
                                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Reserved</Badge>
                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => unreserveItem(item.id)} title="Return to stock">
                                              <Undo2 className="h-3 w-3" />
                                            </Button>
                                          </>
                                        ) : item.inventoryItemId ? (
                                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => reserveItem(item.id)}>
                                            <Package className="h-3 w-3 mr-1" />Reserve
                                          </Button>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">N/A</span>
                                        )}
                                        {orderedSkus.has(item.sku) && (
                                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Ordered</Badge>
                                        )}
                                        {item.inventoryItemId && (inventoryQtys[item.inventoryItemId] ?? 0) > 0 && (
                                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">In Stock</Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}><X className="h-3.5 w-3.5" /></Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  <ImageViewerDialog
                    imageUrl={viewerImage?.url ?? null}
                    alt={viewerImage?.alt ?? ''}
                    open={!!viewerImage}
                    onOpenChange={(open) => { if (!open) setViewerImage(null); }}
                  />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="Job title" />
                </div>
                <div>
                  <Label>Job Number</Label>
                  <Input value={fJobNumber} onChange={e => setFJobNumber(e.target.value)} placeholder="e.g. JOB-0001" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={fDescription} onChange={e => setFDescription(e.target.value)} placeholder="Job description" rows={4} />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={fDueDate} onChange={e => setFDueDate(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>VIN</Label>
                    <Input value={fVin} onChange={e => setFVin(e.target.value)} placeholder="Vehicle Identification Number" />
                  </div>
                  <div>
                    <Label>Stock Number</Label>
                    <Input value={fStockNumber} onChange={e => setFStockNumber(e.target.value)} placeholder="Stock #" />
                  </div>
                </div>
                <div>
                  <Label>Weight (lbs)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={fWeight}
                    onChange={e => setFWeight(e.target.value)}
                    placeholder="e.g. 1500"
                  />
                </div>
                <div>
                  <Label>NVIS Link</Label>
                  <Input value={fNvisLink} onChange={e => setFNvisLink(e.target.value)} placeholder="https://example.com/nvis" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Customer Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
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
                <div>
                  <Label className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Customer Name</Label>
                  <Input value={fCustomerName} onChange={e => setFCustomerName(e.target.value)} placeholder="Customer name" />
                </div>
                <div>
                  <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />Email</Label>
                  <Input type="email" value={fCustomerEmail} onChange={e => setFCustomerEmail(e.target.value)} placeholder="customer@example.com" />
                </div>
                <div>
                  <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />Phone</Label>
                  <Input value={fCustomerPhone} onChange={e => setFCustomerPhone(e.target.value)} placeholder="Phone number" />
                </div>
                <div>
                  <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Address</Label>
                  <Textarea value={fCustomerAddress} onChange={e => setFCustomerAddress(e.target.value)} placeholder="Customer address" rows={2} />
                </div>
                <div className="grid gap-3 md:grid-cols-3 border-t pt-4">
                  <div>
                    <Label>Quote Number</Label>
                    <Input value={fQuoteNumber} onChange={e => setFQuoteNumber(e.target.value)} placeholder="e.g. QUO-0001" />
                  </div>
                  <div>
                    <Label>Sales Order Number</Label>
                    <Input value={fSalesOrderNumber} onChange={e => setFSalesOrderNumber(e.target.value)} placeholder="e.g. SO-0001" />
                  </div>
                  <div>
                    <Label>Invoice Number</Label>
                    <Input value={fInvoiceNumber} onChange={e => setFInvoiceNumber(e.target.value)} placeholder="e.g. INV-0001" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onDuplicate}><Copy className="h-4 w-4 mr-2" />Duplicate Job</Button>
                <Button variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4 mr-2" />Delete Job</Button>
              </div>
              <Button onClick={handleSaveSettings} disabled={!fTitle.trim() || savingSettings}>
                {savingSettings ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
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
