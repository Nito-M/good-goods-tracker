import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Download, Eye, Pencil, Calendar, FileText, Building2, Package,
  DollarSign, Lock, ClipboardList, Briefcase, CreditCard, Check, ImageIcon, Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useProfile } from '@/hooks/useProfile';
import { useCompanies } from '@/hooks/useCompanies';
import { useBankCards } from '@/hooks/useBankCards';
import { generatePurchaseOrderPDF } from '@/lib/purchaseOrderGenerator';
import { PurchaseOrderPreviewDialog } from '@/components/PurchaseOrderPreviewDialog';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { downloadFileFromUrl, getFileNameFromUrl } from '@/lib/fileDownload';

const TAX_RATE = 0.05;

function fmtDateTime(value?: Date | string | null) {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { orders, loading, updateInternalNotes } = usePurchaseOrders();
  const { profile } = useProfile();
  const { companies } = useCompanies();
  const { cards: bankCards } = useBankCards();

  const order = useMemo(() => orders.find((o) => o.id === id), [orders, id]);

  const [internalNotes, setInternalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setInternalNotes(order?.internalNotes || '');
  }, [order?.id, order?.internalNotes]);

  const settings = useMemo(() => {
    if (!order) return undefined;
    const company = order.companyId
      ? companies.find((c) => c.id === order.companyId)
      : companies.find((c) => c.isDefault) || companies[0] || null;
    if (company) {
      return {
        businessName: company.name,
        businessAddress: company.address,
        businessPhone: company.phone,
        businessEmail: company.email,
        businessNumber: company.businessNumber,
        thankYouNote: company.invoiceThankYouNote || null,
        logoUrl: company.logoUrl,
        layout: company.invoiceLayout || null,
      };
    }
    return profile ? {
      businessName: profile.businessName,
      businessAddress: profile.businessAddress,
      businessPhone: profile.businessPhone,
      businessEmail: profile.businessEmail,
      businessNumber: profile.businessNumber,
      thankYouNote: profile.invoiceThankYouNote,
      logoUrl: profile.logoUrl,
      layout: profile.invoiceLayout || null,
    } : undefined;
  }, [order, companies, profile]);

  if (loading) {
    return <div className="container mx-auto p-6"><p className="text-muted-foreground">Loading purchase order…</p></div>;
  }
  if (!order) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Button variant="ghost" onClick={() => navigate('/purchase-orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Purchase Orders
        </Button>
        <p className="text-muted-foreground">Purchase order not found.</p>
      </div>
    );
  }

  const subtotal = order.items.reduce((s, i) => s + (i.unitCost || 0) * i.quantity, 0);
  const discountAmount = order.discountAmount || 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (order.gstEnabled ?? true) ? afterDiscount * TAX_RATE : 0;
  const pstAmount = afterDiscount * (order.pstPercent || 0) / 100;
  const total = afterDiscount + taxAmount + pstAmount;
  const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
  const totalReceived = order.items.reduce((s, i) => s + (i.receivedQuantity || 0), 0);

  const bankCardName = order.bankCardId ? bankCards.find((c) => c.id === order.bankCardId)?.name ?? null : null;

  const statusBadges: JSX.Element[] = [];
  const statusCfg = {
    draft: { label: 'Draft', cls: 'border-yellow-500 text-yellow-600' },
    ordered: { label: 'Ordered', cls: '' },
    partially_received: { label: 'Partial', cls: 'bg-orange-500 text-white' },
    received: { label: 'Received', cls: 'bg-green-600 text-white' },
  }[order.status];
  statusBadges.push(<Badge key="s" variant={order.status === 'draft' ? 'outline' : 'default'} className={statusCfg.cls}>{statusCfg.label}</Badge>);
  statusBadges.push(
    order.paidAt
      ? <Badge key="p" variant="outline" className="border-blue-500 text-blue-600">Paid</Badge>
      : <Badge key="p" variant="outline" className="border-amber-500 text-amber-600">Unpaid</Badge>
  );

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    const ok = await updateInternalNotes(order.id, internalNotes.trim() ? internalNotes : null);
    setSavingNotes(false);
    if (ok) toast({ title: 'Internal notes saved' });
  };

  const handleDownload = async () => {
    try { await generatePurchaseOrderPDF(order, settings); }
    catch (e) { console.error(e); toast({ title: 'Failed to generate PDF', variant: 'destructive' }); }
  };

  const attachments = order.attachments || [];

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="ghost" onClick={() => navigate('/purchase-orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Purchase Orders
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/purchase-orders/new', { state: { editingOrder: order } })}>
            <Pencil className="h-4 w-4 mr-2" />Edit
          </Button>
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4 mr-2" />Preview
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />Download PDF
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-3xl font-bold">{order.poNumber || `PO-${order.id.slice(0, 8).toUpperCase()}`}</h1>
        {statusBadges}
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle className="text-base">Timeline</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TimelineRow icon={<Calendar className="h-4 w-4" />} label="Created" value={fmtDateTime(order.createdAt)} />
          <TimelineRow icon={<ClipboardList className="h-4 w-4" />} label="Ordered" value={fmtDateTime(order.orderedAt)} />
          <TimelineRow icon={<Package className="h-4 w-4" />} label="Partially Received" value={fmtDateTime(order.partiallyReceivedAt)} />
          <TimelineRow icon={<Check className="h-4 w-4" />} label="Received" value={fmtDateTime(order.receivedAt)} />
          <TimelineRow icon={<DollarSign className="h-4 w-4" />} label="Paid" value={fmtDateTime(order.paidAt)} />
          <TimelineRow icon={<Calendar className="h-4 w-4" />} label="Last Updated" value={fmtDateTime(order.updatedAt)} />
        </CardContent>
      </Card>

      {/* Vendor / Company / Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Vendor & References
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 text-sm">
          {order.vendorName && <Field label="Vendor" value={order.vendorName} />}
          {order.contactPersonName && <Field label="Contact" value={order.contactPersonName} />}
          {order.companyName && <Field label="Company" value={order.companyName} />}
          {bankCardName && <Field label="Card" value={bankCardName} icon={<CreditCard className="h-3 w-3" />} />}
          {order.requestNumber && <Field label="Request" value={order.requestNumber} icon={<ClipboardList className="h-3 w-3" />} />}
          {order.jobNumbers && order.jobNumbers.length > 0 && (
            <Field label="Jobs" value={order.jobNumbers.join(', ')} icon={<Briefcase className="h-3 w-3" />} />
          )}
          {!order.vendorName && !order.companyName && !order.requestNumber && (!order.jobNumbers || order.jobNumbers.length === 0) && (
            <p className="text-muted-foreground italic col-span-2">No vendor or references attached.</p>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items ({order.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Part #</TableHead>
                <TableHead className="text-right">Qty Ordered</TableHead>
                <TableHead className="text-right">Qty Received</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item, idx) => {
                const lineTotal = (item.unitCost || 0) * item.quantity;
                const recv = item.receivedQuantity || 0;
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">
                      {item.itemName}
                      {item.notes && <div className="text-xs text-muted-foreground italic">{item.notes}</div>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className={`text-right ${recv >= item.quantity ? 'text-green-600' : recv > 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>{recv}</TableCell>
                    <TableCell className="text-right">{item.unitCost !== undefined ? formatCurrency(item.unitCost) : '—'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(lineTotal)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
            <Row label="Total Qty" value={String(totalQty)} muted />
            <Row label="Received" value={`${totalReceived} / ${totalQty}`} muted />
            <Row label="Subtotal" value={formatCurrency(subtotal)} />
            {discountAmount > 0 && (
              <Row label={`Discount${order.discountType === 'percentage' ? ` (${order.discountValue}%)` : ''}`} value={`-${formatCurrency(discountAmount)}`} muted />
            )}
            {(order.gstEnabled ?? true) && (
              <Row label="Tax (5%)" value={formatCurrency(taxAmount)} muted />
            )}
            {pstAmount > 0 && (
              <Row label={`PST (${order.pstPercent}%)`} value={formatCurrency(pstAmount)} muted />
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t">
              <span>Total</span><span>{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      {(attachments.length > 0 || order.pdfUrl || order.imageUrl) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Attachments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.pdfUrl && (
              <AttachmentRow
                icon={<FileText className="h-4 w-4" />}
                label={getFileNameFromUrl(order.pdfUrl, 'original.pdf')}
                onOpen={() => downloadFileFromUrl(order.pdfUrl!, getFileNameFromUrl(order.pdfUrl!, 'original.pdf'))}
              />
            )}
            {order.imageUrl && (
              <AttachmentRow
                icon={<ImageIcon className="h-4 w-4" />}
                label={getFileNameFromUrl(order.imageUrl, 'image')}
                onOpen={() => window.open(order.imageUrl!, '_blank')}
              />
            )}
            {attachments.map((a) => (
              <AttachmentRow
                key={a.id}
                icon={a.fileType === 'pdf' ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                label={a.fileName || getFileNameFromUrl(a.url, a.fileType)}
                onOpen={() => a.fileType === 'pdf'
                  ? downloadFileFromUrl(a.url, a.fileName || getFileNameFromUrl(a.url, 'file.pdf'))
                  : window.open(a.url, '_blank')}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* PO Notes (PDF) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> PO Notes
            <span className="text-xs font-normal text-muted-foreground">(visible on PDF)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {order.notes
            ? <p className="whitespace-pre-line text-sm">{order.notes}</p>
            : <p className="text-sm text-muted-foreground italic">No PO notes. Edit the PO to add notes that appear on the PDF.</p>}
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
            <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes || internalNotes === (order.internalNotes || '')}>
              {savingNotes ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <PurchaseOrderPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        order={order}
        settings={settings}
        onDownload={handleDownload}
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

function Field({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? 'text-muted-foreground' : ''}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

function AttachmentRow({ icon, label, onOpen }: { icon: React.ReactNode; label: string; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="flex items-center gap-2 text-sm text-primary hover:underline w-full text-left">
      {icon}<span className="truncate">{label}</span>
    </button>
  );
}
