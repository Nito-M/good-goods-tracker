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

    // Fetch orders, vendors, and requests in parallel
    const [ordersResult, vendorsResult, requestsResult] = await Promise.all([
      supabase
        .from('purchase_orders')
        .select('*')
        .order('ordered_at', { ascending: false }),
      supabase
        .from('vendors')
        .select('id, name'),
      supabase
        .from('requests')
        .select('id, request_number'),
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

    // Create request lookup map
    const requestMap = new Map<string, string>();
    if (requestsResult.data) {
      requestsResult.data.forEach((r: { id: string; request_number: string | null }) => {
        if (r.request_number) {
          requestMap.set(r.id, r.request_number);
        }
      });
    }

    setOrders(
      (ordersResult.data as DbPurchaseOrder[]).map((db) =>
        dbToPurchaseOrder(
          db, 
          db.vendor_id ? vendorMap.get(db.vendor_id) : null,
          db.request_id ? requestMap.get(db.request_id) : null
        )
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

    const { data, error: signedUrlError } = await supabase.storage
      .from('purchase-orders')
      .createSignedUrl(fileName, 3600); // 1 hour expiry

    if (signedUrlError || !data) {
      console.error('Error creating signed URL:', signedUrlError);
      return null;
    }

    return data.signedUrl;
  };

  const createOrder = async (
    order: {
      items: PurchaseOrderItem[];
      orderedAt: Date;
      notes?: string;
      vendorId?: string | null;
      poNumber?: string;
      requestId?: string | null;
      status?: 'draft' | 'ordered';
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
      requestId: order.requestId,
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
      request_id: order.requestId || null,
      pdf_url: pdfUrl,
      image_url: imageUrl,
      status: order.status || 'ordered',
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
    // For custom items that don't exist, create them as new inventory items
    for (const item of order.items) {
      // Find matching inventory item by SKU
      const { data: inventoryItem } = await supabase
        .from('inventory_items')
        .select('id, quantity, cost')
        .eq('sku', item.sku)
        .eq('user_id', user!.id)
        .single();

      if (inventoryItem) {
        // Existing item - update quantity and cost
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
      } else {
        // Custom item - create new inventory item
        const { data: newItem, error: createError } = await supabase
          .from('inventory_items')
          .insert({
            user_id: user!.id,
            sku: item.sku,
            name: item.itemName,
            category: 'Other',
            quantity: item.quantity,
            cost: item.unitCost || 0,
            price: 0,
            min_stock: 0,
            weight: 0,
            weight_unit: 'lb',
            quantity_unit: 'pcs',
            dimensions_length: 0,
            dimensions_width: 0,
            dimensions_height: 0,
            dimensions_unit: 'in',
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating inventory item from PO:', createError);
        } else if (newItem && order.vendorId && item.unitCost && item.unitCost > 0) {
          // Save vendor price for the newly created item
          await updateVendorPriceFromPO(user!.id, newItem.id, order.vendorId, item.unitCost);
        }
      }
    }

    toast({ title: 'Order marked as received', description: 'Inventory updated (new items created if needed)' });
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
    // Get the order first to check if it was paid
    const order = orders.find((o) => o.id === id);
    
    // If the order was paid, reverse the bank withdrawal
    if (order?.paidAt) {
      const TAX_RATE = 0.05;
      const subtotal = order.items.reduce((sum, item) => sum + (item.unitCost || 0) * item.quantity, 0);
      const totalCost = subtotal + (subtotal * TAX_RATE);
      
      if (totalCost > 0) {
        const poLabel = order.poNumber || `PO-${order.id.slice(0, 8).toUpperCase()}`;
        
        // Add a refund deposit to reverse the withdrawal
        const { error: bankError } = await supabase
          .from('bank_transactions')
          .insert({
            user_id: user!.id,
            type: 'deposit',
            amount: totalCost,
            description: `Refund for deleted ${poLabel}`,
          });
        
        if (bankError) {
          console.error('Error refunding bank transaction:', bankError);
          toast({
            title: 'Warning',
            description: 'PO deleted but bank refund failed. Please add manually.',
            variant: 'destructive',
          });
        }
      }
    }

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

    const wasRefunded = order?.paidAt ? ' and bank refunded' : '';
    toast({ title: `Purchase order deleted${wasRefunded}` });
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

  const markAsOrdered = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status !== 'draft') return false;

    const { error } = await supabase
      .from('purchase_orders')
      .update({ status: 'ordered' })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error placing order',
        description: 'Unable to update order. Please try again.',
        variant: 'destructive',
      });
      return false;
    }

    toast({ title: 'Order placed successfully' });
    fetchOrders();
    return true;
  };

  return {
    orders,
    loading,
    createOrder,
    updateOrder,
    markAsOrdered,
    markAsReceived,
    markAsPaid,
    deleteOrder,
    refetch: fetchOrders,
  };
}
