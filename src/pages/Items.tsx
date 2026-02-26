import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { ItemCsvImport } from '@/components/ItemCsvImport';
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
}: ItemsProps) => {
  const navigate = useNavigate();
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
      // If we're viewing the deleted location, reset to all
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

  // Reset subcategory filter when category changes
  const handleCategoryChange = (cat: string) => {
    setCategoryFilter(cat);
    setSubcategoryFilter('all');
  };

  // No longer require subcategory pick — "All Subcategories" shows all items in category
  const mustPickSubcategory = false;

  // Filter items by tag, warehouse, and subcategory
  const filteredItems = useMemo(() => {
    // If user must pick a subcategory first, show no items
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

      {/* Delete Confirm */}
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
    </div>
  );
};
