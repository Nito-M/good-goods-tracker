import { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, PackagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils';

interface SubAssemblyRow {
  id: string;
  name: string;
  description: string | null;
  selling_price: number;
  type: string;
}

interface FullScreenSubAssemblyPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (subAssemblyId: string) => void;
  subAssemblies: SubAssemblyRow[];
  adding?: string | null;
}

export function FullScreenSubAssemblyPicker({
  open,
  onClose,
  onSelect,
  subAssemblies,
  adding,
}: FullScreenSubAssemblyPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearchQuery('');
      window.history.pushState({ picker: 'subassembly' }, '');
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: PopStateEvent) => {
      onClose();
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return subAssemblies;
    return subAssemblies.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.description ?? '').toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
    );
  }, [subAssemblies, searchQuery]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={() => { window.history.back(); }}>
          <X className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold flex-1">Add Sub Assembly</h2>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b bg-card shrink-0">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search sub assemblies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2 max-w-3xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <PackagePlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No sub assemblies found.</p>
            </div>
          ) : (
            filtered.map((a) => (
              <button
                key={a.id}
                onClick={() => onSelect(a.id)}
                disabled={adding === a.id}
                className="w-full text-left px-4 py-3 rounded-lg border bg-card hover:bg-accent transition-colors flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{a.name}</p>
                  {a.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{a.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{a.type}</p>
                </div>
                <div className="shrink-0 text-right">
                  {a.selling_price > 0 && (
                    <span className="text-sm font-medium text-primary">{formatCurrency(a.selling_price)}</span>
                  )}
                  {adding === a.id && (
                    <span className="text-xs text-primary block">Adding...</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
