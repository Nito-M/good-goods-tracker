import { ArrowDownUp, CreditCard, PiggyBank, Receipt, TrendingUp } from 'lucide-react';
import { registerWidgets } from '../registry';
import { WidgetProps, dateRangeField, limitField, refreshField } from '../types';
import { useBank } from '@/hooks/useBank';
import { useSales } from '@/hooks/useSales';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import {
  MetricRow,
  StatPill,
  WidgetEmpty,
  WidgetFooterLink,
  WidgetList,
  inRange,
  limitOf,
  money,
  poTotal,
  rangeStart,
} from '../shared';

function txDate(t: { createdAt?: string; created_at?: string }) {
  return t.createdAt || t.created_at || '';
}

function CashFlowW({ settings }: WidgetProps) {
  const { transactions, balance, loading } = useBank();
  const start = rangeStart(settings, '30');
  const period = transactions.filter((t) => inRange(txDate(t as never), start));
  const deposits = period.filter((t) => t.type !== 'withdrawal');
  const withdrawals = period.filter((t) => t.type === 'withdrawal');
  const sum = (arr: typeof period) => arr.reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="space-y-3">
      {loading ? (
        <WidgetEmpty>Loading transactions…</WidgetEmpty>
      ) : (
        <>
          <MetricRow
            metrics={[
              { label: 'Balance', value: money(balance) },
              { label: 'Money in', value: money(sum(deposits)) },
              { label: 'Money out', value: money(sum(withdrawals)) },
            ]}
          />
          <WidgetList
            items={period.slice(0, limitOf(settings, 6)).map((t) => ({
              id: t.id,
              primary: t.description || (t.type === 'withdrawal' ? 'Withdrawal' : 'Deposit'),
              secondary: txDate(t as never).slice(0, 10),
              trailing: `${t.type === 'withdrawal' ? '-' : '+'}${money(t.amount || 0)}`,
              tone: t.type === 'withdrawal' ? 'danger' : 'success',
            }))}
          />
        </>
      )}
      <WidgetFooterLink to="/bank">Open bank →</WidgetFooterLink>
    </div>
  );
}

function ExpensesW({ settings }: WidgetProps) {
  const { orders, loading } = usePurchaseOrders();
  const start = rangeStart(settings, '30');
  const period = orders.filter((o) => o.status !== 'draft' && inRange(o.orderedAt, start));
  const total = period.reduce((s, o) => s + poTotal(o), 0);

  return (
    <div className="space-y-3">
      <StatPill label="Purchasing spend" value={money(total)} tone="danger" icon={Receipt} />
      {loading ? (
        <WidgetEmpty>Loading purchase orders…</WidgetEmpty>
      ) : (
        <WidgetList
          items={period.slice(0, limitOf(settings, 6)).map((o) => ({
            id: o.id,
            primary: `${o.poNumber || 'PO'} · ${o.vendorName || 'Vendor'}`,
            secondary: o.status,
            trailing: money(poTotal(o)),
            tone: 'warning',
          }))}
        />
      )}
      <WidgetFooterLink to="/purchase-orders">Open purchase orders →</WidgetFooterLink>
    </div>
  );
}

function RevenueW({ settings }: WidgetProps) {
  const { sales, loading } = useSales();
  const start = rangeStart(settings, '30');
  const period = sales.filter((s) => inRange(s.createdAt, start));
  const paid = period.filter((s) => s.status === 'paid');

  return (
    <div className="space-y-3">
      {loading ? (
        <WidgetEmpty>Loading sales…</WidgetEmpty>
      ) : (
        <MetricRow
          metrics={[
            { label: 'Invoiced', value: money(period.reduce((t, s) => t + (s.total || 0), 0)) },
            { label: 'Collected', value: money(paid.reduce((t, s) => t + (s.total || 0), 0)) },
            { label: 'Invoices', value: period.length },
          ]}
        />
      )}
      <WidgetFooterLink to="/sales">Open sales →</WidgetFooterLink>
    </div>
  );
}

function BillsDueW({ settings }: WidgetProps) {
  const { orders, loading } = usePurchaseOrders();
  const unpaid = orders.filter((o) => !o.paidAt && o.status !== 'draft');

  return (
    <div className="space-y-3">
      <StatPill
        label="Unpaid purchase orders"
        value={money(unpaid.reduce((s, o) => s + poTotal(o), 0))}
        tone="warning"
        icon={CreditCard}
      />
      {loading ? (
        <WidgetEmpty>Loading bills…</WidgetEmpty>
      ) : unpaid.length === 0 ? (
        <WidgetEmpty>No bills outstanding.</WidgetEmpty>
      ) : (
        <WidgetList
          items={unpaid.slice(0, limitOf(settings, 6)).map((o) => ({
            id: o.id,
            primary: `${o.poNumber || 'PO'} · ${o.vendorName || 'Vendor'}`,
            secondary: o.vendorInvoiceNumber ? `Invoice ${o.vendorInvoiceNumber}` : o.status,
            trailing: money(poTotal(o)),
            tone: 'warning',
          }))}
        />
      )}
      <WidgetFooterLink to="/purchase-orders">Review bills →</WidgetFooterLink>
    </div>
  );
}

function ProfitW({ settings }: WidgetProps) {
  const { sales, loading } = useSales();
  const start = rangeStart(settings, '30');
  const period = sales.filter((s) => inRange(s.createdAt, start));
  const revenue = period.reduce((t, s) => t + (s.total || 0), 0);
  const cost = period.reduce((t, s) => t + (s.totalCost || 0), 0);
  const profit = period.reduce((t, s) => t + (s.totalProfit || 0), 0);
  const margin = revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0;

  return (
    <div className="space-y-3">
      {loading ? (
        <WidgetEmpty>Loading profit…</WidgetEmpty>
      ) : (
        <MetricRow
          metrics={[
            { label: 'Revenue', value: money(revenue) },
            { label: 'Cost of goods', value: money(cost) },
            { label: 'Profit', value: money(profit) },
            { label: 'Margin', value: `${margin}%` },
          ]}
        />
      )}
    </div>
  );
}

registerWidgets([
  {
    type: 'cashFlow',
    label: 'Cash Flow',
    description: 'Balance with money in and out over a period',
    icon: ArrowDownUp,
    category: 'finance',
    defaultSize: 'md',
    component: CashFlowW,
    settings: [refreshField(), dateRangeField('30'), limitField(6)],
  },
  {
    type: 'expenses',
    label: 'Expenses',
    description: 'Purchasing spend by purchase order',
    icon: Receipt,
    category: 'finance',
    defaultSize: 'md',
    component: ExpensesW,
    settings: [refreshField(), dateRangeField('30'), limitField(6)],
  },
  {
    type: 'revenue',
    label: 'Revenue',
    description: 'Invoiced versus collected revenue',
    icon: TrendingUp,
    category: 'finance',
    defaultSize: 'md',
    component: RevenueW,
    settings: [refreshField(), dateRangeField('30')],
  },
  {
    type: 'billsDue',
    label: 'Bills Due',
    description: 'Unpaid supplier bills',
    icon: CreditCard,
    category: 'finance',
    defaultSize: 'md',
    component: BillsDueW,
    settings: [refreshField(), limitField(6)],
  },
  {
    type: 'profit',
    label: 'Profit',
    description: 'Revenue, cost of goods, profit and margin',
    icon: PiggyBank,
    category: 'finance',
    defaultSize: 'md',
    component: ProfitW,
    settings: [refreshField(), dateRangeField('30')],
  },
]);
