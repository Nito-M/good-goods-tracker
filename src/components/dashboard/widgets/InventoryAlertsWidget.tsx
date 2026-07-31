import { Link } from 'react-router-dom';
import { AlertTriangle, PackageX, Layers } from 'lucide-react';
import { InventoryItem } from '@/types/inventory';
import { StatPill, WidgetEmpty, WidgetList } from './primitives';

export function InventoryAlertsWidget({
  items,
  loading,
}: {
  items: InventoryItem[];
  loading?: boolean;
}) {
  const outOfStock = items.filter((i) => (i.quantity ?? 0) <= 0);
  const lowStock = items.filter(
    (i) => (i.quantity ?? 0) > 0 && i.minStock > 0 && (i.quantity ?? 0) <= i.minStock
  );
  const overstock = items.filter((i) => i.maxStock > 0 && (i.quantity ?? 0) > i.maxStock);

  const list = [
    ...outOfStock.map((i) => ({ item: i, label: 'Out of stock', tone: 'danger' as const })),
    ...lowStock.map((i) => ({ item: i, label: 'Low stock', tone: 'warning' as const })),
    ...overstock.map((i) => ({ item: i, label: 'Overstock', tone: 'info' as const })),
  ].slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <StatPill label="Low stock" value={lowStock.length} tone="warning" icon={AlertTriangle} />
        <StatPill label="Out of stock" value={outOfStock.length} tone="danger" icon={PackageX} />
        <StatPill label="Overstock" value={overstock.length} tone="info" icon={Layers} />
      </div>
      {loading ? (
        <WidgetEmpty>Loading inventory…</WidgetEmpty>
      ) : list.length === 0 ? (
        <WidgetEmpty>Stock levels look healthy.</WidgetEmpty>
      ) : (
        <WidgetList
          items={list.map(({ item, label, tone }) => ({
            id: `${item.id}-${label}`,
            primary: item.name,
            secondary: item.sku ? `Part # ${item.sku}` : undefined,
            trailing: `${item.quantity} · ${label}`,
            tone,
          }))}
        />
      )}
      <Link to="/items" className="block text-xs font-medium text-primary hover:underline">
        Manage inventory →
      </Link>
    </div>
  );
}
