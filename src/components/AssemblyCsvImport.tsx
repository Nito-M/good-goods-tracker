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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAssemblies } from '@/hooks/useAssemblies';
import { supabase } from '@/integrations/supabase/client';

interface ParsedRow {
  assembly_name: string;
  assembly_type: string;
  item_name: string;
  sku: string;
  quantity: number;
  notes: string;
}

interface AssemblyGroup {
  name: string;
  type: string;
  items: ParsedRow[];
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): { rows: ParsedRow[]; warnings: string[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { rows: [], warnings: ['CSV must have a header row and at least one data row.'] };

  const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const nameIdx = header.indexOf('assembly_name');
  const typeIdx = header.indexOf('assembly_type');
  const itemIdx = header.indexOf('item_name');
  const skuIdx = header.indexOf('sku');
  const qtyIdx = header.indexOf('quantity');
  const notesIdx = header.indexOf('notes');

  const warnings: string[] = [];
  if (nameIdx === -1) warnings.push('Missing required column: assembly_name');
  if (itemIdx === -1) warnings.push('Missing required column: item_name');
  if (skuIdx === -1) warnings.push('Missing required column: sku');
  if (qtyIdx === -1) warnings.push('Missing required column: quantity');
  if (warnings.length > 0) return { rows: [], warnings };

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const assemblyName = cols[nameIdx]?.trim();
    const itemName = cols[itemIdx]?.trim();
    const sku = cols[skuIdx]?.trim();
    const qty = parseFloat(cols[qtyIdx] || '0');

    if (!assemblyName || !itemName) {
      warnings.push(`Row ${i + 1}: missing assembly_name or item_name, skipped.`);
      continue;
    }

    rows.push({
      assembly_name: assemblyName,
      assembly_type: (typeIdx >= 0 ? cols[typeIdx]?.trim() : '') || 'General',
      item_name: itemName,
      sku: sku || '',
      quantity: isNaN(qty) || qty <= 0 ? 1 : qty,
      notes: notesIdx >= 0 ? (cols[notesIdx]?.trim() || '') : '',
    });
  }

  return { rows, warnings };
}

function groupRows(rows: ParsedRow[]): AssemblyGroup[] {
  const map = new Map<string, AssemblyGroup>();
  for (const row of rows) {
    let group = map.get(row.assembly_name);
    if (!group) {
      group = { name: row.assembly_name, type: row.assembly_type, items: [] };
      map.set(row.assembly_name, group);
    }
    group.items.push(row);
  }
  return Array.from(map.values());
}

interface Props {
  onComplete: () => void;
}

export function AssemblyCsvImport({ onComplete }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { createAssembly } = useAssemblies();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [groups, setGroups] = useState<AssemblyGroup[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows, warnings: w } = parseCSV(text);
      setWarnings(w);
      if (rows.length === 0) {
        toast({ title: 'No valid rows found', description: w.join(' '), variant: 'destructive' });
        return;
      }
      setGroups(groupRows(rows));
      setPreviewOpen(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirm = async () => {
    if (!user) return;
    setImporting(true);

    // Collect all unique SKUs to match inventory
    const allSkus = [...new Set(groups.flatMap(g => g.items.map(i => i.sku)).filter(Boolean))];
    let skuMap = new Map<string, string>();
    if (allSkus.length > 0) {
      const { data } = await supabase
        .from('inventory_items')
        .select('id, sku')
        .in('sku', allSkus)
        .is('deleted_at', null);
      if (data) {
        for (const item of data) {
          skuMap.set(item.sku, item.id);
        }
      }
    }

    let created = 0;
    for (const group of groups) {
      const assembly = await createAssembly(group.name, undefined, group.type);
      if (!assembly) continue;

      const itemsToInsert = group.items.map(item => ({
        assembly_id: assembly.id,
        item_name: item.item_name,
        sku: item.sku,
        quantity: item.quantity,
        notes: item.notes || null,
        inventory_item_id: skuMap.get(item.sku) || null,
      }));

      const { error } = await supabase.from('assembly_items').insert(itemsToInsert);
      if (!error) created++;
    }

    setImporting(false);
    setPreviewOpen(false);
    toast({ title: `${created} assembl${created !== 1 ? 'ies' : 'y'} created` });
    onComplete();
  };

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

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {groups.map((g, i) => (
                <div key={i} className="border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm">{g.name}</span>
                    <Badge variant="secondary" className="text-xs">{g.type}</Badge>
                    <Badge variant="outline" className="text-xs">{g.items.length} item{g.items.length !== 1 ? 's' : ''}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {g.items.map((item, j) => (
                      <div key={j} className="flex gap-2">
                        <span className="truncate flex-1">{item.item_name}</span>
                        <span className="text-muted-foreground">{item.sku || '—'}</span>
                        <span>×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={importing}>
              {importing ? 'Importing...' : `Create ${groups.length} Assembl${groups.length !== 1 ? 'ies' : 'y'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
