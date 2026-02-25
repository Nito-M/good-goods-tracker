import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useParts } from '@/hooks/useParts';

interface ParsedPart {
  name: string;
  description: string;
  tags: string;
  unitOfMeasure: string;
}

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
        if (text[i + 1] === '"') { cell += '"'; i++; } else { inQuotes = false; }
      } else { cell += ch; }
    } else {
      if (ch === '"' && cellStart) { inQuotes = true; cellStart = false; }
      else if (ch === '"') { cell += ch; }
      else if (ch === ',') { row.push(cell.trim()); cell = ''; cellStart = true; }
      else if (ch === '\r') { /* skip */ }
      else if (ch === '\n') {
        row.push(cell.trim()); cell = ''; cellStart = true;
        if (row.some(c => c !== '')) rows.push(row);
        row = [];
      } else { cell += ch; cellStart = false; }
    }
  }
  row.push(cell.trim());
  if (row.some(c => c !== '')) rows.push(row);
  return rows;
}

function parseCSV(text: string): { rows: ParsedPart[]; warnings: string[] } {
  const allRows = parseCSVRows(text);
  if (allRows.length < 2) return { rows: [], warnings: ['CSV must have a header row and at least one data row.'] };

  const warnings: string[] = [];
  const rows: ParsedPart[] = [];
  for (let i = 1; i < allRows.length; i++) {
    const cols = allRows[i];
    const name = cols[0] || '';
    if (!name) { warnings.push(`Row ${i + 1}: missing name, skipped.`); continue; }
    rows.push({
      name,
      description: cols[1] || '',
      tags: cols[2] || '',
      unitOfMeasure: cols[3] || '',
    });
  }
  return { rows, warnings };
}

interface Props {
  currentFolderId: string | null;
}

export function PartsCsvImport({ currentFolderId }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { addPart } = useParts();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [rows, setRows] = useState<ParsedPart[]>([]);
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
    setImporting(true);
    let created = 0;
    for (const row of rows) {
      const id = await addPart({
        name: row.name,
        sku: row.name.substring(0, 100),
        description: row.description || undefined,
        folderId: currentFolderId,
      });
      if (id) created++;
    }
    setImporting(false);
    setPreviewOpen(false);
    toast({ title: `${created} part${created !== 1 ? 's' : ''} created` });
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

          <p className="text-sm text-muted-foreground">
            {rows.length} part{rows.length !== 1 ? 's' : ''} will be created.
            Expected CSV columns: <span className="font-medium text-foreground">Number, Description, Tags, Unit Of Measure</span>
          </p>

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-1">
              {rows.map((r, i) => (
                <div key={i} className="border border-border rounded-lg px-3 py-2">
                  <span className="font-medium text-sm">{r.name}</span>
                  {r.tags && <Badge variant="secondary" className="ml-2 text-xs">{r.tags}</Badge>}
                  {r.unitOfMeasure && <Badge variant="outline" className="ml-1 text-xs">{r.unitOfMeasure}</Badge>}
                  {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={importing}>
              {importing ? 'Importing...' : `Create ${rows.length} Part${rows.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
