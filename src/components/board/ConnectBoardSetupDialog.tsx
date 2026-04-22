import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useBoards } from '@/hooks/useBoards';

export interface ConnectBoardConfig {
  connect_board_id: string | null;
  connect_mirror_column_id: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialConfig: ConnectBoardConfig;
  currentBoardId: string;
  onSave: (config: ConnectBoardConfig) => void;
}

interface RemoteColumn {
  id: string;
  name: string;
  type: string;
  position: number;
}

export function ConnectBoardSetupDialog({
  open,
  onOpenChange,
  initialConfig,
  currentBoardId,
  onSave,
}: Props) {
  const { boards } = useBoards();
  const [boardId, setBoardId] = useState<string | null>(initialConfig.connect_board_id);
  const [mirrorColId, setMirrorColId] = useState<string | null>(initialConfig.connect_mirror_column_id);
  const [remoteCols, setRemoteCols] = useState<RemoteColumn[]>([]);
  const [loadingCols, setLoadingCols] = useState(false);

  useEffect(() => {
    if (open) {
      setBoardId(initialConfig.connect_board_id);
      setMirrorColId(initialConfig.connect_mirror_column_id);
    }
  }, [open, initialConfig]);

  useEffect(() => {
    if (!boardId) {
      setRemoteCols([]);
      return;
    }
    setLoadingCols(true);
    supabase
      .from('board_columns')
      .select('id, name, type, position')
      .eq('board_id', boardId)
      .order('position')
      .then(({ data }) => {
        const cols = (data || []) as RemoteColumn[];
        setRemoteCols(cols);
        // If saved mirror column is not in this board, reset
        if (mirrorColId && !cols.find((c) => c.id === mirrorColId)) {
          setMirrorColId(null);
        }
        setLoadingCols(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const otherBoards = boards.filter((b) => b.id !== currentBoardId);

  const handleSave = () => {
    onSave({ connect_board_id: boardId, connect_mirror_column_id: mirrorColId });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect a board</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Board to connect</Label>
            <Select
              value={boardId || ''}
              onValueChange={(v) => {
                setBoardId(v || null);
                setMirrorColId(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a board…" />
              </SelectTrigger>
              <SelectContent>
                {otherBoards.length === 0 && (
                  <div className="px-2 py-3 text-xs text-muted-foreground">No other boards available</div>
                )}
                {otherBoards.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Column to display</Label>
            <Select
              value={mirrorColId || ''}
              onValueChange={(v) => setMirrorColId(v || null)}
              disabled={!boardId || loadingCols}
            >
              <SelectTrigger>
                <SelectValue placeholder={boardId ? 'Choose a column…' : 'Select a board first'} />
              </SelectTrigger>
              <SelectContent>
                {remoteCols.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    <span className="ml-1 text-xs text-muted-foreground">({c.type})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The selected column's value will be shown for each linked row.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!boardId || !mirrorColId}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
