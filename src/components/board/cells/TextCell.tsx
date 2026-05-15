import { useState, useEffect, useRef } from 'react';
import { AlignLeft, AlignCenter, AlignRight, RotateCcw, Sigma } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isFormula, evaluateFormula, formatFormulaResult, FormulaContext } from '@/lib/boardFormula';
import { setActiveFormulaEditor } from '@/lib/boardFormulaPicker';

interface TextCellProps {
  value: string;
  onSave: (value: string) => void;
  readOnly?: boolean;
  /** Resolved alignment to render text with (per-cell override > column default). */
  align?: 'left' | 'center' | 'right';
  /** Per-cell override (null = inherit from column). */
  cellAlign?: 'left' | 'center' | 'right' | null;
  onChangeCellAlign?: (a: 'left' | 'center' | 'right' | null) => void;
  /** Optional spreadsheet formula context. When provided, values starting with "=" are evaluated. */
  formulaContext?: FormulaContext;
}

export function TextCell({
  value,
  onSave,
  readOnly,
  align = 'left',
  cellAlign,
  onChangeCellAlign,
  formulaContext,
}: TextCellProps) {
  const [v, setV] = useState(value);
  const [editing, setEditing] = useState(false);
  const initial = useRef(value);
  const inputRef = useRef<HTMLInputElement>(null);
  // While the toolbar is being clicked, ignore the input blur so the click
  // can register without the toolbar disappearing first.
  const suppressBlurRef = useRef(false);

  useEffect(() => {
    setV(value);
    initial.current = value;
  }, [value]);

  // Auto-focus the input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      try {
        inputRef.current.select();
      } catch {}
    }
  }, [editing]);

  const commit = () => {
    if (v !== initial.current) {
      onSave(v);
      initial.current = v;
    }
  };

  const alignClass =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  const formulaActive = !!formulaContext && isFormula(value);
  const computed = formulaActive ? evaluateFormula(value, formulaContext!) : null;
  const computedDisplay = computed !== null ? formatFormulaResult(computed) : '';
  const isError = typeof computed === 'string' && computed.startsWith('#');

  // Read-only or non-editing display: render a static div so a single click
  // bubbles up to the cell's selection handler instead of starting text edit.
  if (readOnly || !editing) {
    const display = formulaActive ? computedDisplay : value;
    return (
      <div
        onDoubleClick={() => {
          if (readOnly) return;
          if (formulaActive) setV(value);
          setEditing(true);
        }}
        className={cn(
          'w-full px-3 py-2 text-sm truncate select-none',
          formulaActive ? 'text-foreground font-medium' : 'text-foreground',
          isError && 'text-destructive',
          !readOnly && 'cursor-cell',
          alignClass
        )}
        title={
          readOnly
            ? formulaActive
              ? `${value} → ${computedDisplay}`
              : value
            : formulaActive
              ? `${value} → ${computedDisplay} — double-click to edit`
              : value
                ? `${value} — double-click to edit`
                : 'Double-click to edit'
        }
      >
        {display || <span className="opacity-30">—</span>}
        {formulaActive && (
          <Sigma
            className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 h-3 w-3 text-primary opacity-70"
            aria-label="Formula"
          />
        )}
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
        ref={inputRef}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={(e) => {
          if (suppressBlurRef.current) {
            // Re-focus so the toolbar interaction doesn't kill edit state.
            e.target.focus();
            suppressBlurRef.current = false;
            return;
          }
          commit();
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          else if (e.key === 'Escape') {
            setV(initial.current);
            (e.target as HTMLInputElement).blur();
          }
        }}
        className={cn(
          'w-full bg-transparent border-0 outline-none px-3 py-2 text-sm bg-accent/40 ring-2 ring-ring rounded-none',
          alignClass,
          isError && 'text-destructive'
        )}
      />
      {onChangeCellAlign && (
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
