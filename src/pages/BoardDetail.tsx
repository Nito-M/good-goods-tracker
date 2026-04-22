import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight, MoreVertical } from 'lucide-react';
import { useBoard, BoardRow } from '@/hooks/useBoard';
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
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CellInputProps {
  initialValue: string;
  onSave: (value: string) => void;
  className?: string;
}

function CellInput({ initialValue, onSave, className }: CellInputProps) {
  const [value, setValue] = useState(initialValue);
  const initialRef = useRef(initialValue);

  useEffect(() => {
    setValue(initialValue);
    initialRef.current = initialValue;
  }, [initialValue]);

  const commit = () => {
    if (value !== initialRef.current) {
      onSave(value);
      initialRef.current = value;
    }
  };

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        } else if (e.key === 'Escape') {
          setValue(initialRef.current);
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={cn(
        'w-full bg-transparent border-0 outline-none px-3 py-2 text-sm focus:bg-accent/40 focus:ring-2 focus:ring-ring rounded-none',
        className
      )}
    />
  );
}

interface ColumnHeaderProps {
  name: string;
  onRename: (name: string) => void;
  onDelete?: () => void;
}

function ColumnHeader({ name, onRename, onDelete }: ColumnHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  useEffect(() => setValue(name), [name]);

  const commit = () => {
    setEditing(false);
    if (value.trim() && value !== name) onRename(value.trim());
    else setValue(name);
  };

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
              setValue(name);
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
          {name}
        </button>
      )}
      {onDelete && !editing && (
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
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-3 w-3" />
              Delete column
            </DropdownMenuItem>
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
    deleteColumn,
    addRow,
    deleteRow,
    setCellValue,
    getCellValue,
  } = useBoard(id);

  const [titleEditing, setTitleEditing] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (board) setTitleValue(board.name);
  }, [board?.name]);

  const grouped = useMemo(() => {
    if (!board?.group_by_column_id) {
      return [{ key: '__all__', label: null, rows }];
    }
    const groups: Record<string, BoardRow[]> = {};
    rows.forEach((row) => {
      const value = getCellValue(row.id, board.group_by_column_id!) || '(Ungrouped)';
      if (!groups[value]) groups[value] = [];
      groups[value].push(row);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, rs]) => ({ key, label: key, rows: rs }));
  }, [rows, board?.group_by_column_id, getCellValue]);

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

  return (
    <div className="container mx-auto p-6 space-y-4">
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
            {columns.map((c) => (
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
                    name={col.name}
                    onRename={(name) => renameColumn(col.id, name)}
                    onDelete={columns.length > 1 ? () => deleteColumn(col.id) : undefined}
                  />
                </th>
              ))}
              <th className="w-12 px-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => addColumn()}
                  title="Add column"
                >
                  <Plus className="h-4 w-4" />
                </Button>
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
                addRow={addRow}
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
    </div>
  );
}

interface GroupSectionProps {
  groupKey: string;
  label: string | null;
  rows: BoardRow[];
  columns: { id: string; name: string }[];
  collapsed: boolean;
  onToggle: () => void;
  getCellValue: (row_id: string, column_id: string) => string;
  setCellValue: (row_id: string, column_id: string, value: string) => void;
  deleteRow: (id: string) => void;
  addRow: () => void;
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
                  'border-r border-border p-0 min-w-[180px]',
                  idx === 0 && 'sticky left-10 bg-card z-10 group-hover:bg-accent/20'
                )}
              >
                <CellInput
                  initialValue={getCellValue(row.id, col.id)}
                  onSave={(value) => setCellValue(row.id, col.id, value)}
                />
              </td>
            ))}
            <td></td>
          </tr>
        ))}
    </>
  );
}
