import { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, PackagePlus, ArrowLeft } from 'lucide-react';
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
  onSelect: (subAssemblyId: string, source: 'parts1' | 'parts2') => void;
  subAssemblies1: SubAssemblyRow[];
  subAssemblies2: SubAssemblyRow[];
  adding?: string | null;
}

export function FullScreenSubAssemblyPicker({
  open,
  onClose,
  onSelect,
  subAssemblies1,
  subAssemblies2,
  adding,
}: FullScreenSubAssemblyPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<'parts1' | 'parts2' | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedSource(null);
      window.history.pushState({ picker: 'subassembly' }, '');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = () => {
      if (selectedSource) {
        setSelectedSource(null);
        setSearchQuery('');
        window.history.pushState({ picker: 'subassembly' }, '');
      } else {
        onClose();
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [open, onClose, selectedSource]);

  const handleSelectSource = (source: 'parts1' | 'parts2') => {
    setSelectedSource(source);
    setSearchQuery('');
    window.history.pushState({ picker: 'subassembly-list' }, '');
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const activeList = selectedSource === 'parts1' ? subAssemblies1 : selectedSource === 'parts2' ? subAssemblies2 : [];

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return activeList;
    return activeList.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.description ?? '').toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
    );
  }, [activeList, searchQuery]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card shrink-0">
        {selectedSource ? (
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <X className="h-5 w-5" />
          </Button>
        )}
        <h2 className="text-lg font-semibold flex-1">
          {selectedSource ? (selectedSource === 'parts1' ? 'Parts Assemblies 1' : 'Parts Assemblies 2') : 'Add Sub Assembly'}
        </h2>
      </div>

      {!selectedSource ? (
        /* Source selection */
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="space-y-4 w-full max-w-md">
            <p className="text-center text-muted-foreground text-sm mb-6">Choose which sub assembly source to add from</p>
            <button
              onClick={() => handleSelectSource('parts1')}
              className="w-full text-left px-6 py-5 rounded-lg border bg-card hover:bg-accent transition-colors flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold text-base">Parts Assemblies 1</p>
                <p className="text-sm text-muted-foreground mt-1">{subAssemblies1.length} sub assembl{subAssemblies1.length !== 1 ? 'ies' : 'y'}</p>
              </div>
              <PackagePlus className="h-6 w-6 text-muted-foreground" />
            </button>
            <button
              onClick={() => handleSelectSource('parts2')}
              className="w-full text-left px-6 py-5 rounded-lg border bg-card hover:bg-accent transition-colors flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold text-base">Parts Assemblies 2</p>
                <p className="text-sm text-muted-foreground mt-1">{subAssemblies2.length} sub assembl{subAssemblies2.length !== 1 ? 'ies' : 'y'}</p>
              </div>
              <PackagePlus className="h-6 w-6 text-muted-foreground" />
            </button>
          </div>
        </div>
      ) : (
        <>
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
                    onClick={() => onSelect(a.id, selectedSource)}
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
        </>
      )}
    </div>
  );
}
