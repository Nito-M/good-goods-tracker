import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { useTodos } from '@/hooks/useTodos';
import { StatPill, WidgetEmpty, WidgetList } from './primitives';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function TasksWidget({
  limit = 6,
  showStats = true,
  showLink = true,
  group = 'all',
}: {
  limit?: number;
  showStats?: boolean;
  showLink?: boolean;
  group?: 'all' | 'urgent' | 'soon' | 'eventually';
}) {
  const { todos, loading } = useTodos();
  const today = todayStr();

  const scoped = group === 'all' ? todos : todos.filter((t) => t.priorityGroup === group);

  const open = scoped.filter((t) => !t.isDone);
  const overdue = open.filter((t) => t.dueDate && t.dueDate < today);
  const dueToday = open.filter((t) => t.dueDate === today);
  const completed = scoped.filter((t) => t.isDone);

  const rest = open.filter((t) => !t.dueDate || t.dueDate > today);
  const visible = [...overdue, ...dueToday, ...rest];

  return (
    <div className="space-y-4">
      {showStats && (
        <div className="grid grid-cols-3 gap-2">
          <StatPill label="Overdue" value={overdue.length} tone="danger" icon={AlertTriangle} />
          <StatPill label="Due today" value={dueToday.length} tone="warning" icon={CalendarCheck} />
          <StatPill label="Completed" value={completed.length} tone="success" icon={CheckCircle2} />
        </div>
      )}
      {loading ? (
        <WidgetEmpty>Loading tasks…</WidgetEmpty>
      ) : visible.length === 0 ? (
        <WidgetEmpty>
          {group === 'all'
            ? "Nothing due — you're all caught up."
            : `No open ${group} tasks.`}
        </WidgetEmpty>
      ) : (
        <WidgetList
          items={visible.slice(0, limit).map((t) => ({
            id: t.id,
            primary: t.title,
            secondary: t.dueDate
              ? t.dueDate < today
                ? `Overdue · ${t.dueDate}`
                : t.dueDate === today
                  ? 'Due today'
                  : `Due ${t.dueDate}`
              : t.priorityGroup
                ? `Priority: ${t.priorityGroup}`
                : undefined,
            tone: t.dueDate && t.dueDate < today ? 'danger' : 'warning',
          }))}
        />
      )}

      {showLink && (
        <Link to="/notes" className="block text-xs font-medium text-primary hover:underline">
          Open to-do list →
        </Link>
      )}
    </div>
  );
}
