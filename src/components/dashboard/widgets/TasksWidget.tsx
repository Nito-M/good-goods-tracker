import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { useTodos } from '@/hooks/useTodos';
import { StatPill, WidgetEmpty, WidgetList } from './primitives';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function TasksWidget() {
  const { todos, loading } = useTodos();
  const today = todayStr();

  const open = todos.filter((t) => !t.isDone);
  const overdue = open.filter((t) => t.dueDate && t.dueDate < today);
  const dueToday = open.filter((t) => t.dueDate === today);
  const completed = todos.filter((t) => t.isDone);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <StatPill label="Overdue" value={overdue.length} tone="danger" icon={AlertTriangle} />
        <StatPill label="Due today" value={dueToday.length} tone="warning" icon={CalendarCheck} />
        <StatPill label="Completed" value={completed.length} tone="success" icon={CheckCircle2} />
      </div>
      {loading ? (
        <WidgetEmpty>Loading tasks…</WidgetEmpty>
      ) : overdue.length + dueToday.length === 0 ? (
        <WidgetEmpty>Nothing due — you're all caught up.</WidgetEmpty>
      ) : (
        <WidgetList
          items={[...overdue, ...dueToday].slice(0, 6).map((t) => ({
            id: t.id,
            primary: t.title,
            secondary: t.dueDate
              ? t.dueDate < today
                ? `Overdue · ${t.dueDate}`
                : 'Due today'
              : undefined,
            tone: t.dueDate && t.dueDate < today ? 'danger' : 'warning',
          }))}
        />
      )}
      <Link to="/notes" className="block text-xs font-medium text-primary hover:underline">
        Open to-do list →
      </Link>
    </div>
  );
}
