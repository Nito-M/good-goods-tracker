import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { BookOpen, Plus, Pencil, Trash2, Archive, ArchiveRestore, GripVertical, ArrowUp, ArrowDown, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useSopTypes, SopType } from '@/hooks/useSopTypes';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';


const ICON_CHOICES = [
  'BookOpen', 'ShoppingCart', 'PackageCheck', 'Factory', 'Flame', 'Wrench',
  'ShieldCheck', 'Truck', 'HardHat', 'Warehouse', 'Users', 'Briefcase',
  'DollarSign', 'Ruler', 'Cog', 'Boxes', 'ClipboardList', 'FileText',
  'Zap', 'Settings', 'Layers', 'Building2', 'Car',
];

const COLOR_CHOICES = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#eab308',
];

function renderIcon(name: string, className = 'h-6 w-6') {
  const Icon = (LucideIcons as any)[name] || BookOpen;
  return <Icon className={className} />;
}

export default function KnowledgeBaseTypes() {
  const { types, stats, loading, createType, updateType, deleteType, reorderTypes } = useSopTypes();
  const isAdmin = true;
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Partial<SopType> | null>(null);

  const visible = useMemo(
    () => types.filter(t => showArchived ? t.archived : !t.archived),
    [types, showArchived]
  );

  const openNew = () => setEditing({ name: '', description: '', icon: 'BookOpen', color: '#3b82f6' });

  const save = async () => {
    if (!editing) return;
    if (editing.id) {
      await updateType(editing.id, editing);
    } else {
      await createType(editing);
    }
    setEditing(null);
  };

  const move = async (id: string, dir: -1 | 1) => {
    const list = visible.map(t => t.id);
    const idx = list.indexOf(id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= list.length) return;
    [list[idx], list[newIdx]] = [list[newIdx], list[idx]];
    await reorderTypes(list);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">Knowledge Base</div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            Company Procedures
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Select a department to browse its Standard Operating Procedures.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Switch checked={showArchived} onCheckedChange={setShowArchived} id="archived" />
            <Label htmlFor="archived" className="cursor-pointer">Show archived</Label>
          </div>
          {isAdmin && (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" /> New Type
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-muted-foreground text-center py-12">Loading...</div>
      ) : visible.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <div className="font-medium">
            {showArchived ? 'No archived SOP types.' : 'No SOP types yet.'}
          </div>
          {isAdmin && !showArchived && (
            <Button className="mt-4" onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" /> Create your first type
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((t, i) => {
            const s = stats[t.id] || { sopCount: 0, categoryCount: 0, lastUpdated: null };
            const recent = s.lastUpdated
              ? (Date.now() - new Date(s.lastUpdated).getTime()) < 1000 * 60 * 60 * 24 * 14
              : false;
            return (
              <Card
                key={t.id}
                onClick={() => navigate(`/knowledge-base/type/${t.id}`)}
                className="group relative p-5 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-l-4 overflow-hidden min-h-[220px] flex flex-col"
                style={{ borderLeftColor: t.color }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-14 w-14 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${t.color}20`, color: t.color }}
                  >
                    {renderIcon(t.icon, 'h-7 w-7')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg truncate">{t.name}</h3>
                      {recent && <Badge variant="outline" className="text-[10px] bg-emerald-500/15 text-emerald-500 border-emerald-500/30">Recently updated</Badge>}
                      {t.archived && <Badge variant="secondary" className="text-[10px]">Archived</Badge>}
                    </div>
                    {t.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-4">{t.description}</p>
                    )}
                    {!t.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-4 italic">No description provided.</p>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-4 flex items-center gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-base" style={{ color: t.color }}>{s.sopCount}</div>
                    <div className="text-xs text-muted-foreground">SOPs</div>
                  </div>
                  <div>
                    <div className="font-semibold text-base">{s.categoryCount}</div>
                    <div className="text-xs text-muted-foreground">Categories</div>
                  </div>
                  {s.lastUpdated && (
                    <div className="ml-auto text-xs text-muted-foreground">
                      Updated {new Date(s.lastUpdated).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div
                    className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(t.id, -1)} title="Move up" disabled={i === 0}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(t.id, 1)} title="Move down" disabled={i === visible.length - 1}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(t)} title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateType(t.id, { archived: !t.archived })} title={t.archived ? 'Unarchive' : 'Archive'}>
                      {t.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      size="icon" variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => confirm(`Delete "${t.name}"? Its categories & SOPs will become unassigned.`) && deleteType(t.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit SOP Type' : 'New SOP Type'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Purchasing" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={2} placeholder="Short summary of what this covers." />
              </div>
              <div>
                <Label>Icon</Label>
                <div className="grid grid-cols-8 gap-1 mt-1 p-2 border rounded-md max-h-40 overflow-y-auto">
                  {ICON_CHOICES.map(n => (
                    <button
                      key={n} type="button"
                      onClick={() => setEditing({ ...editing, icon: n })}
                      className={`h-9 w-9 rounded flex items-center justify-center hover:bg-muted ${editing.icon === n ? 'bg-primary/15 text-primary ring-1 ring-primary' : ''}`}
                      title={n}
                    >
                      {renderIcon(n, 'h-4 w-4')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {COLOR_CHOICES.map(c => (
                    <button
                      key={c} type="button"
                      onClick={() => setEditing({ ...editing, color: c })}
                      className={`h-7 w-7 rounded-full border-2 ${editing.color === c ? 'ring-2 ring-offset-2 ring-primary border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={!editing?.name?.trim()}>{editing?.id ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
