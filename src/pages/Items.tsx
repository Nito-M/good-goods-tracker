import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, MapPin, Building2, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InventoryTable } from '@/components/InventoryTable';
import { SearchFilter } from '@/components/SearchFilter';
import { InventoryItem } from '@/types/inventory';
import { useTagCategories } from '@/hooks/useTagCategories';
import { useTags } from '@/hooks/useTags';
import { useBulkItemTags } from '@/hooks/useItemTags';
import { useBulkItemLocationQuantities } from '@/hooks/useBulkItemLocationQuantities';
import { useWarehouses, Warehouse } from '@/hooks/useWarehouses';
import { UserOrganization } from '@/hooks/useUserOrganizations';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ItemsProps {
  items: InventoryItem[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  categories: string[];
  onDelete: (id: string) => void;
  addItem: (item: Omit<import('@/types/inventory').InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  subcategoriesByCategory: Map<string, { id: string; name: string }[]>;
  organizations: UserOrganization[];
  activeOrgId: string | null;
  onOrgChange: (orgId: string) => void;
  copyItemToOrg: (itemId: string, targetOrgId: string) => Promise<boolean>;
  refetchInventory: () => Promise<void>;
}

export const Items = ({
  items,
  loading,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  categories,
  onDelete,
  addItem,
  subcategoriesByCategory,
  organizations,
  activeOrgId,
  onOrgChange,
  copyItemToOrg,
  refetchInventory,
}: ItemsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tagFilter, setTagFilter] = useState('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState('all');
  const warehouseFilter = searchParams.get('warehouse') || 'all';

  const { tagCategories } = useTagCategories();
  const { tags } = useTags();
  const { warehouses, addWarehouse, updateWarehouse, deleteWarehouse } = useWarehouses();
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const { itemTagsMap } = useBulkItemTags(itemIds);
  const { warehouseItemMap, warehouseItemQtyMap } = useBulkItemLocationQuantities(itemIds);

  // Location management state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [locName, setLocName] = useState('');
  const [locDesc, setLocDesc] = useState('');

  // Cross-org drag state
  const [dragOverOrgId, setDragOverOrgId] = useState<string | null>(null);
  const [pendingCopy, setPendingCopy] = useState<{ itemId: string; targetOrgId: string } | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const setWarehouseFilter = (value: string) => {
    if (value === 'all') {
      searchParams.delete('warehouse');
    } else {
      searchParams.set('warehouse', value);
    }
    setSearchParams(searchParams);
  };

  const openAddLocation = () => {
    setEditingWarehouse(null);
    setLocName('');
    setLocDesc('');
    setDialogOpen(true);
  };

  const openEditLocation = (w: Warehouse) => {
    setEditingWarehouse(w);
    setLocName(w.name);
    setLocDesc(w.description || '');
    setDialogOpen(true);
  };

  const handleSaveLocation = async () => {
    if (!locName.trim()) return;
    if (editingWarehouse) {
      await updateWarehouse(editingWarehouse.id, locName.trim(), locDesc.trim());
    } else {
      await addWarehouse(locName.trim(), locDesc.trim());
    }
    setDialogOpen(false);
  };

  const handleDeleteLocation = async () => {
    if (deleteId) {
      if (warehouseFilter === deleteId) {
        setWarehouseFilter('all');
      }
      await deleteWarehouse(deleteId);
      setDeleteId(null);
    }
  };

  // Build tag options for filter dropdown
  const tagOptions = useMemo(() => {
    return tags.map((tag) => {
      const cat = tagCategories.find((tc) => tc.id === tag.tag_category_id);
      return {
        id: tag.id,
        name: tag.name,
        categoryName: cat?.name || '',
      };
    });
  }, [tags, tagCategories]);

  // Subcategory options based on selected category
  const subcategoryOptions = useMemo(() => {
    if (categoryFilter === 'all' || !categoryFilter) return [];
    return subcategoriesByCategory.get(categoryFilter) || [];
  }, [categoryFilter, subcategoriesByCategory]);

  const handleCategoryChange = (cat: string) => {
    setCategoryFilter(cat);
    setSubcategoryFilter('all');
  };

  const mustPickSubcategory = false;

  const filteredItems = useMemo(() => {
    if (mustPickSubcategory) return [];
    let result = items;
    if (tagFilter !== 'all') {
      result = result.filter((item) => {
        const tagIds = itemTagsMap.get(item.id) || [];
        return tagIds.includes(tagFilter);
      });
    }
    if (warehouseFilter !== 'all') {
      const itemsInWarehouse = warehouseItemMap.get(warehouseFilter);
      result = result.filter((item) =>
        itemsInWarehouse?.has(item.id) || item.warehouseId === warehouseFilter
      );
    }
    if (subcategoryFilter !== 'all') {
      const subName = subcategoryOptions.find(s => s.id === subcategoryFilter)?.name;
      if (subName) {
        result = result.filter((item) => item.subcategory === subName);
      }
    }
    return result;
  }, [items, tagFilter, itemTagsMap, warehouseFilter, subcategoryFilter, subcategoryOptions, mustPickSubcategory]);

  const orgList = organizations ?? [];
  const itemList = items ?? [];
  const activeOrg = orgList.find((o) => o.id === activeOrgId) || null;
  const targetOrgForCopy = pendingCopy ? orgList.find((o) => o.id === pendingCopy.targetOrgId) : null;
  const itemForCopy = pendingCopy ? itemList.find((i) => i.id === pendingCopy.itemId) : null;

  const handleConfirmCopy = async () => {
    if (!pendingCopy) return;
    setIsCopying(true);
    const ok = await copyItemToOrg(pendingCopy.itemId, pendingCopy.targetOrgId);
    setIsCopying(false);
    if (ok) {
      const targetName = orgList.find((o) => o.id === pendingCopy.targetOrgId)?.name || 'org';
      toast({ title: `Copied to ${targetName}` });
      await refetchInventory();
    }
    setPendingCopy(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
              Items & Inventory
            </h1>
            <div className="flex items-center gap-2">
              <ItemCsvImport addItem={addItem} />
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/inventory-settings')}
                title="Inventory Settings"
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
              <Button onClick={() => navigate('/items/new')} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Organization tabs (drop targets for cross-org copy) */}
        {orgList.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {orgList.map((org) => {
              const isActive = org.id === activeOrgId;
              const isDropTarget = !isActive;
              const isDragOver = dragOverOrgId === org.id;
              return (
                <Button
                  key={org.id}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onOrgChange(org.id)}
                  onDragOver={(e) => {
                    if (!isDropTarget) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                    if (dragOverOrgId !== org.id) setDragOverOrgId(org.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverOrgId === org.id) setDragOverOrgId(null);
                  }}
                  onDrop={(e) => {
                    if (!isDropTarget) return;
                    e.preventDefault();
                    setDragOverOrgId(null);
                    const itemId = e.dataTransfer.getData('application/x-inventory-item');
                    if (itemId) {
                      setPendingCopy({ itemId, targetOrgId: org.id });
                    }
                  }}
                  className={cn(
                    'transition-all',
                    isDragOver && 'ring-2 ring-primary ring-offset-2 scale-105',
                  )}
                >
                  {org.name}
                </Button>
              );
            })}
            {activeOrg && (
              <span className="ml-2 text-xs text-muted-foreground">
                Drag a row onto another organization to copy it.
              </span>
            )}
          </div>
        )}

        {/* Location selector bar */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Button
            variant={warehouseFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setWarehouseFilter('all')}
          >
            All
          </Button>
          {warehouses.map((w) => (
            <DropdownMenu key={w.id}>
              <div className="flex items-center">
                <Button
                  variant={warehouseFilter === w.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWarehouseFilter(w.id)}
                  className="rounded-r-none"
                >
                  {w.name}
                </Button>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={warehouseFilter === w.id ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-l-none border-l-0 px-1.5"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
              </div>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => openEditLocation(w)}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteId(w.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
          <Button variant="outline" size="sm" onClick={openAddLocation} className="gap-1">
            <Plus className="h-3.5 w-3.5" />
            Add Location
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <SearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categoryFilter={categoryFilter}
            onCategoryChange={handleCategoryChange}
            categories={categories}
            tagFilter={tagFilter}
            onTagChange={setTagFilter}
            tagOptions={tagOptions}
            subcategoryFilter={subcategoryFilter}
            onSubcategoryChange={setSubcategoryFilter}
            subcategoryOptions={subcategoryOptions.map(s => ({ id: s.id, name: s.name }))}
          />
        </div>

        {/* Inventory Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading items...</div>
          </div>
        ) : mustPickSubcategory ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Please select a subcategory to view items.</div>
          </div>
        ) : (
          <InventoryTable
            items={filteredItems}
            onDelete={onDelete}
            warehouseFilter={warehouseFilter !== 'all' ? warehouseFilter : undefined}
            warehouseItemQtyMap={warehouseItemQtyMap}
            draggable
          />
        )}
      </main>

      {/* Add/Edit Location Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? 'Edit Location' : 'Add Location'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loc-name">Name</Label>
              <Input
                id="loc-name"
                value={locName}
                onChange={(e) => setLocName(e.target.value)}
                placeholder="e.g. Main Warehouse"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-desc">Description (optional)</Label>
              <Textarea
                id="loc-desc"
                value={locDesc}
                onChange={(e) => setLocDesc(e.target.value)}
                placeholder="Notes about this location..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLocation} disabled={!locName.trim()}>
              {editingWarehouse ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Location Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the location. Items assigned to it will become unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLocation}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cross-org Copy Confirm */}
      <AlertDialog open={!!pendingCopy} onOpenChange={(open) => !open && !isCopying && setPendingCopy(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copy item to {targetOrgForCopy?.name || 'organization'}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a copy of <span className="font-medium text-foreground">{itemForCopy?.name || 'this item'}</span>{' '}
              in <span className="font-medium text-foreground">{targetOrgForCopy?.name}</span>. The original stays in{' '}
              <span className="font-medium text-foreground">{activeOrg?.name}</span>. Quantity and core details copy across; location assignments do not.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCopying}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCopy} disabled={isCopying}>
              {isCopying ? 'Copying...' : 'Copy'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
