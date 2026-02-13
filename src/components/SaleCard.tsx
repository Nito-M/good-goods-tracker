import { Download, Trash2, Building2, Calendar, FileText, Undo2, Pencil, Eye, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sale, SaleStatus } from '@/types/sale';
import { formatCurrency } from '@/lib/utils';

interface SaleCardProps {
  sale: Sale;
  onDelete: (id: string) => void;
  onRevert: (id: string) => void;
  onDownloadInvoice: () => void;
  onPreviewInvoice: () => void;
  onEdit: (sale: Sale) => void;
  onStatusChange?: (id: string, status: SaleStatus) => void;
  onTogglePickedUp?: (id: string) => void;
}

const statusConfig: Record<Exclude<SaleStatus, 'picked_up'>, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  pending: { label: 'Pending', variant: 'outline' },
  paid: { label: 'Paid', variant: 'default' },
  overdue: { label: 'Overdue', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
};

export function SaleCard({ sale, onDelete, onRevert, onDownloadInvoice, onPreviewInvoice, onEdit, onStatusChange, onTogglePickedUp }: SaleCardProps) {

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isPickedUp = !!sale.pickedUpAt;

  const getStatusBadges = () => {
    const badges = [];
    
    // Show picked up badge if picked up
    if (isPickedUp) {
      badges.push(
        <Badge key="picked_up" variant="default" className="bg-primary">
          <Package className="h-3 w-3 mr-1" />
          Picked Up
        </Badge>
      );
    }
    
    // Show payment status badge (excluding picked_up from the dropdown statuses)
    if (sale.status !== 'picked_up') {
      const config = statusConfig[sale.status as Exclude<SaleStatus, 'picked_up'>] || statusConfig.pending;
      badges.push(
        <Badge key="status" variant={config.variant}>
          {config.label}
        </Badge>
      );
    }
    
    return badges.length > 0 ? badges : <Badge variant="outline">Pending</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{sale.invoiceNumber}</CardTitle>
            {getStatusBadges()}
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
          {/* Picked Up Checkbox - only allow checking, not unchecking */}
          {onTogglePickedUp && sale.status !== 'cancelled' && !isPickedUp && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-md border bg-muted/50">
              <Checkbox
                id={`picked-up-${sale.id}`}
                checked={isPickedUp}
                onCheckedChange={() => onTogglePickedUp(sale.id)}
              />
              <label
                htmlFor={`picked-up-${sale.id}`}
                className="text-sm font-medium cursor-pointer"
              >
                Mark Picked Up
              </label>
            </div>
          )}
          
          {/* Status Selector - hide if already paid (can only revert) */}
          {onStatusChange && sale.status !== 'cancelled' && sale.status !== 'paid' && (
            <Select
              value={sale.status === 'picked_up' ? 'pending' : sale.status}
              onValueChange={(value: SaleStatus) => onStatusChange(sale.id, value)}
            >
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          )}
          {sale.status === 'cancelled' && getStatusBadges()}
          <Button variant="outline" size="sm" onClick={() => onEdit(sale)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onPreviewInvoice}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={onDownloadInvoice}>
            <Download className="h-4 w-4 mr-2" />
            Invoice
          </Button>
          {sale.status !== 'cancelled' && (
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
                    This will mark {sale.invoiceNumber} as reverted
                    {isPickedUp && ' and restore all items back to inventory'}.
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
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <p>
                      This will permanently delete <strong>{sale.invoiceNumber}</strong>. 
                      This action cannot be undone.
                    </p>
                    {(isPickedUp || sale.status === 'paid') && (
                      <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
                        <p className="font-medium text-foreground">The following will happen:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {isPickedUp && (
                            <>
                              <li>Inventory quantities will be restored</li>
                              <li>PO allocations (FIFO tracking) will be cleared</li>
                            </>
                          )}
                          {sale.status === 'paid' && (
                            <li>Bank transaction (profit) will be reversed</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(sale.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Anyway
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
            {isPickedUp && sale.totalCost > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t mt-2">
                <span className="text-muted-foreground">Cost</span>
                <span>{formatCurrency(sale.totalCost)}</span>
              </div>
            )}
            {isPickedUp && sale.totalCost > 0 && (
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
