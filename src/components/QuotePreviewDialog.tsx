import { Quote, QuoteSettings } from '@/types/quote';
import { InvoiceLayout, defaultInvoiceLayout } from '@/types/invoiceLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface QuotePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
  settings: QuoteSettings;
  onDownload: () => void;
}

export function QuotePreviewDialog({
  open,
  onOpenChange,
  quote,
  settings,
  onDownload,
}: QuotePreviewDialogProps) {
  const layout: InvoiceLayout = {
    ...defaultInvoiceLayout,
    ...(settings.layout || {}),
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
          <DialogTitle>Quote Preview</DialogTitle>
          <div className="flex items-center gap-2">
            <Button onClick={onDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

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
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              {layout.logo.visible && settings.logoUrl && (
                <div>
                  <img
                    src={settings.logoUrl}
                    alt="Business Logo"
                    className="max-h-20 max-w-40 object-contain"
                  />
                </div>
              )}
              {layout.businessInfo.visible && (
                <div className="text-right text-sm">
                  {settings.businessName && (
                    <p className="font-bold text-base">{settings.businessName}</p>
                  )}
                  {settings.businessAddress && (
                    <div className="whitespace-pre-line text-gray-600">
                      {settings.businessAddress}
                    </div>
                  )}
                  {settings.businessPhone && (
                    <p className="text-gray-600">{settings.businessPhone}</p>
                  )}
                  {settings.businessEmail && (
                    <p className="text-gray-600">{settings.businessEmail}</p>
                  )}
                </div>
              )}
            </div>

            {/* Title */}
            {layout.invoiceTitle.visible && (
              <h1 className="text-3xl font-bold text-center my-3">QUOTE</h1>
            )}

            {/* Quote Details */}
            {layout.invoiceDetails.visible && (
              <div className="flex justify-between text-sm mb-4">
                <div>
                  <p><span className="font-medium">Quote #:</span> {quote.quoteNumber}</p>
                  <p><span className="font-medium">Date:</span> {formatDate(quote.createdAt)}</p>
                  {quote.validUntil && (
                    <p><span className="font-medium">Valid Until:</span> {formatDate(quote.validUntil)}</p>
                  )}
                </div>
                <div className="text-right">
                  {quote.showPaymentTerms !== false && (
                    <p><span className="font-medium">Terms:</span> {quote.paymentTerms}</p>
                  )}
                </div>
              </div>
            )}

            {/* Quote For */}
            {layout.billTo.visible && quote.vendorName && (
              <div className="mb-4">
                <p className="font-bold text-sm">Quote For:</p>
                <p className="text-sm">{quote.vendorName}</p>
                {quote.contactPersonName && (
                  <p className="text-sm text-muted-foreground">Attn: {quote.contactPersonName}</p>
                )}
                {quote.vendorAddress && (
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {quote.vendorAddress}
                  </p>
                )}
              </div>
            )}

            {/* Items Table */}
            {layout.itemsTable.visible && (
              <div className="mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-2 font-medium">Item</th>
                      {quote.showSku !== false && (
                        <th className="text-left p-2 font-medium">SKU</th>
                      )}
                      <th className="text-center p-2 font-medium">Qty</th>
                      {!quote.hidePrices && (
                        <>
                          <th className="text-right p-2 font-medium">Price</th>
                          <th className="text-right p-2 font-medium">Total</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {quote.items.map((item, index) => {
                      const grossLine = item.quantity * item.unitPrice;
                      const netAfterAll = item.totalPrice * (1 - quote.discountRate / 100);
                      const hasDiscount = (item.discountRate || 0) > 0 || quote.discountRate > 0;
                      return (
                        <tr key={item.id} className="border-b border-gray-300">
                          <td className="p-2">
                            {item.itemName}
                            {item.notes && (
                              <p className="text-xs text-gray-500 mt-1">Note: {item.notes}</p>
                            )}
                          </td>
                          {quote.showSku !== false && (
                            <td className="p-2 text-gray-600">{item.sku}</td>
                          )}
                          <td className="p-2 text-center">
                            {item.quantity} {item.quantityUnit}
                          </td>
                          {!quote.hidePrices && (
                            <>
                              <td className="p-2 text-right">
                                {formatCurrency(item.unitPrice)}
                                {(item.discountRate || 0) > 0 && (
                                  <div className="text-xs text-gray-500">−{item.discountRate}%</div>
                                )}
                              </td>
                              <td className="p-2 text-right">
                                {hasDiscount ? (
                                  <div>
                                    <span>{formatCurrency(netAfterAll)}</span>
                                    <span className="ml-2 text-gray-400 line-through text-xs">{formatCurrency(grossLine)}</span>
                                  </div>
                                ) : (
                                  formatCurrency(grossLine)
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            {layout.totals.visible && !quote.hidePrices && (
              <div className="flex justify-end mb-4">
                <div className="w-64 text-sm">
                  <div className="flex justify-between py-1">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(quote.subtotal)}</span>
                  </div>
                  {quote.discountAmount > 0 && (
                    <div className="flex justify-between py-1 text-green-600">
                      <span>Discount ({quote.discountRate}%):</span>
                      <span>-{formatCurrency(quote.discountAmount)}</span>
                    </div>
                  )}
                  {quote.taxAmount > 0 && (
                    <div className="flex justify-between py-1">
                      <span>Tax ({quote.taxRate}%):</span>
                      <span>{formatCurrency(quote.taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 font-bold text-base border-t border-gray-300 mt-2">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(quote.total)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {layout.notes.visible && quote.notes && (
              <div className="mb-4 text-sm">
                <p className="font-bold">Notes:</p>
                <p className="text-gray-600 whitespace-pre-line">{quote.notes}</p>
              </div>
            )}

            {/* Footer */}
            {layout.footer.visible && (
              <div className="text-center text-xs text-gray-500 mt-auto pt-8">
                {settings.thankYouNote || 'Thank you for considering our services!'}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
