import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ActivityAction = 'insert' | 'update' | 'delete';

export interface ActivityLog {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  table_name: string;
  record_id: string | null;
  record_label: string | null;
  action: ActivityAction;
  changed_fields: Record<string, [unknown, unknown]> | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
  user_name?: string;
}

export interface ActivityFilters {
  action?: ActivityAction | 'all';
  tableName?: string | 'all';
  userId?: string | 'all';
  from?: string;
  to?: string;
  search?: string;
}

const PAGE_SIZE = 50;

export const TABLE_LABELS: Record<string, string> = {
  inventory_items: 'Item / Inventory',
  item_vendor_prices: 'Item Vendor',
  item_location_quantities: 'Stock Location',
  vendors: 'Vendor',
  customers: 'Customer',
  workers: 'Worker',
  purchase_orders: 'Purchase Order',
  requests: 'Request',
  quotes: 'Quote / Sales Order',
  quote_items: 'Quote / SO Item',
  sales: 'Invoice',
  sale_items: 'Invoice Item',
  jobs: 'Job',
  job_items: 'Job Item',
  assemblies: 'Assembly',
  assembly_items: 'Assembly Item',
  parts_assemblies: 'Sub Assembly',
  parts_assembly_items: 'Sub Assembly Item',
  parts: 'Part',
  sops: 'SOP',
  sop_steps: 'SOP Step',
  sop_bom_items: 'SOP BOM Item',
  bank_cards: 'Bank Card',
  bank_transactions: 'Bank Transaction',
};

export function tableLabel(name: string) {
  return TABLE_LABELS[name] || name;
}

export function useActivityLogs(filters: ActivityFilters) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  const fetchPage = useCallback(
    async (pageIndex: number) => {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE - 1);

      if (filters.action && filters.action !== 'all') query = query.eq('action', filters.action);
      if (filters.tableName && filters.tableName !== 'all') query = query.eq('table_name', filters.tableName);
      if (filters.userId && filters.userId !== 'all') query = query.eq('user_id', filters.userId);
      if (filters.from) query = query.gte('created_at', new Date(`${filters.from}T00:00:00`).toISOString());
      if (filters.to) query = query.lte('created_at', new Date(`${filters.to}T23:59:59`).toISOString());
      if (filters.search?.trim()) query = query.ilike('record_label', `%${filters.search.trim()}%`);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as unknown as ActivityLog[];

      const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean))) as string[];
      let nameMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, email')
          .in('user_id', userIds);
        nameMap = Object.fromEntries(
          (profiles || []).map((p: any) => [p.user_id, p.display_name || p.email || 'Unknown user'])
        );
      }

      return {
        rows: rows.map(r => ({ ...r, user_name: r.user_id ? nameMap[r.user_id] || 'Unknown user' : 'System' })),
        hasMore: rows.length === PAGE_SIZE,
      };
    },
    [filters.action, filters.tableName, filters.userId, filters.from, filters.to, filters.search]
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setPage(0);
    (async () => {
      try {
        const { rows, hasMore: more } = await fetchPage(0);
        if (cancelled) return;
        setLogs(rows);
        setHasMore(more);
      } catch {
        if (!cancelled) {
          setLogs([]);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const { rows, hasMore: more } = await fetchPage(next);
      setLogs(prev => [...prev, ...rows]);
      setHasMore(more);
      setPage(next);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loadingMore, page]);

  return { logs, loading, loadingMore, hasMore, loadMore };
}

export function useActivityLogUsers() {
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('user_id')
        .not('user_id', 'is', null)
        .limit(1000);
      const ids = Array.from(new Set((data || []).map((d: any) => d.user_id))) as string[];
      if (!ids.length) return;
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', ids);
      if (cancelled) return;
      setUsers(
        (profiles || []).map((p: any) => ({
          id: p.user_id,
          name: p.display_name || p.email || 'Unknown user',
        }))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return users;
}
