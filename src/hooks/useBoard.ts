import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { StatusOption } from '@/components/board/StatusOptionsDialog';
import type { BoardColumnType } from '@/components/board/AddColumnPopover';

export interface BoardColumn {
  id: string;
  board_id: string;
  name: string;
  position: number;
  type: BoardColumnType;
  options: StatusOption[];
  width: number;
  notes: string;
}

export interface BoardRow {
  id: string;
  board_id: string;
  position: number;
}

export interface BoardCell {
  id: string;
  row_id: string;
  column_id: string;
  value: string;
}

export interface BoardDetail {
  id: string;
  name: string;
  user_id: string;
  group_by_column_id: string | null;
}

function normalizeColumn(raw: any): BoardColumn {
  return {
    id: raw.id,
    board_id: raw.board_id,
    name: raw.name,
    position: raw.position,
    type: (raw.type as BoardColumnType) || 'text',
    options: Array.isArray(raw.options) ? (raw.options as StatusOption[]) : [],
  };
}

export function useBoard(boardId: string | undefined) {
  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [cells, setCells] = useState<BoardCell[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);

    const [boardRes, colRes, rowRes] = await Promise.all([
      supabase.from('boards').select('id, name, user_id, group_by_column_id').eq('id', boardId).maybeSingle(),
      supabase.from('board_columns').select('*').eq('board_id', boardId).order('position'),
      supabase.from('board_rows').select('*').eq('board_id', boardId).order('position'),
    ]);

    if (boardRes.error) {
      toast.error('Failed to load board');
      setLoading(false);
      return;
    }
    setBoard(boardRes.data);
    setColumns((colRes.data || []).map(normalizeColumn));
    setRows(rowRes.data || []);

    const rowIds = (rowRes.data || []).map((r) => r.id);
    if (rowIds.length > 0) {
      const { data: cellData } = await supabase
        .from('board_cells')
        .select('*')
        .in('row_id', rowIds);
      setCells(cellData || []);
    } else {
      setCells([]);
    }

    setLoading(false);
  }, [boardId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Board mutations
  const renameBoard = async (name: string) => {
    if (!boardId) return;
    setBoard((b) => (b ? { ...b, name } : b));
    const { error } = await supabase.from('boards').update({ name }).eq('id', boardId);
    if (error) toast.error('Failed to rename');
  };

  const setGroupBy = async (column_id: string | null) => {
    if (!boardId) return;
    setBoard((b) => (b ? { ...b, group_by_column_id: column_id } : b));
    await supabase.from('boards').update({ group_by_column_id: column_id }).eq('id', boardId);
  };

  // Column mutations
  const addColumn = async (name: string = 'New Column', type: BoardColumnType = 'text') => {
    if (!boardId) return;
    const position = columns.length;
    const { data, error } = await supabase
      .from('board_columns')
      .insert({ board_id: boardId, name, position, type, options: [] })
      .select()
      .single();
    if (error || !data) {
      toast.error('Failed to add column');
      return;
    }
    setColumns((c) => [...c, normalizeColumn(data)]);
  };

  const renameColumn = async (id: string, name: string) => {
    setColumns((cs) => cs.map((c) => (c.id === id ? { ...c, name } : c)));
    const { error } = await supabase.from('board_columns').update({ name }).eq('id', id);
    if (error) toast.error('Failed to rename column');
  };

  const setColumnType = async (id: string, type: BoardColumnType) => {
    setColumns((cs) => cs.map((c) => (c.id === id ? { ...c, type } : c)));
    const { error } = await supabase.from('board_columns').update({ type }).eq('id', id);
    if (error) {
      toast.error('Failed to change type');
      await fetchAll();
    }
  };

  const setColumnOptions = async (id: string, options: StatusOption[]) => {
    setColumns((cs) => cs.map((c) => (c.id === id ? { ...c, options } : c)));
    const { error } = await supabase
      .from('board_columns')
      .update({ options: options as any })
      .eq('id', id);
    if (error) {
      toast.error('Failed to save options');
      await fetchAll();
    }
  };

  const deleteColumn = async (id: string) => {
    setColumns((cs) => cs.filter((c) => c.id !== id));
    setCells((cs) => cs.filter((c) => c.column_id !== id));
    const { error } = await supabase.from('board_columns').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete column');
      await fetchAll();
    }
    if (board?.group_by_column_id === id) {
      await setGroupBy(null);
    }
  };

  // Row mutations
  const addRow = async (): Promise<string | null> => {
    if (!boardId) return null;
    const position = rows.length;
    const { data, error } = await supabase
      .from('board_rows')
      .insert({ board_id: boardId, position })
      .select()
      .single();
    if (error || !data) {
      toast.error('Failed to add row');
      return null;
    }
    setRows((r) => [...r, data]);
    return data.id;
  };

  const deleteRow = async (id: string) => {
    setRows((r) => r.filter((x) => x.id !== id));
    setCells((c) => c.filter((x) => x.row_id !== id));
    const { error } = await supabase.from('board_rows').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete row');
      await fetchAll();
    }
  };

  // Cell upsert
  const setCellValue = async (row_id: string, column_id: string, value: string) => {
    const existing = cells.find((c) => c.row_id === row_id && c.column_id === column_id);

    if (existing) {
      if (existing.value === value) return;
      setCells((cs) => cs.map((c) => (c.id === existing.id ? { ...c, value } : c)));
      const { error } = await supabase.from('board_cells').update({ value }).eq('id', existing.id);
      if (error) toast.error('Failed to save cell');
    } else {
      const { data, error } = await supabase
        .from('board_cells')
        .insert({ row_id, column_id, value })
        .select()
        .single();
      if (error || !data) {
        toast.error('Failed to save cell');
        return;
      }
      setCells((cs) => [...cs, data]);
    }
  };

  const getCellValue = (row_id: string, column_id: string): string => {
    return cells.find((c) => c.row_id === row_id && c.column_id === column_id)?.value || '';
  };

  return {
    board,
    columns,
    rows,
    cells,
    loading,
    renameBoard,
    setGroupBy,
    addColumn,
    renameColumn,
    setColumnType,
    setColumnOptions,
    deleteColumn,
    addRow,
    deleteRow,
    setCellValue,
    getCellValue,
    refetch: fetchAll,
  };
}
