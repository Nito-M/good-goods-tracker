import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, ChevronRight, CheckCircle2, Clock, Pencil, Check, X, Trash2, Search } from 'lucide-react';
import { AssemblyCsvImport } from '@/components/AssemblyCsvImport';
import { useAssemblies } from '@/hooks/useAssemblies';
import { useAssemblyCategories } from '@/hooks/useAssemblyCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';

export function AssemblyTypes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { assemblies, loading, refetch } = useAssemblies();
  const { categories: assemblyCategories, addCategory: addAssemblyCategory } = useAssemblyCategories();

  const [createOpen, setCreateOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingType, setEditingType] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleteType, setDeleteType] = useState<string | null>(null);
  const [deletingType, setDeletingType] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Group assemblies by type, filtering by search query on name + description
  const typeGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = q
      ? assemblies.filter(a =>
          a.name.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q)) ||
          (a.type || 'General').toLowerCase().includes(q)
        )
      : assemblies;

    const map = new Map<string, { count: number; finished: number; totalCost: number }>();
    for (const a of filtered) {
      const t = a.type || 'General';
      const existing = map.get(t) || { count: 0, finished: 0, totalCost: 0 };
      existing.count += 1;
      if (a.status === 'finished') existing.finished += 1;
      map.set(t, existing);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [assemblies, searchQuery]);

  const handleCreateType = async () => {
    const name = newTypeName.trim();
    if (!name || !user) return;
    // Check if type already exists
    if (typeGroups.some(([t]) => t.toLowerCase() === name.toLowerCase())) {
      toast({ title: 'Type already exists', variant: 'destructive' });
      return;
    }
    setCreating(true);
    // Create a placeholder assembly with this type so the type "exists"
    // Actually we just navigate to the page and let them create assemblies there
    setCreating(false);
    setCreateOpen(false);
    setNewTypeName('');
    navigate(`/assemblies/${encodeURIComponent(name)}`);
  };

  const handleRenameType = async (oldType: string) => {
    const newName = editTypeName.trim();
    if (!newName || newName === oldType) { setEditingType(null); return; }
    setSavingEdit(true);
    // Update all assemblies with this type
    const { error } = await supabase
      .from('assemblies')
      .update({ type: newName })
      .eq('type', oldType);
    if (error) {
      toast({ title: 'Error renaming type', variant: 'destructive' });
    } else {
      await refetch();
      toast({ title: 'Type renamed' });
    }
    setSavingEdit(false);
    setEditingType(null);
  };

  const handleDeleteType = async (type: string) => {
    setDeletingType(true);
    // Move all assemblies of this type to "General" (or delete them?)
    // We'll move to General to be safe
    const { error } = await supabase
      .from('assemblies')
      .update({ type: 'General' })
      .eq('type', type);
    if (error) {
      toast({ title: 'Error deleting type', variant: 'destructive' });
    } else {
      await refetch();
      toast({ title: 'Type deleted', description: 'Assemblies moved to General' });
    }
    setDeletingType(false);
    setDeleteType(null);
  };

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-card-foreground">Assemblies</h1>
                <p className="text-xs text-muted-foreground">Choose a type to view its assemblies</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AssemblyCsvImport onComplete={refetch} />
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> New Type
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {!loading && assemblies.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by type, name, or description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        ) : typeGroups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <Layers className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
              {searchQuery.trim() ? (
                <>
                  <h3 className="text-lg font-semibold mb-2">No matching assemblies</h3>
                  <p className="text-muted-foreground mb-6">Try a different search term.</p>
                  <Button variant="outline" onClick={() => setSearchQuery('')}>Clear Search</Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-2">No assembly types yet</h3>
                  <p className="text-muted-foreground mb-6">Create a type to start organizing your assemblies.</p>
                  <Button onClick={() => setCreateOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" /> New Type
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {typeGroups.map(([type, stats]) => {
              const isEditing = editingType === type;
              const allFinished = stats.finished === stats.count;
              const progress = stats.count > 0 ? (stats.finished / stats.count) * 100 : 0;
              return (
                <Card
                  key={type}
                  className="group relative cursor-pointer hover:shadow-md transition-shadow border-border"
                  onClick={() => !isEditing && navigate(`/assemblies/${encodeURIComponent(type)}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <Input
                              value={editTypeName}
                              onChange={e => setEditTypeName(e.target.value)}
                              className="h-7 text-sm"
                              autoFocus
                              onKeyDown={e => { if (e.key === 'Enter') handleRenameType(type); if (e.key === 'Escape') setEditingType(null); }}
                            />
                            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => handleRenameType(type)} disabled={savingEdit}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingType(null)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <h3 className="font-semibold text-base truncate">{type}</h3>
                        )}
                      </div>
                      {!isEditing && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => { setEditingType(type); setEditTypeName(type); }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          {type !== 'General' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteType(type)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="secondary" className="text-xs">{stats.count} assembly{stats.count !== 1 ? 's' : ''}</Badge>
                      {allFinished && stats.count > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-primary font-medium">
                          <CheckCircle2 className="h-3 w-3" /> All finished
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {stats.finished}/{stats.count} finished
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">View all</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Create type dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Assembly Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Type Name</Label>
            <Input
              value={newTypeName}
              onChange={e => setNewTypeName(e.target.value)}
              placeholder="e.g. Trailers, Electrical, Custom..."
              onKeyDown={e => e.key === 'Enter' && handleCreateType()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateType} disabled={!newTypeName.trim() || creating}>
              {creating ? 'Creating...' : 'Create & Open'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete type alert */}
      <AlertDialog open={!!deleteType} onOpenChange={() => setDeleteType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete type "{deleteType}"?</AlertDialogTitle>
            <AlertDialogDescription>
              All assemblies in this type will be moved to "General". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteType && handleDeleteType(deleteType)}
              disabled={deletingType}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingType ? 'Deleting...' : 'Delete Type'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
