import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, LayoutGrid, RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useProfile } from '@/hooks/useProfile';
import { WIDGET_CATALOG, WidgetInstance } from '@/types/dashboard';
import { InventoryItem } from '@/types/inventory';
import { WidgetShell } from '@/components/dashboard/WidgetShell';
import { AddWidgetDialog } from '@/components/dashboard/AddWidgetDialog';
import { TasksWidget } from '@/components/dashboard/widgets/TasksWidget';
import { CalendarWidget } from '@/components/dashboard/widgets/CalendarWidget';
import { BusinessProfileWidget } from '@/components/dashboard/widgets/BusinessProfileWidget';
import { ActiveJobsWidget } from '@/components/dashboard/widgets/ActiveJobsWidget';
import { InventoryAlertsWidget } from '@/components/dashboard/widgets/InventoryAlertsWidget';
import { RecentOrdersWidget } from '@/components/dashboard/widgets/RecentOrdersWidget';
import { NotesWidget } from '@/components/dashboard/widgets/NotesWidget';
import { QuickActionsWidget } from '@/components/dashboard/widgets/QuickActionsWidget';

interface DashboardProps {
  items: InventoryItem[];
  loading: boolean;
  setSearchQuery: (q: string) => void;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Dashboard({ items, loading, setSearchQuery }: DashboardProps) {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const { widgets, addWidget, removeWidget, setSize, setTitle, moveWidget, resetLayout } =
    useDashboardLayout();

  const today = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    []
  );

  const name = profile?.displayName?.split(' ')[0] || 'there';

  const renderWidget = (w: WidgetInstance) => {
    switch (w.type) {
      case 'tasks':
        return <TasksWidget />;
      case 'calendar':
        return <CalendarWidget />;
      case 'business':
        return <BusinessProfileWidget />;
      case 'jobs':
        return <ActiveJobsWidget />;
      case 'inventory':
        return <InventoryAlertsWidget items={items} loading={loading} />;
      case 'orders':
        return <RecentOrdersWidget />;
      case 'notes':
        return <NotesWidget />;
      case 'quickActions':
        return <QuickActionsWidget />;
      default:
        return null;
    }
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearchQuery(search.trim());
    navigate('/items');
  };

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {today}
              </p>
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-card-foreground sm:text-3xl">
                {greeting()}, {name}
              </h1>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <form onSubmit={submitSearch} className="relative sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search inventory, parts, SKUs…"
                  className="pl-9"
                  aria-label="Global search"
                />
              </form>
              <div className="flex items-center gap-2">
                <AddWidgetDialog onAdd={addWidget} />
                <Button
                  size="sm"
                  variant={editing ? 'default' : 'outline'}
                  onClick={() => setEditing((v) => !v)}
                >
                  {editing ? (
                    <>
                      <Check className="mr-1.5 h-4 w-4" />
                      Done
                    </>
                  ) : (
                    <>
                      <LayoutGrid className="mr-1.5 h-4 w-4" />
                      Edit Layout
                    </>
                  )}
                </Button>
                {editing && (
                  <Button size="sm" variant="ghost" onClick={resetLayout} aria-label="Reset layout">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {editing && (
            <p className="mt-3 text-xs text-muted-foreground">
              Drag widgets by their handle to reorder, use the settings icon to rename or resize
              (Small, Medium, Large, Full width).
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {widgets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Your dashboard is empty. Add a widget to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {widgets.map((w) => {
              const def = WIDGET_CATALOG[w.type];
              return (
                <WidgetShell
                  key={w.id}
                  id={w.id}
                  title={w.title || def.label}
                  icon={def.icon}
                  size={w.size}
                  editing={editing}
                  onSizeChange={(s) => setSize(w.id, s)}
                  onTitleChange={(t) => setTitle(w.id, t)}
                  onRemove={() => removeWidget(w.id)}
                  onDropWidget={(fromId) => moveWidget(fromId, w.id)}
                >
                  {renderWidget(w)}
                </WidgetShell>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
