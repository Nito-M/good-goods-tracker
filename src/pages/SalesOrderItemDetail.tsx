import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, Briefcase, CalendarIcon, Hash, FileText, ClipboardList, Save, Upload, Download, Trash2, FileIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuotes } from '@/hooks/useQuotes';
import { useJobs } from '@/hooks/useJobs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatCurrency } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'shipped', label: 'Shipped' },
];

interface ItemLinkRow {
  id: string;
  job_id: string | null;
  status: string;
  external_job_number: string | null;
  external_due_date: string | null;
  external_notes: string | null;
}

interface NvisFileRow {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export function SalesOrderItemDetail() {
  const { id, quoteItemId, unitIndex } = useParams<{
    id: string;
    quoteItemId: string;
    unitIndex: string;
  }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { quotes, loading: quotesLoading } = useQuotes();
  const { jobs } = useJobs();

  const unitIdx = parseInt(unitIndex || '0', 10);
  const quote = useMemo(() => quotes.find((q) => q.id === id), [quotes, id]);
  const item = useMemo(
    () => quote?.items.find((i) => i.id === quoteItemId) || null,
    [quote, quoteItemId]
  );

  const [link, setLink] = useState<ItemLinkRow | null>(null);
  const [addons, setAddons] = useState<Array<{ id: string; itemName: string; sku: string; notes: string | null }>>([]);
  const [nvisFiles, setNvisFiles] = useState<NvisFileRow[]>([]);
  const [uploadingNvis, setUploadingNvis] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable external fields
  const [externalJobNumber, setExternalJobNumber] = useState('');
  const [externalDueDate, setExternalDueDate] = useState<Date | undefined>();
  const [externalNotes, setExternalNotes] = useState('');
  const [status, setStatus] = useState('pending');

  const linkKey = `${quoteItemId}-${unitIdx}`;

  const load = useCallback(async () => {
    if (!id || !quoteItemId) return;
    setLoading(true);

    const { data: linkData } = await supabase
      .from('so_item_job_links' as any)
      .select('*')
      .eq('quote_id', id)
      .eq('quote_item_id', quoteItemId)
      .eq('unit_index', unitIdx)
      .maybeSingle();

    if (linkData) {
      const l = linkData as any as ItemLinkRow;
      setLink(l);
      setStatus(l.status || 'pending');
      setExternalJobNumber(l.external_job_number || '');
      setExternalNotes(l.external_notes || '');
      setExternalDueDate(l.external_due_date ? new Date(l.external_due_date) : undefined);
    } else {
      setLink(null);
      setStatus('pending');
    }

    const { data: attachData } = await supabase
      .from('so_item_attachments' as any)
      .select('*')
      .eq('quote_id', id)
      .eq('parent_quote_item_id', quoteItemId)
      .eq('parent_unit_index', unitIdx);

    if (attachData && quote) {
      const rows = (attachData as any[]).map((a) => {
        const childItem = quote.items.find((qi) => qi.id === a.child_quote_item_id);
        return childItem
          ? { id: `${childItem.id}-${a.child_unit_index}`, itemName: childItem.itemName, sku: childItem.sku, notes: childItem.notes }
          : null;
      }).filter(Boolean) as any[];
      setAddons(rows);
    } else {
      setAddons([]);
    }
    setLoading(false);
  }, [id, quoteItemId, unitIdx, quote]);

  useEffect(() => { load(); }, [load]);

  const linkedJob = link?.job_id ? jobs.find((j) => j.id === link.job_id) : null;

  const upsertLink = async (patch: Partial<ItemLinkRow> & { status?: string }) => {
    if (!id || !quoteItemId) return;
    const payload: any = {
      quote_id: id,
      quote_item_id: quoteItemId,
      unit_index: unitIdx,
      status: patch.status ?? status ?? 'pending',
      ...patch,
    };
    const { error } = await (supabase.from('so_item_job_links' as any) as any).upsert(
      payload,
      { onConflict: 'quote_item_id,unit_index' }
    );
    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSaveExternal = async () => {
    setSaving(true);
    const ok = await upsertLink({
      external_job_number: externalJobNumber.trim() || null,
      external_due_date: externalDueDate ? externalDueDate.toISOString() : null,
      external_notes: externalNotes.trim() || null,
      status,
    });
    setSaving(false);
    if (ok) {
      toast({ title: 'Saved' });
      await load();
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    await upsertLink({ status: newStatus });
  };

  const handleUnlinkJob = async () => {
    if (!link) return;
    await (supabase.from('so_item_job_links' as any) as any)
      .update({ job_id: null })
      .eq('id', link.id);
    toast({ title: 'Job unlinked' });
    await load();
  };

  const handleLinkExistingJob = async (jobId: string) => {
    const ok = await upsertLink({ job_id: jobId, status });
    if (ok) {
      toast({ title: 'Linked to job' });
      await load();
    }
  };

  const handleClear = async () => {
    if (!link) return;
    await supabase.from('so_item_job_links' as any).delete().eq('id', link.id);
    toast({ title: 'Marker removed' });
    await load();
  };

  if (quotesLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quote || !item) {
    return (
      <div className="space-y-4">
        <Link to="/sales-orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Sales Orders
        </Link>
        <p className="text-muted-foreground">Item not found.</p>
      </div>
    );
  }

  const displayJobNumber = linkedJob?.jobNumber || link?.external_job_number || null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to={`/sales-orders/${id}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{item.itemName}</h1>
          <p className="text-sm text-muted-foreground">
            Item detail · Unit {unitIdx + 1}
          </p>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Quote #:</span>
            <span>{quote.quoteNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Sales Order #:</span>
            <span>{quote.salesOrderNumber || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Job #:</span>
            {linkedJob ? (
              <Link to={`/jobs/${linkedJob.id}`} className="text-primary hover:underline">
                {linkedJob.jobNumber}
              </Link>
            ) : displayJobNumber ? (
              <span>{displayJobNumber} <Badge variant="outline" className="ml-1 text-[10px]">external</Badge></span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">SKU:</span>
            <span>{item.sku || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Due date:</span>
            <span>
              {linkedJob?.dueDate
                ? format(new Date(linkedJob.dueDate), 'MMM d, yyyy')
                : link?.external_due_date
                ? format(new Date(link.external_due_date), 'MMM d, yyyy')
                : '—'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Unit Price:</span>
            <span>{formatCurrency(item.unitPrice)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Status & Job linking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status & Job</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Link to existing Job</Label>
              <Select
                value={link?.job_id || ''}
                onValueChange={handleLinkExistingJob}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job…" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.jobNumber || '(no number)'} — {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {link?.job_id && (
                <Button variant="ghost" size="sm" onClick={handleUnlinkJob} className="h-7 text-xs">
                  Unlink job
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* External job (created outside the app) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mark as Job Created (external)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Use this if the job was created outside the app. Record its job number, due date, and any notes.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ext-job-num">Job Number</Label>
              <Input
                id="ext-job-num"
                value={externalJobNumber}
                onChange={(e) => setExternalJobNumber(e.target.value)}
                placeholder="e.g. JOB-1234"
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !externalDueDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {externalDueDate ? format(externalDueDate, 'MMM d, yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={externalDueDate} onSelect={setExternalDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ext-notes">Notes</Label>
            <Textarea
              id="ext-notes"
              value={externalNotes}
              onChange={(e) => setExternalNotes(e.target.value)}
              placeholder="Any details about this externally-created job…"
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between">
            <Button onClick={handleSaveExternal} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
            {link && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="text-destructive">
                Clear all markers
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Item notes */}
      {item.notes && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Item Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{item.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Add-ons */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Add-ons ({addons.length})</CardTitle></CardHeader>
        <CardContent>
          {addons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No add-ons attached to this unit.</p>
          ) : (
            <ul className="space-y-2">
              {addons.map((a) => (
                <li key={a.id} className="border rounded-md p-3">
                  <div className="font-medium text-sm">{a.itemName}</div>
                  {a.sku && <div className="text-xs text-muted-foreground">SKU: {a.sku}</div>}
                  {a.notes && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{a.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SalesOrderItemDetail;
