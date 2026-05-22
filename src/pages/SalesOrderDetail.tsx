import { useState, useMemo, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuotes } from '@/hooks/useQuotes';
import { useVendors } from '@/hooks/useVendors';
import { useJobs } from '@/hooks/useJobs';
import { useProfile } from '@/hooks/useProfile';
import { useCompanies } from '@/hooks/useCompanies';
import { generateQuotePDF } from '@/lib/quoteGenerator';
import { QuoteSettings } from '@/types/quote';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Briefcase, Loader2, User, Phone, Mail, MapPin, ChevronDown, CheckCircle, Clock, Hash, CalendarIcon, Trash2, Plus, Download } from 'lucide-react';
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
};

export function SalesOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quotes, loading: quotesLoading } = useQuotes();
  const { vendors, loading: vendorsLoading } = useVendors();
  const { createJob } = useJobs();
  const { profile } = useProfile();
  const { companies } = useCompanies();
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
  const [creatingJobFor, setCreatingJobFor] = useState<string | null>(null);
  const [updatingStatusFor, setUpdatingStatusFor] = useState<string | null>(null);

  const loading = quotesLoading || vendorsLoading;
  const quote = useMemo(() => quotes.find((q) => q.id === id), [quotes, id]);

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
  const handleCreateJobForItem = async (item: ExpandedItem) => {
    if (!quote) return;
    setCreatingJobFor(item.linkKey);
    try {
      const job = await createJob(
        item.itemName,
        item.notes || undefined,
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

  // Create one separate job per unlinked item
  const handleCreateAllJobs = async () => {
    if (!quote || expandedItems.length === 0) return;
    setCreating(true);
    try {
      for (const item of expandedItems) {
        if (itemLinks[item.linkKey]?.jobId) continue; // already linked

        const job = await createJob(
          item.itemName,
          item.notes || undefined,
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
                  className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Briefcase className="h-3 w-3" />
                  Jobs Created
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
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="customer">Customer & Details</TabsTrigger>
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
                <DropdownMenuItem onClick={handleCreateAllJobs}>
                  <Briefcase className="h-4 w-4 mr-2" />
                  Create All Jobs
                </DropdownMenuItem>
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
              <CardTitle className="text-lg">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Job</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expandedItems.map((item) => {
                      const link = itemLinks[item.linkKey];
                      const statusKey = link?.status ?? 'pending';
                      const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending;
                      const isCreatingThis = creatingJobFor === item.linkKey;
                      const isUpdatingThis = updatingStatusFor === item.linkKey;

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div>
                              <span>{item.itemName}</span>
                              {item.notes && (
                                <p className="text-xs text-muted-foreground font-normal mt-0.5">{item.notes}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.sku || '—'}</TableCell>
                          <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>

                          {/* Per-item status */}
                          <TableCell className="text-center">
                            {link ? (
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

                          {/* Per-item: add to shared job / linked indicator */}
                          <TableCell className="text-center">
                            {link?.jobId ? (
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
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer" className="space-y-6 mt-4">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
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

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-end gap-1 text-sm">
                <div className="flex justify-between w-48">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>${quote.subtotal.toFixed(2)}</span>
                </div>
                {quote.discountRate > 0 && (
                  <div className="flex justify-between w-48">
                    <span className="text-muted-foreground">Discount ({quote.discountRate}%):</span>
                    <span>-${quote.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {quote.taxRate > 0 && (
                  <div className="flex justify-between w-48">
                    <span className="text-muted-foreground">Tax ({quote.taxRate}%):</span>
                    <span>${quote.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between w-48 font-bold border-t pt-1 mt-1">
                  <span>Total:</span>
                  <span>${quote.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

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
      </Tabs>

    </div>
  );
}
