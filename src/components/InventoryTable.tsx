import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryItem, QUANTITY_UNIT_LABELS } from '@/types/inventory';
import { ImageIcon, AlertTriangle } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious } from
'@/components/ui/pagination';

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
'@/components/ui/table';
import { cn, formatCurrency } from '@/lib/utils';
import { useItemThumbnails } from '@/hooks/useItemThumbnails';
import { useBulkItemTags } from '@/hooks/useItemTags';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';
import { useInventoryPreferences, InventoryColumnKey } from '@/hooks/useInventoryPreferences';

interface InventoryTableProps {
  items: InventoryItem[];
  onDelete: (id: string) => void;
  warehouseFilter?: string;
  warehouseItemQtyMap?: Map<string, number>;
  draggable?: boolean;
}

const PAGE_SIZE = 40;

const PAGE_STORAGE_KEY = 'inventory-table-page';

export function InventoryTable({ items, onDelete, warehouseFilter, warehouseItemQtyMap, draggable }: InventoryTableProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(() => {
    const stored = sessionStorage.getItem(PAGE_STORAGE_KEY);
    const n = stored ? parseInt(stored, 10) : 1;
    return Number.isFinite(n) && n > 0 ? n : 1;
  });
  useEffect(() => {
    sessionStorage.setItem(PAGE_STORAGE_KEY, String(currentPage));
  }, [currentPage]);
  const sortedItems = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name)), [items]);
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedItems.slice(start, start + PAGE_SIZE);
  }, [sortedItems, currentPage]);
  const pagedItemIds = useMemo(() => pagedItems.map((item) => item.id), [pagedItems]);
  const thumbnailMap = useItemThumbnails(pagedItemIds);
  const { getTagsForItem } = useBulkItemTags(pagedItemIds);
  const [viewerImage, setViewerImage] = useState<{url: string;alt: string;} | null>(null);
  const { priceDisplay, showTags, showImages, showSku, showQuantity, showPrice, columnOrder, markupPercent } = useInventoryPreferences();
  const showCost = priceDisplay === 'cost';

  const visibleColumns = useMemo<InventoryColumnKey[]>(() => {
    return columnOrder.filter((k) => {
      if (k === 'image') return showImages;
      if (k === 'sku') return showSku;
      if (k === 'quantity') return showQuantity;
      if (k === 'price') return showPrice;
      return true; // name always visible
    });
  }, [columnOrder, showImages, showSku, showQuantity, showPrice]);

  const renderHeader = (key: InventoryColumnKey) => {
    switch (key) {
      case 'image':
        return <TableHead key={key} className="font-semibold text-card-foreground w-12"></TableHead>;
      case 'name':
        return <TableHead key={key} className="font-semibold text-card-foreground">Product Name</TableHead>;
      case 'sku':
        return <TableHead key={key} className="font-semibold text-card-foreground">Part #</TableHead>;
      case 'quantity':
        return <TableHead key={key} className="font-semibold text-card-foreground text-right">Quantity</TableHead>;
      case 'price':
        return <TableHead key={key} className="font-semibold text-card-foreground text-right">{showCost ? 'Cost' : 'Price'}</TableHead>;
    }
  };

  const renderCell = (key: InventoryColumnKey, item: InventoryItem, displayQty: number) => {
    switch (key) {
      case 'image':
        return (
          <TableCell key={key} className="w-14 py-1">
            {thumbnailMap.get(item.id) || item.imageUrl ? (
              <div
                className="w-12 h-12 rounded-md border border-border bg-muted/30 overflow-hidden cursor-pointer flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewerImage({ url: thumbnailMap.get(item.id) || item.imageUrl!, alt: item.name });
                }}>
                <img
                  src={thumbnailMap.get(item.id) || item.imageUrl!}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-md border border-border bg-muted/50 flex items-center justify-center px-0">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </TableCell>
        );
      case 'name':
        return (
          <TableCell
            key={key}
            className="font-medium text-card-foreground cursor-pointer hover:underline"
            onClick={() => navigate(`/item/${item.id}`)}>
            <div>
              {item.name}
              {showTags && (() => {
                const itemTags = getTagsForItem(item.id);
                if (itemTags.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {itemTags.slice(0, 3).map((t, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                        {t.name}
                      </Badge>
                    ))}
                    {itemTags.length > 3 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        +{itemTags.length - 3}
                      </Badge>
                    )}
                  </div>
                );
              })()}
            </div>
          </TableCell>
        );
      case 'sku':
        return (
          <TableCell key={key} className="tabular-nums text-muted-foreground">
            {item.sku}
          </TableCell>
        );
      case 'quantity': {
        const isLow = item.minStock > 0 && displayQty <= item.minStock;
        return (
          <TableCell key={key} className="text-right tabular-nums">
            <span className="inline-flex items-center gap-1.5 justify-end">
              {isLow && (
                <AlertTriangle
                  className="h-4 w-4 text-destructive"
                  aria-label={`Low stock (min ${item.minStock})`}
                />
              )}
              <span className={cn(isLow && 'text-destructive font-medium')}>
                {displayQty} {item.quantityUnit !== 'pcs' ? QUANTITY_UNIT_LABELS[item.quantityUnit] : ''}
              </span>
            </span>
          </TableCell>
        );
      }
      case 'price': {
        const rawPrice = showCost
          ? item.cost
          : markupPercent > 0 && item.cost > 0
            ? item.cost * (1 + markupPercent / 100)
            : item.price > 0
              ? item.price
              : 0;
        return (
          <TableCell key={key} className="text-right tabular-nums">
            {formatCurrency(rawPrice)}
          </TableCell>
        );
      }
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            {visibleColumns.map(renderHeader)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ?
          <TableRow>
              <TableCell colSpan={visibleColumns.length} className="h-24 text-center text-muted-foreground">
                No items found.
              </TableCell>
            </TableRow> :

          pagedItems.map((item) => {
            const displayQty = warehouseFilter && warehouseItemQtyMap ?
            warehouseItemQtyMap.get(`${warehouseFilter}:${item.id}`) ?? 0 :
            item.quantity;
            return (
              <TableRow
                key={item.id}
                draggable={draggable}
                onDragStart={draggable ? (e) => {
                  e.dataTransfer.effectAllowed = 'copy';
                  e.dataTransfer.setData('application/x-inventory-item', item.id);
                } : undefined}
                className={cn(
                  'transition-colors hover:bg-muted/30',
                  draggable && 'cursor-grab active:cursor-grabbing',
                )}>
                {visibleColumns.map((k) => renderCell(k, item, displayQty))}
              </TableRow>);

          })
          }
        </TableBody>
      </Table>
      {totalPages > 1 &&
      <div className="border-t border-border px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sortedItems.length)} of {sortedItems.length} items
          </p>
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />

              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).
            filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1).
            reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
              if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
              acc.push(page);
              return acc;
            }, []).
            map((page, idx) =>
            page === 'ellipsis' ?
            <PaginationItem key={`e-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem> :

            <PaginationItem key={page}>
                      <PaginationLink
                isActive={page === currentPage}
                onClick={() => setCurrentPage(page as number)}
                className="cursor-pointer">

                        {page}
                      </PaginationLink>
                    </PaginationItem>

            )}
              <PaginationItem>
                <PaginationNext
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />

              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      }
      <ImageViewerDialog
        imageUrl={viewerImage?.url ?? null}
        alt={viewerImage?.alt ?? ''}
        open={!!viewerImage}
        onOpenChange={(open) => {if (!open) setViewerImage(null);}} />

    </div>);

}
