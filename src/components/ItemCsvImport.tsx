import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { InventoryItem, QuantityUnit } from '@/types/inventory';
import { supabase } from '@/integrations/supabase/client';

interface ParsedItem {
  name: string;
  description: string;
  tags: string[];
  quantityUnit: QuantityUnit;
  vendorNames: string[];
}

const UNIT_MAP: Record<string, QuantityUnit> = {
  piece: 'pcs',
  pieces: 'pcs',
  pcs: 'pcs',
  pc: 'pcs',
  each: 'pcs',
  ea: 'pcs',
  foot: 'ft',
  feet: 'ft',
  ft: 'ft',
  meter: 'm',
  meters: 'm',
  m: 'm',
  yard: 'yd',
  yards: 'yd',
  yd: 'yd',
  inch: 'in',
  inches: 'in',
  in: 'in',
  sqft: 'sqft',
  'sq ft': 'sqft',
};

function parseCSVRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  let cellStart = true;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"' && cellStart) {
        inQuotes = true;
        cellStart = false;
      } else if (ch === '"') {
        // Quote in the middle of an unquoted cell — treat as literal
        cell += ch;
      } else if (ch === ',') {
        row.push(cell.trim());
        cell = '';
        cellStart = true;
      } else if (ch === '\r') {
        // skip
      } else if (ch === '\n') {
        row.push(cell.trim());
        cell = '';
        cellStart = true;
        if (row.some(c => c !== '')) rows.push(row);
        row = [];
      } else {
        cell += ch;
        cellStart = false;
      }
    }
  }
  row.push(cell.trim());
  if (row.some(c => c !== '')) rows.push(row);

  return rows;
}

function parseUnit(raw: string): QuantityUnit {
  const key = raw.toLowerCase().trim();
  return UNIT_MAP[key] || 'pcs';
}

function parseCSV(text: string): { rows: ParsedItem[]; warnings: string[] } {
  const allRows = parseCSVRows(text);
  if (allRows.length < 2) return { rows: [], warnings: ['CSV must have a header row and at least one data row.'] };

  const warnings: string[] = [];
  const rows: ParsedItem[] = [];
  for (let i = 1; i < allRows.length; i++) {
    const cols = allRows[i];
    const name = cols[0] || '';
    if (!name) {
      warnings.push(`Row ${i + 1}: missing name, skipped.`);
      continue;
    }
    const tagsRaw = cols[2] || '';
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    const unitRaw = cols[3] || '';
    const vendorsRaw = cols[4] || '';
    const vendorNames = vendorsRaw ? vendorsRaw.split(',').map(v => v.trim()).filter(Boolean) : [];

    rows.push({
      name,
      description: cols[1] || '',
      tags,
      quantityUnit: parseUnit(unitRaw),
      vendorNames,
    });
  }

  return { rows, warnings };
}

interface Props {
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
}

export function ItemCsvImport({ addItem }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [rows, setRows] = useState<ParsedItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows: parsed, warnings: w } = parseCSV(text);
      setWarnings(w);
      if (parsed.length === 0) {
        toast({ title: 'No valid rows found', description: w.join(' '), variant: 'destructive' });
        return;
      }
      setRows(parsed);
      setPreviewOpen(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirm = async () => {
    if (!user) return;
    setImporting(true);

    // Fetch vendors to match by name
    const { data: vendorData } = await supabase
      .from('vendors')
      .select('id, name');
    const vendors = vendorData || [];
    const vendorByName = new Map<string, string>();
    for (const v of vendors) {
      vendorByName.set(v.name.toLowerCase(), v.id);
    }

    let created = 0;
    let vendorLinked = 0;
    for (const row of rows) {
      const id = await addItem({
        name: row.name,
        description: row.description,
        sku: row.name.substring(0, 100),
        category: 'Other',
        quantity: 0,
        quantityUnit: row.quantityUnit,
        price: 0,
        cost: 0,
        minStock: 0,
        weight: 0,
        weightUnit: 'lb',
        dimensions: { length: 0, width: 0, height: 0, unit: 'in' },
        colors: [],
      });
      if (!id) continue;
      created++;

      // Link vendors
      for (const vName of row.vendorNames) {
        const vendorId = vendorByName.get(vName.toLowerCase());
        if (vendorId) {
          const { error } = await supabase
            .from('item_vendor_prices')
            .insert({
              item_id: id,
              vendor_id: vendorId,
              price: 0,
              user_id: user.id,
            });
          if (!error) vendorLinked++;
        }
      }
    }

    setImporting(false);
    setPreviewOpen(false);
    const parts = [`${created} item${created !== 1 ? 's' : ''} created`];
    if (vendorLinked > 0) parts.push(`${vendorLinked} vendor link${vendorLinked !== 1 ? 's' : ''} added`);
    toast({ title: parts.join(', ') });
  };

  // Collect all unique vendor names for preview
  const allVendors = [...new Set(rows.flatMap(r => r.vendorNames))];

  return (
    <>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      <Button variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}>
        <Upload className="h-4 w-4" /> Import CSV
      </Button>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>CSV Import Preview</DialogTitle>
          </DialogHeader>

          {warnings.length > 0 && (
            <div className="text-sm text-destructive space-y-1">
              {warnings.map((w, i) => <p key={i}>⚠ {w}</p>)}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            {rows.length} item{rows.length !== 1 ? 's' : ''} will be created.
            {allVendors.length > 0 && (
              <> Vendors: <span className="font-medium text-foreground">{allVendors.join(', ')}</span></>
            )}
          </p>

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-1">
              {rows.map((r, i) => (
                <div key={i} className="border border-border rounded-lg px-3 py-2">
                  <span className="font-medium text-sm">{r.name}</span>
                  {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {r.quantityUnit !== 'pcs' && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{r.quantityUnit}</Badge>
                    )}
                    {r.vendorNames.map((v, vi) => (
                      <Badge key={vi} variant="secondary" className="text-[10px] px-1.5 py-0">{v}</Badge>
                    ))}
                    {r.tags.map((t, ti) => (
                      <Badge key={ti} variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30">{t}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={importing}>
              {importing ? 'Importing...' : `Create ${rows.length} Item${rows.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
