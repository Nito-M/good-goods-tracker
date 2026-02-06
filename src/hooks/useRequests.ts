import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Request, RequestStatus, CreateRequestInput } from "@/types/request";

export function useRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: Request[] = (data || []).map((r) => ({
        id: r.id,
        userId: r.user_id,
        inventoryItemId: r.inventory_item_id,
        itemName: r.item_name,
        sku: r.sku,
        quantity: r.quantity,
        quantityUnit: r.quantity_unit,
        link: r.link,
        notes: r.notes,
        imageUrl: r.image_url,
        needByDate: r.need_by_date,
        status: r.status as RequestStatus,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      setRequests(mapped);
    } catch (error: any) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const addRequest = async (input: CreateRequestInput): Promise<Request | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("requests")
        .insert({
          user_id: user.id,
          inventory_item_id: input.inventoryItemId,
          item_name: input.itemName,
          sku: input.sku || null,
          quantity: input.quantity,
          quantity_unit: input.quantityUnit,
          link: input.link || null,
          notes: input.notes || null,
          image_url: input.imageUrl || null,
          need_by_date: input.needByDate || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      const newRequest: Request = {
        id: data.id,
        userId: data.user_id,
        inventoryItemId: data.inventory_item_id,
        itemName: data.item_name,
        sku: data.sku,
        quantity: data.quantity,
        quantityUnit: data.quantity_unit,
        link: data.link,
        notes: data.notes,
        imageUrl: data.image_url,
        needByDate: data.need_by_date,
        status: data.status as RequestStatus,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setRequests((prev) => [newRequest, ...prev]);
      toast({
        title: "Success",
        description: "Request created successfully",
      });

      return newRequest;
    } catch (error: any) {
      console.error("Error creating request:", error);
      toast({
        title: "Error",
        description: "Failed to create request",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateRequest = async (id: string, updates: Partial<CreateRequestInput>): Promise<boolean> => {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.inventoryItemId !== undefined) dbUpdates.inventory_item_id = updates.inventoryItemId;
      if (updates.itemName !== undefined) dbUpdates.item_name = updates.itemName;
      if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.quantityUnit !== undefined) dbUpdates.quantity_unit = updates.quantityUnit;
      if (updates.link !== undefined) dbUpdates.link = updates.link;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
      if (updates.needByDate !== undefined) dbUpdates.need_by_date = updates.needByDate;

      const { error } = await supabase
        .from("requests")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                ...updates,
                updatedAt: new Date().toISOString(),
              }
            : r
        )
      );

      toast({
        title: "Success",
        description: "Request updated successfully",
      });

      return true;
    } catch (error: any) {
      console.error("Error updating request:", error);
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateStatus = async (id: string, status: RequestStatus): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("requests")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
        )
      );

      toast({
        title: "Success",
        description: `Request marked as ${status}`,
      });

      return true;
    } catch (error: any) {
      console.error("Error updating request status:", error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteRequest = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("requests").delete().eq("id", id);

      if (error) throw error;

      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast({
        title: "Success",
        description: "Request deleted successfully",
      });

      return true;
    } catch (error: any) {
      console.error("Error deleting request:", error);
      toast({
        title: "Error",
        description: "Failed to delete request",
        variant: "destructive",
      });
      return false;
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("request-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("request-images")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    requests,
    loading,
    addRequest,
    updateRequest,
    updateStatus,
    deleteRequest,
    uploadImage,
    refetch: fetchRequests,
  };
}
