import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AssemblyPdfVisibility,
  DEFAULT_ASSEMBLY_PDF_VISIBILITY,
  ASSEMBLY_PDF_SETTINGS_KEY,
  getAssemblyPdfVisibility,
} from '@/lib/partsAssemblyPdfGenerator';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FIELDS: { key: keyof AssemblyPdfVisibility; label: string; description: string }[] = [
  { key: 'partName', label: 'Part Name Column', description: 'Show the part name column in the parts table' },
  { key: 'description', label: 'Description', description: 'Show assembly description below the title' },
  { key: 'sellingPrice', label: 'Selling Price', description: 'Show the selling price' },
  { key: 'sku', label: 'Part Number Column', description: 'Show the part number column in the parts table' },
  { key: 'quantity', label: 'Quantity Column', description: 'Show the quantity column in the parts table' },
  { key: 'notes', label: 'Notes Column', description: 'Show the notes column in the parts table' },
];

export function AssemblyPdfSettingsDialog({ open, onOpenChange }: Props) {
  const [vis, setVis] = useState<AssemblyPdfVisibility>(DEFAULT_ASSEMBLY_PDF_VISIBILITY);

  useEffect(() => {
    if (open) setVis(getAssemblyPdfVisibility());
  }, [open]);

  const toggle = (key: keyof AssemblyPdfVisibility) => {
    setVis(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const save = () => {
    localStorage.setItem(ASSEMBLY_PDF_SETTINGS_KEY, JSON.stringify(vis));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>PDF Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {FIELDS.map(f => (
            <div key={f.key} className="flex items-center justify-between gap-3">
              <div>
                <Label className="text-sm font-medium">{f.label}</Label>
                <p className="text-xs text-muted-foreground">{f.description}</p>
              </div>
              <Switch checked={vis[f.key]} onCheckedChange={() => toggle(f.key)} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
