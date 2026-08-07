import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, Printer } from 'lucide-react';
import { CalendarPdfSections, DEFAULT_CALENDAR_PDF_SECTIONS } from '@/lib/calendarPdfGenerator';

const FIELDS: { key: keyof CalendarPdfSections; label: string }[] = [
  { key: 'events', label: 'Events' },
  { key: 'trips', label: 'Trip Plans' },
  { key: 'jobs', label: 'Jobs Due' },
  { key: 'requests', label: 'Requests' },
  { key: 'todos', label: 'To-dos' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthLabel: string;
  onConfirm: (sections: CalendarPdfSections, mode: 'download' | 'print') => void;
}

export function CalendarPrintDialog({ open, onOpenChange, monthLabel, onConfirm }: Props) {
  const [sections, setSections] = useState<CalendarPdfSections>(DEFAULT_CALENDAR_PDF_SECTIONS);
  const toggle = (k: keyof CalendarPdfSections) => setSections((s) => ({ ...s, [k]: !s[k] }));
  const handle = (mode: 'download' | 'print') => {
    onConfirm(sections, mode);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Print {monthLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">Choose what to include:</p>
          {FIELDS.map((f) => (
            <label key={f.key} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={sections[f.key]} onCheckedChange={() => toggle(f.key)} />
              <Label className="cursor-pointer">{f.label}</Label>
            </label>
          ))}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="secondary" onClick={() => handle('print')}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
          <Button onClick={() => handle('download')}>
            <Download className="h-4 w-4 mr-1" /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
