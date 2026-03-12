import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { RequestSubItem } from "@/types/request";

export function useRequestSubItems(requestIds: string[]) {
  const [subItems, setSubItems] = useState<RequestSubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSubItems = useCallback(async () => {
    if (!user || requestIds.length === 0) {
      setSubItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("request_sub_items")
        .select("*")
        .in("request_id", requestIds)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const mapped: RequestSubItem[] = (data || []).map((r: any) => ({
        id: r.id,
        requestId: r.request_id,
        userId: r.user_id,
        vendorName: r.vendor_name,
        unitPrice: r.unit_price || 0,
        quantity: r.quantity || 1,
        link: r.link,
        notes: r.notes,
        sku: r.sku || null,
        imageUrl: r.image_url || null,
        isSelected: r.is_selected || false,
        createdAt: r.created_at,
      }));

      setSubItems(mapped);
    } catch (error: any) {
      console.error("Error fetching sub items:", error);
    } finally {
      setLoading(false);
    }
  }, [user, requestIds.join(",")]);

  useEffect(() => {
    fetchSubItems();
  }, [fetchSubItems]);

  const addSubItem = async (requestId: string, input: { vendorName: string; unitPrice: number; quantity?: number; link?: string | null; notes?: string | null }): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from("request_sub_items")
        .insert({
          request_id: requestId,
          user_id: user.id,
          vendor_name: input.vendorName,
          unit_price: input.unitPrice || 0,
          quantity: input.quantity || 1,
          link: input.link || null,
          notes: input.notes || null,
        } as any);

      if (error) throw error;
      await fetchSubItems();
      toast({ title: "Success", description: "Vendor option added" });
      return true;
    } catch (error: any) {
      console.error("Error adding sub item:", error);
      toast({ title: "Error", description: "Failed to add vendor option", variant: "destructive" });
      return false;
    }
  };

  const deleteSubItem = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("request_sub_items").delete().eq("id", id);
      if (error) throw error;
      setSubItems((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch (error: any) {
      console.error("Error deleting sub item:", error);
      return false;
    }
  };

  const updateSubItem = async (id: string, updates: { vendorName?: string; unitPrice?: number; quantity?: number; link?: string | null; notes?: string | null }): Promise<boolean> => {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.vendorName !== undefined) dbUpdates.vendor_name = updates.vendorName;
      if (updates.unitPrice !== undefined) dbUpdates.unit_price = updates.unitPrice;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.link !== undefined) dbUpdates.link = updates.link;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { error } = await supabase.from("request_sub_items").update(dbUpdates).eq("id", id);
      if (error) throw error;
      await fetchSubItems();
      return true;
    } catch (error: any) {
      console.error("Error updating sub item:", error);
      return false;
    }
  };

  const toggleSelected = async (id: string, requestId: string): Promise<boolean> => {
    try {
      // Deselect all others for same request
      await supabase
        .from("request_sub_items")
        .update({ is_selected: false } as any)
        .eq("request_id", requestId);

      // Select the chosen one
      const { error } = await supabase
        .from("request_sub_items")
        .update({ is_selected: true } as any)
        .eq("id", id);

      if (error) throw error;
      await fetchSubItems();
      return true;
    } catch (error: any) {
      console.error("Error toggling selection:", error);
      return false;
    }
  };

  return { subItems, loading, addSubItem, updateSubItem, deleteSubItem, toggleSelected, refetch: fetchSubItems };
}
