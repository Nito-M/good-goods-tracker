import { useMemo, useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Quote, QuoteSettings } from '@/types/quote';
import { generatePackingSlipPDF, PackingSlipRow } from '@/lib/packingSlipGenerator';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PackingSlipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
  settings: QuoteSettings;
  rows: PackingSlipRow[];
}

export function PackingSlipDialog({ open, onOpenChange, quote, settings, rows }: PackingSlipDialogProps) {
  const [includePrices, setIncludePrices] = useState(true);
  const [includeStockNumber, setIncludeStockNumber] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const missingVins = useMemo(() => rows.filter((r) => !r.vin).length, [rows]);

  const handleDownload = async () => {
    setGenerating(true);
    try {
      await generatePackingSlipPDF(quote, settings, { includePrices, includeStockNumber, rows });
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to generate packing slip:', err);
      toast({ title: 'Failed to generate packing slip', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Packing / Delivery Slip</DialogTitle>
          <DialogDescription>
            One row per unit. VIN, Stock # and Job # come from the job linked to each unit.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Checkbox
            id="includePrices"
            checked={includePrices}
            onCheckedChange={(v) => setIncludePrices(v === true)}
          />
          <Label htmlFor="includePrices" className="cursor-pointer">Include prices</Label>
        </div>

        {missingVins > 0 && (
          <p className="text-sm text-muted-foreground">
            {missingVins} unit{missingVins === 1 ? '' : 's'} without a VIN — those will print a blank line to fill in.
          </p>
        )}

        <div className="max-h-[45vh] overflow-y-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item / Trailer</TableHead>
                <TableHead>VIN</TableHead>
                <TableHead>Stock #</TableHead>
                <TableHead>Job #</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                {includePrices && <TableHead className="text-right">Unit Price</TableHead>}
                {includePrices && <TableHead className="text-right">Total</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={includePrices ? 7 : 5} className="text-center text-muted-foreground">
                    No units on this sales order.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium break-words">{row.itemName}</TableCell>
                    <TableCell className={row.vin ? '' : 'text-muted-foreground italic'}>
                      {row.vin || 'blank'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.stockNumber || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{row.jobNumber || '—'}</TableCell>
                    <TableCell className="text-right">{row.quantity}</TableCell>
                    {includePrices && <TableCell className="text-right">{formatCurrency(row.unitPrice)}</TableCell>}
                    {includePrices && <TableCell className="text-right">{formatCurrency(row.totalPrice)}</TableCell>}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Cancel
          </Button>
          <Button onClick={handleDownload} disabled={generating || rows.length === 0}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
