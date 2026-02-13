import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ImageViewerDialog } from "@/components/ImageViewerDialog";
import { Trash2, ExternalLink, Package, Pencil, CalendarClock, ChevronDown, User, DollarSign, Hash } from "lucide-react";
import { Request, RequestStatus } from "@/types/request";
import { formatCurrency } from "@/lib/utils";

interface RequestCardProps {
  request: Request;
  onStatusChange?: (id: string, status: RequestStatus) => void;
  onDelete?: (id: string) => void;
  onEdit?: (request: Request) => void;
}

const statusColors: Record<RequestStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  approved: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ordered: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  received: "bg-green-500/10 text-green-500 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function RequestCard({ request, onStatusChange, onDelete, onEdit }: RequestCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const isOverdue = request.needByDate && new Date(request.needByDate) < new Date() && request.status !== 'received' && request.status !== 'cancelled';

  // Calculate price breakdown
  const subtotal = request.quantity * request.price;
  const gstAmount = subtotal * (request.gstRate / 100);
  const totalPrice = subtotal + gstAmount;
  const fc = formatCurrency;

  return (
    <>
      <Card className="relative">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Request Number Badge */}
              {request.requestNumber && (
                <span className="inline-block text-xs font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded mb-1">
                  {request.requestNumber}
                </span>
              )}
              <div className="text-base font-semibold truncate flex items-center gap-2">
                {request.inventoryItemId ? (
                  <Package className="h-4 w-4 text-primary shrink-0" />
                ) : null}
                {request.itemName}
              </div>
              {request.sku && (
                <span className="text-xs text-muted-foreground font-mono">SKU: {request.sku}</span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(request)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Price Breakdown Display */}
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Quantity</span>
              </div>
              <span className="font-semibold">{request.quantity} <span className="text-sm font-normal text-muted-foreground">{request.quantityUnit}</span></span>

            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Unit Price</span>
              <span className="font-medium">{fc(request.price)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal ({request.quantity} × {fc(request.price)})</span>
              <span className="font-medium">{fc(subtotal)}</span>
            </div>
            {request.gstRate > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">GST ({request.gstRate}%)</span>
                <span className="font-medium">{fc(gstAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t pt-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-semibold">Total</span>
              </div>
              <span className="text-lg font-bold text-green-600">{fc(totalPrice)}</span>
            </div>
          </div>

          {/* Status Selector */}
          <div className="flex items-center gap-2">
            {onStatusChange && request.status !== 'cancelled' ? (
              <Select
                value={request.status}
                onValueChange={(value: RequestStatus) => onStatusChange(request.id, value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className={`w-full justify-center py-2 ${statusColors[request.status]}`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
            )}
          </div>

          {/* Need By Date */}
          {request.needByDate && (
            <div className={`flex items-center gap-2 text-sm ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
              <CalendarClock className="h-4 w-4" />
              <span>Need by: {format(new Date(request.needByDate), "MMM d, yyyy")}</span>
              {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
            </div>
          )}

          {/* Image Preview - Clickable */}
          {request.imageUrl && (
            <div 
              className="relative w-full h-32 rounded-lg overflow-hidden border bg-muted cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setImageViewerOpen(true)}
            >
              <img
                src={request.imageUrl}
                alt={request.itemName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
                <span className="text-white opacity-0 hover:opacity-100 text-sm font-medium">Click to view</span>
              </div>
            </div>
          )}

          {/* Link */}
          {request.link && (
            <a
              href={request.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View Product Link
            </a>
          )}

          {/* Notes */}
          {request.notes && (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
              {request.notes}
            </p>
          )}

          {/* Requester Info - Collapsible */}
          {request.requesterName && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between p-2 h-auto">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    Requester Info
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="bg-muted/50 rounded-md p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{request.requesterName}</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              Created {format(new Date(request.createdAt), "MMM d, yyyy")}
            </span>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(request.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        imageUrl={request.imageUrl}
        alt={request.itemName}
        open={imageViewerOpen}
        onOpenChange={setImageViewerOpen}
      />
    </>
  );
}