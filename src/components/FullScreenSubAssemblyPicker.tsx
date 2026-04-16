import { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, PackagePlus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface SubAssemblyRow {
  id: string;
  name: string;
  description: string | null;
  selling_price: number;
  type: string;
}

export interface SelectedSubAssembly {
  id: string;
  source: 'parts1';
}

interface FullScreenSubAssemblyPickerProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selections: SelectedSubAssembly[]) => void;
  subAssemblies1: SubAssemblyRow[];
  adding?: boolean;
  existingSubAssemblyIds?: string[];
  label1?: string;
}

export function FullScreenSubAssemblyPicker({
  open,
  onClose,
  onConfirm,
  subAssemblies1,
  adding,
  existingSubAssemblyIds = [],
  label1 = 'Parts Assemblies',
}: FullScreenSubAssemblyPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selections, setSelections] = useState<SelectedSubAssembly[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelections([]);
      window.history.pushState({ picker: 'subassembly' }, '');
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = () => onClose();
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [open, onClose]);

  const toggleSelection = (id: string) => {
    setSelections(prev => {
      const exists = prev.find(s => s.id === id);
      if (exists) return prev.filter(s => s.id !== id);
      return [...prev, { id, source: 'parts1' }];
    });
  };

  const isSelected = (id: string) => selections.some(s => s.id === id);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return subAssemblies1;
    return subAssemblies1.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.description ?? '').toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
    );
  }, [subAssemblies1, searchQuery]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <X className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold flex-1">{label1}</h2>
        {selections.length > 0 && (
          <Badge variant="secondary" className="mr-2">{selections.length} selected</Badge>
        )}
      </div>

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

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2 max-w-3xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <PackagePlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No sub assemblies found.</p>
            </div>
          ) : (
            filtered.map((a) => {
              const selected = isSelected(a.id);
              const alreadyAdded = existingSubAssemblyIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => !alreadyAdded && toggleSelection(a.id)}
                  disabled={alreadyAdded}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center justify-between gap-4 ${
                    alreadyAdded ? 'opacity-50 cursor-not-allowed bg-muted' :
                    selected ? 'border-primary bg-primary/10' : 'bg-card hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`shrink-0 h-5 w-5 rounded border flex items-center justify-center ${
                      alreadyAdded ? 'bg-muted-foreground/20 border-muted-foreground/30' :
                      selected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                    }`}>
                      {(selected || alreadyAdded) && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{a.name}</p>
                      {a.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{a.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.type}
                        {alreadyAdded && <span className="ml-2 text-primary">(already added)</span>}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {a.selling_price > 0 && (
                      <span className="text-sm font-medium text-primary">{formatCurrency(a.selling_price)}</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>

      {selections.length > 0 && (
        <div className="border-t bg-card px-4 py-3 shrink-0">
          <Button
            className="w-full"
            size="lg"
            onClick={() => onConfirm(selections)}
            disabled={adding}
          >
            {adding ? 'Adding...' : `Add ${selections.length} Sub Assembl${selections.length !== 1 ? 'ies' : 'y'}`}
          </Button>
        </div>
      )}
    </div>
  );
}
