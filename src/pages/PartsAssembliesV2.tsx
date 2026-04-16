import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ChevronRight, CheckCircle2, Clock, Boxes } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { usePartsAssembliesV2 } from '@/hooks/usePartsAssembliesV2';
import { useToast } from '@/hooks/use-toast';

function getPartsAssemblyV2Label() {
  try {
    const saved = localStorage.getItem('parts-landing-names');
    const names = saved ? JSON.parse(saved) : {};
    return names['parts-assemblies-v2'] || 'Parts Assemblies 2';
  } catch {
    return 'Parts Assemblies 2';
  }
}

export function PartsAssembliesV2() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { assemblies, loading } = usePartsAssembliesV2();
  const title = getPartsAssemblyV2Label();

  const [createOpen, setCreateOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [creating, setCreating] = useState(false);

  const typeGroups = useMemo(() => {
    const map = new Map<string, { count: number; finished: number }>();
    for (const a of assemblies) {
      const t = a.type || 'General';
      const existing = map.get(t) || { count: 0, finished: 0 };
      existing.count += 1;
      if (a.status === 'finished') existing.finished += 1;
      map.set(t, existing);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [assemblies]);

  const handleCreateType = async () => {
    const name = newTypeName.trim();
    if (!name || !user) return;
    if (typeGroups.some(([t]) => t.toLowerCase() === name.toLowerCase())) {
      toast({ title: 'Type already exists', variant: 'destructive' });
      return;
    }
    setCreating(false);
    setCreateOpen(false);
    setNewTypeName('');
    navigate(`/parts/assemblies-v2/${encodeURIComponent(name)}`);
  };

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/parts')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Boxes className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-card-foreground">{title}</h1>
                <p className="text-xs text-muted-foreground">Assemblies built from Parts Library 1 and Parts Assemblies 1</p>
              </div>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> New Type
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading...</div>
        ) : typeGroups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <Boxes className="h-16 w-16 text-muted-foreground mb-4 opacity-30" />
              <h3 className="text-lg font-semibold mb-2">No assembly types yet</h3>
              <p className="text-muted-foreground mb-6">Create a type to start organizing your second parts assemblies.</p>
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> New Type
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {typeGroups.map(([type, stats]) => {
              const allFinished = stats.finished === stats.count;
              const progress = stats.count > 0 ? (stats.finished / stats.count) * 100 : 0;
              return (
                <Card
                  key={type}
                  className="group relative cursor-pointer hover:shadow-md transition-shadow border-border"
                  onClick={() => navigate(`/parts/assemblies-v2/${encodeURIComponent(type)}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-base truncate">{type}</h3>
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

                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
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
              placeholder="e.g. Trailer Kits, Bracket Groups..."
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
    </div>
  );
}
