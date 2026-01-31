import { useState } from 'react';
import { Package, DollarSign, AlertTriangle, Plus, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { InventoryTable } from '@/components/InventoryTable';
import { AddItemDialog } from '@/components/AddItemDialog';
import { SearchFilter } from '@/components/SearchFilter';
import { useInventory } from '@/hooks/useInventory';
import { InventoryItem } from '@/types/inventory';

const Index = () => {
  const {
    items,
    stats,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    addItem,
    updateItem,
    deleteItem,
  } = useInventory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingItem(null);
    }
  };

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
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Box className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-card-foreground">Inventory</h1>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
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
          />
        </div>

        {/* Inventory Table */}
        <InventoryTable
          items={items}
          onEdit={handleEdit}
          onDelete={deleteItem}
        />
      </main>

      {/* Add/Edit Dialog */}
      <AddItemDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        onSave={addItem}
        editItem={editingItem}
        onUpdate={updateItem}
      />
    </div>
  );
};

export default Index;
