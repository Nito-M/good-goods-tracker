import { useState, useMemo } from 'react';
import { Plus, LogOut, ArrowLeft, ClipboardList, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useInventory } from '@/hooks/useInventory';
import { useVendors } from '@/hooks/useVendors';
import { useProfile } from '@/hooks/useProfile';
import { useJobs } from '@/hooks/useJobs';
import { useBank } from '@/hooks/useBank';
import { useCompanies } from '@/hooks/useCompanies';
import { useBankCards } from '@/hooks/useBankCards';
import { useWarehouses } from '@/hooks/useWarehouses';
import { EditPurchaseOrderDialog } from '@/components/EditPurchaseOrderDialog';
import { PurchaseOrderCard } from '@/components/PurchaseOrderCard';
import { PurchaseOrderPreviewDialog } from '@/components/PurchaseOrderPreviewDialog';
import { ReceiveLocationDialog } from '@/components/ReceiveLocationDialog';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { generatePurchaseOrderPDF } from '@/lib/purchaseOrderGenerator';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PurchaseOrder } from '@/types/purchaseOrder';

export function PurchaseOrders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightPo = searchParams.get('po');
  const { signOut } = useAuth();
  const { orders, loading, updateOrder, markAsOrdered, markAsReceived, markAsPartiallyReceived, markAsPaid, revertOrder, deleteOrder, deleteImageForOrder, deletePdfForOrder, addAttachment, deleteAttachment } =
  usePurchaseOrders();
  const { allItems: inventoryItems } = useInventory();
  const { vendors } = useVendors();
  const { profile } = useProfile();
  const { addWithdrawal } = useBank();
  const { jobs } = useJobs();
  const { companies } = useCompanies();
  const { cards: bankCards } = useBankCards();
  const { warehouses } = useWarehouses();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [previewOrder, setPreviewOrder] = useState<PurchaseOrder | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [receivingOrderId, setReceivingOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleMarkOrdered = async (orderId: string) => {
    setProcessingId(orderId);
    await markAsOrdered(orderId);
    setProcessingId(null);
  };

  const handleMarkReceived = (orderId: string) => {
    setReceivingOrderId(orderId);
    setReceiveDialogOpen(true);
  };

  const handleConfirmReceive = async (locationItems: import('@/components/ReceiveLocationDialog').LocationItemEntry[]) => {
    if (!receivingOrderId) return;
    setProcessingId(receivingOrderId);
    await markAsReceived(receivingOrderId, locationItems);
    setProcessingId(null);
    setReceiveDialogOpen(false);
    setReceivingOrderId(null);
  };

  const handleMarkPaid = async (orderId: string) => {
    setProcessingId(orderId);
    await markAsPaid(orderId, addWithdrawal);
    setProcessingId(null);
  };

  const handleRevert = async (orderId: string) => {
    setProcessingId(orderId);
    await revertOrder(orderId);
    setProcessingId(null);
  };

  const handleEdit = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setEditDialogOpen(true);
  };

  const getSettingsForOrder = (order: PurchaseOrder) => {
    const company = order.companyId ?
    companies.find((c) => c.id === order.companyId) :
    companies.find((c) => c.isDefault) || companies[0] || null;
    if (company) {
      return {
        businessName: company.name,
        businessAddress: company.address,
        businessPhone: company.phone,
        businessEmail: company.email,
        businessNumber: company.businessNumber,
        thankYouNote: company.invoiceThankYouNote || null,
        logoUrl: company.logoUrl,
        layout: company.invoiceLayout || null
      };
    }
    return profile ? {
      businessName: profile.businessName,
      businessAddress: profile.businessAddress,
      businessPhone: profile.businessPhone,
      businessEmail: profile.businessEmail,
      businessNumber: profile.businessNumber,
      thankYouNote: profile.invoiceThankYouNote,
      logoUrl: profile.logoUrl,
      layout: profile.invoiceLayout || null
    } : undefined;
  };

  const handleDownload = async (order: PurchaseOrder) => {
    const settings = getSettingsForOrder(order);
    await generatePurchaseOrderPDF(order, settings);
  };

  const handlePreview = (order: PurchaseOrder) => {
    setPreviewOrder(order);
  };

  // Sort by PO number descending (highest first)
  const sortByPoNumber = (a: PurchaseOrder, b: PurchaseOrder) => {
    const aNum = parseInt(a.poNumber?.replace('PO-', '') || '0', 10);
    const bNum = parseInt(b.poNumber?.replace('PO-', '') || '0', 10);
    return bNum - aNum;
  };

  // Filter orders based on search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter((order) => {
      const matchesPO = order.poNumber?.toLowerCase().includes(query);
      const matchesVendor = order.vendorId && vendors.find((v) => v.id === order.vendorId)?.name.toLowerCase().includes(query);
      const matchesItems = order.items?.some(
        (item) => item.itemName?.toLowerCase().includes(query) || item.sku?.toLowerCase().includes(query)
      );
      const matchesJob = order.jobNumbers?.some((jn) => jn.toLowerCase().includes(query));
      return matchesPO || matchesVendor || matchesItems || matchesJob;
    });
  }, [orders, searchQuery, vendors]);

  const draftOrders = filteredOrders.filter((o) => o.status === 'draft').sort(sortByPoNumber);
  const orderedOrders = filteredOrders.filter((o) => o.status === 'ordered').sort(sortByPoNumber);
  const partiallyReceivedOrders = filteredOrders.filter((o) => o.status === 'partially_received').sort(sortByPoNumber);
  const receivedOrders = filteredOrders.filter((o) => o.status === 'received').sort(sortByPoNumber);

  // Determine which tab the highlighted PO belongs to
  const defaultTab = useMemo(() => {
    if (!highlightPo) return 'draft';
    const match = orders.find((o) => o.poNumber === highlightPo);
    if (match) {
      if (match.status === 'received') return 'received';
      if (match.status === 'partially_received') return 'partially_received';
      if (match.status === 'ordered') return 'ordered';
      return 'draft';
    }
    return 'draft';
  }, [highlightPo, orders]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-24 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight text-card-foreground font-sans">
                  Purchase Orders
                </h1>
                <p className="text-sm text-muted-foreground font-medium tracking-wide">
                  Manage incoming inventory
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => navigate('/purchase-orders/new')} className="gap-2">
                <Plus className="h-4 w-4" />
                New Order
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={signOut}
                title="Sign out">

                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ?
        <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">
              Loading purchase orders...
            </div>
          </div> :
        orders.length === 0 ?
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">No purchase orders yet</h2>
            <p className="text-muted-foreground mb-4">
              Create your first purchase order to track incoming inventory.
            </p>
            <Button onClick={() => navigate('/purchase-orders/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              New Order
            </Button>
          </div> :

        <Tabs defaultValue={defaultTab} className="space-y-6">
            {/* Search bar for purchase orders */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
              type="text"
              placeholder="Search by PO number, vendor, or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 pl-10 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm" />

            </div>
            
            <TabsList>
              <TabsTrigger value="draft" className="gap-2">
                Drafts
                {draftOrders.length > 0 &&
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-yellow-500 text-white">
                    {draftOrders.length}
                  </span>
              }
              </TabsTrigger>
              <TabsTrigger value="ordered" className="gap-2">
                Ordered
                {orderedOrders.length > 0 &&
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                    {orderedOrders.length}
                  </span>
              }
              </TabsTrigger>
              <TabsTrigger value="partially_received" className="gap-2">
                Partial
                {partiallyReceivedOrders.length > 0 &&
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-orange-500 text-white">
                    {partiallyReceivedOrders.length}
                  </span>
              }
              </TabsTrigger>
              <TabsTrigger value="received" className="gap-2">
                Received
                {receivedOrders.length > 0 &&
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-secondary text-primary-foreground">
                    {receivedOrders.length}
                  </span>
              }
              </TabsTrigger>
            </TabsList>

            <TabsContent value="draft" className="space-y-4">
              {draftOrders.length === 0 ?
            <p className="text-muted-foreground text-center py-8">No draft orders</p> :

            draftOrders.map((order) =>
            <PurchaseOrderCard
              key={order.id}
              order={order}
              onMarkOrdered={handleMarkOrdered}
              onMarkReceived={handleMarkReceived}
              onMarkPaid={handleMarkPaid}
              onRevert={handleRevert}
              onDelete={deleteOrder}
              onEdit={handleEdit}
              onDownload={handleDownload}
              onPreview={handlePreview}
              onAddAttachment={(file) => addAttachment(order.id, file)}
              onDeleteAttachment={deleteAttachment}
              onDeleteImage={() => deleteImageForOrder(order.id)}
              onDeletePdf={() => deletePdfForOrder(order.id)}
              loading={processingId === order.id}
              bankCardName={order.bankCardId ? bankCards.find((c) => c.id === order.bankCardId)?.name ?? null : null} />

            )
            }
            </TabsContent>

            <TabsContent value="ordered" className="space-y-4">
              {orderedOrders.length === 0 ?
            <p className="text-muted-foreground text-center py-8">No pending orders</p> :

            orderedOrders.map((order) =>
            <PurchaseOrderCard
              key={order.id}
              order={order}
              onMarkOrdered={handleMarkOrdered}
              onMarkReceived={handleMarkReceived}
              onMarkPaid={handleMarkPaid}
              onRevert={handleRevert}
              onDelete={deleteOrder}
              onEdit={handleEdit}
              onDownload={handleDownload}
              onPreview={handlePreview}
              onAddAttachment={(file) => addAttachment(order.id, file)}
              onDeleteAttachment={deleteAttachment}
              onDeleteImage={() => deleteImageForOrder(order.id)}
              onDeletePdf={() => deletePdfForOrder(order.id)}
              loading={processingId === order.id}
              bankCardName={order.bankCardId ? bankCards.find((c) => c.id === order.bankCardId)?.name ?? null : null}
              defaultOpen={highlightPo === order.poNumber} />

            )
            }
            </TabsContent>

            <TabsContent value="partially_received" className="space-y-4">
              {partiallyReceivedOrders.length === 0 ?
            <p className="text-muted-foreground text-center py-8">No partially received orders</p> :

            partiallyReceivedOrders.map((order) =>
            <PurchaseOrderCard
              key={order.id}
              order={order}
              onMarkOrdered={handleMarkOrdered}
              onMarkReceived={handleMarkReceived}
              onMarkPaid={handleMarkPaid}
              onRevert={handleRevert}
              onDelete={deleteOrder}
              onEdit={handleEdit}
              onDownload={handleDownload}
              onPreview={handlePreview}
              onAddAttachment={(file) => addAttachment(order.id, file)}
              onDeleteAttachment={deleteAttachment}
              onDeleteImage={() => deleteImageForOrder(order.id)}
              onDeletePdf={() => deletePdfForOrder(order.id)}
              loading={processingId === order.id}
              bankCardName={order.bankCardId ? bankCards.find((c) => c.id === order.bankCardId)?.name ?? null : null}
              defaultOpen={highlightPo === order.poNumber} />
            )
            }
            </TabsContent>

            <TabsContent value="received" className="space-y-4">
              {receivedOrders.length === 0 ?
            <p className="text-muted-foreground text-center py-8">No received orders yet</p> :

            receivedOrders.map((order) =>
            <PurchaseOrderCard
              key={order.id}
              order={order}
              onMarkOrdered={handleMarkOrdered}
              onMarkReceived={handleMarkReceived}
              onMarkPaid={handleMarkPaid}
              onRevert={handleRevert}
              onDelete={deleteOrder}
              onEdit={handleEdit}
              onDownload={handleDownload}
              onPreview={handlePreview}
              onAddAttachment={(file) => addAttachment(order.id, file)}
              onDeleteAttachment={deleteAttachment}
              onDeleteImage={() => deleteImageForOrder(order.id)}
              onDeletePdf={() => deletePdfForOrder(order.id)}
              loading={processingId === order.id}
              bankCardName={order.bankCardId ? bankCards.find((c) => c.id === order.bankCardId)?.name ?? null : null}
              defaultOpen={highlightPo === order.poNumber} />

            )
            }
            </TabsContent>
          </Tabs>
        }
      </main>

      {editingOrder &&
      <EditPurchaseOrderDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        order={editingOrder}
        onSave={updateOrder}
        inventoryItems={inventoryItems}
        vendors={vendors}
        jobs={jobs} />

      }

      {previewOrder &&
      <PurchaseOrderPreviewDialog
        open={!!previewOrder}
        onOpenChange={(open) => !open && setPreviewOrder(null)}
        order={previewOrder}
        settings={getSettingsForOrder(previewOrder)}
        onDownload={() => handleDownload(previewOrder)} />

      }

      <ReceiveLocationDialog
        open={receiveDialogOpen}
        onOpenChange={setReceiveDialogOpen}
        onConfirm={handleConfirmReceive}
        warehouses={warehouses}
        poItems={receivingOrderId ? orders.find((o) => o.id === receivingOrderId)?.items ?? [] : []}
        loading={!!processingId} />

    </div>);

}