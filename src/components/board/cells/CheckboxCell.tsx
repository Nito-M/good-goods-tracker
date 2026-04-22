import { Checkbox } from '@/components/ui/checkbox';

interface CheckboxCellProps {
  value: string;
  onSave: (value: string) => void;
  readOnly?: boolean;
}

export function CheckboxCell({ value, onSave, readOnly }: CheckboxCellProps) {
  const checked = value === 'true';
  return (
    <div className="flex items-center justify-center px-3 py-2">
      <Checkbox
        checked={checked}
        disabled={readOnly}
        onCheckedChange={(c) => !readOnly && onSave(c ? 'true' : '')}
      />
    </div>
  );
}
