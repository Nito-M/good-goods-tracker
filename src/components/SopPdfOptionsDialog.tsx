import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SopPdfSections, DEFAULT_SOP_PDF_SECTIONS } from '@/lib/sopPdfGenerator';

const FIELDS: { key: keyof SopPdfSections; label: string }[] = [
  { key: 'details', label: 'SOP Details' },
  { key: 'steps', label: 'Procedure Steps' },
  { key: 'bom', label: 'Bill of Materials' },
  { key: 'locations', label: 'Locations' },
  { key: 'attachments', label: 'Attachments' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sections: SopPdfSections) => void;
}

export function SopPdfOptionsDialog({ open, onOpenChange, onConfirm }: Props) {
  const [sections, setSections] = useState<SopPdfSections>(DEFAULT_SOP_PDF_SECTIONS);
  const toggle = (k: keyof SopPdfSections) => setSections(s => ({ ...s, [k]: !s[k] }));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Download SOP PDF</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">Choose which sections to include:</p>
          {FIELDS.map(f => (
            <label key={f.key} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={sections[f.key]} onCheckedChange={() => toggle(f.key)} />
              <Label className="cursor-pointer">{f.label}</Label>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onConfirm(sections); onOpenChange(false); }}>Download</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
