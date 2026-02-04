import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw, Move, Eye, EyeOff } from 'lucide-react';
import { InvoiceLayout, InvoiceElementKey, invoiceElementLabels, defaultInvoiceLayout } from '@/types/invoiceLayout';
import { cn } from '@/lib/utils';

interface InvoiceLayoutEditorProps {
  layout: InvoiceLayout;
  onChange: (layout: InvoiceLayout) => void;
  logoUrl?: string | null;
  businessName?: string | null;
}

// A4 dimensions in mm: 210 x 297
// We'll use a scaled preview (2px per mm = 420x594px canvas)
const SCALE = 2;
const PAGE_WIDTH = 210 * SCALE;
const PAGE_HEIGHT = 297 * SCALE;

const elementColors: Record<InvoiceElementKey, string> = {
  logo: 'bg-blue-500/20 border-blue-500',
  businessInfo: 'bg-green-500/20 border-green-500',
  invoiceTitle: 'bg-purple-500/20 border-purple-500',
  invoiceDetails: 'bg-orange-500/20 border-orange-500',
  billTo: 'bg-pink-500/20 border-pink-500',
  itemsTable: 'bg-cyan-500/20 border-cyan-500',
  totals: 'bg-yellow-500/20 border-yellow-500',
  notes: 'bg-red-500/20 border-red-500',
  footer: 'bg-gray-500/20 border-gray-500',
};

// Approximate sizes for each element (in scaled pixels)
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

export function InvoiceLayoutEditor({ layout, onChange, logoUrl, businessName }: InvoiceLayoutEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<InvoiceElementKey | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState<InvoiceElementKey | null>(null);

  // Ensure layout has all required keys - merge with defaults to handle partial/corrupted layouts
  const safeLayout: InvoiceLayout = {
    ...defaultInvoiceLayout,
    ...layout,
  };

  // Filter to only valid element keys that exist in elementSizes
  const validKeys = (Object.keys(defaultInvoiceLayout) as InvoiceElementKey[]);

  const handleMouseDown = useCallback((key: InvoiceElementKey, e: React.MouseEvent) => {
    if (!safeLayout[key]?.visible) return;
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setDragging(key);
    setSelectedElement(key);
  }, [safeLayout]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(PAGE_WIDTH - elementSizes[dragging].width, 
      e.clientX - canvasRect.left - dragOffset.x));
    const y = Math.max(0, Math.min(PAGE_HEIGHT - elementSizes[dragging].height, 
      e.clientY - canvasRect.top - dragOffset.y));
    
    // Convert back to mm for storage
    const newLayout = {
      ...safeLayout,
      [dragging]: {
        ...safeLayout[dragging],
        x: Math.round(x / SCALE),
        y: Math.round(y / SCALE),
      },
    };
    onChange(newLayout);
  }, [dragging, dragOffset, safeLayout, onChange]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      const handleGlobalMouseUp = () => setDragging(null);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [dragging]);

  const toggleVisibility = (key: InvoiceElementKey) => {
    onChange({
      ...safeLayout,
      [key]: {
        ...safeLayout[key],
        visible: !safeLayout[key].visible,
      },
    });
  };

  const resetLayout = () => {
    onChange(defaultInvoiceLayout);
  };

  const getElementPosition = (key: InvoiceElementKey) => {
    const pos = safeLayout[key];
    if (!pos) return { left: 0, top: 0 };
    // Y of -1 means auto-positioned (at end of content)
    const y = pos.y === -1 ? PAGE_HEIGHT - 60 - (key === 'footer' ? 0 : key === 'notes' ? 40 : 20) : pos.y * SCALE;
    return {
      left: pos.x * SCALE,
      top: y,
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Invoice Layout</h4>
          <p className="text-xs text-muted-foreground">Drag elements to reposition them on your invoice</p>
        </div>
        <Button variant="outline" size="sm" onClick={resetLayout} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="flex gap-4">
        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="relative bg-white border rounded-lg shadow-sm overflow-hidden cursor-crosshair flex-shrink-0"
          style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid lines for guidance */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-400" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-400" />
          </div>

          {/* Draggable elements */}
          {validKeys.map((key) => {
            const pos = getElementPosition(key);
            const size = elementSizes[key];
            if (!size) return null;
            const isVisible = safeLayout[key]?.visible ?? true;
            
            return (
              <div
                key={key}
                className={cn(
                  'absolute border-2 rounded flex items-center justify-center text-xs font-medium transition-opacity select-none',
                  elementColors[key],
                  isVisible ? 'opacity-100' : 'opacity-30 pointer-events-none',
                  dragging === key && 'ring-2 ring-primary shadow-lg',
                  selectedElement === key && !dragging && 'ring-1 ring-primary/50',
                  isVisible && 'cursor-move hover:shadow-md'
                )}
                style={{
                  left: pos.left,
                  top: pos.top,
                  width: size.width,
                  height: size.height,
                }}
                onMouseDown={(e) => handleMouseDown(key, e)}
              >
                <div className="flex items-center gap-1 text-foreground/70">
                  <Move className="h-3 w-3" />
                  <span className="truncate">{invoiceElementLabels[key]}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Element visibility controls */}
        <Card className="flex-1 min-w-[200px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Element Visibility</CardTitle>
            <CardDescription className="text-xs">Toggle which elements appear on invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {validKeys.map((key) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('w-3 h-3 rounded border', elementColors[key])} />
                  <Label htmlFor={`vis-${key}`} className="text-sm cursor-pointer">
                    {invoiceElementLabels[key]}
                  </Label>
                </div>
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
