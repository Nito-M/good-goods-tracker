import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

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

export type WidgetCategory =
  | 'productivity'
  | 'inventory'
  | 'jobs'
  | 'sales'
  | 'finance'
  | 'business'
  | 'quickActions';

export interface WidgetCategoryMeta {
  key: WidgetCategory;
  label: string;
  description: string;
}

/**
 * Categories are open for extension: any future module (CRM, HR, AI, Maintenance…)
 * can call `registerWidgetCategory` before registering its widgets.
 */
export const BASE_WIDGET_CATEGORIES: WidgetCategoryMeta[] = [
  { key: 'productivity', label: 'Productivity', description: 'Tasks, calendar, notes and goals' },
  { key: 'inventory', label: 'Inventory', description: 'Stock levels, value and movement' },
  { key: 'jobs', label: 'Jobs', description: 'Production, delivery and job pipeline' },
  { key: 'sales', label: 'Sales', description: 'Orders, quotes and customers' },
  { key: 'finance', label: 'Finance', description: 'Cash flow, revenue and expenses' },
  { key: 'business', label: 'Business', description: 'Profiles, KPIs and team activity' },
  { key: 'quickActions', label: 'Quick Actions', description: 'One-tap shortcuts' },
];

export type SettingValue = string | number | boolean;
export type WidgetSettings = Record<string, SettingValue>;

export interface WidgetSettingOption {
  value: string;
  label: string;
}

export interface WidgetSettingField {
  key: string;
  label: string;
  type: 'number' | 'text' | 'select' | 'switch';
  help?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: WidgetSettingOption[];
  /** Dynamic option source resolved by the settings dialog. */
  optionsSource?: 'companies' | 'categories';
  default: SettingValue;
}

export interface WidgetProps {
  instanceId: string;
  settings: WidgetSettings;
}

export interface WidgetDefinition {
  type: string;
  label: string;
  description: string;
  icon: LucideIcon;
  category: WidgetCategory | string;
  defaultSize: WidgetSize;
  settings?: WidgetSettingField[];
  component: ComponentType<WidgetProps>;
}

export interface WidgetInstance {
  id: string;
  type: string;
  size: WidgetSize;
  title?: string;
  settings?: WidgetSettings;
}

export interface DashboardConfig {
  id: string;
  name: string;
  widgets: WidgetInstance[];
}

export type RoleKey = 'owner' | 'purchaser' | 'warehouse' | 'production' | 'sales' | 'accounting';

export const ROLE_LABELS: Record<RoleKey, string> = {
  owner: 'Owner',
  purchaser: 'Purchaser',
  warehouse: 'Warehouse Staff',
  production: 'Production',
  sales: 'Sales',
  accounting: 'Accounting',
};

/* ---------------- reusable setting field factories ---------------- */

export const refreshField = (def = '0'): WidgetSettingField => ({
  key: 'refreshInterval',
  label: 'Refresh interval',
  type: 'select',
  default: def,
  options: [
    { value: '0', label: 'Manual only' },
    { value: '30', label: 'Every 30 seconds' },
    { value: '60', label: 'Every minute' },
    { value: '300', label: 'Every 5 minutes' },
    { value: '900', label: 'Every 15 minutes' },
  ],
});

export const limitField = (def = 6): WidgetSettingField => ({
  key: 'limit',
  label: 'Rows to show',
  type: 'number',
  min: 1,
  max: 50,
  step: 1,
  default: def,
});

export const dateRangeField = (def = '30'): WidgetSettingField => ({
  key: 'dateRange',
  label: 'Date range',
  type: 'select',
  default: def,
  options: [
    { value: '0', label: 'Today' },
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: '365', label: 'Last 12 months' },
    { value: 'all', label: 'All time' },
  ],
});

export const thresholdField = (label = 'Low stock threshold', def = 0): WidgetSettingField => ({
  key: 'threshold',
  label,
  type: 'number',
  min: 0,
  step: 1,
  default: def,
  help: 'Items at or below this quantity are flagged. 0 uses each item’s own minimum.',
});

export const companyField = (): WidgetSettingField => ({
  key: 'companyId',
  label: 'Business profile',
  type: 'select',
  default: 'all',
  optionsSource: 'companies',
});

export const warehouseField = (): WidgetSettingField => ({
  key: 'warehouseId',
  label: 'Stock location',
  type: 'select',
  default: 'all',
  optionsSource: 'warehouses',
  help: 'Use quantities from a single location instead of total stock.',
});

export const onlyFlaggedField = (): WidgetSettingField => ({
  key: 'onlyWithMin',
  label: 'Only items with a minimum set',
  type: 'switch',
  default: false,
  help: 'Show low stock only for items that have their own minimum quantity set.',
});


export const showStatsField = (def = true): WidgetSettingField => ({
  key: 'showStats',
  label: 'Show summary tiles',
  type: 'switch',
  default: def,
});

export const showLinkField = (def = true): WidgetSettingField => ({
  key: 'showLink',
  label: 'Show “view all” link',
  type: 'switch',
  default: def,
});

/* ---------------- setting value readers ---------------- */

export function resolveSettings(
  def: WidgetDefinition | undefined,
  settings: WidgetSettings | undefined
): WidgetSettings {
  const out: WidgetSettings = {};
  for (const f of def?.settings ?? []) out[f.key] = f.default;
  return { ...out, ...(settings ?? {}) };
}

export function numSetting(s: WidgetSettings, key: string, fallback: number): number {
  const v = Number(s[key]);
  return Number.isFinite(v) ? v : fallback;
}

export function boolSetting(s: WidgetSettings, key: string, fallback = true): boolean {
  const v = s[key];
  if (typeof v === 'boolean') return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return fallback;
}

export function strSetting(s: WidgetSettings, key: string, fallback = ''): string {
  const v = s[key];
  return v === undefined || v === null ? fallback : String(v);
}
