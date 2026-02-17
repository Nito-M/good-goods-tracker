import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import { Items } from "./pages/Items";
import { ItemDetails } from "./pages/ItemDetails";
import { AddItemPage } from "./pages/AddItem";
import { Auth } from "./pages/Auth";
import { PurchaseOrders } from "./pages/PurchaseOrders";
import { AddPurchaseOrder } from "./pages/AddPurchaseOrder";
import { Sales } from "./pages/Sales";
import { Quotes } from "./pages/Quotes";
import { SalesOrders } from "./pages/SalesOrders";
import { SalesOrderDetail } from "./pages/SalesOrderDetail";
import { Requests } from "./pages/Requests";
import { Calendar } from "./pages/Calendar";
import { Notes } from "./pages/Notes";
import { Settings } from "./pages/Settings";
import { Bank } from "./pages/Bank";
import { Jobs } from "./pages/Jobs";
import { CreateJob } from "./pages/CreateJob";
import { EditJob } from "./pages/EditJob";
import { AllJobItems } from "./pages/AllJobItems";
import { JobDescription } from "./pages/JobDescription";
import { JobAddItems } from "./pages/JobAddItems";
import NotFound from "./pages/NotFound";
import { ResetPassword } from "./pages/ResetPassword";
import { CompanyDetail } from "./pages/CompanyDetail";
import { useInventory } from "@/hooks/useInventory";
import { useCategories } from "@/hooks/useCategories";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";

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
    uploadItemImage,
  } = useInventory();

  const { allCategories } = useCategories();


  return (
    <>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Index
                  items={items}
                  stats={stats}
                  loading={loading}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  categories={allCategories}
                  onDelete={deleteItem}
                />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/items"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Items
                  items={items}
                  loading={loading}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  categories={allCategories}
                  onDelete={deleteItem}
                />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/items/new"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AddItemPage
                  categories={allCategories}
                  onSave={addItem}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                  items={allItems}
                  uploadItemImage={uploadItemImage}
                />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/items/edit/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AddItemPage
                  categories={allCategories}
                  onSave={addItem}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                  items={allItems}
                  uploadItemImage={uploadItemImage}
                />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/item/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ItemDetails
                  items={allItems}
                  onDelete={deleteItem}
                />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-orders"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PurchaseOrders />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-orders/new"
          element={
            <ProtectedRoute>
              <AddPurchaseOrder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Sales />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotes"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Quotes />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales-orders"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SalesOrders />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales-orders/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SalesOrderDetail />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Requests />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Calendar />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Notes />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/company/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CompanyDetail />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Jobs />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/new"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CreateJob />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/all-items"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AllJobItems />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/link/:linkId"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Jobs />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:jobId/description"
          element={
            <ProtectedRoute>
              <AppLayout>
                <JobDescription />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:jobId/edit"
          element={
            <ProtectedRoute>
              <AppLayout>
                <EditJob />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:jobId"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Jobs />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:jobId/add-items"
          element={
            <ProtectedRoute>
              <JobAddItems />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bank"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Bank />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
