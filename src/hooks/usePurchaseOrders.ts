import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PurchaseOrder, DbPurchaseOrder, dbToPurchaseOrder, PurchaseOrderItem } from '@/types/purchaseOrder';

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

    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .order('ordered_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error loading purchase orders',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    setOrders((data as DbPurchaseOrder[]).map(dbToPurchaseOrder));
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
      toast({
        title: 'Error uploading file',
        description: uploadError.message,
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

    if (order.items.length === 0) {
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
    const firstItem = order.items[0];
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

    const { error } = await supabase.from('purchase_orders').insert([{
      user_id: user.id,
      sku: firstItem.sku,
      item_name: firstItem.itemName,
      quantity: totalQuantity,
      items: JSON.parse(JSON.stringify(order.items)),
      ordered_at: order.orderedAt.toISOString(),
      notes: order.notes || null,
      pdf_url: pdfUrl,
      image_url: imageUrl,
      status: 'ordered',
    }]);

    if (error) {
      toast({
        title: 'Error creating purchase order',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Purchase order created successfully' });
    fetchOrders();
  };

  const markAsReceived = async (orderId: string) => {
    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'received',
        received_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      toast({
        title: 'Error updating order',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    toast({ title: 'Order marked as received' });
    fetchOrders();
    return true;
  };

  const deleteOrder = async (id: string) => {
    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error deleting order',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Purchase order deleted' });
    fetchOrders();
  };

  return {
    orders,
    loading,
    createOrder,
    markAsReceived,
    deleteOrder,
    refetch: fetchOrders,
  };
}
