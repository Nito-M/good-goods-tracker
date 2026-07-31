import {
  CheckSquare,
  CalendarDays,
  Building2,
  Hammer,
  PackageSearch,
  Receipt,
  StickyNote,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type WidgetSize = 'sm' | 'md' | 'lg' | 'full';

export const WIDGET_SIZE_LABELS: Record<WidgetSize, string> = {
  sm: 'Small',
  md: 'Medium',
  lg: 'Large',
  full: 'Full width',
};

export const WIDGET_SIZE_CLASSES: Record<WidgetSize, string> = {
  sm: 'md:col-span-1 xl:col-span-1',
  md: 'md:col-span-2 xl:col-span-2',
  lg: 'md:col-span-2 xl:col-span-3',
  full: 'md:col-span-2 xl:col-span-4',
};

export type WidgetType =
  | 'tasks'
  | 'calendar'
  | 'business'
  | 'jobs'
  | 'inventory'
  | 'orders'
  | 'notes'
  | 'quickActions';

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  title?: string;
}

export interface WidgetDefinition {
  type: WidgetType;
  label: string;
  description: string;
  icon: LucideIcon;
  defaultSize: WidgetSize;
}

export const WIDGET_CATALOG: Record<WidgetType, WidgetDefinition> = {
  tasks: {
    type: 'tasks',
    label: 'My Tasks',
    description: 'Overdue, due today and completed to-dos',
    icon: CheckSquare,
    defaultSize: 'md',
  },
  calendar: {
    type: 'calendar',
    label: 'Calendar',
    description: "Today's schedule and upcoming deadlines",
    icon: CalendarDays,
    defaultSize: 'md',
  },
  business: {
    type: 'business',
    label: 'Business Profile',
    description: 'Switch between the businesses you manage',
    icon: Building2,
    defaultSize: 'sm',
  },
  jobs: {
    type: 'jobs',
    label: 'Active Jobs',
    description: 'In progress, waiting on parts, ready for delivery',
    icon: Hammer,
    defaultSize: 'md',
  },
  inventory: {
    type: 'inventory',
    label: 'Inventory Alerts',
    description: 'Low stock, out of stock and overstock items',
    icon: PackageSearch,
    defaultSize: 'md',
  },
  orders: {
    type: 'orders',
    label: 'Recent Orders',
    description: 'Latest invoices and sales activity',
    icon: Receipt,
    defaultSize: 'md',
  },
  notes: {
    type: 'notes',
    label: 'Notes',
    description: 'Your pinned and most recent notes',
    icon: StickyNote,
    defaultSize: 'md',
  },
  quickActions: {
    type: 'quickActions',
    label: 'Quick Actions',
    description: 'Jump straight into common workflows',
    icon: Zap,
    defaultSize: 'lg',
  },
};

export const DEFAULT_LAYOUT: WidgetInstance[] = [
  { id: 'w-quick', type: 'quickActions', size: 'full' },
  { id: 'w-tasks', type: 'tasks', size: 'md' },
  { id: 'w-calendar', type: 'calendar', size: 'md' },
  { id: 'w-business', type: 'business', size: 'sm' },
  { id: 'w-jobs', type: 'jobs', size: 'lg' },
  { id: 'w-inventory', type: 'inventory', size: 'md' },
  { id: 'w-orders', type: 'orders', size: 'md' },
  { id: 'w-notes', type: 'notes', size: 'md' },
];
