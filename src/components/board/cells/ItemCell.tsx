import { useState } from 'react';
import { Package, Wrench, Link2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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

export function ItemCell({ value, onSave, readOnly, align = 'right', livePrice }: ItemCellProps) {
  const [open, setOpen] = useState(false);
  const linked = parseItemCellValue(value);

  const alignClass =
    align === 'center' ? 'justify-center' : align === 'left' ? 'justify-start' : 'justify-end';

  const handlePick = (item: BoardLinkedItem) => {
    onSave(serializeItemCellValue(item.id ? item : null));
  };

  const button = (
    <button
      type="button"
      onClick={() => !readOnly && setOpen(true)}
      disabled={readOnly}
      className={cn(
        'w-full px-3 py-2 text-sm flex items-center gap-2 truncate tabular-nums',
        alignClass,
        !readOnly && 'cursor-pointer hover:bg-accent/40',
        readOnly && 'cursor-default'
      )}
    >
      {linked ? (
        typeof livePrice === 'number' ? (
          <span className="font-medium">{formatCurrency(livePrice)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      ) : (
        <>
          <Link2 className="h-3.5 w-3.5 opacity-50" />
          <span className="opacity-50">Link item…</span>
        </>
      )}
    </button>
  );

  return (
    <>
      {linked ? (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="flex items-center gap-2">
              {linked.k === 'i' ? (
                <Package className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Wrench className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="font-medium">{linked.n || '(unnamed)'}</span>
            </div>
            {linked.s && (
              <div className="text-xs opacity-80 mt-0.5">Part #: {linked.s}</div>
            )}
            <div className="text-[10px] uppercase tracking-wide opacity-60 mt-1">
              {linked.k === 'i' ? 'Inventory item' : 'Part'}
            </div>
          </TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
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
