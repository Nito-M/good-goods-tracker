import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface TripPlanLocation {
  id: string;
  tripPlanId: string;
  name: string;
  address: string | null;
  displayOrder: number;
}

export interface TripPlanPo {
  id: string;
  tripPlanId: string;
  purchaseOrderId: string;
  poNumber?: string | null;
  vendorName?: string | null;
}

export interface TripPlan {
  id: string;
  userId: string;
  title: string;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  color: string;
  locations: TripPlanLocation[];
  pos: TripPlanPo[];
  createdAt: string;
}

export interface CreateTripPlanInput {
  title: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  color: string;
  locations: { name: string; address?: string }[];
  poIds: string[];
}

export function useTripPlans() {
  const [tripPlans, setTripPlans] = useState<TripPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTripPlans = useCallback(async () => {
    if (!user) return;
    try {
      const { data: plans, error } = await supabase
        .from("trip_plans")
        .select("*")
        .order("start_date", { ascending: true });
      if (error) throw error;

      const planIds = (plans || []).map((p: any) => p.id);

      const [locsRes, posRes] = await Promise.all([
        planIds.length > 0
          ? supabase.from("trip_plan_locations").select("*").in("trip_plan_id", planIds).order("display_order")
          : { data: [], error: null },
        planIds.length > 0
          ? supabase.from("trip_plan_pos").select("*, purchase_orders(po_number, vendor_id, vendors:vendor_id(name))").in("trip_plan_id", planIds)
          : { data: [], error: null },
      ]);

      const locs = (locsRes.data || []) as any[];
      const posData = (posRes.data || []) as any[];

      setTripPlans(
        (plans || []).map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          title: p.title,
          startDate: p.start_date,
          endDate: p.end_date,
          notes: p.notes,
          color: p.color,
          locations: locs
            .filter((l) => l.trip_plan_id === p.id)
            .map((l) => ({
              id: l.id,
              tripPlanId: l.trip_plan_id,
              name: l.name,
              address: l.address,
              displayOrder: l.display_order,
            })),
          pos: posData
            .filter((po) => po.trip_plan_id === p.id)
            .map((po) => ({
              id: po.id,
              tripPlanId: po.trip_plan_id,
              purchaseOrderId: po.purchase_order_id,
              poNumber: po.purchase_orders?.po_number,
              vendorName: po.purchase_orders?.vendors?.name,
            })),
          createdAt: p.created_at,
        }))
      );
    } catch {
      toast({ title: "Error loading trip plans", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchTripPlans();
  }, [fetchTripPlans]);

  const createTripPlan = async (input: CreateTripPlanInput) => {
    if (!user) return;
    try {
      const { data: plan, error } = await supabase
        .from("trip_plans")
        .insert({
          user_id: user.id,
          title: input.title,
          start_date: input.startDate,
          end_date: input.endDate || null,
          notes: input.notes || null,
          color: input.color,
        })
        .select("id")
        .single();
      if (error) throw error;

      // Insert locations
      if (input.locations.length > 0) {
        const { error: locErr } = await supabase.from("trip_plan_locations").insert(
          input.locations.map((loc, i) => ({
            trip_plan_id: plan.id,
            name: loc.name,
            address: loc.address || null,
            display_order: i,
          }))
        );
        if (locErr) throw locErr;
      }

      // Insert PO links
      if (input.poIds.length > 0) {
        const { error: poErr } = await supabase.from("trip_plan_pos").insert(
          input.poIds.map((poId) => ({
            trip_plan_id: plan.id,
            purchase_order_id: poId,
          }))
        );
        if (poErr) throw poErr;
      }

      toast({ title: "Trip plan created" });
      fetchTripPlans();
    } catch {
      toast({ title: "Error creating trip plan", variant: "destructive" });
    }
  };

  const deleteTripPlan = async (id: string) => {
    try {
      const { error } = await supabase.from("trip_plans").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Trip plan deleted" });
      fetchTripPlans();
    } catch {
      toast({ title: "Error deleting trip plan", variant: "destructive" });
    }
  };

  return { tripPlans, loading, createTripPlan, deleteTripPlan, refetch: fetchTripPlans };
}
