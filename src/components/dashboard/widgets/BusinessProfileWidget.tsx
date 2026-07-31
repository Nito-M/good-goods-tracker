import { Link } from 'react-router-dom';
import { Building2, Check } from 'lucide-react';
import { useCompanies } from '@/hooks/useCompanies';
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { WidgetEmpty } from './primitives';

const STORAGE_KEY = 'dashboard.activeBusinessId';

export function BusinessProfileWidget() {
  const { companies, loading } = useCompanies();
  const { organizations } = useUserOrganizations();

  const stored = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  })();

  const active =
    companies.find((c) => c.id === stored) || companies.find((c) => c.isDefault) || companies[0];

  const onChange = (id: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event('dashboard-business-changed'));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Business profile</Label>
        {loading ? (
          <WidgetEmpty>Loading businesses…</WidgetEmpty>
        ) : companies.length === 0 ? (
          <WidgetEmpty>
            No businesses yet.{' '}
            <Link to="/settings?tab=companies" className="text-primary hover:underline">
              Add one
            </Link>
          </WidgetEmpty>
        ) : (
          <Select value={active?.id} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select business" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c.isDefault ? ' (Default)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {active && (
        <div className="rounded-lg bg-muted/60 p-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <p className="truncate text-sm font-semibold text-foreground">{active.name}</p>
          </div>
          {active.email && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{active.email}</p>
          )}
          {active.phone && (
            <p className="truncate text-xs text-muted-foreground">{active.phone}</p>
          )}
        </div>
      )}

      {organizations.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Workspaces
          </p>
          <ul className="space-y-1">
            {organizations.map((o) => (
              <li key={o.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3 w-3 text-emerald-500" />
                <span className="truncate">{o.name}</span>
                <span className="ml-auto shrink-0 capitalize">{o.role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        to="/settings?tab=companies"
        className="block text-xs font-medium text-primary hover:underline"
      >
        Manage businesses →
      </Link>
    </div>
  );
}
