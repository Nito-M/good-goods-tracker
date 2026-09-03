import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJobs } from '@/hooks/useJobs';
import { useCustomers } from '@/hooks/useCustomers';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  
  { value: 'welding-done', label: 'Welding Done' },
  { value: 'painting-done', label: 'Painting Done' },
  { value: 'finished', label: 'Finished' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'picked-up', label: 'Picked Up / Sold' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function EditJob() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { jobs, loading, updateJob } = useJobs();
  const { customers } = useCustomers();

  const job = jobs.find(j => j.id === jobId);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState('open');
  const [formJobNumber, setFormJobNumber] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerEmail, setFormCustomerEmail] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formCustomerAddress, setFormCustomerAddress] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formNvisLink, setFormNvisLink] = useState('');
  const [saving, setSaving] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = descRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, [formDescription]);

  useEffect(() => {
    if (job) {
      setFormTitle(job.title);
      setFormDescription(job.description || '');
      setFormStatus(job.status);
      setFormJobNumber(job.jobNumber || '');
      setFormCustomerName(job.customerName || '');
      setFormCustomerEmail(job.customerEmail || '');
      setFormCustomerPhone(job.customerPhone || '');
      setFormCustomerAddress(job.customerAddress || '');
      setFormDueDate(job.dueDate ? job.dueDate.split('T')[0] : '');
      setFormWeight(job.weight != null ? String(job.weight) : '');
      setFormNvisLink(job.nvisLink || '');
    }
  }, [job]);

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (customerId === 'none' || !customerId) return;
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormCustomerName(customer.name || '');
      setFormCustomerEmail(customer.email || '');
      setFormCustomerPhone(customer.phone || '');
      setFormCustomerAddress(customer.address || '');
    }
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !jobId) return;
    setSaving(true);
    const updates: Record<string, string | number | null | undefined> = {
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      status: formStatus,
      customer_name: formCustomerName.trim() || null,
      customer_email: formCustomerEmail.trim() || null,
      customer_phone: formCustomerPhone.trim() || null,
      customer_address: formCustomerAddress.trim() || null,
      due_date: formDueDate ? (() => { const [y, m, d] = formDueDate.split('-').map(Number); return new Date(y, m - 1, d, 12, 0, 0).toISOString(); })() : null,
      weight: formWeight.trim() === '' ? null : Number(formWeight),
      nvis_link: formNvisLink.trim() || null,
    };
    if (formJobNumber.trim() !== (job?.jobNumber || '')) {
      updates.job_number = formJobNumber.trim() || undefined;
    }
    const ok = await updateJob(jobId, updates);
    setSaving(false);
    if (ok) navigate(`/jobs/${jobId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Job not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-24 items-center gap-4">
            <Link to={`/jobs/${jobId}`}>
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Edit Job</h1>
              <p className="text-sm text-muted-foreground font-medium tracking-wide">Update job details and customer information</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Job title" />
            </div>
            <div>
              <Label>Job Number</Label>
              <Input value={formJobNumber} onChange={e => setFormJobNumber(e.target.value)} placeholder="e.g. JOB-0001" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea ref={descRef} value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Job description" rows={3} className="resize-none overflow-hidden" />
            </div>
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
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} />
            </div>
            <div>
              <Label>Weight (lbs)</Label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={formWeight}
                onChange={e => setFormWeight(e.target.value)}
                placeholder="e.g. 1250"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Customer Details</CardTitle>
          </CardHeader>
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
              <Input value={formCustomerName} onChange={e => setFormCustomerName(e.target.value)} placeholder="Customer name" />
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />Email</Label>
              <Input type="email" value={formCustomerEmail} onChange={e => setFormCustomerEmail(e.target.value)} placeholder="customer@example.com" />
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />Phone</Label>
              <Input value={formCustomerPhone} onChange={e => setFormCustomerPhone(e.target.value)} placeholder="Phone number" />
            </div>
            <div>
              <Label className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Address</Label>
              <Textarea value={formCustomerAddress} onChange={e => setFormCustomerAddress(e.target.value)} placeholder="Customer address" rows={2} />
            </div>
            <div>
              <Label className="flex items-center gap-1.5">NVIS Link</Label>
              <Input value={formNvisLink} onChange={e => setFormNvisLink(e.target.value)} placeholder="https://example.com/nvis" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to={`/jobs/${jobId}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSave} disabled={!formTitle.trim() || saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </main>
    </div>
  );
}
