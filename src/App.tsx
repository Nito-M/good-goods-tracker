import { useMemo } from "react";
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
import { AddRequest } from "./pages/AddRequest";
import { EditRequest } from "./pages/EditRequest";
import { RequestDetail } from "./pages/RequestDetail";
import { Calendar } from "./pages/Calendar";
import { Notes } from "./pages/Notes";
import { Settings } from "./pages/Settings";
import { Bank } from "./pages/Bank";
import { BankCardDetail } from "./pages/BankCardDetail";
import { Jobs } from "./pages/Jobs";
import { CreateJob } from "./pages/CreateJob";
import { EditJob } from "./pages/EditJob";
import { AllJobItems } from "./pages/AllJobItems";
import { JobDescription } from "./pages/JobDescription";
import { JobAddItems } from "./pages/JobAddItems";
import { Assemblies } from "./pages/Assemblies";
import { AssemblyTypes } from "./pages/AssemblyTypes";

import { PartsLibrary } from "./pages/PartsLibrary";
import { PartsLanding } from "./pages/PartsLanding";
import { PartsAssemblies } from "./pages/PartsAssemblies";
import { PartsAssembliesDetail } from "./pages/PartsAssembliesDetail";
import { AddPart } from "./pages/AddPart";
import { PartDetail } from "./pages/PartDetail";
import { TaxDocuments } from "./pages/TaxDocuments";
import { Storefront } from "./pages/Storefront";
import { PublicShop } from "./pages/PublicShop";
import { PublicProductDetail } from "./pages/PublicProductDetail";
import NotFound from "./pages/NotFound";
import { ResetPassword } from "./pages/ResetPassword";
import { TripPlanDetail } from "./pages/TripPlanDetail";
import { EditTripPlan } from "./pages/EditTripPlan";
import { CompanyDetail } from "./pages/CompanyDetail";
import { useInventory } from "@/hooks/useInventory";
import { useCategories } from "@/hooks/useCategories";
import { useSubcategories } from "@/hooks/useSubcategories";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { useColorTheme } from "@/hooks/useColorTheme";

const queryClient = new QueryClient();

function AppContent() {
  useColorTheme();
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

  const { allCategories, categories } = useCategories();
  const { subcategories } = useSubcategories();

  // Build a map of category name -> subcategories for AddItemPage
  const subcategoriesByCategory = useMemo(() => {
    const map = new Map<string, { id: string; name: string }[]>();
    for (const cat of categories) {
      const subs = subcategories
        .filter((s) => s.category_id === cat.id)
        .map((s) => ({ id: s.id, name: s.name }));
      if (subs.length > 0) {
        map.set(cat.name, subs);
      }
    }
    return map;
  }, [categories, subcategories]);

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
                  addItem={addItem}
                  subcategoriesByCategory={subcategoriesByCategory}
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
                  subcategoriesByCategory={subcategoriesByCategory}
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
                  subcategoriesByCategory={subcategoriesByCategory}
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
                  onUpdate={updateItem}
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
          path="/requests/new"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AddRequest />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests/edit/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <EditRequest />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests/view/:requestNumber"
          element={
            <ProtectedRoute>
              <AppLayout>
                <RequestDetail />
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
          path="/calendar/trip/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <TripPlanDetail />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar/trip/:id/edit"
          element={
            <ProtectedRoute>
              <AppLayout>
                <EditTripPlan />
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
        <Route
          path="/bank/card/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <BankCardDetail />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/assemblies"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AssemblyTypes />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/assemblies/:type"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Assemblies />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parts"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PartsLanding />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parts/library"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PartsLibrary />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parts/library/new"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AddPart />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parts/library/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PartDetail />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parts/assemblies"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PartsAssemblies />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/parts/assemblies/:type"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PartsAssembliesDetail />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tax-documents"
          element={
            <ProtectedRoute>
              <AppLayout>
                <TaxDocuments />
              </AppLayout>
            </ProtectedRoute>
          }
          />
        <Route
          path="/storefront"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Storefront
                  items={items}
                  loading={loading}
                  categories={allCategories}
                />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        {/* Public shop routes - no auth required */}
        <Route path="/shop" element={<PublicShop />} />
        <Route path="/shop/:id" element={<PublicProductDetail />} />
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
