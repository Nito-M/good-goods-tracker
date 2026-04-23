import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCompanies } from '@/hooks/useCompanies';
import type { BoardClipboardEntry } from '@/hooks/useBoardClipboard';

interface PasteBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clipboard: BoardClipboardEntry | null;
  onPaste: (targetCompanyId: string, newName: string) => Promise<unknown> | void;
}

export function PasteBoardDialog({
  open,
  onOpenChange,
  clipboard,
  onPaste,
}: PasteBoardDialogProps) {
  const { companies, loading } = useCompanies();
  const [targetCompanyId, setTargetCompanyId] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && clipboard) {
      setNewName(`${clipboard.sourceBoardName} (Copy)`);
      const first =
        companies.find((c) => c.id !== clipboard.sourceCompanyId) || companies[0];
      setTargetCompanyId(first?.id ?? '');
    }
  }, [open, clipboard, companies]);

  const handleSubmit = async () => {
    if (!clipboard || !targetCompanyId || !newName.trim()) return;
    setSubmitting(true);
    try {
      await onPaste(targetCompanyId, newName.trim());
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Paste board</DialogTitle>
          <DialogDescription>
            Duplicate "{clipboard?.sourceBoardName}" — including columns, rows, cells, merges, and notes — into a company in this workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="paste-board-name">New board name</Label>
            <Input
              id="paste-board-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Board name"
            />
          </div>

          <div className="space-y-2">
            <Label>Target company</Label>
            <Select
              value={targetCompanyId}
              onValueChange={setTargetCompanyId}
              disabled={loading || companies.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? 'Loading…' : 'Select company'} />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.id === clipboard?.sourceCompanyId ? ' (original)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loading && companies.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No companies available in this workspace. Add one in Settings first.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !targetCompanyId || !newName.trim()}
          >
            {submitting ? 'Pasting…' : 'Paste board'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
