import { useMemo } from 'react';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { PurchaseOrder } from '@/types/purchaseOrder';

interface MonthlyGroup {
  key: string;
  label: string;
  orders: PurchaseOrder[];
}

export function groupOrdersByMonth(orders: PurchaseOrder[]): MonthlyGroup[] {
  const groups = new Map<string, PurchaseOrder[]>();

  for (const order of orders) {
    const key = format(order.orderedAt, 'yyyy-MM');
    const existing = groups.get(key) || [];
    existing.push(order);
    groups.set(key, existing);
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, groupOrders]) => {
      const [y, m] = key.split('-').map(Number);
      return {
        key,
        label: format(new Date(y, m - 1, 1, 12), 'MMMM yyyy'),
        orders: groupOrders,
      };
    });
}

interface MonthlyPOGroupProps {
  label: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function MonthlyPOGroup({ label, count, defaultOpen = false, children }: MonthlyPOGroupProps) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3 text-left hover:bg-muted transition-colors group">
        <span className="font-semibold text-card-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {count}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
