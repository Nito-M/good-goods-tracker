import { Checkbox } from '@/components/ui/checkbox';

interface CheckboxCellProps {
  value: string;
  onSave: (value: string) => void;
}

export function CheckboxCell({ value, onSave }: CheckboxCellProps) {
  const checked = value === 'true';
  return (
    <div className="flex items-center justify-center px-3 py-2">
      <Checkbox checked={checked} onCheckedChange={(c) => onSave(c ? 'true' : '')} />
    </div>
  );
}
