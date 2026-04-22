import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TextCellProps {
  value: string;
  onSave: (value: string) => void;
}

export function TextCell({ value, onSave }: TextCellProps) {
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
        'w-full bg-transparent border-0 outline-none px-3 py-2 text-sm focus:bg-accent/40 focus:ring-2 focus:ring-ring rounded-none'
      )}
    />
  );
}
