import { Download, Trash2, Building2, Calendar, FileText, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Sale } from '@/types/sale';

interface SaleCardProps {
  sale: Sale;
  onDelete: (id: string) => void;
  onRevert: (id: string) => void;
  onDownloadInvoice: () => void;
}

export function SaleCard({ sale, onDelete, onRevert, onDownloadInvoice }: SaleCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = () => {
    switch (sale.status) {
      case 'completed':
        return <Badge variant="default">completed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">reverted</Badge>;
      default:
        return <Badge variant="secondary">{sale.status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{sale.invoiceNumber}</CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(sale.createdAt)}
            </span>
            {sale.vendorName && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {sale.vendorName}
              </span>
            )}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onDownloadInvoice}>
            <Download className="h-4 w-4 mr-2" />
            Invoice
          </Button>
          {sale.status === 'completed' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" title="Revert sale">
                  <Undo2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Revert Sale?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark {sale.invoiceNumber} as reverted and restore all
                    items back to inventory.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRevert(sale.id)}>
                    Revert Sale
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Sale?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {sale.invoiceNumber}. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(sale.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Items */}
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Items ({sale.items.length})
            </p>
            <div className="text-sm text-muted-foreground pl-4">
              {sale.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.itemName} × {item.quantity}
                  </span>
                  <span>{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
              {sale.items.length > 3 && (
                <p className="text-xs italic">
                  +{sale.items.length - 3} more items
                </p>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount ({sale.discountRate}%)</span>
                <span>-{formatCurrency(sale.discountAmount)}</span>
              </div>
            )}
            {sale.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Tax ({sale.taxRate}%)
                </span>
                <span>{formatCurrency(sale.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
            {sale.status === 'completed' && sale.totalCost > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t mt-2">
                <span className="text-muted-foreground">Cost</span>
                <span>{formatCurrency(sale.totalCost)}</span>
              </div>
            )}
            {sale.status === 'completed' && sale.totalCost > 0 && (
              <div className="flex justify-between font-bold text-green-600">
                <span>Profit</span>
                <span>{formatCurrency(sale.totalProfit)}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {sale.notes && (
            <div className="border-t pt-3">
              <p className="text-sm text-muted-foreground">{sale.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
