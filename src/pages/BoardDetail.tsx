import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight, MoreVertical, StickyNote, FileText, Search, X } from 'lucide-react';
import { useBoard, BoardRow, BoardColumn } from '@/hooks/useBoard';
import { useBoardCellFiles } from '@/hooks/useBoardCellFiles';
import { useBoardRowNotes } from '@/hooks/useBoardRowNotes';
import { RowNoteDialog } from '@/components/board/RowNoteDialog';
import { ColumnNoteDialog } from '@/components/board/ColumnNoteDialog';
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

interface ColumnHeaderProps {
  column: BoardColumn;
  onRename: (name: string) => void;
  onChangeType: (type: BoardColumnType) => void;
  onManageOptions: () => void;
  onConfigureConnect: () => void;
  onEditNotes: () => void;
  onDelete?: () => void;
  isPrimary?: boolean;
}

function ColumnHeader({ column, onRename, onChangeType, onManageOptions, onConfigureConnect, onEditNotes, onDelete, isPrimary }: ColumnHeaderProps) {
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
                <DropdownMenuItem onClick={onManageOptions}>Manage status options</DropdownMenuItem>
              )}
              {column.type === 'connect' && !isPrimary && (
                <DropdownMenuItem onClick={onConfigureConnect}>Configure connection</DropdownMenuItem>
              )}
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
    deleteColumn,
    reorderColumns,
    addRow,
    deleteRow,
    setCellValue,
    getCellValue,
  } = useBoard(id);

  const rowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const { getFiles, uploadFile, deleteFile, refreshSignedUrl } = useBoardCellFiles(rowIds);
  const { getNote, saveNote } = useBoardRowNotes(rowIds);

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

  const groupByColumn = columns.find((c) => c.id === board?.group_by_column_id);

  const grouped = useMemo(() => {
    if (!board?.group_by_column_id || !groupByColumn) {
      return [{ key: '__all__', label: null, rows }];
    }
    const groups: Record<string, BoardRow[]> = {};
    rows.forEach((row) => {
      const raw = getCellValue(row.id, board.group_by_column_id!);
      let key: string;
      if (groupByColumn.type === 'status') {
        const opt = groupByColumn.options.find((o) => o.id === raw);
        key = opt?.label || '(Ungrouped)';
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
  }, [rows, board?.group_by_column_id, groupByColumn, getCellValue]);

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

  const groupableColumns = columns.filter((c) => c.type !== 'files' && c.type !== 'link' && c.type !== 'connect');
  const statusDialogColumn = columns.find((c) => c.id === statusDialogColumnId) || null;
  const connectDialogColumn = columns.find((c) => c.id === connectDialogColumnId) || null;

  return (
    <div className="w-full p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/boards')}>
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
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Group by:</span>
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

      <div className="border border-border rounded-lg overflow-x-auto bg-card">
        <table className="border-collapse" style={{ width: 'max-content', minWidth: '100%' }}>
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="sticky left-0 z-10 border-r w-16 border-black shadow-none bg-inherit"></th>
              {columns.map((col, idx) => {
                const w = liveWidths[col.id] ?? col.width;
                return (
                  <th
                    key={col.id}
                    style={{ width: w, minWidth: w, maxWidth: w }}
                    className={cn(
                      'border-r border-border text-left relative transition-colors',
                      idx === 0 && 'sticky left-16 bg-muted/40 z-10',
                      dragOverColId === col.id && draggedColId !== col.id && 'bg-primary/10',
                      draggedColId === col.id && 'opacity-40'
                    )}
                    draggable={idx !== 0}
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
                      onDelete={columns.length > 1 && idx !== 0 ? () => deleteColumn(col.id) : undefined}
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
              <th className="w-12 px-2">
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
                columns={columns}
                liveWidths={liveWidths}
                collapsed={!!collapsedGroups[group.key]}
                onToggle={() =>
                  setCollapsedGroups((s) => ({ ...s, [group.key]: !s[group.key] }))
                }
                getCellValue={getCellValue}
                setCellValue={setCellValue}
                deleteRow={deleteRow}
                getFiles={getFiles}
                uploadFile={uploadFile}
                deleteFile={deleteFile}
                refreshSignedUrl={refreshSignedUrl}
                getNote={getNote}
                onOpenNote={setNoteRowId}
                onConfigureConnect={setConnectDialogColumnId}
                highlightRowId={activeHighlight}
              />
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="text-center py-8 text-muted-foreground">
                  No rows yet — click "+ Add row" to start
                </td>
              </tr>
            )}

            <tr>
              <td className="p-2 sticky left-0 bg-card z-10 w-16">
                <Button variant="ghost" size="sm" onClick={() => addRow()}>
                  <Plus className="h-3 w-3" />
                  Add row
                </Button>
              </td>
              <td colSpan={columns.length + 1}></td>
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
          initialContent={getNote(noteRowId)}
          rowLabel={
            columns[0] ? getCellValue(noteRowId, columns[0].id) : ''
          }
          onSave={(content) => saveNote(noteRowId, content)}
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
  deleteRow: (id: string) => void;
  getFiles: ReturnType<typeof useBoardCellFiles>['getFiles'];
  uploadFile: ReturnType<typeof useBoardCellFiles>['uploadFile'];
  deleteFile: ReturnType<typeof useBoardCellFiles>['deleteFile'];
  refreshSignedUrl: ReturnType<typeof useBoardCellFiles>['refreshSignedUrl'];
  getNote: (row_id: string) => string;
  onOpenNote: (row_id: string) => void;
  onConfigureConnect: (col_id: string) => void;
  highlightRowId?: string | null;
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
  deleteRow,
  getFiles,
  uploadFile,
  deleteFile,
  refreshSignedUrl,
  getNote,
  onOpenNote,
  onConfigureConnect,
  highlightRowId,
}: GroupSectionProps) {
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
            <td className="sticky left-0 bg-card z-10 border-r border-border w-16 px-1 group-hover:bg-accent/20">
              <div className="flex items-center justify-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-6 w-6 shrink-0',
                    getNote(row.id)
                      ? 'text-primary opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  )}
                  onClick={() => onOpenNote(row.id)}
                  title={getNote(row.id) ? 'Edit note' : 'Add note'}
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
              return (
                <td
                  key={col.id}
                  style={{ width: w, minWidth: w, maxWidth: w }}
                  className={cn(
                    'border-r border-border p-0 align-top',
                    idx === 0 && 'sticky left-16 bg-card z-10 group-hover:bg-accent/20'
                  )}
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
}: CellRendererProps) {
  switch (column.type) {
    case 'date':
      return <DateCell value={value} onSave={onSave} />;
    case 'checkbox':
      return <CheckboxCell value={value} onSave={onSave} />;
    case 'status':
      return <StatusCell value={value} options={column.options} onSave={onSave} />;
    case 'files':
      return (
        <FilesCell
          files={files}
          onUpload={onUploadFile}
          onDelete={onDeleteFile}
          onOpen={onOpenFile}
        />
      );
    case 'link':
      return <LinkCell value={value} onSave={onSave} />;
    case 'connect':
      return (
        <ConnectBoardCell
          value={value}
          onSave={onSave}
          connectBoardId={column.connect_board_id}
          mirrorColumnId={column.connect_mirror_column_id}
          onConfigure={onConfigureConnect}
        />
      );
    case 'text':
    default:
      return <TextCell value={value} onSave={onSave} />;
  }
}
