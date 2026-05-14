import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, X, Package, Wrench, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useInventory } from '@/hooks/useInventory';
import { useParts } from '@/hooks/useParts';
import { formatCurrency } from '@/lib/utils';

export interface BoardLinkedItem {
  k: 'i' | 'p'; // inventory | part
  id: string;
  n: string; // name
  s: string; // sku
  m?: number; // multiplier (default 1)
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
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'i' | 'p'>(currentValue?.k === 'p' ? 'p' : 'i');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // History push (mirror FullScreenItemPicker behavior)
  const closedByBackRef = useRef(false);
  const historyPushedRef = useRef(false);
  const closingFromActionRef = useRef(false);

  useEffect(() => {
    if (open) {
      setSelectedIndex(0);
      closedByBackRef.current = false;
      if (!historyPushedRef.current) {
        historyPushedRef.current = true;
        window.history.pushState({ picker: 'board-item' }, '');
      }
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      historyPushedRef.current = false;
      closingFromActionRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPop = () => {
      if (closingFromActionRef.current) {
        closingFromActionRef.current = false;
        return;
      }
      if (historyPushedRef.current) {
        historyPushedRef.current = false;
        closedByBackRef.current = true;
        onOpenChange(false);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [open, onOpenChange]);

  const handleClose = () => {
    if (closedByBackRef.current) {
      onOpenChange(false);
      return;
    }
    closingFromActionRef.current = true;
    onOpenChange(false);
    if (historyPushedRef.current) window.history.back();
  };

  const filteredInventory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allItems;
    const tokens = q.split(/\s+/).filter(Boolean);
    return allItems.filter((i) => {
      const hay = `${i.name} ${i.sku || ''} ${i.internalPartNumber || ''}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [allItems, searchQuery]);

  const filteredParts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return parts;
    const tokens = q.split(/\s+/).filter(Boolean);
    return parts.filter((p) => {
      const hay = `${p.name} ${p.sku || ''}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [parts, searchQuery]);

  const activeList = tab === 'i' ? filteredInventory : filteredParts;

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, tab]);

  const handlePick = (item: BoardLinkedItem) => {
    onPick(item);
    handleClose();
  };

  const handleClear = () => {
    onPick({ k: tab, id: '', n: '', s: '' });
    handleClose();
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((p) => Math.min(p + 1, activeList.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((p) => Math.max(p - 1, 0));
      } else if (e.key === 'Enter' && activeList.length > 0) {
        e.preventDefault();
        const sel = activeList[selectedIndex];
        if (!sel) return;
        if (tab === 'i') {
          handlePick({ k: 'i', id: sel.id, n: sel.name, s: (sel as any).sku || '' });
        } else {
          handlePick({ k: 'p', id: sel.id, n: sel.name, s: (sel as any).sku || '' });
        }
      } else if (e.key === 'Escape') {
        handleClose();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeList, selectedIndex, tab]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-card-foreground">Link an Item</h2>
          {currentValue && (
            <Badge variant="secondary" className="text-sm gap-1">
              <Link2 className="h-3 w-3" />
              {currentValue.n}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentValue && (
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear link
            </Button>
          )}
          <Button onClick={handleClose} size="lg" className="ml-2">
            Done
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search + Tabs */}
        <div className="p-4 border-b border-border shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by name, SKU, or part number..."
              className="pl-12 h-12 text-base"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={tab === 'i' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTab('i')}
              className="gap-1.5"
            >
              <Package className="h-4 w-4" />
              Inventory ({filteredInventory.length})
            </Button>
            <Button
              variant={tab === 'p' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTab('p')}
              className="gap-1.5"
            >
              <Wrench className="h-4 w-4" />
              Parts ({filteredParts.length})
            </Button>
          </div>
        </div>

        {/* Results */}
        <ScrollArea className="flex-1">
          {tab === 'i' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                      {searchQuery ? 'No items match your search' : 'No inventory items'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className={`cursor-pointer ${index === selectedIndex ? 'bg-accent' : ''}`}
                      onClick={() =>
                        handlePick({ k: 'i', id: item.id, n: item.name, s: item.sku || '' })
                      }
                    >
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        {item.sku ? <Badge variant="secondary">{item.sku}</Badge> : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            item.quantity <= item.minStock ? 'text-destructive font-medium' : ''
                          }
                        >
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.price || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partsLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : filteredParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-12">
                      {searchQuery ? 'No parts match your search' : 'No parts'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParts.map((p, index) => (
                    <TableRow
                      key={p.id}
                      className={`cursor-pointer ${index === selectedIndex ? 'bg-accent' : ''}`}
                      onClick={() => handlePick({ k: 'p', id: p.id, n: p.name, s: p.sku || '' })}
                    >
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>
                        {p.sku ? <Badge variant="secondary">{p.sku}</Badge> : '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(p.price || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 text-sm text-muted-foreground shrink-0">
          {tab === 'i' ? `${filteredInventory.length} items` : `${filteredParts.length} parts`}
          {searchQuery && ` matching "${searchQuery}"`}
          <span className="ml-4 text-xs">↑↓ Navigate · Enter to pick · Esc to close</span>
        </div>
      </div>
    </div>
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
