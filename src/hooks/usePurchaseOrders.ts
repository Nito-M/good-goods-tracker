import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PurchaseOrder, DbPurchaseOrder, dbToPurchaseOrder, PurchaseOrderItem, PoAttachment } from '@/types/purchaseOrder';
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

    // Fetch orders, vendors, requests, jobs, po_job_links, companies, and attachments in parallel
    const [ordersResult, vendorsResult, requestsResult, jobsResult, jobLinksResult, companiesResult, attachmentsResult] = await Promise.all([
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
      supabase
        .from('jobs')
        .select('id, job_number'),
      supabase
        .from('po_job_links')
        .select('purchase_order_id, job_id'),
      supabase
        .from('companies')
        .select('id, name'),
      supabase
        .from('po_attachments')
        .select('*')
        .order('created_at', { ascending: true }),
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

    // Create job lookup map
    const jobMap = new Map<string, string>();
    if (jobsResult.data) {
      jobsResult.data.forEach((j: { id: string; job_number: string | null }) => {
        if (j.job_number) {
          jobMap.set(j.id, j.job_number);
        }
      });
    }

    // Build PO -> job IDs map from junction table
    const poJobMap = new Map<string, string[]>();
    if (jobLinksResult.data) {
      for (const link of jobLinksResult.data) {
        const poId = (link as { purchase_order_id: string; job_id: string }).purchase_order_id;
        const jobId = (link as { purchase_order_id: string; job_id: string }).job_id;
        if (!poJobMap.has(poId)) poJobMap.set(poId, []);
        poJobMap.get(poId)!.push(jobId);
      }
    }

    // Create company lookup map
    const companyMap = new Map<string, string>();
    if (companiesResult.data) {
      companiesResult.data.forEach((c: { id: string; name: string }) => {
        companyMap.set(c.id, c.name);
      });
    }

    // Build PO -> attachments map (raw, URLs will be signed below)
    const rawAttachmentsMap = new Map<string, any[]>();
    if (attachmentsResult.data) {
      for (const a of attachmentsResult.data as any[]) {
        if (!rawAttachmentsMap.has(a.purchase_order_id)) rawAttachmentsMap.set(a.purchase_order_id, []);
        rawAttachmentsMap.get(a.purchase_order_id)!.push(a);
      }
    }

    // Convert stored values to storage paths so legacy signed/public URLs get refreshed too
    const extractPurchaseOrderPath = (value: string | null | undefined): string | null => {
      if (!value) return null;

      // New format: raw storage path already stored in DB
      if (!value.startsWith('http')) return value;

      // Legacy format: full signed/public URL stored in DB
      try {
        const parsed = new URL(value);
        const signedPrefix = '/storage/v1/object/sign/purchase-orders/';
        const publicPrefix = '/storage/v1/object/public/purchase-orders/';

        if (parsed.pathname.startsWith(signedPrefix)) {
          return decodeURIComponent(parsed.pathname.slice(signedPrefix.length));
        }

        if (parsed.pathname.startsWith(publicPrefix)) {
          return decodeURIComponent(parsed.pathname.slice(publicPrefix.length));
        }

        return null;
      } catch {
        return null;
      }
    };

    // Collect all storage paths that need signing (legacy fields + attachment urls)
    const pathSet = new Set<string>();
    const dbRows = ordersResult.data as DbPurchaseOrder[];

    for (const db of dbRows) {
      const imagePath = extractPurchaseOrderPath(db.image_url);
      const pdfPath = extractPurchaseOrderPath(db.pdf_url);
      if (imagePath) pathSet.add(imagePath);
      if (pdfPath) pathSet.add(pdfPath);

      const atts = rawAttachmentsMap.get(db.id) || [];
      for (const a of atts) {
        const attachmentPath = extractPurchaseOrderPath(a.url);
        if (attachmentPath) pathSet.add(attachmentPath);
      }
    }

    const pathsToSign = Array.from(pathSet);

    // Batch-sign all paths
    const signedUrlMap = new Map<string, string>();
    if (pathsToSign.length > 0) {
      const { data: signedData } = await supabase.storage
        .from('purchase-orders')
        .createSignedUrls(pathsToSign, 3600);
      if (signedData) {
        for (const item of signedData) {
          if (item.signedUrl && item.path) {
            signedUrlMap.set(item.path, item.signedUrl);
          }
        }
      }
    }

    const resolveUrl = (url: string | null | undefined): string | null => {
      if (!url) return null;

      const storagePath = extractPurchaseOrderPath(url);
      if (storagePath) {
        return signedUrlMap.get(storagePath) || null;
      }

      // Keep true external URLs working
      if (url.startsWith('http')) return url;

      return null;
    };

    setOrders(
      dbRows.map((db) => {
        const jobIds = poJobMap.get(db.id) || [];
        const jobNumbers = jobIds.map(jid => jobMap.get(jid)).filter(Boolean) as string[];
        const companyId = (db as any).company_id;
        const order = dbToPurchaseOrder(
          db, 
          db.vendor_id ? vendorMap.get(db.vendor_id) : null,
          db.request_id ? requestMap.get(db.request_id) : null,
          jobIds,
          jobNumbers,
          companyId ? companyMap.get(companyId) : null,
        );
        // Resolve signed URLs for legacy fields
        order.imageUrl = resolveUrl(db.image_url) || order.imageUrl;
        order.pdfUrl = resolveUrl(db.pdf_url) || order.pdfUrl;

        // Resolve signed URLs for attachments
        const rawAtts = rawAttachmentsMap.get(db.id) || [];
        order.attachments = rawAtts.map(a => ({
          id: a.id,
          purchaseOrderId: a.purchase_order_id,
          url: resolveUrl(a.url) || a.url,
          fileType: a.file_type as 'image' | 'pdf',
          fileName: a.file_name,
          createdAt: new Date(a.created_at),
        }));
        return order;
      })
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

    // Return the storage path, not a signed URL
    return fileName;
  };

  const createOrder = async (
    order: {
      items: PurchaseOrderItem[];
      orderedAt: Date;
      notes?: string;
      vendorId?: string | null;
      poNumber?: string;
      requestId?: string | null;
      jobIds?: string[];
      status?: 'draft' | 'ordered';
      discountType?: 'percentage' | 'fixed';
      discountValue?: number;
      discountAmount?: number;
      companyId?: string | null;
      bankCardId?: string | null;
      contactPersonName?: string | null;
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
      jobIds: order.jobIds,
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

    const { data: insertedPO, error } = await supabase.from('purchase_orders').insert([{
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
      discount_type: order.discountType || 'percentage',
      discount_value: order.discountValue || 0,
      discount_amount: order.discountAmount || 0,
      company_id: order.companyId || null,
      bank_card_id: order.bankCardId || null,
      contact_person_name: order.contactPersonName || null,
    }]).select('id').single();

    if (error) {
      console.error('Error creating purchase order:', error);
      toast({
        title: 'Error creating purchase order',
        description: 'Unable to create purchase order. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    // Insert job links
    const jobIds = order.jobIds || [];
    if (insertedPO && jobIds.length > 0) {
      await supabase.from('po_job_links').insert(
        jobIds.map((jid: string) => ({ purchase_order_id: insertedPO.id, job_id: jid }))
      );
    }

    toast({ title: 'Purchase order created successfully' });
    fetchOrders();
  };

  const markAsReceived = async (
    orderId: string,
    locationItems?: { warehouseId: string; items: { sku: string; itemName: string; quantity: number }[] }[],
    partial?: boolean,
    prevReceivedOverrides?: Record<string, number>,
  ) => {
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

    // Update the purchase order status and items with received quantities
    const validLocations = locationItems?.filter(e => e.warehouseId && e.items.length > 0) || [];

    // Build per-item total quantities to add to inventory (sum across all locations)
    const itemTotalMap = new Map<string, number>();
    for (const loc of validLocations) {
      for (const item of loc.items) {
        itemTotalMap.set(item.sku, (itemTotalMap.get(item.sku) || 0) + item.quantity);
      }
    }

    // Build updated items with receivedQuantity tracking.
    // If the dialog provided a prev-received override, use it as the new baseline.
    const updatedItems = order.items.map(item => {
      const overridePrev = prevReceivedOverrides?.[item.sku];
      const prevReceived = overridePrev !== undefined ? overridePrev : (item.receivedQuantity || 0);
      const newlyReceived = itemTotalMap.get(item.sku) || 0;
      return {
        ...item,
        receivedQuantity: prevReceived + newlyReceived,
      };
    });

    // Auto-promote to fully received if every line is now fully received.
    const allFull = updatedItems.every(i => (i.receivedQuantity || 0) >= i.quantity);
    const newStatus = (!partial || allFull) ? 'received' : 'partially_received';

    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: newStatus,
        items: JSON.parse(JSON.stringify(updatedItems)),
        ...(newStatus === 'received' ? { received_at: new Date().toISOString() } : {}),
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

    // Determine which items to process from order
    const itemsToReceive = order.items.filter(oi => itemTotalMap.has(oi.sku));
    const missingItems: string[] = [];

    // Update inventory items with new costs and quantities, and save vendor prices
    for (const item of itemsToReceive) {
      const receiveQty = itemTotalMap.get(item.sku) || 0;

      // Prefer looking up by tracked inventoryItemId; fall back to SKU match
      let inventoryItem: { id: string; quantity: number; cost: number } | null = null;
      if (item.inventoryItemId) {
        const { data } = await supabase
          .from('inventory_items')
          .select('id, quantity, cost')
          .eq('id', item.inventoryItemId)
          .maybeSingle();
        inventoryItem = data ?? null;
      }
      if (!inventoryItem) {
        const { data } = await supabase
          .from('inventory_items')
          .select('id, quantity, cost')
          .eq('sku', item.sku)
          .eq('user_id', user!.id)
          .maybeSingle();
        inventoryItem = data ?? null;
      }

      if (!inventoryItem) {
        // Do NOT auto-create. Skip and warn — keeps inventory clean.
        missingItems.push(`${item.itemName} (${item.sku})`);
        continue;
      }

      // Existing item - update quantity and cost
      const updates: Record<string, unknown> = {
        quantity: inventoryItem.quantity + receiveQty,
      };

      // Update cost if provided in the PO
      if (item.unitCost !== undefined && item.unitCost > 0) {
        updates.cost = item.unitCost;

        if (order.vendorId) {
          await updateVendorPriceFromPO(user!.id, inventoryItem.id, order.vendorId, item.unitCost);
        }
      }

      await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', inventoryItem.id);

      // Update item_location_quantities per location
      for (const loc of validLocations) {
        const locItem = loc.items.find(li => li.sku === item.sku);
        if (!locItem || locItem.quantity <= 0) continue;

        const { data: existingLocQty } = await supabase
          .from('item_location_quantities')
          .select('id, quantity')
          .eq('item_id', inventoryItem.id)
          .eq('warehouse_id', loc.warehouseId)
          .single();

        if (existingLocQty) {
          await supabase
            .from('item_location_quantities')
            .update({ quantity: existingLocQty.quantity + locItem.quantity })
            .eq('id', existingLocQty.id);
        } else {
          await supabase
            .from('item_location_quantities')
            .insert({
              item_id: inventoryItem.id,
              warehouse_id: loc.warehouseId,
              quantity: locItem.quantity,
              user_id: user!.id,
            });
        }
      }
    }

    if (missingItems.length > 0) {
      toast({
        title: 'Some lines were not received into inventory',
        description: `No matching inventory item found for: ${missingItems.join(', ')}. Add them in Items first, then receive again.`,
        variant: 'destructive',
      });
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
      jobIds?: string[];
      poNumber?: string;
      discountType?: 'percentage' | 'fixed';
      discountValue?: number;
      discountAmount?: number;
      companyId?: string | null;
      bankCardId?: string | null;
      contactPersonName?: string | null;
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
      discount_type: updates.discountType || 'percentage',
      discount_value: updates.discountValue || 0,
      discount_amount: updates.discountAmount || 0,
      company_id: updates.companyId !== undefined ? (updates.companyId || null) : undefined,
      bank_card_id: updates.bankCardId !== undefined ? (updates.bankCardId || null) : undefined,
      contact_person_name: updates.contactPersonName !== undefined ? (updates.contactPersonName || null) : undefined,
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

    // Update job links: delete old, insert new
    const jobIds = updates.jobIds || [];
    await supabase.from('po_job_links').delete().eq('purchase_order_id', orderId);
    if (jobIds.length > 0) {
      await supabase.from('po_job_links').insert(
        jobIds.map((jid: string) => ({ purchase_order_id: orderId, job_id: jid }))
      );
    }

    // If the PO is already paid and a card is being added/changed, handle the financial transaction
    const existingOrder = orders.find(o => o.id === orderId);
    if (existingOrder?.paidAt && updates.bankCardId) {
      const oldCardId = existingOrder.bankCardId;
      const newCardId = updates.bankCardId;

      if (oldCardId !== newCardId) {
        const TAX_RATE = 0.05;
        const subtotal = updates.items.reduce((sum, item) => sum + (item.unitCost || 0) * item.quantity, 0);
        const discountAmount = updates.discountAmount || 0;
        const afterDiscount = Math.max(0, subtotal - discountAmount);
        const totalCost = afterDiscount + (afterDiscount * TAX_RATE);
        const poLabel = updates.poNumber || existingOrder.poNumber || `PO-${orderId.slice(0, 8).toUpperCase()}`;

        if (totalCost > 0) {
          // If there was an old card, refund it
          if (oldCardId) {
            const { data: oldCard } = await supabase
              .from('bank_cards')
              .select('balance, name')
              .eq('id', oldCardId)
              .single();
            if (oldCard) {
              await supabase
                .from('bank_cards')
                .update({ balance: Number(oldCard.balance) + totalCost })
                .eq('id', oldCardId);
            }
            // Update existing bank transaction to remove old card link
            const { data: existingTx } = await supabase
              .from('bank_transactions')
              .select('id')
              .eq('user_id', user.id)
              .eq('type', 'withdrawal')
              .eq('bank_card_id', oldCardId)
              .ilike('description', `%${poLabel}%`)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            if (existingTx) {
              await supabase.from('bank_transactions').update({ bank_card_id: newCardId } as any).eq('id', existingTx.id);
            }
          }

          // Deduct from the new card
          const { data: newCard } = await supabase
            .from('bank_cards')
            .select('balance, name')
            .eq('id', newCardId)
            .single();
          if (newCard) {
            await supabase
              .from('bank_cards')
              .update({ balance: Number(newCard.balance) - totalCost })
              .eq('id', newCardId);
          }

          // If there was no old card, tag the existing bank transaction with the new card
          if (!oldCardId) {
            const { data: existingTx } = await supabase
              .from('bank_transactions')
              .select('id')
              .eq('user_id', user.id)
              .eq('type', 'withdrawal')
              .ilike('description', `%${poLabel}%`)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            if (existingTx) {
              await supabase.from('bank_transactions').update({ bank_card_id: newCardId } as any).eq('id', existingTx.id);
            }
          }
        }
      }
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
      const afterDiscount = Math.max(0, subtotal - (order.discountAmount || 0));
      const totalCost = afterDiscount + (afterDiscount * TAX_RATE);
      
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
    const afterDiscount = Math.max(0, subtotal - (order.discountAmount || 0));
    const totalCost = afterDiscount + (afterDiscount * TAX_RATE);

    const poLabel = order.poNumber || `PO-${order.id.slice(0, 8).toUpperCase()}`;

    if (totalCost > 0) {
      // If a bank card is linked, also deduct from that card's balance
      if (order.bankCardId) {
        const { data: cardData, error: cardFetchError } = await supabase
          .from('bank_cards')
          .select('balance, name')
          .eq('id', order.bankCardId)
          .single();

        if (cardFetchError || !cardData) {
          toast({
            title: 'Error fetching card',
            description: 'Could not load the linked bank card. Please try again.',
            variant: 'destructive',
          });
          return false;
        }

        const newBalance = Number(cardData.balance) - totalCost;

        const { error: cardUpdateError } = await supabase
          .from('bank_cards')
          .update({ balance: newBalance })
          .eq('id', order.bankCardId);

        if (cardUpdateError) {
          toast({
            title: 'Error updating card balance',
            description: 'Unable to deduct from card. Please try again.',
            variant: 'destructive',
          });
          return false;
        }
      }

      // Always record a withdrawal in the bank transaction ledger (tagged with card if applicable)
      const cardSuffix = order.bankCardId ? ' (card)' : '';
      const txDescription = `Payment for ${poLabel}${cardSuffix}`;
      if (withdrawFromBank) {
        const success = await withdrawFromBank(totalCost, txDescription);
        if (!success) {
          return false;
        }
        // Tag the most recently inserted withdrawal with the card id if applicable
        if (order.bankCardId) {
          const { data: latestTx } = await supabase
            .from('bank_transactions')
            .select('id')
            .eq('user_id', user!.id)
            .eq('type', 'withdrawal')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          if (latestTx) {
            await supabase.from('bank_transactions').update({ bank_card_id: order.bankCardId } as any).eq('id', latestTx.id);
          }
        }
      } else {
        await supabase.from('bank_transactions').insert({
          user_id: user!.id,
          type: 'withdrawal',
          amount: totalCost,
          description: txDescription,
          bank_card_id: order.bankCardId || null,
        } as any);
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

    const cardMsg = order.bankCardId
      ? `$${totalCost.toFixed(2)} charged to card & recorded in bank`
      : totalCost > 0 ? `$${totalCost.toFixed(2)} withdrawn from bank` : '';
    toast({ title: 'Order marked as paid', description: cardMsg });
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

  const uploadImageForOrder = async (orderId: string, file: File): Promise<boolean> => {
    if (!user) return false;
    const url = await uploadFile(file, 'image');
    if (!url) return false;
    const { error } = await supabase
      .from('purchase_orders')
      .update({ image_url: url })
      .eq('id', orderId);
    if (error) {
      console.error('Error saving image URL:', error);
      toast({ title: 'Error saving image', variant: 'destructive' });
      return false;
    }
    await fetchOrders();
    return true;
  };

  const deleteImageForOrder = async (orderId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('purchase_orders')
      .update({ image_url: null })
      .eq('id', orderId);
    if (error) {
      console.error('Error removing image:', error);
      toast({ title: 'Error removing image', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Image removed' });
    await fetchOrders();
    return true;
  };

  const deletePdfForOrder = async (orderId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('purchase_orders')
      .update({ pdf_url: null })
      .eq('id', orderId);
    if (error) {
      console.error('Error removing PDF:', error);
      toast({ title: 'Error removing PDF', variant: 'destructive' });
      return false;
    }
    toast({ title: 'PDF removed' });
    await fetchOrders();
    return true;
  };

  const addAttachment = async (orderId: string, file: File): Promise<boolean> => {
    if (!user) return false;
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) {
      toast({ title: 'Unsupported file type', description: 'Please upload an image or PDF.', variant: 'destructive' });
      return false;
    }
    const fileExt = file.name.split('.').pop();
    const fileType = isImage ? 'image' : 'pdf';
    const fileName = `${user.id}/${Date.now()}-${fileType}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('purchase-orders').upload(fileName, file);
    if (uploadError) {
      toast({ title: 'Error uploading file', variant: 'destructive' });
      return false;
    }
    // Store the storage path, not a signed URL
    const { error: insertError } = await supabase.from('po_attachments').insert({
      purchase_order_id: orderId,
      user_id: user.id,
      url: fileName,
      file_type: fileType,
      file_name: file.name,
    });
    if (insertError) {
      toast({ title: 'Error saving attachment', variant: 'destructive' });
      return false;
    }
    await fetchOrders();
    return true;
  };

  const deleteAttachment = async (attachmentId: string): Promise<boolean> => {
    const { error } = await supabase.from('po_attachments').delete().eq('id', attachmentId);
    if (error) {
      toast({ title: 'Error removing attachment', variant: 'destructive' });
      return false;
    }
    await fetchOrders();
    return true;
  };

  const revertOrder = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      toast({ title: 'Order not found', variant: 'destructive' });
      return false;
    }

    if (order.status !== 'received' && order.status !== 'partially_received') {
      toast({ title: 'Only received or partially received orders can be reverted', variant: 'destructive' });
      return false;
    }

    // Remove from inventory the actual received quantity per line
    // (for fully received orders this equals item.quantity; for partial it equals receivedQuantity).
    for (const item of order.items) {
      const qtyToReverse = order.status === 'received'
        ? item.quantity
        : (item.receivedQuantity || 0);
      if (qtyToReverse <= 0) continue;

      const { data: inventoryItem } = await supabase
        .from('inventory_items')
        .select('id, quantity')
        .eq('sku', item.sku)
        .eq('user_id', user!.id)
        .single();

      if (inventoryItem) {
        const newQty = Math.max(0, inventoryItem.quantity - qtyToReverse);
        await supabase
          .from('inventory_items')
          .update({ quantity: newQty })
          .eq('id', inventoryItem.id);

        // Also reduce location quantities
        const { data: locQtys } = await supabase
          .from('item_location_quantities')
          .select('id, quantity')
          .eq('item_id', inventoryItem.id)
          .eq('user_id', user!.id);

        if (locQtys) {
          let remaining = qtyToReverse;
          for (const loc of locQtys) {
            if (remaining <= 0) break;
            const reduce = Math.min(loc.quantity, remaining);
            await supabase
              .from('item_location_quantities')
              .update({ quantity: loc.quantity - reduce })
              .eq('id', loc.id);
            remaining -= reduce;
          }
        }
      }
    }

    // Reset per-item receivedQuantity to 0 and revert PO status to ordered
    const clearedItems = order.items.map(i => ({ ...i, receivedQuantity: 0 }));
    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'ordered',
        received_at: null,
        partially_received_at: null,
        items: JSON.parse(JSON.stringify(clearedItems)),
      })
      .eq('id', orderId);

    if (error) {
      toast({ title: 'Error reverting order', variant: 'destructive' });
      return false;
    }

    toast({ title: 'Order reverted', description: 'Items removed from inventory' });
    fetchOrders();
    return true;
  };


  const markAsPartiallyReceived = async (orderId: string) => {
    const { error } = await supabase
      .from('purchase_orders')
      .update({ status: 'partially_received', partially_received_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      toast({ title: 'Error updating order', variant: 'destructive' });
      return false;
    }

    toast({ title: 'Order marked as partially received' });
    fetchOrders();
    return true;
  };

  const updateInternalNotes = async (orderId: string, notes: string | null) => {
    const { error } = await supabase
      .from('purchase_orders')
      .update({ internal_notes: notes })
      .eq('id', orderId);
    if (error) {
      toast({ title: 'Error saving notes', variant: 'destructive' });
      return false;
    }
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, internalNotes: notes } : o));
    return true;
  };

  const revertPaid = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || !order.paidAt) return false;

    // Reverse the financial transaction
    const TAX_RATE = 0.05;
    const subtotal = order.items.reduce((sum, item) => sum + (item.unitCost || 0) * item.quantity, 0);
    const afterDiscount = Math.max(0, subtotal - (order.discountAmount || 0));
    const totalCost = afterDiscount + (afterDiscount * TAX_RATE);
    const poLabel = order.poNumber || `PO-${order.id.slice(0, 8).toUpperCase()}`;

    if (totalCost > 0) {
      // Refund bank card balance if applicable
      if (order.bankCardId) {
        const { data: cardData } = await supabase
          .from('bank_cards')
          .select('balance')
          .eq('id', order.bankCardId)
          .single();

        if (cardData) {
          await supabase
            .from('bank_cards')
            .update({ balance: Number(cardData.balance) + totalCost })
            .eq('id', order.bankCardId);
        }
      }

      // Add a refund deposit to reverse the withdrawal
      await supabase.from('bank_transactions').insert({
        user_id: user!.id,
        type: 'deposit',
        amount: totalCost,
        description: `Revert payment for ${poLabel}`,
        bank_card_id: order.bankCardId || null,
      } as any);
    }

    // Clear paid_at
    const { error } = await supabase
      .from('purchase_orders')
      .update({ paid_at: null })
      .eq('id', orderId);

    if (error) {
      toast({ title: 'Error reverting payment', variant: 'destructive' });
      return false;
    }

    toast({ title: 'Payment reverted', description: totalCost > 0 ? `$${totalCost.toFixed(2)} refunded to bank` : undefined });
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
    markAsPartiallyReceived,
    markAsPaid,
    revertPaid,
    revertOrder,
    deleteOrder,
    uploadImageForOrder,
    deleteImageForOrder,
    deletePdfForOrder,
    addAttachment,
    deleteAttachment,
    updateInternalNotes,
    refetch: fetchOrders,
  };
}
