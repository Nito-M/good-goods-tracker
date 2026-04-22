import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { StatusOption, getStatusColorClasses } from '../StatusOptionsDialog';

interface StatusCellProps {
  value: string;
  options: StatusOption[];
  onSave: (value: string) => void;
}

export function StatusCell({ value, options, onSave }: StatusCellProps) {
  const selected = options.find((o) => o.id === value);
  const color = selected ? getStatusColorClasses(selected.color) : null;

  return (
    <div className="px-2 py-1">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'w-full flex items-center justify-between gap-1 px-2 py-1 rounded-md text-sm hover:opacity-80',
              color ? cn(color.bg, color.text) : 'text-muted-foreground hover:bg-accent/40'
            )}
          >
            <span className="truncate">{selected?.label || '—'}</span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" align="start">
          {options.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">No options. Use column menu → Manage options.</p>
          )}
          {options.map((opt) => {
            const c = getStatusColorClasses(opt.color);
            return (
              <button
                key={opt.id}
                onClick={() => onSave(opt.id)}
                className={cn(
                  'w-full text-left px-2 py-1 rounded-md text-sm mb-0.5',
                  c.bg,
                  c.text,
                  value === opt.id && 'ring-2 ring-ring'
                )}
              >
                {opt.label}
              </button>
            );
          })}
          {value && (
            <button
              onClick={() => onSave('')}
              className="w-full text-left px-2 py-1 text-sm text-muted-foreground hover:bg-accent rounded-md mt-1"
            >
              Clear
            </button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
