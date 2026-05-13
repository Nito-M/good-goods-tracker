import { useState } from 'react';
import { Package, Wrench, Link2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import {
  BoardItemPickerDialog,
  parseItemCellValue,
  serializeItemCellValue,
  type BoardLinkedItem,
} from '@/components/board/BoardItemPickerDialog';

interface ItemCellProps {
  value: string;
  onSave: (value: string) => void;
  readOnly?: boolean;
  align?: 'left' | 'center' | 'right';
  livePrice?: number | null;
}

export function ItemCell({ value, onSave, readOnly, align = 'left', livePrice }: ItemCellProps) {
  const [open, setOpen] = useState(false);
  const linked = parseItemCellValue(value);

  const alignClass =
    align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';

  const handlePick = (item: BoardLinkedItem) => {
    onSave(serializeItemCellValue(item.id ? item : null));
  };

  return (
    <>
      <button
        type="button"
        onClick={() => !readOnly && setOpen(true)}
        disabled={readOnly}
        className={cn(
          'w-full px-3 py-2 text-sm flex items-center gap-2 truncate',
          alignClass,
          !readOnly && 'cursor-pointer hover:bg-accent/40',
          readOnly && 'cursor-default'
        )}
        title={linked ? `${linked.n}${linked.s ? ' · ' + linked.s : ''}` : 'Click to link an item'}
      >
        {linked ? (
          <>
            {linked.k === 'i' ? (
              <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            ) : (
              <Wrench className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate font-medium">{linked.n || '(unnamed)'}</span>
            {linked.s && (
              <span className="text-xs text-muted-foreground truncate">· {linked.s}</span>
            )}
            {typeof livePrice === 'number' && (
              <span className="ml-auto text-xs text-muted-foreground tabular-nums shrink-0">
                {formatCurrency(livePrice)}
              </span>
            )}
          </>
        ) : (
          <>
            <Link2 className="h-3.5 w-3.5 opacity-50" />
            <span className="opacity-50">Link item…</span>
          </>
        )}
      </button>
      {open && (
        <BoardItemPickerDialog
          open={open}
          onOpenChange={setOpen}
          onPick={handlePick}
          currentValue={linked}
        />
      )}
    </>
  );
}
