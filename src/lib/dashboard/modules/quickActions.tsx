import { useNavigate } from 'react-router-dom';
import {
  FileText,
  PackageCheck,
  PackagePlus,
  
  Truck,
  UserPlus,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { registerWidgets } from '../registry';
import { WidgetDefinition, WidgetProps, boolSetting } from '../types';
import { cn } from '@/lib/utils';

interface ActionSpec {
  type: string;
  label: string;
  icon: LucideIcon;
  to: string;
  description: string;
}

const ACTIONS: ActionSpec[] = [
  {
    type: 'qaAddInventory',
    label: 'Add Inventory',
    icon: PackagePlus,
    to: '/items/new',
    description: 'Create a new inventory item',
  },
  {
    type: 'qaCreatePurchaseOrder',
    label: 'Create Purchase Order',
    icon: FileText,
    to: '/purchase-orders/new',
    description: 'Start a new purchase order',
  },
  {
    type: 'qaNewCustomer',
    label: 'New Customer',
    icon: UserPlus,
    to: '/settings?tab=customers',
    description: 'Add a customer record',
  },
  {
    type: 'qaNewSupplier',
    label: 'New Supplier',
    icon: Truck,
    to: '/settings?tab=vendors',
    description: 'Add a supplier / vendor',
  },
  {

    type: 'qaReceiveShipment',
    label: 'Receive Shipment',
    icon: PackageCheck,
    to: '/purchase-orders',
    description: 'Receive stock against a PO',
  },
];

function Tile({ action, onClick }: { action: ActionSpec; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-4',
        'text-center transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-accent'
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
        <action.icon className="h-4 w-4 text-primary" />
      </span>
      <span className="text-xs font-medium leading-tight text-foreground">{action.label}</span>
    </button>
  );
}

function QuickActionsW({ settings }: WidgetProps) {
  const navigate = useNavigate();
  const visible = ACTIONS.filter((a) => boolSetting(settings, a.type, true));
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {visible.map((a) => (
        <Tile key={a.type} action={a} onClick={() => navigate(a.to)} />
      ))}
    </div>
  );
}

const singleActionWidgets: WidgetDefinition[] = ACTIONS.map((action) => ({
  type: action.type,
  label: action.label,
  description: action.description,
  icon: action.icon,
  category: 'quickActions',
  defaultSize: 'sm',
  component: function SingleAction() {
    const navigate = useNavigate();
    return (
      <div className="grid grid-cols-1">
        <Tile action={action} onClick={() => navigate(action.to)} />
      </div>
    );
  },
}));

registerWidgets([
  {
    type: 'quickActions',
    label: 'Quick Actions',
    description: 'A configurable strip of one-tap shortcuts',
    icon: Zap,
    category: 'quickActions',
    defaultSize: 'full',
    component: QuickActionsW,
    settings: ACTIONS.map((a) => ({
      key: a.type,
      label: `Show “${a.label}”`,
      type: 'switch' as const,
      default: true,
    })),
  },
  ...singleActionWidgets,
]);
