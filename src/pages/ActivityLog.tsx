import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, History, ChevronDown, ChevronRight, Search, Trash2, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ActivityFilters,
  ActivityLog as ActivityLogRow,
  TABLE_LABELS,
  tableLabel,
  useActivityLogs,
  useActivityLogUsers,
} from '@/hooks/useActivityLogs';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useIsOrgAdmin } from '@/hooks/useIsOrgAdmin';

const HIDDEN_FIELDS = new Set(['id', 'user_id', 'organization_id', 'created_at', 'updated_at']);

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function actionMeta(action: string) {
  switch (action) {
    case 'insert':
      return { label: 'Created', className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30', Icon: Plus };
    case 'delete':
      return { label: 'Deleted', className: 'bg-destructive/15 text-destructive border-destructive/30', Icon: Trash2 };
    default:
      return { label: 'Updated', className: 'bg-sky-500/15 text-sky-600 border-sky-500/30', Icon: Pencil };
  }
}

function LogRow({ log }: { log: ActivityLogRow }) {
  const [open, setOpen] = useState(false);
  const meta = actionMeta(log.action);
  const isDelete = log.action === 'delete';

  const changed = useMemo(() => {
    if (log.action === 'update' && log.changed_fields) {
      return Object.entries(log.changed_fields).filter(([k]) => !HIDDEN_FIELDS.has(k));
    }
    return [];
  }, [log]);

  const snapshot = useMemo(() => {
    const data = isDelete ? log.old_data : log.new_data;
    if (!data) return [];
    return Object.entries(data).filter(([k, v]) => !HIDDEN_FIELDS.has(k) && v !== null && v !== '');
  }, [isDelete, log]);

  return (
    <div className={`border-b last:border-b-0 ${isDelete ? 'bg-destructive/5' : ''}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-muted/50 transition-colors"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
        )}
        <div className="w-16 shrink-0 text-xs text-muted-foreground mt-1">
          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <Badge variant="outline" className={`shrink-0 gap-1 ${meta.className}`}>
          <meta.Icon className="h-3 w-3" />
          {meta.label}
        </Badge>
        <div className="min-w-0 flex-1">
          <div className="font-medium break-words">{log.record_label || '(no name)'}</div>
          <div className="text-xs text-muted-foreground">
            {tableLabel(log.table_name)} · {log.user_name}
          </div>
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 pl-12 space-y-2">
          {log.action === 'update' ? (
            changed.length === 0 ? (
              <div className="text-sm text-muted-foreground">No visible field changes.</div>
            ) : (
              <div className="space-y-1">
                {changed.map(([field, pair]) => (
                  <div key={field} className="text-sm flex flex-wrap gap-2">
                    <span className="font-medium">{field}:</span>
                    <span className="text-muted-foreground line-through break-all">{formatValue(pair?.[0])}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="break-all">{formatValue(pair?.[1])}</span>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {snapshot.map(([field, value]) => (
                <div key={field} className="text-sm flex gap-2">
                  <span className="font-medium shrink-0">{field}:</span>
                  <span className="text-muted-foreground break-all">{formatValue(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActivityLog() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { isOrgAdmin, loading: orgLoading } = useIsOrgAdmin();
  const users = useActivityLogUsers();

  const [action, setAction] = useState<ActivityFilters['action']>('all');
  const [tableName, setTableName] = useState<string>('all');
  const [userId, setUserId] = useState<string>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const filters = useMemo<ActivityFilters>(
    () => ({ action, tableName, userId, from, to, search }),
    [action, tableName, userId, from, to, search]
  );

  const { logs, loading, loadingMore, hasMore, loadMore } = useActivityLogs(filters);

  const grouped = useMemo(() => {
    const map = new Map<string, ActivityLogRow[]>();
    logs.forEach(log => {
      const day = new Date(log.created_at).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(log);
    });
    return Array.from(map.entries());
  }, [logs]);

  const permissionLoading = adminLoading || orgLoading;
  const allowed = isAdmin || isOrgAdmin;

  if (!permissionLoading && !allowed) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/knowledge-base')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Knowledge Base
        </Button>
        <Card className="p-10 text-center text-muted-foreground">
          The Activity Log is available to organization owners and admins only.
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/knowledge-base')} className="mb-2 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Knowledge Base
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <History className="h-7 w-7 text-primary" />
          Activity Log
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Every record created, edited, or deleted — who did it and when.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Action</Label>
            <Select value={action} onValueChange={v => setAction(v as ActivityFilters['action'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="insert">Created</SelectItem>
                <SelectItem value="update">Updated</SelectItem>
                <SelectItem value="delete">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Record type</Label>
            <Select value={tableName} onValueChange={setTableName}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {Object.keys(TABLE_LABELS).map(key => (
                  <SelectItem key={key} value={key}>{TABLE_LABELS[key]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">User</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Search name / number</Label>
            <div className="flex gap-2">
              <Input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') setSearch(searchInput);
                }}
                placeholder="e.g. A1-046"
              />
              <Button variant="secondary" onClick={() => setSearch(searchInput)}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-muted-foreground text-center py-12">Loading activity...</div>
      ) : logs.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <History className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <div className="font-medium">No activity recorded yet for these filters.</div>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(([day, entries]) => (
            <Card key={day} className="overflow-hidden">
              <div className="px-3 py-2 bg-muted/60 text-sm font-semibold">{day}</div>
              <div>
                {entries.map(log => (
                  <LogRow key={log.id} log={log} />
                ))}
              </div>
            </Card>
          ))}
          {hasMore && (
            <div className="text-center">
              <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading...' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
