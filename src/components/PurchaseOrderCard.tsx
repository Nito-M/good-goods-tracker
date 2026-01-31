import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PurchaseOrder } from '@/types/purchaseOrder';
import {
  FileText,
  Image as ImageIcon,
  Check,
  Trash2,
  Package,
  Calendar,
  Hash,
} from 'lucide-react';

interface PurchaseOrderCardProps {
  order: PurchaseOrder;
  onMarkReceived: (id: string) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function PurchaseOrderCard({
  order,
  onMarkReceived,
  onDelete,
  loading,
}: PurchaseOrderCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Image section */}
          <div className="md:w-32 h-32 md:h-auto bg-muted flex items-center justify-center shrink-0">
            {order.imageUrl ? (
              <img
                src={order.imageUrl}
                alt={order.itemName}
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
                <h3 className="font-semibold text-lg">{order.itemName}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  <span>{order.sku}</span>
                </div>
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

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>Qty: {order.quantity}</span>
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
            <div className="flex gap-2 pt-2">
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
