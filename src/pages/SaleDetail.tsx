import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Eye, Pencil, Calendar, FileText, Building2, Package, Send, DollarSign, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSales } from '@/hooks/useSales';
import { useVendors } from '@/hooks/useVendors';
import { useProfile } from '@/hooks/useProfile';
import { useCompanies } from '@/hooks/useCompanies';
import { InvoiceSettings, Sale, SaleStatus } from '@/types/sale';
import { generateInvoicePDF } from '@/lib/invoiceGenerator';
import { InvoicePreviewDialog } from '@/components/InvoicePreviewDialog';
import { EditSaleDialog } from '@/components/EditSaleDialog';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const statusLabel: Record<Exclude<SaleStatus, 'picked_up'>, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'outline' },
  paid: { label: 'Paid', variant: 'default' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
};

function fmtDateTime(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SaleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sales, loading, updateInternalNotes, updateSale } = useSales();
  const { profile } = useProfile();
  const { companies } = useCompanies();
  const { vendors } = useVendors();

  const sale = useMemo(() => sales.find((s) => s.id === id), [sales, id]);

  const [internalNotes, setInternalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    setInternalNotes(sale?.internalNotes || '');
  }, [sale?.id, sale?.internalNotes]);

  const invoiceSettings: InvoiceSettings = useMemo(() => ({
    businessName: profile?.businessName || null,
    businessAddress: profile?.businessAddress || null,
    businessPhone: profile?.businessPhone || null,
    businessEmail: profile?.businessEmail || null,
    businessNumber: profile?.businessNumber || null,
    thankYouNote: profile?.invoiceThankYouNote || null,
    logoUrl: profile?.logoUrl || null,
    layout: profile?.invoiceLayout || null,
  }), [profile]);

  const settingsForSale: InvoiceSettings = useMemo(() => {
    if (!sale) return invoiceSettings;
    const companyId = (sale as any).companyId;
    const company = companyId ? companies.find((c) => c.id === companyId) : null;
    if (company) {
      return {
        businessName: company.name,
        businessAddress: company.address,
        businessPhone: company.phone,
        businessEmail: company.email,
        businessNumber: company.businessNumber,
        logoUrl: company.logoUrl,
        thankYouNote: company.invoiceThankYouNote || invoiceSettings.thankYouNote,
        layout: company.invoiceLayout || invoiceSettings.layout,
      };
    }
    return invoiceSettings;
  }, [sale, companies, invoiceSettings]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Loading invoice…</p>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Button variant="ghost" onClick={() => navigate('/sales')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sales
        </Button>
        <p className="text-muted-foreground">Invoice not found.</p>
      </div>
    );
  }

  const isPickedUp = !!sale.pickedUpAt;
  const statusBadges: JSX.Element[] = [];
  if (isPickedUp) {
    statusBadges.push(
      <Badge key="picked" variant="default" className="bg-primary">
        <Package className="h-3 w-3 mr-1" />
        Picked Up
      </Badge>
    );
  }
  if (sale.status !== 'picked_up') {
    const cfg = statusLabel[sale.status as Exclude<SaleStatus, 'picked_up'>] || statusLabel.sent;
    statusBadges.push(
      <Badge key="status" variant={cfg.variant}>
        {cfg.label}
      </Badge>
    );
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    const ok = await updateInternalNotes(sale.id, internalNotes.trim() ? internalNotes : null);
    setSavingNotes(false);
    if (ok) {
      toast({ title: 'Internal notes saved' });
    }
  };

  const handleDownload = async () => {
    try {
      await generateInvoicePDF(sale, settingsForSale);
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to generate PDF', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="ghost" onClick={() => navigate('/sales')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sales
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-3xl font-bold">{sale.invoiceNumber}</h1>
        {statusBadges}
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TimelineRow icon={<Calendar className="h-4 w-4" />} label="Created" value={fmtDateTime(sale.createdAt)} />
          <TimelineRow icon={<Send className="h-4 w-4" />} label="Sent" value={fmtDateTime(sale.sentAt)} />
          <TimelineRow icon={<Package className="h-4 w-4" />} label="Picked Up" value={fmtDateTime(sale.pickedUpAt)} />
          <TimelineRow icon={<DollarSign className="h-4 w-4" />} label="Paid" value={fmtDateTime(sale.paidAt)} />
          <TimelineRow icon={<Calendar className="h-4 w-4" />} label="Due Date" value={sale.dueDate ? new Date(sale.dueDate).toLocaleDateString() : '—'} />
          <TimelineRow icon={<FileText className="h-4 w-4" />} label="Payment Terms" value={sale.paymentTerms || '—'} />
        </CardContent>
      </Card>

      {/* Customer */}
      {(sale.vendorName || sale.contactPersonName || sale.vendorAddress) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Bill To
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {sale.vendorName && <div className="font-medium">{sale.vendorName}</div>}
            {sale.contactPersonName && <div>Attn: {sale.contactPersonName}</div>}
            {sale.vendorAddress && <div className="whitespace-pre-line text-muted-foreground">{sale.vendorAddress}</div>}
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items ({sale.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Part #</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                {isPickedUp && <TableHead className="text-right">Unit Cost</TableHead>}
                <TableHead className="text-right">Total</TableHead>
                {isPickedUp && <TableHead className="text-right">Profit</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                  {isPickedUp && <TableCell className="text-right">{formatCurrency(item.unitCost)}</TableCell>}
                  <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                  {isPickedUp && (
                    <TableCell className="text-right text-green-600">{formatCurrency(item.profit)}</TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
            <Row label="Subtotal" value={formatCurrency(sale.subtotal)} />
            {sale.discountAmount > 0 && (
              <Row label={`Discount (${sale.discountRate}%)`} value={`-${formatCurrency(sale.discountAmount)}`} muted />
            )}
            {sale.taxAmount > 0 && (
              <Row label={`Tax (${sale.taxRate}%)`} value={formatCurrency(sale.taxAmount)} />
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
            {isPickedUp && sale.totalCost > 0 && (
              <>
                <Row label="Cost" value={formatCurrency(sale.totalCost)} muted />
                <div className="flex justify-between font-semibold text-green-600">
                  <span>Profit</span>
                  <span>{formatCurrency(sale.totalProfit)}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Notes (PDF) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Invoice Notes
            <span className="text-xs font-normal text-muted-foreground">(visible on PDF)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sale.notes ? (
            <p className="whitespace-pre-line text-sm">{sale.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No invoice notes. Edit the invoice to add notes that appear on the PDF.</p>
          )}
        </CardContent>
      </Card>

      {/* Internal Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" /> Internal Notes
            <span className="text-xs font-normal text-muted-foreground">(never on PDF)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Private notes for your team only…"
            rows={5}
          />
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes || internalNotes === (sale.internalNotes || '')}>
              {savingNotes ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <InvoicePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        sale={sale}
        settings={settingsForSale}
        onDownload={handleDownload}
      />

      <EditSaleDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        sale={sale}
        onSave={async (input) => {
          const ok = await updateSale(sale.id, input as any);
          if (ok) setEditOpen(false);
        }}
      />
    </div>
  );
}

function TimelineRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? 'text-muted-foreground' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
