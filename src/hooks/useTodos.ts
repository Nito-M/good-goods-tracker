import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Todo {
  id: string;
  userId: string;
  title: string;
  isDone: boolean;
  dueDate: string | null;
  notes: string | null;
  requestId: string | null;
  purchaseOrderId: string | null;
  displayOrder: number;
  kgAmount: number;
  createdAt: string;
  updatedAt: string;
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTodos = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from("todos")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;

      setTodos(
        (data || []).map((t: any) => ({
          id: t.id,
          userId: t.user_id,
          title: t.title,
          isDone: t.is_done,
          dueDate: t.due_date,
          notes: t.notes,
          requestId: t.request_id,
          purchaseOrderId: t.purchase_order_id,
          displayOrder: t.display_order,
          kgAmount: t.kg_amount || 0,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        }))
      );
    } catch (error: any) {
      console.error("Error fetching todos:", error);
      toast({ title: "Error", description: "Failed to fetch to-dos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = async (title: string, dueDate?: string | null, notes?: string | null, requestId?: string | null, purchaseOrderId?: string | null): Promise<Todo | null> => {
    if (!user) return null;
    try {
      const maxOrder = todos.length > 0 ? Math.max(...todos.map((t) => t.displayOrder)) + 1 : 0;
      const { data, error } = await (supabase as any)
        .from("todos")
        .insert({
          user_id: user.id,
          title,
          due_date: dueDate || null,
          notes: notes || null,
          request_id: requestId || null,
          purchase_order_id: purchaseOrderId || null,
          display_order: maxOrder,
        })
        .select()
        .single();

      if (error) throw error;

      const newTodo: Todo = {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        isDone: data.is_done,
        dueDate: data.due_date,
        notes: data.notes,
        requestId: data.request_id,
        purchaseOrderId: data.purchase_order_id,
        displayOrder: data.display_order,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      setTodos((prev) => [...prev, newTodo]);
      return newTodo;
    } catch (error: any) {
      console.error("Error adding todo:", error);
      toast({ title: "Error", description: "Failed to add to-do", variant: "destructive" });
      return null;
    }
  };

  const updateTodo = async (id: string, updates: Partial<{ title: string; isDone: boolean; dueDate: string | null; notes: string | null; displayOrder: number; requestId: string | null; purchaseOrderId: string | null }>): Promise<boolean> => {
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.isDone !== undefined) dbUpdates.is_done = updates.isDone;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.displayOrder !== undefined) dbUpdates.display_order = updates.displayOrder;
      if (updates.requestId !== undefined) dbUpdates.request_id = updates.requestId;
      if (updates.purchaseOrderId !== undefined) dbUpdates.purchase_order_id = updates.purchaseOrderId;

      const { error } = await (supabase as any).from("todos").update(dbUpdates).eq("id", id);
      if (error) throw error;

      setTodos((prev) =>
        prev
          .map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
          .sort((a, b) => a.displayOrder - b.displayOrder)
      );
      return true;
    } catch (error: any) {
      console.error("Error updating todo:", error);
      toast({ title: "Error", description: "Failed to update to-do", variant: "destructive" });
      return false;
    }
  };

  const deleteTodo = async (id: string): Promise<boolean> => {
    try {
      const { error } = await (supabase as any).from("todos").delete().eq("id", id);
      if (error) throw error;
      setTodos((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (error: any) {
      console.error("Error deleting todo:", error);
      toast({ title: "Error", description: "Failed to delete to-do", variant: "destructive" });
      return false;
    }
  };

  const reorderTodos = async (reordered: Todo[]) => {
    setTodos(reordered);
    try {
      for (let i = 0; i < reordered.length; i++) {
        if (reordered[i].displayOrder !== i) {
          await (supabase as any).from("todos").update({ display_order: i }).eq("id", reordered[i].id);
        }
      }
      setTodos((prev) => prev.map((t, i) => ({ ...t, displayOrder: i })));
    } catch (error: any) {
      console.error("Error reordering todos:", error);
      fetchTodos();
    }
  };

  return { todos, loading, addTodo, updateTodo, deleteTodo, reorderTodos, refetch: fetchTodos };
}
