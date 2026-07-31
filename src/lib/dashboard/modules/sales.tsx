import { FileText, Receipt, TrendingUp, Users, Wallet } from 'lucide-react';
import { registerWidgets } from '../registry';
import {
  WidgetProps,
  dateRangeField,
  limitField,
  refreshField,
  showLinkField,
  boolSetting,
} from '../types';
import { RecentOrdersWidget } from '@/components/dashboard/widgets/RecentOrdersWidget';
import { QuotesList, quoteStatusField } from './jobs';
import { useCustomers } from '@/hooks/useCustomers';
import { useSales } from '@/hooks/useSales';
import {
  MetricRow,
  StatPill,
  WidgetEmpty,
  WidgetFooterLink,
  WidgetList,
  inRange,
  limitOf,
  money,
  rangeStart,
  ymd,
} from '../shared';

function RecentOrdersW({ settings }: WidgetProps) {
  return (
    <RecentOrdersWidget
      limit={limitOf(settings, 7)}
      showLink={boolSetting(settings, 'showLink')}
    />
  );
}

function CustomersW({ settings }: WidgetProps) {
  const { customers, loading } = useCustomers();
  const list = [...customers].slice(0, limitOf(settings, 6));
  return (
    <div className="space-y-3">
      <StatPill label="Customers" value={customers.length} tone="info" icon={Users} />
      {loading ? (
        <WidgetEmpty>Loading customers…</WidgetEmpty>
      ) : list.length === 0 ? (
        <WidgetEmpty>No customers yet.</WidgetEmpty>
      ) : (
        <WidgetList
          items={list.map((c) => ({
            id: c.id,
            primary: c.name,
            secondary: c.email || c.phone || undefined,
            trailing: c.category || undefined,
            tone: 'info',
          }))}
        />
      )}
      <WidgetFooterLink to="/settings?tab=customers">Manage customers →</WidgetFooterLink>
    </div>
  );
}

function SalesTodayW({ settings }: WidgetProps) {
  const { sales, loading } = useSales();
  const today = ymd(new Date());
  const start = rangeStart(settings, '0');
  const period = sales.filter((s) => inRange(s.createdAt, start));
  const todays = sales.filter((s) => (s.createdAt || '').slice(0, 10) === today);
  const sum = (arr: typeof sales) => arr.reduce((t, s) => t + (s.total || 0), 0);

  return (
    <div className="space-y-3">
      {loading ? (
        <WidgetEmpty>Loading sales…</WidgetEmpty>
      ) : (
        <>
          <MetricRow
            metrics={[
              { label: 'Invoices today', value: todays.length },
              { label: 'Sold today', value: money(sum(todays)) },
              { label: 'Period total', value: money(sum(period)) },
            ]}
          />
          <WidgetList
            items={todays.slice(0, limitOf(settings, 5)).map((s) => ({
              id: s.id,
              primary: `${s.invoiceNumber || 'Invoice'} · ${s.vendorName || 'Customer'}`,
              secondary: s.status,
              trailing: money(s.total || 0),
              tone: 'success',
            }))}
          />
        </>
      )}
      <WidgetFooterLink to="/sales">Open sales →</WidgetFooterLink>
    </div>
  );
}

function OutstandingInvoicesW({ settings }: WidgetProps) {
  const { sales, loading } = useSales();
  const today = ymd(new Date());
  const open = sales.filter((s) => s.status !== 'paid' && s.status !== 'cancelled');
  const overdue = open.filter((s) => s.dueDate && s.dueDate < today);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <StatPill
          label="Outstanding"
          value={money(open.reduce((t, s) => t + (s.total || 0), 0))}
          tone="warning"
          icon={Receipt}
        />
        <StatPill label="Overdue invoices" value={overdue.length} tone="danger" icon={Wallet} />
      </div>
      {loading ? (
        <WidgetEmpty>Loading invoices…</WidgetEmpty>
      ) : open.length === 0 ? (
        <WidgetEmpty>Everything is paid up.</WidgetEmpty>
      ) : (
        <WidgetList
          items={open.slice(0, limitOf(settings, 6)).map((s) => ({
            id: s.id,
            primary: `${s.invoiceNumber || 'Invoice'} · ${s.vendorName || 'Customer'}`,
            secondary: s.dueDate ? `Due ${s.dueDate}` : s.status,
            trailing: money(s.total || 0),
            tone: s.dueDate && s.dueDate < today ? 'danger' : 'warning',
          }))}
        />
      )}
      <WidgetFooterLink to="/sales">Open invoices →</WidgetFooterLink>
    </div>
  );
}

registerWidgets([
  {
    type: 'orders',
    label: 'Recent Orders',
    description: 'Latest invoices and sales activity',
    icon: Receipt,
    category: 'sales',
    defaultSize: 'md',
    component: RecentOrdersW,
    settings: [refreshField(), limitField(7), showLinkField()],
  },
  {
    type: 'customers',
    label: 'Customers',
    description: 'Customer count and directory shortcuts',
    icon: Users,
    category: 'sales',
    defaultSize: 'md',
    component: CustomersW,
    settings: [refreshField(), limitField(6)],
  },
  {
    type: 'quotes',
    label: 'Quotes',
    description: 'Quotes and sales orders by status',
    icon: FileText,
    category: 'sales',
    defaultSize: 'md',
    component: QuotesList,
    settings: [refreshField(), quoteStatusField, limitField(6)],
  },
  {
    type: 'salesToday',
    label: 'Sales Today',
    description: 'Invoices raised today and period totals',
    icon: TrendingUp,
    category: 'sales',
    defaultSize: 'md',
    component: SalesTodayW,
    settings: [refreshField(), dateRangeField('30'), limitField(5)],
  },
  {
    type: 'outstandingInvoices',
    label: 'Outstanding Invoices',
    description: 'Unpaid and overdue invoices',
    icon: Wallet,
    category: 'sales',
    defaultSize: 'md',
    component: OutstandingInvoicesW,
    settings: [refreshField(), limitField(6)],
  },
]);
