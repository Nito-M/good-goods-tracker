import { useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StatusOption, getStatusColorClasses, STATUS_COLORS } from '../StatusOptionsDialog';
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

  const [draftLabel, setDraftLabel] = useState('');

  const commitSelection = (id: string) => {
    if (perRowOptions) {
      onSave(serialize({ selectedId: id, rowOptions: state.rowOptions }));
    } else {
      onSave(id);
    }
  };

  const addOption = () => {
    if (!perRowOptions) return;
    const label = draftLabel.trim();
    if (!label) return;
    const used = new Set(state.rowOptions.map((o) => o.color));
    const nextColor = STATUS_COLORS.find((c) => !used.has(c.key))?.key || 'gray';
    const newOpt: StatusOption = { id: crypto.randomUUID(), label, color: nextColor };
    onSave(serialize({ selectedId: state.selectedId, rowOptions: [...state.rowOptions, newOpt] }));
    setDraftLabel('');
  };

  const updateOption = (id: string, patch: Partial<StatusOption>) => {
    onSave(
      serialize({
        selectedId: state.selectedId,
        rowOptions: state.rowOptions.map((o) => (o.id === id ? { ...o, ...patch } : o)),
      })
    );
  };

  const deleteOption = (id: string) => {
    onSave(
      serialize({
        selectedId: state.selectedId === id ? '' : state.selectedId,
        rowOptions: state.rowOptions.filter((o) => o.id !== id),
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
          {activeOptions.length === 0 && !perRowOptions && (
            <p className="text-xs text-muted-foreground p-2">
              No options. Use column menu → Manage options.
            </p>
          )}
          {activeOptions.length === 0 && perRowOptions && (
            <p className="text-xs text-muted-foreground p-2">
              No options yet — add one for this row below.
            </p>
          )}

          {activeOptions.map((opt) => {
            const c = getStatusColorClasses(opt.color);
            return (
              <div key={opt.id} className="flex items-center gap-1 mb-0.5">
                <button
                  onClick={() => commitSelection(opt.id)}
                  className={cn(
                    'flex-1 text-left px-2 py-1 rounded-md text-sm truncate',
                    c.bg,
                    c.text,
                    selectedId === opt.id && 'ring-2 ring-ring'
                  )}
                >
                  {opt.label}
                </button>
                {perRowOptions && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => deleteOption(opt.id)}
                    title="Delete option"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
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

          {perRowOptions && (
            <>
              <div className="border-t border-border my-1" />
              <div className="p-1 space-y-1">
                {state.rowOptions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {STATUS_COLORS.map((c) => (
                      <span key={c.key} className={cn('h-3 w-3 rounded-full', c.bg)} title={c.key} />
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground px-1">Add an option for this row</p>
                <div className="flex gap-1">
                  <Input
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                    placeholder="Status name"
                    className="h-7 text-xs"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 shrink-0"
                    onClick={addOption}
                    disabled={!draftLabel.trim()}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                {state.rowOptions.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {state.rowOptions.map((opt) => (
                      <div key={`edit-${opt.id}`} className="flex items-center gap-1">
                        <div className="flex flex-wrap gap-0.5 shrink-0">
                          {STATUS_COLORS.map((c) => (
                            <button
                              key={c.key}
                              type="button"
                              onClick={() => updateOption(opt.id, { color: c.key })}
                              className={cn(
                                'h-3 w-3 rounded-full border',
                                c.bg,
                                opt.color === c.key ? 'border-foreground' : 'border-transparent'
                              )}
                              title={c.key}
                            />
                          ))}
                        </div>
                        <Input
                          value={opt.label}
                          onChange={(e) => updateOption(opt.id, { label: e.target.value })}
                          className="h-6 text-xs flex-1"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
