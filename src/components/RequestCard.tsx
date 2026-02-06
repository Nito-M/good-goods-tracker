import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Trash2, ExternalLink, Package, Pencil, CalendarClock, ChevronDown, User } from "lucide-react";
import { Request, RequestStatus } from "@/types/request";

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
  const isOverdue = request.needByDate && new Date(request.needByDate) < new Date() && request.status !== 'received' && request.status !== 'cancelled';

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate flex items-center gap-2">
              {request.inventoryItemId ? (
                <Package className="h-4 w-4 text-primary shrink-0" />
              ) : null}
              {request.itemName}
            </CardTitle>
            <CardDescription className="text-sm">
              {request.sku && <span className="font-mono">SKU: {request.sku} • </span>}
              {request.quantity} {request.quantityUnit}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
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
            {onStatusChange && request.status !== 'cancelled' && (
              <Select
                value={request.status}
                onValueChange={(value: RequestStatus) => onStatusChange(request.id, value)}
              >
                <SelectTrigger className="w-[130px]">
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
            )}
            {request.status === 'cancelled' && (
              <Badge variant="outline" className={statusColors.cancelled}>
                Cancelled
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Need By Date */}
        {request.needByDate && (
          <div className={`flex items-center gap-2 text-sm ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            <CalendarClock className="h-4 w-4" />
            <span>Need by: {format(new Date(request.needByDate), "MMM d, yyyy")}</span>
            {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
          </div>
        )}

        {/* Image Preview */}
        {request.imageUrl && (
          <div className="relative w-full h-32 rounded-lg overflow-hidden border bg-muted">
            <img
              src={request.imageUrl}
              alt={request.itemName}
              className="w-full h-full object-cover"
            />
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
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={statusColors[request.status]}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
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
        </div>
      </CardContent>
    </Card>
  );
}
