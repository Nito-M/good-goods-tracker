import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConnectBoardRowMirror {
  row_id: string;
  primary_value: string;
  mirror_value: string;
}

interface CacheEntry {
  rows: ConnectBoardRowMirror[];
  loading: boolean;
}

const cache = new Map<string, CacheEntry>();
const subscribers = new Map<string, Set<(e: CacheEntry) => void>>();

function cacheKey(boardId: string, mirrorColId: string | null) {
  return `${boardId}::${mirrorColId || ''}`;
}

function notify(key: string) {
  const e = cache.get(key);
  if (!e) return;
  subscribers.get(key)?.forEach((s) => s(e));
}

async function loadBoardData(boardId: string, mirrorColId: string | null) {
  const key = cacheKey(boardId, mirrorColId);
  cache.set(key, { rows: [], loading: true });
  notify(key);

  const [colRes, rowRes] = await Promise.all([
    supabase.from('board_columns').select('id, position').eq('board_id', boardId).order('position'),
    supabase.from('board_rows').select('id, position').eq('board_id', boardId).order('position'),
  ]);

  const cols = colRes.data || [];
  const rows = rowRes.data || [];
  const primaryColId = cols[0]?.id;

  const rowIds = rows.map((r) => r.id);
  const neededColIds = [primaryColId, mirrorColId].filter((x): x is string => !!x);

  let cellMap: Record<string, Record<string, string>> = {};
  if (rowIds.length && neededColIds.length) {
    const { data: cellData } = await supabase
      .from('board_cells')
      .select('row_id, column_id, value')
      .in('row_id', rowIds)
      .in('column_id', neededColIds);
    (cellData || []).forEach((c) => {
      if (!cellMap[c.row_id]) cellMap[c.row_id] = {};
      cellMap[c.row_id][c.column_id] = c.value;
    });
  }

  // Also fetch mirror column meta to handle status options
  let mirrorOptions: any[] = [];
  if (mirrorColId) {
    const { data } = await supabase
      .from('board_columns')
      .select('options, type')
      .eq('id', mirrorColId)
      .maybeSingle();
    if (data && Array.isArray(data.options)) mirrorOptions = data.options as any[];
  }

  const result: ConnectBoardRowMirror[] = rows.map((r) => {
    const primary = primaryColId ? cellMap[r.id]?.[primaryColId] || '' : '';
    let mirrorRaw = mirrorColId ? cellMap[r.id]?.[mirrorColId] || '' : '';
    // Translate status option ids to labels
    if (mirrorRaw && mirrorOptions.length) {
      const opt = mirrorOptions.find((o: any) => o.id === mirrorRaw);
      if (opt) mirrorRaw = opt.label;
    }
    return { row_id: r.id, primary_value: primary, mirror_value: mirrorRaw };
  });

  cache.set(key, { rows: result, loading: false });
  notify(key);
}

export function useBoardConnectData(boardId: string | null, mirrorColId: string | null) {
  const [state, setState] = useState<CacheEntry>(() => {
    if (!boardId) return { rows: [], loading: false };
    return cache.get(cacheKey(boardId, mirrorColId)) || { rows: [], loading: true };
  });

  useEffect(() => {
    if (!boardId) {
      setState({ rows: [], loading: false });
      return;
    }
    const key = cacheKey(boardId, mirrorColId);
    const subSet = subscribers.get(key) || new Set();
    const handler = (e: CacheEntry) => setState(e);
    subSet.add(handler);
    subscribers.set(key, subSet);

    const existing = cache.get(key);
    if (existing) setState(existing);
    else loadBoardData(boardId, mirrorColId);

    return () => {
      subSet.delete(handler);
    };
  }, [boardId, mirrorColId]);

  const refresh = () => {
    if (boardId) loadBoardData(boardId, mirrorColId);
  };

  return { ...state, refresh };
}

export function invalidateConnectCache() {
  cache.clear();
  subscribers.forEach((subs, key) => {
    subs.forEach((s) => s({ rows: [], loading: true }));
  });
}
