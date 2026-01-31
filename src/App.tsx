import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { ItemDetails } from "./pages/ItemDetails";
import NotFound from "./pages/NotFound";
import { useInventory } from "@/hooks/useInventory";
import { AddItemDialog } from "@/components/AddItemDialog";
import { InventoryItem } from "@/types/inventory";

const queryClient = new QueryClient();

function AppContent() {
  const {
    items,
    allItems,
    stats,
    loading,
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

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <Index
              items={items}
              stats={stats}
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              onEdit={handleEdit}
              onDelete={deleteItem}
              onOpenDialog={() => setDialogOpen(true)}
            />
          }
        />
        <Route
          path="/item/:id"
          element={
            <ItemDetails
              items={allItems}
              onEdit={handleEdit}
              onDelete={deleteItem}
            />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AddItemDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        onSave={addItem}
        editItem={editingItem}
        onUpdate={updateItem}
      />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
