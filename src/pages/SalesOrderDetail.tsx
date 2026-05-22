import { useState, useMemo, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuotes } from '@/hooks/useQuotes';
import { useVendors } from '@/hooks/useVendors';
import { useJobs } from '@/hooks/useJobs';
import { useProfile } from '@/hooks/useProfile';
import { useCompanies } from '@/hooks/useCompanies';
import { useSales } from '@/hooks/useSales';
import { generateQuotePDF } from '@/lib/quoteGenerator';
import { QuoteSettings } from '@/types/quote';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Briefcase, Loader2, User, Phone, Mail, MapPin, ChevronDown, ChevronRight, CheckCircle, Clock, Hash, CalendarIcon, Trash2, Plus, Download, FileText, Receipt, Link2, X, CornerDownRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ItemLink {
  id: string;
  jobId: string | null;
  status: string;
}

type ExpandedItem = {
  id: string;
  quoteItemId: string;
  unitIndex: number;
  linkKey: string;
  itemName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  inventoryItemId: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:     { label: 'Pending',     className: 'bg-muted text-muted-foreground' },
  open:        { label: 'Open',        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  in_progress: { label: 'In Progress', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  completed:   { label: 'Completed',   className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  shipped:     { label: 'Shipped',     className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
};

export function SalesOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quotes, loading: quotesLoading, convertToInvoice, refetch: refetchQuotes } = useQuotes();
  const [showInvoiceRemainingDialog, setShowInvoiceRemainingDialog] = useState(false);
  const [invoiceRemainingPct, setInvoiceRemainingPct] = useState(100);
  const { vendors, loading: vendorsLoading, updateVendor } = useVendors();
  const [showEditCustomerDialog, setShowEditCustomerDialog] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', contact_phone: '', contact_email: '', address: '' });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({ name: '', email: '', company: '' });
  const [paymentInfoInit, setPaymentInfoInit] = useState(false);
  const [showEditPaymentDialog, setShowEditPaymentDialog] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const { createJob } = useJobs();
  const { profile } = useProfile();
  const { companies } = useCompanies();
  const { sales } = useSales();
  const { toast } = useToast();

  const quoteSettings = useMemo<QuoteSettings>(() => ({
    businessName: profile?.businessName || null,
    businessAddress: profile?.businessAddress || null,
    businessPhone: profile?.businessPhone || null,
    businessEmail: profile?.businessEmail || null,
    businessNumber: profile?.businessNumber || null,
    thankYouNote: profile?.quoteThankYouNote || null,
    logoUrl: profile?.logoUrl || null,
    layout: profile?.quoteLayout || profile?.invoiceLayout || null,
    validityDays: profile?.quoteValidityDays || null,
  }), [profile]);

  const getQuoteSettingsForQuote = (q: any): QuoteSettings => {
    const companyId = q.companyId;
    const company = companyId ? companies.find((c: any) => c.id === companyId) : null;
    if (company) {
      return {
        businessName: company.name,
        businessAddress: company.address,
        businessPhone: company.phone,
        businessEmail: company.email,
        businessNumber: company.businessNumber,
        logoUrl: company.logoUrl,
        thankYouNote: company.quoteThankYouNote || quoteSettings.thankYouNote,
        layout: company.quoteLayout || quoteSettings.layout,
        validityDays: company.quoteValidityDays || quoteSettings.validityDays,
      };
    }
    return quoteSettings;
  };

  const handleDownloadSalesOrder = () => {
    if (!quote) return;
    const settings = getQuoteSettingsForQuote(quote);
    generateQuotePDF(quote, settings, { isSalesOrder: true });
  };

  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [jobNumber, setJobNumber] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();

  // Per-item link state
  const [itemLinks, setItemLinks] = useState<Record<string, ItemLink>>({});
  // childLinkKey -> parentLinkKey
  const [attachments, setAttachments] = useState<Record<string, string>>({});
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set());
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [creatingJobFor, setCreatingJobFor] = useState<string | null>(null);
  const [updatingStatusFor, setUpdatingStatusFor] = useState<string | null>(null);

  const loading = quotesLoading || vendorsLoading;
  const quote = useMemo(() => quotes.find((q) => q.id === id), [quotes, id]);

  useEffect(() => {
    if (quote && !paymentInfoInit) {
      setPaymentInfo({
        name: quote.paymentContactName || '',
        email: quote.paymentContactEmail || '',
        company: quote.paymentContactCompany || '',
      });
      setPaymentInfoInit(true);
    }
  }, [quote, paymentInfoInit]);

  const savePaymentInfo = useCallback(async (next: { name: string; email: string; company: string }) => {
    if (!quote) return;
    const { error } = await supabase
      .from('quotes')
      .update({
        payment_contact_name: next.name.trim() || null,
        payment_contact_email: next.email.trim() || null,
        payment_contact_company: next.company.trim() || null,
      } as any)
      .eq('id', quote.id);
    if (error) {
      toast({ title: 'Error saving payment info', description: error.message, variant: 'destructive' });
      return;
    }
    refetchQuotes();
  }, [quote, toast, refetchQuotes]);

  // Expand items by quantity so each unit becomes its own row/job
  const expandedItems = useMemo<ExpandedItem[]>(() => {
    if (!quote) return [];
    return quote.items.flatMap((item) => {
      const count = Math.max(1, Math.round(item.quantity));
      return Array.from({ length: count }, (_, i) => ({
        id: count > 1 ? `${item.id}-${i}` : item.id,
        quoteItemId: item.id,
        unitIndex: i,
        linkKey: `${item.id}-${i}`,
        itemName: item.itemName,
        sku: item.sku,
        quantity: 1,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice,
        notes: item.notes,
        inventoryItemId: item.inventoryItemId,
      }));
    });
  }, [quote]);

  const vendor = useMemo(() => {
    if (!quote?.vendorId) return null;
    return vendors.find((v) => v.id === quote.vendorId) || null;
  }, [quote, vendors]);

  // Fetch per-item job links from DB
  const fetchItemLinks = useCallback(async () => {
    if (!quote) return;
    const { data } = await supabase
      .from('so_item_job_links' as any)
      .select('*')
      .eq('quote_id', quote.id);
    if (data) {
      const map: Record<string, ItemLink> = {};
      (data as any[]).forEach((link) => {
        map[`${link.quote_item_id}-${link.unit_index}`] = {
          id: link.id,
          jobId: link.job_id,
          status: link.status,
        };
      });
      setItemLinks(map);
    }
  }, [quote]);

  useEffect(() => {
    fetchItemLinks();
  }, [fetchItemLinks]);

  const fetchAttachments = useCallback(async () => {
    if (!quote) return;
    const { data } = await supabase
      .from('so_item_attachments' as any)
      .select('*')
      .eq('quote_id', quote.id);
    if (data) {
      const map: Record<string, string> = {};
      const parents = new Set<string>();
      (data as any[]).forEach((a) => {
        const child = `${a.child_quote_item_id}-${a.child_unit_index}`;
        const parent = `${a.parent_quote_item_id}-${a.parent_unit_index}`;
        map[child] = parent;
        parents.add(parent);
      });
      setAttachments(map);
      setCollapsedParents(parents);
    }
  }, [quote]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const attachItem = async (child: ExpandedItem, parent: ExpandedItem) => {
    if (!quote) return;
    if (child.linkKey === parent.linkKey) return;
    // Prevent attaching a parent (has children) to something else
    const childHasChildren = Object.values(attachments).includes(child.linkKey);
    if (childHasChildren) {
      toast({ title: 'Cannot attach', description: 'Detach its children first.', variant: 'destructive' });
      return;
    }
    const { error } = await (supabase.from('so_item_attachments' as any) as any).upsert(
      {
        quote_id: quote.id,
        child_quote_item_id: child.quoteItemId,
        child_unit_index: child.unitIndex,
        parent_quote_item_id: parent.quoteItemId,
        parent_unit_index: parent.unitIndex,
      },
      { onConflict: 'child_quote_item_id,child_unit_index' }
    );
    if (error) {
      toast({ title: 'Error attaching item', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Attached', description: `${child.itemName} → ${parent.itemName}` });
    await fetchAttachments();
  };

  const detachItem = async (child: ExpandedItem) => {
    if (!quote) return;
    const { error } = await supabase
      .from('so_item_attachments' as any)
      .delete()
      .eq('quote_id', quote.id)
      .eq('child_quote_item_id', child.quoteItemId)
      .eq('child_unit_index', child.unitIndex);
    if (error) {
      toast({ title: 'Error detaching', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchAttachments();
  };


  const handleStatusChange = async (newStatus: string) => {
    if (!quote) return;
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: newStatus })
        .eq('id', quote.id);
      if (error) throw error;
      toast({ title: `Status updated to ${newStatus.replace('_', ' ')}` });
    } catch (err) {
      console.error('Error updating status:', err);
      toast({ title: 'Error updating status', variant: 'destructive' });
    }
  };

  // Create a dedicated job for one item (item name = job title)
  // Build a description that lists attached add-on items under the parent
  const buildJobDescription = (parent: ExpandedItem): string | undefined => {
    const childKeys = Object.entries(attachments)
      .filter(([, parentKey]) => parentKey === parent.linkKey)
      .map(([k]) => k);
    const children = expandedItems.filter((it) => childKeys.includes(it.linkKey));
    const lines: string[] = [];
    if (parent.notes) lines.push(parent.notes);
    if (children.length > 0) {
      lines.push('');
      lines.push('Add-ons:');
      for (const c of children) {
        lines.push(`• ${c.itemName}${c.notes ? ` — ${c.notes}` : ''}`);
      }
    }
    return lines.length > 0 ? lines.join('\n') : undefined;
  };

  const handleCreateJobForItem = async (item: ExpandedItem) => {
    if (!quote) return;
    if (attachments[item.linkKey]) {
      toast({ title: 'This item is attached as an add-on', description: 'Detach it first or create the parent\'s job.', variant: 'destructive' });
      return;
    }
    setCreatingJobFor(item.linkKey);
    try {
      const job = await createJob(
        item.itemName,
        buildJobDescription(item),
        'open',
        {
          name: quote.vendorName || undefined,
          email: vendor?.contact_email || undefined,
          phone: vendor?.contact_phone || undefined,
          address: vendor?.address || undefined,
        },
        dueDate ? dueDate.toISOString() : undefined,
        jobNumber || undefined
      );
      if (!job) return;

      await (supabase.from('so_item_job_links' as any) as any).upsert(
        {
          quote_id: quote.id,
          quote_item_id: item.quoteItemId,
          unit_index: item.unitIndex,
          job_id: job.id,
          status: 'open',
        },
        { onConflict: 'quote_item_id,unit_index' }
      );

      toast({ title: 'Job created', description: item.itemName });
      await fetchItemLinks();
    } catch (err) {
      console.error('Error creating job for item:', err);
      toast({ title: 'Error creating job', variant: 'destructive' });
    } finally {
      setCreatingJobFor(null);
    }
  };

  // Create one separate job per unlinked top-level item (attached children skipped)
  const handleCreateAllJobs = async () => {
    if (!quote || expandedItems.length === 0) return;
    setCreating(true);
    try {
      for (const item of expandedItems) {
        if (attachments[item.linkKey]) continue; // attached as add-on, no job
        if (itemLinks[item.linkKey]?.jobId) continue; // already linked

        const job = await createJob(
          item.itemName,
          buildJobDescription(item),
          'open',
          {
            name: quote.vendorName || undefined,
            email: vendor?.contact_email || undefined,
            phone: vendor?.contact_phone || undefined,
            address: vendor?.address || undefined,
          },
          dueDate ? dueDate.toISOString() : undefined,
        );
        if (!job) continue;

        await (supabase.from('so_item_job_links' as any) as any).upsert(
          {
            quote_id: quote.id,
            quote_item_id: item.quoteItemId,
            unit_index: item.unitIndex,
            job_id: job.id,
            status: 'open',
          },
          { onConflict: 'quote_item_id,unit_index' }
        );
      }

      await fetchItemLinks();
      navigate('/jobs');
    } catch (err) {
      console.error('Error creating jobs:', err);
      toast({ title: 'Error creating jobs', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };


  // Update the status of a specific item link
  const handleUpdateItemStatus = async (linkKey: string, newStatus: string) => {
    const link = itemLinks[linkKey];
    if (!link) return;
    setUpdatingStatusFor(linkKey);
    try {
      await (supabase.from('so_item_job_links' as any) as any)
        .update({ status: newStatus })
        .eq('id', link.id);
      setItemLinks((prev) => ({
        ...prev,
        [linkKey]: { ...prev[linkKey], status: newStatus },
      }));
    } catch (err) {
      console.error('Error updating item status:', err);
      toast({ title: 'Error updating status', variant: 'destructive' });
    } finally {
      setUpdatingStatusFor(null);
    }
  };

  const handleDelete = async () => {
    if (!quote) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('quotes').delete().eq('id', quote.id);
      if (error) throw error;
      toast({ title: 'Sales order deleted' });
      navigate('/sales-orders');
    } catch (err) {
      console.error('Error deleting sales order:', err);
      toast({ title: 'Error deleting sales order', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="space-y-4">
        <Link to="/sales-orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Sales Orders
        </Link>
        <p className="text-muted-foreground">Sales order not found.</p>
      </div>
    );
  }

  const topLevelItems = expandedItems.filter((it) => !attachments[it.linkKey]);
  const allJobsCreated =
    topLevelItems.length > 0 && topLevelItems.every((it) => !!itemLinks[it.linkKey]?.jobId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/sales-orders" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                {quote.salesOrderNumber || '—'}
                <span className="ml-2 text-sm font-normal text-muted-foreground">({quote.quoteNumber})</span>
              </h1>
              {Object.keys(itemLinks).length > 0 && (
                <Link
                  to="/jobs"
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-colors",
                    allJobsCreated
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  <Briefcase className="h-3 w-3" />
                  {allJobsCreated ? 'All Jobs Created' : 'Jobs Created'}
                </Link>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Sales Order</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-destructive hover:text-destructive" disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Sales Order?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete sales order <strong>{quote.quoteNumber}</strong>. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList>
          <TabsTrigger value="items">Jobs</TabsTrigger>
          <TabsTrigger value="customer">Customer & Details</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-6 mt-4">
          {/* Items toolbar: PDF, Job #, Due Date, Actions */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={handleDownloadSalesOrder} className="h-9">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <div className="flex items-center gap-1.5">
              <Label htmlFor="jobNumber" className="text-sm whitespace-nowrap flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" />Job #
              </Label>
              <Input
                id="jobNumber"
                value={jobNumber}
                onChange={(e) => setJobNumber(e.target.value)}
                placeholder="Auto"
                className="w-24 h-9"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal h-9",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                  {dueDate ? format(dueDate, "MMM d, yyyy") : <span>Due date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" disabled={creating} className="h-9">
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-1.5" />
                  )}
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!allJobsCreated && (
                  <DropdownMenuItem onClick={handleCreateAllJobs}>
                    <Briefcase className="h-4 w-4 mr-2" />
                    Create All Jobs
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                  <Clock className="h-4 w-4 mr-2" />
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Complete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-center">Attach</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Job</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const childrenByParent: Record<string, ExpandedItem[]> = {};
                      for (const it of expandedItems) {
                        const p = attachments[it.linkKey];
                        if (p) {
                          (childrenByParent[p] ||= []).push(it);
                        }
                      }
                      const topLevel = expandedItems.filter((it) => !attachments[it.linkKey]);

                      const renderRow = (item: ExpandedItem, isChild: boolean) => {
                        const link = itemLinks[item.linkKey];
                        const statusKey = link?.status ?? 'pending';
                        const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending;
                        const isCreatingThis = creatingJobFor === item.linkKey;
                        const isUpdatingThis = updatingStatusFor === item.linkKey;
                        const hasChildren = !!childrenByParent[item.linkKey]?.length;
                        const parentKey = attachments[item.linkKey];

                        // Items eligible as attach targets:
                        // - not self
                        // - not currently a child (avoid 2-level nesting via a child)
                        const attachableTargets = expandedItems.filter(
                          (other) =>
                            other.linkKey !== item.linkKey &&
                            !attachments[other.linkKey]
                        );

                        return (
                          <TableRow key={item.id} className={isChild ? 'bg-muted/40' : ''}>
                            <TableCell className="font-medium">
                              <div className={cn('flex items-start gap-2', isChild && 'pl-6')}>
                                {isChild && <CornerDownRight className="h-3.5 w-3.5 mt-1 text-muted-foreground shrink-0" />}
                                {!isChild && hasChildren && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCollapsedParents((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(item.linkKey)) next.delete(item.linkKey);
                                        else next.add(item.linkKey);
                                        return next;
                                      });
                                    }}
                                    className="mt-0.5 p-0.5 rounded hover:bg-muted shrink-0"
                                    title={collapsedParents.has(item.linkKey) ? 'Expand add-ons' : 'Collapse add-ons'}
                                  >
                                    {collapsedParents.has(item.linkKey) ? (
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                )}
                                <div>
                                  <span>{item.itemName}</span>
                                  {!isChild && hasChildren && (
                                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                                      ({childrenByParent[item.linkKey].length} add-on{childrenByParent[item.linkKey].length === 1 ? '' : 's'})
                                    </span>
                                  )}
                                  {item.notes && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setExpandedNotes((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(item.linkKey)) next.delete(item.linkKey);
                                          else next.add(item.linkKey);
                                          return next;
                                        });
                                      }}
                                      className="ml-2 inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground font-normal align-middle"
                                      title={expandedNotes.has(item.linkKey) ? 'Hide details' : 'Show details'}
                                    >
                                      {expandedNotes.has(item.linkKey) ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3" />
                                      )}
                                      details
                                    </button>
                                  )}
                                  {item.notes && expandedNotes.has(item.linkKey) && (
                                    <p className="text-xs text-muted-foreground font-normal mt-0.5 whitespace-pre-wrap">{item.notes}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{item.sku || '—'}</TableCell>
                            <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>

                            {/* Attach control */}
                            <TableCell className="text-center">
                              {parentKey ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs px-2"
                                  onClick={() => detachItem(item)}
                                  title="Detach from parent"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Detach
                                </Button>
                              ) : hasChildren ? (
                                <span className="text-xs text-muted-foreground">Main item</span>
                              ) : (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs px-2"
                                      disabled={attachableTargets.length === 0 || !!link?.jobId}
                                    >
                                      <Link2 className="h-3 w-3 mr-1" />
                                      Attach to…
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="center" className="max-h-72 overflow-auto">
                                    {attachableTargets.map((t) => (
                                      <DropdownMenuItem key={t.linkKey} onClick={() => attachItem(item, t)}>
                                        {t.itemName}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>

                            {/* Per-item status */}
                            <TableCell className="text-center">
                              {parentKey ? (
                                <span className="text-xs text-muted-foreground">—</span>
                              ) : link ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      disabled={isUpdatingThis}
                                      className={cn(
                                        'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-opacity cursor-pointer',
                                        statusCfg.className,
                                        isUpdatingThis && 'opacity-50'
                                      )}
                                    >
                                      {isUpdatingThis && <Loader2 className="h-3 w-3 animate-spin" />}
                                      {statusCfg.label}
                                      <ChevronDown className="h-3 w-3 ml-0.5" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="center">
                                    {Object.entries(STATUS_CONFIG)
                                      .filter(([k]) => k !== 'pending')
                                      .map(([key, cfg]) => (
                                        <DropdownMenuItem
                                          key={key}
                                          onClick={() => handleUpdateItemStatus(item.linkKey, key)}
                                        >
                                          <span className={cn('inline-block w-2 h-2 rounded-full mr-2', cfg.className)} />
                                          {cfg.label}
                                        </DropdownMenuItem>
                                      ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <span className={cn('inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full', statusCfg.className)}>
                                  {statusCfg.label}
                                </span>
                              )}
                            </TableCell>

                            {/* Per-item: create job / linked indicator */}
                            <TableCell className="text-center">
                              {parentKey ? (
                                <span className="text-xs text-muted-foreground">Add-on</span>
                              ) : link?.jobId ? (
                                <Link
                                  to={`/jobs/${link.jobId}`}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                >
                                  <Briefcase className="h-3.5 w-3.5" />
                                  View Job
                                </Link>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs px-2"
                                  disabled={isCreatingThis || !!creatingJobFor}
                                  onClick={() => handleCreateJobForItem(item)}
                                >
                                  {isCreatingThis ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <Plus className="h-3 w-3 mr-1" />
                                  )}
                                  Create Job
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      };

                      const rows: JSX.Element[] = [];
                      for (const parent of topLevel) {
                        rows.push(renderRow(parent, false));
                        if (!collapsedParents.has(parent.linkKey)) {
                          for (const child of childrenByParent[parent.linkKey] || []) {
                            rows.push(renderRow(child, true));
                          }
                        }
                      }
                      return rows;
                    })()}
                  </TableBody>

                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer" className="space-y-6 mt-4">
          {/* Customer Info */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Customer Information</CardTitle>
              {vendor && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomerForm({
                      name: vendor.name || '',
                      contact_phone: vendor.contact_phone || '',
                      contact_email: vendor.contact_email || '',
                      address: vendor.address || '',
                    });
                    setShowEditCustomerDialog(true);
                  }}
                >
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                  <span>{quote.vendorName || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Phone:</span>
                  <span>{vendor?.contact_phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{vendor?.contact_email || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Address:</span>
                  <span>{vendor?.address || '—'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Dialog open={showEditCustomerDialog} onOpenChange={setShowEditCustomerDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Customer Information</DialogTitle>
                <DialogDescription>Update the customer's contact details.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cust-name">Name</Label>
                  <Input id="cust-name" value={customerForm.name} onChange={(e) => setCustomerForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cust-phone">Phone</Label>
                  <Input id="cust-phone" value={customerForm.contact_phone} onChange={(e) => setCustomerForm((f) => ({ ...f, contact_phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cust-email">Email</Label>
                  <Input id="cust-email" type="email" value={customerForm.contact_email} onChange={(e) => setCustomerForm((f) => ({ ...f, contact_email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cust-address">Address</Label>
                  <Input id="cust-address" value={customerForm.address} onChange={(e) => setCustomerForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditCustomerDialog(false)} disabled={savingCustomer}>Cancel</Button>
                <Button
                  disabled={savingCustomer || !vendor}
                  onClick={async () => {
                    if (!vendor) return;
                    setSavingCustomer(true);
                    await updateVendor(vendor.id, {
                      name: customerForm.name.trim(),
                      contact_phone: customerForm.contact_phone.trim() || null,
                      contact_email: customerForm.contact_email.trim() || null,
                      address: customerForm.address.trim() || null,
                    });
                    setSavingCustomer(false);
                    setShowEditCustomerDialog(false);
                  }}
                >
                  {savingCustomer ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>



          {/* Billing Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Billing Information</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPaymentInfo({
                    name: quote.paymentContactName || '',
                    email: quote.paymentContactEmail || '',
                    company: quote.paymentContactCompany || '',
                  });
                  setShowEditPaymentDialog(true);
                }}
              >
                Edit
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Name:</span>
                  <span>{quote.paymentContactName || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{quote.paymentContactEmail || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Company:</span>
                  <span>{quote.paymentContactCompany || '—'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Dialog open={showEditPaymentDialog} onOpenChange={setShowEditPaymentDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Billing Information</DialogTitle>
                <DialogDescription>Update the payment contact details for this sales order.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pay-name">Name</Label>
                  <Input id="pay-name" value={paymentInfo.name} onChange={(e) => setPaymentInfo((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay-email">Email</Label>
                  <Input id="pay-email" type="email" value={paymentInfo.email} onChange={(e) => setPaymentInfo((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay-company">Company</Label>
                  <Input id="pay-company" value={paymentInfo.company} onChange={(e) => setPaymentInfo((p) => ({ ...p, company: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditPaymentDialog(false)} disabled={savingPayment}>Cancel</Button>
                <Button
                  disabled={savingPayment}
                  onClick={async () => {
                    setSavingPayment(true);
                    await savePaymentInfo(paymentInfo);
                    setSavingPayment(false);
                    setShowEditPaymentDialog(false);
                  }}
                >
                  {savingPayment ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>


          {/* Notes */}
          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quote.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-6 mt-4">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const links = quote.linkedInvoices || [];
                const linkedSales = links
                  .map((li) => sales.find((x) => x.id === li.saleId))
                  .filter((s): s is NonNullable<typeof s> => !!s);
                const invoiced = linkedSales.reduce((sum, s) => sum + (s.total || 0), 0);
                const paid = linkedSales
                  .filter((s) => s.paidAt)
                  .reduce((sum, s) => sum + (s.total || 0), 0);
                const owing = Math.max(0, quote.total - paid);
                return (
                  <div className="flex flex-col items-end gap-1 text-sm">
                    <div className="flex justify-between w-56">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>${quote.subtotal.toFixed(2)}</span>
                    </div>
                    {quote.discountRate > 0 && (
                      <div className="flex justify-between w-56">
                        <span className="text-muted-foreground">Discount ({quote.discountRate}%):</span>
                        <span>-${quote.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {quote.taxRate > 0 && (
                      <div className="flex justify-between w-56">
                        <span className="text-muted-foreground">Tax ({quote.taxRate}%):</span>
                        <span>${quote.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between w-56 font-bold border-t pt-1 mt-1">
                      <span>Total:</span>
                      <span>{formatCurrency(quote.total)}</span>
                    </div>
                    <div className="flex justify-between w-56 text-muted-foreground">
                      <span>Invoiced:</span>
                      <span>{formatCurrency(invoiced)}</span>
                    </div>
                    <div className="flex justify-between w-56 text-muted-foreground">
                      <span>Paid:</span>
                      <span>{formatCurrency(paid)}</span>
                    </div>
                    <div className={`flex justify-between w-56 font-bold border-t pt-1 mt-1 ${owing > 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      <span>Owing:</span>
                      <span>{formatCurrency(owing)}</span>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>


          {/* Quote card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Quote
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-3">
                <div className="space-y-1">
                  <Link
                    to={`/quotes?quoteId=${quote.id}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    {quote.quoteNumber}
                  </Link>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>Created: {format(new Date(quote.createdAt), 'MMM d, yyyy')}</div>
                    {quote.validUntil && (
                      <div>Valid until: {format(new Date(quote.validUntil), 'MMM d, yyyy')}</div>
                    )}
                    {quote.vendorName && <div>Customer: {quote.vendorName}</div>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-lg font-bold">{formatCurrency(quote.total)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoices card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Invoices
                {(quote.linkedInvoices || []).length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {quote.linkedInvoices.length}
                  </Badge>
                )}
              </CardTitle>
              {quote.invoicedPercentage < 100 && (
                <Button
                  size="sm"
                  onClick={() => {
                    setInvoiceRemainingPct(100 - quote.invoicedPercentage);
                    setShowInvoiceRemainingDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Invoice Remaining ({100 - quote.invoicedPercentage}%)
                </Button>
              )}
            </CardHeader>
            <CardContent>

              {(() => {
                const links = quote.linkedInvoices || [];
                const rows = links
                  .map((li) => {
                    const s = sales.find((x) => x.id === li.saleId);
                    return { li, sale: s };
                  })
                  .filter((r) => r.sale);
                const totalInvoiced = rows.reduce((sum, r) => sum + (r.sale?.total || 0), 0);
                const paid = rows
                  .filter((r) => r.sale?.paidAt)
                  .reduce((sum, r) => sum + (r.sale?.total || 0), 0);
                const owing = Math.max(0, quote.total - paid);
                const paidPct = quote.total > 0 ? Math.round((paid / quote.total) * 100) : 0;
                const owingPct = Math.max(0, 100 - paidPct);

                return (
                  <div className="space-y-3">
                    {/* Paid / Owing summary */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md border p-3 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
                        <div className="text-xs text-muted-foreground">Paid</div>
                        <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(paid)}
                        </div>
                        <div className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
                          {paidPct}% of total
                        </div>
                      </div>
                      <div className={`rounded-md border p-3 ${owing > 0 ? 'bg-destructive/10 border-destructive/30' : 'bg-muted border-border'}`}>
                        <div className="text-xs text-muted-foreground">Owing</div>
                        <div className={`text-lg font-bold ${owing > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {formatCurrency(owing)}
                        </div>
                        <div className={`text-xs ${owing > 0 ? 'text-destructive/80' : 'text-muted-foreground'}`}>
                          {owingPct}% of total
                        </div>
                      </div>
                    </div>

                    {rows.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        No invoices linked to this sales order yet.
                      </p>
                    ) : (
                      <>
                        {rows.map(({ li, sale }) => (
                          <div
                            key={li.saleId}
                            className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-3"
                          >
                            <div className="space-y-1">
                              <Link
                                to={`/sales/${sale!.id}`}
                                className="text-sm font-semibold text-primary hover:underline"
                              >
                                {sale!.invoiceNumber}
                              </Link>
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                <div>Created: {format(new Date(sale!.createdAt), 'MMM d, yyyy')}</div>
                                {sale!.dueDate && (
                                  <div>Due: {format(new Date(sale!.dueDate), 'MMM d, yyyy')}</div>
                                )}
                                {sale!.paidAt && (
                                  <div>Paid: {format(new Date(sale!.paidAt), 'MMM d, yyyy')}</div>
                                )}
                                {li.percentage > 0 && li.percentage < 100 && (
                                  <div>Portion: {li.percentage}%</div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">Total</div>
                              <div className="text-lg font-bold">{formatCurrency(sale!.total)}</div>
                            </div>
                          </div>
                        ))}
                        {rows.length > 1 && (
                          <div className="flex justify-end pt-2 text-sm">
                            <span className="text-muted-foreground mr-2">Total Invoiced:</span>
                            <span className="font-bold">{formatCurrency(totalInvoiced)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Invoice Remaining Dialog */}
          <Dialog open={showInvoiceRemainingDialog} onOpenChange={setShowInvoiceRemainingDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Invoice</DialogTitle>
                <DialogDescription>
                  Choose what percentage of {quote.quoteNumber} to invoice.
                  {quote.invoicedPercentage > 0 && (
                    <span className="block mt-1">
                      Already invoiced: {quote.invoicedPercentage}% — {100 - quote.invoicedPercentage}% remaining
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Percentage to invoice</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100 - quote.invoicedPercentage}
                    value={invoiceRemainingPct}
                    onChange={(e) => setInvoiceRemainingPct(Number(e.target.value))}
                  />
                  {invoiceRemainingPct > 100 - quote.invoicedPercentage && (
                    <p className="text-sm text-destructive">
                      Cannot exceed {100 - quote.invoicedPercentage}%
                    </p>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Invoice total: {formatCurrency(quote.total * (invoiceRemainingPct / 100))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowInvoiceRemainingDialog(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={
                    invoiceRemainingPct < 1 ||
                    invoiceRemainingPct > 100 - quote.invoicedPercentage
                  }
                  onClick={async () => {
                    await convertToInvoice(quote, invoiceRemainingPct);
                    setShowInvoiceRemainingDialog(false);
                  }}
                >
                  Create Invoice ({invoiceRemainingPct}%)
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

    </div>
  );
}
