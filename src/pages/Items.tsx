import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InventoryTable } from '@/components/InventoryTable';
import { SearchFilter } from '@/components/SearchFilter';
import { InventoryItem } from '@/types/inventory';
import { useTagCategories } from '@/hooks/useTagCategories';
import { useTags } from '@/hooks/useTags';
import { useBulkItemTags } from '@/hooks/useItemTags';

interface ItemsProps {
  items: InventoryItem[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  categories: string[];
  onDelete: (id: string) => void;
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
}: ItemsProps) => {
  const navigate = useNavigate();
  const [tagFilter, setTagFilter] = useState('all');
  
  const { tagCategories } = useTagCategories();
  const { tags } = useTags();
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  const { getTagsForItem, itemTagsMap } = useBulkItemTags(itemIds);

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

  // Filter items by tag
  const filteredItems = useMemo(() => {
    if (tagFilter === 'all') return items;
    return items.filter((item) => {
      const tagIds = itemTagsMap.get(item.id) || [];
      return tagIds.includes(tagFilter);
    });
  }, [items, tagFilter, itemTagsMap]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
              Items & Inventory
            </h1>
            <Button onClick={() => navigate('/items/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Filter */}
        <div className="mb-6">
          <SearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            categories={categories}
            tagFilter={tagFilter}
            onTagChange={setTagFilter}
            tagOptions={tagOptions}
          />
        </div>

        {/* Inventory Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading items...</div>
          </div>
        ) : (
          <InventoryTable
            items={filteredItems}
            onDelete={onDelete}
          />
        )}
      </main>
    </div>
  );
};
