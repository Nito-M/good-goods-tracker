import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { widgetsByCategory } from '@/lib/dashboard/registry';

export function WidgetLibraryDialog({ onAdd }: { onAdd: (type: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const groups = useMemo(() => widgetsByCategory(), []);

  const q = query.trim().toLowerCase();
  const filtered = groups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (w) =>
          !q ||
          w.label.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q) ||
          g.category.label.toLowerCase().includes(q)
      ),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-1.5 h-4 w-4" />
          Add Widget
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Widget library</DialogTitle>
          <DialogDescription>
            Every module in the app can expose widgets here — pick what belongs on this dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search widgets…"
            className="pl-9"
          />
        </div>

        <div className="space-y-6">
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No widgets match.</p>
          )}
          {filtered.map(({ category, items }) => (
            <section key={category.key} className="space-y-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{category.label}</h3>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {items.map((w) => (
                  <button
                    key={w.type}
                    type="button"
                    onClick={() => {
                      onAdd(w.type);
                      setOpen(false);
                    }}
                    className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <w.icon className="h-4 w-4 text-primary" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {w.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">{w.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
