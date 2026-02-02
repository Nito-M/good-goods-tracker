import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Sale, SaleItem, CreateSaleInput } from '@/types/sale';

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
          vendors (name)
        `)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      const salesWithItems: Sale[] = await Promise.all(
        (salesData || []).map(async (sale) => {
          const { data: items } = await supabase
            .from('sale_items')
            .select('*')
            .eq('sale_id', sale.id);

          return {
            id: sale.id,
            userId: sale.user_id,
            vendorId: sale.vendor_id,
            vendorName: sale.vendors?.name,
            invoiceNumber: sale.invoice_number,
            status: sale.status as Sale['status'],
            subtotal: Number(sale.subtotal),
            taxRate: Number(sale.tax_rate),
            taxAmount: Number(sale.tax_amount),
            discountRate: Number(sale.discount_rate),
            discountAmount: Number(sale.discount_amount),
            total: Number(sale.total),
            notes: sale.notes,
            paymentTerms: sale.payment_terms,
            dueDate: sale.due_date,
            items: (items || []).map((item) => ({
              id: item.id,
              saleId: item.sale_id,
              inventoryItemId: item.inventory_item_id,
              itemName: item.item_name,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: Number(item.unit_price),
              totalPrice: Number(item.total_price),
              createdAt: item.created_at,
            })),
            createdAt: sale.created_at,
            updatedAt: sale.updated_at,
          };
        })
      );

      setSales(salesWithItems);
    } catch (error: any) {
      toast({
        title: 'Error fetching sales',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [user]);

  const createSale = async (input: CreateSaleInput): Promise<Sale | null> => {
    if (!user) return null;

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

      // Generate invoice number using timestamp
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: user.id,
          vendor_id: input.vendorId,
          invoice_number: invoiceNumber,
          status: 'completed',
          subtotal,
          tax_rate: input.taxRate,
          tax_amount: taxAmount,
          discount_rate: input.discountRate,
          discount_amount: discountAmount,
          total,
          notes: input.notes,
          payment_terms: input.paymentTerms,
          due_date: input.dueDate,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = input.items.map((item) => ({
        sale_id: sale.id,
        inventory_item_id: item.inventoryItemId,
        item_name: item.itemName,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.quantity * item.unitPrice,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update inventory quantities
      for (const item of input.items) {
        const { data: currentItem } = await supabase
          .from('inventory_items')
          .select('quantity')
          .eq('id', item.inventoryItemId)
          .single();

        if (currentItem) {
          await supabase
            .from('inventory_items')
            .update({ quantity: Math.max(0, currentItem.quantity - item.quantity) })
            .eq('id', item.inventoryItemId);
        }
      }

      toast({
        title: 'Sale completed',
        description: `Invoice ${invoiceNumber} created successfully`,
      });

      await fetchSales();
      return sales.find((s) => s.id === sale.id) || null;
    } catch (error: any) {
      toast({
        title: 'Error creating sale',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteSale = async (id: string) => {
    try {
      const { error } = await supabase.from('sales').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sale deleted',
        description: 'The sale has been removed',
      });

      setSales((prev) => prev.filter((s) => s.id !== id));
    } catch (error: any) {
      toast({
        title: 'Error deleting sale',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    sales,
    loading,
    createSale,
    deleteSale,
    refetch: fetchSales,
  };
}
