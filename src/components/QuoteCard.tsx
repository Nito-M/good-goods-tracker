import { useRef } from 'react';
import { Trash2, FileText, Send, Check, X, Clock, Paperclip, Upload, ExternalLink, Pencil, Calendar, Building2, Download, Receipt, ShoppingCart, Eye } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Quote, QuoteSettings, QuoteStatus } from '@/types/quote';
import { generateQuotePDF } from '@/lib/quoteGenerator';
import { formatCurrency } from '@/lib/utils';

interface QuoteCardProps {
  quote: Quote;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: QuoteStatus) => void;
  onUploadAttachment: (quoteId: string, file: File) => Promise<string | null>;
  onRemoveAttachment: (quoteId: string) => void;
  onEdit: (quote: Quote) => void;
  onConvertToInvoice?: (quote: Quote) => void;
  onConvertToPurchaseOrder?: (quote: Quote) => void;
  onPreview?: (quote: Quote) => void;
  quoteSettings: QuoteSettings;
  linkedInvoiceNumber?: string | null;
  linkedPoNumber?: string | null;
}

export function QuoteCard({ quote, onDelete, onUpdateStatus, onUploadAttachment, onRemoveAttachment, onEdit, onConvertToInvoice, onConvertToPurchaseOrder, onPreview, quoteSettings, linkedInvoiceNumber, linkedPoNumber }: QuoteCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);


  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = () => {
    switch (quote.status) {
      case 'draft':
        return <Badge variant="secondary">draft</Badge>;
      case 'sent':
        return <Badge variant="default">sent</Badge>;
      case 'accepted':
        return <Badge variant="default">accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">rejected</Badge>;
      case 'expired':
        return <Badge variant="secondary">expired</Badge>;
      case 'converted':
        return <Badge variant="default" className="bg-success text-success-foreground">converted</Badge>;
      default:
        return <Badge variant="secondary">{quote.status}</Badge>;
    }
  };

  const handleDownloadPDF = () => {
    generateQuotePDF(quote, quoteSettings);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUploadAttachment(quote.id, file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{quote.quoteNumber}</CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(quote.createdAt)}
            </span>
            {quote.vendorName && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {quote.vendorName}
              </span>
            )}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {quote.status !== 'converted' && onConvertToInvoice && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-success">
                  <Receipt className="h-4 w-4 mr-2" />
                  To Invoice
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Convert to Invoice?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will create a new invoice from {quote.quoteNumber} and mark the quote as converted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onConvertToInvoice(quote)}>
                    Convert
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {quote.status !== 'converted' && onConvertToPurchaseOrder && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-primary">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  To PO
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Convert to Purchase Order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will create a new purchase order from {quote.quoteNumber} and mark the quote as converted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onConvertToPurchaseOrder(quote)}>
                    Convert
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="outline" size="sm" onClick={() => onEdit(quote)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {onPreview && (
            <Button variant="outline" size="sm" onClick={() => onPreview(quote)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            title="Attach PDF or image"
          >
            <Upload className="h-4 w-4" />
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
              <Button variant="outline" size="icon" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Quote?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {quote.quoteNumber}. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(quote.id)}
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
          {/* Converted notice */}
          {quote.status === 'converted' && (linkedInvoiceNumber || linkedPoNumber) && (
            <div className="flex items-center gap-2 p-2 bg-success/10 border border-success/20 rounded text-sm">
              {linkedInvoiceNumber && (
                <span className="flex items-center gap-1 text-success">
                  <Receipt className="h-3 w-3" />
                  Converted to Invoice: <strong>{linkedInvoiceNumber}</strong>
                </span>
              )}
              {linkedPoNumber && (
                <span className="flex items-center gap-1 text-primary">
                  <ShoppingCart className="h-3 w-3" />
                  Converted to PO: <strong>{linkedPoNumber}</strong>
                </span>
              )}
            </div>
          )}

          {/* Attachment section */}
          {quote.attachmentUrl && (
            <div className="flex items-center justify-between p-2 bg-muted rounded text-sm">
              <a 
                href={quote.attachmentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline truncate flex-1"
              >
                <Paperclip className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">Attachment</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
              </a>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                onClick={() => onRemoveAttachment(quote.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Items */}
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Items ({quote.items.length})
            </p>
            <div className="text-sm text-muted-foreground pl-4 space-y-1">
              {quote.items.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between">
                    <span>
                      {item.itemName} × {item.quantity} {item.quantityUnit}
                    </span>
                    {quote.discountRate > 0 ? (
                      <span className="flex items-center gap-1">
                        <span>{formatCurrency(item.totalPrice * (1 - quote.discountRate / 100))}</span>
                        <span className="text-xs text-muted-foreground/60 line-through">{formatCurrency(item.totalPrice)}</span>
                      </span>
                    ) : (
                      <span>{formatCurrency(item.totalPrice)}</span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground/70 pl-2 italic whitespace-pre-wrap">
                      {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Valid Until */}
          {quote.validUntil && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              Valid until {formatDate(quote.validUntil)}
            </div>
          )}

          {/* Totals */}
          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(quote.subtotal)}</span>
            </div>
            {quote.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount ({quote.discountRate}%)</span>
                <span>-{formatCurrency(quote.discountAmount)}</span>
              </div>
            )}
            {quote.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Tax ({quote.taxRate}%)
                </span>
                <span>{formatCurrency(quote.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(quote.total)}</span>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="border-t pt-3">
              <p className="text-sm text-muted-foreground">{quote.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
