import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface TripPlanLocation {
  id: string;
  tripPlanId: string;
  name: string;
  address: string | null;
  notes: string | null;
  displayOrder: number;
}

export interface TripPlanPo {
  id: string;
  tripPlanId: string;
  purchaseOrderId: string;
  locationIndex: number | null;
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
  locations: { name: string; address?: string; notes?: string }[];
  poIds: string[];
  locationPoMap?: Record<number, string[]>; // locationIndex -> poIds
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
              locationIndex: po.location_index ?? null,
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

  const buildPoInserts = (planId: string, input: CreateTripPlanInput) => {
    const rows: { trip_plan_id: string; purchase_order_id: string; location_index: number | null }[] = [];
    // Trip-level POs (no location)
    for (const poId of input.poIds) {
      rows.push({ trip_plan_id: planId, purchase_order_id: poId, location_index: null });
    }
    // Location-level POs
    if (input.locationPoMap) {
      for (const [locIdx, poIds] of Object.entries(input.locationPoMap)) {
        for (const poId of poIds) {
          rows.push({ trip_plan_id: planId, purchase_order_id: poId, location_index: parseInt(locIdx) });
        }
      }
    }
    return rows;
  };

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

      const poRows = buildPoInserts(plan.id, input);
      if (poRows.length > 0) {
        const { error: poErr } = await supabase.from("trip_plan_pos").insert(poRows);
        if (poErr) throw poErr;
      }

      toast({ title: "Trip plan created" });
      fetchTripPlans();
    } catch {
      toast({ title: "Error creating trip plan", variant: "destructive" });
    }
  };

  const updateTripPlan = async (id: string, input: CreateTripPlanInput) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("trip_plans")
        .update({
          title: input.title,
          start_date: input.startDate,
          end_date: input.endDate || null,
          notes: input.notes || null,
          color: input.color,
        })
        .eq("id", id);
      if (error) throw error;

      await supabase.from("trip_plan_locations").delete().eq("trip_plan_id", id);
      if (input.locations.length > 0) {
        const { error: locErr } = await supabase.from("trip_plan_locations").insert(
          input.locations.map((loc, i) => ({
            trip_plan_id: id,
            name: loc.name,
            address: loc.address || null,
            display_order: i,
          }))
        );
        if (locErr) throw locErr;
      }

      await supabase.from("trip_plan_pos").delete().eq("trip_plan_id", id);
      const poRows = buildPoInserts(id, input);
      if (poRows.length > 0) {
        const { error: poErr } = await supabase.from("trip_plan_pos").insert(poRows);
        if (poErr) throw poErr;
      }

      toast({ title: "Trip plan updated" });
      fetchTripPlans();
    } catch {
      toast({ title: "Error updating trip plan", variant: "destructive" });
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

  return { tripPlans, loading, createTripPlan, updateTripPlan, deleteTripPlan, refetch: fetchTripPlans };
}
