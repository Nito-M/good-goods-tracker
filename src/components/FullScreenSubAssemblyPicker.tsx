import { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, PackagePlus, Check, ChevronLeft, ChevronRight } from 'lucide-react';
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
  category?: string | null;
}

export type SubAssemblySource = 'parts1' | 'parts2' | 'assembly';

export interface SelectedSubAssembly {
  id: string;
  source: SubAssemblySource;
}

interface FullScreenSubAssemblyPickerProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selections: SelectedSubAssembly[]) => void;
  subAssemblies1: SubAssemblyRow[];
  subAssemblies2?: SubAssemblyRow[];
  fullAssemblies?: SubAssemblyRow[];
  adding?: boolean;
  existingSubAssemblyIds?: string[];
  existingSubAssembly2Ids?: string[];
  existingFullAssemblyIds?: string[];
  label1?: string;
  label2?: string;
  labelFullAssemblies?: string;
}

export function FullScreenSubAssemblyPicker({
  open,
  onClose,
  onConfirm,
  subAssemblies1,
  subAssemblies2 = [],
  fullAssemblies = [],
  adding,
  existingSubAssemblyIds = [],
  existingSubAssembly2Ids = [],
  existingFullAssemblyIds = [],
  label1 = 'Sub Assemblies',
  label2 = 'Sub Assemblies 2',
  labelFullAssemblies = 'Assemblies',
}: FullScreenSubAssemblyPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selections, setSelections] = useState<SelectedSubAssembly[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const pushedRef = useRef(false);

  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelections([]);
      setSelectedType(null);
      setSelectedCategory(null);
      if ((window.history.state as any)?.picker !== 'subassembly') {
        window.history.pushState({ picker: 'subassembly' }, '');
        pushedRef.current = true;
      }
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleClose = () => {
    if (pushedRef.current && (window.history.state as any)?.picker === 'subassembly') {
      pushedRef.current = false;
      window.history.back();
      return;
    }
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const handler = () => {
      pushedRef.current = false;
      onClose();
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [open, onClose]);


  const toggleSelection = (id: string, source: SubAssemblySource) => {
    setSelections(prev => {
      const exists = prev.find(s => s.id === id && s.source === source);
      if (exists) return prev.filter(s => !(s.id === id && s.source === source));
      return [...prev, { id, source }];
    });
  };

  const isSelected = (id: string, source: SubAssemblySource) =>
    selections.some(s => s.id === id && s.source === source);

  const applyFilter = (rows: SubAssemblyRow[]) => {
    const q = searchQuery.toLowerCase().trim();
    const byType = selectedType ? rows.filter((a) => (a.type || 'Uncategorized') === selectedType) : rows;
    const byCategory = selectedCategory
      ? byType.filter((a) => (a.category || 'Uncategorized') === selectedCategory)
      : byType;
    if (!q) return byCategory;
    return byCategory.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.description ?? '').toLowerCase().includes(q) ||
        (a.category ?? '').toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
    );
  };

  const typeGroups = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of [...subAssemblies1, ...subAssemblies2]) {
      const t = r.type || 'Uncategorized';
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => a.type.localeCompare(b.type));
  }, [subAssemblies1, subAssemblies2]);

  // Categories available inside the selected type
  const categoryGroups = useMemo(() => {
    if (!selectedType) return [];
    const counts = new Map<string, number>();
    for (const r of [...subAssemblies1, ...subAssemblies2, ...fullAssemblies]) {
      if ((r.type || 'Uncategorized') !== selectedType) continue;
      const c = r.category || 'Uncategorized';
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [subAssemblies1, subAssemblies2, fullAssemblies, selectedType]);

  const filtered1 = useMemo(() => applyFilter(subAssemblies1), [subAssemblies1, searchQuery, selectedType, selectedCategory]);
  const filtered2 = useMemo(() => applyFilter(subAssemblies2), [subAssemblies2, searchQuery, selectedType, selectedCategory]);
  const filteredFull = useMemo(() => applyFilter(fullAssemblies), [fullAssemblies, searchQuery, selectedType, selectedCategory]);


  const renderSection = (
    label: string,
    rows: SubAssemblyRow[],
    source: SubAssemblySource,
    existingIds: string[]
  ) => {
    if (rows.length === 0) return null;
    return (
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {rows.map((a) => {
          const selected = isSelected(a.id, source);
          const alreadyAdded = existingIds.includes(a.id);
          return (
            <button
              key={`${source}-${a.id}`}
              onClick={() => !alreadyAdded && toggleSelection(a.id, source)}
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
                  {a.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{a.description}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.type}
                    {a.category && <span className="ml-2">· {a.category}</span>}
                    {alreadyAdded && <span className="ml-2 text-primary">(already added)</span>}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                {a.selling_price > 0 && <span className="text-sm font-medium text-primary">{formatCurrency(a.selling_price)}</span>}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={() => (selectedType ? (setSelectedType(null), setSelectedCategory(null)) : window.history.back())}>
          {selectedType ? <ChevronLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
        <h2 className="text-lg font-semibold flex-1 truncate">{selectedType ?? 'Sub Assemblies'}</h2>
        {selections.length > 0 && (
          <Badge variant="secondary" className="mr-2">{selections.length} selected</Badge>
        )}
      </div>

      {selectedType && (
        <div className="px-4 py-3 border-b bg-card shrink-0 flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-80 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search sub assemblies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {categoryGroups.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground shrink-0">Category</span>
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                className="h-8 shrink-0"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categoryGroups.map((c) => (
                <Button
                  key={c.category}
                  variant={selectedCategory === c.category ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 shrink-0 gap-1.5"
                  onClick={() => setSelectedCategory(selectedCategory === c.category ? null : c.category)}
                >
                  {c.category}
                  <span className="text-xs opacity-70">{c.count}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}


      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6 max-w-3xl mx-auto">
          {!selectedType ? (
            typeGroups.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <PackagePlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No sub assemblies found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Choose a sub assembly group</p>
                {typeGroups.map((g) => (
                  <button
                    key={g.type}
                    onClick={() => { setSearchQuery(''); setSelectedCategory(null); setSelectedType(g.type); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                    className="w-full text-left px-4 py-3 rounded-lg border bg-card hover:bg-accent transition-colors flex items-center justify-between gap-4"
                  >
                    <span className="font-medium text-sm truncate">{g.type}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary">{g.count}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            <>
              {renderSection(labelFullAssemblies, filteredFull, 'assembly', existingFullAssemblyIds)}
              {renderSection(label1, filtered1, 'parts1', existingSubAssemblyIds)}
              {renderSection(label2, filtered2, 'parts2', existingSubAssembly2Ids)}

              {filtered1.length === 0 && filtered2.length === 0 && filteredFull.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <PackagePlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No sub assemblies found.</p>
                </div>
              )}
            </>
          )}
        </div>

      </ScrollArea>

      {selections.length > 0 && (
        <div className="border-t bg-card px-4 py-3 shrink-0">
          <Button className="w-full" size="lg" onClick={() => onConfirm(selections)} disabled={adding}>
            {adding ? 'Adding...' : `Add ${selections.length} Sub Assembl${selections.length !== 1 ? 'ies' : 'y'}`}
          </Button>
        </div>
      )}
    </div>
  );
}
