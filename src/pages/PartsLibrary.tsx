import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useParts } from '@/hooks/useParts';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function PartsLibrary() {
  const navigate = useNavigate();
  const { parts, loading, deletePart } = useParts();
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const filtered = parts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await deletePart(id);
    if (ok) toast({ title: 'Part deleted' });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Parts Library</h1>
            <Button onClick={() => navigate('/parts/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Part
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading parts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">No parts found</p>
            <Button onClick={() => navigate('/parts/new')}>Add your first part</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(part => (
              <Card
                key={part.id}
                className="cursor-pointer hover:shadow-md transition-shadow group relative"
                onClick={() => navigate(`/parts/${part.id}`)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-md mb-3 overflow-hidden flex items-center justify-center">
                    {part.imageUrl ? (
                      <PartImage storagePath={part.imageUrl} />
                    ) : (
                      <span className="text-muted-foreground text-sm">No image</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground truncate">{part.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">SKU: {part.sku || '—'}</p>
                  <div className="flex gap-1 mt-1">
                    {part.dxfUrl1 && <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded">DXF 1</span>}
                    {part.dxfUrl2 && <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded">DXF 2</span>}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                        onClick={e => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={e => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete part?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => handleDelete(part.id, e)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function PartImage({ storagePath }: { storagePath: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const { getSignedUrl } = useParts();

  useEffect(() => {
    getSignedUrl('part-images', storagePath).then(setUrl);
  }, [storagePath]);

  if (!url) return <span className="text-muted-foreground text-sm">Loading...</span>;
  return <img src={url} alt="Part" className="w-full h-full object-contain" />;
}
