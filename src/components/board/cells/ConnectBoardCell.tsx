import { useState, useMemo } from 'react';
import { Plus, X, Link2, Search, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useBoardConnectData } from '@/hooks/useBoardConnectData';

interface ConnectBoardCellProps {
  value: string; // JSON array of linked row IDs
  onSave: (value: string) => void;
  connectBoardId: string | null;
  mirrorColumnId: string | null;
  onConfigure: () => void;
}

function parseIds(value: string): string[] {
  if (!value) return [];
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function ConnectBoardCell({
  value,
  onSave,
  connectBoardId,
  mirrorColumnId,
  onConfigure,
}: ConnectBoardCellProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const linkedIds = useMemo(() => parseIds(value), [value]);
  const { rows, loading } = useBoardConnectData(connectBoardId, mirrorColumnId);
  const navigate = useNavigate();

  if (!connectBoardId || !mirrorColumnId) {
    return (
      <button
        onClick={onConfigure}
        className="w-full h-full px-2 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        <Link2 className="h-3 w-3" />
        Configure connection…
      </button>
    );
  }

  const linkedRows = linkedIds
    .map((id) => rows.find((r) => r.row_id === id))
    .filter((r): r is NonNullable<typeof r> => !!r);

  const filteredAvailable = rows.filter((r) => {
    if (linkedIds.includes(r.row_id)) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.primary_value.toLowerCase().includes(q) ||
      r.mirror_value.toLowerCase().includes(q)
    );
  });

  const toggleLink = (rowId: string, add: boolean) => {
    const next = add
      ? [...linkedIds, rowId]
      : linkedIds.filter((id) => id !== rowId);
    onSave(JSON.stringify(next));
  };

  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-1.5">
      {linkedRows.map((r) => {
        const display = r.mirror_value || '(empty)';
        return (
        <Badge
          key={r.row_id}
          variant="secondary"
          className="gap-1 pr-1 max-w-[200px] cursor-pointer hover:bg-accent transition-colors"
          title={r.mirror_value ? `Open: ${r.primary_value} → ${r.mirror_value}` : `Open: ${r.primary_value || '(empty row)'}`}
          onClick={() => navigate(`/boards/${connectBoardId}?row=${r.row_id}`)}
        >
          <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
          <span className="truncate">{display}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLink(r.row_id, false);
            }}
            className="hover:text-destructive"
            title="Remove link"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
        );
      })}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6" title="Link a row">
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rows…"
              className="h-8 pl-7 text-xs"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-0.5">
            {loading && (
              <div className="text-xs text-muted-foreground px-2 py-3">Loading…</div>
            )}
            {!loading && filteredAvailable.length === 0 && (
              <div className="text-xs text-muted-foreground px-2 py-3">
                {rows.length === 0 ? 'No rows in connected board' : 'No matches'}
              </div>
            )}
            {filteredAvailable.map((r) => (
              <button
                key={r.row_id}
                onClick={() => {
                  toggleLink(r.row_id, true);
                  setSearch('');
                }}
                className="w-full text-left px-2 py-1.5 rounded-md hover:bg-accent text-sm flex items-center justify-between gap-2"
              >
                <span className="truncate">
                  {r.primary_value || <span className="text-muted-foreground">(no name)</span>}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[40%]">
                  {r.mirror_value}
                </span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
