import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, PackageX, Layers } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useBulkItemLocationQuantities } from '@/hooks/useBulkItemLocationQuantities';
import { StatPill, WidgetEmpty, WidgetList } from './primitives';

export function InventoryAlertsWidget({
  threshold = 0,
  limit = 8,
  showStats = true,
  showLink = true,
  warehouseId = 'all',
  onlyWithMin = false,
}: {
  threshold?: number;
  limit?: number;
  showStats?: boolean;
  showLink?: boolean;
  warehouseId?: string;
  onlyWithMin?: boolean;
}) {
  const { allItems, loading } = useInventory();
  const { warehouses } = useWarehouses();
  const items = allItems || [];

  const scoped = warehouseId !== 'all';
  const itemIds = useMemo(() => (scoped ? items.map((i) => i.id) : []), [items, scoped]);
  const { warehouseItemQtyMap, loading: locLoading } = useBulkItemLocationQuantities(itemIds);

  const locationName = warehouses.find((w) => w.id === warehouseId)?.name;

  const qtyOf = (item: (typeof items)[number]) =>
    scoped ? warehouseItemQtyMap.get(`${warehouseId}:${item.id}`) ?? 0 : item.quantity ?? 0;

  // When scoped to a location, only consider items that actually have a row there.
  const visible = scoped
    ? items.filter((i) => warehouseItemQtyMap.has(`${warehouseId}:${i.id}`))
    : items;

  // 0 threshold falls back to each item's own minimum. With "only items with a
  // minimum set" enabled, items without a minimum are never flagged as low.
  const lowLimitFor = (min: number) => {
    if (onlyWithMin) return min > 0 ? min : 0;
    return threshold > 0 ? threshold : min;
  };

  const outOfStock = visible.filter((i) => qtyOf(i) <= 0);
  const lowStock = visible.filter((i) => {
    const q = qtyOf(i);
    const lim = lowLimitFor(i.minStock);
    return q > 0 && lim > 0 && q <= lim;
  });
  const overstock = visible.filter((i) => i.maxStock > 0 && qtyOf(i) > i.maxStock);

  const list = [
    ...outOfStock.map((i) => ({ item: i, label: 'Out of stock', tone: 'danger' as const })),
    ...lowStock.map((i) => ({ item: i, label: 'Low stock', tone: 'warning' as const })),
    ...overstock.map((i) => ({ item: i, label: 'Overstock', tone: 'info' as const })),
  ].slice(0, limit);

  const busy = loading || (scoped && locLoading);

  return (
    <div className="space-y-4">
      {scoped && locationName && (
        <p className="text-xs text-muted-foreground">Location: {locationName}</p>
      )}
      {showStats && (
        <div className="grid grid-cols-3 gap-2">
          <StatPill label="Low stock" value={lowStock.length} tone="warning" icon={AlertTriangle} />
          <StatPill label="Out of stock" value={outOfStock.length} tone="danger" icon={PackageX} />
          <StatPill label="Overstock" value={overstock.length} tone="info" icon={Layers} />
        </div>
      )}
      {busy ? (
        <WidgetEmpty>Loading inventory…</WidgetEmpty>
      ) : list.length === 0 ? (
        <WidgetEmpty>Stock levels look healthy.</WidgetEmpty>
      ) : (
        <WidgetList
          items={list.map(({ item, label, tone }) => ({
            id: `${item.id}-${label}`,
            primary: item.name,
            secondary: item.sku ? `Part # ${item.sku}` : undefined,
            trailing: `${qtyOf(item)} · ${label}`,
            tone,
          }))}
        />
      )}
      {showLink && (
        <Link to="/items" className="block text-xs font-medium text-primary hover:underline">
          Manage inventory →
        </Link>
      )}
    </div>
  );
}
