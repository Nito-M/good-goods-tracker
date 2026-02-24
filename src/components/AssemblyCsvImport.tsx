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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAssemblies } from '@/hooks/useAssemblies';

interface ParsedAssembly {
  name: string;
  description: string;
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

function parseCSV(text: string): { rows: ParsedAssembly[]; warnings: string[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { rows: [], warnings: ['CSV must have a header row and at least one data row.'] };

  const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const nameIdx = header.indexOf('name');
  const descIdx = header.indexOf('description');

  const warnings: string[] = [];
  if (nameIdx === -1) warnings.push('Missing required column: name');
  if (warnings.length > 0) return { rows: [], warnings };

  const rows: ParsedAssembly[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const name = cols[nameIdx]?.trim();

    if (!name) {
      warnings.push(`Row ${i + 1}: missing name, skipped.`);
      continue;
    }

    rows.push({
      name,
      description: descIdx >= 0 ? (cols[descIdx]?.trim() || '') : '',
    });
  }

  return { rows, warnings };
}

interface Props {
  onComplete: () => void;
  assemblyType?: string;
}

export function AssemblyCsvImport({ onComplete, assemblyType = 'General' }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { createAssembly } = useAssemblies();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [rows, setRows] = useState<ParsedAssembly[]>([]);
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

    let created = 0;
    for (const row of rows) {
      const assembly = await createAssembly(row.name, row.description || undefined, assemblyType);
      if (assembly) created++;
    }

    setImporting(false);
    setPreviewOpen(false);
    toast({ title: `${created} assembl${created !== 1 ? 'ies' : 'y'} created` });
    onComplete();
  };

  return (
    <>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => fileRef.current?.click()}>
        <Upload className="h-3.5 w-3.5" /> Import CSV
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
            {rows.length} assembl{rows.length !== 1 ? 'ies' : 'y'} will be created under <span className="font-medium text-foreground">{assemblyType}</span>.
          </p>

          <ScrollArea className="max-h-[400px]">
            <div className="space-y-1">
              {rows.map((r, i) => (
                <div key={i} className="border border-border rounded-lg px-3 py-2">
                  <span className="font-medium text-sm">{r.name}</span>
                  {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={importing}>
              {importing ? 'Importing...' : `Create ${rows.length} Assembl${rows.length !== 1 ? 'ies' : 'y'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
