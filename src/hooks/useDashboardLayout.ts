import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_LAYOUT,
  WIDGET_CATALOG,
  WidgetInstance,
  WidgetSize,
  WidgetType,
} from '@/types/dashboard';

const STORAGE_KEY = 'dashboard.layout.v1';

function load(): WidgetInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_LAYOUT;
    return parsed.filter((w: WidgetInstance) => w && WIDGET_CATALOG[w.type]);
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function useDashboardLayout() {
  const [widgets, setWidgets] = useState<WidgetInstance[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch {
      /* ignore */
    }
  }, [widgets]);

  const addWidget = useCallback((type: WidgetType) => {
    setWidgets((prev) => [
      ...prev,
      {
        id: `w-${type}-${Date.now().toString(36)}`,
        type,
        size: WIDGET_CATALOG[type].defaultSize,
      },
    ]);
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const setSize = useCallback((id: string, size: WidgetSize) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, size } : w)));
  }, []);

  const setTitle = useCallback((id: string, title: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, title: title.trim() || undefined } : w))
    );
  }, []);

  const moveWidget = useCallback((fromId: string, toId: string) => {
    setWidgets((prev) => {
      const from = prev.findIndex((w) => w.id === fromId);
      const to = prev.findIndex((w) => w.id === toId);
      if (from === -1 || to === -1 || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const resetLayout = useCallback(() => setWidgets(DEFAULT_LAYOUT), []);

  return { widgets, addWidget, removeWidget, setSize, setTitle, moveWidget, resetLayout };
}
