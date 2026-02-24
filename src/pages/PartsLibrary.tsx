import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, ArrowLeft, Folder, FolderPlus, ChevronRight, Pencil, MoreVertical, FolderInput } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useParts } from '@/hooks/useParts';
import { usePartFolders } from '@/hooks/usePartFolders';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function PartsLibrary() {
  const navigate = useNavigate();
  const { parts, loading: partsLoading, deletePart, updatePart } = useParts();
  const { folders, loading: foldersLoading, addFolder, renameFolder, deleteFolder, getFoldersInParent, getBreadcrumb } = usePartFolders();
  const [search, setSearch] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolder, setRenamingFolder] = useState<{ id: string; name: string } | null>(null);
  const [movingPartId, setMovingPartId] = useState<string | null>(null);
  const { toast } = useToast();

  const loading = partsLoading || foldersLoading;
  const breadcrumb = getBreadcrumb(currentFolderId);
  const childFolders = getFoldersInParent(currentFolderId);
  const partsInFolder = parts.filter(p => p.folderId === currentFolderId);

  const filtered = search
    ? parts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      )
    : partsInFolder;

  const filteredFolders = search
    ? folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : childFolders;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await deletePart(id);
    if (ok) toast({ title: 'Part deleted' });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const id = await addFolder(newFolderName.trim(), currentFolderId);
    if (id) {
      toast({ title: 'Folder created' });
      setNewFolderOpen(false);
      setNewFolderName('');
    }
  };

  const handleRenameFolder = async () => {
    if (!renamingFolder || !renamingFolder.name.trim()) return;
    const ok = await renameFolder(renamingFolder.id, renamingFolder.name.trim());
    if (ok) {
      toast({ title: 'Folder renamed' });
      setRenamingFolder(null);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    const ok = await deleteFolder(id);
    if (ok) toast({ title: 'Folder deleted' });
  };

  const handleMovePart = async (targetFolderId: string | null) => {
    if (!movingPartId) return;
    const ok = await updatePart(movingPartId, { folderId: targetFolderId });
    if (ok) {
      toast({ title: 'Part moved' });
      setMovingPartId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => {
                if (currentFolderId) {
                  const parent = folders.find(f => f.id === currentFolderId);
                  setCurrentFolderId(parent?.parentId ?? null);
                } else {
                  navigate('/parts');
                }
              }}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Parts Library</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setNewFolderOpen(true)} className="gap-2">
                <FolderPlus className="h-4 w-4" />
                New Folder
              </Button>
              <Button onClick={() => navigate('/parts/library/new')} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Part
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 mb-4 text-sm text-muted-foreground flex-wrap">
            <button onClick={() => setCurrentFolderId(null)} className="hover:text-foreground transition-colors">
              Root
            </button>
            {breadcrumb.map(folder => (
              <span key={folder.id} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                <button
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="hover:text-foreground transition-colors"
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </div>
        )}

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
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <>
            {/* Folders */}
            {filteredFolders.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {filteredFolders.map(folder => (
                  <Card
                    key={folder.id}
                    className="cursor-pointer hover:shadow-md transition-shadow group relative"
                    onClick={() => { setCurrentFolderId(folder.id); setSearch(''); }}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <Folder className="h-8 w-8 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{folder.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {folders.filter(f => f.parentId === folder.id).length} folders · {parts.filter(p => p.folderId === folder.id).length} parts
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent onClick={e => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => setRenamingFolder({ id: folder.id, name: folder.name })}>
                            <Pencil className="h-4 w-4 mr-2" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteFolder(folder.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Parts */}
            {filtered.length === 0 && filteredFolders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  {search ? 'No results found' : 'This folder is empty'}
                </p>
                {!search && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setNewFolderOpen(true)}>Create a folder</Button>
                    <Button onClick={() => navigate('/parts/library/new')}>Add a part</Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(part => (
                  <Card
                    key={part.id}
                    className="cursor-pointer hover:shadow-md transition-shadow group relative"
                    onClick={() => navigate(`/parts/library/${part.id}`)}
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
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">SKU: {part.sku || '—'}</p>
                        {part.price > 0 && <span className="text-sm font-semibold text-primary">{formatCurrency(part.price)}</span>}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {part.dxfUrl1 && <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded">DXF 1</span>}
                        {part.dxfUrl2 && <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded">DXF 2</span>}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost" size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                            onClick={e => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent onClick={e => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => setMovingPartId(part.id)}>
                            <FolderInput className="h-4 w-4 mr-2" /> Move to folder
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </DropdownMenuItem>
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
            <DialogDescription>Create a new folder to organize your parts.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={!!renamingFolder} onOpenChange={open => !open && setRenamingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>Enter a new name for this folder.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={renamingFolder?.name || ''}
            onChange={e => renamingFolder && setRenamingFolder({ ...renamingFolder, name: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleRenameFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingFolder(null)}>Cancel</Button>
            <Button onClick={handleRenameFolder} disabled={!renamingFolder?.name.trim()}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Move Part to Folder Dialog */}
      <Dialog open={!!movingPartId} onOpenChange={open => !open && setMovingPartId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to folder</DialogTitle>
            <DialogDescription>Select a destination folder for this part.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            <button
              onClick={() => handleMovePart(null)}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm flex items-center gap-2"
            >
              <Folder className="h-4 w-4 text-muted-foreground" />
              Root (no folder)
            </button>
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => handleMovePart(folder.id)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm flex items-center gap-2"
              >
                <Folder className="h-4 w-4 text-primary" />
                {getBreadcrumb(folder.id).map(f => f.name).join(' / ')}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovingPartId(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
