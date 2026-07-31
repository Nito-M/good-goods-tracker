import { DashboardConfig, RoleKey, WidgetInstance, WidgetSize } from './types';
import { getWidgetDefinition } from './registry';

function w(type: string, size?: WidgetSize): WidgetInstance {
  const def = getWidgetDefinition(type);
  return {
    id: `w-${type}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    size: size || def?.defaultSize || 'md',
  };
}

function dash(id: string, name: string, types: (string | [string, WidgetSize])[]): DashboardConfig {
  return {
    id: `${id}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    widgets: types
      .map((t) => (Array.isArray(t) ? w(t[0], t[1]) : w(t)))
      .filter((x) => !!getWidgetDefinition(x.type)),
  };
}

export function homeDashboard(): DashboardConfig {
  return dash('home', 'Home', [
    ['quickActions', 'full'],
    'tasks',
    'calendar',
    ['jobs', 'lg'],
    'business',
    'inventory',
    'orders',
    'notes',
  ]);
}

export function warehouseDashboard(): DashboardConfig {
  return dash('warehouse', 'Warehouse', [
    ['quickActions', 'full'],
    ['inventorySummary', 'lg'],
    'inventory',
    'incomingShipments',
    'recentlyAddedItems',
    'mostUsedItems',
    'purchaseRequests',
  ]);
}

export function purchasingDashboard(): DashboardConfig {
  return dash('purchasing', 'Purchasing', [
    ['quickActions', 'full'],
    'purchaseRequests',
    'incomingShipments',
    'billsDue',
    'expenses',
    'inventory',
    'inventoryValue',
  ]);
}

export function salesDashboard(): DashboardConfig {
  return dash('sales', 'Sales', [
    'salesToday',
    'orders',
    'quotes',
    'outstandingInvoices',
    'customers',
    'revenue',
  ]);
}

export function manufacturingDashboard(): DashboardConfig {
  return dash('manufacturing', 'Manufacturing', [
    ['jobs', 'lg'],
    'productionQueue',
    'waitingForParts',
    'deliverySchedule',
    'jobQuotes',
    'completedJobs',
  ]);
}

export function reportsDashboard(): DashboardConfig {
  return dash('reports', 'Reports', [
    ['companyKpis', 'lg'],
    'revenue',
    'profit',
    'cashFlow',
    'expenses',
    'inventoryValue',
    'employeeActivity',
  ]);
}

export const DASHBOARD_TEMPLATES: { key: string; label: string; build: () => DashboardConfig }[] = [
  { key: 'home', label: 'Home', build: homeDashboard },
  { key: 'warehouse', label: 'Warehouse', build: warehouseDashboard },
  { key: 'purchasing', label: 'Purchasing', build: purchasingDashboard },
  { key: 'sales', label: 'Sales', build: salesDashboard },
  { key: 'manufacturing', label: 'Manufacturing', build: manufacturingDashboard },
  { key: 'reports', label: 'Reports', build: reportsDashboard },
  { key: 'blank', label: 'Blank dashboard', build: () => dash('custom', 'New dashboard', []) },
];

/** Role-based default dashboard sets. */
export const ROLE_DEFAULTS: Record<RoleKey, () => DashboardConfig[]> = {
  owner: () => [homeDashboard(), reportsDashboard(), salesDashboard(), manufacturingDashboard()],
  purchaser: () => [purchasingDashboard(), warehouseDashboard(), homeDashboard()],
  warehouse: () => [warehouseDashboard(), homeDashboard()],
  production: () => [manufacturingDashboard(), warehouseDashboard(), homeDashboard()],
  sales: () => [salesDashboard(), homeDashboard()],
  accounting: () => [reportsDashboard(), purchasingDashboard(), homeDashboard()],
};
