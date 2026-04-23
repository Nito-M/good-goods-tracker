import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TextCellProps {
  value: string;
  onSave: (value: string) => void;
  readOnly?: boolean;
  align?: 'left' | 'center' | 'right';
}

export function TextCell({ value, onSave, readOnly, align = 'left' }: TextCellProps) {
  const [v, setV] = useState(value);
  const initial = useRef(value);

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

  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={commit}
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
  );
}
