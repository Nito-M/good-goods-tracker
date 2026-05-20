import { Sale, InvoiceSettings } from '@/types/sale';
import { InvoiceLayout, defaultInvoiceLayout } from '@/types/invoiceLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale;
  settings?: InvoiceSettings;
  onDownload: () => void;
}

export function InvoicePreviewDialog({
  open,
  onOpenChange,
  sale,
  settings,
  onDownload,
}: InvoicePreviewDialogProps) {
  const layout: InvoiceLayout = { ...defaultInvoiceLayout, ...(settings?.layout || {}) };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Invoice Preview</DialogTitle>
          <div className="flex items-center gap-2">
            <Button onClick={onDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Preview Container - A4 aspect ratio */}
        <div className="flex-1 overflow-auto bg-muted/50 p-4 rounded-lg">
          <div
            className="bg-white text-black mx-auto shadow-lg"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '20mm',
              transform: 'scale(0.7)',
              transformOrigin: 'top center',
              marginBottom: '-100mm',
            }}
          >
            {/* Header Section */}
            <div className="flex justify-between items-start mb-8">
              {/* Logo */}
              {layout.logo.visible && settings?.logoUrl && (
                <div>
                  <img
                    src={settings.logoUrl}
                    alt="Business Logo"
                    className="max-h-20 max-w-40 object-contain"
                  />
                </div>
              )}

              {/* Business Info */}
              {layout.businessInfo.visible && (
                <div className="text-right text-sm">
                  {settings?.businessName && (
                    <p className="font-bold text-base">{settings.businessName}</p>
                  )}
                  {settings?.businessAddress && (
                    <div className="whitespace-pre-line text-gray-600">
                      {settings.businessAddress}
                    </div>
                  )}
                  {settings?.businessPhone && (
                    <p className="text-gray-600">{settings.businessPhone}</p>
                  )}
                  {settings?.businessEmail && (
                    <p className="text-gray-600">{settings.businessEmail}</p>
                  )}
                  {settings?.businessNumber && (
                    <p className="text-gray-600">Business #: {settings.businessNumber}</p>
                  )}
                </div>
              )}
            </div>

            {/* Invoice Title */}
            {layout.invoiceTitle.visible && (
              <h1 className="text-3xl font-bold text-center my-6">INVOICE</h1>
            )}

            {/* Invoice Details */}
            {layout.invoiceDetails.visible && (
              <div className="flex justify-between text-sm mb-6">
                <div>
                  <p><span className="font-medium">Invoice Number:</span> {sale.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p><span className="font-medium">Date:</span> {formatDate(sale.createdAt)}</p>
                  <p><span className="font-medium">Payment Terms:</span> {sale.paymentTerms}</p>
                </div>
              </div>
            )}

            {/* Bill To */}
            {layout.billTo.visible && sale.vendorName && (
              <div className="mb-6">
                <p className="font-bold text-sm">Bill To:</p>
                <p className="text-sm">{sale.vendorName}</p>
                {sale.contactPersonName && (
                  <p className="text-sm text-muted-foreground">Attn: {sale.contactPersonName}</p>
                )}
                {sale.vendorAddress && (
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {sale.vendorAddress}
                  </p>
                )}
              </div>
            )}

            {/* Items Table */}
            {layout.itemsTable.visible && (
              <div className="mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2 font-medium">Item</th>
                      <th className="text-left p-2 font-medium">SKU</th>
                      <th className="text-center p-2 font-medium">Qty</th>
                      <th className="text-right p-2 font-medium">Unit Price</th>
                      {sale.items.some((it) => (it.discountRate || 0) > 0) && (
                        <th className="text-right p-2 font-medium">Disc %</th>
                      )}
                      <th className="text-right p-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="p-2">{item.itemName}</td>
                        <td className="p-2 text-gray-600">{item.sku}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                        {sale.items.some((it) => (it.discountRate || 0) > 0) && (
                          <td className="p-2 text-right">{(item.discountRate || 0) > 0 ? `${item.discountRate}%` : '—'}</td>
                        )}
                        <td className="p-2 text-right">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            {layout.totals.visible && (
              <div className="flex justify-end mb-6">
                <div className="w-64 text-sm">
                  <div className="flex justify-between py-1">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(sale.subtotal)}</span>
                  </div>
                  {sale.discountAmount > 0 && (
                    <div className="flex justify-between py-1 text-green-600">
                      <span>Discount ({sale.discountRate}%):</span>
                      <span>-{formatCurrency(sale.discountAmount)}</span>
                    </div>
                  )}
                  {sale.taxAmount > 0 && (
                    <div className="flex justify-between py-1">
                      <span>Tax ({sale.taxRate}%):</span>
                      <span>{formatCurrency(sale.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 font-bold text-base border-t border-gray-300 mt-2">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(sale.total)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {layout.notes.visible && sale.notes && (
              <div className="mb-6 text-sm">
                <p className="font-bold">Notes:</p>
                <p className="text-gray-600 whitespace-pre-line">{sale.notes}</p>
              </div>
            )}

            {/* Footer */}
            {layout.footer.visible && (
              <div className="text-center text-xs text-gray-500 mt-auto pt-8">
                {settings?.thankYouNote || 'Thank you for your business!'}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
