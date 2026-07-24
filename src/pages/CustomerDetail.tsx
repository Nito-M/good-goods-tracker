import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, ExternalLink, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCustomers } from '@/hooks/useCustomers';
import { useJobs } from '@/hooks/useJobs';
import { useSales } from '@/hooks/useSales';
import { useQuotes } from '@/hooks/useQuotes';
import { CustomerContactsManager } from '@/components/CustomerContactsManager';
import { CustomerNotesList } from '@/components/CustomerNotesList';
import { CustomerFilesSection } from '@/components/CustomerFilesSection';
import { CustomerLinksSection } from '@/components/CustomerLinksSection';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, loading, deleteCustomer, updateCustomer } = useCustomers();
  const { jobs } = useJobs();
  const { sales } = useSales();
  const { quotes } = useQuotes();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const customer = customers.find((c) => c.id === id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading customer...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Customer not found</p>
        <Button variant="outline" onClick={() => navigate('/settings')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Settings
        </Button>
      </div>
    );
  }

  const customerJobs = (jobs || [])
    .filter((j) => j.customerId === customer.id || (customer.name && j.customerName === customer.name))
    .sort((a, b) => (b.dueDate || '').localeCompare(a.dueDate || ''));

  const nameLower = (customer.name || '').toLowerCase();
  const emailLower = (customer.email || '').toLowerCase();
  const matchesCustomer = (contact?: string | null, email?: string | null) => {
    const c = (contact || '').toLowerCase().trim();
    const e = (email || '').toLowerCase().trim();
    if (nameLower && c && c === nameLower) return true;
    if (emailLower && e && e === emailLower) return true;
    return false;
  };

  const customerSales = (sales || [])
    .filter((s: any) => matchesCustomer(s.contactPersonName, s.contactEmail))
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const totalInvoiced = customerSales.reduce((sum: number, s: any) => sum + Number(s.total || 0), 0);

  const customerQuotes = (quotes || [])
    .filter((q: any) => matchesCustomer(q.contactPersonName, q.contactEmail))
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleDelete = async () => {
    await deleteCustomer(customer.id);
    navigate('/settings');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                {customer.color && (
                  <div className="h-8 w-8 rounded-full border border-border shrink-0" style={{ backgroundColor: customer.color }} />
                )}
                <div>
                  <h1 className="text-xl font-bold text-card-foreground">{customer.name}</h1>
                  <p className="text-sm text-muted-foreground">Customer Details</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/settings?tab=customers')}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground">{customer.company}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${customer.email}`} className="text-sm hover:underline text-primary">{customer.email}</a>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${customer.phone}`} className="text-sm hover:underline text-primary">{customer.phone}</a>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground whitespace-pre-line">{customer.address}</span>
                </div>
              )}
              {customer.link && (
                <div className="flex items-center gap-3">
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={customer.link} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline text-primary truncate">
                    {customer.link}
                  </a>
                </div>
              )}
              {!customer.company && !customer.email && !customer.phone && !customer.address && !customer.link && (
                <p className="text-sm text-muted-foreground">No contact information added yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Jobs</span>
                <Badge variant="secondary">{customerJobs.length}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Quotes</span>
                <Badge variant="secondary">{customerQuotes.length}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Invoices</span>
                <Badge variant="secondary">{customerSales.length}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Invoiced</span>
                <span className="font-semibold text-foreground">${totalInvoiced.toFixed(2)}</span>
              </div>
              {customer.category && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <Badge variant="outline">{customer.category}</Badge>
                  </div>
                </>
              )}
              {customer.color && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Color</span>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: customer.color }} />
                      <span className="text-sm text-foreground">{customer.color}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <CustomerContactsManager customerId={customer.id} />

        <Card>
          <CardHeader><CardTitle className="text-lg">Links</CardTitle></CardHeader>
          <CardContent><CustomerLinksSection customerId={customer.id} /></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Files &amp; PDFs</CardTitle></CardHeader>
          <CardContent><CustomerFilesSection customerId={customer.id} /></CardContent>
        </Card>

        <CustomerNotesList
          customerId={customer.id}
          legacyNote={customer.notes}
          onMigrateLegacy={async () => { await updateCustomer(customer.id, { notes: null } as any); }}
        />

        {customerJobs.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Jobs</CardTitle></CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {customerJobs.slice(0, 30).map((job) => (
                  <Link key={job.id} to={`/jobs/${job.id}/description`}
                    className="flex items-center justify-between py-3 hover:bg-muted/50 rounded px-2 -mx-2 transition-colors">
                    <div>
                      <div className="font-medium text-sm">{job.jobNumber || job.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {job.title}
                        {job.dueDate ? ` · Due ${new Date(job.dueDate).toLocaleDateString()}` : ''}
                      </div>
                    </div>
                    <Badge variant="secondary">{job.status}</Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {customerSales.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Recent Invoices</CardTitle></CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {customerSales.slice(0, 20).map((sale: any) => (
                  <Link key={sale.id} to={`/sales/${sale.id}`}
                    className="flex items-center justify-between py-3 hover:bg-muted/50 rounded px-2 -mx-2 transition-colors">
                    <div>
                      <div className="font-medium text-sm">{sale.invoiceNumber}</div>
                      <div className="text-xs text-muted-foreground">{new Date(sale.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">${Number(sale.total || 0).toFixed(2)}</span>
                      <Badge variant={sale.status === 'paid' ? 'default' : 'secondary'}>{sale.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {customerQuotes.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Recent Quotes</CardTitle></CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {customerQuotes.slice(0, 20).map((quote: any) => (
                  <Link key={quote.id} to={`/quotes`}
                    className="flex items-center justify-between py-3 hover:bg-muted/50 rounded px-2 -mx-2 transition-colors">
                    <div>
                      <div className="font-medium text-sm">{quote.quoteNumber || quote.salesOrderNumber}</div>
                      <div className="text-xs text-muted-foreground">{new Date(quote.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">${Number(quote.total || 0).toFixed(2)}</span>
                      <Badge variant="secondary">{quote.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "{customer.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default CustomerDetail;
