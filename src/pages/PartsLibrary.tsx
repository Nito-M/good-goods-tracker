import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, ArrowLeft, Folder, FolderPlus, ChevronRight, Pencil, MoreVertical, FolderInput, CheckSquare, X, LayoutList, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useParts } from '@/hooks/useParts';
import { usePartFolders } from '@/hooks/usePartFolders';
import { PartsCsvImport } from '@/components/PartsCsvImport';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ImageViewerDialog } from '@/components/ImageViewerDialog';
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
  const { parts, loading: partsLoading, deletePart, updatePart, getSignedUrl } = useParts();
  const { folders, loading: foldersLoading, addFolder, renameFolder, deleteFolder, getFoldersInParent, getBreadcrumb } = usePartFolders();
  const [search, setSearch] = useState('');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [renamingFolder, setRenamingFolder] = useState<{ id: string; name: string; description?: string | null } | null>(null);
  const [movingPartId, setMovingPartId] = useState<string | null>(null);
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'lines' | 'cards'>(() => {
    return (localStorage.getItem('partsLibraryViewMode') as 'lines' | 'cards') || 'lines';
  });
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
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
    const id = await addFolder(newFolderName.trim(), currentFolderId, newFolderDescription.trim() || null);
    if (id) {
      toast({ title: 'Folder created' });
      setNewFolderOpen(false);
      setNewFolderName('');
      setNewFolderDescription('');
    }
  };

  const handleRenameFolder = async () => {
    if (!renamingFolder || !renamingFolder.name.trim()) return;
    const ok = await renameFolder(renamingFolder.id, renamingFolder.name.trim(), renamingFolder.description);
    if (ok) {
      toast({ title: 'Folder updated' });
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

  const toggleSelect = (id: string) => {
    setSelectedPartIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkMove = async (targetFolderId: string | null) => {
    let moved = 0;
    for (const id of selectedPartIds) {
      const ok = await updatePart(id, { folderId: targetFolderId });
      if (ok) moved++;
    }
    toast({ title: `${moved} part${moved !== 1 ? 's' : ''} moved` });
    setSelectedPartIds(new Set());
    setSelectMode(false);
    setBulkMoveOpen(false);
  };

  const openImageViewer = async (storagePath: string) => {
    const url = await getSignedUrl('part-images', storagePath);
    if (url) {
      setViewerImageUrl(url);
      setViewerOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="px-4 sm:px-6 lg:px-8">
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
              {selectMode ? (
                <>
                  <span className="text-sm text-muted-foreground">{selectedPartIds.size} selected</span>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={selectedPartIds.size === 0}
                    onClick={() => setBulkMoveOpen(true)}
                    className="gap-2"
                  >
                    <FolderInput className="h-4 w-4" /> Move Selected
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={selectedPartIds.size === 0}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" /> Delete Selected
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedPartIds.size} part{selectedPartIds.size !== 1 ? 's' : ''}?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. All selected parts will be permanently deleted.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={async () => {
                            let deleted = 0;
                            for (const id of selectedPartIds) {
                              const ok = await deletePart(id);
                              if (ok) deleted++;
                            }
                            toast({ title: `${deleted} part${deleted !== 1 ? 's' : ''} deleted` });
                            setSelectedPartIds(new Set());
                            setSelectMode(false);
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="ghost" size="icon" onClick={() => { setSelectMode(false); setSelectedPartIds(new Set()); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center border border-border rounded-md overflow-hidden">
                    <Button
                      variant={viewMode === 'lines' ? 'default' : 'ghost'}
                      size="icon"
                      className="rounded-none h-9 w-9"
                      onClick={() => { setViewMode('lines'); localStorage.setItem('partsLibraryViewMode', 'lines'); }}
                      title="List view"
                    >
                      <LayoutList className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'cards' ? 'default' : 'ghost'}
                      size="icon"
                      className="rounded-none h-9 w-9"
                      onClick={() => { setViewMode('cards'); localStorage.setItem('partsLibraryViewMode', 'cards'); }}
                      title="Card view"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => setSelectMode(true)} title="Select multiple">
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                  <PartsCsvImport currentFolderId={currentFolderId} />
                  <Button variant="outline" onClick={() => setNewFolderOpen(true)} className="gap-2">
                    <FolderPlus className="h-4 w-4" />
                    New Folder
                  </Button>
                  <Button onClick={() => navigate('/parts/library/new')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Part
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6 lg:px-8">
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
              <div className="border border-border rounded-md overflow-hidden mb-4">
                {filteredFolders.map((folder, i) => (
                  <div
                    key={folder.id}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors group ${i > 0 ? 'border-t border-border' : ''}`}
                    onClick={() => { setCurrentFolderId(folder.id); setSearch(''); }}
                  >
                    <Folder className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground truncate block">{folder.name}</span>
                      {folder.description && (
                        <span className="text-xs text-muted-foreground truncate block mt-0.5">{folder.description}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {folders.filter(f => f.parentId === folder.id).length} folders · {parts.filter(p => p.folderId === folder.id).length} parts
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent onClick={e => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => setRenamingFolder({ id: folder.id, name: folder.name, description: folder.description })}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteFolder(folder.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
            ) : filtered.length > 0 && (
              viewMode === 'lines' ? (
                <div className="border border-border rounded-md overflow-hidden">
                  {filtered.map((part, i) => (
                    <div
                      key={part.id}
                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors group ${i > 0 ? 'border-t border-border' : ''} ${selectMode && selectedPartIds.has(part.id) ? 'bg-primary/5' : ''}`}
                      onClick={() => {
                        if (selectMode) { toggleSelect(part.id); }
                        else { navigate(`/parts/library/${part.id}`); }
                      }}
                    >
                      {selectMode && (
                        <div onClick={e => e.stopPropagation()} className="shrink-0">
                          <Checkbox checked={selectedPartIds.has(part.id)} onCheckedChange={() => toggleSelect(part.id)} />
                        </div>
                      )}
                      <div 
                        className="h-10 w-10 bg-muted rounded overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (part.imageUrl) {
                            openImageViewer(part.imageUrl);
                          }
                        }}
                      >
                        {part.imageUrl ? <PartImage storagePath={part.imageUrl} /> : <span className="text-muted-foreground text-[10px]">—</span>}
                      </div>
                      <span className="font-medium text-foreground truncate flex-1 min-w-0">{part.name}</span>
                      <span className="text-sm text-muted-foreground truncate w-28 shrink-0 hidden sm:block">{part.sku || '—'}</span>
                      <span className="text-sm font-medium text-primary w-24 text-right shrink-0 hidden sm:block">
                        {part.price > 0 ? formatCurrency(part.price) : '—'}
                      </span>
                      <div className="flex gap-1 shrink-0 hidden md:flex">
                        {part.dxfUrl1 && <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded">DXF 1</span>}
                        {part.dxfUrl2 && <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded">DXF 2</span>}
                      </div>
                      <PartActionsDropdown partId={part.id} onMove={() => setMovingPartId(part.id)} onDelete={handleDelete} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filtered.map((part) => (
                    <Card
                      key={part.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow group relative ${selectMode && selectedPartIds.has(part.id) ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => {
                        if (selectMode) { toggleSelect(part.id); }
                        else { navigate(`/parts/library/${part.id}`); }
                      }}
                    >
                      {selectMode && (
                        <div className="absolute top-2 left-2 z-10" onClick={e => e.stopPropagation()}>
                          <Checkbox checked={selectedPartIds.has(part.id)} onCheckedChange={() => toggleSelect(part.id)} />
                        </div>
                      )}
                      <div 
                        className="aspect-square bg-muted rounded-t-lg overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (part.imageUrl) {
                            openImageViewer(part.imageUrl);
                          }
                        }}
                      >
                        {part.imageUrl ? <PartImage storagePath={part.imageUrl} className="w-full h-full" /> : <span className="text-muted-foreground text-3xl">—</span>}
                      </div>
                      <CardContent className="p-3">
                        <p className="font-medium text-foreground text-sm truncate">{part.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{part.sku || 'No SKU'}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-medium text-primary">
                            {part.price > 0 ? formatCurrency(part.price) : '—'}
                          </span>
                          <div className="flex gap-1">
                            {part.dxfUrl1 && <span className="text-[10px] bg-accent text-accent-foreground px-1 py-0.5 rounded">DXF</span>}
                          </div>
                        </div>
                      </CardContent>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <PartActionsDropdown partId={part.id} onMove={() => setMovingPartId(part.id)} onDelete={handleDelete} />
                      </div>
                    </Card>
                  ))}
                </div>
              )
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Name</Label>
              <Input
                id="folder-name"
                placeholder="Folder name"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleCreateFolder()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folder-description">Description (optional)</Label>
              <Textarea
                id="folder-description"
                placeholder="Add a description..."
                value={newFolderDescription}
                onChange={e => setNewFolderDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={!!renamingFolder} onOpenChange={open => !open && setRenamingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>Update the folder name and description.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-folder-name">Name</Label>
              <Input
                id="edit-folder-name"
                placeholder="Folder name"
                value={renamingFolder?.name || ''}
                onChange={e => renamingFolder && setRenamingFolder({ ...renamingFolder, name: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleRenameFolder()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-folder-description">Description (optional)</Label>
              <Textarea
                id="edit-folder-description"
                placeholder="Add a description..."
                value={renamingFolder?.description || ''}
                onChange={e => renamingFolder && setRenamingFolder({ ...renamingFolder, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingFolder(null)}>Cancel</Button>
            <Button onClick={handleRenameFolder} disabled={!renamingFolder?.name.trim()}>Save</Button>
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

      {/* Bulk Move Dialog */}
      <Dialog open={bulkMoveOpen} onOpenChange={open => !open && setBulkMoveOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move {selectedPartIds.size} part{selectedPartIds.size !== 1 ? 's' : ''} to folder</DialogTitle>
            <DialogDescription>Select a destination folder.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            <button
              onClick={() => handleBulkMove(null)}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm flex items-center gap-2"
            >
              <Folder className="h-4 w-4 text-muted-foreground" />
              Root (no folder)
            </button>
            {folders.map(folder => (
              <button
                key={folder.id}
                onClick={() => handleBulkMove(folder.id)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm flex items-center gap-2"
              >
                <Folder className="h-4 w-4 text-primary" />
                {getBreadcrumb(folder.id).map(f => f.name).join(' / ')}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkMoveOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      <ImageViewerDialog
        imageUrl={viewerImageUrl}
        alt="Part"
        open={viewerOpen}
        onOpenChange={setViewerOpen}
      />
    </div>
  );
}

function PartActionsDropdown({ partId, onMove, onDelete }: { partId: string; onMove: () => void; onDelete: (id: string, e: React.MouseEvent) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onClick={e => e.stopPropagation()}>
        <DropdownMenuItem onClick={onMove}>
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
              <AlertDialogAction onClick={(e) => onDelete(partId, e)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PartImage({ storagePath, className }: { storagePath: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const { getSignedUrl } = useParts();

  useEffect(() => {
    getSignedUrl('part-images', storagePath).then(setUrl);
  }, [storagePath]);

  if (!url) return <span className="text-muted-foreground text-sm">Loading...</span>;
  return <img src={url} alt="Part" className={className || "w-full h-full object-contain"} />;
}
