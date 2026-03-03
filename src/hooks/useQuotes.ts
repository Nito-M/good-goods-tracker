import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Quote, QuoteItem, CreateQuoteInput, QuoteStatus } from '@/types/quote';

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchQuotes = async () => {
    if (!user) return;

    try {
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          *,
          vendors (name, address)
        `)
        .order('created_at', { ascending: false });

      if (quotesError) throw quotesError;

      const quotesWithItems: Quote[] = await Promise.all(
        (quotesData || []).map(async (quote) => {
          const { data: items } = await supabase
            .from('quote_items')
            .select('*')
            .eq('quote_id', quote.id);

          const mappedItems: QuoteItem[] = (items || []).map((item) => ({
            id: item.id,
            quoteId: item.quote_id,
            inventoryItemId: item.inventory_item_id,
            itemName: item.item_name,
            sku: item.sku,
            quantity: item.quantity,
            quantityUnit: (item as any).quantity_unit || 'pcs',
            unitPrice: Number(item.unit_price),
            unitCost: Number(item.unit_cost),
            totalPrice: Number(item.total_price),
            notes: (item as any).notes || null,
            createdAt: item.created_at,
          }));

          return {
            id: quote.id,
            userId: quote.user_id,
            vendorId: quote.vendor_id,
            vendorName: quote.vendors?.name,
            vendorAddress: quote.vendors?.address,
            quoteNumber: quote.quote_number,
            status: quote.status as Quote['status'],
            subtotal: Number(quote.subtotal),
            taxRate: Number(quote.tax_rate),
            taxAmount: Number(quote.tax_amount),
            discountRate: Number(quote.discount_rate),
            discountAmount: Number(quote.discount_amount),
            total: Number(quote.total),
            notes: quote.notes,
            paymentTerms: quote.payment_terms,
            validUntil: quote.valid_until,
            attachmentUrl: (quote as any).attachment_url || null,
            convertedToInvoiceId: (quote as any).converted_to_invoice_id || null,
            convertedToPoId: (quote as any).converted_to_po_id || null,
            convertedToJobId: (quote as any).converted_to_job_id || null,
            companyId: (quote as any).company_id || null,
            items: mappedItems,
            hidePrices: (quote as any).hide_prices || false,
            createdAt: quote.created_at,
            updatedAt: quote.updated_at,
          };
        })
      );

      setQuotes(quotesWithItems);
    } catch (error: unknown) {
      console.error('Error fetching quotes:', error);
      toast({
        title: 'Error fetching quotes',
        description: 'Unable to load quotes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [user]);

  const createQuote = async (input: CreateQuoteInput): Promise<Quote | null> => {
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

      // Create quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          user_id: user.id,
          vendor_id: input.vendorId,
          quote_number: input.quoteNumber || null,
          status: 'draft',
          subtotal,
          tax_rate: input.taxRate,
          tax_amount: taxAmount,
          discount_rate: input.discountRate,
          discount_amount: discountAmount,
          total,
          notes: input.notes,
          payment_terms: input.paymentTerms,
          valid_until: input.validUntil,
          company_id: input.companyId || null,
          hide_prices: input.hidePrices || false,
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Create quote items
      for (const item of input.items) {
        const { error: itemError } = await supabase
          .from('quote_items')
          .insert({
            quote_id: quote.id,
            inventory_item_id: item.inventoryItemId,
            item_name: item.itemName,
            sku: item.sku,
            quantity: item.quantity,
            quantity_unit: item.quantityUnit,
            unit_price: item.unitPrice,
            unit_cost: item.unitCost,
            total_price: item.quantity * item.unitPrice,
            notes: item.notes,
          } as any);

        if (itemError) throw itemError;
      }

      toast({
        title: 'Quote created',
        description: `Quote ${quote.quote_number} created successfully`,
      });

      await fetchQuotes();
      return quotes.find((q) => q.id === quote.id) || null;
    } catch (error: unknown) {
      console.error('Error creating quote:', error);
      toast({
        title: 'Error creating quote',
        description: 'Unable to create quote. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateQuoteStatus = async (id: string, status: Quote['status']) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Quote updated',
        description: `Quote status changed to ${status}`,
      });

      setQuotes((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status } : q))
      );
    } catch (error: unknown) {
      console.error('Error updating quote:', error);
      toast({
        title: 'Error updating quote',
        description: 'Unable to update quote. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const deleteQuote = async (id: string) => {
    try {
      const { error } = await supabase.from('quotes').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Quote deleted',
        description: 'The quote has been removed',
      });

      setQuotes((prev) => prev.filter((q) => q.id !== id));
    } catch (error: unknown) {
      console.error('Error deleting quote:', error);
      toast({
        title: 'Error deleting quote',
        description: 'Unable to delete quote. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const uploadAttachment = async (quoteId: string, file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${quoteId}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('quote-attachments')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('quote-attachments')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signedUrlError || !signedUrlData) {
        throw signedUrlError || new Error('Failed to create signed URL');
      }

      const signedUrl = signedUrlData.signedUrl;

      // Update quote with attachment URL (store the file path, not the signed URL)
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ attachment_url: signedUrl })
        .eq('id', quoteId);

      if (updateError) throw updateError;

      // Update local state
      setQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, attachmentUrl: signedUrl } : q))
      );

      toast({
        title: 'Attachment uploaded',
        description: 'File has been attached to the quote',
      });

      return signedUrl;
    } catch (error: unknown) {
      console.error('Error uploading attachment:', error);
      toast({
        title: 'Error uploading attachment',
        description: 'Unable to upload file. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const removeAttachment = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ attachment_url: null })
        .eq('id', quoteId);

      if (error) throw error;

      setQuotes((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, attachmentUrl: null } : q))
      );

      toast({
        title: 'Attachment removed',
        description: 'The attachment has been removed from the quote',
      });
    } catch (error: unknown) {
      console.error('Error removing attachment:', error);
      toast({
        title: 'Error removing attachment',
        description: 'Unable to remove attachment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const updateQuote = async (
    quoteId: string,
    input: {
      vendorId: string | null;
      quoteNumber: string;
      items: Array<{
        id: string;
        inventoryItemId: string | null;
        itemName: string;
        sku: string;
        quantity: number | null;
        quantityUnit: string;
        unitPrice: number;
        unitCost: number;
        notes: string;
      }>;
      taxRate: number;
      discountRate: number;
      notes: string | null;
      paymentTerms: string;
      validUntil: string | null;
      companyId?: string | null;
      hidePrices?: boolean;
    }
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Calculate totals
      const subtotal = input.items.reduce(
        (sum, item) => sum + (item.quantity || 0) * item.unitPrice,
        0
      );
      const discountAmount = subtotal * (input.discountRate / 100);
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = afterDiscount * (input.taxRate / 100);
      const total = afterDiscount + taxAmount;

      // Update quote
      const { error: quoteError } = await supabase
        .from('quotes')
        .update({
          vendor_id: input.vendorId,
          quote_number: input.quoteNumber,
          subtotal,
          tax_rate: input.taxRate,
          tax_amount: taxAmount,
          discount_rate: input.discountRate,
          discount_amount: discountAmount,
          total,
          notes: input.notes,
          payment_terms: input.paymentTerms,
          valid_until: input.validUntil,
          company_id: input.companyId || null,
          hide_prices: input.hidePrices || false,
        } as any)
        .eq('id', quoteId);

      if (quoteError) throw quoteError;

      // Delete existing quote items
      await supabase.from('quote_items').delete().eq('quote_id', quoteId);

      // Create new quote items
      for (const item of input.items) {
        const { error: itemError } = await supabase
          .from('quote_items')
          .insert({
            quote_id: quoteId,
            inventory_item_id: item.inventoryItemId,
            item_name: item.itemName,
            sku: item.sku || 'CUSTOM',
            quantity: item.quantity ?? 0,
            quantity_unit: item.quantityUnit,
            unit_price: item.unitPrice,
            unit_cost: item.unitCost,
            total_price: (item.quantity || 0) * item.unitPrice,
            notes: item.notes || null,
          } as any);

        if (itemError) throw itemError;
      }

      toast({
        title: 'Quote updated',
        description: `Quote ${input.quoteNumber} updated successfully`,
      });

      await fetchQuotes();
      return true;
    } catch (error: unknown) {
      console.error('Error updating quote:', error);
      toast({
        title: 'Error updating quote',
        description: 'Unable to update quote. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const convertToInvoice = async (quote: Quote): Promise<string | null> => {
    if (!user) return null;

    try {
      // Calculate totals for the invoice
      const subtotal = quote.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      const discountAmount = subtotal * (quote.discountRate / 100);
      const afterDiscount = subtotal - discountAmount;
      const taxAmount = afterDiscount * (quote.taxRate / 100);
      const total = afterDiscount + taxAmount;

      // Create the sale/invoice
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          user_id: user.id,
          vendor_id: quote.vendorId,
          invoice_number: null, // Auto-generate
          status: 'pending',
          subtotal,
          tax_rate: quote.taxRate,
          tax_amount: taxAmount,
          discount_rate: quote.discountRate,
          discount_amount: discountAmount,
          total,
          notes: quote.notes,
          payment_terms: quote.paymentTerms,
          due_date: null,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items from quote items
      for (const item of quote.items) {
        const { error: itemError } = await supabase
          .from('sale_items')
          .insert({
            sale_id: sale.id,
            inventory_item_id: item.inventoryItemId,
            item_name: item.itemName,
            sku: item.sku || 'CUSTOM',
            quantity: item.quantity,
            unit_price: item.unitPrice,
            unit_cost: item.unitCost,
            total_price: item.quantity * item.unitPrice,
          });

        if (itemError) throw itemError;

        // Update inventory quantity if linked to inventory item
        if (item.inventoryItemId) {
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
      }

      // Update quote status to converted and link to invoice
      await supabase
        .from('quotes')
        .update({ status: 'converted', converted_to_invoice_id: sale.id })
        .eq('id', quote.id);

      // Update local state
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === quote.id ? { ...q, status: 'converted' as QuoteStatus, convertedToInvoiceId: sale.id } : q
        )
      );

      toast({
        title: 'Quote converted',
        description: `Invoice ${sale.invoice_number} created from ${quote.quoteNumber}`,
      });

      return sale.id;
    } catch (error: unknown) {
      console.error('Error converting quote to invoice:', error);
      toast({
        title: 'Error converting quote',
        description: 'Unable to convert quote to invoice. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const convertToPurchaseOrder = async (quote: Quote): Promise<string | null> => {
    if (!user) return null;

    try {
      // Build items array for purchase order
      const poItems = quote.items.map((item) => ({
        sku: item.sku || 'CUSTOM',
        itemName: item.itemName,
        quantity: item.quantity,
        unitCost: item.unitCost,
      }));

      const firstItem = poItems[0];
      const totalQuantity = poItems.reduce((sum, item) => sum + item.quantity, 0);

      // Create the purchase order
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          user_id: user.id,
          vendor_id: quote.vendorId,
          po_number: null, // Auto-generate
          sku: firstItem.sku,
          item_name: firstItem.itemName,
          quantity: totalQuantity,
          items: JSON.parse(JSON.stringify(poItems)),
          ordered_at: new Date().toISOString(),
          notes: quote.notes,
          status: 'ordered',
        })
        .select()
        .single();

      if (poError) throw poError;

      // Update quote status to converted and link to PO
      await supabase
        .from('quotes')
        .update({ status: 'converted', converted_to_po_id: po.id })
        .eq('id', quote.id);

      // Update local state
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === quote.id ? { ...q, status: 'converted' as QuoteStatus, convertedToPoId: po.id } : q
        )
      );

      toast({
        title: 'Quote converted',
        description: `Purchase Order ${po.po_number} created from ${quote.quoteNumber}`,
      });

      return po.id;
    } catch (error: unknown) {
      console.error('Error converting quote to purchase order:', error);
      toast({
        title: 'Error converting quote',
        description: 'Unable to convert quote to purchase order. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    quotes,
    loading,
    createQuote,
    updateQuote,
    updateQuoteStatus,
    deleteQuote,
    uploadAttachment,
    removeAttachment,
    convertToInvoice,
    convertToPurchaseOrder,
    refetch: fetchQuotes,
  };
}
