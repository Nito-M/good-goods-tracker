import {
  BASE_WIDGET_CATEGORIES,
  WidgetCategoryMeta,
  WidgetDefinition,
} from './types';

const widgets = new Map<string, WidgetDefinition>();
const categories: WidgetCategoryMeta[] = [...BASE_WIDGET_CATEGORIES];

/** Modules can add their own category (e.g. CRM, HR, Maintenance). */
export function registerWidgetCategory(meta: WidgetCategoryMeta) {
  if (!categories.some((c) => c.key === meta.key)) categories.push(meta);
}

export function registerWidget(def: WidgetDefinition) {
  widgets.set(def.type, def);
}

export function registerWidgets(defs: WidgetDefinition[]) {
  defs.forEach(registerWidget);
}

export function getWidgetDefinition(type: string): WidgetDefinition | undefined {
  return widgets.get(type);
}

export function listWidgetDefinitions(): WidgetDefinition[] {
  return Array.from(widgets.values());
}

export function listWidgetCategories(): WidgetCategoryMeta[] {
  return categories.filter((c) => listWidgetDefinitions().some((w) => w.category === c.key));
}

export function widgetsByCategory(): { category: WidgetCategoryMeta; items: WidgetDefinition[] }[] {
  return listWidgetCategories().map((category) => ({
    category,
    items: listWidgetDefinitions().filter((w) => w.category === category.key),
  }));
}
