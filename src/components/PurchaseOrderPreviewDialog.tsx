import { PurchaseOrder } from '@/types/purchaseOrder';
import { InvoiceSettings } from '@/types/sale';
import { InvoiceLayout, defaultInvoiceLayout } from '@/types/invoiceLayout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrencyPdf as formatCurrency } from '@/lib/utils';

interface PurchaseOrderPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder;
  settings?: InvoiceSettings;
  onDownload: () => void;
}

export function PurchaseOrderPreviewDialog({
  open,
  onOpenChange,
  order,
  settings,
  onDownload,
}: PurchaseOrderPreviewDialogProps) {
  const layout: InvoiceLayout = { ...defaultInvoiceLayout, ...(settings?.layout || {}) };
  const TAX_RATE = 0.05;
  const hasAnyCost = order.items.some(item => item.unitCost !== undefined && item.unitCost > 0);
  
  const subtotal = order.items.reduce((sum, item) => sum + (item.unitCost || 0) * item.quantity, 0);
  const discountAmount = order.discountAmount || 0;
  const afterDiscount = (subtotal < 0 ? subtotal - discountAmount : Math.max(0, subtotal - discountAmount));
  const taxAmount = (order.gstEnabled ?? true) ? afterDiscount * TAX_RATE : 0;
  const pstAmount = afterDiscount * (order.pstPercent || 0) / 100;
  const totalCost = afterDiscount + taxAmount + pstAmount;

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'MMMM d, yyyy');
  };

  const poNumber = order.poNumber || `PO-${order.id.slice(0, 8).toUpperCase()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Purchase Order Preview</DialogTitle>
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
            <div className="flex justify-between items-start mb-8">
              {settings?.logoUrl && layout.logo.visible && (
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
              </div>
              )}
            </div>

            {/* Title */}
            {layout.invoiceTitle.visible && (
            <h1 className="text-3xl font-bold text-center my-6">PURCHASE ORDER</h1>
            )}

            {layout.invoiceDetails.visible && (
            <div className="flex justify-between text-sm mb-6">
              <div>
                <p><span className="font-medium">PO Number:</span> {poNumber}</p>
              </div>
              <div className="text-right">
                <p><span className="font-medium">Order Date:</span> {formatDate(order.orderedAt)}</p>
                {order.receivedAt && (
                  <p><span className="font-medium">Received:</span> {formatDate(order.receivedAt)}</p>
                )}
              </div>
            </div>
            )}

            {/* Vendor */}
            {layout.billTo.visible && order.vendorName && (
              <div className="mb-6">
                <p className="font-bold text-sm">Vendor:</p>
                <p className="text-sm">{order.vendorName}</p>
                {order.contactPersonName && (
                  <p className="text-sm text-gray-600">Attn: {order.contactPersonName}</p>
                )}
              </div>
            )}

            {layout.itemsTable.visible && (
            <div className="mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2 font-medium">Item</th>
                    <th className="text-left p-2 font-medium">SKU</th>
                    <th className="text-center p-2 font-medium">Qty</th>
                    {hasAnyCost && (
                      <>
                        <th className="text-right p-2 font-medium">Unit Cost</th>
                        <th className="text-right p-2 font-medium">Total</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="p-2">
                        {item.itemName}
                        {item.notes && <div className="text-[9px] text-gray-400 mt-0.5">{item.notes}</div>}
                      </td>
                      <td className="p-2 text-gray-600">{item.sku}</td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      {hasAnyCost && (
                        <>
                          <td className="p-2 text-right">{formatCurrency(item.unitCost || 0)}</td>
                          <td className="p-2 text-right">{formatCurrency((item.unitCost || 0) * item.quantity)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}

            {layout.totals.visible && (
            <div className="flex justify-end mb-6">
              <div className="w-64 text-sm">
                {hasAnyCost && (
                  <>
                    <div className="flex justify-between py-1">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between py-1 text-green-600">
                        <span>Discount{order.discountType === 'percentage' && order.discountValue > 0 ? ` (${order.discountValue}%)` : ''}:</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    {(order.gstEnabled ?? true) && (
                      <div className="flex justify-between py-1">
                        <span>Tax (5%):</span>
                        <span>{formatCurrency(taxAmount)}</span>
                      </div>
                    )}
                    {pstAmount > 0 && (
                      <div className="flex justify-between py-1">
                        <span>PST ({order.pstPercent}%):</span>
                        <span>{formatCurrency(pstAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 font-bold text-base border-t border-gray-300 mt-2">
                      <span>TOTAL:</span>
                      <span>{formatCurrency(totalCost)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            )}

            {/* Notes */}
            {layout.notes.visible && order.notes && (
              <div className="mb-6 text-sm">
                <p className="font-bold">Notes:</p>
                <p className="text-gray-600 whitespace-pre-line">{order.notes}</p>
              </div>
            )}

            {layout.footer.visible && (
            <div className="text-center text-xs text-gray-500 mt-auto pt-8">
              Generated by Inventory Management System
            </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
