import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Package, Wrench } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { useParts } from '@/hooks/useParts';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface BoardLinkedItem {
  k: 'i' | 'p'; // inventory | part
  id: string;
  n: string; // name
  s: string; // sku
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (item: BoardLinkedItem) => void;
  currentValue?: BoardLinkedItem | null;
}

export function BoardItemPickerDialog({ open, onOpenChange, onPick, currentValue }: Props) {
  const { allItems, loading: invLoading } = useInventory();
  const { parts, loading: partsLoading } = useParts();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'inventory' | 'parts'>(currentValue?.k === 'p' ? 'parts' : 'inventory');

  const ql = q.trim().toLowerCase();

  const inventoryRows = useMemo(() => {
    if (!ql) return allItems.slice(0, 200);
    return allItems.filter(
      (i) =>
        i.name.toLowerCase().includes(ql) ||
        (i.sku || '').toLowerCase().includes(ql) ||
        (i.internalPartNumber || '').toLowerCase().includes(ql)
    );
  }, [allItems, ql]);

  const partRows = useMemo(() => {
    if (!ql) return parts.slice(0, 200);
    return parts.filter(
      (p) => p.name.toLowerCase().includes(ql) || (p.sku || '').toLowerCase().includes(ql)
    );
  }, [parts, ql]);

  const handlePick = (item: BoardLinkedItem) => {
    onPick(item);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Link an item</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or part number…"
            className="pl-9"
          />
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'inventory' | 'parts')}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="inventory">
              <Package className="h-4 w-4 mr-2" /> Inventory ({inventoryRows.length})
            </TabsTrigger>
            <TabsTrigger value="parts">
              <Wrench className="h-4 w-4 mr-2" /> Parts ({partRows.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="mt-2">
            <div className="max-h-[50vh] overflow-y-auto border rounded-md divide-y">
              {invLoading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
              {!invLoading && inventoryRows.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">No items found.</div>
              )}
              {inventoryRows.map((i) => (
                <button
                  key={i.id}
                  onClick={() => handlePick({ k: 'i', id: i.id, n: i.name, s: i.sku || '' })}
                  className="w-full text-left p-3 hover:bg-accent flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{i.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {i.sku || '—'}
                      {i.internalPartNumber ? ` · ${i.internalPartNumber}` : ''}
                    </div>
                  </div>
                  <div className="text-sm tabular-nums shrink-0">{formatCurrency(i.price || 0)}</div>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="parts" className="mt-2">
            <div className="max-h-[50vh] overflow-y-auto border rounded-md divide-y">
              {partsLoading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
              {!partsLoading && partRows.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">No parts found.</div>
              )}
              {partRows.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePick({ k: 'p', id: p.id, n: p.name, s: p.sku || '' })}
                  className="w-full text-left p-3 hover:bg-accent flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.sku || '—'}</div>
                  </div>
                  <div className="text-sm tabular-nums shrink-0">{formatCurrency(p.price || 0)}</div>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {currentValue && (
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              Linked: <span className="font-medium text-foreground">{currentValue.n}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onPick({ k: currentValue.k, id: '', n: '', s: '' });
                onOpenChange(false);
              }}
            >
              Clear link
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function parseItemCellValue(raw: string): BoardLinkedItem | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw);
    if (j && (j.k === 'i' || j.k === 'p') && typeof j.id === 'string' && j.id) {
      return { k: j.k, id: j.id, n: j.n || '', s: j.s || '' };
    }
  } catch {
    /* not JSON */
  }
  return null;
}

export function serializeItemCellValue(item: BoardLinkedItem | null): string {
  if (!item || !item.id) return '';
  return JSON.stringify({ k: item.k, id: item.id, n: item.n, s: item.s });
}
