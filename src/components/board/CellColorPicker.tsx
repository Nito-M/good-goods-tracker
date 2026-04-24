import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Paintbrush, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CELL_COLOR_NAMES,
  CELL_COLOR_SHADES,
  cellColorToHex,
  cellColorToken,
  readableTextColor,
} from '@/lib/boardCellColors';

interface CellColorPickerProps {
  /** Currently applied color token (e.g. "blue-300"), or null. */
  value: string | null;
  /** Apply a token, or pass null to clear color. */
  onChange: (token: string | null) => void;
  /**
   * If provided, this is shown as the trigger label. By default we show a
   * paintbrush icon button.
   */
  triggerLabel?: string;
  /** Tighter button styling for in-cell toolbars. */
  size?: 'sm' | 'icon';
  disabled?: boolean;
  /** Optional helper hint shown above the grid. */
  hint?: string;
}

export function CellColorPicker({
  value,
  onChange,
  triggerLabel,
  size = 'icon',
  disabled,
  hint,
}: CellColorPickerProps) {
  const currentHex = cellColorToHex(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={size === 'sm' ? 'sm' : 'icon'}
          disabled={disabled}
          className={cn(size === 'icon' && 'h-8 w-8')}
          title="Cell color"
        >
          <Paintbrush className="h-3.5 w-3.5" />
          {currentHex && (
            <span
              className="ml-1 inline-block h-3 w-3 rounded border border-border"
              style={{ backgroundColor: currentHex }}
            />
          )}
          {triggerLabel && <span className="ml-1 text-xs">{triggerLabel}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3 z-50">
        {hint && <div className="text-xs text-muted-foreground mb-2">{hint}</div>}
        <div className="space-y-1.5">
          {CELL_COLOR_NAMES.map((name) => (
            <div key={name} className="flex items-center gap-1">
              <div className="w-12 text-[10px] capitalize text-muted-foreground select-none">
                {name}
              </div>
              {CELL_COLOR_SHADES.map((shade) => {
                const token = cellColorToken(name, shade);
                const hex = cellColorToHex(token)!;
                const selected = value === token;
                const text = readableTextColor(token) ?? '#000';
                return (
                  <button
                    key={shade}
                    type="button"
                    onClick={() => onChange(token)}
                    className={cn(
                      'h-6 w-6 rounded border text-[9px] font-medium leading-none flex items-center justify-center transition-transform hover:scale-110',
                      selected ? 'ring-2 ring-ring border-foreground' : 'border-border'
                    )}
                    style={{ backgroundColor: hex, color: text }}
                    title={`${name} ${shade}`}
                  >
                    {selected ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-border flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            className="h-7 text-xs"
            disabled={!value}
          >
            <X className="h-3 w-3" />
            Clear color
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
