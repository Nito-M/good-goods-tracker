import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrencyPdf } from '@/lib/utils';
import { WidgetSettings, numSetting, strSetting } from './types';

export { StatPill, WidgetList, WidgetEmpty } from '@/components/dashboard/widgets/primitives';
export type { WidgetListItem, Tone } from '@/components/dashboard/widgets/primitives';

export function money(v: number) {
  return formatCurrencyPdf(v || 0);
}

export interface PoLike {
  items?: { quantity: number; unitCost?: number }[];
  discountAmount?: number;
  pstPercent?: number;
  gstEnabled?: boolean;
}

/** Total for a purchase order, including discount, PST and GST. */
export function poTotal(o: PoLike): number {
  const subtotal = (o.items || []).reduce(
    (s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0),
    0
  );
  const afterDiscount = subtotal - (Number(o.discountAmount) || 0);
  const pst = afterDiscount * ((Number(o.pstPercent) || 0) / 100);
  const gst = o.gstEnabled === false ? 0 : afterDiscount * 0.05;
  return afterDiscount + pst + gst;
}

export function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

/** Returns the inclusive start date (yyyy-mm-dd) for a widget's dateRange setting. */
export function rangeStart(settings: WidgetSettings, fallback = '30'): string | null {
  const raw = strSetting(settings, 'dateRange', fallback);
  if (raw === 'all') return null;
  const days = Number(raw);
  const d = new Date();
  d.setDate(d.getDate() - (Number.isFinite(days) ? days : 30));
  return ymd(d);
}

export function inRange(dateish: unknown, start: string | null): boolean {
  if (!start) return true;
  if (!dateish) return false;
  const s =
    dateish instanceof Date
      ? ymd(dateish)
      : String(dateish).slice(0, 10);
  return s >= start;
}

export function limitOf(settings: WidgetSettings, fallback = 6) {
  return Math.max(1, numSetting(settings, 'limit', fallback));
}

export function WidgetFooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="block text-xs font-medium text-primary hover:underline">
      {children}
    </Link>
  );
}

export function MetricRow({
  metrics,
}: {
  metrics: { label: string; value: string | number }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {metrics.map((m) => (
        <div key={m.label} className="rounded-lg bg-muted px-3 py-2">
          <p className="text-lg font-semibold leading-none text-foreground">{m.value}</p>
          <p className="mt-1 truncate text-[11px] font-medium text-muted-foreground">{m.label}</p>
        </div>
      ))}
    </div>
  );
}
