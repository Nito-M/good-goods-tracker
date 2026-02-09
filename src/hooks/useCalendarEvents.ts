import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CalendarEvent, CreateCalendarEventInput } from "@/types/calendarEvent";

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;

      setEvents(
        (data || []).map((e) => ({
          id: e.id,
          userId: e.user_id,
          title: e.title,
          description: e.description || undefined,
          eventDate: e.event_date,
          recurrence: e.recurrence as CalendarEvent["recurrence"],
          color: e.color,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        }))
      );
    } catch {
      toast({ title: "Error loading events", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (input: CreateCalendarEventInput) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("calendar_events").insert({
        user_id: user.id,
        title: input.title,
        description: input.description || null,
        event_date: input.eventDate,
        recurrence: input.recurrence,
        color: input.color,
      });
      if (error) throw error;
      toast({ title: "Event created" });
      fetchEvents();
    } catch {
      toast({ title: "Error creating event", variant: "destructive" });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase.from("calendar_events").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Event deleted" });
      fetchEvents();
    } catch {
      toast({ title: "Error deleting event", variant: "destructive" });
    }
  };

  return { events, loading, createEvent, deleteEvent, refetch: fetchEvents };
}
