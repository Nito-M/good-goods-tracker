import { Link } from 'react-router-dom';
import { Hammer, PackageX, Truck } from 'lucide-react';
import { useJobs } from '@/hooks/useJobs';
import { StatPill, WidgetEmpty, WidgetList } from './primitives';

const IN_PROGRESS = ['in-progress', 'open'];
const WAITING = ['on-hold'];
const READY = ['finished', 'painting-done'];

export function ActiveJobsWidget() {
  const { jobs, loading } = useJobs();

  const inProgress = jobs.filter((j) => IN_PROGRESS.includes(j.status));
  const waiting = jobs.filter((j) => WAITING.includes(j.status));
  const ready = jobs.filter((j) => READY.includes(j.status));

  const list = [...inProgress, ...waiting, ...ready].slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <StatPill label="In progress" value={inProgress.length} tone="info" icon={Hammer} />
        <StatPill label="Waiting on parts" value={waiting.length} tone="warning" icon={PackageX} />
        <StatPill label="Ready for delivery" value={ready.length} tone="success" icon={Truck} />
      </div>
      {loading ? (
        <WidgetEmpty>Loading jobs…</WidgetEmpty>
      ) : list.length === 0 ? (
        <WidgetEmpty>No active jobs right now.</WidgetEmpty>
      ) : (
        <WidgetList
          items={list.map((j) => ({
            id: j.id,
            primary: `${j.jobNumber ? `#${j.jobNumber} · ` : ''}${j.title}`,
            secondary: j.customerName || undefined,
            trailing: j.dueDate || undefined,
            tone: WAITING.includes(j.status)
              ? 'warning'
              : READY.includes(j.status)
              ? 'success'
              : 'info',
          }))}
        />
      )}
      <Link to="/jobs" className="block text-xs font-medium text-primary hover:underline">
        View all jobs →
      </Link>
    </div>
  );
}
