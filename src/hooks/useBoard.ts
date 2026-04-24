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
  connect_board_id: string | null;
  connect_mirror_column_id: string | null;
  per_row_options: boolean;
  text_align: 'left' | 'center' | 'right';
  header_bg_color: string | null;
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
  text_align: 'left' | 'center' | 'right' | null;
  bg_color: string | null;
}

export interface BoardDetail {
  id: string;
  name: string;
  user_id: string;
  company_id: string | null;
  group_by_column_id: string | null;
}

function normalizeColumn(raw: any): BoardColumn {
  const rawOptions = Array.isArray(raw.options) ? raw.options : [];
  // Connect-type columns store a single config object inside options[0]
  let connect_board_id: string | null = null;
  let connect_mirror_column_id: string | null = null;
  if (raw.type === 'connect' && rawOptions.length > 0 && typeof rawOptions[0] === 'object') {
    connect_board_id = rawOptions[0].connect_board_id ?? null;
    connect_mirror_column_id = rawOptions[0].connect_mirror_column_id ?? null;
  }
  return {
    id: raw.id,
    board_id: raw.board_id,
    name: raw.name,
    position: raw.position,
    type: (raw.type as BoardColumnType) || 'text',
    options: raw.type === 'connect' ? [] : (rawOptions as StatusOption[]),
    width: typeof raw.width === 'number' && raw.width > 0 ? raw.width : 200,
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    connect_board_id,
    connect_mirror_column_id,
    per_row_options: !!raw.per_row_options,
    text_align: (raw.text_align === 'center' || raw.text_align === 'right') ? raw.text_align : 'left',
    header_bg_color: typeof raw.header_bg_color === 'string' && raw.header_bg_color.length > 0 ? raw.header_bg_color : null,
  };
}

function normalizeCell(raw: any): BoardCell {
  const ta = raw.text_align;
  return {
    id: raw.id,
    row_id: raw.row_id,
    column_id: raw.column_id,
    value: raw.value ?? '',
    text_align: ta === 'left' || ta === 'center' || ta === 'right' ? ta : null,
    bg_color: typeof raw.bg_color === 'string' && raw.bg_color.length > 0 ? raw.bg_color : null,
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
      supabase.from('boards').select('id, name, user_id, company_id, group_by_column_id').eq('id', boardId).maybeSingle(),
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
      setCells((cellData || []).map(normalizeCell));
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

  const setColumnConnectConfig = async (
    id: string,
    config: { connect_board_id: string | null; connect_mirror_column_id: string | null }
  ) => {
    setColumns((cs) =>
      cs.map((c) =>
        c.id === id
          ? {
              ...c,
              connect_board_id: config.connect_board_id,
              connect_mirror_column_id: config.connect_mirror_column_id,
            }
          : c
      )
    );
    const { error } = await supabase
      .from('board_columns')
      .update({ options: [config] as any })
      .eq('id', id);
    if (error) {
      toast.error('Failed to save connection');
      await fetchAll();
    }
  };

  const setColumnWidth = async (id: string, width: number) => {
    const w = Math.max(80, Math.min(900, Math.round(width)));
    setColumns((cs) => cs.map((c) => (c.id === id ? { ...c, width: w } : c)));
    const { error } = await supabase.from('board_columns').update({ width: w }).eq('id', id);
    if (error) toast.error('Failed to save width');
  };

  const setColumnNotes = async (id: string, notes: string) => {
    setColumns((cs) => cs.map((c) => (c.id === id ? { ...c, notes } : c)));
    const { error } = await supabase.from('board_columns').update({ notes }).eq('id', id);
    if (error) {
      toast.error('Failed to save notes');
      await fetchAll();
    }
  };

  const setColumnTextAlign = async (id: string, text_align: 'left' | 'center' | 'right') => {
    setColumns((cs) => cs.map((c) => (c.id === id ? { ...c, text_align } : c)));
    const { error } = await supabase
      .from('board_columns')
      .update({ text_align } as any)
      .eq('id', id);
    if (error) {
      toast.error('Failed to update alignment');
      await fetchAll();
    }
  };

  const setColumnPerRowOptions = async (id: string, per_row_options: boolean) => {
    setColumns((cs) => cs.map((c) => (c.id === id ? { ...c, per_row_options } : c)));
    const { error } = await supabase
      .from('board_columns')
      .update({ per_row_options } as any)
      .eq('id', id);
    if (error) {
      toast.error('Failed to update column');
      await fetchAll();
    }
  };

  const setColumnHeaderBgColor = async (id: string, header_bg_color: string | null) => {
    setColumns((cs) => cs.map((c) => (c.id === id ? { ...c, header_bg_color } : c)));
    const { error } = await supabase
      .from('board_columns')
      .update({ header_bg_color } as any)
      .eq('id', id);
    if (error) {
      toast.error('Failed to color header');
      await fetchAll();
    }
  };

  const reorderColumns = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const current = [...columns].sort((a, b) => a.position - b.position);
    const fromIdx = current.findIndex((c) => c.id === sourceId);
    const toIdx = current.findIndex((c) => c.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = current.splice(fromIdx, 1);
    current.splice(toIdx, 0, moved);
    const reindexed = current.map((c, i) => ({ ...c, position: i }));
    setColumns(reindexed);
    // Persist all positions
    await Promise.all(
      reindexed.map((c) =>
        supabase.from('board_columns').update({ position: c.position }).eq('id', c.id)
      )
    );
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

    // Apply automatic status defaults for any status column with an isAutomatic option
    const autoCells = columns
      .filter((c) => c.type === 'status')
      .map((c) => {
        const auto = c.options.find((o) => o.isAutomatic);
        return auto ? { row_id: data.id, column_id: c.id, value: auto.id } : null;
      })
      .filter((x): x is { row_id: string; column_id: string; value: string } => x !== null);

    if (autoCells.length > 0) {
      const { data: insertedCells } = await supabase
        .from('board_cells')
        .insert(autoCells)
        .select();
      if (insertedCells) {
        setCells((cs) => [...cs, ...insertedCells.map(normalizeCell)]);
      }
    }

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

  const reorderRows = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const current = [...rows].sort((a, b) => a.position - b.position);
    const fromIdx = current.findIndex((r) => r.id === sourceId);
    const toIdx = current.findIndex((r) => r.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = current.splice(fromIdx, 1);
    current.splice(toIdx, 0, moved);
    const reindexed = current.map((r, i) => ({ ...r, position: i }));
    setRows(reindexed);
    await Promise.all(
      reindexed.map((r) =>
        supabase.from('board_rows').update({ position: r.position }).eq('id', r.id)
      )
    );
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
      setCells((cs) => [...cs, normalizeCell(data)]);
    }
  };

  const getCellValue = (row_id: string, column_id: string): string => {
    return cells.find((c) => c.row_id === row_id && c.column_id === column_id)?.value || '';
  };

  const getCellTextAlign = (row_id: string, column_id: string): 'left' | 'center' | 'right' | null => {
    return cells.find((c) => c.row_id === row_id && c.column_id === column_id)?.text_align ?? null;
  };

  const setCellTextAlign = async (
    row_id: string,
    column_id: string,
    text_align: 'left' | 'center' | 'right' | null
  ) => {
    const existing = cells.find((c) => c.row_id === row_id && c.column_id === column_id);
    if (existing) {
      setCells((cs) => cs.map((c) => (c.id === existing.id ? { ...c, text_align } : c)));
      const { error } = await supabase
        .from('board_cells')
        .update({ text_align } as any)
        .eq('id', existing.id);
      if (error) toast.error('Failed to set alignment');
    } else {
      const { data, error } = await supabase
        .from('board_cells')
        .insert({ row_id, column_id, value: '', text_align } as any)
        .select()
        .single();
      if (error || !data) {
        toast.error('Failed to set alignment');
        return;
      }
      setCells((cs) => [...cs, normalizeCell(data)]);
    }
  };

  const getCellBgColor = (row_id: string, column_id: string): string | null => {
    return cells.find((c) => c.row_id === row_id && c.column_id === column_id)?.bg_color ?? null;
  };

  const setCellBgColor = async (
    row_id: string,
    column_id: string,
    bg_color: string | null
  ) => {
    const existing = cells.find((c) => c.row_id === row_id && c.column_id === column_id);
    if (existing) {
      if (existing.bg_color === bg_color) return;
      setCells((cs) => cs.map((c) => (c.id === existing.id ? { ...c, bg_color } : c)));
      const { error } = await supabase
        .from('board_cells')
        .update({ bg_color } as any)
        .eq('id', existing.id);
      if (error) toast.error('Failed to set color');
    } else {
      const { data, error } = await supabase
        .from('board_cells')
        .insert({ row_id, column_id, value: '', bg_color } as any)
        .select()
        .single();
      if (error || !data) {
        toast.error('Failed to set color');
        return;
      }
      setCells((cs) => [...cs, normalizeCell(data)]);
    }
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
    setColumnConnectConfig,
    setColumnWidth,
    setColumnNotes,
    setColumnPerRowOptions,
    setColumnTextAlign,
    deleteColumn,
    reorderColumns,
    addRow,
    deleteRow,
    reorderRows,
    setCellValue,
    getCellValue,
    getCellTextAlign,
    setCellTextAlign,
    getCellBgColor,
    setCellBgColor,
    refetch: fetchAll,
  };
}

