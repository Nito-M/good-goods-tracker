import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Clock,
  DollarSign,
  Flame,
  PackagePlus,
  Truck,
} from 'lucide-react';
import { registerWidgets } from '../registry';
import {
  WidgetProps,
  dateRangeField,
  limitField,
  refreshField,
  showLinkField,
  showStatsField,
  thresholdField,
  warehouseField,
  onlyFlaggedField,
  boolSetting,
  strSetting,
  numSetting,
} from '../types';
import { InventoryAlertsWidget } from '@/components/dashboard/widgets/InventoryAlertsWidget';
import { useInventory } from '@/hooks/useInventory';
import { useRequests } from '@/hooks/useRequests';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { supabase } from '@/integrations/supabase/client';
import {
  MetricRow,
  StatPill,
  WidgetEmpty,
  WidgetFooterLink,
  WidgetList,
  inRange,
  limitOf,
  money,
  rangeStart,
  poTotal,
} from '../shared';

function LowStockW({ settings }: WidgetProps) {
  return (
    <InventoryAlertsWidget
      threshold={numSetting(settings, 'threshold', 0)}
      limit={limitOf(settings, 8)}
      showStats={boolSetting(settings, 'showStats')}
      showLink={boolSetting(settings, 'showLink')}
      warehouseId={strSetting(settings, 'warehouseId', 'all')}
      onlyWithMin={boolSetting(settings, 'onlyWithMin', false)}
    />
  );
}

function InventorySummaryW({ settings }: WidgetProps) {
  const { allItems, stats, loading } = useInventory();
  const items = allItems || [];
  const cost = items.reduce((s, i) => s + (i.quantity || 0) * (i.cost || 0), 0);

  if (loading) return <WidgetEmpty>Loading inventory…</WidgetEmpty>;

  return (
    <div className="space-y-3">
      <MetricRow
        metrics={[
          { label: 'SKUs', value: items.length },
          { label: 'Units in stock', value: Math.round(stats.totalItems) },
          { label: 'Low stock', value: stats.lowStockCount },
          { label: 'Retail value', value: money(stats.totalValue) },
          { label: 'Cost value', value: money(cost) },
          {
            label: 'Out of stock',
            value: items.filter((i) => (i.quantity || 0) <= 0).length,
          },
        ]}
      />
      {boolSetting(settings, 'showLink') && (
        <WidgetFooterLink to="/items">Open items & inventory →</WidgetFooterLink>
      )}
    </div>
  );
}

function InventoryValueW({ settings }: WidgetProps) {
  const { allItems, loading } = useInventory();
  const items = allItems || [];
  const basis = String(settings.basis ?? 'cost');
  const value = items.reduce(
    (s, i) => s + (i.quantity || 0) * (basis === 'price' ? i.price || 0 : i.cost || 0),
    0
  );
  const top = [...items]
    .sort(
      (a, b) =>
        (b.quantity || 0) * (basis === 'price' ? b.price || 0 : b.cost || 0) -
        (a.quantity || 0) * (basis === 'price' ? a.price || 0 : a.cost || 0)
    )
    .slice(0, limitOf(settings, 5));

  return (
    <div className="space-y-3">
      {loading ? (
        <WidgetEmpty>Calculating…</WidgetEmpty>
      ) : (
        <>
          <StatPill
            label={basis === 'price' ? 'Total retail value' : 'Total cost value'}
            value={money(value)}
            tone="success"
            icon={DollarSign}
          />
          <WidgetList
            items={top.map((i) => ({
              id: i.id,
              primary: i.name,
              secondary: i.sku ? `Part # ${i.sku}` : undefined,
              trailing: money((i.quantity || 0) * (basis === 'price' ? i.price || 0 : i.cost || 0)),
              tone: 'info',
            }))}
          />
        </>
      )}
    </div>
  );
}

function RecentlyAddedW({ settings }: WidgetProps) {
  const { allItems, loading } = useInventory();
  const start = rangeStart(settings, '30');
  const list = (allItems || [])
    .filter((i) => inRange(i.createdAt, start))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limitOf(settings, 6));

  return (
    <div className="space-y-3">
      {loading ? (
        <WidgetEmpty>Loading items…</WidgetEmpty>
      ) : list.length === 0 ? (
        <WidgetEmpty>No items added in this period.</WidgetEmpty>
      ) : (
        <WidgetList
          items={list.map((i) => ({
            id: i.id,
            primary: i.name,
            secondary: i.sku ? `Part # ${i.sku}` : i.category,
            trailing: new Date(i.createdAt).toISOString().slice(0, 10),
            tone: 'info',
          }))}
        />
      )}
      <WidgetFooterLink to="/items">Open items →</WidgetFooterLink>
    </div>
  );
}

function MostUsedW({ settings }: WidgetProps) {
  const { allItems } = useInventory();
  const [rows, setRows] = useState<{ id: string; qty: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const start = rangeStart(settings, '90');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let q = supabase.from('item_consumptions').select('item_id, quantity, created_at');
      if (start) q = q.gte('created_at', start);
      const { data } = await q;
      if (cancelled) return;
      const totals = new Map<string, number>();
      (data || []).forEach((r) => {
        const id = String(r.item_id ?? '');
        if (!id) return;
        totals.set(id, (totals.get(id) || 0) + Number(r.quantity || 0));
      });
      setRows(
        Array.from(totals.entries())
          .map(([id, qty]) => ({ id, qty }))
          .sort((a, b) => b.qty - a.qty)
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [start]);

  const byId = new Map((allItems || []).map((i) => [i.id, i]));
  const list = rows.slice(0, limitOf(settings, 6));

  return (
    <div className="space-y-3">
      {loading ? (
        <WidgetEmpty>Loading consumption…</WidgetEmpty>
      ) : list.length === 0 ? (
        <WidgetEmpty>No consumption recorded in this period.</WidgetEmpty>
      ) : (
        <WidgetList
          items={list.map((r) => ({
            id: r.id,
            primary: byId.get(r.id)?.name || 'Item',
            secondary: byId.get(r.id)?.sku ? `Part # ${byId.get(r.id)?.sku}` : undefined,
            trailing: `${Math.round(r.qty * 100) / 100} used`,
            tone: 'warning',
          }))}
        />
      )}
    </div>
  );
}

function PurchaseRequestsW({ settings }: WidgetProps) {
  const { requests, loading } = useRequests();
  const status = String(settings.status ?? 'pending');
  const filtered = requests
    .filter((r) => status === 'all' || r.status === status)
    .slice(0, limitOf(settings, 6));

  return (
    <div className="space-y-3">
      {boolSetting(settings, 'showStats') && (
        <div className="grid grid-cols-3 gap-2">
          <StatPill
            label="Pending"
            value={requests.filter((r) => r.status === 'pending').length}
            tone="warning"
            icon={AlertTriangle}
          />
          <StatPill
            label="Approved"
            value={requests.filter((r) => r.status === 'approved').length}
            tone="info"
            icon={Boxes}
          />
          <StatPill
            label="Ordered"
            value={requests.filter((r) => r.status === 'ordered').length}
            tone="success"
            icon={Truck}
          />
        </div>
      )}
      {loading ? (
        <WidgetEmpty>Loading requests…</WidgetEmpty>
      ) : filtered.length === 0 ? (
        <WidgetEmpty>No matching requests.</WidgetEmpty>
      ) : (
        <WidgetList
          items={filtered.map((r) => ({
            id: r.id,
            primary: `${r.requestNumber ? `${r.requestNumber} · ` : ''}${r.itemName}`,
            secondary: r.requesterName || r.vendorName || undefined,
            trailing: r.status,
            tone: r.status === 'pending' ? 'warning' : 'info',
          }))}
        />
      )}
      <WidgetFooterLink to="/requests">Open requests →</WidgetFooterLink>
    </div>
  );
}

function IncomingShipmentsW({ settings }: WidgetProps) {
  const { orders, loading } = usePurchaseOrders();
  const list = orders
    .filter((o) => o.status === 'ordered' || o.status === 'partially_received')
    .slice(0, limitOf(settings, 6));

  return (
    <div className="space-y-3">
      {loading ? (
        <WidgetEmpty>Loading purchase orders…</WidgetEmpty>
      ) : list.length === 0 ? (
        <WidgetEmpty>Nothing in transit.</WidgetEmpty>
      ) : (
        <WidgetList
          items={list.map((o) => ({
            id: o.id,
            primary: `${o.poNumber || 'PO'} · ${o.vendorName || 'Vendor'}`,
            secondary:
              o.status === 'partially_received' ? 'Partially received' : 'Ordered — awaiting arrival',
            trailing: money(poTotal(o)),
            tone: o.status === 'partially_received' ? 'warning' : 'info',
          }))}
        />
      )}
      <WidgetFooterLink to="/purchase-orders">Open purchase orders →</WidgetFooterLink>
    </div>
  );
}

registerWidgets([
  {
    type: 'inventorySummary',
    label: 'Inventory Summary',
    description: 'SKUs, units, and stock value at a glance',
    icon: Boxes,
    category: 'inventory',
    defaultSize: 'lg',
    component: InventorySummaryW,
    settings: [refreshField(), showLinkField()],
  },
  {
    type: 'inventory',
    label: 'Low Stock',
    description: 'Low, out of stock and overstock alerts',
    icon: AlertTriangle,
    category: 'inventory',
    defaultSize: 'md',
    component: LowStockW,
    settings: [
      refreshField(),
      warehouseField(),
      thresholdField(),
      onlyFlaggedField(),
      limitField(8),
      showStatsField(),
      showLinkField(),
    ],
  },
  {
    type: 'recentlyAddedItems',
    label: 'Recently Added Items',
    description: 'Newest items in your catalogue',
    icon: PackagePlus,
    category: 'inventory',
    defaultSize: 'md',
    component: RecentlyAddedW,
    settings: [refreshField(), dateRangeField('30'), limitField(6)],
  },
  {
    type: 'mostUsedItems',
    label: 'Most Used Items',
    description: 'Highest consumption over a period',
    icon: Flame,
    category: 'inventory',
    defaultSize: 'md',
    component: MostUsedW,
    settings: [refreshField(), dateRangeField('90'), limitField(6)],
  },
  {
    type: 'purchaseRequests',
    label: 'Purchase Requests',
    description: 'Requests waiting on approval or ordering',
    icon: Clock,
    category: 'inventory',
    defaultSize: 'md',
    component: PurchaseRequestsW,
    settings: [
      refreshField(),
      {
        key: 'status',
        label: 'Status filter',
        type: 'select',
        default: 'pending',
        options: [
          { value: 'all', label: 'All statuses' },
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'ordered', label: 'Ordered' },
        ],
      },
      limitField(6),
      showStatsField(),
    ],
  },
  {
    type: 'incomingShipments',
    label: 'Incoming Shipments',
    description: 'Ordered and partially received purchase orders',
    icon: Truck,
    category: 'inventory',
    defaultSize: 'md',
    component: IncomingShipmentsW,
    settings: [refreshField(), limitField(6)],
  },
  {
    type: 'inventoryValue',
    label: 'Inventory Value',
    description: 'Total value at cost or retail with top holdings',
    icon: DollarSign,
    category: 'inventory',
    defaultSize: 'md',
    component: InventoryValueW,
    settings: [
      refreshField(),
      {
        key: 'basis',
        label: 'Valuation basis',
        type: 'select',
        default: 'cost',
        options: [
          { value: 'cost', label: 'Cost' },
          { value: 'price', label: 'Retail price' },
        ],
      },
      limitField(5),
    ],
  },
]);
