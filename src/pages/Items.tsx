import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { InventoryTable } from '@/components/InventoryTable';
import { SearchFilter } from '@/components/SearchFilter';
import { InventoryItem } from '@/types/inventory';

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
          />
        </div>

        {/* Inventory Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading items...</div>
          </div>
        ) : (
          <InventoryTable
            items={items}
            onDelete={onDelete}
          />
        )}
      </main>
    </div>
  );
};
