import { useState } from 'react';
import { Plus, LogOut, ArrowLeft, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useInventory } from '@/hooks/useInventory';
import { AddPurchaseOrderDialog } from '@/components/AddPurchaseOrderDialog';
import { EditPurchaseOrderDialog } from '@/components/EditPurchaseOrderDialog';
import { PurchaseOrderCard } from '@/components/PurchaseOrderCard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PurchaseOrder } from '@/types/purchaseOrder';

export function PurchaseOrders() {
  const { signOut } = useAuth();
  const { orders, loading, createOrder, updateOrder, markAsReceived, deleteOrder } =
    usePurchaseOrders();
  const { allItems: inventoryItems, addItem } = useInventory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleMarkReceived = async (orderId: string) => {
    setProcessingId(orderId);

    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      setProcessingId(null);
      return;
    }

    // Process each item in the order
    for (const orderItem of order.items) {
      const existingItem = inventoryItems.find((item) => item.sku === orderItem.sku);

      if (existingItem) {
        const { error } = await supabase
          .from('inventory_items')
          .update({ quantity: existingItem.quantity + orderItem.quantity })
          .eq('id', existingItem.id);

        if (error) {
          toast({
            title: 'Error updating inventory',
            description: error.message,
            variant: 'destructive',
          });
          setProcessingId(null);
          return;
        }

        toast({
          title: 'Inventory updated',
          description: `Added ${orderItem.quantity} units to ${existingItem.name}`,
        });
      } else {
        await addItem({
          name: orderItem.itemName,
          sku: orderItem.sku,
          category: 'Other',
          quantity: orderItem.quantity,
          price: 0,
          cost: 0,
          minStock: 0,
          weight: 0,
          weightUnit: 'lb',
          dimensions: { length: 0, width: 0, height: 0, unit: 'in' },
          colors: [],
          description: `Added from Purchase Order on ${new Date().toLocaleDateString()}`,
        });

        toast({
          title: 'New inventory item created',
          description: `${orderItem.itemName} added to inventory with ${orderItem.quantity} units`,
        });
      }
    }

    await markAsReceived(orderId);
    setProcessingId(null);
  };

  const handleEdit = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setEditDialogOpen(true);
  };

  const orderedOrders = orders.filter((o) => o.status === 'ordered');
  const receivedOrders = orders.filter((o) => o.status === 'received');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/">
                <img 
                  src="/nol_logo.png" 
                  alt="Northern Outline Logo" 
                  className="h-20 w-auto object-contain"
                />
              </Link>
              <h1 className="text-xl font-bold text-card-foreground">
                Purchase Orders
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Order
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={signOut}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">
              Loading purchase orders...
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">No purchase orders yet</h2>
            <p className="text-muted-foreground mb-4">
              Create your first purchase order to track incoming inventory.
            </p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Order
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="ordered" className="space-y-6">
            <TabsList>
              <TabsTrigger value="ordered" className="gap-2">
                Ordered
                {orderedOrders.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                    {orderedOrders.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="received" className="gap-2">
                Received
                {receivedOrders.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-muted-foreground text-background">
                    {receivedOrders.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ordered" className="space-y-4">
              {orderedOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No pending orders
                </p>
              ) : (
                orderedOrders.map((order) => (
                  <PurchaseOrderCard
                    key={order.id}
                    order={order}
                    onMarkReceived={handleMarkReceived}
                    onDelete={deleteOrder}
                    onEdit={handleEdit}
                    loading={processingId === order.id}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="received" className="space-y-4">
              {receivedOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No received orders yet
                </p>
              ) : (
                receivedOrders.map((order) => (
                  <PurchaseOrderCard
                    key={order.id}
                    order={order}
                    onMarkReceived={handleMarkReceived}
                    onDelete={deleteOrder}
                    onEdit={handleEdit}
                    loading={processingId === order.id}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      <AddPurchaseOrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={createOrder}
        inventoryItems={inventoryItems}
      />

      {editingOrder && (
        <EditPurchaseOrderDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          order={editingOrder}
          onSave={updateOrder}
          inventoryItems={inventoryItems}
        />
      )}
    </div>
  );
}
