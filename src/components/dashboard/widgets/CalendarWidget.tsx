import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { CalendarClock, CalendarDays } from 'lucide-react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useJobs } from '@/hooks/useJobs';
import { StatPill, WidgetEmpty, WidgetList } from './primitives';

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CalendarWidget({
  daysAhead = 14,
  limit = 6,
  showStats = true,
}: {
  daysAhead?: number;
  limit?: number;
  showStats?: boolean;
}) {
  const { events, loading } = useCalendarEvents();
  const { jobs } = useJobs();

  const today = ymd(new Date());
  const horizon = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return ymd(d);
  }, [daysAhead]);

  const todays = events.filter((e) => e.eventDate === today);
  const upcomingEvents = events
    .filter((e) => e.eventDate > today && e.eventDate <= horizon)
    .map((e) => ({ id: e.id, primary: e.title, secondary: e.eventDate, tone: 'info' as const }));
  const upcomingJobs = jobs
    .filter((j) => j.dueDate && j.dueDate >= today && j.dueDate <= horizon)
    .map((j) => ({
      id: j.id,
      primary: `${j.jobNumber ? `#${j.jobNumber} · ` : ''}${j.title}`,
      secondary: `Job due ${j.dueDate}`,
      tone: 'warning' as const,
    }));

  const upcoming = [...upcomingEvents, ...upcomingJobs]
    .sort((a, b) => (a.secondary || '').localeCompare(b.secondary || ''))
    .slice(0, limit);

  return (
    <div className="space-y-4">
      {showStats && (
      <div className="grid grid-cols-2 gap-2">
        <StatPill label="Today's schedule" value={todays.length} tone="info" icon={CalendarDays} />
        <StatPill
          label="Upcoming deadlines"
          value={upcomingJobs.length}
          tone="warning"
          icon={CalendarClock}
        />
      </div>
      )}

      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Today
        </p>
        {loading ? (
          <WidgetEmpty>Loading…</WidgetEmpty>
        ) : todays.length === 0 ? (
          <WidgetEmpty>No events scheduled today.</WidgetEmpty>
        ) : (
          <WidgetList
            items={todays.slice(0, 4).map((e) => ({
              id: e.id,
              primary: e.title,
              secondary: e.description || undefined,
              tone: 'info',
            }))}
          />
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Upcoming
        </p>
        {upcoming.length === 0 ? (
          <WidgetEmpty>Nothing upcoming.</WidgetEmpty>
        ) : (
          <WidgetList items={upcoming} />
        )}
      </div>

      <Link to="/calendar" className="block text-xs font-medium text-primary hover:underline">
        Open calendar →
      </Link>
    </div>
  );
}
