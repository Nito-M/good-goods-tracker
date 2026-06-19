import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PurchaseOrder } from '@/types/purchaseOrder';
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
  Banknote,
  ClipboardList,
  Briefcase,
  Eye,
  CreditCard,
  ChevronDown,
  ImageIcon,
  X,
  Plus,
  Undo2,
  ExternalLink,
  MoreVertical,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { downloadFileFromUrl, getFileNameFromUrl } from '@/lib/fileDownload';

interface PurchaseOrderCardProps {
  order: PurchaseOrder;
  onMarkPartiallyReceived?: (id: string) => void;
  onMarkOrdered?: (id: string) => void;
  onMarkReceived: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onRevertPaid?: (id: string) => void;
  onRevert?: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (order: PurchaseOrder) => void;
  onDownload: (order: PurchaseOrder) => void;
  onPreview?: (order: PurchaseOrder) => void;
  onAddAttachment?: (file: File) => Promise<boolean>;
  onDeleteAttachment?: (attachmentId: string) => Promise<boolean>;
  // Legacy single-file handlers (still used for existing image_url / pdf_url)
  onDeleteImage?: () => Promise<boolean>;
  onDeletePdf?: () => Promise<boolean>;
  loading?: boolean;
  bankCardName?: string | null;
  defaultOpen?: boolean;
}

export function PurchaseOrderCard({
  order,
  onMarkPartiallyReceived,
  onMarkOrdered,
  onMarkReceived,
  onMarkPaid,
  onRevertPaid,
  onRevert,
  onDelete,
  onEdit,
  onDownload,
  onPreview,
  onAddAttachment,
  onDeleteAttachment,
  onDeleteImage,
  onDeletePdf,
  loading,
  bankCardName,
  defaultOpen = false,
}: PurchaseOrderCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [revertConfirmOpen, setRevertConfirmOpen] = useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (defaultOpen && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [defaultOpen]);

  const handleAddAttachment = async (file: File) => {
    if (!onAddAttachment) return;
    setUploading(true);
    await onAddAttachment(file);
    setUploading(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    for (const f of files) await handleAddAttachment(f);
  };

  const handleMultiFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) await handleAddAttachment(f);
    e.target.value = '';
  };

  const TAX_RATE = 0.05;
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = order.items.reduce((sum, item) => sum + (item.unitCost || 0) * item.quantity, 0);
  const discountAmount = order.discountAmount || 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = afterDiscount * TAX_RATE;
  const pstAmount = afterDiscount * (order.pstPercent || 0) / 100;
  const totalCost = afterDiscount + taxAmount + pstAmount;

  const formatLocalDate = (dateValue: Date | string) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return new Date(year, month, day, 12, 0, 0);
  };

  // Gather all attachments: new table rows + legacy single fields
  const attachments = order.attachments || [];
  const hasAnyImage = !!order.imageUrl || attachments.some(a => a.fileType === 'image');
  const hasAnyPdf = !!order.pdfUrl || attachments.some(a => a.fileType === 'pdf');
  const imageAttachments = attachments.filter(a => a.fileType === 'image');
  const pdfAttachments = attachments.filter(a => a.fileType === 'pdf');

  return (
    <>
      <Card ref={cardRef} className={`overflow-hidden ${defaultOpen ? 'ring-2 ring-primary' : ''}`}>
        <CardContent className="p-0">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            {/* Always-visible header */}
            <CollapsibleTrigger asChild>
              <button className="w-full text-left p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-0.5">
                      <Hash className="h-3 w-3 shrink-0" />
                      <span className="font-medium">{order.poNumber || `PO-${order.id.slice(0, 8).toUpperCase()}`}</span>
                      {order.vendorName && (
                        <span className="text-muted-foreground truncate">· {order.vendorName}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base truncate">
                        {order.items.length === 1
                          ? order.items[0].itemName
                          : `${order.items.length} Items`}
                      </h3>
                      {subtotal > 0 && (
                        <span className="text-sm font-medium text-muted-foreground shrink-0">
                          {formatCurrency(totalCost)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col gap-1 items-end">
                      <Badge
                        variant={order.status === 'received' ? 'default' : order.status === 'draft' ? 'outline' : 'secondary'}
                        className={
                          order.status === 'received'
                            ? 'bg-green-600 hover:bg-green-700 text-xs'
                            : order.status === 'partially_received'
                            ? 'bg-orange-500 hover:bg-orange-600 text-white text-xs'
                            : order.status === 'draft'
                            ? 'border-yellow-500 text-yellow-600 text-xs'
                            : 'text-xs'
                        }
                      >
                        {order.status === 'received' ? 'Received' : order.status === 'partially_received' ? 'Partial' : order.status === 'draft' ? 'Draft' : 'Ordered'}
                      </Badge>
                      {order.paidAt ? (
                        <Badge variant="outline" className="border-blue-500 text-blue-600 text-xs">Paid</Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">Unpaid</Badge>
                      )}
                    </div>
                    {hasAnyPdf && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const url = pdfAttachments[0]?.url || order.pdfUrl;
                          if (!url) return;
                          await downloadFileFromUrl(
                            url,
                            getFileNameFromUrl(url, `${order.poNumber || 'purchase-order'}.pdf`)
                          );
                        }}
                        className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        title="Download PDF"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    )}
                    {hasAnyImage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = imageAttachments[0]?.url || order.imageUrl;
                          if (url) { setViewerUrl(url); setImageViewerOpen(true); }
                        }}
                        className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        title="View image"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>
                    )}
                    <Link
                      to={`/purchase-orders/${order.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      title="Open details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </button>
            </CollapsibleTrigger>

            {/* Collapsible details */}
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-3 border-t">
                {/* Multiple items list */}
                {order.items.length > 1 && (
                  <div className="pt-3 space-y-1.5">
                    {[...order.items].sort((a, b) => a.itemName.localeCompare(b.itemName)).map((item, idx) => (
                      <div key={idx} className="py-1 border-b border-dashed last:border-b-0">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 ml-5 italic">{item.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Single item details */}
                {order.items.length === 1 && (
                  <div className="pt-3 space-y-1">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>SKU: {order.items[0].sku}</span>
                      <span>Qty: {order.items[0].quantity}</span>
                      {order.items[0].unitCost !== undefined && order.items[0].unitCost > 0 && (
                        <span className="font-medium text-foreground">@ {formatCurrency(order.items[0].unitCost)} each</span>
                      )}
                    </div>
                    {order.items[0].notes && (
                      <p className="text-sm text-muted-foreground italic">{order.items[0].notes}</p>
                    )}
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
                    {pstAmount > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>PST ({order.pstPercent}%)</span>
                        <span>{formatCurrency(pstAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-base pt-1 border-t">
                      <span>Total</span>
                      <span>{formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                )}

                {/* Details grid */}
                <div className="border-t pt-3 grid grid-cols-2 gap-2 text-sm">
                  {order.companyName && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>Company: {order.companyName}</span>
                    </div>
                  )}
                  {order.requestNumber && (
                    <div className="flex items-center gap-2 col-span-2">
                      <ClipboardList className="h-4 w-4 text-primary" />
                      <span className="text-primary font-medium">Request: {order.requestNumber}</span>
                    </div>
                  )}
                  {order.jobNumbers && order.jobNumbers.length > 0 && (
                    <div className="flex items-center gap-2 col-span-2 flex-wrap">
                      <Briefcase className="h-4 w-4 text-primary" />
                      {order.jobNumbers.map((jn, idx) => (
                        <span key={idx} className="text-primary font-medium">Job: {jn}</span>
                      ))}
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
                      <span>Received: {format(formatLocalDate(order.receivedAt), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {order.paidAt && (
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-blue-600" />
                      <span>Paid: {format(formatLocalDate(order.paidAt), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {bankCardName && (
                    <div className="flex items-center gap-2 col-span-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span>Card: {bankCardName}</span>
                    </div>
                  )}
                </div>

                {order.notes && (
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                )}

                {/* ── Attachments section ── */}
                <div className="border-t pt-3 space-y-2">
                  {/* Legacy PDF */}
                  {order.pdfUrl && (
                    <div className="flex items-center gap-2">
                      <a
                        href={order.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={async (e) => {
                          e.preventDefault();
                          await downloadFileFromUrl(
                            order.pdfUrl!,
                            getFileNameFromUrl(order.pdfUrl!, `${order.poNumber || 'purchase-order'}-original.pdf`)
                          );
                        }}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        Download PDF (original)
                      </a>
                      {onDeletePdf && (
                        <button onClick={onDeletePdf}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove PDF">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Legacy single image */}
                  {order.imageUrl && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setViewerUrl(order.imageUrl); setImageViewerOpen(true); }}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                        <ImageIcon className="h-4 w-4" />
                        View image (original)
                      </button>
                      {onDeleteImage && (
                        <button onClick={onDeleteImage}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove image">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* New PDF attachments */}
                  {pdfAttachments.map(a => (
                    <div key={a.id} className="flex items-center gap-2">
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={async (e) => {
                          e.preventDefault();
                          await downloadFileFromUrl(
                            a.url,
                            getFileNameFromUrl(a.url, a.fileName || `${order.poNumber || 'purchase-order'}-attachment.pdf`)
                          );
                        }}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline truncate max-w-[200px]"
                      >
                        <FileText className="h-4 w-4 shrink-0" />
                        {a.fileName || 'PDF'}
                      </a>
                      {onDeleteAttachment && (
                        <button onClick={() => onDeleteAttachment(a.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          title="Remove">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* New image attachments grid */}
                  {imageAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {imageAttachments.map(a => (
                        <div key={a.id} className="relative group">
                          <img
                            src={a.url}
                            alt={a.fileName || 'attachment'}
                            className="h-16 w-16 object-cover rounded-md border border-border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => { setViewerUrl(a.url); setImageViewerOpen(true); }}
                          />
                          {onDeleteAttachment && (
                            <button
                              onClick={() => onDeleteAttachment(a.id)}
                              className="absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center h-4 w-4 rounded-full bg-destructive text-destructive-foreground"
                              title="Remove">
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload zone */}
                  {onAddAttachment && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        className="hidden"
                        onChange={handleMultiFilePick}
                      />
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 cursor-pointer transition-colors
                          ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/40'}
                          ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {uploading ? 'Uploading…' : 'Add images or PDFs'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  {onPreview && (
                    <Button variant="outline" size="icon" title="Preview" onClick={() => onPreview(order)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" title="More actions">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {order.status === 'draft' && onMarkOrdered && (
                        <DropdownMenuItem onSelect={() => onMarkOrdered(order.id)} disabled={loading}>
                          <Package className="h-4 w-4 mr-2" />
                          Place Order
                        </DropdownMenuItem>
                      )}
                      {order.status === 'ordered' && onMarkPartiallyReceived && (
                        <DropdownMenuItem onSelect={() => onMarkPartiallyReceived(order.id)} disabled={loading}>
                          <Package className="h-4 w-4 mr-2" />
                          Partial Receive
                        </DropdownMenuItem>
                      )}
                      {(order.status === 'ordered' || order.status === 'partially_received') && (
                        <DropdownMenuItem onSelect={() => onMarkReceived(order.id)} disabled={loading}>
                          <Check className="h-4 w-4 mr-2" />
                          Mark Received
                        </DropdownMenuItem>
                      )}
                      {(order.status === 'received' || order.status === 'partially_received') && onRevert && (
                        <DropdownMenuItem
                          onSelect={(e) => {
                            if (order.status === 'partially_received') {
                              onRevert(order.id);
                            } else {
                              e.preventDefault();
                              setRevertConfirmOpen(true);
                            }
                          }}
                          disabled={loading}
                        >
                          <Undo2 className="h-4 w-4 mr-2" />
                          Revert Received
                        </DropdownMenuItem>
                      )}
                      {!order.paidAt && (
                        <DropdownMenuItem onSelect={() => onMarkPaid(order.id)} disabled={loading}>
                          <Banknote className="h-4 w-4 mr-2" />
                          Mark Paid
                        </DropdownMenuItem>
                      )}
                      {order.paidAt && onRevertPaid && (
                        <DropdownMenuItem onSelect={() => onRevertPaid(order.id)} disabled={loading}>
                          <Undo2 className="h-4 w-4 mr-2" />
                          Revert Paid
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => onEdit(order)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onDownload(order)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={() => onDelete(order.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      <ImageViewerDialog
        imageUrl={viewerUrl || order.imageUrl}
        alt={order.poNumber || 'Purchase Order'}
        open={imageViewerOpen}
        onOpenChange={setImageViewerOpen}
      />

      {/* Revert Confirmation Dialog */}
      <AlertDialog open={revertConfirmOpen} onOpenChange={setRevertConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Undo2 className="h-5 w-5 text-orange-500" />
              Revert {order.poNumber || 'this order'}?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Reverting this order will perform the following actions:</p>
                <ul className="list-disc list-inside space-y-1.5 text-foreground/80">
                  <li>Status will change from <strong>Received</strong> back to <strong>Ordered</strong></li>
                  <li>Received date will be cleared</li>
                  {order.items.map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.quantity}×</strong> {item.itemName} ({item.sku}) will be <strong>deducted</strong> from inventory (both global and location quantities)
                    </li>
                  ))}
                </ul>
                <p className="text-orange-600 font-medium">This may cause inventory quantities to drop to zero if stock has already been used.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onRevert!(order.id)}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              Revert Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
