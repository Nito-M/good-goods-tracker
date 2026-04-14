import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Trash2, ArrowLeft, Folder, FolderPlus, ChevronRight, Pencil, MoreVertical, FolderInput, CheckSquare, X, LayoutList, LayoutGrid, Copy } from 'lucide-react';
import { setPartDragData, getPartDropData, isPartDrag } from '@/lib/partDragDrop';
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useParts2 } from '@/hooks/useParts2';
import { usePartFolders2 } from '@/hooks/usePartFolders2';
import { PartsCsvImport2 } from '@/components/PartsCsvImport2';
import { PartJsonImport } from '@/components/PartJsonImport';
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

export function PartsLibrary2() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { parts, loading: partsLoading, deletePart, deleteParts, updatePart, duplicatePart, addPart, getSignedUrl } = useParts2();
  const { folders, loading: foldersLoading, addFolder, renameFolder, deleteFolder, moveFolder, getFoldersInParent, getBreadcrumb } = usePartFolders2();
  
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(() => searchParams.get('folder') || null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [renamingFolder, setRenamingFolder] = useState<{ id: string; name: string; description?: string | null } | null>(null);
  const [movingPartId, setMovingPartId] = useState<string | null>(null);
  const [movingFolderId, setMovingFolderId] = useState<string | null>(null);
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'lines' | 'cards'>(() => (localStorage.getItem('partsLibrary2ViewMode') as 'lines' | 'cards') || 'lines');
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const buildLibraryQueryString = useCallback((folderId: string | null, query: string) => {
    const params = new URLSearchParams();
    if (folderId) params.set('folder', folderId);
    if (query) params.set('q', query);
    const nextQuery = params.toString();
    return nextQuery ? `?${nextQuery}` : '';
  }, []);

  const syncLibraryUrl = useCallback((folderId: string | null, query: string, replace = false) => {
    const params = new URLSearchParams();
    if (folderId) params.set('folder', folderId);
    if (query) params.set('q', query);
    if (params.toString() !== searchParams.toString()) setSearchParams(params, { replace });
  }, [searchParams, setSearchParams]);

  const updateLibraryState = useCallback((folderId: string | null, query: string, replace = false) => {
    setCurrentFolderId(folderId); setSearch(query); syncLibraryUrl(folderId, query, replace);
  }, [syncLibraryUrl]);

  const PAGE_SIZE = 40;
  const loading = partsLoading || foldersLoading;
  const breadcrumb = getBreadcrumb(currentFolderId);
  const childFolders = getFoldersInParent(currentFolderId);
  const partsInFolder = parts.filter(p => p.folderId === currentFolderId);
  const filtered = search ? partsInFolder.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())) : partsInFolder;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedParts = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [currentFolderId, search]);
  useEffect(() => {
    const folderFromUrl = searchParams.get('folder') || null;
    const searchFromUrl = searchParams.get('q') || '';
    setCurrentFolderId(prev => prev === folderFromUrl ? prev : folderFromUrl);
    setSearch(prev => prev === searchFromUrl ? prev : searchFromUrl);
  }, [searchParams]);

  const filteredFolders = search ? childFolders.filter(f => f.name.toLowerCase().includes(search.toLowerCase())) : childFolders;
  const libraryLocationSuffix = buildLibraryQueryString(currentFolderId, search);

  const handleDelete = async (id: string, e: React.MouseEvent) => { e.stopPropagation(); const ok = await deletePart(id); if (ok) toast({ title: 'Part deleted' }); };
  const handleCreateFolder = async () => { if (!newFolderName.trim()) return; const id = await addFolder(newFolderName.trim(), currentFolderId, newFolderDescription.trim() || null); if (id) { toast({ title: 'Folder created' }); setNewFolderOpen(false); setNewFolderName(''); setNewFolderDescription(''); } };
  const handleRenameFolder = async () => { if (!renamingFolder || !renamingFolder.name.trim()) return; const ok = await renameFolder(renamingFolder.id, renamingFolder.name.trim(), renamingFolder.description); if (ok) { toast({ title: 'Folder updated' }); setRenamingFolder(null); } };
  const handleDeleteFolder = async (id: string) => { const ok = await deleteFolder(id); if (ok) toast({ title: 'Folder deleted' }); };
  const handleMovePart = async (targetFolderId: string | null) => { if (!movingPartId) return; const ok = await updatePart(movingPartId, { folderId: targetFolderId }); if (ok) { toast({ title: 'Part moved' }); setMovingPartId(null); } };

  const lastSelectedIndex = useRef<number | null>(null);
  const handlePartClick = useCallback((id: string, index: number, e: React.MouseEvent) => {
    if (!selectMode) return;
    if (e.shiftKey && lastSelectedIndex.current !== null) {
      const start = Math.min(lastSelectedIndex.current, index); const end = Math.max(lastSelectedIndex.current, index);
      setSelectedPartIds(prev => { const next = new Set(prev); for (let i = start; i <= end; i++) next.add(filtered[i].id); return next; });
    } else {
      setSelectedPartIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
      lastSelectedIndex.current = index;
    }
  }, [selectMode, filtered]);

  const toggleSelect = (id: string) => { setSelectedPartIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };

  const handleBulkMove = async (targetFolderId: string | null) => {
    let moved = 0;
    for (const id of selectedPartIds) { const ok = await updatePart(id, { folderId: targetFolderId }); if (ok) moved++; }
    toast({ title: `${moved} part${moved !== 1 ? 's' : ''} moved` });
    setSelectedPartIds(new Set()); setSelectMode(false); setBulkMoveOpen(false);
  };

  const openImageViewer = async (storagePath: string) => { const url = await getSignedUrl('part-images-2', storagePath); if (url) { setViewerImageUrl(url); setViewerOpen(true); } };

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent, part: typeof parts[0]) => {
    setPartDragData(e, {
      name: part.name, sku: part.sku, price: part.price,
      description: part.description, hours: part.hours, hourlyRate: part.hourlyRate,
      paintingHours: part.paintingHours, paintingHourlyRate: part.paintingHourlyRate,
      dxfLabel1: part.dxfLabel1, dxfLabel2: part.dxfLabel2,
    });
  }, []);

  const importPartFromJson = useCallback(async (text: string, fileName?: string) => {
    try {
      const data = JSON.parse(text);
      if (!data.name && !data.sku) return false;
      const dupBySku = data.sku && parts.some(p => p.sku && p.sku.toLowerCase() === data.sku.toLowerCase());
      const dupByName = !dupBySku && data.name && parts.some(p => p.name && p.name.toLowerCase() === data.name.toLowerCase());
      if (dupBySku || dupByName) {
        toast({ title: 'Skipped', description: `"${data.sku || data.name}" already exists in this library.`, variant: 'destructive' });
        return false;
      }
      const id = await addPart({ name: data.name || '', sku: data.sku || '', price: data.price ?? 0, description: data.description || undefined, folderId: currentFolderId });
      if (id) toast({ title: 'Part imported', description: `"${data.name || data.sku}" added to library.` });
      return !!id;
    } catch {
      toast({ title: `Failed to import${fileName ? ` ${fileName}` : ''}`, description: 'Invalid JSON format.', variant: 'destructive' });
      return false;
    }
  }, [addPart, currentFolderId, toast, parts]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const data = getPartDropData(e);
    if (data) {
      await importPartFromJson(JSON.stringify(data));
      return;
    }

    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.json'));
    if (files.length === 0) return;
    let imported = 0;
    for (const file of files) {
      const text = await file.text();
      if (await importPartFromJson(text, file.name)) imported++;
    }
    if (imported > 1) toast({ title: `${imported} parts imported` });
  }, [importPartFromJson]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (isPartDrag(e) || e.dataTransfer.types.includes('Files')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setIsDragOver(true); }
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              {currentFolderId ? (
                <Button variant="ghost" size="icon" onClick={() => { const parent = folders.find(f => f.id === currentFolderId); updateLibraryState(parent?.parentId ?? null, ''); }}><ArrowLeft className="h-4 w-4" /></Button>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => navigate('/parts')}><ArrowLeft className="h-4 w-4" /></Button>
              )}
              <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Parts Library 2</h1>
            </div>
            <div className="flex items-center gap-2">
              {selectMode ? (
                <>
                  <span className="text-sm text-muted-foreground">{selectedPartIds.size} selected</span>
                  <Button variant="default" size="sm" disabled={selectedPartIds.size === 0} onClick={() => setBulkMoveOpen(true)} className="gap-2"><FolderInput className="h-4 w-4" /> Move Selected</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="destructive" size="sm" disabled={selectedPartIds.size === 0} className="gap-2"><Trash2 className="h-4 w-4" /> Delete Selected</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete {selectedPartIds.size} part{selectedPartIds.size !== 1 ? 's' : ''}?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => { const ids = Array.from(selectedPartIds); const deleted = await deleteParts(ids); toast({ title: `${deleted} part${deleted !== 1 ? 's' : ''} deleted` }); setSelectedPartIds(new Set()); setSelectMode(false); }}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="ghost" size="icon" onClick={() => { setSelectMode(false); setSelectedPartIds(new Set()); }}><X className="h-4 w-4" /></Button>
                </>
              ) : (
                <>
                  <div className="flex items-center border border-border rounded-md overflow-hidden">
                    <Button variant={viewMode === 'lines' ? 'default' : 'ghost'} size="icon" className="rounded-none h-9 w-9" onClick={() => { setViewMode('lines'); localStorage.setItem('partsLibrary2ViewMode', 'lines'); }} title="List view"><LayoutList className="h-4 w-4" /></Button>
                    <Button variant={viewMode === 'cards' ? 'default' : 'ghost'} size="icon" className="rounded-none h-9 w-9" onClick={() => { setViewMode('cards'); localStorage.setItem('partsLibrary2ViewMode', 'cards'); }} title="Card view"><LayoutGrid className="h-4 w-4" /></Button>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => setSelectMode(true)} title="Select multiple"><CheckSquare className="h-4 w-4" /></Button>
                   <PartsCsvImport2 currentFolderId={currentFolderId} />
                  <PartJsonImport addPart={addPart} currentFolderId={currentFolderId} existingSkus={parts.map(p => p.sku)} />
                  <Button variant="outline" onClick={() => setNewFolderOpen(true)} className="gap-2"><FolderPlus className="h-4 w-4" />New Folder</Button>
                  <Button onClick={() => navigate(`/parts/library2/new${libraryLocationSuffix}`)} className="gap-2"><Plus className="h-4 w-4" />Add Part</Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6 lg:px-8" onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
        {isDragOver && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/10 border-4 border-dashed border-primary pointer-events-none rounded-lg">
            <p className="text-xl font-semibold text-primary">Drop parts or JSON files here to import</p>
          </div>
        )}
        {breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 mb-4 text-sm text-muted-foreground flex-wrap">
            <button onClick={() => updateLibraryState(null, search)} className="hover:text-foreground transition-colors">Root</button>
            {breadcrumb.map(folder => (
              <span key={folder.id} className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /><button onClick={() => updateLibraryState(folder.id, search)} className="hover:text-foreground transition-colors">{folder.name}</button></span>
            ))}
          </div>
        )}

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or part number..." value={search} onChange={e => updateLibraryState(currentFolderId, e.target.value, true)} className="pl-10 max-w-md" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Loading...</p></div>
        ) : (
          <>
            {filteredFolders.length > 0 && (
              <div className="border border-border rounded-md overflow-hidden mb-4">
                {filteredFolders.map((folder, i) => (
                  <div key={folder.id} className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors group ${i > 0 ? 'border-t border-border' : ''}`} onClick={() => updateLibraryState(folder.id, '')}>
                    <Folder className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground truncate block">{folder.name}</span>
                      {folder.description && <span className="text-xs text-muted-foreground truncate block mt-0.5">{folder.description}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{folders.filter(f => f.parentId === folder.id).length} folders · {parts.filter(p => p.folderId === folder.id).length} parts</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent onClick={e => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => setRenamingFolder({ id: folder.id, name: folder.name, description: folder.description })}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setMovingFolderId(folder.id)}><FolderInput className="h-4 w-4 mr-2" /> Move to folder</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteFolder(folder.id)}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}

            {filtered.length === 0 && filteredFolders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground mb-4">{search ? 'No results found' : 'This folder is empty'}</p>
                {!search && <div className="flex gap-2"><Button variant="outline" onClick={() => setNewFolderOpen(true)}>Create a folder</Button><Button onClick={() => navigate(`/parts/library2/new${libraryLocationSuffix}`)}>Add a part</Button></div>}
              </div>
            ) : filtered.length > 0 && (
              <>
              {viewMode === 'lines' ? (
                <div className="border border-border rounded-md overflow-hidden">
                  {pagedParts.map((part, i) => {
                    const globalIndex = (currentPage - 1) * PAGE_SIZE + i;
                    return (
                    <div key={part.id} draggable={!selectMode} onDragStart={(e) => handleDragStart(e, part)} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors group ${i > 0 ? 'border-t border-border' : ''} ${selectMode && selectedPartIds.has(part.id) ? 'bg-primary/5' : ''}`}
                      onClick={(e) => { if (selectMode) { handlePartClick(part.id, globalIndex, e); } else { navigate(`/parts/library2/${part.id}${libraryLocationSuffix}`); } }}>
                      {selectMode && <div onClick={e => e.stopPropagation()} className="shrink-0"><Checkbox checked={selectedPartIds.has(part.id)} onCheckedChange={() => toggleSelect(part.id)} /></div>}
                      <div className="h-10 w-10 bg-muted rounded overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); if (part.imageUrl) openImageViewer(part.imageUrl); }}>
                        {part.imageUrl ? <PartImage2 storagePath={part.imageUrl} /> : <span className="text-muted-foreground text-[10px]">—</span>}
                      </div>
                      <span className="font-medium text-foreground truncate flex-1 min-w-0">{part.name}</span>
                      <span className="text-sm text-muted-foreground truncate w-28 shrink-0 hidden sm:block">{part.sku || '—'}</span>
                      <span className="text-sm font-medium text-primary w-24 text-right shrink-0 hidden sm:block">{part.price > 0 ? formatCurrency(part.price) : '—'}</span>
                      <div className="flex gap-1 shrink-0 hidden md:flex">
                        {part.dxfUrl1 && <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded">DXF 1</span>}
                        {part.dxfUrl2 && <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded">DXF 2</span>}
                      </div>
                      <PartActionsDropdown2 partId={part.id} onMove={() => setMovingPartId(part.id)} onDuplicate={() => duplicatePart(part.id)} onDelete={handleDelete} />
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {pagedParts.map((part, i) => {
                    const globalIndex = (currentPage - 1) * PAGE_SIZE + i;
                    return (
                    <Card key={part.id} draggable={!selectMode} onDragStart={(e) => handleDragStart(e, part)} className={`cursor-pointer hover:shadow-md transition-shadow group relative ${selectMode && selectedPartIds.has(part.id) ? 'ring-2 ring-primary' : ''}`}
                      onClick={(e) => { if (selectMode) { handlePartClick(part.id, globalIndex, e); } else { navigate(`/parts/library2/${part.id}${libraryLocationSuffix}`); } }}>
                      {selectMode && <div className="absolute top-2 left-2 z-10" onClick={e => e.stopPropagation()}><Checkbox checked={selectedPartIds.has(part.id)} onCheckedChange={() => toggleSelect(part.id)} /></div>}
                      <div className="aspect-square bg-muted rounded-t-lg overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); if (part.imageUrl) openImageViewer(part.imageUrl); }}>
                        {part.imageUrl ? <PartImage2 storagePath={part.imageUrl} className="w-full h-full" /> : <span className="text-muted-foreground text-3xl">—</span>}
                      </div>
                      <CardContent className="p-3">
                        <p className="font-medium text-foreground text-sm truncate">{part.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{part.sku || 'No Part #'}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-medium text-primary">{part.price > 0 ? formatCurrency(part.price) : '—'}</span>
                          <div className="flex gap-1">{part.dxfUrl1 && <span className="text-[10px] bg-accent text-accent-foreground px-1 py-0.5 rounded">DXF</span>}</div>
                        </div>
                      </CardContent>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <PartActionsDropdown2 partId={part.id} onMove={() => setMovingPartId(part.id)} onDuplicate={() => duplicatePart(part.id)} onDelete={handleDelete} />
                      </div>
                    </Card>
                    );
                  })}
                </div>
              )}
              {totalPages > 1 && (
                <div className="border-t border-border px-4 py-3 flex items-center justify-between mt-4 rounded-md border bg-card">
                  <p className="text-sm text-muted-foreground">Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} parts</p>
                  <Pagination className="w-auto mx-0">
                    <PaginationContent>
                      <PaginationItem><PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1).reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => { if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push('ellipsis'); acc.push(page); return acc; }, []).map((page, idx) => page === 'ellipsis' ? (<PaginationItem key={`e-${idx}`}><PaginationEllipsis /></PaginationItem>) : (<PaginationItem key={page}><PaginationLink isActive={page === currentPage} onClick={() => setCurrentPage(page as number)} className="cursor-pointer">{page}</PaginationLink></PaginationItem>))}
                      <PaginationItem><PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
              </>
            )}
          </>
        )}
      </main>

      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Folder</DialogTitle><DialogDescription>Create a new folder to organize your parts.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor="folder-name">Name</Label><Input id="folder-name" placeholder="Folder name" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleCreateFolder()} autoFocus /></div>
            <div className="space-y-2"><Label htmlFor="folder-description">Description (optional)</Label><Textarea id="folder-description" placeholder="Add a description..." value={newFolderDescription} onChange={e => setNewFolderDescription(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setNewFolderOpen(false)}>Cancel</Button><Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renamingFolder} onOpenChange={open => !open && setRenamingFolder(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Folder</DialogTitle><DialogDescription>Update the folder name and description.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor="edit-folder-name">Name</Label><Input id="edit-folder-name" placeholder="Folder name" value={renamingFolder?.name || ''} onChange={e => renamingFolder && setRenamingFolder({ ...renamingFolder, name: e.target.value })} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleRenameFolder()} autoFocus /></div>
            <div className="space-y-2"><Label htmlFor="edit-folder-description">Description (optional)</Label><Textarea id="edit-folder-description" placeholder="Add a description..." value={renamingFolder?.description || ''} onChange={e => renamingFolder && setRenamingFolder({ ...renamingFolder, description: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setRenamingFolder(null)}>Cancel</Button><Button onClick={handleRenameFolder} disabled={!renamingFolder?.name.trim()}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!movingPartId} onOpenChange={open => !open && setMovingPartId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Move to folder</DialogTitle><DialogDescription>Select a destination folder for this part.</DialogDescription></DialogHeader>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            <button onClick={() => handleMovePart(null)} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm flex items-center gap-2"><Folder className="h-4 w-4 text-muted-foreground" />Root (no folder)</button>
            {folders.map(folder => (<button key={folder.id} onClick={() => handleMovePart(folder.id)} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm flex items-center gap-2"><Folder className="h-4 w-4 text-primary" />{getBreadcrumb(folder.id).map(f => f.name).join(' / ')}</button>))}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setMovingPartId(null)}>Cancel</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkMoveOpen} onOpenChange={open => !open && setBulkMoveOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Move {selectedPartIds.size} part{selectedPartIds.size !== 1 ? 's' : ''} to folder</DialogTitle><DialogDescription>Select a destination folder.</DialogDescription></DialogHeader>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            <button onClick={() => handleBulkMove(null)} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm flex items-center gap-2"><Folder className="h-4 w-4 text-muted-foreground" />Root (no folder)</button>
            {folders.map(folder => (<button key={folder.id} onClick={() => handleBulkMove(folder.id)} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm flex items-center gap-2"><Folder className="h-4 w-4 text-primary" />{getBreadcrumb(folder.id).map(f => f.name).join(' / ')}</button>))}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setBulkMoveOpen(false)}>Cancel</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!movingFolderId} onOpenChange={open => !open && setMovingFolderId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Move folder</DialogTitle><DialogDescription>Select a destination folder.</DialogDescription></DialogHeader>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            <button onClick={async () => { if (movingFolderId) { const ok = await moveFolder(movingFolderId, null); if (ok) { toast({ title: 'Folder moved' }); setMovingFolderId(null); } } }} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm flex items-center gap-2"><Folder className="h-4 w-4 text-muted-foreground" />Root (top level)</button>
            {folders.filter(f => f.id !== movingFolderId).map(folder => (<button key={folder.id} onClick={async () => { if (movingFolderId) { const ok = await moveFolder(movingFolderId, folder.id); if (ok) { toast({ title: 'Folder moved' }); setMovingFolderId(null); } } }} className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm flex items-center gap-2"><Folder className="h-4 w-4 text-primary" />{getBreadcrumb(folder.id).map(f => f.name).join(' / ')}</button>))}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setMovingFolderId(null)}>Cancel</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageViewerDialog imageUrl={viewerImageUrl} alt="Part" open={viewerOpen} onOpenChange={setViewerOpen} />
    </div>
  );
}

function PartActionsDropdown2({ partId, onMove, onDuplicate, onDelete }: { partId: string; onMove: () => void; onDuplicate: () => void; onDelete: (id: string, e: React.MouseEvent) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent onClick={e => e.stopPropagation()}>
        <DropdownMenuItem onClick={onDuplicate}><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
        <DropdownMenuItem onClick={onMove}><FolderInput className="h-4 w-4 mr-2" /> Move to folder</DropdownMenuItem>
        <AlertDialog>
          <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive" onSelect={e => e.preventDefault()}><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem></AlertDialogTrigger>
          <AlertDialogContent onClick={e => e.stopPropagation()}>
            <AlertDialogHeader><AlertDialogTitle>Delete part?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={(e) => onDelete(partId, e)}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PartImage2({ storagePath, className }: { storagePath: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const { getSignedUrl } = useParts2();
  useEffect(() => { getSignedUrl('part-images-2', storagePath).then(setUrl); }, [storagePath]);
  if (!url) return <span className="text-muted-foreground text-sm">Loading...</span>;
  return <img src={url} alt="Part" className={className || "w-full h-full object-contain"} />;
}
