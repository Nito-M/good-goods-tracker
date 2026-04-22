import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight, MoreVertical, StickyNote } from 'lucide-react';
import { useBoard, BoardRow, BoardColumn } from '@/hooks/useBoard';
import { useBoardCellFiles } from '@/hooks/useBoardCellFiles';
import { useBoardRowNotes } from '@/hooks/useBoardRowNotes';
import { RowNoteDialog } from '@/components/board/RowNoteDialog';
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

interface ColumnHeaderProps {
  column: BoardColumn;
  onRename: (name: string) => void;
  onChangeType: (type: BoardColumnType) => void;
  onManageOptions: () => void;
  onDelete?: () => void;
  isPrimary?: boolean;
}

function ColumnHeader({ column, onRename, onChangeType, onManageOptions, onDelete, isPrimary }: ColumnHeaderProps) {
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
  ];

  return (
    <div className="flex items-center gap-1 px-2 py-2 group">
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
          className="flex-1 text-left font-medium text-sm truncate hover:text-primary"
        >
          {column.name}
          <span className="ml-1 text-xs text-muted-foreground font-normal">({column.type})</span>
        </button>
      )}
      {!editing && (
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
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing(true)}>Rename</DropdownMenuItem>
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
      )}
    </div>
  );
}

export default function BoardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    board,
    columns,
    rows,
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
  } = useBoard(id);

  const rowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const { getFiles, uploadFile, deleteFile, refreshSignedUrl } = useBoardCellFiles(rowIds);

  const [titleEditing, setTitleEditing] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [statusDialogColumnId, setStatusDialogColumnId] = useState<string | null>(null);

  useEffect(() => {
    if (board) setTitleValue(board.name);
  }, [board?.name]);

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

  const groupableColumns = columns.filter((c) => c.type !== 'files');
  const statusDialogColumn = columns.find((c) => c.id === statusDialogColumnId) || null;

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
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="sticky left-0 bg-muted/40 z-10 border-r border-border w-10"></th>
              {columns.map((col, idx) => (
                <th
                  key={col.id}
                  className={cn(
                    'border-r border-border min-w-[180px] text-left',
                    idx === 0 && 'sticky left-10 bg-muted/40 z-10'
                  )}
                >
                  <ColumnHeader
                    column={col}
                    onRename={(name) => renameColumn(col.id, name)}
                    onChangeType={(type) => setColumnType(col.id, type)}
                    onManageOptions={() => setStatusDialogColumnId(col.id)}
                    onDelete={columns.length > 1 ? () => deleteColumn(col.id) : undefined}
                  />
                </th>
              ))}
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
              <td colSpan={columns.length + 2} className="p-2">
                <Button variant="ghost" size="sm" onClick={() => addRow()}>
                  <Plus className="h-3 w-3" />
                  Add row
                </Button>
              </td>
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
    </div>
  );
}

interface GroupSectionProps {
  groupKey: string;
  label: string | null;
  rows: BoardRow[];
  columns: BoardColumn[];
  collapsed: boolean;
  onToggle: () => void;
  getCellValue: (row_id: string, column_id: string) => string;
  setCellValue: (row_id: string, column_id: string, value: string) => void;
  deleteRow: (id: string) => void;
  getFiles: ReturnType<typeof useBoardCellFiles>['getFiles'];
  uploadFile: ReturnType<typeof useBoardCellFiles>['uploadFile'];
  deleteFile: ReturnType<typeof useBoardCellFiles>['deleteFile'];
  refreshSignedUrl: ReturnType<typeof useBoardCellFiles>['refreshSignedUrl'];
}

function GroupSection({
  label,
  rows,
  columns,
  collapsed,
  onToggle,
  getCellValue,
  setCellValue,
  deleteRow,
  getFiles,
  uploadFile,
  deleteFile,
  refreshSignedUrl,
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
          <tr key={row.id} className="border-b border-border hover:bg-accent/20 group">
            <td className="sticky left-0 bg-card z-10 border-r border-border w-10 text-center group-hover:bg-accent/20">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
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
            </td>
            {columns.map((col, idx) => (
              <td
                key={col.id}
                className={cn(
                  'border-r border-border p-0 min-w-[180px] align-top',
                  idx === 0 && 'sticky left-10 bg-card z-10 group-hover:bg-accent/20'
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
                />
              </td>
            ))}
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
}

function CellRenderer({
  column,
  value,
  onSave,
  files,
  onUploadFile,
  onDeleteFile,
  onOpenFile,
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
    case 'text':
    default:
      return <TextCell value={value} onSave={onSave} />;
  }
}
