import { useState } from 'react';
import { ChevronDown, Settings2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StatusOption, StatusOptionsDialog, getStatusColorClasses } from '../StatusOptionsDialog';
import { parseStatusValue } from '@/lib/boardStatusValue';

interface StatusCellProps {
  value: string;
  options: StatusOption[];
  onSave: (value: string) => void;
  readOnly?: boolean;
  perRowOptions?: boolean;
}

interface PerRowState {
  selectedId: string;
  rowOptions: StatusOption[];
}

function serialize(state: PerRowState): string {
  return JSON.stringify({ selectedId: state.selectedId, rowOptions: state.rowOptions });
}

export function StatusCell({ value, options, onSave, readOnly, perRowOptions }: StatusCellProps) {
  const state = parseStatusValue(value, !!perRowOptions);
  const activeOptions = perRowOptions ? state.rowOptions : options;
  const selectedId = state.selectedId;
  const selected = activeOptions.find((o) => o.id === selectedId);
  const color = selected ? getStatusColorClasses(selected.color) : null;

  const [manageOpen, setManageOpen] = useState(false);

  const commitSelection = (id: string) => {
    if (perRowOptions) {
      onSave(serialize({ selectedId: id, rowOptions: state.rowOptions }));
    } else {
      onSave(id);
    }
  };

  const handleSaveRowOptions = (newOptions: StatusOption[]) => {
    // Keep selection only if it still exists
    const stillExists = newOptions.some((o) => o.id === state.selectedId);
    onSave(
      serialize({
        selectedId: stillExists ? state.selectedId : '',
        rowOptions: newOptions,
      })
    );
  };

  if (readOnly) {
    return (
      <div className="px-2 py-1">
        <div
          className={cn(
            'w-full px-2 py-1 rounded-md text-sm text-center truncate',
            color ? cn(color.bg, color.text) : 'text-muted-foreground'
          )}
        >
          {selected?.label || '—'}
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 py-1">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'w-full flex items-center justify-between gap-1 px-2 py-1 rounded-md text-sm hover:opacity-80 text-center',
              color ? cn(color.bg, color.text) : 'text-muted-foreground hover:bg-accent/40'
            )}
          >
            <span className="truncate">{selected?.label || '—'}</span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-1" align="start">
          <div className="max-h-[200px] overflow-y-auto">
            {activeOptions.length === 0 && !perRowOptions && (
              <p className="text-xs text-muted-foreground p-2">
                No options. Use column menu → Manage options.
              </p>
            )}
            {activeOptions.length === 0 && perRowOptions && (
              <p className="text-xs text-muted-foreground p-2">
                No options yet — click "Manage options" below to add some for this row.
              </p>
            )}

            {activeOptions.map((opt) => {
              const c = getStatusColorClasses(opt.color);
              return (
                <button
                  key={opt.id}
                  onClick={() => commitSelection(opt.id)}
                  className={cn(
                    'w-full text-left px-2 py-1 rounded-md text-sm truncate mb-0.5',
                    c.bg,
                    c.text,
                    selectedId === opt.id && 'ring-2 ring-ring'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}

            {selectedId && (
              <button
                onClick={() => commitSelection('')}
                className="w-full text-left px-2 py-1 text-sm text-muted-foreground hover:bg-accent rounded-md mt-1"
              >
                Clear selection
              </button>
            )}
          </div>

          {perRowOptions && (
            <>
              <div className="border-t border-border my-1" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8"
                onClick={() => setManageOpen(true)}
              >
                <Settings2 className="h-3.5 w-3.5" />
                Manage options for this row
              </Button>
            </>
          )}
        </PopoverContent>
      </Popover>

      {perRowOptions && (
        <StatusOptionsDialog
          open={manageOpen}
          onOpenChange={setManageOpen}
          initialOptions={state.rowOptions}
          onSave={handleSaveRowOptions}
        />
      )}
    </div>
  );
}
