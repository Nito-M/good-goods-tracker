import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Company } from '@/hooks/useCompanies';

interface CompanySelectorProps {
  companies: Company[];
  value: string;
  onChange: (value: string) => void;
}

export function CompanySelector({ companies, value, onChange }: CompanySelectorProps) {
  if (companies.length <= 1) return null;

  return (
    <div className="space-y-2">
      <Label>Company</Label>
      <Select value={value || 'none'} onValueChange={(val) => onChange(val === 'none' ? '' : val)}>
        <SelectTrigger>
          <SelectValue placeholder="Select company" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No company</SelectItem>
          {companies.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}{c.isDefault ? ' (Default)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
