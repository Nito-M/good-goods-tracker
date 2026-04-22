import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface RowNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialContent: string;
  rowLabel: string;
  onSave: (content: string) => void;
}

export function RowNoteDialog({ open, onOpenChange, initialContent, rowLabel, onSave }: RowNoteDialogProps) {
  const [value, setValue] = useState(initialContent);

  useEffect(() => {
    if (open) setValue(initialContent);
  }, [open, initialContent]);

  const handleSave = () => {
    onSave(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Note — {rowLabel || 'Row'}</DialogTitle>
        </DialogHeader>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Write a note for this row…"
          className="min-h-[200px]"
          autoFocus
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
