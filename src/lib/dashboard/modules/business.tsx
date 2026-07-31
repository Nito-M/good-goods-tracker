import { Activity, BarChart3, Building2 } from 'lucide-react';
import { registerWidgets } from '../registry';
import { WidgetProps, dateRangeField, limitField, refreshField } from '../types';
import { BusinessProfileWidget } from '@/components/dashboard/widgets/BusinessProfileWidget';
import { useJobs } from '@/hooks/useJobs';
import { useInventory } from '@/hooks/useInventory';
import { useSales } from '@/hooks/useSales';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useOrgUserNames } from '@/hooks/useOrgUserNames';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import {
  MetricRow,
  WidgetEmpty,
  WidgetList,
  inRange,
  limitOf,
  money,
  rangeStart,
} from '../shared';

function BusinessSelectorW() {
  return <BusinessProfileWidget />;
}

function CompanyKpisW({ settings }: WidgetProps) {
  const { jobs } = useJobs();
  const { stats } = useInventory();
  const { sales } = useSales();
  const { orders } = usePurchaseOrders();
  const start = rangeStart(settings, '30');
  const periodSales = sales.filter((s) => inRange(s.createdAt, start));

  return (
    <MetricRow
      metrics={[
        { label: 'Active jobs', value: jobs.filter((j) => j.status !== 'completed').length },
        { label: 'Open POs', value: orders.filter((o) => o.status !== 'received').length },
        { label: 'Inventory value', value: money(stats.totalValue) },
        { label: 'Revenue (period)', value: money(periodSales.reduce((t, s) => t + (s.total || 0), 0)) },
        { label: 'Profit (period)', value: money(periodSales.reduce((t, s) => t + (s.totalProfit || 0), 0)) },
        { label: 'Low stock', value: stats.lowStockCount },
      ]}
    />
  );
}

function EmployeeActivityW({ settings }: WidgetProps) {
  const { userNames } = useOrgUserNames();
  const [rows, setRows] = useState<
    { id: string; status: string; previous: string | null; by: string | null; at: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const limit = limitOf(settings, 8);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('job_status_history')
        .select('id, status, previous_status, changed_by, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (cancelled) return;
      setRows(
        (data || []).map((r) => ({
          id: r.id,
          status: r.status,
          previous: r.previous_status,
          by: r.changed_by,
          at: r.created_at,
        }))
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (loading) return <WidgetEmpty>Loading activity…</WidgetEmpty>;
  if (rows.length === 0) return <WidgetEmpty>No recent activity.</WidgetEmpty>;

  return (
    <WidgetList
      items={rows.map((r) => ({
        id: r.id,
        primary: `${(r.by && userNames[r.by]) || 'Team member'} → ${r.status}`,
        secondary: r.previous ? `from ${r.previous}` : undefined,
        trailing: r.at?.slice(0, 10),
        tone: 'info',
      }))}
    />
  );
}

registerWidgets([
  {
    type: 'business',
    label: 'Business Selector',
    description: 'Switch between the businesses and workspaces you manage',
    icon: Building2,
    category: 'business',
    defaultSize: 'sm',
    component: BusinessSelectorW,
    settings: [refreshField()],
  },
  {
    type: 'companyKpis',
    label: 'Company KPIs',
    description: 'Headline numbers across jobs, stock and revenue',
    icon: BarChart3,
    category: 'business',
    defaultSize: 'lg',
    component: CompanyKpisW,
    settings: [refreshField(), dateRangeField('30')],
  },
  {
    type: 'employeeActivity',
    label: 'Employee Activity',
    description: 'Latest job status changes by team member',
    icon: Activity,
    category: 'business',
    defaultSize: 'md',
    component: EmployeeActivityW,
    settings: [refreshField(), limitField(8)],
  },
]);
