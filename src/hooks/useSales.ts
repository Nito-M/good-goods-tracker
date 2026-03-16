import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Sale, SaleItem, CreateSaleInput, SaleStatus } from '@/types/sale';
import { createSaleSchema, validateInput } from '@/lib/validation';

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSales = async () => {
    if (!user) return;

    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          vendors (name, address)
        `)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      const salesWithItems: Sale[] = await Promise.all(
        (salesData || []).map(async (sale) => {
          const { data: items } = await supabase
            .from('sale_items')
            .select('*')
            .eq('sale_id', sale.id);

          const mappedItems = (items || []).map((item) => {
            const unitCost = Number(item.unit_cost) || 0;
            const totalCost = unitCost * item.quantity;
            const totalPrice = Number(item.total_price);
            return {
              id: item.id,
              saleId: item.sale_id,
              inventoryItemId: item.inventory_item_id,
              itemName: item.item_name,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: Number(item.unit_price),
              unitCost,
              totalPrice,
              totalCost,
              profit: totalPrice - totalCost,
              createdAt: item.created_at,
            };
          });

          const totalCost = mappedItems.reduce((sum, item) => sum + item.totalCost, 0);
          const totalProfit = mappedItems.reduce((sum, item) => sum + item.profit, 0);

          return {
            id: sale.id,
            userId: sale.user_id,
            vendorId: sale.vendor_id,
            vendorName: sale.vendors?.name,
            vendorAddress: sale.vendors?.address,
            invoiceNumber: sale.invoice_number,
            status: sale.status as Sale['status'],
            pickedUpAt: sale.picked_up_at,
            subtotal: Number(sale.subtotal),
            totalCost,
            totalProfit,
            taxRate: Number(sale.tax_rate),
            taxAmount: Number(sale.tax_amount),
            discountRate: Number(sale.discount_rate),
            discountAmount: Number(sale.discount_amount),
            total: Number(sale.total),
            notes: sale.notes,
            paymentTerms: sale.payment_terms,
            dueDate: sale.due_date,
            items: mappedItems,
            createdAt: sale.created_at,
            updatedAt: sale.updated_at,
            companyId: (sale as any).company_id || null,
          };
        })
      );

      setSales(salesWithItems);
    } catch (error: unknown) {
      console.error('Error fetching sales:', error);
      toast({
        title: 'Error fetching sales',
        description: 'Unable to load sales. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [user]);

  // Get available PO quantities for FIFO costing
  const getAvailablePOItems = async (sku: string): Promise<Array<{
    poId: string;
    unitCost: number;
    availableQty: number;
    receivedAt: Date;
  }>> => {
    // Get all received POs containing this SKU
    const { data: poData } = await supabase
      .from('purchase_orders')
      .select('id, items, received_at')
      .eq('status', 'received')
      .order('received_at', { ascending: true });

    if (!poData) return [];

    // Get already allocated quantities for this SKU
    const { data: allocations } = await supabase
      .from('po_item_allocations')
      .select('purchase_order_id, quantity_allocated')
      .eq('sku', sku);

    const allocatedByPO = new Map<string, number>();
    if (allocations) {
      for (const alloc of allocations) {
        const current = allocatedByPO.get(alloc.purchase_order_id) || 0;
        allocatedByPO.set(alloc.purchase_order_id, current + alloc.quantity_allocated);
      }
    }

    const result: Array<{
      poId: string;
      unitCost: number;
      availableQty: number;
      receivedAt: Date;
    }> = [];

    for (const po of poData) {
      const items = po.items as Array<{ sku: string; quantity: number; unitCost?: number }> | null;
      if (!items || !Array.isArray(items)) continue;

      const matchingItem = items.find(item => item.sku === sku);
      if (!matchingItem) continue;

      const totalQty = matchingItem.quantity;
      const allocatedQty = allocatedByPO.get(po.id) || 0;
      const availableQty = totalQty - allocatedQty;

      if (availableQty > 0) {
        result.push({
          poId: po.id,
          unitCost: matchingItem.unitCost || 0,
          availableQty,
          receivedAt: new Date(po.received_at!),
        });
      }
    }

    return result;
  };

  const createSale = async (input: CreateSaleInput): Promise<Sale | null> => {
    if (!user) return null;

    // Validate input
    const validation = validateInput(createSaleSchema, {
      vendorId: input.vendorId,
      invoiceNumber: input.invoiceNumber,
      items: input.items,
      taxRate: input.taxRate,
      discountRate: input.discountRate,
      notes: input.notes,
      paymentTerms: input.paymentTerms,
      dueDate: input.dueDate,
    });
    
    if (!validation.success) {
      toast({
        title: 'Validation error',
        description: validation.errors[0],
        variant: 'destructive',
      });
      return null;
    }

    try {
      // For each item, get FIFO costs from POs
      const itemsWithFIFOCosts: Array<{
        item: typeof input.items[0];
        allocations: Array<{ poId: string; quantity: number; unitCost: number }>;
        weightedAvgCost: number;
      }> = [];

      for (const item of input.items) {
        const availablePOs = await getAvailablePOItems(item.sku);
        const allocations: Array<{ poId: string; quantity: number; unitCost: number }> = [];
        let remainingQty = item.quantity;
        let totalCostWeighted = 0;

        // Allocate from POs in FIFO order
        for (const po of availablePOs) {
          if (remainingQty <= 0) break;

          const qtyFromThisPO = Math.min(remainingQty, po.availableQty);
          allocations.push({
            poId: po.poId,
            quantity: qtyFromThisPO,
            unitCost: po.unitCost,
          });
          totalCostWeighted += qtyFromThisPO * po.unitCost;
          remainingQty -= qtyFromThisPO;
        }

        // If we still have remaining qty, use the passed unitCost (for items not from POs)
        if (remainingQty > 0) {
          totalCostWeighted += remainingQty * item.unitCost;
        }

        const weightedAvgCost = item.quantity > 0 ? totalCostWeighted / item.quantity : item.unitCost;

        itemsWithFIFOCosts.push({
          item,
          allocations,
          weightedAvgCost,
        });
      }

      // Calculate totals using FIFO costs
      const subtotal = input.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const discountAmount = subtotal * (input.discountRate / 100);
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = afterDiscount * (input.taxRate / 100);
      const total = afterDiscount + taxAmount;

      // Create sale with draft status by default
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: user.id,
          vendor_id: input.vendorId,
          invoice_number: input.invoiceNumber || null,
          status: 'draft',
          subtotal,
          tax_rate: input.taxRate,
          tax_amount: taxAmount,
          discount_rate: input.discountRate,
          discount_amount: discountAmount,
          total,
          notes: input.notes,
          payment_terms: input.paymentTerms,
          due_date: input.dueDate,
          company_id: input.companyId || null,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items with FIFO costs (but don't allocate or reduce inventory yet)
      for (const { item, allocations, weightedAvgCost } of itemsWithFIFOCosts) {
        const { error: itemError } = await supabase
          .from('sale_items')
          .insert({
            sale_id: sale.id,
            inventory_item_id: item.inventoryItemId,
            item_name: item.itemName,
            sku: item.sku,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            unit_cost: weightedAvgCost,
            total_price: item.quantity * item.unitPrice,
          });

        if (itemError) throw itemError;
        
        // Note: PO allocations and inventory reduction now happen when marked as "picked_up"
      }

      // Get current invoice_next_number and increment it
      const { data: profileData } = await supabase
        .from('profiles')
        .select('invoice_next_number')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        await supabase
          .from('profiles')
          .update({ invoice_next_number: (profileData.invoice_next_number || 1) + 1 })
          .eq('user_id', user.id);
      }

      toast({
        title: 'Sale completed',
        description: `Invoice ${sale.invoice_number} created successfully`,
      });

      await fetchSales();
      return sales.find((s) => s.id === sale.id) || null;
    } catch (error: unknown) {
      console.error('Error creating sale:', error);
      toast({
        title: 'Error creating sale',
        description: 'Unable to create sale. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteSale = async (id: string) => {
    try {
      // Find the sale to delete
      const sale = sales.find((s) => s.id === id);
      if (!sale) throw new Error('Sale not found');

      // Only restore inventory/allocations if the sale was picked up (inventory was reduced)
      // and wasn't already reverted (cancelled)
      const wasPickedUp = !!sale.pickedUpAt;
      const needsRestoration = sale.status !== 'cancelled' && wasPickedUp;

      // Get sale items for inventory restoration and PO allocation cleanup
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', id);

      if (needsRestoration && saleItems) {
        for (const saleItem of saleItems) {
          if (saleItem.inventory_item_id) {
            // Get current inventory quantity
            const { data: inventoryItem } = await supabase
              .from('inventory_items')
              .select('quantity')
              .eq('id', saleItem.inventory_item_id)
              .single();

            if (inventoryItem) {
              // Restore the quantity
              await supabase
                .from('inventory_items')
                .update({ quantity: inventoryItem.quantity + saleItem.quantity })
                .eq('id', saleItem.inventory_item_id);
            }
          }

          // Delete PO allocations for this sale item (restores FIFO availability)
          await supabase
            .from('po_item_allocations')
            .delete()
            .eq('sale_item_id', saleItem.id);
        }
      }

      // Remove any bank transactions associated with this sale (safe even if already deleted)
      await supabase
        .from('bank_transactions')
        .delete()
        .eq('sale_id', id);

      // Delete the sale (this will cascade delete sale_items)
      const { error } = await supabase.from('sales').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sale deleted',
        description: needsRestoration 
          ? 'Inventory restored, allocations cleared, and bank transaction reversed'
          : 'Sale record deleted',
      });

      setSales((prev) => prev.filter((s) => s.id !== id));
    } catch (error: unknown) {
      console.error('Error deleting sale:', error);
      toast({
        title: 'Error deleting sale',
        description: 'Unable to delete sale. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const revertSale = async (id: string) => {
    try {
      // Find the sale to revert
      const sale = sales.find((s) => s.id === id);
      if (!sale) throw new Error('Sale not found');

      if (sale.status === 'cancelled') {
        toast({
          title: 'Already reverted',
          description: 'This sale has already been reverted',
          variant: 'destructive',
        });
        return;
      }

      // Only restore inventory if it was actually picked up (pickedUpAt is set)
      const wasPickedUp = !!sale.pickedUpAt;

      // Get sale items to find their IDs for deleting allocations
      const { data: saleItems } = await supabase
        .from('sale_items')
        .select('id, inventory_item_id, quantity')
        .eq('sale_id', id);

      if (saleItems) {
        for (const saleItem of saleItems) {
          // Only delete allocations and restore inventory if it was picked up
          if (wasPickedUp) {
            await supabase
              .from('po_item_allocations')
              .delete()
              .eq('sale_item_id', saleItem.id);

            // Restore inventory quantities
            if (saleItem.inventory_item_id) {
              const { data: currentItem } = await supabase
                .from('inventory_items')
                .select('quantity')
                .eq('id', saleItem.inventory_item_id)
                .single();

              if (currentItem) {
                await supabase
                  .from('inventory_items')
                  .update({ quantity: currentItem.quantity + saleItem.quantity })
                  .eq('id', saleItem.inventory_item_id);
              }
            }
          }
        }
      }

      // Remove any bank transactions associated with this sale (profit entry)
      await supabase
        .from('bank_transactions')
        .delete()
        .eq('sale_id', id);

      // Update sale status to cancelled and clear picked_up_at
      const { error } = await supabase
        .from('sales')
        .update({ status: 'cancelled', picked_up_at: null })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sale reverted',
        description: wasPickedUp 
          ? 'Items restored to inventory and bank transaction reversed'
          : 'Invoice cancelled',
      });

      // Update local state
      setSales((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, status: 'cancelled' as const, pickedUpAt: null } : s
        )
      );
    } catch (error: unknown) {
      console.error('Error reverting sale:', error);
      toast({
        title: 'Error reverting sale',
        description: 'Unable to revert sale. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const updateSale = async (
    saleId: string,
    input: {
      vendorId: string | null;
      invoiceNumber: string;
      items: Array<{
        id: string;
        inventoryItemId: string | null;
        itemName: string;
        sku: string;
        quantity: number;
        unitPrice: number;
        unitCost: number;
      }>;
      taxRate: number;
      discountRate: number;
      notes: string | null;
      paymentTerms: string;
      dueDate: string | null;
      companyId?: string | null;
    }
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Calculate totals
      const subtotal = input.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const discountAmount = subtotal * (input.discountRate / 100);
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = afterDiscount * (input.taxRate / 100);
      const total = afterDiscount + taxAmount;

      const updateData: Record<string, unknown> = {
          vendor_id: input.vendorId,
          invoice_number: input.invoiceNumber,
          subtotal,
          tax_rate: input.taxRate,
          tax_amount: taxAmount,
          discount_rate: input.discountRate,
          discount_amount: discountAmount,
          total,
          notes: input.notes,
          payment_terms: input.paymentTerms,
          due_date: input.dueDate,
      };
      if (input.companyId !== undefined) {
        updateData.company_id = input.companyId;
      }

      const { error: saleError } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', saleId);

      if (saleError) throw saleError;

      // Delete existing sale items (and their PO allocations via cascade)
      await supabase.from('sale_items').delete().eq('sale_id', saleId);

      // Create new sale items
      for (const item of input.items) {
        const { error: itemError } = await supabase
          .from('sale_items')
          .insert({
            sale_id: saleId,
            inventory_item_id: item.inventoryItemId,
            item_name: item.itemName,
            sku: item.sku || 'CUSTOM',
            quantity: item.quantity,
            unit_price: item.unitPrice,
            unit_cost: item.unitCost,
            total_price: item.quantity * item.unitPrice,
          });

        if (itemError) throw itemError;
      }

      toast({
        title: 'Invoice updated',
        description: `Invoice ${input.invoiceNumber} updated successfully`,
      });

      await fetchSales();
      return true;
    } catch (error: unknown) {
      console.error('Error updating sale:', error);
      toast({
        title: 'Error updating invoice',
        description: 'Unable to update invoice. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const togglePickedUp = async (saleId: string) => {
    try {
      const sale = sales.find((s) => s.id === saleId);
      if (!sale) throw new Error('Sale not found');

      const isCurrentlyPickedUp = !!sale.pickedUpAt;

      if (isCurrentlyPickedUp) {
        // Un-picking: restore inventory and clear allocations
        const { data: saleItems } = await supabase
          .from('sale_items')
          .select('id, inventory_item_id, quantity')
          .eq('sale_id', saleId);

        if (saleItems) {
          for (const saleItem of saleItems) {
            // Delete PO allocations
            await supabase
              .from('po_item_allocations')
              .delete()
              .eq('sale_item_id', saleItem.id);

            // Restore inventory
            if (saleItem.inventory_item_id) {
              const { data: currentItem } = await supabase
                .from('inventory_items')
                .select('quantity')
                .eq('id', saleItem.inventory_item_id)
                .single();

              if (currentItem) {
                await supabase
                  .from('inventory_items')
                  .update({ quantity: currentItem.quantity + saleItem.quantity })
                  .eq('id', saleItem.inventory_item_id);
              }
            }
          }
        }

        // Clear picked_up_at
        const { error } = await supabase
          .from('sales')
          .update({ picked_up_at: null })
          .eq('id', saleId);

        if (error) throw error;

        toast({
          title: 'Pickup reversed',
          description: 'Items restored to inventory',
        });

        setSales((prev) =>
          prev.map((s) =>
            s.id === saleId ? { ...s, pickedUpAt: null } : s
          )
        );
      } else {
        // Marking as picked up: reduce inventory and allocate from POs
        const { data: saleItems } = await supabase
          .from('sale_items')
          .select('id, sku, quantity, inventory_item_id')
          .eq('sale_id', saleId);

        if (saleItems) {
          for (const saleItem of saleItems) {
            // Get available PO items for FIFO allocation
            const availablePOs = await getAvailablePOItems(saleItem.sku);
            let remainingQty = saleItem.quantity;

            // Allocate from POs in FIFO order
            for (const po of availablePOs) {
              if (remainingQty <= 0) break;

              const qtyFromThisPO = Math.min(remainingQty, po.availableQty);
              await supabase.from('po_item_allocations').insert({
                sale_item_id: saleItem.id,
                purchase_order_id: po.poId,
                sku: saleItem.sku,
                quantity_allocated: qtyFromThisPO,
                unit_cost: po.unitCost,
              });
              remainingQty -= qtyFromThisPO;
            }

            // Update inventory quantity
            if (saleItem.inventory_item_id) {
              const { data: currentItem } = await supabase
                .from('inventory_items')
                .select('quantity')
                .eq('id', saleItem.inventory_item_id)
                .single();

              if (currentItem) {
                await supabase
                  .from('inventory_items')
                  .update({ quantity: Math.max(0, currentItem.quantity - saleItem.quantity) })
                  .eq('id', saleItem.inventory_item_id);
              }
            }
          }
        }

        const pickedUpAt = new Date().toISOString();
        const { error } = await supabase
          .from('sales')
          .update({ picked_up_at: pickedUpAt })
          .eq('id', saleId);

        if (error) throw error;

        toast({
          title: 'Marked as picked up',
          description: 'Inventory reduced and allocations recorded',
        });

        setSales((prev) =>
          prev.map((s) =>
            s.id === saleId ? { ...s, pickedUpAt } : s
          )
        );
      }
    } catch (error: unknown) {
      console.error('Error toggling picked up:', error);
      toast({
        title: 'Error updating pickup status',
        description: 'Unable to update. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const updateStatus = async (saleId: string, status: SaleStatus, addProfitToBank?: (saleId: string, profit: number, invoiceNumber: string) => Promise<boolean>) => {
    try {
      const sale = sales.find((s) => s.id === saleId);
      if (!sale) throw new Error('Sale not found');

      // Don't allow setting status to picked_up - use togglePickedUp instead
      if (status === 'picked_up') {
        await togglePickedUp(saleId);
        return;
      }

      const { error } = await supabase
        .from('sales')
        .update({ status })
        .eq('id', saleId);

      if (error) throw error;

      // If marking as paid and we have the bank function, add total (including GST) to bank
      if (status === 'paid' && addProfitToBank) {
        if (sale && sale.total > 0) {
          await addProfitToBank(saleId, sale.total, sale.invoiceNumber);
        }
      }

      toast({
        title: 'Status updated',
        description: `Invoice status changed to ${status}`,
      });

      // Update local state
      setSales((prev) =>
        prev.map((s) =>
          s.id === saleId ? { ...s, status } : s
        )
      );
    } catch (error: unknown) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error updating status',
        description: 'Unable to update status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return {
    sales,
    loading,
    createSale,
    updateSale,
    updateStatus,
    togglePickedUp,
    deleteSale,
    revertSale,
    refetch: fetchSales,
  };
}
