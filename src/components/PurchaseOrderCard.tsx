import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PurchaseOrder } from '@/types/purchaseOrder';
import { InvoiceSettings } from '@/types/sale';
import {
  FileText,
  Check,
  Trash2,
  Package,
  Calendar,
  Hash,
  Pencil,
  Building2,
  Download,
  DollarSign,
  Banknote,
  ClipboardList,
  Briefcase,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PurchaseOrderCardProps {
  order: PurchaseOrder;
  onMarkOrdered?: (id: string) => void;
  onMarkReceived: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (order: PurchaseOrder) => void;
  onDownload: (order: PurchaseOrder) => void;
  loading?: boolean;
}

export function PurchaseOrderCard({
  order,
  onMarkOrdered,
  onMarkReceived,
  onMarkPaid,
  onDelete,
  onEdit,
  onDownload,
  loading,
}: PurchaseOrderCardProps) {
  const TAX_RATE = 0.05;
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = order.items.reduce((sum, item) => sum + (item.unitCost || 0) * item.quantity, 0);
  const discountAmount = order.discountAmount || 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = afterDiscount * TAX_RATE;
  const totalCost = afterDiscount + taxAmount;

  // Format date using local date components (avoids UTC timezone shift)
  const formatLocalDate = (dateValue: Date | string) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    // Use local date methods to extract year/month/day in user's timezone
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    const day = date.getDate();
    // Create a local date at noon to format
    return new Date(year, month, day, 12, 0, 0);
  };


  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Hash className="h-3 w-3" />
                  <span className="font-medium">{order.poNumber || `PO-${order.id.slice(0, 8).toUpperCase()}`}</span>
                </div>
                <h3 className="font-semibold text-lg">
                  {order.items.length === 1
                    ? order.items[0].itemName
                    : `${order.items.length} Items`}
                </h3>
                {order.items.length === 1 && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>SKU: {order.items[0].sku}</span>
                    <span>Qty: {order.items[0].quantity}</span>
                    {order.items[0].unitCost !== undefined && order.items[0].unitCost > 0 && (
                      <span className="font-medium text-foreground">
                        @ {formatCurrency(order.items[0].unitCost)} each
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 items-end">
                <Badge
                  variant={order.status === 'received' ? 'default' : order.status === 'draft' ? 'outline' : 'secondary'}
                  className={
                    order.status === 'received'
                      ? 'bg-green-600 hover:bg-green-700'
                      : order.status === 'draft'
                      ? 'border-yellow-500 text-yellow-600'
                      : ''
                  }
                >
                  {order.status === 'received' ? 'Received' : order.status === 'draft' ? 'Draft' : 'Ordered'}
                </Badge>
                {order.paidAt ? (
                  <Badge variant="outline" className="border-blue-500 text-blue-600">
                    Paid
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500 text-amber-600">
                    Unpaid
                  </Badge>
                )}
              </div>
            </div>

            {/* Multiple items list */}
            {order.items.length > 1 && (
              <div className="border-t pt-3 space-y-1.5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground py-1 border-b border-dashed last:border-b-0">
                    <Package className="h-3 w-3 shrink-0" />
                    <span className="flex-1 truncate">{item.itemName}</span>
                    <span className="text-foreground font-medium">x{item.quantity}</span>
                    {item.unitCost !== undefined && (
                      <span className="text-muted-foreground">@ {formatCurrency(item.unitCost)}</span>
                    )}
                    {item.unitCost !== undefined && (
                      <span className="text-foreground font-medium min-w-[80px] text-right">
                        {formatCurrency(item.unitCost * item.quantity)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pricing section */}
            {subtotal > 0 && (
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Discount{order.discountType === 'percentage' && order.discountValue > 0 ? ` (${order.discountValue}%)` : ''}</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (5%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base pt-1 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
              </div>
            )}

            {/* Details grid */}
            <div className="border-t pt-3 grid grid-cols-2 gap-2 text-sm">
              {order.vendorName && (
                <div className="flex items-center gap-2 col-span-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>Vendor: {order.vendorName}</span>
                </div>
              )}
              {order.requestNumber && (
                <div className="flex items-center gap-2 col-span-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">Request: {order.requestNumber}</span>
                </div>
              )}
              {order.jobNumber && (
                <div className="flex items-center gap-2 col-span-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">Job: {order.jobNumber}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>Total Qty: {totalQuantity}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Ordered: {format(formatLocalDate(order.orderedAt), 'MMM d, yyyy')}</span>
              </div>
              {order.receivedAt && (
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>
                    Received: {format(formatLocalDate(order.receivedAt), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              {order.paidAt && (
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-blue-600" />
                  <span>
                    Paid: {format(formatLocalDate(order.paidAt), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>

            {order.notes && (
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            )}

            {/* PDF link */}
            {order.pdfUrl && (
              <a
                href={order.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <FileText className="h-4 w-4" />
                View PDF
              </a>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              {order.status === 'draft' && onMarkOrdered && (
                <Button
                  size="sm"
                  onClick={() => onMarkOrdered(order.id)}
                  disabled={loading}
                  className="gap-2"
                >
                  <Package className="h-4 w-4" />
                  Place Order
                </Button>
              )}
              {order.status === 'ordered' && (
                <Button
                  size="sm"
                  onClick={() => onMarkReceived(order.id)}
                  disabled={loading}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Mark Received
                </Button>
              )}
              {!order.paidAt && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMarkPaid(order.id)}
                  disabled={loading}
                  className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Banknote className="h-4 w-4" />
                  Mark Paid
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDownload(order)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(order)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(order.id)}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
