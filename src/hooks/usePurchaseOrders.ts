import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PurchaseOrder, DbPurchaseOrder, dbToPurchaseOrder, PurchaseOrderItem } from '@/types/purchaseOrder';
import { purchaseOrderSchema, validateInput } from '@/lib/validation';
import { updateVendorPriceFromPO } from '@/hooks/useItemVendorPrices';

interface DbVendor {
  id: string;
  name: string;
}

export function usePurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // Fetch orders and vendors in parallel
    const [ordersResult, vendorsResult] = await Promise.all([
      supabase
        .from('purchase_orders')
        .select('*')
        .order('ordered_at', { ascending: false }),
      supabase
        .from('vendors')
        .select('id, name'),
    ]);

    if (ordersResult.error) {
      console.error('Error loading purchase orders:', ordersResult.error);
      toast({
        title: 'Error loading purchase orders',
        description: 'Unable to load purchase orders. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Create vendor lookup map
    const vendorMap = new Map<string, string>();
    if (vendorsResult.data) {
      (vendorsResult.data as DbVendor[]).forEach((v) => {
        vendorMap.set(v.id, v.name);
      });
    }

    setOrders(
      (ordersResult.data as DbPurchaseOrder[]).map((db) =>
        dbToPurchaseOrder(db, db.vendor_id ? vendorMap.get(db.vendor_id) : null)
      )
    );
    setLoading(false);
  }, [toast, user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const uploadFile = async (file: File, type: 'pdf' | 'image'): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${type}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('purchase-orders')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      toast({
        title: 'Error uploading file',
        description: 'Unable to upload file. Please try again.',
        variant: 'destructive',
      });
      return null;
    }

    const { data } = supabase.storage
      .from('purchase-orders')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const createOrder = async (
    order: {
      items: PurchaseOrderItem[];
      orderedAt: Date;
      notes?: string;
      vendorId?: string | null;
      poNumber?: string;
    },
    pdfFile?: File | null,
    imageFile?: File | null
  ) => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please sign in to create purchase orders.',
        variant: 'destructive',
      });
      return;
    }

    // Validate input
    const validation = validateInput(purchaseOrderSchema, {
      items: order.items,
      orderedAt: order.orderedAt,
      notes: order.notes,
      vendorId: order.vendorId,
      poNumber: order.poNumber,
    });
    
    if (!validation.success) {
      toast({
        title: 'Validation error',
        description: validation.errors[0],
        variant: 'destructive',
      });
      return;
    }

    if (validation.data.items.length === 0) {
      toast({
        title: 'No items added',
        description: 'Please add at least one item to the order.',
        variant: 'destructive',
      });
      return;
    }

    let pdfUrl: string | null = null;
    let imageUrl: string | null = null;

    if (pdfFile) {
      pdfUrl = await uploadFile(pdfFile, 'pdf');
    }

    if (imageFile) {
      imageUrl = await uploadFile(imageFile, 'image');
    }

    // Use first item for legacy columns, store all in items array
    const firstItem = validation.data.items[0];
    const totalQuantity = validation.data.items.reduce((sum, item) => sum + item.quantity, 0);

    const { error } = await supabase.from('purchase_orders').insert([{
      user_id: user.id,
      po_number: validation.data.poNumber || null,
      sku: firstItem.sku,
      item_name: firstItem.itemName,
      quantity: totalQuantity,
      items: JSON.parse(JSON.stringify(validation.data.items)),
      ordered_at: validation.data.orderedAt.toISOString(),
      notes: validation.data.notes || null,
      vendor_id: validation.data.vendorId || null,
      pdf_url: pdfUrl,
      image_url: imageUrl,
      status: 'ordered',
    }]);

    if (error) {
      console.error('Error creating purchase order:', error);
      toast({
        title: 'Error creating purchase order',
        description: 'Unable to create purchase order. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Purchase order created successfully' });
    fetchOrders();
  };

  const markAsReceived = async (orderId: string) => {
    // Get the order to access its items and costs
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      toast({
        title: 'Order not found',
        variant: 'destructive',
      });
      return false;
    }

    // Prevent duplicate inventory updates if already received
    if (order.status === 'received') {
      toast({
        title: 'Order already received',
        description: 'This order has already been marked as received.',
      });
      return false;
    }

    // Update the purchase order status
    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'received',
        received_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error updating order',
        description: 'Unable to update order. Please try again.',
        variant: 'destructive',
      });
      return false;
    }

    // Update inventory items with new costs and quantities, and save vendor prices
    for (const item of order.items) {
      // Find matching inventory item by SKU
      const { data: inventoryItem } = await supabase
        .from('inventory_items')
        .select('id, quantity, cost')
        .eq('sku', item.sku)
        .eq('user_id', user!.id)
        .single();

      if (inventoryItem) {
        const updates: Record<string, unknown> = {
          quantity: inventoryItem.quantity + item.quantity,
        };

        // Update cost if provided in the PO
        if (item.unitCost !== undefined && item.unitCost > 0) {
          updates.cost = item.unitCost;
          
          // Also update the vendor price for this item if a vendor is assigned
          if (order.vendorId) {
            await updateVendorPriceFromPO(user!.id, inventoryItem.id, order.vendorId, item.unitCost);
          }
        }

        await supabase
          .from('inventory_items')
          .update(updates)
          .eq('id', inventoryItem.id);
      }
    }

    toast({ title: 'Order marked as received', description: 'Inventory and vendor prices updated' });
    fetchOrders();
    return true;
  };

  const updateOrder = async (
    orderId: string,
    updates: {
      items: PurchaseOrderItem[];
      orderedAt: Date;
      notes?: string;
      vendorId?: string | null;
      poNumber?: string;
    },
    pdfFile?: File | null,
    imageFile?: File | null
  ) => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please sign in to update purchase orders.',
        variant: 'destructive',
      });
      return;
    }

    // Validate input
    const validation = validateInput(purchaseOrderSchema, {
      items: updates.items,
      orderedAt: updates.orderedAt,
      notes: updates.notes,
      vendorId: updates.vendorId,
      poNumber: updates.poNumber,
    });
    
    if (!validation.success) {
      toast({
        title: 'Validation error',
        description: validation.errors[0],
        variant: 'destructive',
      });
      return;
    }

    if (validation.data.items.length === 0) {
      toast({
        title: 'No items added',
        description: 'Please add at least one item to the order.',
        variant: 'destructive',
      });
      return;
    }

    let pdfUrl: string | undefined;
    let imageUrl: string | undefined;

    if (pdfFile) {
      const url = await uploadFile(pdfFile, 'pdf');
      if (url) pdfUrl = url;
    }

    if (imageFile) {
      const url = await uploadFile(imageFile, 'image');
      if (url) imageUrl = url;
    }

    const firstItem = validation.data.items[0];
    const totalQuantity = validation.data.items.reduce((sum, item) => sum + item.quantity, 0);

    const updateData: Record<string, unknown> = {
      po_number: validation.data.poNumber || null,
      sku: firstItem.sku,
      item_name: firstItem.itemName,
      quantity: totalQuantity,
      items: JSON.parse(JSON.stringify(validation.data.items)),
      ordered_at: validation.data.orderedAt.toISOString(),
      notes: validation.data.notes || null,
      vendor_id: validation.data.vendorId !== undefined ? validation.data.vendorId : undefined,
    };

    if (pdfUrl) updateData.pdf_url = pdfUrl;
    if (imageUrl) updateData.image_url = imageUrl;

    const { error } = await supabase
      .from('purchase_orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      console.error('Error updating purchase order:', error);
      toast({
        title: 'Error updating purchase order',
        description: 'Unable to update purchase order. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Purchase order updated successfully' });
    fetchOrders();
  };

  const deleteOrder = async (id: string) => {
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting order:', error);
      toast({
        title: 'Error deleting order',
        description: 'Unable to delete order. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Purchase order deleted' });
    fetchOrders();
  };

  const markAsPaid = async (orderId: string, withdrawFromBank?: (amount: number, description: string) => Promise<boolean>) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      toast({
        title: 'Order not found',
        variant: 'destructive',
      });
      return false;
    }

    if (order.paidAt) {
      toast({
        title: 'Order already paid',
        description: 'This order has already been marked as paid.',
      });
      return false;
    }

    // Calculate total cost
    const TAX_RATE = 0.05;
    const subtotal = order.items.reduce((sum, item) => sum + (item.unitCost || 0) * item.quantity, 0);
    const totalCost = subtotal + (subtotal * TAX_RATE);

    // Withdraw from bank if function provided and there's a cost
    if (withdrawFromBank && totalCost > 0) {
      const poLabel = order.poNumber || `PO-${order.id.slice(0, 8).toUpperCase()}`;
      const success = await withdrawFromBank(totalCost, `Payment for ${poLabel}`);
      if (!success) {
        return false; // Bank withdrawal failed (likely insufficient funds)
      }
    }

    // Update the purchase order
    const { error } = await supabase
      .from('purchase_orders')
      .update({
        paid_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error marking as paid',
        description: 'Unable to update order. Please try again.',
        variant: 'destructive',
      });
      return false;
    }

    toast({ title: 'Order marked as paid', description: `${totalCost > 0 ? `$${totalCost.toFixed(2)} withdrawn from bank` : ''}` });
    fetchOrders();
    return true;
  };

  return {
    orders,
    loading,
    createOrder,
    updateOrder,
    markAsReceived,
    markAsPaid,
    deleteOrder,
    refetch: fetchOrders,
  };
}
