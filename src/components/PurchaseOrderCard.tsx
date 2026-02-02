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
} from 'lucide-react';

interface PurchaseOrderCardProps {
  order: PurchaseOrder;
  onMarkReceived: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (order: PurchaseOrder) => void;
  onDownload: (order: PurchaseOrder) => void;
  loading?: boolean;
}

export function PurchaseOrderCard({
  order,
  onMarkReceived,
  onDelete,
  onEdit,
  onDownload,
  loading,
}: PurchaseOrderCardProps) {
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Image section */}
          <div className="md:w-32 h-32 md:h-auto bg-muted flex items-center justify-center shrink-0">
            {order.imageUrl ? (
              <img
                src={order.imageUrl}
                alt="Order"
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-3">
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
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>SKU: {order.items[0].sku}</span>
                  </div>
                )}
              </div>
              <Badge
                variant={order.status === 'received' ? 'default' : 'secondary'}
                className={
                  order.status === 'received'
                    ? 'bg-green-600 hover:bg-green-700'
                    : ''
                }
              >
                {order.status === 'received' ? 'Received' : 'Ordered'}
              </Badge>
            </div>

            {/* Multiple items list */}
            {order.items.length > 1 && (
              <div className="space-y-1 text-sm">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-3 w-3" />
                    <span className="flex-1 truncate">{item.itemName}</span>
                    <span className="text-foreground font-medium">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {order.vendorName && (
                <div className="flex items-center gap-2 col-span-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>Vendor: {order.vendorName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>Total Qty: {totalQuantity}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Ordered: {format(order.orderedAt, 'MMM d, yyyy')}</span>
              </div>
              {order.receivedAt && (
                <div className="flex items-center gap-2 col-span-2">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>
                    Received: {format(order.receivedAt, 'MMM d, yyyy')}
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
        </div>
      </CardContent>
    </Card>
  );
}
