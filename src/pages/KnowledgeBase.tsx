import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { ArrowLeft, BookOpen, Plus, Search, Folder, FolderPlus, ChevronRight, ChevronDown, Trash2, Pencil, FileText, LayoutGrid, Rows3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSops, SopCategory, SopListItem } from '@/hooks/useSops';
import { useInventory } from '@/hooks/useInventory';
import { supabase } from '@/integrations/supabase/client';

interface CategoryNode extends SopCategory {
  children: CategoryNode[];
}

function buildTree(cats: SopCategory[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>();
  cats.forEach(c => byId.set(c.id, { ...c, children: [] }));
  const roots: CategoryNode[] = [];
  cats.forEach(c => {
    const node = byId.get(c.id)!;
    if (c.parent_id && byId.has(c.parent_id)) byId.get(c.parent_id)!.children.push(node);
    else roots.push(node);
  });
  return roots;
}

function statusColor(s: string) {
  if (s === 'active') return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
  if (s === 'obsolete') return 'bg-muted text-muted-foreground';
  return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
}

export default function KnowledgeBase() {
  const { typeId } = useParams<{ typeId: string }>();
  const { categories, sops, createCategory, renameCategory, deleteCategory, createSop, deleteSop } = useSops(typeId ?? null);
  const { allItems } = useInventory();
  const navigate = useNavigate();
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'full'>(() =>
    (localStorage.getItem('kb_sop_view_mode') as 'grid' | 'full') || 'grid');
  const changeViewMode = (m: 'grid' | 'full') => {
    setViewMode(m);
    localStorage.setItem('kb_sop_view_mode', m);
  };
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [type, setType] = useState<{ name: string; description: string | null; icon: string; color: string } | null>(null);
  useEffect(() => {
    if (!typeId) { setType(null); return; }
    (async () => {
      const { data } = await supabase.from('sop_types' as any).select('name, description, icon, color').eq('id', typeId).maybeSingle();
      setType(data as any);
    })();
  }, [typeId]);

  const TypeIcon = (type && (LucideIcons as any)[type.icon]) || BookOpen;

  const tree = useMemo(() => buildTree(categories), [categories]);

  // For search by part number, resolve which sops reference an item id
  const [itemLinkedSopIds, setItemLinkedSopIds] = useState<Set<string> | null>(null);
  const runPartSearch = async (term: string) => {
    const q = term.trim().toLowerCase();
    if (!q) { setItemLinkedSopIds(null); return; }
    const matched = allItems.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.sku?.toLowerCase().includes(q) ||
      i.internalPartNumber?.toLowerCase().includes(q)
    ).map(i => i.id);
    if (!matched.length) { setItemLinkedSopIds(new Set()); return; }
    const [{ data: stepItems }, { data: bomItems }] = await Promise.all([
      supabase.from('sop_step_items' as any).select('step_id, inventory_item_id, sop_steps!inner(sop_id)').in('inventory_item_id', matched),
      supabase.from('sop_bom_items' as any).select('sop_id').in('inventory_item_id', matched),
    ]);
    const ids = new Set<string>();
    (stepItems as any[] || []).forEach(r => r.sop_steps?.sop_id && ids.add(r.sop_steps.sop_id));
    (bomItems as any[] || []).forEach(r => ids.add(r.sop_id));
    setItemLinkedSopIds(ids);
  };

  const filteredSops = useMemo(() => {
    let list = sops;
    if (selectedCat === '__uncat__') list = list.filter(s => !s.category_id);
    else if (selectedCat) list = list.filter(s => s.category_id === selectedCat);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) ||
        (s.sop_number || '').toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q) ||
        (itemLinkedSopIds?.has(s.id))
      );
    }
    return list;
  }, [sops, selectedCat, search, itemLinkedSopIds]);

  const toggle = (id: string) => {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleNewCategory = async (parentId: string | null) => {
    const name = prompt(parentId ? 'Subfolder name' : 'Category name');
    if (name?.trim()) await createCategory(name.trim(), parentId);
  };

  const handleRename = async (cat: SopCategory) => {
    const name = prompt('Rename', cat.name);
    if (name?.trim() && name !== cat.name) await renameCategory(cat.id, name.trim());
  };

  const handleDelete = async (cat: SopCategory) => {
    if (confirm(`Delete "${cat.name}" and all its subfolders? SOPs inside will become uncategorized.`)) {
      if (selectedCat === cat.id) setSelectedCat(null);
      await deleteCategory(cat.id);
    }
  };

  const handleNewSop = async () => {
    const title = prompt('SOP title');
    if (!title?.trim()) return;
    const catId = selectedCat && selectedCat !== '__uncat__' ? selectedCat : null;
    const created = await createSop(title.trim(), catId);
    if (created) navigate(`/knowledge-base/sop/${created.id}`);
  };

  const renderNode = (node: CategoryNode, depth: number) => {
    const isOpen = expanded.has(node.id);
    const hasKids = node.children.length > 0;
    const active = selectedCat === node.id;
    return (
      <div key={node.id}>
        <div
          className={`group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer ${active ? 'bg-primary/15 text-primary' : 'hover:bg-muted'}`}
          style={{ paddingLeft: depth * 12 + 8 }}
          onClick={() => setSelectedCat(node.id)}
        >
          <button
            className="p-0.5 shrink-0"
            onClick={(e) => { e.stopPropagation(); toggle(node.id); }}
          >
            {hasKids ? (isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)
                     : <span className="inline-block w-3" />}
          </button>
          <Folder className="h-4 w-4 shrink-0 opacity-70" />
          <span className="flex-1 truncate">{node.name}</span>
          <div className="flex items-center gap-0.5 opacity-70">
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleNewCategory(node.id); }} title="Add subcategory">
              <FolderPlus className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 md:opacity-0 md:group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleRename(node); }} title="Rename">
              <Pencil className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive md:opacity-0 md:group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDelete(node); }} title="Delete">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {isOpen && node.children.map(c => renderNode(c, depth + 1))}
      </div>
    );
  };

  return (
    <div className="flex flex-col p-4 md:p-6 gap-3 h-[calc(100vh-4rem)]">
      {/* Breadcrumb + back */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate('/knowledge-base')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
          <Link to="/knowledge-base" className="hover:text-foreground hover:underline">Knowledge Base</Link>
          {type && <><ChevronRight className="h-3 w-3" /><span className="text-foreground font-medium">{type.name}</span></>}
        </div>
      </div>

      {type && (
        <div className="flex items-center gap-3 border-l-4 pl-3 py-1" style={{ borderColor: type.color }}>
          <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
               style={{ backgroundColor: `${type.color}20`, color: type.color }}>
            <TypeIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-lg">{type.name}</div>
            {type.description && <div className="text-xs text-muted-foreground line-clamp-1">{type.description}</div>}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
      <div className="w-full md:w-72 shrink-0 border border-border rounded-lg bg-card flex flex-col">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-4 w-4" /> Categories
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleNewCategory(null)} title="New category">
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-2 space-y-0.5 overflow-y-auto flex-1">
          <div
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer ${!selectedCat ? 'bg-primary/15 text-primary' : 'hover:bg-muted'}`}
            onClick={() => setSelectedCat(null)}
          >
            <BookOpen className="h-4 w-4 opacity-70" /><span>All SOPs</span>
            <span className="ml-auto text-xs text-muted-foreground">{sops.length}</span>
          </div>
          <div
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer ${selectedCat === '__uncat__' ? 'bg-primary/15 text-primary' : 'hover:bg-muted'}`}
            onClick={() => setSelectedCat('__uncat__')}
          >
            <Folder className="h-4 w-4 opacity-70" /><span>Uncategorized</span>
          </div>
          <div className="h-px my-1 bg-border" />
          {tree.length === 0 && (
            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
              No categories yet. Click <FolderPlus className="inline h-3 w-3" /> above.
            </div>
          )}
          {tree.map(n => renderNode(n, 0))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 gap-3">
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); runPartSearch(e.target.value); }}
              placeholder="Search title, SOP number, department, or linked part number..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <Button
              size="icon" variant="ghost" className={`h-9 w-9 rounded-none ${viewMode === 'grid' ? 'bg-muted' : ''}`}
              onClick={() => changeViewMode('grid')} title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="icon" variant="ghost" className={`h-9 w-9 rounded-none ${viewMode === 'full' ? 'bg-muted' : ''}`}
              onClick={() => changeViewMode('full')} title="Full-width rows"
            >
              <Rows3 className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleNewSop}>
            <Plus className="h-4 w-4 mr-1" /> New SOP
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredSops.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <div className="font-medium">No SOPs found</div>
              <div className="text-sm mt-1">Create one to start capturing procedures.</div>
            </Card>
          ) : (
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
              : 'flex flex-col gap-2'}>
              {filteredSops.map(s => (
                <SopCard key={s.id} sop={s} fullWidth={viewMode === 'full'} />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

function SopCard({ sop, fullWidth }: { sop: SopListItem; fullWidth?: boolean }) {
  return (
    <Link to={`/knowledge-base/sop/${sop.id}`}>
      <Card className={`p-4 hover:border-primary transition-colors h-full flex gap-2 ${fullWidth ? 'flex-row items-center justify-between w-full' : 'flex-col'}`}>
        <div className={`flex items-start justify-between gap-2 ${fullWidth ? 'flex-1 min-w-0 items-center' : ''}`}>
          <div className="min-w-0 flex-1">
            <div className={`font-semibold break-words ${fullWidth ? '' : ''}`}>{sop.title}</div>
            {sop.sop_number && <div className="text-xs text-muted-foreground">#{sop.sop_number}</div>}
          </div>
          <Badge variant="outline" className={statusColor(sop.status)}>{sop.status}</Badge>
        </div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mt-auto">
          {sop.department && <span>Dept: {sop.department}</span>}
          {sop.revision_number && <span>Rev: {sop.revision_number}</span>}
          {sop.last_updated_date && <span>Updated {sop.last_updated_date}</span>}
        </div>
      </Card>
    </Link>
  );
}
