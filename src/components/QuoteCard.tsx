import { Trash2, FileText, Send, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Quote, QuoteSettings } from '@/types/quote';
import { generateQuotePDF } from '@/lib/quoteGenerator';

interface QuoteCardProps {
  quote: Quote;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: Quote['status']) => void;
  quoteSettings: QuoteSettings;
}

export function QuoteCard({ quote, onDelete, onUpdateStatus, quoteSettings }: QuoteCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: Quote['status']) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'sent':
        return 'default';
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'expired':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: Quote['status']) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-3 w-3" />;
      case 'sent':
        return <Send className="h-3 w-3" />;
      case 'accepted':
        return <Check className="h-3 w-3" />;
      case 'rejected':
        return <X className="h-3 w-3" />;
      case 'expired':
        return <Clock className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const handleDownloadPDF = () => {
    generateQuotePDF(quote, quoteSettings);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{quote.quoteNumber}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {quote.vendorName || 'No customer'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor(quote.status)} className="gap-1">
              {getStatusIcon(quote.status)}
              {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium">{formatDate(quote.createdAt)}</p>
          </div>
          {quote.validUntil && (
            <div>
              <p className="text-muted-foreground">Valid Until</p>
              <p className="font-medium">{formatDate(quote.validUntil)}</p>
            </div>
          )}
        </div>

        <div className="border-t pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Items</span>
            <span>{quote.items.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(quote.subtotal)}</span>
          </div>
          {quote.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-destructive">
              <span>Discount ({quote.discountRate}%)</span>
              <span>-{formatCurrency(quote.discountAmount)}</span>
            </div>
          )}
          {quote.taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({quote.taxRate}%)</span>
              <span>{formatCurrency(quote.taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium mt-1 pt-1 border-t">
            <span>Total</span>
            <span>{formatCurrency(quote.total)}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleDownloadPDF}>
            <FileText className="h-4 w-4 mr-1" />
            PDF
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onUpdateStatus(quote.id, 'draft')}>
                Draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus(quote.id, 'sent')}>
                Sent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus(quote.id, 'accepted')}>
                Accepted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus(quote.id, 'rejected')}>
                Rejected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus(quote.id, 'expired')}>
                Expired
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Quote</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete quote {quote.quoteNumber}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(quote.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
