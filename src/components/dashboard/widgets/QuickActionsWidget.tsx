import { useNavigate } from 'react-router-dom';
import {
  PackagePlus,
  Hammer,
  FileText,
  UserPlus,
  Truck,
  ScanLine,
  PackageCheck,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Action {
  label: string;
  icon: LucideIcon;
  to: string;
}

const ACTIONS: Action[] = [
  { label: 'Add Inventory', icon: PackagePlus, to: '/items/new' },
  { label: 'New Job', icon: Hammer, to: '/jobs/new' },
  { label: 'Purchase Order', icon: FileText, to: '/purchase-orders/new' },
  { label: 'Customer', icon: UserPlus, to: '/settings?tab=customers' },
  { label: 'Supplier', icon: Truck, to: '/settings?tab=vendors' },
  
  { label: 'Receive Shipment', icon: PackageCheck, to: '/purchase-orders' },
];

export function QuickActionsWidget() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
      {ACTIONS.map((a) => (
        <button
          key={a.label}
          type="button"
          onClick={() => navigate(a.to)}
          className={cn(
            'flex flex-col items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-4',
            'text-center transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent'
          )}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <a.icon className="h-4 w-4 text-primary" />
          </span>
          <span className="text-xs font-medium leading-tight text-foreground">{a.label}</span>
        </button>
      ))}
    </div>
  );
}
