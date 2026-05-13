import { useState, useEffect, useRef } from 'react';
import { Sigma } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { isFormula, evaluateFormula, formatFormulaResult, FormulaContext } from '@/lib/boardFormula';

interface PriceCellProps {
  value: string;
  onSave: (value: string) => void;
  readOnly?: boolean;
  align?: 'left' | 'center' | 'right';
  formulaContext?: FormulaContext;
}

export function PriceCell({ value, onSave, readOnly, align = 'right', formulaContext }: PriceCellProps) {
  const [v, setV] = useState(value);
  const [editing, setEditing] = useState(false);
  const initial = useRef(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setV(value);
    initial.current = value;
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      try { inputRef.current.select(); } catch {}
    }
  }, [editing]);

  const commit = () => {
    if (v !== initial.current) {
      onSave(v);
      initial.current = v;
    }
  };

  const alignClass =
    align === 'center' ? 'text-center' : align === 'left' ? 'text-left' : 'text-right';

  const formulaActive = !!formulaContext && isFormula(value);
  const computed = formulaActive ? evaluateFormula(value, formulaContext!) : null;
  const isError = typeof computed === 'string' && computed.startsWith('#');

  let display = '';
  if (formulaActive) {
    if (typeof computed === 'number') display = formatCurrency(computed);
    else display = computed !== null ? formatFormulaResult(computed) : '';
  } else if (value !== '' && value != null) {
    const n = Number(value);
    display = Number.isFinite(n) ? formatCurrency(n) : value;
  }

  if (readOnly || !editing) {
    return (
      <div
        onDoubleClick={() => {
          if (readOnly) return;
          if (formulaActive) setV(value);
          setEditing(true);
        }}
        className={cn(
          'w-full px-3 py-2 text-sm truncate select-none tabular-nums',
          formulaActive ? 'text-foreground font-medium' : 'text-foreground',
          isError && 'text-destructive',
          !readOnly && 'cursor-cell',
          alignClass
        )}
        title={readOnly ? display : value ? `${value} — double-click to edit` : 'Double-click to edit'}
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

  return (
    <input
      ref={inputRef}
      value={v}
      onChange={(e) => setV(e.target.value)}
      type="text"
      inputMode="decimal"
      onBlur={() => { commit(); setEditing(false); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        else if (e.key === 'Escape') {
          setV(initial.current);
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={cn(
        'w-full bg-transparent border-0 outline-none px-3 py-2 text-sm bg-accent/40 ring-2 ring-ring rounded-none tabular-nums',
        alignClass,
        isError && 'text-destructive'
      )}
      placeholder="0.00"
    />
  );
}
