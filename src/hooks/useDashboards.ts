import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DashboardConfig,
  RoleKey,
  WidgetInstance,
  WidgetSettings,
  WidgetSize,
} from '@/lib/dashboard/types';
import { getWidgetDefinition } from '@/lib/dashboard/registry';
import { ROLE_DEFAULTS, homeDashboard } from '@/lib/dashboard/presets';
import '@/lib/dashboard/modules';

const STORAGE_KEY = 'dashboard.dashboards.v2';
const ACTIVE_KEY = 'dashboard.activeDashboard.v2';
const LEGACY_KEY = 'dashboard.layout.v1';

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function sanitize(list: unknown): DashboardConfig[] | null {
  if (!Array.isArray(list) || list.length === 0) return null;
  const out: DashboardConfig[] = [];
  for (const d of list) {
    if (!d || typeof d !== 'object') continue;
    const cfg = d as DashboardConfig;
    if (!cfg.id || !cfg.name || !Array.isArray(cfg.widgets)) continue;
    out.push({
      ...cfg,
      widgets: cfg.widgets.filter((w) => w && getWidgetDefinition(w.type)),
    });
  }
  return out.length ? out : null;
}

function load(): DashboardConfig[] {
  try {
    const stored = sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
    if (stored) return stored;

    // migrate the single v1 layout into a "Home" dashboard
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
    if (Array.isArray(legacy) && legacy.length) {
      const widgets = (legacy as WidgetInstance[]).filter((w) => w && getWidgetDefinition(w.type));
      if (widgets.length) return [{ id: uid('dash'), name: 'Home', widgets }];
    }
  } catch {
    /* ignore */
  }
  return [homeDashboard()];
}

export function useDashboards() {
  const [dashboards, setDashboards] = useState<DashboardConfig[]>(load);
  const [activeId, setActiveIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(ACTIVE_KEY) || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
    } catch {
      /* ignore */
    }
  }, [dashboards]);

  const active = useMemo(
    () => dashboards.find((d) => d.id === activeId) || dashboards[0],
    [dashboards, activeId]
  );

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id);
    try {
      localStorage.setItem(ACTIVE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (active && active.id !== activeId) setActiveId(active.id);
  }, [active, activeId, setActiveId]);

  const patchActive = useCallback(
    (fn: (d: DashboardConfig) => DashboardConfig) => {
      setDashboards((prev) => prev.map((d) => (d.id === (active?.id ?? '') ? fn(d) : d)));
    },
    [active?.id]
  );

  const patchWidgets = useCallback(
    (fn: (w: WidgetInstance[]) => WidgetInstance[]) =>
      patchActive((d) => ({ ...d, widgets: fn(d.widgets) })),
    [patchActive]
  );

  /* ---- dashboard level ---- */

  const createDashboard = useCallback(
    (name: string, base?: DashboardConfig) => {
      const cfg: DashboardConfig = {
        id: uid('dash'),
        name: name.trim() || 'New dashboard',
        widgets: base ? base.widgets.map((w) => ({ ...w, id: uid('w') })) : [],
      };
      setDashboards((prev) => [...prev, cfg]);
      setActiveId(cfg.id);
      return cfg.id;
    },
    [setActiveId]
  );

  const renameDashboard = useCallback((id: string, name: string) => {
    setDashboards((prev) =>
      prev.map((d) => (d.id === id ? { ...d, name: name.trim() || d.name } : d))
    );
  }, []);

  const deleteDashboard = useCallback((id: string) => {
    setDashboards((prev) => {
      const next = prev.filter((d) => d.id !== id);
      return next.length ? next : [homeDashboard()];
    });
  }, []);

  const duplicateDashboard = useCallback(
    (id: string) => {
      const src = dashboards.find((d) => d.id === id);
      if (src) createDashboard(`${src.name} copy`, src);
    },
    [dashboards, createDashboard]
  );

  const applyRoleDefaults = useCallback(
    (role: RoleKey) => {
      const set = ROLE_DEFAULTS[role]();
      setDashboards(set);
      setActiveId(set[0].id);
    },
    [setActiveId]
  );

  /* ---- widget level (active dashboard) ---- */

  const addWidget = useCallback(
    (type: string) => {
      const def = getWidgetDefinition(type);
      if (!def) return;
      patchWidgets((prev) => [...prev, { id: uid('w'), type, size: def.defaultSize }]);
    },
    [patchWidgets]
  );

  const removeWidget = useCallback(
    (id: string) => patchWidgets((prev) => prev.filter((w) => w.id !== id)),
    [patchWidgets]
  );

  const setSize = useCallback(
    (id: string, size: WidgetSize) =>
      patchWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, size } : w))),
    [patchWidgets]
  );

  const setTitle = useCallback(
    (id: string, title: string) =>
      patchWidgets((prev) =>
        prev.map((w) => (w.id === id ? { ...w, title: title.trim() || undefined } : w))
      ),
    [patchWidgets]
  );

  const setSettings = useCallback(
    (id: string, settings: WidgetSettings) =>
      patchWidgets((prev) =>
        prev.map((w) => (w.id === id ? { ...w, settings: { ...(w.settings || {}), ...settings } } : w))
      ),
    [patchWidgets]
  );

  const moveWidget = useCallback(
    (fromId: string, toId: string) =>
      patchWidgets((prev) => {
        const from = prev.findIndex((w) => w.id === fromId);
        const to = prev.findIndex((w) => w.id === toId);
        if (from === -1 || to === -1 || from === to) return prev;
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      }),
    [patchWidgets]
  );

  const resetDashboard = useCallback(
    () => patchActive((d) => ({ ...d, widgets: homeDashboard().widgets })),
    [patchActive]
  );

  const clearDashboard = useCallback(() => patchWidgets(() => []), [patchWidgets]);

  return {
    dashboards,
    active,
    activeId: active?.id ?? '',
    setActiveId,
    createDashboard,
    renameDashboard,
    deleteDashboard,
    duplicateDashboard,
    applyRoleDefaults,
    widgets: active?.widgets ?? [],
    addWidget,
    removeWidget,
    setSize,
    setTitle,
    setSettings,
    moveWidget,
    resetDashboard,
    clearDashboard,
  };
}
