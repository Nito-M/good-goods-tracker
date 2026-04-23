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

interface CopyBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceBoardId: string | null;
  sourceBoardName: string;
  /** Company the source board belongs to (excluded as a target by default? we still allow it) */
  sourceCompanyId?: string | null;
  onCopy: (targetCompanyId: string, newName: string) => Promise<unknown> | void;
}

export function CopyBoardDialog({
  open,
  onOpenChange,
  sourceBoardId,
  sourceBoardName,
  sourceCompanyId,
  onCopy,
}: CopyBoardDialogProps) {
  const { companies, loading } = useCompanies();
  const [targetCompanyId, setTargetCompanyId] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNewName(`${sourceBoardName} (Copy)`);
      // Default to first company that isn't the source's
      const first = companies.find((c) => c.id !== sourceCompanyId) || companies[0];
      setTargetCompanyId(first?.id ?? '');
    }
  }, [open, sourceBoardName, sourceCompanyId, companies]);

  const handleSubmit = async () => {
    if (!sourceBoardId || !targetCompanyId || !newName.trim()) return;
    setSubmitting(true);
    try {
      await onCopy(targetCompanyId, newName.trim());
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Copy board</DialogTitle>
          <DialogDescription>
            Duplicate "{sourceBoardName}" — including columns, rows, cells, merges, and notes — into another company.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="copy-board-name">New board name</Label>
            <Input
              id="copy-board-name"
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
                    {c.id === sourceCompanyId ? ' (current)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loading && companies.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No companies available. Add one in Settings first.
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
            {submitting ? 'Copying…' : 'Copy board'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
