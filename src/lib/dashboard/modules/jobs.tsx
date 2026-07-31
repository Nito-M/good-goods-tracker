import { CheckCircle2, ClipboardList, FileText, Hammer, PackageX, Truck } from 'lucide-react';
import { registerWidgets } from '../registry';
import {
  WidgetProps,
  limitField,
  refreshField,
  showLinkField,
  showStatsField,
  boolSetting,
  strSetting,
} from '../types';
import { ActiveJobsWidget } from '@/components/dashboard/widgets/ActiveJobsWidget';
import { useJobs } from '@/hooks/useJobs';
import { useQuotes } from '@/hooks/useQuotes';
import {
  WidgetEmpty,
  WidgetFooterLink,
  WidgetList,
  limitOf,
  money,
} from '../shared';

const COMPLETED = ['completed', 'delivered', 'picked-up', 'picked_up', 'sold'];

function ActiveJobsW({ settings }: WidgetProps) {
  return (
    <ActiveJobsWidget
      limit={limitOf(settings, 8)}
      showStats={boolSetting(settings, 'showStats')}
      showLink={boolSetting(settings, 'showLink')}
    />
  );
}

function jobList(jobs: ReturnType<typeof useJobs>['jobs'], limit: number) {
  return jobs.slice(0, limit).map((j) => ({
    id: j.id,
    primary: `${j.jobNumber ? `#${j.jobNumber} · ` : ''}${j.title}`,
    secondary: j.customerName || undefined,
    trailing: j.dueDate || undefined,
    tone: 'info' as const,
  }));
}

function CompletedJobsW({ settings }: WidgetProps) {
  const { jobs, loading } = useJobs();
  const done = jobs.filter((j) => COMPLETED.includes(j.status));
  return (
    <div className="space-y-3">
      {loading ? (
        <WidgetEmpty>Loading jobs…</WidgetEmpty>
      ) : done.length === 0 ? (
        <WidgetEmpty>No completed jobs yet.</WidgetEmpty>
      ) : (
        <WidgetList items={jobList(done, limitOf(settings, 6))} />
      )}
      <WidgetFooterLink to="/jobs">View all jobs →</WidgetFooterLink>
    </div>
  );
}

function WaitingForPartsW({ settings }: WidgetProps) {
  const { jobs, loading } = useJobs();
  const waiting = jobs.filter((j) => j.status === 'on-hold');
  return (
    <div className="space-y-3">
      {loading ? (
        <WidgetEmpty>Loading jobs…</WidgetEmpty>
      ) : waiting.length === 0 ? (
        <WidgetEmpty>No jobs waiting on parts.</WidgetEmpty>
      ) : (
        <WidgetList
          items={jobList(waiting, limitOf(settings, 6)).map((i) => ({ ...i, tone: 'warning' as const }))}
        />
      )}
      <WidgetFooterLink to="/jobs">View all jobs →</WidgetFooterLink>
    </div>
  );
}

function ProductionQueueW({ settings }: WidgetProps) {
  const { jobs, loading } = useJobs();
  const queue = jobs
    .filter((j) => !COMPLETED.includes(j.status))
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  return (
    <div className="space-y-3">
      {loading ? (
        <WidgetEmpty>Loading queue…</WidgetEmpty>
      ) : queue.length === 0 ? (
        <WidgetEmpty>Production queue is clear.</WidgetEmpty>
      ) : (
        <WidgetList
          items={queue.slice(0, limitOf(settings, 8)).map((j, idx) => ({
            id: j.id,
            primary: `${idx + 1}. ${j.jobNumber ? `#${j.jobNumber} · ` : ''}${j.title}`,
            secondary: j.status,
            trailing: j.dueDate || undefined,
            tone: 'info' as const,
          }))}
        />
      )}
      <WidgetFooterLink to="/jobs">Open jobs board →</WidgetFooterLink>
    </div>
  );
}

function DeliveryScheduleW({ settings }: WidgetProps) {
  const { jobs, loading } = useJobs();
  const scheduled = jobs
    .filter((j) => j.dueDate && !COMPLETED.includes(j.status))
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  return (
    <div className="space-y-3">
      {loading ? (
        <WidgetEmpty>Loading schedule…</WidgetEmpty>
      ) : scheduled.length === 0 ? (
        <WidgetEmpty>No scheduled deliveries.</WidgetEmpty>
      ) : (
        <WidgetList
          items={scheduled.slice(0, limitOf(settings, 8)).map((j) => ({
            id: j.id,
            primary: `${j.jobNumber ? `#${j.jobNumber} · ` : ''}${j.title}`,
            secondary: j.customerName || j.status,
            trailing: j.dueDate || undefined,
            tone: 'success' as const,
          }))}
        />
      )}
      <WidgetFooterLink to="/calendar">Open calendar →</WidgetFooterLink>
    </div>
  );
}

export function QuotesList({ settings }: WidgetProps) {
  const { quotes, loading } = useQuotes();
  const status = strSetting(settings, 'status', 'all');
  const list = quotes
    .filter((q) => status === 'all' || q.status === status)
    .slice(0, limitOf(settings, 6));

  return (
    <div className="space-y-3">
      {loading ? (
        <WidgetEmpty>Loading quotes…</WidgetEmpty>
      ) : list.length === 0 ? (
        <WidgetEmpty>No matching quotes.</WidgetEmpty>
      ) : (
        <WidgetList
          items={list.map((q) => ({
            id: q.id,
            primary: `${q.salesOrderNumber || q.quoteNumber} · ${q.vendorName || 'Customer'}`,
            secondary: q.status,
            trailing: money(q.total || 0),
            tone: q.status === 'sales_order' ? 'success' : 'info',
          }))}
        />
      )}
      <WidgetFooterLink to="/quotes">Open quotes →</WidgetFooterLink>
    </div>
  );
}

export const quoteStatusField = {
  key: 'status',
  label: 'Status filter',
  type: 'select' as const,
  default: 'all',
  options: [
    { value: 'all', label: 'All quotes' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'sales_order', label: 'Sales orders' },
  ],
};

registerWidgets([
  {
    type: 'jobs',
    label: 'Active Jobs',
    description: 'In progress, waiting on parts, ready for delivery',
    icon: Hammer,
    category: 'jobs',
    defaultSize: 'lg',
    component: ActiveJobsW,
    settings: [refreshField(), limitField(8), showStatsField(), showLinkField()],
  },
  {
    type: 'completedJobs',
    label: 'Completed Jobs',
    description: 'Recently finished, delivered or sold jobs',
    icon: CheckCircle2,
    category: 'jobs',
    defaultSize: 'md',
    component: CompletedJobsW,
    settings: [refreshField(), limitField(6)],
  },
  {
    type: 'waitingForParts',
    label: 'Waiting for Parts',
    description: 'Jobs blocked on missing material',
    icon: PackageX,
    category: 'jobs',
    defaultSize: 'md',
    component: WaitingForPartsW,
    settings: [refreshField(), limitField(6)],
  },
  {
    type: 'productionQueue',
    label: 'Production Queue',
    description: 'Jobs in their production order',
    icon: ClipboardList,
    category: 'jobs',
    defaultSize: 'md',
    component: ProductionQueueW,
    settings: [refreshField(), limitField(8)],
  },
  {
    type: 'deliverySchedule',
    label: 'Delivery Schedule',
    description: 'Upcoming job due dates by date',
    icon: Truck,
    category: 'jobs',
    defaultSize: 'md',
    component: DeliveryScheduleW,
    settings: [refreshField(), limitField(8)],
  },
  {
    type: 'jobQuotes',
    label: 'Quotes',
    description: 'Quotes feeding the production pipeline',
    icon: FileText,
    category: 'jobs',
    defaultSize: 'md',
    component: QuotesList,
    settings: [refreshField(), quoteStatusField, limitField(6)],
  },
]);
