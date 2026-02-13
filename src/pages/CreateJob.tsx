import { useState } from 'react';
import { ArrowLeft, User, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useJobs } from '@/hooks/useJobs';
import { useCustomers } from '@/hooks/useCustomers';
import { Link, useNavigate } from 'react-router-dom';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'in-production', label: 'In Production' },
  { value: 'welding-done', label: 'Welding Done' },
  { value: 'painting-done', label: 'Painting Done' },
  { value: 'finished', label: 'Finished' },
  
  { value: 'cancelled', label: 'Cancelled' },
];

export function CreateJob() {
  const navigate = useNavigate();
  const { createJob } = useJobs();
  const { customers } = useCustomers();

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState('open');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerEmail, setFormCustomerEmail] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formCustomerAddress, setFormCustomerAddress] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [saving, setSaving] = useState(false);

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

  const handleCreate = async () => {
    if (!formTitle.trim()) return;
    setSaving(true);
    const result = await createJob(formTitle.trim(), formDescription.trim() || undefined, formStatus, {
      name: formCustomerName.trim() || undefined,
      email: formCustomerEmail.trim() || undefined,
      phone: formCustomerPhone.trim() || undefined,
      address: formCustomerAddress.trim() || undefined,
    }, formDueDate ? (() => { const [y, m, d] = formDueDate.split('-').map(Number); return new Date(y, m - 1, d, 12, 0, 0).toISOString(); })() : undefined);
    setSaving(false);
    if (result) navigate('/jobs');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-24 items-center gap-4">
            <Link to="/jobs">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Create New Job</h1>
              <p className="text-sm text-muted-foreground font-medium tracking-wide">Add a new job to track work and inventory usage</p>
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
              <Label>Description</Label>
              <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Optional description" rows={3} />
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
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link to="/jobs">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleCreate} disabled={!formTitle.trim() || saving}>
            {saving ? 'Creating...' : 'Create Job'}
          </Button>
        </div>
      </main>
    </div>
  );
}
