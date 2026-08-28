import { useRef, useState } from 'react';
import { ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Trash2, FileText, Send, Check, X, Clock, Paperclip, Upload, ExternalLink, Pencil, Calendar, Building2, Download, Receipt, ShoppingCart, Eye, Undo2, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Quote, QuoteSettings, QuoteStatus } from '@/types/quote';
import { ConvertItemsDialog } from '@/components/quote/ConvertItemsDialog';
import { MarkInvoicedDialog } from '@/components/quote/MarkInvoicedDialog';

import { generateQuotePDF } from '@/lib/quoteGenerator';
import { formatCurrency } from '@/lib/utils';


interface QuoteCardProps {
  quote: Quote;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: QuoteStatus) => void;
  onUploadAttachment: (quoteId: string, file: File) => Promise<string | null>;
  onRemoveAttachment: (quoteId: string) => void;
  onEdit: (quote: Quote) => void;
  onConvertToInvoice?: (quote: Quote, percentage: number) => void;
  onConvertItemsToInvoice?: (quote: Quote, selections: { itemId: string; quantity: number }[]) => Promise<unknown> | void;
  onMarkItemsInvoiced?: (quote: Quote, updates: { itemId: string; quantity: number }[]) => Promise<unknown> | void;
  onConvertToPurchaseOrder?: (quote: Quote) => void;

  onRevertInvoiceLink?: (quoteId: string, saleId: string, percentage: number) => void;

  onPreview?: (quote: Quote) => void;
  quoteSettings: QuoteSettings;
  linkedInvoiceNumber?: string | null;
  linkedPoNumber?: string | null;
}

export function QuoteCard({ quote, onDelete, onUpdateStatus, onUploadAttachment, onRemoveAttachment, onEdit, onConvertToInvoice, onConvertItemsToInvoice, onConvertToPurchaseOrder, onRevertInvoiceLink, onPreview, quoteSettings, linkedInvoiceNumber, linkedPoNumber }: QuoteCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showItemsInvoiceDialog, setShowItemsInvoiceDialog] = useState(false);

  const [showPoDialog, setShowPoDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [invoicePercentage, setInvoicePercentage] = useState(100);

  const remainingPercentage = 100 - quote.invoicedPercentage;

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
      case 'sales_order':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Sales Order</Badge>;
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
    <>
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1 cursor-pointer flex items-start gap-2" onClick={() => setCollapsed(!collapsed)}>
          <div className="mt-1">
            {collapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{quote.quoteNumber}</CardTitle>
              {getStatusBadge()}
              <span className="text-sm font-normal text-muted-foreground">{formatCurrency(quote.total)}</span>
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
        </div>
        <div className="flex items-center gap-2">
          {onPreview && (
            <Button variant="outline" size="sm" onClick={() => onPreview(quote)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={handleFileSelect}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {quote.invoicedPercentage < 100 && onConvertToInvoice && (
                <DropdownMenuItem onClick={() => {
                  setInvoicePercentage(remainingPercentage);
                  setShowInvoiceDialog(true);
                }}>
                  <Receipt className="h-4 w-4 mr-2" />
                  To Invoice {quote.invoicedPercentage > 0 ? `(${remainingPercentage}% left)` : ''}
                </DropdownMenuItem>
              )}
              {quote.invoicedPercentage < 100 && onConvertItemsToInvoice && quote.items.length > 0 && (
                <DropdownMenuItem onClick={() => setShowItemsInvoiceDialog(true)}>
                  <ListChecks className="h-4 w-4 mr-2" />
                  Invoice Selected Items
                </DropdownMenuItem>
              )}

              {quote.invoicedPercentage < 100 && onConvertToPurchaseOrder && (
                <DropdownMenuItem onClick={() => setShowPoDialog(true)}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  To PO
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit(quote)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Attach PDF or image
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialog open={showPoDialog} onOpenChange={setShowPoDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Convert to Purchase Order?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will create a new purchase order from {quote.quoteNumber} and mark the quote as converted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onConvertToPurchaseOrder?.(quote)}>
                  Convert
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
              <DropdownMenuItem onClick={() => onUpdateStatus(quote.id, 'sales_order')}>
                Convert to Sales Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus(quote.id, 'rejected')}>
                Rejected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateStatus(quote.id, 'expired')}>
                Expired
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
      {!collapsed && (
        <CardContent>
          <div className="space-y-3">
            {/* Linked invoices */}
            {quote.linkedInvoices.length > 0 && (
              <div className="space-y-1 p-2 bg-success/10 border border-success/20 rounded text-sm">
                <p className="font-medium flex items-center gap-1">
                  <Receipt className="h-3 w-3" />
                  Invoiced: {quote.invoicedPercentage}%
                </p>
                {quote.linkedInvoices.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2 pl-4 text-muted-foreground">
                    <span>{link.invoiceNumber || 'Invoice'}</span>
                    <Badge variant="secondary" className="text-xs">{link.percentage}%</Badge>
                    {onRevertInvoiceLink && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive hover:text-destructive">
                            <Undo2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Revert this invoice?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will delete {link.invoiceNumber || 'the linked invoice'} ({link.percentage}%) and restore the quote's invoiced percentage. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => onRevertInvoiceLink(quote.id, link.saleId, link.percentage)}
                            >
                              Revert
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Converted to PO notice */}
            {quote.convertedToPoId && linkedPoNumber && (
              <div className="flex items-center gap-2 p-2 bg-success/10 border border-success/20 rounded text-sm">
                <span className="flex items-center gap-1 text-primary">
                  <ShoppingCart className="h-3 w-3" />
                  Converted to PO: <strong>{linkedPoNumber}</strong>
                </span>
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
      )}
    </Card>

      {/* Percentage Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Invoice</DialogTitle>
            <DialogDescription>
              Choose what percentage of {quote.quoteNumber} to invoice.
              {quote.invoicedPercentage > 0 && (
                <span className="block mt-1">
                  Already invoiced: {quote.invoicedPercentage}% — {remainingPercentage}% remaining
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Percentage to invoice</Label>
              <Input
                type="number"
                min={1}
                max={remainingPercentage}
                value={invoicePercentage}
                onChange={(e) => setInvoicePercentage(Number(e.target.value))}
              />
              {invoicePercentage > remainingPercentage && (
                <p className="text-sm text-destructive">
                  Cannot exceed {remainingPercentage}%
                </p>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Invoice total: {formatCurrency(quote.total * (invoicePercentage / 100))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>Cancel</Button>
            <Button
              disabled={invoicePercentage < 1 || invoicePercentage > remainingPercentage}
              onClick={() => {
                onConvertToInvoice?.(quote, invoicePercentage);
                setShowInvoiceDialog(false);
              }}
            >
              Create Invoice ({invoicePercentage}%)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {onConvertItemsToInvoice && (
        <ConvertItemsDialog
          quote={quote}
          open={showItemsInvoiceDialog}
          onOpenChange={setShowItemsInvoiceDialog}
          onConfirm={async (selections) => {
            await onConvertItemsToInvoice(quote, selections);
          }}
        />
      )}
    </>

  );
}
