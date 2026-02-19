import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';
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
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PurchaseOrderCardProps {
  order: PurchaseOrder;
  onMarkOrdered?: (id: string) => void;
  onMarkReceived: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (order: PurchaseOrder) => void;
  onDownload: (order: PurchaseOrder) => void;
  onPreview?: (order: PurchaseOrder) => void;
  onUploadImage?: (file: File) => Promise<boolean>;
  onDeleteImage?: () => Promise<boolean>;
  onDeletePdf?: () => Promise<boolean>;
  loading?: boolean;
  bankCardName?: string | null;
}

export function PurchaseOrderCard({
  order,
  onMarkOrdered,
  onMarkReceived,
  onMarkPaid,
  onDelete,
  onEdit,
  onDownload,
  onPreview,
  onUploadImage,
  onDeleteImage,
  onDeletePdf,
  loading,
  bankCardName,
}: PurchaseOrderCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!onUploadImage) return;
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    await onUploadImage(file);
    setUploading(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  const TAX_RATE = 0.05;
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = order.items.reduce((sum, item) => sum + (item.unitCost || 0) * item.quantity, 0);
  const discountAmount = order.discountAmount || 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = afterDiscount * TAX_RATE;
  const totalCost = afterDiscount + taxAmount;

  const formatLocalDate = (dateValue: Date | string) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return new Date(year, month, day, 12, 0, 0);
  };

  return (
    <>
      <Card className="overflow-hidden">
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
                          : order.status === 'draft'
                          ? 'border-yellow-500 text-yellow-600 text-xs'
                          : 'text-xs'
                      }
                    >
                      {order.status === 'received' ? 'Received' : order.status === 'draft' ? 'Draft' : 'Ordered'}
                    </Badge>
                    {order.paidAt ? (
                      <Badge variant="outline" className="border-blue-500 text-blue-600 text-xs">Paid</Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">Unpaid</Badge>
                    )}
                  </div>
                  {order.imageUrl && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setImageViewerOpen(true); }}
                      className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      title="View image"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                  )}
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

              {/* PDF link */}
              {order.pdfUrl && (
                <div className="flex items-center gap-2">
                  <a
                    href={order.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    View PDF
                  </a>
                  {onDeletePdf && (
                    <button
                      onClick={onDeletePdf}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove PDF"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Image upload zone */}
              {onUploadImage && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }}
                  />
                  <div className="flex items-center gap-2">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-4 cursor-pointer transition-colors text-center
                        ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/40'}
                        ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {uploading ? 'Uploading…' : order.imageUrl ? 'Replace image' : 'Drop image or click to upload'}
                      </span>
                    </div>
                    {order.imageUrl && onDeleteImage && (
                      <button
                        onClick={onDeleteImage}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {order.status === 'draft' && onMarkOrdered && (
                  <Button size="sm" onClick={() => onMarkOrdered(order.id)} disabled={loading} className="gap-2">
                    <Package className="h-4 w-4" />
                    Place Order
                  </Button>
                )}
                {order.status === 'ordered' && (
                  <Button size="sm" onClick={() => onMarkReceived(order.id)} disabled={loading} className="gap-2">
                    <Check className="h-4 w-4" />
                    Mark Received
                  </Button>
                )}
                {!order.paidAt && (
                  <Button size="sm" variant="outline" onClick={() => onMarkPaid(order.id)} disabled={loading} className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50">
                    <Banknote className="h-4 w-4" />
                    Mark Paid
                  </Button>
                )}
                {onPreview && (
                  <Button size="sm" variant="outline" onClick={() => onPreview(order)} className="gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => onDownload(order)} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(order)} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDelete(order.id)} className="gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>

    <ImageViewerDialog
      imageUrl={order.imageUrl}
      alt={order.poNumber || 'Purchase Order'}
      open={imageViewerOpen}
      onOpenChange={setImageViewerOpen}
    />
  </>
  );
}
