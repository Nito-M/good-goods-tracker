import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw, Eye, EyeOff, ImageIcon } from 'lucide-react';
import { InvoiceLayout, InvoiceElementKey, invoiceElementLabels, defaultInvoiceLayout } from '@/types/invoiceLayout';
import { cn } from '@/lib/utils';

interface InvoiceLayoutEditorProps {
  layout: InvoiceLayout;
  onChange: (layout: InvoiceLayout) => void;
  logoUrl?: string | null;
  businessName?: string | null;
  businessAddress?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  documentType?: 'invoice' | 'quote';
  thankYouNote?: string | null;
}

const SCALE = 2;
const PAGE_WIDTH = 210 * SCALE;
const PAGE_HEIGHT = 297 * SCALE;

const elementSizes: Record<InvoiceElementKey, { width: number; height: number }> = {
  logo: { width: 112, height: 112 },
  businessInfo: { width: 140, height: 80 },
  invoiceTitle: { width: 100, height: 30 },
  invoiceDetails: { width: 160, height: 40 },
  billTo: { width: 140, height: 60 },
  itemsTable: { width: 340, height: 120 },
  totals: { width: 120, height: 60 },
  notes: { width: 200, height: 40 },
  footer: { width: 200, height: 20 },
};

const validKeys = Object.keys(defaultInvoiceLayout) as InvoiceElementKey[];

function ElementContent({
  elementKey,
  logoUrl,
  businessName,
  businessAddress,
  businessPhone,
  businessEmail,
  documentType,
  thankYouNote,
}: {
  elementKey: InvoiceElementKey;
  logoUrl?: string | null;
  businessName?: string | null;
  businessAddress?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  documentType: 'invoice' | 'quote';
  thankYouNote?: string | null;
}) {
  const docLabel = documentType === 'quote' ? 'QUOTE' : 'INVOICE';
  const numPrefix = documentType === 'quote' ? 'QT' : 'INV';

  switch (elementKey) {
    case 'logo':
      return logoUrl ? (
        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
      ) : (
        <div className="flex flex-col items-center justify-center text-muted-foreground/40 gap-1">
          <ImageIcon className="h-6 w-6" />
          <span style={{ fontSize: '6px' }}>Company Logo</span>
        </div>
      );
    case 'businessInfo':
      return (
        <div className="w-full h-full flex flex-col justify-start p-1 text-right overflow-hidden" style={{ fontSize: '6px', lineHeight: '1.4' }}>
          <span className="font-bold" style={{ fontSize: '7px' }}>{businessName || 'Company Name'}</span>
          <span className="text-muted-foreground">{businessAddress || '123 Business St\nCity, ST 12345'}</span>
          <span className="text-muted-foreground">{businessPhone || '(555) 123-4567'}</span>
          <span className="text-muted-foreground">{businessEmail || 'info@company.com'}</span>
        </div>
      );
    case 'invoiceTitle':
      return (
        <div className="w-full h-full flex items-center justify-center">
          <span className="font-extrabold tracking-wide" style={{ fontSize: '12px' }}>{docLabel}</span>
        </div>
      );
    case 'invoiceDetails':
      return (
        <div className="w-full h-full flex flex-col justify-center p-1 overflow-hidden" style={{ fontSize: '5.5px', lineHeight: '1.5' }}>
          <div className="flex justify-between"><span className="text-muted-foreground">{docLabel} #:</span><span className="font-medium">{numPrefix}-0001</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Date:</span><span>Feb 17, 2026</span></div>
          
        </div>
      );
    case 'billTo':
      return (
        <div className="w-full h-full flex flex-col justify-start p-1 overflow-hidden" style={{ fontSize: '5.5px', lineHeight: '1.5' }}>
          <span className="font-bold" style={{ fontSize: '6px' }}>Bill To:</span>
          <span>John Smith</span>
          <span className="text-muted-foreground">456 Customer Ave</span>
          <span className="text-muted-foreground">Townsville, ST 67890</span>
        </div>
      );
    case 'itemsTable':
      return (
        <div className="w-full h-full flex flex-col p-1 overflow-hidden" style={{ fontSize: '5px' }}>
          {/* Header */}
          <div className="flex gap-1 font-bold border-b pb-0.5 mb-0.5" style={{ borderColor: 'hsl(var(--border))' }}>
            <span className="flex-1">Item</span>
            <span className="w-8 text-center">SKU</span>
            <span className="w-5 text-center">Qty</span>
            <span className="w-8 text-right">Price</span>
            <span className="w-8 text-right">Total</span>
          </div>
          {/* Sample rows */}
          {[
            { name: 'Widget Alpha', sku: 'WA-01', qty: '2', price: '$25.00', total: '$50.00' },
            { name: 'Gadget Beta', sku: 'GB-02', qty: '1', price: '$75.00', total: '$75.00' },
            { name: 'Part Gamma', sku: 'PG-03', qty: '5', price: '$10.00', total: '$50.00' },
          ].map((row, i) => (
            <div key={i} className="flex gap-1 py-px text-muted-foreground" style={{ borderBottom: '0.5px solid hsl(var(--border) / 0.5)' }}>
              <span className="flex-1 truncate">{row.name}</span>
              <span className="w-8 text-center">{row.sku}</span>
              <span className="w-5 text-center">{row.qty}</span>
              <span className="w-8 text-right">{row.price}</span>
              <span className="w-8 text-right">{row.total}</span>
            </div>
          ))}
          {/* Blank rows */}
          {[1, 2].map((i) => (
            <div key={`blank-${i}`} className="flex gap-1 py-px">
              <div className="flex-1 h-2 bg-muted/50 rounded-sm my-0.5" />
              <div className="w-8 h-2 bg-muted/50 rounded-sm my-0.5" />
              <div className="w-5 h-2 bg-muted/50 rounded-sm my-0.5" />
              <div className="w-8 h-2 bg-muted/50 rounded-sm my-0.5" />
              <div className="w-8 h-2 bg-muted/50 rounded-sm my-0.5" />
            </div>
          ))}
        </div>
      );
    case 'totals':
      return (
        <div className="w-full h-full flex flex-col justify-center p-1 text-right overflow-hidden" style={{ fontSize: '5.5px', lineHeight: '1.6' }}>
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span>$175.00</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax (13%):</span><span>$22.75</span></div>
          <div className="flex justify-between font-bold border-t pt-0.5 mt-0.5" style={{ fontSize: '6px', borderColor: 'hsl(var(--border))' }}>
            <span>Total:</span><span>$197.75</span>
          </div>
        </div>
      );
    case 'notes':
      return (
        <div className="w-full h-full flex flex-col justify-start p-1 overflow-hidden" style={{ fontSize: '5.5px', lineHeight: '1.4' }}>
          <span className="font-bold" style={{ fontSize: '6px' }}>Notes:</span>
          <div className="space-y-0.5 mt-0.5">
            <div className="h-1.5 bg-muted/50 rounded-sm w-4/5" />
            <div className="h-1.5 bg-muted/50 rounded-sm w-3/5" />
          </div>
        </div>
      );
    case 'footer':
      return (
        <div className="w-full h-full flex items-center justify-center text-center overflow-hidden" style={{ fontSize: '5px' }}>
          <span className="text-muted-foreground italic truncate px-1">
            {thankYouNote || (documentType === 'quote' ? 'Thank you for considering our services!' : 'Thank you for your business!')}
          </span>
        </div>
      );
    default:
      return null;
  }
}

export function InvoiceLayoutEditor({
  layout,
  onChange,
  logoUrl,
  businessName,
  businessAddress,
  businessPhone,
  businessEmail,
  documentType = 'invoice',
  thankYouNote,
}: InvoiceLayoutEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<InvoiceElementKey | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredElement, setHoveredElement] = useState<InvoiceElementKey | null>(null);

  const safeLayout: InvoiceLayout = { ...defaultInvoiceLayout, ...layout };

  const handleMouseDown = useCallback((key: InvoiceElementKey, e: React.MouseEvent) => {
    if (!safeLayout[key]?.visible) return;
    e.preventDefault();
    const rect = (e.target as HTMLElement).closest('[data-layout-element]')!.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragging(key);
  }, [safeLayout]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(PAGE_WIDTH - elementSizes[dragging].width, e.clientX - canvasRect.left - dragOffset.x));
    const y = Math.max(0, Math.min(PAGE_HEIGHT - elementSizes[dragging].height, e.clientY - canvasRect.top - dragOffset.y));
    onChange({ ...safeLayout, [dragging]: { ...safeLayout[dragging], x: Math.round(x / SCALE), y: Math.round(y / SCALE) } });
  }, [dragging, dragOffset, safeLayout, onChange]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (dragging) {
      const up = () => setDragging(null);
      window.addEventListener('mouseup', up);
      return () => window.removeEventListener('mouseup', up);
    }
  }, [dragging]);

  const toggleVisibility = (key: InvoiceElementKey) => {
    onChange({ ...safeLayout, [key]: { ...safeLayout[key], visible: !safeLayout[key].visible } });
  };

  const getElementPosition = (key: InvoiceElementKey) => {
    const pos = safeLayout[key];
    if (!pos) return { left: 0, top: 0 };
    const y = pos.y === -1 ? PAGE_HEIGHT - 60 - (key === 'footer' ? 0 : key === 'notes' ? 40 : 20) : pos.y * SCALE;
    return { left: pos.x * SCALE, top: y };
  };

  const title = documentType === 'quote' ? 'Quote Layout' : 'Invoice Layout';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">{title}</h4>
          <p className="text-xs text-muted-foreground">Drag elements to reposition them on your {documentType}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onChange(defaultInvoiceLayout)} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>

      <div className="flex gap-4">
        {/* Canvas */}
        <div
          ref={canvasRef}
          className="relative bg-white border rounded-lg shadow-sm overflow-hidden flex-shrink-0"
          style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {validKeys.map((key) => {
            const pos = getElementPosition(key);
            const size = elementSizes[key];
            const isVisible = safeLayout[key]?.visible ?? true;
            const isActive = dragging === key || hoveredElement === key;

            return (
              <div
                key={key}
                data-layout-element
                className={cn(
                  'absolute rounded transition-all select-none',
                  isVisible ? 'opacity-100 cursor-move' : 'opacity-20 pointer-events-none',
                  isActive ? 'border border-dashed border-primary/60 shadow-md' : 'border border-transparent',
                  dragging === key && 'ring-1 ring-primary/40 z-10',
                )}
                style={{ left: pos.left, top: pos.top, width: size.width, height: size.height }}
                onMouseDown={(e) => handleMouseDown(key, e)}
                onMouseEnter={() => setHoveredElement(key)}
                onMouseLeave={() => setHoveredElement(null)}
              >
                <ElementContent
                  elementKey={key}
                  logoUrl={logoUrl}
                  businessName={businessName}
                  businessAddress={businessAddress}
                  businessPhone={businessPhone}
                  businessEmail={businessEmail}
                  documentType={documentType}
                  thankYouNote={thankYouNote}
                />
              </div>
            );
          })}
        </div>

        {/* Visibility controls */}
        <Card className="flex-1 min-w-[200px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Element Visibility</CardTitle>
            <CardDescription className="text-xs">Toggle which elements appear on {documentType}s</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {validKeys.map((key) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={`vis-${key}`} className="text-sm cursor-pointer">
                  {invoiceElementLabels[key]}
                </Label>
                <div className="flex items-center gap-2">
                  {safeLayout[key]?.visible ? (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Switch
                    id={`vis-${key}`}
                    checked={safeLayout[key]?.visible ?? true}
                    onCheckedChange={() => toggleVisibility(key)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: The preview shows approximate positions. Some elements like the items table will expand based on content.
      </p>
    </div>
  );
}
