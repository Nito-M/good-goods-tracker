import { useState } from 'react';
import { Package, Wrench, Link2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { isFormulaPickActive } from '@/lib/boardFormulaPicker';
import { Input } from '@/components/ui/input';
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
  const [multOpen, setMultOpen] = useState(false);
  const linked = parseItemCellValue(value);
  const multiplier =
    linked && typeof linked.m === 'number' && Number.isFinite(linked.m) && linked.m !== 0
      ? linked.m
      : 1;
  const [multInput, setMultInput] = useState(String(multiplier));

  const total =
    typeof livePrice === 'number' ? livePrice * multiplier : null;

  const alignClass =
    align === 'center' ? 'justify-center' : align === 'left' ? 'justify-start' : 'justify-end';

  const handlePick = (item: BoardLinkedItem) => {
    if (!item.id) {
      onSave(serializeItemCellValue(null));
      return;
    }
    // Preserve existing multiplier when re-picking same item; otherwise reset to 1
    const m = linked && linked.id === item.id ? multiplier : 1;
    onSave(serializeItemCellValue({ ...item, m: m === 1 ? undefined : m }));
  };

  const commitMultiplier = () => {
    if (!linked) return;
    const n = parseFloat(multInput);
    const next = Number.isFinite(n) && n !== 0 ? n : 1;
    onSave(serializeItemCellValue({ ...linked, m: next === 1 ? undefined : next }));
    setMultOpen(false);
  };

  const button = (
    <button
      type="button"
      onClick={() => {
        if (readOnly) return;
        // While editing a formula in another cell, suppress the picker so this
        // cell can be inserted as a formula reference instead.
        if (isFormulaPickActive()) return;
        setOpen(true);
      }}
      disabled={readOnly}
      className={cn(
        'flex-1 px-2 py-2 text-sm flex items-center gap-1 truncate tabular-nums',
        alignClass,
        !readOnly && 'cursor-pointer hover:bg-accent/40',
        readOnly && 'cursor-default'
      )}
    >
      {linked ? (
        <span className="flex items-center gap-2 min-w-0 justify-end">
          {linked.s && (
            <span className="text-xs text-muted-foreground truncate">{linked.s}</span>
          )}
          {typeof total === 'number' ? (
            <span className="font-medium">{formatCurrency(total)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
      ) : (
        <>
          <Link2 className="h-3.5 w-3.5 opacity-50" />
          <span className="opacity-50">Link item…</span>
        </>
      )}
    </button>
  );

  if (!linked) {
    return (
      <>
        {button}
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

  return (
    <>
      <div className={cn('w-full flex items-center', alignClass)}>
        {!readOnly && (
          <Popover
            open={multOpen}
            onOpenChange={(o) => {
              setMultOpen(o);
              if (o) setMultInput(String(multiplier));
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'px-1.5 py-2 text-xs tabular-nums hover:bg-accent/40 rounded-sm',
                  multiplier !== 1 ? 'text-foreground font-medium' : 'text-muted-foreground/60'
                )}
                title="Set multiplier"
              >
                ×{multiplier}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2" align="start">
              <label className="text-xs text-muted-foreground block mb-1">Multiplier</label>
              <Input
                type="number"
                step="0.01"
                value={multInput}
                onChange={(e) => setMultInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitMultiplier();
                  if (e.key === 'Escape') setMultOpen(false);
                }}
                onBlur={commitMultiplier}
                autoFocus
                className="h-8"
              />
            </PopoverContent>
          </Popover>
        )}
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
            {typeof livePrice === 'number' && (
              <div className="text-xs opacity-90 mt-1 tabular-nums">
                {formatCurrency(livePrice)} × {multiplier} ={' '}
                <span className="font-medium">{formatCurrency(livePrice * multiplier)}</span>
              </div>
            )}
            <div className="text-[10px] uppercase tracking-wide opacity-60 mt-1">
              {linked.k === 'i' ? 'Inventory item' : 'Part'}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
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
