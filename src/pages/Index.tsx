import { Package, DollarSign, AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { InventoryTable } from '@/components/InventoryTable';
import { SearchFilter } from '@/components/SearchFilter';
import { InventoryItem } from '@/types/inventory';

interface IndexProps {
  items: InventoryItem[];
  stats: {
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
  };
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  categories: string[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onOpenDialog: () => void;
}

const Index = ({
  items,
  stats,
  loading,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  categories,
  onEdit,
  onDelete,
  onOpenDialog,
}: IndexProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
              Inventory Management
            </h1>
            <Button onClick={onOpenDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <StatCard
            title="Total Items"
            value={stats.totalItems.toLocaleString()}
            icon={Package}
            variant="default"
          />
          <StatCard
            title="Total Value"
            value={formatCurrency(stats.totalValue)}
            icon={DollarSign}
            variant="success"
          />
          <StatCard
            title="Low Stock Alerts"
            value={stats.lowStockCount}
            icon={AlertTriangle}
            variant="warning"
          />
        </div>

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
            <div className="text-muted-foreground">Loading inventory...</div>
          </div>
        ) : (
          <InventoryTable
            items={items}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
