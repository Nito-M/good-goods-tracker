import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface BankCard {
  id: string;
  userId: string;
  name: string;
  balance: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export function useBankCards() {
  const [cards, setCards] = useState<BankCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCards = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('bank_cards')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setCards(
        (data || []).map((c) => ({
          id: c.id,
          userId: c.user_id,
          name: c.name,
          balance: Number(c.balance),
          color: c.color,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }))
      );
    } catch (e) {
      console.error('Error fetching bank cards:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [user]);

  const addCard = async (name: string, balance: number, color: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('bank_cards').insert({
        user_id: user.id,
        name,
        balance,
        color,
      });
      if (error) throw error;
      toast({ title: 'Card added', description: `"${name}" card created.` });
      await fetchCards();
      return true;
    } catch (e) {
      console.error('Error adding card:', e);
      toast({ title: 'Error adding card', variant: 'destructive' });
      return false;
    }
  };

  const updateCard = async (id: string, updates: Partial<Pick<BankCard, 'name' | 'balance' | 'color'>>) => {
    try {
      const payload: Record<string, unknown> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.balance !== undefined) payload.balance = updates.balance;
      if (updates.color !== undefined) payload.color = updates.color;

      const { error } = await supabase.from('bank_cards').update(payload).eq('id', id);
      if (error) throw error;
      await fetchCards();
      return true;
    } catch (e) {
      console.error('Error updating card:', e);
      toast({ title: 'Error updating card', variant: 'destructive' });
      return false;
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const { error } = await supabase.from('bank_cards').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Card deleted' });
      setCards((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (e) {
      console.error('Error deleting card:', e);
      toast({ title: 'Error deleting card', variant: 'destructive' });
      return false;
    }
  };

  return { cards, loading, addCard, updateCard, deleteCard, refetch: fetchCards };
}
