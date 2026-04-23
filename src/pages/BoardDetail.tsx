import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight, MoreVertical, StickyNote, FileText, Search, X, Shield, Download, Combine, Split } from 'lucide-react';
import { generateBoardPdf } from '@/lib/boardPdfGenerator';
import { useBoard, BoardRow, BoardColumn } from '@/hooks/useBoard';
import { useBoardCellFiles } from '@/hooks/useBoardCellFiles';
import { useBoardRowNoteEntries } from '@/hooks/useBoardRowNoteEntries';
import { useBoardRowActivity } from '@/hooks/useBoardRowActivity';
import { useBoardMerges } from '@/hooks/useBoardMerges';
import { RowNoteDialog } from '@/components/board/RowNoteDialog';
import { ColumnNoteDialog } from '@/components/board/ColumnNoteDialog';
import { MergeConfirmDialog } from '@/components/board/MergeConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AddColumnPopover, BoardColumnType } from '@/components/board/AddColumnPopover';
import { StatusOptionsDialog, getStatusColorClasses } from '@/components/board/StatusOptionsDialog';
import { TextCell } from '@/components/board/cells/TextCell';
import { DateCell } from '@/components/board/cells/DateCell';
import { CheckboxCell } from '@/components/board/cells/CheckboxCell';
import { StatusCell } from '@/components/board/cells/StatusCell';
import { FilesCell } from '@/components/board/cells/FilesCell';
import { LinkCell } from '@/components/board/cells/LinkCell';
import { ConnectBoardCell } from '@/components/board/cells/ConnectBoardCell';
import { ConnectBoardSetupDialog } from '@/components/board/ConnectBoardSetupDialog';
import { BoardAccessSheet } from '@/components/board/BoardAccessSheet';
import { useBoardAccess } from '@/hooks/useBoardAccess';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { resolveSelectedStatus } from '@/lib/boardStatusValue';
import { computeMergeRects, buildCellGeometryMap } from '@/lib/boardMergeGeometry';

interface ColumnHeaderProps {
  column: BoardColumn;
  onRename: (name: string) => void;
  onChangeType: (type: BoardColumnType) => void;
  onManageOptions: () => void;
  onConfigureConnect: () => void;
  onEditNotes: () => void;
  onTogglePerRowOptions: () => void;
  onChangeTextAlign: (align: 'left' | 'center' | 'right') => void;
  onDelete?: () => void;
  isPrimary?: boolean;
}

function ColumnHeader({ column, onRename, onChangeType, onManageOptions, onConfigureConnect, onEditNotes, onTogglePerRowOptions, onChangeTextAlign, onDelete, isPrimary }: ColumnHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(column.name);

  useEffect(() => setValue(column.name), [column.name]);

  const commit = () => {
    setEditing(false);
    if (value.trim() && value !== column.name) onRename(value.trim());
    else setValue(column.name);
  };

  const types: { type: BoardColumnType; label: string }[] = [
    { type: 'text', label: 'Text' },
    { type: 'date', label: 'Date' },
    { type: 'checkbox', label: 'Checkbox' },
    { type: 'status', label: 'Status' },
    { type: 'files', label: 'Files' },
    { type: 'link', label: 'Link' },
    { type: 'connect', label: 'Connect board' },
  ];

  const hasNotes = column.notes.trim().length > 0;

  return (
    <div className="flex items-center gap-1 px-2 py-2 group/header">
      {editing ? (
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') {
              setValue(column.name);
              setEditing(false);
            }
          }}
          className="h-7 text-sm font-medium"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex-1 text-left font-medium text-sm truncate hover:text-primary min-w-0"
        >
          {column.name}
          <span className="ml-1 text-xs text-muted-foreground font-normal">({column.type})</span>
        </button>
      )}
      {!editing && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-6 w-6 shrink-0',
              hasNotes ? 'text-primary opacity-100' : 'opacity-0 group-hover/header:opacity-100'
            )}
            onClick={onEditNotes}
            title={hasNotes ? column.notes : 'Add column notes'}
          >
            <FileText className="h-3 w-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover/header:opacity-100 shrink-0"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(true)}>Rename</DropdownMenuItem>
              <DropdownMenuItem onClick={onEditNotes}>
                {hasNotes ? 'Edit notes' : 'Add notes'}
              </DropdownMenuItem>
              {!isPrimary && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Change type</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {types.map((t) => (
                        <DropdownMenuItem
                          key={t.type}
                          onClick={() => onChangeType(t.type)}
                          disabled={t.type === column.type}
                        >
                          {t.label} {t.type === column.type && '✓'}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              )}
              {column.type === 'status' && !isPrimary && (
                <>
                  <DropdownMenuItem onClick={onTogglePerRowOptions}>
                    {column.per_row_options ? 'Use shared column options' : 'Per-row status options'}
                  </DropdownMenuItem>
                  {!column.per_row_options && (
                    <DropdownMenuItem onClick={onManageOptions}>Manage status options</DropdownMenuItem>
                  )}
                </>
              )}
              {column.type === 'connect' && !isPrimary && (
                <DropdownMenuItem onClick={onConfigureConnect}>Configure connection</DropdownMenuItem>
              )}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Text alignment</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    {(['left', 'center', 'right'] as const).map((a) => (
                      <DropdownMenuItem
                        key={a}
                        onClick={() => onChangeTextAlign(a)}
                        disabled={column.text_align === a}
                      >
                        {a.charAt(0).toUpperCase() + a.slice(1)} {column.text_align === a && '✓'}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              {onDelete && !isPrimary && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-3 w-3" />
                    Delete column
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}

interface ResizeHandleProps {
  onLiveResize: (newWidth: number) => void;
  onCommit: (newWidth: number) => void;
  startWidth: number;
}

function ResizeHandle({ onLiveResize, onCommit, startWidth }: ResizeHandleProps) {
  const startXRef = useRef(0);
  const startWidthRef = useRef(startWidth);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      startXRef.current = e.clientX;
      startWidthRef.current = startWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      let latestWidth = startWidth;

      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startXRef.current;
        latestWidth = Math.max(80, Math.min(900, startWidthRef.current + delta));
        onLiveResize(latestWidth);
      };

      const onUp = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        onCommit(latestWidth);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [onLiveResize, onCommit, startWidth]
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-primary/60 transition-colors z-20"
      title="Drag to resize"
    />
  );
}


export default function BoardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
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
    setCellValue,
    getCellValue,
    getCellTextAlign,
    setCellTextAlign,
  } = useBoard(id);

  const { user } = useAuth();
  // Need org id from board (needed even before columns load); we read from `board`
  const { currentUserColumnPerms, isOwnerOrAdmin } = useBoardAccess(id, null);

  // Visible columns (hide ones marked 'hidden' for this user)
  const visibleColumns = useMemo(
    () => columns.filter((c) => currentUserColumnPerms(c.id) !== 'hidden'),
    [columns, currentUserColumnPerms]
  );

  const canManageAccess = !!user && !!board && (board.user_id === user.id || isOwnerOrAdmin(user.id));
  const [accessSheetOpen, setAccessSheetOpen] = useState(false);

  const rowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const { getFiles, uploadFile, deleteFile, refreshSignedUrl } = useBoardCellFiles(rowIds);
  const {
    getEntries: getNoteEntries,
    getCount: getNoteCount,
    addEntry: addNoteEntryRaw,
    updateEntry: updateNoteEntryRaw,
    deleteEntry: deleteNoteEntryRaw,
    refreshImageUrl: refreshNoteImageUrl,
  } = useBoardRowNoteEntries(rowIds);
  const { getActivity, logActivity, userNames } = useBoardRowActivity(rowIds);

  // Wrap cell setter to log changes to activity log + enforce view-only
  const setCellValueLogged = useCallback(
    async (row_id: string, column_id: string, value: string) => {
      // Block writes on view-only / hidden columns
      const perm = currentUserColumnPerms(column_id);
      if (perm !== 'edit') {
        toast.error('You do not have permission to edit this column');
        return;
      }
      const oldValue = getCellValue(row_id, column_id);
      if (oldValue === value) return;
      await setCellValue(row_id, column_id, value);
      const col = columns.find((c) => c.id === column_id);
      // For status columns, log the human-readable label
      let displayOld = oldValue;
      let displayNew = value;
      if (col?.type === 'status') {
        displayOld =
          resolveSelectedStatus(oldValue, col.options, col.per_row_options).option?.label ||
          (col.per_row_options ? '' : oldValue);
        displayNew =
          resolveSelectedStatus(value, col.options, col.per_row_options).option?.label ||
          (col.per_row_options ? '' : value);
      }
      logActivity({
        row_id,
        column_id,
        action: 'cell_changed',
        column_name: col?.name || null,
        column_type: col?.type || null,
        old_value: displayOld || null,
        new_value: displayNew || null,
      });
    },
    [getCellValue, setCellValue, columns, logActivity, currentUserColumnPerms]
  );

  // Wrap note operations to log them
  const addNoteEntry = useCallback(
    async (row_id: string, content: string, imageFile: File | null) => {
      const result = await addNoteEntryRaw(row_id, content, imageFile);
      if (result) {
        logActivity({
          row_id,
          action: 'note_added',
          new_value: content || (imageFile ? '[image]' : ''),
        });
      }
      return result;
    },
    [addNoteEntryRaw, logActivity]
  );

  const updateNoteEntry = useCallback(
    async (id: string, content: string) => {
      // Find the row this note belongs to
      const noteRows = rows.filter((r) => getNoteEntries(r.id).some((e) => e.id === id));
      const row_id = noteRows[0]?.id;
      await updateNoteEntryRaw(id, content);
      if (row_id) {
        logActivity({ row_id, action: 'note_updated', new_value: content });
      }
    },
    [updateNoteEntryRaw, rows, getNoteEntries, logActivity]
  );

  const deleteNoteEntry = useCallback(
    async (id: string) => {
      const noteRows = rows.filter((r) => getNoteEntries(r.id).some((e) => e.id === id));
      const row_id = noteRows[0]?.id;
      const oldContent = noteRows[0] ? getNoteEntries(noteRows[0].id).find((e) => e.id === id)?.content : '';
      await deleteNoteEntryRaw(id);
      if (row_id) {
        logActivity({ row_id, action: 'note_deleted', old_value: oldContent || null });
      }
    },
    [deleteNoteEntryRaw, rows, getNoteEntries, logActivity]
  );

  const [titleEditing, setTitleEditing] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [statusDialogColumnId, setStatusDialogColumnId] = useState<string | null>(null);
  const [connectDialogColumnId, setConnectDialogColumnId] = useState<string | null>(null);
  const [noteRowId, setNoteRowId] = useState<string | null>(null);
  const [columnNoteId, setColumnNoteId] = useState<string | null>(null);
  const [liveWidths, setLiveWidths] = useState<Record<string, number>>({});
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightRowId = searchParams.get('row');
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [rowSearch, setRowSearch] = useState('');

  // ---- Cell selection & merging ----
  const { merges, createMerge, deleteMerges } = useBoardMerges(id);
  const [selectionAnchor, setSelectionAnchor] = useState<{ rowId: string; colId: string } | null>(null);
  const [selectionFocus, setSelectionFocus] = useState<{ rowId: string; colId: string } | null>(null);
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [mergePromptOpen, setMergePromptOpen] = useState(false);
  const [pendingMergeContext, setPendingMergeContext] = useState<{
    nonEmptyCount: number;
    cellCount: number;
    startRowId: string;
    endRowId: string;
    startColId: string;
    endColId: string;
  } | null>(null);

  useEffect(() => {
    if (board) setTitleValue(board.name);
  }, [board?.name]);

  // When ?row= is present and rows are loaded, scroll to & highlight that row
  useEffect(() => {
    if (!highlightRowId || loading) return;
    if (!rows.some((r) => r.id === highlightRowId)) return;
    setActiveHighlight(highlightRowId);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-row-id="${highlightRowId}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    const t = setTimeout(() => {
      setActiveHighlight(null);
      // Strip the query param so it doesn't keep highlighting on refresh
      const next = new URLSearchParams(searchParams);
      next.delete('row');
      setSearchParams(next, { replace: true });
    }, 3000);
    return () => clearTimeout(t);
  }, [highlightRowId, rows, loading]);

  const groupByColumn = visibleColumns.find((c) => c.id === board?.group_by_column_id);

  // Build a fast lookup so search can scan every cell of every row
  const cellsByRow = useMemo(() => {
    const map = new Map<string, Record<string, string>>();
    cells.forEach((c) => {
      const r = map.get(c.row_id) || {};
      r[c.column_id] = c.value;
      map.set(c.row_id, r);
    });
    return map;
  }, [cells]);

  const filteredRows = useMemo(() => {
    const q = rowSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const rowCells = cellsByRow.get(row.id) || {};
      return visibleColumns.some((col) => {
        const raw = rowCells[col.id];
        if (!raw) return false;
        if (col.type === 'status') {
          const { option } = resolveSelectedStatus(raw, col.options, col.per_row_options);
          return (option?.label || '').toLowerCase().includes(q);
        }
        // For text/date/link/checkbox/connect (json arrays) — plain substring works
        return raw.toLowerCase().includes(q);
      });
    });
  }, [rows, visibleColumns, cellsByRow, rowSearch]);

  const grouped = useMemo(() => {
    if (!board?.group_by_column_id || !groupByColumn) {
      return [{ key: '__all__', label: null, rows: filteredRows }];
    }
    const groups: Record<string, BoardRow[]> = {};
    filteredRows.forEach((row) => {
      const raw = getCellValue(row.id, board.group_by_column_id!);
      let key: string;
      if (groupByColumn.type === 'status') {
        const { option } = resolveSelectedStatus(raw, groupByColumn.options, groupByColumn.per_row_options);
        key = option?.label || '(Ungrouped)';
      } else if (groupByColumn.type === 'checkbox') {
        key = raw === 'true' ? 'Checked' : 'Unchecked';
      } else {
        key = raw || '(Ungrouped)';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, rs]) => ({ key, label: key, rows: rs }));
  }, [filteredRows, board?.group_by_column_id, groupByColumn, getCellValue]);

  // Flatten the actual rendered row order across groups so merge geometry
  // matches what the user sees on screen.
  const renderedRowIds = useMemo(
    () => grouped.flatMap((g) => g.rows.map((r) => r.id)),
    [grouped]
  );
  const visibleColumnIds = useMemo(() => visibleColumns.map((c) => c.id), [visibleColumns]);

  const mergeRects = useMemo(
    () => computeMergeRects(merges, renderedRowIds, visibleColumnIds),
    [merges, renderedRowIds, visibleColumnIds]
  );

  const cellGeometry = useMemo(
    () => buildCellGeometryMap(mergeRects, renderedRowIds, visibleColumnIds),
    [mergeRects, renderedRowIds, visibleColumnIds]
  );

  // Compute current selection rectangle (anchor + focus, normalized).
  const selectionRect = useMemo(() => {
    if (!selectionAnchor || !selectionFocus) return null;
    const aRow = renderedRowIds.indexOf(selectionAnchor.rowId);
    const fRow = renderedRowIds.indexOf(selectionFocus.rowId);
    const aCol = visibleColumnIds.indexOf(selectionAnchor.colId);
    const fCol = visibleColumnIds.indexOf(selectionFocus.colId);
    if (aRow < 0 || fRow < 0 || aCol < 0 || fCol < 0) return null;
    return {
      r1: Math.min(aRow, fRow),
      r2: Math.max(aRow, fRow),
      c1: Math.min(aCol, fCol),
      c2: Math.max(aCol, fCol),
    };
  }, [selectionAnchor, selectionFocus, renderedRowIds, visibleColumnIds]);

  const selectedCellCount = selectionRect
    ? (selectionRect.r2 - selectionRect.r1 + 1) * (selectionRect.c2 - selectionRect.c1 + 1)
    : 0;

  const selectedMergeIds = useMemo(() => {
    if (!selectionRect) return [];
    return mergeRects
      .filter(
        (r) =>
          r.startRowIdx >= selectionRect.r1 &&
          r.endRowIdx <= selectionRect.r2 &&
          r.startColIdx >= selectionRect.c1 &&
          r.endColIdx <= selectionRect.c2
      )
      .map((r) => r.id);
  }, [mergeRects, selectionRect]);

  const handleCellMouseDown = useCallback(
    (rowId: string, colId: string, shiftKey: boolean) => {
      if (shiftKey && selectionAnchor) {
        setSelectionFocus({ rowId, colId });
      } else {
        setSelectionAnchor({ rowId, colId });
        setSelectionFocus({ rowId, colId });
      }
      setIsDragSelecting(true);
    },
    [selectionAnchor]
  );

  const handleCellMouseEnter = useCallback(
    (rowId: string, colId: string) => {
      if (!isDragSelecting) return;
      setSelectionFocus({ rowId, colId });
    },
    [isDragSelecting]
  );

  // Global mouseup ends drag-selection
  useEffect(() => {
    if (!isDragSelecting) return;
    const onUp = () => setIsDragSelecting(false);
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [isDragSelecting]);

  // Select an entire row (clicking the row gutter). Shift extends.
  const handleSelectRow = useCallback(
    (rowId: string, shiftKey: boolean) => {
      if (visibleColumnIds.length === 0) return;
      const firstCol = visibleColumnIds[0];
      const lastCol = visibleColumnIds[visibleColumnIds.length - 1];
      if (shiftKey && selectionAnchor) {
        setSelectionFocus({ rowId, colId: lastCol });
      } else {
        setSelectionAnchor({ rowId, colId: firstCol });
        setSelectionFocus({ rowId, colId: lastCol });
      }
    },
    [selectionAnchor, visibleColumnIds]
  );

  // Select an entire column (clicking the column header). Shift extends.
  const handleSelectColumn = useCallback(
    (colId: string, shiftKey: boolean) => {
      if (renderedRowIds.length === 0) return;
      const firstRow = renderedRowIds[0];
      const lastRow = renderedRowIds[renderedRowIds.length - 1];
      if (shiftKey && selectionAnchor) {
        setSelectionFocus({ rowId: lastRow, colId });
      } else {
        setSelectionAnchor({ rowId: firstRow, colId });
        setSelectionFocus({ rowId: lastRow, colId });
      }
    },
    [selectionAnchor, renderedRowIds]
  );

  const clearSelection = useCallback(() => {
    setSelectionAnchor(null);
    setSelectionFocus(null);
    setIsDragSelecting(false);
  }, []);

  // Keyboard: Esc clears selection. Cmd/Ctrl+M triggers merge prompt when applicable.

  const requestMerge = useCallback(() => {
    if (!selectionRect || selectedCellCount < 2) return;
    const startRowId = renderedRowIds[selectionRect.r1];
    const endRowId = renderedRowIds[selectionRect.r2];
    const startColId = visibleColumnIds[selectionRect.c1];
    const endColId = visibleColumnIds[selectionRect.c2];

    let nonEmpty = 0;
    for (let r = selectionRect.r1; r <= selectionRect.r2; r++) {
      for (let c = selectionRect.c1; c <= selectionRect.c2; c++) {
        const v = getCellValue(renderedRowIds[r], visibleColumnIds[c]);
        if (v && v.trim() !== '') nonEmpty++;
      }
    }

    setPendingMergeContext({
      nonEmptyCount: nonEmpty,
      cellCount: selectedCellCount,
      startRowId,
      endRowId,
      startColId,
      endColId,
    });
    setMergePromptOpen(true);
  }, [selectionRect, selectedCellCount, renderedRowIds, visibleColumnIds, getCellValue]);

  const confirmMerge = useCallback(
    async (mode: 'keep-top-left' | 'concatenate') => {
      if (!pendingMergeContext || !id) {
        setMergePromptOpen(false);
        return;
      }
      const startRowIdx = renderedRowIds.indexOf(pendingMergeContext.startRowId);
      const endRowIdx = renderedRowIds.indexOf(pendingMergeContext.endRowId);
      const startColIdx = visibleColumnIds.indexOf(pendingMergeContext.startColId);
      const endColIdx = visibleColumnIds.indexOf(pendingMergeContext.endColId);

      // Remove any merges that overlap the new rectangle to avoid duplicates.
      const overlappingIds = mergeRects
        .filter(
          (r) =>
            !(
              r.endRowIdx < startRowIdx ||
              r.startRowIdx > endRowIdx ||
              r.endColIdx < startColIdx ||
              r.startColIdx > endColIdx
            )
        )
        .map((r) => r.id);
      if (overlappingIds.length > 0) {
        await deleteMerges(overlappingIds);
      }

      if (mode === 'concatenate') {
        const parts: string[] = [];
        for (let r = startRowIdx; r <= endRowIdx; r++) {
          for (let c = startColIdx; c <= endColIdx; c++) {
            const v = getCellValue(renderedRowIds[r], visibleColumnIds[c]);
            if (v && v.trim() !== '') parts.push(v);
          }
        }
        if (parts.length > 0) {
          await setCellValueLogged(
            pendingMergeContext.startRowId,
            pendingMergeContext.startColId,
            parts.join(' • ')
          );
        }
      }

      await createMerge({
        board_id: id,
        start_row_id: pendingMergeContext.startRowId,
        end_row_id: pendingMergeContext.endRowId,
        start_column_id: pendingMergeContext.startColId,
        end_column_id: pendingMergeContext.endColId,
      });

      setMergePromptOpen(false);
      setPendingMergeContext(null);
      clearSelection();
    },
    [
      pendingMergeContext,
      id,
      mergeRects,
      renderedRowIds,
      visibleColumnIds,
      deleteMerges,
      createMerge,
      getCellValue,
      setCellValueLogged,
      clearSelection,
    ]
  );

  const handleUnmerge = useCallback(async () => {
    if (selectedMergeIds.length === 0) return;
    await deleteMerges(selectedMergeIds);
    clearSelection();
  }, [selectedMergeIds, deleteMerges, clearSelection]);

  // Keyboard shortcuts: Esc clears, Cmd/Ctrl+M merges
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField = target && target.closest('input, textarea, [contenteditable="true"]');
      if (e.key === 'Escape' && (selectionAnchor || selectionFocus)) {
        clearSelection();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'm' || e.key === 'M') && !inField) {
        if (selectedCellCount >= 2 && selectedMergeIds.length === 0) {
          e.preventDefault();
          requestMerge();
        } else if (selectedMergeIds.length > 0) {
          e.preventDefault();
          handleUnmerge();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectionAnchor, selectionFocus, selectedCellCount, selectedMergeIds, requestMerge, handleUnmerge, clearSelection]);


  if (loading || !board) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const commitTitle = () => {
    setTitleEditing(false);
    if (titleValue.trim() && titleValue !== board.name) renameBoard(titleValue.trim());
    else setTitleValue(board.name);
  };

  const groupableColumns = visibleColumns.filter((c) => c.type !== 'files' && c.type !== 'link' && c.type !== 'connect');
  const statusDialogColumn = columns.find((c) => c.id === statusDialogColumnId) || null;
  const connectDialogColumn = columns.find((c) => c.id === connectDialogColumnId) || null;

  return (
    <div className="w-full h-full flex flex-col p-6 space-y-4 overflow-hidden">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            navigate('/boards', {
              state: board.company_id ? { companyId: board.company_id } : undefined,
            })
          }
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {titleEditing ? (
          <Input
            autoFocus
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              if (e.key === 'Escape') {
                setTitleValue(board.name);
                setTitleEditing(false);
              }
            }}
            className="text-2xl font-bold h-10 max-w-md"
          />
        ) : (
          <h1
            onClick={() => setTitleEditing(true)}
            className="text-2xl font-bold tracking-tight cursor-pointer hover:text-primary"
          >
            {board.name}
          </h1>
        )}
        <div className="ml-auto flex items-center gap-2">
          {selectedCellCount >= 2 && selectedMergeIds.length === 0 && (
            <Button variant="default" size="sm" onClick={requestMerge}>
              <Combine className="h-4 w-4" />
              Merge {selectedCellCount} cells
            </Button>
          )}
          {selectedMergeIds.length > 0 && (
            <Button variant="default" size="sm" onClick={handleUnmerge}>
              <Split className="h-4 w-4" />
              Unmerge
            </Button>
          )}
          {(selectionAnchor || selectionFocus) && selectedCellCount < 2 && selectedMergeIds.length === 0 && (
            <span className="text-xs text-muted-foreground hidden md:inline">
              Drag across cells, or click a row/column header to select more — then Merge.
            </span>
          )}
          {(selectionAnchor || selectionFocus) && (
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await generateBoardPdf({
                  boardName: board.name,
                  columns: visibleColumns,
                  groups: grouped.map((g) => ({ label: g.label, rows: g.rows })),
                  getCellValue,
                  getFiles,
                });
              } catch (err) {
                console.error('Board PDF export failed', err);
                toast.error('Failed to export PDF');
              }
            }}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          {canManageAccess && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAccessSheetOpen(true)}
            >
              <Shield className="h-4 w-4" />
              Manage Access
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={rowSearch}
            onChange={(e) => setRowSearch(e.target.value)}
            placeholder="Search rows…"
            className="pl-9 pr-9 h-9"
          />
          {rowSearch && (
            <button
              type="button"
              onClick={() => setRowSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <span className="text-sm text-muted-foreground ml-auto">Group by:</span>
        <Select
          value={board.group_by_column_id || 'none'}
          onValueChange={(v) => setGroupBy(v === 'none' ? null : v)}
        >
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">(none)</SelectItem>
            {groupableColumns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-h-0 border border-border rounded-lg overflow-auto bg-card">
        <table className="border-collapse" style={{ width: 'max-content', minWidth: '100%' }}>
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="sticky left-0 top-0 z-30 border-r w-16 border-border shadow-none bg-muted"></th>
              {visibleColumns.map((col, idx) => {
                const w = liveWidths[col.id] ?? col.width;
                return (
                  <th
                    key={col.id}
                    style={{ width: w, minWidth: w, maxWidth: w }}
                    className={cn(
                      'border-r border-border text-left relative transition-colors sticky top-0 bg-muted z-20',
                      idx === 0 && 'left-16 z-30',
                      dragOverColId === col.id && draggedColId !== col.id && 'bg-primary/10',
                      draggedColId === col.id && 'opacity-40'
                    )}
                    draggable={idx !== 0}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      const target = e.target as HTMLElement;
                      if (target.closest('button, input, textarea, select, a, [role="button"]')) return;
                      handleSelectColumn(col.id, e.shiftKey);
                    }}
                    title="Click to select column (Shift+Click to extend)"
                    onDragStart={(e) => {
                      if (idx === 0) return;
                      setDraggedColId(col.id);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', col.id);
                    }}
                    onDragOver={(e) => {
                      if (!draggedColId || draggedColId === col.id || idx === 0) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setDragOverColId(col.id);
                    }}
                    onDragLeave={() => {
                      if (dragOverColId === col.id) setDragOverColId(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedColId && draggedColId !== col.id && idx !== 0) {
                        reorderColumns(draggedColId, col.id);
                      }
                      setDraggedColId(null);
                      setDragOverColId(null);
                    }}
                    onDragEnd={() => {
                      setDraggedColId(null);
                      setDragOverColId(null);
                    }}
                  >
                    <ColumnHeader
                      column={col}
                      onRename={(name) => renameColumn(col.id, name)}
                      onChangeType={(type) => setColumnType(col.id, type)}
                      onManageOptions={() => setStatusDialogColumnId(col.id)}
                      onConfigureConnect={() => setConnectDialogColumnId(col.id)}
                      onEditNotes={() => setColumnNoteId(col.id)}
                      onTogglePerRowOptions={() => setColumnPerRowOptions(col.id, !col.per_row_options)}
                      onChangeTextAlign={(a) => setColumnTextAlign(col.id, a)}
                      onDelete={visibleColumns.length > 1 && idx !== 0 ? () => deleteColumn(col.id) : undefined}
                      isPrimary={idx === 0}
                    />
                    <ResizeHandle
                      startWidth={col.width}
                      onLiveResize={(newW) => {
                        setLiveWidths((s) => ({ ...s, [col.id]: newW }));
                      }}
                      onCommit={(newW) => {
                        setColumnWidth(col.id, newW);
                        setLiveWidths((s) => {
                          const { [col.id]: _, ...rest } = s;
                          return rest;
                        });
                      }}
                    />
                  </th>
                );
              })}
              <th className="w-12 px-2 sticky top-0 bg-muted z-20">
                <AddColumnPopover onAdd={(name, type) => addColumn(name, type)} />
              </th>
            </tr>
          </thead>
          <tbody>
            {grouped.map((group) => (
              <GroupSection
                key={group.key}
                groupKey={group.key}
                label={group.label}
                rows={group.rows}
                columns={visibleColumns}
                currentUserColumnPerms={currentUserColumnPerms}
                liveWidths={liveWidths}
                collapsed={!!collapsedGroups[group.key]}
                onToggle={() =>
                  setCollapsedGroups((s) => ({ ...s, [group.key]: !s[group.key] }))
                }
                getCellValue={getCellValue}
                setCellValue={setCellValueLogged}
                getCellTextAlign={getCellTextAlign}
                setCellTextAlign={setCellTextAlign}
                deleteRow={deleteRow}
                getFiles={getFiles}
                uploadFile={uploadFile}
                deleteFile={deleteFile}
                refreshSignedUrl={refreshSignedUrl}
                getNoteCount={getNoteCount}
                onOpenNote={setNoteRowId}
                onConfigureConnect={setConnectDialogColumnId}
                highlightRowId={activeHighlight}
                cellGeometry={cellGeometry}
                onCellMouseDown={handleCellMouseDown}
                onCellMouseEnter={handleCellMouseEnter}
                onSelectRow={handleSelectRow}
                isCellSelected={(rowId, colId) => {
                  if (!selectionRect) return false;
                  const r = renderedRowIds.indexOf(rowId);
                  const c = visibleColumnIds.indexOf(colId);
                  return (
                    r >= selectionRect.r1 &&
                    r <= selectionRect.r2 &&
                    c >= selectionRect.c1 &&
                    c <= selectionRect.c2
                  );
                }}
              />
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length + 2} className="text-center py-8 text-muted-foreground">
                  No rows yet — click "+ Add row" to start
                </td>
              </tr>
            )}
            {rows.length > 0 && filteredRows.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length + 2} className="text-center py-8 text-muted-foreground">
                  No rows match "{rowSearch}"
                </td>
              </tr>
            )}

            <tr>
              <td className="p-2 sticky left-0 bg-muted z-10 w-16 border-r border-border">
                <Button variant="ghost" size="sm" onClick={() => addRow()}>
                  <Plus className="h-3 w-3" />
                  Add row
                </Button>
              </td>
              <td colSpan={visibleColumns.length + 1}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {statusDialogColumn && (
        <StatusOptionsDialog
          open={!!statusDialogColumnId}
          onOpenChange={(o) => !o && setStatusDialogColumnId(null)}
          initialOptions={statusDialogColumn.options}
          onSave={(opts) => setColumnOptions(statusDialogColumn.id, opts)}
        />
      )}

      {connectDialogColumn && board && (
        <ConnectBoardSetupDialog
          open={!!connectDialogColumnId}
          onOpenChange={(o) => !o && setConnectDialogColumnId(null)}
          currentBoardId={board.id}
          initialConfig={{
            connect_board_id: connectDialogColumn.connect_board_id,
            connect_mirror_column_id: connectDialogColumn.connect_mirror_column_id,
          }}
          onSave={(cfg) => setColumnConnectConfig(connectDialogColumn.id, cfg)}
        />
      )}

      {noteRowId && (
        <RowNoteDialog
          open={!!noteRowId}
          onOpenChange={(o) => !o && setNoteRowId(null)}
          rowLabel={columns[0] ? getCellValue(noteRowId, columns[0].id) : ''}
          entries={getNoteEntries(noteRowId)}
          activity={getActivity(noteRowId)}
          userNames={userNames}
          onAdd={(content, imageFile) => addNoteEntry(noteRowId, content, imageFile)}
          onUpdate={updateNoteEntry}
          onDelete={deleteNoteEntry}
          onRefreshImageUrl={refreshNoteImageUrl}
        />
      )}

      {columnNoteId && (() => {
        const col = columns.find((c) => c.id === columnNoteId);
        if (!col) return null;
        return (
          <ColumnNoteDialog
            open={!!columnNoteId}
            onOpenChange={(o) => !o && setColumnNoteId(null)}
            initialContent={col.notes}
            columnName={col.name}
            onSave={(content) => setColumnNotes(col.id, content)}
          />
        );
      })()}

      {board && (
        <BoardAccessSheet
          open={accessSheetOpen}
          onOpenChange={setAccessSheetOpen}
          boardId={board.id}
          organizationId={null}
          columns={columns}
        />
      )}

      <MergeConfirmDialog
        open={mergePromptOpen}
        onOpenChange={(o) => {
          setMergePromptOpen(o);
          if (!o) setPendingMergeContext(null);
        }}
        cellCount={pendingMergeContext?.cellCount ?? 0}
        hasMultipleNonEmpty={(pendingMergeContext?.nonEmptyCount ?? 0) > 1}
        onConfirm={confirmMerge}
      />
    </div>
  );
}

interface GroupSectionProps {
  groupKey: string;
  label: string | null;
  rows: BoardRow[];
  columns: BoardColumn[];
  liveWidths: Record<string, number>;
  collapsed: boolean;
  onToggle: () => void;
  getCellValue: (row_id: string, column_id: string) => string;
  setCellValue: (row_id: string, column_id: string, value: string) => void;
  getCellTextAlign: (row_id: string, column_id: string) => 'left' | 'center' | 'right' | null;
  setCellTextAlign: (row_id: string, column_id: string, align: 'left' | 'center' | 'right' | null) => void;
  deleteRow: (id: string) => void;
  getFiles: ReturnType<typeof useBoardCellFiles>['getFiles'];
  uploadFile: ReturnType<typeof useBoardCellFiles>['uploadFile'];
  deleteFile: ReturnType<typeof useBoardCellFiles>['deleteFile'];
  refreshSignedUrl: ReturnType<typeof useBoardCellFiles>['refreshSignedUrl'];
  getNoteCount: (row_id: string) => number;
  onOpenNote: (row_id: string) => void;
  onConfigureConnect: (col_id: string) => void;
  highlightRowId?: string | null;
  currentUserColumnPerms: (columnId: string) => 'edit' | 'view' | 'hidden';
  cellGeometry: Map<string, { span?: { rowSpan: number; colSpan: number; mergeId: string }; hidden?: boolean }>;
  onCellMouseDown: (rowId: string, colId: string, shiftKey: boolean) => void;
  onCellMouseEnter: (rowId: string, colId: string) => void;
  onSelectRow: (rowId: string, shiftKey: boolean) => void;
  isCellSelected: (rowId: string, colId: string) => boolean;
}

function GroupSection({
  label,
  rows,
  columns,
  liveWidths,
  collapsed,
  onToggle,
  getCellValue,
  setCellValue,
  getCellTextAlign,
  setCellTextAlign,
  deleteRow,
  getFiles,
  uploadFile,
  deleteFile,
  refreshSignedUrl,
  getNoteCount,
  onOpenNote,
  onConfigureConnect,
  highlightRowId,
  currentUserColumnPerms,
  cellGeometry,
  onCellMouseDown,
  onCellMouseEnter,
  onSelectRow,
  isCellSelected,
}: GroupSectionProps) {
  // Long-press: hold ~400ms anywhere on a cell (even on inputs) to start a merge selection.
  const longPressRef = useRef<{
    timer: number | null;
    startX: number;
    startY: number;
    rowId: string;
    colId: string;
  } | null>(null);

  const cancelLongPress = () => {
    if (longPressRef.current?.timer) {
      window.clearTimeout(longPressRef.current.timer);
    }
    longPressRef.current = null;
  };

  return (
    <>
      {label !== null && (
        <tr className="bg-muted/20 border-b border-border">
          <td colSpan={columns.length + 2} className="px-2 py-2">
            <button
              onClick={onToggle}
              className="flex items-center gap-2 font-semibold text-sm hover:text-primary"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {label}
              <Badge variant="secondary" className="ml-1">
                {rows.length}
              </Badge>
            </button>
          </td>
        </tr>
      )}
      {!collapsed &&
        rows.map((row) => (
          <tr
            key={row.id}
            data-row-id={row.id}
            className={cn(
              'border-b border-border hover:bg-accent/20 group transition-colors',
              highlightRowId === row.id && 'bg-primary/15 ring-2 ring-primary ring-inset'
            )}
          >
            <td
              className="sticky left-0 bg-muted z-10 border-r border-border w-16 px-1 cursor-pointer"
              title="Click to select row (Shift+Click to extend)"
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                const target = e.target as HTMLElement;
                if (target.closest('button, input, textarea, select, a, [role="button"]')) return;
                onSelectRow(row.id, e.shiftKey);
              }}
            >
              <div className="flex items-center justify-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-6 w-6 shrink-0',
                    getNoteCount(row.id) > 0
                      ? 'text-primary opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  )}
                  onClick={() => onOpenNote(row.id)}
                  title={getNoteCount(row.id) > 0 ? `${getNoteCount(row.id)} note(s)` : 'Add note'}
                >
                  <StickyNote className="h-3 w-3" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => deleteRow(row.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete row
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </td>
            {columns.map((col, idx) => {
              const w = liveWidths[col.id] ?? col.width;
              const geom = cellGeometry.get(`${row.id}::${col.id}`);
              if (geom?.hidden) return null;
              const selected = isCellSelected(row.id, col.id);
              const isMergedAnchor = !!geom?.span;
              return (
                <td
                  key={col.id}
                  rowSpan={geom?.span?.rowSpan}
                  colSpan={geom?.span?.colSpan}
                  style={{ width: w, minWidth: w, maxWidth: w }}
                  className={cn(
                    'border-r border-border p-0 align-top relative cursor-cell',
                    idx === 0 && 'sticky left-16 bg-muted z-10',
                    selected && 'ring-2 ring-primary ring-inset',
                    isMergedAnchor && 'bg-accent/30'
                  )}
                  onMouseDown={(e) => {
                    // Only handle left-click; ignore clicks on interactive controls
                    if (e.button !== 0) return;
                    const target = e.target as HTMLElement;
                    if (target.closest('button, input, textarea, select, a, [role="button"]')) return;
                    onCellMouseDown(row.id, col.id, e.shiftKey);
                  }}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    // Long-press starts merge selection from anywhere on the cell,
                    // including over inputs/buttons. Triggers after 400ms.
                    cancelLongPress();
                    longPressRef.current = {
                      timer: window.setTimeout(() => {
                        onCellMouseDown(row.id, col.id, false);
                        longPressRef.current = null;
                      }, 400),
                      startX: e.clientX,
                      startY: e.clientY,
                      rowId: row.id,
                      colId: col.id,
                    };
                  }}
                  onPointerMove={(e) => {
                    const lp = longPressRef.current;
                    if (!lp) return;
                    const dx = Math.abs(e.clientX - lp.startX);
                    const dy = Math.abs(e.clientY - lp.startY);
                    if (dx > 6 || dy > 6) cancelLongPress();
                  }}
                  onPointerUp={cancelLongPress}
                  onPointerCancel={cancelLongPress}
                  onPointerLeave={cancelLongPress}
                  onMouseEnter={() => onCellMouseEnter(row.id, col.id)}
                >
                  <CellRenderer
                    column={col}
                    rowId={row.id}
                    value={getCellValue(row.id, col.id)}
                    onSave={(v) => setCellValue(row.id, col.id, v)}
                    files={col.type === 'files' ? getFiles(row.id, col.id) : []}
                    onUploadFile={(f) => uploadFile(row.id, col.id, f)}
                    onDeleteFile={deleteFile}
                    onOpenFile={refreshSignedUrl}
                    onConfigureConnect={() => onConfigureConnect(col.id)}
                    readOnly={currentUserColumnPerms(col.id) !== 'edit'}
                    cellAlign={getCellTextAlign(row.id, col.id)}
                    onChangeCellAlign={(a) => setCellTextAlign(row.id, col.id, a)}
                  />
                </td>
              );
            })}
            <td></td>
          </tr>
        ))}
    </>
  );
}

interface CellRendererProps {
  column: BoardColumn;
  rowId: string;
  value: string;
  onSave: (value: string) => void;
  files: ReturnType<ReturnType<typeof useBoardCellFiles>['getFiles']>;
  onUploadFile: (file: File) => Promise<void>;
  onDeleteFile: (id: string) => Promise<void>;
  onOpenFile: (id: string) => Promise<string | null>;
  onConfigureConnect: () => void;
  readOnly?: boolean;
  cellAlign?: 'left' | 'center' | 'right' | null;
  onChangeCellAlign?: (a: 'left' | 'center' | 'right' | null) => void;
}

function CellRenderer({
  column,
  value,
  onSave,
  files,
  onUploadFile,
  onDeleteFile,
  onOpenFile,
  onConfigureConnect,
  readOnly,
  cellAlign,
  onChangeCellAlign,
}: CellRendererProps) {
  switch (column.type) {
    case 'date':
      return <DateCell value={value} onSave={onSave} readOnly={readOnly} />;
    case 'checkbox':
      return <CheckboxCell value={value} onSave={onSave} readOnly={readOnly} />;
    case 'status':
      return (
        <StatusCell
          value={value}
          options={column.options}
          onSave={onSave}
          readOnly={readOnly}
          perRowOptions={column.per_row_options}
        />
      );
    case 'files':
      return (
        <FilesCell
          files={files}
          onUpload={onUploadFile}
          onDelete={onDeleteFile}
          onOpen={onOpenFile}
          readOnly={readOnly}
        />
      );
    case 'link':
      return <LinkCell value={value} onSave={onSave} readOnly={readOnly} />;
    case 'connect':
      return (
        <ConnectBoardCell
          value={value}
          onSave={onSave}
          connectBoardId={column.connect_board_id}
          mirrorColumnId={column.connect_mirror_column_id}
          onConfigure={onConfigureConnect}
          readOnly={readOnly}
        />
      );
    case 'text':
    default: {
      const effectiveAlign = cellAlign ?? column.text_align;
      return (
        <TextCell
          value={value}
          onSave={onSave}
          readOnly={readOnly}
          align={effectiveAlign}
          cellAlign={cellAlign ?? null}
          onChangeCellAlign={onChangeCellAlign}
        />
      );
    }
  }
}
