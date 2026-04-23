import { useState, useEffect, useRef } from 'react';
import { AlignLeft, AlignCenter, AlignRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextCellProps {
  value: string;
  onSave: (value: string) => void;
  readOnly?: boolean;
  /** Resolved alignment to render text with (per-cell override > column default). */
  align?: 'left' | 'center' | 'right';
  /** Per-cell override (null = inherit from column). */
  cellAlign?: 'left' | 'center' | 'right' | null;
  onChangeCellAlign?: (a: 'left' | 'center' | 'right' | null) => void;
}

export function TextCell({
  value,
  onSave,
  readOnly,
  align = 'left',
  cellAlign,
  onChangeCellAlign,
}: TextCellProps) {
  const [v, setV] = useState(value);
  const [focused, setFocused] = useState(false);
  const initial = useRef(value);
  // While the toolbar is being clicked, ignore the input blur so the click
  // can register without the toolbar disappearing first.
  const suppressBlurRef = useRef(false);

  useEffect(() => {
    setV(value);
    initial.current = value;
  }, [value]);

  const commit = () => {
    if (v !== initial.current) {
      onSave(v);
      initial.current = v;
    }
  };

  const alignClass =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  if (readOnly) {
    return (
      <div className={cn('w-full px-3 py-2 text-sm truncate text-muted-foreground', alignClass)} title={value}>
        {value || <span className="opacity-50">—</span>}
      </div>
    );
  }

  const choices: { key: 'left' | 'center' | 'right'; Icon: typeof AlignLeft; label: string }[] = [
    { key: 'left', Icon: AlignLeft, label: 'Align left' },
    { key: 'center', Icon: AlignCenter, label: 'Align center' },
    { key: 'right', Icon: AlignRight, label: 'Align right' },
  ];

  return (
    <div className="relative w-full">
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (suppressBlurRef.current) {
            // Re-focus so the toolbar interaction doesn't kill edit state.
            e.target.focus();
            suppressBlurRef.current = false;
            return;
          }
          setFocused(false);
          commit();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          else if (e.key === 'Escape') {
            setV(initial.current);
            (e.target as HTMLInputElement).blur();
          }
        }}
        className={cn(
          'w-full bg-transparent border-0 outline-none px-3 py-2 text-sm focus:bg-accent/40 focus:ring-2 focus:ring-ring rounded-none',
          alignClass
        )}
      />
      {focused && onChangeCellAlign && (
        <div
          // Prevent the input from losing focus while the user clicks a toolbar button.
          onMouseDown={() => {
            suppressBlurRef.current = true;
          }}
          className="absolute -top-7 right-1 z-30 flex items-center gap-0.5 rounded border border-border bg-popover shadow-md px-0.5 py-0.5"
        >
          {choices.map(({ key, Icon, label }) => (
            <button
              key={key}
              type="button"
              title={label}
              onClick={() => onChangeCellAlign(key)}
              className={cn(
                'h-6 w-6 inline-flex items-center justify-center rounded hover:bg-accent transition-colors',
                cellAlign === key && 'bg-accent text-accent-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
          {cellAlign !== null && cellAlign !== undefined && (
            <button
              type="button"
              title="Use column default"
              onClick={() => onChangeCellAlign(null)}
              className="h-6 w-6 inline-flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
