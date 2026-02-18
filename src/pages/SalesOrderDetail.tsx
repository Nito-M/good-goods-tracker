import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuotes } from '@/hooks/useQuotes';
import { useVendors } from '@/hooks/useVendors';
import { useJobs } from '@/hooks/useJobs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Briefcase, Loader2, User, Phone, Mail, MapPin, ChevronDown, CheckCircle, Clock, Hash, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export function SalesOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quotes, loading: quotesLoading } = useQuotes();
  const { vendors, loading: vendorsLoading } = useVendors();
  const { createJob } = useJobs();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [jobNumber, setJobNumber] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();

  const loading = quotesLoading || vendorsLoading;

  const quote = useMemo(() => quotes.find((q) => q.id === id), [quotes, id]);

  const vendor = useMemo(() => {
    if (!quote?.vendorId) return null;
    return vendors.find((v) => v.id === quote.vendorId) || null;
  }, [quote, vendors]);

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

  const handleCreateJob = async () => {
    if (!quote || quote.items.length === 0) return;
    setCreating(true);
    try {
      let firstJobId: string | null = null;

      for (let i = 0; i < quote.items.length; i++) {
        const item = quote.items[i];

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
          i === 0 ? (jobNumber || undefined) : undefined
        );

        if (!job) continue;

        if (i === 0) firstJobId = job.id;

        // Add only this item to this job
        const { error } = await supabase.from('job_items').insert({
          job_id: job.id,
          inventory_item_id: item.inventoryItemId || null,
          item_name: item.itemName,
          sku: item.sku || '',
          quantity: item.quantity,
          unit_price: item.unitPrice,
          notes: item.notes || null,
        });

        if (error) {
          console.error('Error adding job item:', error);
        }
      }

      // Link quote to first job for the "Job Created" badge
      if (firstJobId) {
        await supabase
          .from('quotes')
          .update({ converted_to_job_id: firstJobId } as any)
          .eq('id', quote.id);

        navigate(`/jobs/${firstJobId}`);
      }
    } catch (err) {
      console.error('Error creating jobs:', err);
      toast({ title: 'Error creating jobs', variant: 'destructive' });
    } finally {
      setCreating(false);
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
              <h1 className="text-2xl font-bold text-foreground">{quote.quoteNumber}</h1>
              {quote.convertedToJobId && (
                <Link
                  to={`/jobs/${quote.convertedToJobId}`}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Briefcase className="h-3 w-3" />
                  Job Created
                </Link>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Sales Order</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
              <DropdownMenuItem onClick={handleCreateJob}>
                <Briefcase className="h-4 w-4 mr-2" />
                Create Job
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
      </div>

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

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.items.map((item) => (
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
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${item.totalPrice.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-6">
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
    </div>
  );
}
