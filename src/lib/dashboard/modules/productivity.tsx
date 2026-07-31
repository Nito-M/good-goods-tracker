import { CheckSquare, CalendarDays, StickyNote, Target, Megaphone } from 'lucide-react';
import { registerWidgets } from '../registry';
import {
  WidgetProps,
  limitField,
  refreshField,
  showStatsField,
  showLinkField,
  numSetting,
  boolSetting,
  strSetting,
} from '../types';
import { TasksWidget } from '@/components/dashboard/widgets/TasksWidget';
import { CalendarWidget } from '@/components/dashboard/widgets/CalendarWidget';
import { NotesWidget } from '@/components/dashboard/widgets/NotesWidget';
import { useTodos } from '@/hooks/useTodos';
import { WidgetEmpty, WidgetFooterLink, WidgetList, limitOf } from '../shared';

function TasksW({ settings }: WidgetProps) {
  return (
    <TasksWidget
      limit={limitOf(settings, 6)}
      showStats={boolSetting(settings, 'showStats')}
      showLink={boolSetting(settings, 'showLink')}
    />
  );
}

function CalendarW({ settings }: WidgetProps) {
  return (
    <CalendarWidget
      daysAhead={numSetting(settings, 'daysAhead', 14)}
      limit={limitOf(settings, 6)}
      showStats={boolSetting(settings, 'showStats')}
    />
  );
}

function NotesW({ settings }: WidgetProps) {
  return (
    <NotesWidget
      limit={limitOf(settings, 5)}
      pinnedOnly={boolSetting(settings, 'pinnedOnly', false)}
      showLink={boolSetting(settings, 'showLink')}
    />
  );
}

function GoalsW({ settings }: WidgetProps) {
  const { todos, loading } = useTodos();
  const group = strSetting(settings, 'group', 'all');
  const filtered = todos
    .filter((t) => !t.isDone)
    .filter((t) => (group === 'all' ? t.priorityGroup || t.priorityNumber : t.priorityGroup === group))
    .sort((a, b) => (a.priorityNumber ?? 999) - (b.priorityNumber ?? 999))
    .slice(0, limitOf(settings, 6));

  return (
    <div className="space-y-3">
      {loading ? (
        <WidgetEmpty>Loading goals…</WidgetEmpty>
      ) : filtered.length === 0 ? (
        <WidgetEmpty>No prioritised goals yet.</WidgetEmpty>
      ) : (
        <WidgetList
          items={filtered.map((t) => ({
            id: t.id,
            primary: t.title,
            secondary: t.priorityGroup ? `Priority: ${t.priorityGroup}` : undefined,
            trailing: t.dueDate || undefined,
            tone: t.priorityGroup === 'urgent' ? 'danger' : 'info',
          }))}
        />
      )}
      <WidgetFooterLink to="/notes">Open goals →</WidgetFooterLink>
    </div>
  );
}

function AnnouncementsW({ settings }: WidgetProps) {
  return <NotesWidget limit={limitOf(settings, 4)} pinnedOnly showLink={false} />;
}

registerWidgets([
  {
    type: 'tasks',
    label: 'Tasks',
    description: 'Overdue, due today and completed to-dos',
    icon: CheckSquare,
    category: 'productivity',
    defaultSize: 'md',
    component: TasksW,
    settings: [refreshField(), limitField(6), showStatsField(), showLinkField()],
  },
  {
    type: 'calendar',
    label: 'Calendar',
    description: "Today's schedule and upcoming deadlines",
    icon: CalendarDays,
    category: 'productivity',
    defaultSize: 'md',
    component: CalendarW,
    settings: [
      refreshField(),
      { key: 'daysAhead', label: 'Days ahead', type: 'number', min: 1, max: 180, default: 14 },
      limitField(6),
      showStatsField(),
    ],
  },
  {
    type: 'notes',
    label: 'Notes',
    description: 'Your pinned and most recent notes',
    icon: StickyNote,
    category: 'productivity',
    defaultSize: 'md',
    component: NotesW,
    settings: [
      refreshField(),
      limitField(5),
      { key: 'pinnedOnly', label: 'Pinned notes only', type: 'switch', default: false },
      showLinkField(),
    ],
  },
  {
    type: 'goals',
    label: 'Goals',
    description: 'Prioritised objectives from your to-do list',
    icon: Target,
    category: 'productivity',
    defaultSize: 'md',
    component: GoalsW,
    settings: [
      refreshField(),
      limitField(6),
      {
        key: 'group',
        label: 'Priority group',
        type: 'select',
        default: 'all',
        options: [
          { value: 'all', label: 'All priorities' },
          { value: 'urgent', label: 'Urgent' },
          { value: 'soon', label: 'Soon' },
          { value: 'eventually', label: 'Eventually' },
        ],
      },
    ],
  },
  {
    type: 'announcements',
    label: 'Announcements',
    description: 'Pinned notes shared as team announcements',
    icon: Megaphone,
    category: 'productivity',
    defaultSize: 'md',
    component: AnnouncementsW,
    settings: [refreshField(), limitField(4)],
  },
]);
