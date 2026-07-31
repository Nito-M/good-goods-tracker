import { ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Tone = 'default' | 'danger' | 'warning' | 'success' | 'info';

const toneText: Record<Tone, string> = {
  default: 'text-foreground',
  danger: 'text-destructive',
  warning: 'text-amber-600 dark:text-amber-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  info: 'text-primary',
};

const toneBg: Record<Tone, string> = {
  default: 'bg-muted',
  danger: 'bg-destructive/10',
  warning: 'bg-amber-500/10',
  success: 'bg-emerald-500/10',
  info: 'bg-primary/10',
};

export function StatPill({
  label,
  value,
  tone = 'default',
  icon: Icon,
}: {
  label: string;
  value: string | number;
  tone?: Tone;
  icon?: LucideIcon;
}) {
  return (
    <div className={cn('rounded-lg px-3 py-2', toneBg[tone])}>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className={cn('h-3.5 w-3.5', toneText[tone])} />}
        <span className={cn('text-xl font-semibold leading-none', toneText[tone])}>{value}</span>
      </div>
      <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export interface WidgetListItem {
  id: string;
  primary: string;
  secondary?: string;
  trailing?: string;
  tone?: Tone;
  to?: string;
}

export function WidgetList({ items }: { items: WidgetListItem[] }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
          <span
            className={cn(
              'h-1.5 w-1.5 shrink-0 rounded-full',
              item.tone === 'danger'
                ? 'bg-destructive'
                : item.tone === 'warning'
                ? 'bg-amber-500'
                : item.tone === 'success'
                ? 'bg-emerald-500'
                : 'bg-primary'
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{item.primary}</p>
            {item.secondary && (
              <p className="truncate text-xs text-muted-foreground">{item.secondary}</p>
            )}
          </div>
          {item.trailing && (
            <span className="shrink-0 text-xs font-medium text-muted-foreground">{item.trailing}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function WidgetEmpty({ children }: { children: ReactNode }) {
  return <p className="py-4 text-center text-xs text-muted-foreground">{children}</p>;
}
