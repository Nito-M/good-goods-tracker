import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, LayoutGrid, RotateCcw, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDashboards } from '@/hooks/useDashboards';
import { useProfile } from '@/hooks/useProfile';
import { InventoryItem } from '@/types/inventory';
import { WidgetShell } from '@/components/dashboard/WidgetShell';
import { WidgetLibraryDialog } from '@/components/dashboard/WidgetLibraryDialog';
import { WidgetSettingsDialog } from '@/components/dashboard/WidgetSettingsDialog';
import { DashboardSwitcher } from '@/components/dashboard/DashboardSwitcher';
import { getWidgetDefinition } from '@/lib/dashboard/registry';
import { numSetting, resolveSettings } from '@/lib/dashboard/types';

interface DashboardProps {
  items?: InventoryItem[];
  loading?: boolean;
  setSearchQuery: (q: string) => void;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Dashboard({ setSearchQuery }: DashboardProps) {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [settingsFor, setSettingsFor] = useState<string | null>(null);

  const {
    dashboards,
    activeId,
    setActiveId,
    createDashboard,
    renameDashboard,
    deleteDashboard,
    duplicateDashboard,
    applyRoleDefaults,
    widgets,
    addWidget,
    removeWidget,
    setSize,
    setTitle,
    setSettings,
    moveWidget,
    resetDashboard,
    clearDashboard,
  } = useDashboards();

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

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearchQuery(search.trim());
    navigate('/items');
  };

  const settingsWidget = widgets.find((w) => w.id === settingsFor);
  const settingsDef = settingsWidget ? getWidgetDefinition(settingsWidget.type) : undefined;

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
                <WidgetLibraryDialog onAdd={addWidget} />
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
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={resetDashboard}
                      aria-label="Reset layout"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearDashboard}
                      aria-label="Remove all widgets"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <DashboardSwitcher
              dashboards={dashboards}
              activeId={activeId}
              onSelect={setActiveId}
              onCreate={createDashboard}
              onRename={renameDashboard}
              onDelete={deleteDashboard}
              onDuplicate={duplicateDashboard}
              onApplyRole={applyRoleDefaults}
            />
          </div>

          {editing && (
            <p className="mt-3 text-xs text-muted-foreground">
              Drag widgets by their handle to reorder, and use the settings icon to rename, resize
              and configure each widget.
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {widgets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">
              This dashboard is empty. Use “Add Widget” to build it from the widget library.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {widgets.map((w) => {
              const def = getWidgetDefinition(w.type);
              if (!def) return null;
              const resolved = resolveSettings(def, w.settings);
              const Component = def.component;
              return (
                <WidgetShell
                  key={w.id}
                  id={w.id}
                  title={w.title || def.label}
                  icon={def.icon}
                  size={w.size}
                  editing={editing}
                  refreshInterval={numSetting(resolved, 'refreshInterval', 0)}
                  onOpenSettings={() => setSettingsFor(w.id)}
                  onRemove={() => removeWidget(w.id)}
                  onDropWidget={(fromId) => moveWidget(fromId, w.id)}
                >
                  {(refreshKey) => (
                    <Component
                      key={refreshKey}
                      instanceId={w.id}
                      settings={resolved}
                    />
                  )}
                </WidgetShell>
              );
            })}
          </div>
        )}
      </main>

      {settingsWidget && settingsDef && (
        <WidgetSettingsDialog
          open={!!settingsFor}
          onOpenChange={(o) => !o && setSettingsFor(null)}
          definition={settingsDef}
          title={settingsWidget.title || settingsDef.label}
          size={settingsWidget.size}
          settings={settingsWidget.settings}
          onSave={({ title, size, settings }) => {
            setTitle(settingsWidget.id, title === settingsDef.label ? '' : title);
            setSize(settingsWidget.id, size);
            setSettings(settingsWidget.id, settings);
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;
